/**
 * Project Commitment Sync
 *
 * Utilities for checking and syncing on-chain task submissions
 * with DB commitment records.
 *
 * The DB API doesn't have a manager endpoint to list all commitments,
 * so we need to check each submission individually.
 */

import { env } from "~/env";
import {
  getProject,
  type AndamioscanSubmission,
  type AndamioscanProjectDetails,
} from "~/lib/andamioscan";

/**
 * Commitment sync status for a single submission
 */
export interface CommitmentSyncStatus {
  /** On-chain submission data */
  submission: AndamioscanSubmission;
  /** Whether a DB commitment record exists */
  hasDbRecord: boolean;
  /** DB commitment status if found */
  dbStatus?: string;
  /** Error message if check failed */
  error?: string;
}

/**
 * Overall sync result for a project
 */
export interface CommitmentSyncResult {
  /** Total on-chain submissions found */
  totalOnChain: number;
  /** Submissions with matching DB records */
  synced: CommitmentSyncStatus[];
  /** Submissions missing DB records */
  unsynced: CommitmentSyncStatus[];
  /** Errors encountered during sync check */
  errors: string[];
}

/**
 * Decode hex string to UTF-8 text
 */
export function hexToText(hex: string): string {
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
 * Check if a commitment record exists in the DB
 *
 * Uses the contributor's get endpoint which returns 404 if not found.
 * Note: This only works if the manager is also the contributor or has access.
 * For manager view, we'll assume records exist if assess doesn't fail.
 */
export async function checkCommitmentExists(
  taskHash: string,
  contributorAlias: string,
  authenticatedFetch: (url: string, init?: RequestInit) => Promise<Response>
): Promise<{ exists: boolean; status?: string; error?: string }> {
  try {
    // Try the manager assess endpoint with a "check" - this will fail gracefully
    // if the commitment doesn't exist
    const response = await authenticatedFetch(
      `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/project-v2/contributor/commitment/get`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_hash: taskHash }),
      }
    );

    if (response.status === 404) {
      return { exists: false };
    }

    if (!response.ok) {
      // Other errors - might be auth issue or different problem
      return { exists: false, error: `HTTP ${response.status}` };
    }

    const data = (await response.json()) as { status?: string };
    return { exists: true, status: data.status };
  } catch (err) {
    return {
      exists: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Fetch on-chain submissions for a project
 */
export async function getProjectSubmissions(
  projectId: string
): Promise<AndamioscanSubmission[]> {
  const projectDetails = await getProject(projectId);
  return projectDetails?.submissions ?? [];
}

/**
 * Check commitment sync status for a project
 *
 * Compares on-chain submissions from Andamioscan with DB commitment records.
 *
 * @param projectId - Project NFT policy ID
 * @param authenticatedFetch - Authenticated fetch function
 * @returns Sync status for all submissions
 *
 * @example
 * ```typescript
 * const result = await checkCommitmentSyncStatus(projectId, authenticatedFetch);
 * if (result.unsynced.length > 0) {
 *   console.log(`${result.unsynced.length} submissions need syncing`);
 * }
 * ```
 */
export async function checkCommitmentSyncStatus(
  projectId: string,
  authenticatedFetch: (url: string, init?: RequestInit) => Promise<Response>
): Promise<CommitmentSyncResult> {
  const errors: string[] = [];
  const synced: CommitmentSyncStatus[] = [];
  const unsynced: CommitmentSyncStatus[] = [];

  // 1. Fetch on-chain submissions from Andamioscan
  let projectDetails: AndamioscanProjectDetails | null = null;
  let submissions: AndamioscanSubmission[] = [];

  try {
    projectDetails = await getProject(projectId);
    submissions = projectDetails?.submissions ?? [];
    console.log(
      `[commitment-sync] Found ${submissions.length} on-chain submissions`
    );
  } catch (err) {
    console.error("[commitment-sync] Andamioscan fetch failed:", err);
    errors.push(
      `Failed to fetch from Andamioscan: ${err instanceof Error ? err.message : String(err)}`
    );
    return {
      totalOnChain: 0,
      synced: [],
      unsynced: [],
      errors,
    };
  }

  if (submissions.length === 0) {
    return {
      totalOnChain: 0,
      synced: [],
      unsynced: [],
      errors: [],
    };
  }

  // 2. Check each submission for DB record
  for (const submission of submissions) {
    const taskHash = submission.task.task_id;
    const contributorAlias = submission.alias;

    const checkResult = await checkCommitmentExists(
      taskHash,
      contributorAlias,
      authenticatedFetch
    );

    const status: CommitmentSyncStatus = {
      submission,
      hasDbRecord: checkResult.exists,
      dbStatus: checkResult.status,
      error: checkResult.error,
    };

    if (checkResult.exists) {
      synced.push(status);
    } else {
      unsynced.push(status);
    }
  }

  console.log(
    `[commitment-sync] Sync status: ${synced.length} synced, ${unsynced.length} unsynced`
  );

  return {
    totalOnChain: submissions.length,
    synced,
    unsynced,
    errors,
  };
}

/**
 * Attempt to create a commitment record for an on-chain submission
 *
 * This creates a minimal commitment record that can then be assessed.
 * Note: This uses contributor endpoints, so may require contributor auth.
 *
 * @param taskHash - Task hash (task_id from Andamioscan)
 * @param evidence - Evidence content (hex-decoded from submission)
 * @param txHash - Submission transaction hash
 * @param authenticatedFetch - Authenticated fetch function
 * @returns Success status and any error message
 */
export async function createCommitmentRecord(
  taskHash: string,
  evidence: string | null,
  txHash: string,
  authenticatedFetch: (url: string, init?: RequestInit) => Promise<Response>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Step 1: Create the commitment
    const createResponse = await authenticatedFetch(
      `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/project-v2/contributor/commitment/create`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_hash: taskHash }),
      }
    );

    if (!createResponse.ok && createResponse.status !== 409) {
      // 409 = already exists, which is fine
      const errorText = await createResponse.text();
      return { success: false, error: `Create failed: ${errorText}` };
    }

    // Step 2: Submit with evidence and tx hash
    const submitResponse = await authenticatedFetch(
      `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/project-v2/contributor/commitment/submit`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_hash: taskHash,
          evidence: evidence ? { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: evidence }] }] } : null,
          pending_tx_hash: txHash,
        }),
      }
    );

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      return { success: false, error: `Submit failed: ${errorText}` };
    }

    // Step 3: Confirm the transaction
    const confirmResponse = await authenticatedFetch(
      `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/project-v2/contributor/commitment/confirm-tx`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_hash: taskHash,
          tx_hash: txHash,
        }),
      }
    );

    if (!confirmResponse.ok) {
      const errorText = await confirmResponse.text();
      return { success: false, error: `Confirm failed: ${errorText}` };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Sync a single submission to the DB
 *
 * Attempts to create a commitment record for an on-chain submission
 * that doesn't have a corresponding DB record.
 */
export async function syncSubmission(
  submission: AndamioscanSubmission,
  authenticatedFetch: (url: string, init?: RequestInit) => Promise<Response>
): Promise<{ success: boolean; error?: string }> {
  const taskHash = submission.task.task_id;
  const evidence = hexToText(submission.content);
  const txHash = submission.tx_hash;

  console.log(`[commitment-sync] Syncing submission for task ${taskHash.slice(0, 16)}...`);

  return createCommitmentRecord(taskHash, evidence, txHash, authenticatedFetch);
}

/**
 * Sync a pending assessment to the DB
 *
 * Creates a commitment record directly from pending assessment data.
 * This is useful when the full submission data isn't available but
 * we have the pending assessment from Andamioscan.
 *
 * @param taskId - Task hash (64 char hex)
 * @param content - Submission content (may be hex-encoded or plain text)
 * @param txHash - Submission transaction hash
 * @param authenticatedFetch - Authenticated fetch function
 */
export async function syncPendingAssessment(
  taskId: string,
  content: string,
  txHash: string,
  authenticatedFetch: (url: string, init?: RequestInit) => Promise<Response>
): Promise<{ success: boolean; error?: string }> {
  // Try to decode content if it looks like hex
  let evidence = content;
  if (content && /^[0-9a-fA-F]+$/.test(content)) {
    const decoded = hexToText(content);
    if (decoded) evidence = decoded;
  }

  console.log(`[commitment-sync] Syncing pending assessment for task ${taskId.slice(0, 16)}...`);

  return createCommitmentRecord(taskId, evidence || null, txHash, authenticatedFetch);
}

/**
 * Sync all unsynced submissions for a project
 *
 * @param projectId - Project NFT policy ID
 * @param authenticatedFetch - Authenticated fetch function
 * @returns Number of successfully synced submissions and any errors
 */
export async function syncAllCommitments(
  projectId: string,
  authenticatedFetch: (url: string, init?: RequestInit) => Promise<Response>
): Promise<{ synced: number; failed: number; errors: string[] }> {
  const errors: string[] = [];
  let synced = 0;
  let failed = 0;

  // Get current sync status
  const status = await checkCommitmentSyncStatus(projectId, authenticatedFetch);

  if (status.unsynced.length === 0) {
    console.log("[commitment-sync] All submissions already synced");
    return { synced: 0, failed: 0, errors: [] };
  }

  console.log(`[commitment-sync] Syncing ${status.unsynced.length} submissions...`);

  for (const item of status.unsynced) {
    const result = await syncSubmission(item.submission, authenticatedFetch);

    if (result.success) {
      synced++;
    } else {
      failed++;
      errors.push(
        `Failed to sync ${item.submission.alias}'s submission: ${result.error}`
      );
    }
  }

  console.log(`[commitment-sync] Complete: ${synced} synced, ${failed} failed`);

  return { synced, failed, errors };
}
