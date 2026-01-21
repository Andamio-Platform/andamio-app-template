/**
 * Project Task Sync
 *
 * Syncs on-chain tasks from Andamioscan with DB tasks.
 * Matches tasks by content and updates DB with on-chain task_id.
 */

import { getProject, type AndamioscanTask, type AndamioscanProjectDetails } from "~/lib/andamioscan";
import { type ProjectTaskV2Output } from "~/types/generated";
import { computeTaskHash, type TaskData } from "@andamio/core/hashing";

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
 * Compute task hash from DB task data.
 * Uses the same algorithm as on-chain for reliable matching.
 */
function computeTaskHashFromDb(dbTask: ProjectTaskV2Output): string {
  const taskData: TaskData = {
    project_content: dbTask.title ?? "",
    expiration_time: parseInt(dbTask.expiration_time ?? "0") || 0,
    lovelace_amount: parseInt(dbTask.lovelace_amount ?? "0") || 0,
    native_assets: [],
  };
  return computeTaskHash(taskData);
}

/**
 * Match result for a single task
 */
export interface TaskMatchResult {
  dbTask: ProjectTaskV2Output;
  onChainTask: AndamioscanTask;
  matchedBy: "computed_hash" | "content" | "lovelace_and_expiration";
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
 *
 * V2: Changed from GET with path param to POST with body
 */
async function fetchDbTasks(
  projectStatePolicyId: string,
  authenticatedFetch: (url: string, init?: RequestInit) => Promise<Response>
): Promise<ProjectTaskV2Output[]> {
  const response = await authenticatedFetch(
    `/api/gateway/api/v2/project/manager/tasks/list`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectStatePolicyId }),
    }
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
 * Confirm a single task with task_hash using the confirm-tx endpoint
 *
 * This endpoint supports task_hash, which batch-status does not.
 * Used to persist the computed task hash to the database.
 *
 * @returns Success or error message
 */
