/**
 * Project Task Sync
 *
 * Syncs on-chain tasks from Andamioscan with DB tasks.
 * Matches tasks by content and updates DB with on-chain task_id.
 */

import { env } from "~/env";
import { getProject, type AndamioscanTask, type AndamioscanProjectDetails } from "~/lib/andamioscan";
import { type ProjectTaskV2Output } from "@andamio/db-api-types";

/**
 * Decode hex string to UTF-8 text
 */
function hexToText(hex: string): string {
  try {
    const bytes = new Uint8Array(
      hex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) ?? []
    );
    return new TextDecoder().decode(bytes);
  } catch {
    return "";
  }
}

/**
 * Match result for a single task
 */
export interface TaskMatchResult {
  dbTask: ProjectTaskV2Output;
  onChainTask: AndamioscanTask;
  matchedBy: "content" | "lovelace_and_expiration";
}

/**
 * Sync result
 */
export interface SyncResult {
  matched: TaskMatchResult[];
  unmatchedDb: ProjectTaskV2Output[];
  unmatchedOnChain: AndamioscanTask[];
  confirmed: number;
  errors: string[];
}

/**
 * Fetch DB tasks for a project
 */
async function fetchDbTasks(
  projectStatePolicyId: string,
  authenticatedFetch: (url: string, init?: RequestInit) => Promise<Response>
): Promise<ProjectTaskV2Output[]> {
  const response = await authenticatedFetch(
    `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/project-v2/manager/tasks/${projectStatePolicyId}`
  );

  if (!response.ok) {
    if (response.status === 404) {
      return [];
    }
    throw new Error(`Failed to fetch DB tasks: ${response.status}`);
  }

  return (await response.json()) as ProjectTaskV2Output[];
}

/**
 * Batch update task statuses using the batch-status endpoint
 *
 * This endpoint allows direct status updates without tx_hash validation,
 * which is needed for syncing tasks that are already on-chain but not
 * reflected in the database.
 *
 * @returns Object with count of updated tasks and any errors
 */
async function batchUpdateTaskStatus(
  projectStatePolicyId: string,
  tasks: Array<{
    index: number;
    status: string;
    task_hash?: string;
  }>,
  authenticatedFetch: (url: string, init?: RequestInit) => Promise<Response>
): Promise<{ updated: number; errors: string[] }> {
  const requestBody = {
    project_state_policy_id: projectStatePolicyId,
    tasks: tasks.map((t) => ({
      index: t.index,
      status: t.status,
      task_hash: t.task_hash,
    })),
  };

  const response = await authenticatedFetch(
    `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/project-v2/manager/tasks/batch-status`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    // Try to get error details from response
    let errorDetail = `HTTP ${response.status}`;
    try {
      const errorBody = await response.json() as { message?: string; error?: string };
      console.error("[project-task-sync] batch-status error body:", errorBody);
      errorDetail = errorBody.message ?? errorBody.error ?? errorDetail;
    } catch {
      // Ignore JSON parse errors
    }
    console.error("[project-task-sync] batch-status failed:", errorDetail);
    return { updated: 0, errors: [errorDetail] };
  }

  // Parse response body to check actual success
  let responseBody: {
    success?: boolean;
    results?: Array<{
      index: number;
      success: boolean;
      error?: string;
    }>;
    updated?: number;
    errors?: string[];
    message?: string;
  } | null = null;

  try {
    responseBody = await response.json();
  } catch {
    // Empty response body
  }

  // Check if API returned success: false in the body (even with HTTP 200)
  if (responseBody?.success === false) {
    console.warn("[project-task-sync] Batch update failed");

    // Check individual results for errors
    const failedResults = responseBody?.results?.filter(r => !r.success) ?? [];
    const errorMessages = failedResults.map(r => `Task ${r.index}: ${r.error ?? "failed"}`);
    const successfulCount = responseBody.results?.filter(r => r.success).length ?? 0;

    console.warn("[project-task-sync] Errors:", errorMessages.join(" | "));

    return {
      updated: successfulCount,
      errors: errorMessages.length > 0 ? errorMessages : [responseBody.message ?? "Batch update failed"],
    };
  }

  // API may return 207 for partial success
  if (response.status === 207) {
    return {
      updated: responseBody?.updated ?? 0,
      errors: responseBody?.errors ?? ["Some tasks failed to update"],
    };
  }

  // If we got success: true or no success field with HTTP 200, count as fully successful
  const successfulCount = responseBody?.results?.filter(r => r.success).length ?? tasks.length;
  return { updated: successfulCount, errors: [] };
}

