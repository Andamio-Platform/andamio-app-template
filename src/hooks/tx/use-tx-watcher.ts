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
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import type { GatewayTxType } from "~/types/generated";
import { GATEWAY_API_BASE } from "~/lib/api-utils";

// =============================================================================
// Types
// =============================================================================

/**
 * Gateway TX state machine states
 */
export type TxState = "pending" | "confirmed" | "updated" | "failed" | "expired";

/**
 * Terminal states - stop polling when reached
 * IMPORTANT: "confirmed" is NOT terminal - it only means TX is on-chain.
 * Wait for "updated" which means Gateway has completed DB updates.
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
  /** Polling interval in ms (default: 15000 = 15 seconds, ~1 per Cardano block) */
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
  const { pollInterval = 15_000, onComplete, onError } = options;
  const { authenticatedFetch, jwt } = useAndamioAuth();

  const [status, setStatus] = useState<TxStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Use refs for callbacks to prevent effect restarts
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  const authenticatedFetchRef = useRef(authenticatedFetch);

  // Keep refs updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    authenticatedFetchRef.current = authenticatedFetch;
  }, [authenticatedFetch]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Stable check function that uses refs
  const checkStatus = useCallback(async (): Promise<TxStatus | null> => {
    if (!txHash || !jwt) return null;

    try {
      const response = await authenticatedFetchRef.current(
        `${GATEWAY_API_BASE}/tx/status/${txHash}`
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
      onErrorRef.current?.(error);
      return null;
    }
  }, [txHash, jwt]);

  useEffect(() => {
    if (!txHash || !jwt) {
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
        onCompleteRef.current?.(result);
      }
    };

    setIsPolling(true);
    setError(null);

    // Initial check after a short delay (give registration time to complete)
    const initialTimeout = setTimeout(() => void poll(), 1000);

    // Start polling after initial check
    intervalRef.current = setInterval(() => void poll(), pollInterval);

    return () => {
      cancelled = true;
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [txHash, jwt, pollInterval, checkStatus]);

  return {
    status,
    isPolling,
    error,
    /** Manually trigger a status check */
    checkNow: checkStatus,
    /** Whether TX is in a terminal state */
    isTerminal: status ? TERMINAL_STATES.includes(status.state) : false,
    /** Whether TX completed successfully (DB updated by Gateway) */
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
  const response = await fetch(`${GATEWAY_API_BASE}/tx/register`, {
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
 * The gateway uses a specific set of tx_type values defined in the API spec.
 * @see GatewayTxType for valid values
 * @see https://dev-api.andamio.io/api/v1/docs/ for API docs
 */
export const TX_TYPE_MAP: Record<string, GatewayTxType> = {
  // Global
  GLOBAL_GENERAL_ACCESS_TOKEN_MINT: "access_token_mint",

  // Course - Instance
  INSTANCE_COURSE_CREATE: "course_create",

  // Course - Owner
  COURSE_OWNER_TEACHERS_MANAGE: "teachers_update",

  // Course - Teacher
  COURSE_TEACHER_MODULES_MANAGE: "modules_manage",
  COURSE_TEACHER_ASSIGNMENTS_ASSESS: "assessment_assess",

  // Course - Student
  COURSE_STUDENT_ASSIGNMENT_COMMIT: "assignment_submit",
  COURSE_STUDENT_ASSIGNMENT_UPDATE: "assignment_submit",
  COURSE_STUDENT_CREDENTIAL_CLAIM: "credential_claim",

  // Project - Instance
  INSTANCE_PROJECT_CREATE: "project_create",

  // Project - Owner
  PROJECT_OWNER_MANAGERS_MANAGE: "project_join",
  PROJECT_OWNER_BLACKLIST_MANAGE: "blacklist_update",

  // Project - Manager
  PROJECT_MANAGER_TASKS_MANAGE: "tasks_manage",
  PROJECT_MANAGER_TASKS_ASSESS: "task_assess",

  // Project - Contributor
  PROJECT_CONTRIBUTOR_TASK_COMMIT: "task_submit",
  PROJECT_CONTRIBUTOR_TASK_ACTION: "task_submit",
  PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM: "project_credential_claim",

  // Project - User
  PROJECT_USER_TREASURY_ADD_FUNDS: "treasury_fund",
};

/**
 * Get gateway tx_type from frontend TransactionType
 */
export function getGatewayTxType(txType: string): GatewayTxType {
  const mapped = TX_TYPE_MAP[txType];
  if (!mapped) {
    console.warn(`[TX] Unknown transaction type: ${txType}, using as-is`);
    return txType.toLowerCase() as GatewayTxType;
  }
  return mapped;
}
