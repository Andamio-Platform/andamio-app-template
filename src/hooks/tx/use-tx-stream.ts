/**
 * useTxStream Hook
 *
 * SSE-based transaction state tracking with automatic polling fallback.
 * Drop-in replacement for useTxWatcher that uses Server-Sent Events for
 * real-time updates instead of interval polling.
 *
 * ## Usage
 *
 * ```tsx
 * const { status, isSuccess, isFailed } = useTxStream(txHash);
 *
 * if (isSuccess) {
 *   // Transaction complete, DB updated
 * }
 * ```
 *
 * ## How It Works
 *
 * 1. Opens an SSE connection to `/api/gateway-stream/api/v2/tx/stream/{hash}`
 * 2. Receives `state`, `state_change`, and `complete` events in real-time
 * 3. If the SSE connection fails, falls back to polling via `pollUntilTerminal`
 *
 * @see ~/types/tx-stream.ts - SSE event types
 * @see ~/lib/tx-polling-fallback.ts - Polling fallback
 * @see ~/hooks/tx/use-tx-watcher.ts - Original polling-only hook
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import type { TxState, TxStatus } from "~/hooks/tx/use-tx-watcher";
import { TERMINAL_STATES } from "~/hooks/tx/use-tx-watcher";
import type {
  TxStateEvent,
  TxStateChangeEvent,
  TxCompleteEvent,
  TxStreamCallbacks,
} from "~/types/tx-stream";
import { pollUntilTerminal } from "~/lib/tx-polling-fallback";

// =============================================================================
// Constants
// =============================================================================

const STREAM_PROXY_BASE = "/api/gateway-stream/api/v2";

// =============================================================================
// Low-Level SSE Parser
// =============================================================================

interface ParsedSSEEvent {
  event?: string;
  data?: string;
}

/**
 * Parse SSE text chunks into structured events.
 *
 * SSE format:
 * ```
 * event: state
 * data: {"tx_hash":"abc","state":"pending",...}
 *
 * event: state_change
 * data: {"tx_hash":"abc","previous_state":"pending","new_state":"confirmed",...}
 * ```
 */
function parseSSEChunk(chunk: string): ParsedSSEEvent[] {
  const events: ParsedSSEEvent[] = [];
  const blocks = chunk.split("\n\n").filter(Boolean);

  for (const block of blocks) {
    const lines = block.split("\n");
    let event: string | undefined;
    let data: string | undefined;

    for (const line of lines) {
      if (line.startsWith("event: ")) {
        event = line.slice(7).trim();
      } else if (line.startsWith("data: ")) {
        data = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        // data with no space after colon
        data = line.slice(5).trim();
      }
    }

    if (data !== undefined) {
      events.push({ event, data });
    }
  }

  return events;
}

// =============================================================================
// Low-Level Stream Hook
// =============================================================================

/**
 * Low-level hook that manages the SSE connection and dispatches events.
 * Returns subscribe/unsubscribe functions for manual control.
 */
function useTransactionStream() {
  const { jwt } = useAndamioAuth();
  const abortRef = useRef<AbortController | null>(null);

  const unsubscribe = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  const subscribe = useCallback(
    (txHash: string, callbacks: TxStreamCallbacks) => {
      // Clean up any existing connection
      unsubscribe();

      const controller = new AbortController();
      abortRef.current = controller;

      const url = `${STREAM_PROXY_BASE}/tx/stream/${txHash}`;
      const headers: Record<string, string> = {};
      if (jwt) {
        headers.Authorization = `Bearer ${jwt}`;
      }

      // Use fetch + ReadableStream for SSE (works in all modern browsers)
      void (async () => {
        try {
          const response = await fetch(url, {
            headers,
            signal: controller.signal,
            cache: "no-store",
          });

          if (!response.ok) {
            throw new Error(`SSE connection failed: ${response.status}`);
          }

          if (!response.body) {
            throw new Error("No response body for SSE stream");
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process complete events (delimited by double newline)
            const lastDoubleNewline = buffer.lastIndexOf("\n\n");
            if (lastDoubleNewline === -1) continue;

            const complete = buffer.slice(0, lastDoubleNewline + 2);
            buffer = buffer.slice(lastDoubleNewline + 2);

            const events = parseSSEChunk(complete);

            for (const sseEvent of events) {
              if (!sseEvent.data) continue;

              try {
                switch (sseEvent.event) {
                  case "state": {
                    const payload = JSON.parse(sseEvent.data) as TxStateEvent;
                    callbacks.onState?.(payload);
                    break;
                  }
                  case "state_change": {
                    const payload = JSON.parse(sseEvent.data) as TxStateChangeEvent;
                    callbacks.onStateChange?.(payload);
                    break;
                  }
                  case "complete": {
                    const payload = JSON.parse(sseEvent.data) as TxCompleteEvent;
                    callbacks.onComplete?.(payload);
                    break;
                  }
                  default:
                    // Unknown event type - ignore (could be heartbeat/comment)
                    break;
                }
              } catch (parseErr) {
                console.warn("[TxStream] Failed to parse SSE event data:", parseErr);
              }
            }
          }
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") return;
          const error = err instanceof Error ? err : new Error(String(err));
          callbacks.onError?.(error);
        }
      })();

      return unsubscribe;
    },
    [jwt, unsubscribe]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => unsubscribe();
  }, [unsubscribe]);

  return { subscribe, unsubscribe };
}