/**
 * Match on-chain tasks to DB tasks
 *
 * Matching strategy:
 * 1. Decode hex content from on-chain and compare to DB task title
 * 2. Also verify lovelace amount matches
 */
function matchTasks(
  dbTasks: ProjectTaskV2Output[],
  onChainTasks: AndamioscanTask[]
): {
  matched: TaskMatchResult[];
  unmatchedDb: ProjectTaskV2Output[];
  unmatchedOnChain: AndamioscanTask[];
} {
  const matched: TaskMatchResult[] = [];
  const unmatchedDb: ProjectTaskV2Output[] = [];
  const usedOnChainIds = new Set<string>();

  for (const dbTask of dbTasks) {
    // Skip tasks that are already confirmed (have a task_hash)
    if (dbTask.task_hash && dbTask.status === "ON_CHAIN") {
      continue;
    }

    let matchedOnChain: AndamioscanTask | null = null;
    let matchedBy: "content" | "lovelace_and_expiration" = "content";

    // Try to match by content
    for (const onChainTask of onChainTasks) {
      if (usedOnChainIds.has(onChainTask.task_id)) {
        continue;
      }

      const decodedContent = hexToText(onChainTask.content);
      const dbTitle = dbTask.title ?? "";

      // Match by title/content
      if (decodedContent === dbTitle) {
        // Verify lovelace also matches
        const dbLovelace = parseInt(dbTask.lovelace) || 0;
        if (dbLovelace === onChainTask.lovelace) {
          matchedOnChain = onChainTask;
          matchedBy = "content";
          break;
        }
      }

      // Fallback: match by lovelace and expiration time
      const dbLovelace = parseInt(dbTask.lovelace) || 0;
      const dbExpiration = parseInt(dbTask.expiration_time) || 0;
      if (
        dbLovelace === onChainTask.lovelace &&
        dbExpiration === onChainTask.expiration_posix
      ) {
        matchedOnChain = onChainTask;
        matchedBy = "lovelace_and_expiration";
        // Don't break - prefer content match
      }
    }

    if (matchedOnChain) {
      matched.push({
        dbTask,
        onChainTask: matchedOnChain,
        matchedBy,
      });
      usedOnChainIds.add(matchedOnChain.task_id);
    } else if (dbTask.status === "DRAFT" || dbTask.status === "PENDING_TX") {
      unmatchedDb.push(dbTask);
    }
  }

  const unmatchedOnChain = onChainTasks.filter(
    (t) => !usedOnChainIds.has(t.task_id)
  );

  return { matched, unmatchedDb, unmatchedOnChain };
}

/**
 * Sync project tasks between on-chain (Andamioscan) and DB
 *
 * @param projectId - Project NFT policy ID
 * @param projectStatePolicyId - Project state policy ID (for DB API)
 * @param txHash - Transaction hash for confirmation (required for DB update)
 * @param authenticatedFetch - Authenticated fetch function from useAndamioAuth
 * @param dryRun - If true, only report matches without updating DB (for manual sync)
 * @returns Sync result with matched tasks and any errors
 *
 * @example
 * ```typescript
 * const result = await syncProjectTasks(
 *   projectId,
 *   projectStatePolicyId,
 *   txHash,
 *   authenticatedFetch
 * );
 * console.log(`Synced ${result.confirmed} tasks`);
 * ```
 */
