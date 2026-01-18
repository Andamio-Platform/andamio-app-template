/**
 * useTxWatcher Hook
 *
 * Polls the gateway TX status endpoint to track transaction confirmation.
 * Uses the V2 gateway TX state machine for automatic DB updates.
 *
 * ## TX States
 *
 * - `pending` - TX submitted, awaiting confirmation
 * - `confirmed` - TX confirmed on-chain, gateway processing DB updates
 * - `updated` - DB updates complete (terminal - success)
 * - `failed` - TX failed after max retries (terminal - error)
 * - `expired` - TX exceeded TTL (terminal - error)
 *
 * ## Usage
 *
 * ```tsx
 * const { status, isPolling } = useTxWatcher(txHash);
 *
 * if (status?.state === "updated") {
 *   // Transaction complete, DB updated
 * }
 * ```
 *
 * @see ~/config/transaction-ui.ts - TX types
 * @see ~/.claude/skills/audit-api-coverage/tx-state-machine.md - Full API docs
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";

// =============================================================================
// Types
// =============================================================================

/**
 * Gateway TX state machine states
 */
export type TxState = "pending" | "confirmed" | "updated" | "failed" | "expired";

/**
 * Terminal states - stop polling when reached
 */
export const TERMINAL_STATES: TxState[] = ["updated", "failed", "expired"];

/**
 * TX status response from gateway
 */
export interface TxStatus {
  tx_hash: string;
  tx_type: string;
  state: TxState;
  confirmed_at?: string;
  retry_count: number;
  last_error?: string;
}

/**
 * TX registration request body
 */
export interface TxRegisterRequest {
  tx_hash: string;
  tx_type: string;
  metadata?: Record<string, string>;
}

// =============================================================================
// Hook
// =============================================================================

export interface UseTxWatcherOptions {
  /** Polling interval in ms (default: 10000 = 10 seconds) */
  pollInterval?: number;
  /** Callback when TX reaches terminal state */
  onComplete?: (status: TxStatus) => void;
  /** Callback on polling error */
  onError?: (error: Error) => void;
}

/**
 * Watch a transaction's status by polling the gateway
 *
 * @param txHash - Transaction hash to watch (null to disable)
 * @param options - Configuration options
 */
export function useTxWatcher(
  txHash: string | null,
  options: UseTxWatcherOptions = {}
) {
  const { pollInterval = 10_000, onComplete, onError } = options;
  const { authenticatedFetch, jwt } = useAndamioAuth();

  const [status, setStatus] = useState<TxStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const checkStatus = useCallback(async (): Promise<TxStatus | null> => {
    if (!txHash || !jwt) return null;

    try {
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/tx/status/${txHash}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          // TX not registered yet - this is expected briefly after submit
          return null;
        }
        throw new Error(`Failed to get TX status: ${response.status}`);
      }

      return (await response.json()) as TxStatus;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
      return null;
    }
  }, [txHash, jwt, authenticatedFetch, onError]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!txHash) {
      setStatus(null);
      setIsPolling(false);
      return;
    }

    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;

      const result = await checkStatus();
      if (cancelled) return;

      setStatus(result);

      // Stop polling on terminal states
      if (result && TERMINAL_STATES.includes(result.state)) {
        setIsPolling(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        onComplete?.(result);
      }
    };

    setIsPolling(true);
    setError(null);

    // Initial check
    void poll();

    // Start polling
    intervalRef.current = setInterval(() => void poll(), pollInterval);

    return () => {
      cancelled = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [txHash, pollInterval, checkStatus, onComplete]);

  return {
    status,
    isPolling,
    error,
    /** Manually trigger a status check */
    checkNow: checkStatus,
    /** Whether TX is in a terminal state */
    isTerminal: status ? TERMINAL_STATES.includes(status.state) : false,
    /** Whether TX completed successfully */
    isSuccess: status?.state === "updated",
    /** Whether TX failed */
    isFailed: status?.state === "failed" || status?.state === "expired",
  };
}

// =============================================================================
// Registration Helper
// =============================================================================

/**
 * Register a transaction with the gateway after wallet submission
 *
 * @param txHash - Transaction hash from wallet.submitTx()
 * @param txType - Transaction type (e.g., "access_token_mint")
 * @param jwt - Authentication JWT
 * @param metadata - Optional off-chain metadata (e.g., course title)
 */
export async function registerTransaction(
  txHash: string,
  txType: string,
  jwt: string,
  metadata?: Record<string, string>
): Promise<void> {
  const response = await fetch("/api/gateway/api/v2/tx/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({
      tx_hash: txHash,
      tx_type: txType,
      metadata,
    } satisfies TxRegisterRequest),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to register TX: ${response.status} - ${errorText}`);
  }
}

// =============================================================================
// TX Type Mapping
// =============================================================================

/**
 * Map TransactionType (frontend) to tx_type (gateway)
 *
 * The gateway uses snake_case identifiers for TX types.
 */
export const TX_TYPE_MAP: Record<string, string> = {
  GLOBAL_GENERAL_ACCESS_TOKEN_MINT: "access_token_mint",
  INSTANCE_COURSE_CREATE: "course_create",
  INSTANCE_PROJECT_CREATE: "project_create",
  COURSE_OWNER_TEACHERS_MANAGE: "course_teachers_manage",
  COURSE_TEACHER_MODULES_MANAGE: "course_modules_manage",
  COURSE_TEACHER_ASSIGNMENTS_ASSESS: "course_assignments_assess",
  COURSE_STUDENT_ASSIGNMENT_COMMIT: "course_assignment_commit",
  COURSE_STUDENT_ASSIGNMENT_UPDATE: "course_assignment_update",
  COURSE_STUDENT_CREDENTIAL_CLAIM: "course_credential_claim",
  PROJECT_OWNER_MANAGERS_MANAGE: "project_managers_manage",
  PROJECT_OWNER_BLACKLIST_MANAGE: "project_blacklist_manage",
  PROJECT_MANAGER_TASKS_MANAGE: "project_tasks_manage",
  PROJECT_MANAGER_TASKS_ASSESS: "project_tasks_assess",
  PROJECT_CONTRIBUTOR_TASK_COMMIT: "project_task_commit",
  PROJECT_CONTRIBUTOR_TASK_ACTION: "project_task_action",
  PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM: "project_credential_claim",
  PROJECT_USER_TREASURY_ADD_FUNDS: "project_treasury_add_funds",
};

/**
 * Get gateway tx_type from frontend TransactionType
 */
export function getGatewayTxType(txType: string): string {
  return TX_TYPE_MAP[txType] ?? txType.toLowerCase();
}