async function confirmTaskWithHash(
  projectStatePolicyId: string,
  taskIndex: number,
  txHash: string,
  taskHash: string,
  authenticatedFetch: (url: string, init?: RequestInit) => Promise<Response>
): Promise<{ success: boolean; error?: string }> {
  const requestBody = {
    project_state_policy_id: projectStatePolicyId,
    index: taskIndex,
    tx_hash: txHash,
    task_hash: taskHash,
  };

  console.log(`[project-task-sync] confirm-tx for task ${taskIndex}:`, {
    taskHash: taskHash.slice(0, 16) + "...",
    txHash: txHash.slice(0, 16) + "...",
  });

  const response = await authenticatedFetch(
    `/api/gateway/api/v2/project/manager/task/confirm-tx`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status}`;
    try {
      const errorBody = (await response.json()) as { message?: string; error?: string };
      errorDetail = errorBody.message ?? errorBody.error ?? errorDetail;
    } catch {
      // Ignore JSON parse errors
    }
    console.error(`[project-task-sync] confirm-tx failed for task ${taskIndex}:`, errorDetail);
    return { success: false, error: errorDetail };
  }

  return { success: true };
}

/**
 * Batch update task statuses using the batch-status endpoint
 *
 * This endpoint allows direct status updates without tx_hash validation,
 * which is needed for syncing tasks that are already on-chain but not
 * reflected in the database.
 *
 * NOTE: This endpoint does NOT support task_hash. Use confirmTaskWithHash
 * separately to persist task hashes.
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
    `/api/gateway/api/v2/project/manager/tasks/batch-status`,
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
 * Matching strategy (in order of reliability):
 * 1. Compute task hash from DB data and match directly (most reliable)
 * 2. Decode hex content from on-chain and compare to DB task title
 * 3. Match by lovelace + expiration time (fallback)
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

  // Create a map of on-chain tasks by task_id for O(1) lookup
  const onChainTaskMap = new Map<string, AndamioscanTask>();
  for (const task of onChainTasks) {
    onChainTaskMap.set(task.task_id, task);
  }

  for (const dbTask of dbTasks) {
    // Skip tasks that are already confirmed (have a task_hash)
    if (dbTask.task_hash && dbTask.task_status === "ON_CHAIN") {
      continue;
    }

    let matchedOnChain: AndamioscanTask | null = null;
    let matchedBy: "computed_hash" | "content" | "lovelace_and_expiration" = "computed_hash";

    // PRIMARY: Compute task hash and match directly
    const computedHash = computeTaskHashFromDb(dbTask);
    const hashMatch = onChainTaskMap.get(computedHash);
    if (hashMatch && !usedOnChainIds.has(computedHash)) {
      matchedOnChain = hashMatch;
      matchedBy = "computed_hash";
    }

    // FALLBACK: Try content/lovelace matching if hash didn't match
    if (!matchedOnChain) {
      for (const onChainTask of onChainTasks) {
        if (usedOnChainIds.has(onChainTask.task_id)) {
          continue;
        }

        const decodedContent = hexToText(onChainTask.content);
        const dbTitle = dbTask.title ?? "";

        // Match by title/content
        if (decodedContent === dbTitle) {
          const dbLovelace = parseInt(dbTask.lovelace_amount ?? "0") || 0;
          if (dbLovelace === onChainTask.lovelace_amount) {
            matchedOnChain = onChainTask;
            matchedBy = "content";
            break;
          }
        }

        // Last resort: match by lovelace and expiration time
        const dbLovelace = parseInt(dbTask.lovelace_amount ?? "0") || 0;
        const dbExpiration = parseInt(dbTask.expiration_time ?? "0") || 0;
        if (
          dbLovelace === onChainTask.lovelace_amount &&
          dbExpiration === onChainTask.expiration_posix
        ) {
          matchedOnChain = onChainTask;
          matchedBy = "lovelace_and_expiration";
          // Don't break - prefer content match
        }
      }
    }

    if (matchedOnChain) {
      matched.push({
        dbTask,
        onChainTask: matchedOnChain,
        matchedBy,
      });
      usedOnChainIds.add(matchedOnChain.task_id);
    } else if (dbTask.task_status === "DRAFT" || dbTask.task_status === "PENDING_TX") {
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
  const draftTasks = matched.filter((m) => m.dbTask.task_status === "DRAFT");
  const pendingTasks = matched.filter((m) => m.dbTask.task_status === "PENDING_TX");
  const onChainTasksMissingHash = matched.filter(
    (m) => m.dbTask.task_status === "ON_CHAIN" && !m.dbTask.task_hash
  );

  console.log(`[project-task-sync] Tasks to sync: ${draftTasks.length} DRAFT, ${pendingTasks.length} PENDING_TX, ${onChainTasksMissingHash.length} ON_CHAIN (missing hash)`);

  let confirmed = 0;

  // Get tx_hash from treasury_fundings if not provided
  // This is needed for confirm-tx which sets task_hash
  let effectiveTxHash = txHash;
  if (!effectiveTxHash && projectDetails?.treasury_fundings?.length) {
    const sortedFundings = [...projectDetails.treasury_fundings].sort(
      (a, b) => b.slot - a.slot
    );
    effectiveTxHash = sortedFundings[0]?.tx_hash ?? "";
    console.log(`[project-task-sync] Using tx_hash from treasury_fundings: ${effectiveTxHash.slice(0, 16)}...`);
  }

  // Step 1: Update DRAFT tasks to PENDING_TX first (required transition)
  if (draftTasks.length > 0) {
    const draftToUpdate = draftTasks
      .filter((match) => match.dbTask.index !== undefined)
      .map((match) => ({
        index: match.dbTask.index!,
        status: "PENDING_TX",
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

  // Step 2: Use confirm-tx to transition PENDING_TX → ON_CHAIN WITH task_hash
  // The confirm-tx endpoint is the ONLY way to persist task_hash
  // batch-status doesn't support task_hash in its schema
  // NOTE: Only DRAFT and PENDING_TX tasks can be confirmed - ON_CHAIN tasks cannot
  const tasksToConfirm = [...draftTasks, ...pendingTasks];

  if (effectiveTxHash && tasksToConfirm.length > 0) {
    console.log(`[project-task-sync] Step 2: Confirming ${tasksToConfirm.length} tasks with task_hash via confirm-tx`);

    for (const match of tasksToConfirm) {
      if (match.dbTask.index === undefined) continue;
      const taskIndex = match.dbTask.index;
      const result = await confirmTaskWithHash(
        projectStatePolicyId,
        taskIndex,
        effectiveTxHash,
        match.onChainTask.task_id,
        authenticatedFetch
      );

      if (result.success) {
        confirmed++;
      } else {
        // If confirm-tx fails, try batch-status as fallback (won't set task_hash)
        console.warn(`[project-task-sync] confirm-tx failed for task ${taskIndex}: ${result.error}`);
        console.log(`[project-task-sync] Falling back to batch-status for task ${taskIndex}`);

        try {
          const batchResult = await batchUpdateTaskStatus(
            projectStatePolicyId,
            [{ index: taskIndex, status: "ON_CHAIN" }],
            authenticatedFetch
          );
          if (batchResult.updated > 0) {
            confirmed++;
          }
          if (batchResult.errors.length > 0) {
            errors.push(...batchResult.errors);
          }
        } catch (err) {
          errors.push(`Task ${match.dbTask.index}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }

    console.log(`[project-task-sync] Confirmed ${confirmed}/${tasksToConfirm.length} tasks`);
  } else if (!effectiveTxHash && tasksToConfirm.length > 0) {
    // No tx_hash available - use batch-status as fallback (won't set task_hash)
    console.warn("[project-task-sync] No tx_hash available - using batch-status (task_hash won't be persisted)");

    const allTasksToOnChain = tasksToConfirm
      .filter((match) => match.dbTask.index !== undefined)
      .map((match) => ({
        index: match.dbTask.index!,
        status: "ON_CHAIN",
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
      console.log(`[project-task-sync] PENDING_TX → ON_CHAIN (no task_hash): ${result.updated} updated`);
    } catch (err) {
      console.error("[project-task-sync] Step 2 fallback error:", err);
      errors.push(
        `Error updating tasks to ON_CHAIN: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  // Warn about ON_CHAIN tasks that are missing task_hash
  // These cannot be fixed via frontend - requires backend endpoint that supports updating task_hash on ON_CHAIN tasks
  if (onChainTasksMissingHash.length > 0) {
    console.warn(
      `[project-task-sync] ${onChainTasksMissingHash.length} ON_CHAIN task(s) missing task_hash - cannot update via current API`,
      onChainTasksMissingHash.map((m) => ({
        index: m.dbTask.index,
        title: m.dbTask.title,
        computedHash: m.onChainTask.task_id.slice(0, 16) + "...",
      }))
    );
    errors.push(
      `${onChainTasksMissingHash.length} ON_CHAIN task(s) missing task_hash - backend endpoint needed to update`
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