export async function syncProjectTasks(
  projectId: string,
  projectStatePolicyId: string,
  txHash: string,
  authenticatedFetch: (url: string, init?: RequestInit) => Promise<Response>,
  dryRun = false
): Promise<SyncResult> {
  const errors: string[] = [];

  console.log("[project-task-sync] Starting sync for project:", projectId);

  // 1. Fetch on-chain data from Andamioscan (includes tasks and treasury_fundings)
  let projectDetails: AndamioscanProjectDetails | null = null;
  let onChainTasks: AndamioscanTask[] = [];
  try {
    projectDetails = await getProject(projectId);
    onChainTasks = projectDetails?.tasks ?? [];
    console.log(`[project-task-sync] Found ${onChainTasks.length} on-chain tasks`);
  } catch (err) {
    console.error("[project-task-sync] Andamioscan fetch failed:", err);
    errors.push(`Failed to fetch from Andamioscan: ${err instanceof Error ? err.message : String(err)}`);
    return {
      matched: [],
      unmatchedDb: [],
      unmatchedOnChain: [],
      confirmed: 0,
      errors,
    };
  }

  if (onChainTasks.length === 0) {
    console.log("[project-task-sync] No on-chain tasks found");
    return {
      matched: [],
      unmatchedDb: [],
      unmatchedOnChain: [],
      confirmed: 0,
      errors: ["No on-chain tasks found in Andamioscan"],
    };
  }

  // 2. Fetch DB tasks
  let dbTasks: ProjectTaskV2Output[] = [];
  try {
    dbTasks = await fetchDbTasks(projectStatePolicyId, authenticatedFetch);
    console.log(`[project-task-sync] Found ${dbTasks.length} DB tasks`);
  } catch (err) {
    console.error("[project-task-sync] DB fetch failed:", err);
    errors.push(`Failed to fetch DB tasks: ${err instanceof Error ? err.message : String(err)}`);
    return {
      matched: [],
      unmatchedDb: [],
      unmatchedOnChain: onChainTasks,
      confirmed: 0,
      errors,
    };
  }

  // 3. Match tasks
  const { matched, unmatchedDb, unmatchedOnChain } = matchTasks(
    dbTasks,
    onChainTasks
  );

  console.log(`[project-task-sync] Matched ${matched.length} tasks, ${unmatchedDb.length} unmatched DB, ${unmatchedOnChain.length} unmatched on-chain`);

  // 4. If dry run, just report matches without updating DB
  if (dryRun) {
    console.log("[project-task-sync] Dry run - skipping DB update");
    return {
      matched,
      unmatchedDb,
      unmatchedOnChain,
      confirmed: 0,
      errors: [],
    };
  }

  // 5. Update matched tasks to ON_CHAIN status using batch-status endpoint
  // This endpoint allows direct status updates without tx_hash validation
  if (matched.length === 0) {
    console.log("[project-task-sync] No matches to update");
    return {
      matched,
      unmatchedDb,
      unmatchedOnChain,
      confirmed: 0,
      errors: [],
    };
  }

  // Separate tasks by current status for proper transition handling
  const draftTasks = matched.filter((m) => m.dbTask.status === "DRAFT");
  const pendingTasks = matched.filter((m) => m.dbTask.status === "PENDING_TX");

  console.log(`[project-task-sync] Tasks to sync: ${draftTasks.length} DRAFT, ${pendingTasks.length} PENDING_TX`);

  let confirmed = 0;

  // Step 1: Update DRAFT tasks to PENDING_TX first (required transition)
  if (draftTasks.length > 0) {
    const draftToUpdate = draftTasks.map((match) => ({
      index: match.dbTask.index,
      status: "PENDING_TX",
      task_hash: match.onChainTask.task_id,
    }));

    try {
      const result = await batchUpdateTaskStatus(
        projectStatePolicyId,
        draftToUpdate,
        authenticatedFetch
      );
      console.log(`[project-task-sync] DRAFT → PENDING_TX: ${result.updated} updated`);

      if (result.errors.length > 0) {
        errors.push(...result.errors);
      }
    } catch (err) {
      console.error("[project-task-sync] Step 1 error:", err);
      errors.push(
        `Error updating DRAFT tasks: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  // Step 2: Update all matched tasks to ON_CHAIN (now they should be PENDING_TX)
  const allTasksToOnChain = matched.map((match) => ({
    index: match.dbTask.index,
    status: "ON_CHAIN",
    task_hash: match.onChainTask.task_id,
  }));

  try {
    const result = await batchUpdateTaskStatus(
      projectStatePolicyId,
      allTasksToOnChain,
      authenticatedFetch
    );

    confirmed = result.updated;
    if (result.errors.length > 0) {
      errors.push(...result.errors);
    }
    console.log(`[project-task-sync] PENDING_TX → ON_CHAIN: ${result.updated} updated`);
  } catch (err) {
    console.error("[project-task-sync] Step 2 error:", err);
    errors.push(
      `Error updating tasks to ON_CHAIN: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const finalResult = {
    matched,
    unmatchedDb,
    unmatchedOnChain,
    confirmed,
    errors,
  };

  console.log(`[project-task-sync] Sync complete: ${confirmed} confirmed, ${errors.length} errors`);

  return finalResult;
}

/**
 * Quick sync - just sync without detailed results
 *
 * @returns Number of tasks confirmed, or -1 on error
 */
export async function quickSyncProjectTasks(
  projectId: string,
  projectStatePolicyId: string,
  txHash: string,
  authenticatedFetch: (url: string, init?: RequestInit) => Promise<Response>
): Promise<number> {
  try {
    const result = await syncProjectTasks(
      projectId,
      projectStatePolicyId,
      txHash,
      authenticatedFetch
    );
    return result.confirmed;
  } catch {
    return -1;
  }
}