// =============================================================================
// High-Level Hook (useTxWatcher-compatible API)
// =============================================================================

export interface UseTxStreamOptions {
  /** Callback when TX reaches terminal state */
  onComplete?: (status: TxStatus) => void;
  /** Callback on stream/polling error */
  onError?: (error: Error) => void;
}

/**
 * Watch a transaction's status via SSE streaming with polling fallback.
 *
 * Same consumer API as useTxWatcher - can be used as a drop-in replacement.
 *
 * @param txHash - Transaction hash to watch (null to disable)
 * @param options - Configuration options
 */
export function useTxStream(
  txHash: string | null,
  options: UseTxStreamOptions = {}
) {
  const { authenticatedFetch, jwt } = useAndamioAuth();
  const { subscribe, unsubscribe } = useTransactionStream();

  const [status, setStatus] = useState<TxStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Refs for callbacks to avoid effect restarts
  const onCompleteRef = useRef(options.onComplete);
  const onErrorRef = useRef(options.onError);
  const authenticatedFetchRef = useRef(authenticatedFetch);
  const fallbackAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    onCompleteRef.current = options.onComplete;
  }, [options.onComplete]);

  useEffect(() => {
    onErrorRef.current = options.onError;
  }, [options.onError]);

  useEffect(() => {
    authenticatedFetchRef.current = authenticatedFetch;
  }, [authenticatedFetch]);

  // Convert SSE events to TxStatus shape
  const toTxStatus = useCallback(
    (
      txHashValue: string,
      state: TxState,
      extra?: Partial<TxStatus>
    ): TxStatus => ({
      tx_hash: txHashValue,
      tx_type: extra?.tx_type ?? "",
      state,
      retry_count: extra?.retry_count ?? 0,
      confirmed_at: extra?.confirmed_at,
      last_error: extra?.last_error,
    }),
    []
  );

  // Start polling fallback
  const startFallback = useCallback(
    (hash: string) => {
      setIsPolling(true);

      const controller = new AbortController();
      fallbackAbortRef.current = controller;

      void pollUntilTerminal(
        hash,
        authenticatedFetchRef.current,
        {
          onStatus: (pollStatus) => setStatus(pollStatus),
          onComplete: (pollStatus) => {
            setStatus(pollStatus);
            setIsPolling(false);
            onCompleteRef.current?.(pollStatus);
          },
          onError: (pollError) => {
            setError(pollError);
            onErrorRef.current?.(pollError);
          },
        },
        { interval: 15_000 },
        controller.signal
      );
    },
    []
  );

  useEffect(() => {
    if (!txHash || !jwt) {
      setStatus(null);
      setIsPolling(false);
      setError(null);
      return;
    }

    const currentHash = txHash;

    // Try SSE first
    const cleanup = subscribe(currentHash, {
      onState: (event) => {
        const txStatus = toTxStatus(currentHash, event.state, {
          tx_type: event.tx_type,
          retry_count: event.retry_count,
          confirmed_at: event.confirmed_at,
          last_error: event.last_error,
        });
        setStatus(txStatus);

        // If already terminal on connect, fire complete
        if (TERMINAL_STATES.includes(event.state)) {
          onCompleteRef.current?.(txStatus);
        }
      },
      onStateChange: (event) => {
        setStatus((prev) =>
          prev
            ? { ...prev, state: event.new_state }
            : toTxStatus(currentHash, event.new_state)
        );
      },
      onComplete: (event) => {
        const txStatus = toTxStatus(currentHash, event.final_state, {
          tx_type: event.tx_type,
          confirmed_at: event.confirmed_at,
          last_error: event.last_error,
        });
        setStatus(txStatus);
        onCompleteRef.current?.(txStatus);
      },
      onError: (sseError) => {
        console.warn(
          "[useTxStream] SSE failed, falling back to polling:",
          sseError.message
        );
        setError(sseError);
        // Fall back to polling
        startFallback(currentHash);
      },
    });

    return () => {
      cleanup();
      // Also abort any fallback polling
      if (fallbackAbortRef.current) {
        fallbackAbortRef.current.abort();
        fallbackAbortRef.current = null;
      }
    };
  }, [txHash, jwt, subscribe, unsubscribe, toTxStatus, startFallback]);

  return {
    status,
    isPolling,
    error,
    /** Whether TX is in a terminal state */
    isTerminal: status ? TERMINAL_STATES.includes(status.state) : false,
    /** Whether TX completed successfully (DB updated by Gateway) */
    isSuccess: status?.state === "updated",
    /** Whether TX failed */
    isFailed: status?.state === "failed" || status?.state === "expired",
  };
}
