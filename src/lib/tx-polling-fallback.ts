/**
 * Transaction Polling Fallback
 *
 * Standalone polling function used as a fallback when SSE streaming is unavailable.
 * Polls the gateway TX status endpoint at regular intervals until a terminal state
 * is reached.
 *
 * @see src/hooks/tx/use-tx-stream.ts - Primary consumer (fallback path)
 * @see src/hooks/tx/use-tx-watcher.ts - Original polling hook (for reference)
 */

import { GATEWAY_API_BASE } from "~/lib/api-utils";
import type { TxState, TxStatus } from "~/hooks/tx/use-tx-watcher";

const TERMINAL_STATES: TxState[] = ["updated", "failed", "expired"];

export interface PollCallbacks {
  /** Called on each successful status check */
  onStatus?: (status: TxStatus) => void;
  /** Called when a terminal state is reached */
  onComplete?: (status: TxStatus) => void;
  /** Called on polling errors */
  onError?: (error: Error) => void;
}

export interface PollOptions {
  /** Polling interval in ms (default: 6000) */
  interval?: number;
  /** Maximum number of polls before giving up (default: 150 = ~15 min at 6s intervals) */
  maxPolls?: number;
}

/**
 * Poll the gateway TX status endpoint until a terminal state is reached.
 *
 * Returns the final TxStatus when a terminal state is reached, or null if
 * polling was aborted via the AbortSignal.
 *
 * @param txHash - Transaction hash to poll
 * @param authenticatedFetch - Fetch function with auth headers
 * @param callbacks - Event callbacks
 * @param options - Polling configuration
 * @param signal - AbortSignal to cancel polling
 * @returns Final TxStatus or null if aborted
 */
export async function pollUntilTerminal(
  txHash: string,
  authenticatedFetch: (url: string, init?: RequestInit) => Promise<Response>,
  callbacks: PollCallbacks = {},
  options: PollOptions = {},
  signal?: AbortSignal
): Promise<TxStatus | null> {
  const { interval = 6_000, maxPolls = 150 } = options;

  for (let i = 0; i < maxPolls; i++) {
    if (signal?.aborted) return null;

    // Wait before polling (except first iteration - check immediately)
    if (i > 0) {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(resolve, interval);
        signal?.addEventListener(
          "abort",
          () => {
            clearTimeout(timeout);
            reject(new DOMException("Aborted", "AbortError"));
          },
          { once: true }
        );
      }).catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        throw err;
      });

      if (signal?.aborted) return null;
    }

    try {
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/tx/status/${txHash}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          // TX not registered yet - expected briefly after submit
          continue;
        }
        throw new Error(`Failed to get TX status: ${response.status}`);
      }

      const status = (await response.json()) as TxStatus;
      callbacks.onStatus?.(status);

      if (TERMINAL_STATES.includes(status.state)) {
        callbacks.onComplete?.(status);
        return status;
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return null;
      const error = err instanceof Error ? err : new Error(String(err));
      callbacks.onError?.(error);
    }
  }

  // Exceeded max polls
  const timeoutError = new Error(
    `TX polling timed out after ${maxPolls} attempts for ${txHash}`
  );
  callbacks.onError?.(timeoutError);
  return null;
}
