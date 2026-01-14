/**
 * Side effect execution utilities
 *
 * These utilities are used by the T3 app template to execute onSubmit side effects
 * after a transaction is submitted.
 */

import type { SideEffect, SubmissionContext, OnSubmit, SideEffectCondition } from "../types";
import { resolvePathParams, constructRequestBody, getValueFromPath } from "../testing";

/**
 * Result of executing a side effect
 */
export type SideEffectExecutionResult = {
  /** The side effect that was executed */
  sideEffect: SideEffect;
  /** Whether the execution was successful */
  success: boolean;
  /** Error message if execution failed */
  error?: string;
  /** Response from the API call (if successful) */
  response?: any;
  /** Whether this side effect was skipped (e.g., "Not implemented") */
  skipped: boolean;
};

/**
 * Result of executing all onSubmit side effects
 */
export type ExecuteOnSubmitResult = {
  /** Overall success (true if all critical side effects succeeded) */
  success: boolean;
  /** Individual results for each side effect */
  results: SideEffectExecutionResult[];
  /** Any critical errors that occurred */
  criticalErrors: string[];
};

/**
 * Logging callback for side effect requests
 */
export type SideEffectRequestLog = {
  phase: "onSubmit" | "onConfirmation";
  description: string;
  method: string;
  endpoint: string;
  body?: unknown;
};

/**
 * Logging callback for side effect results
 */
export type SideEffectResultLog = {
  phase: "onSubmit" | "onConfirmation";
  description: string;
  success: boolean;
  response?: unknown;
  error?: unknown;
  skipped?: boolean;
  skipReason?: string;
};

/**
 * Options for executing side effects
 */
export type ExecuteSideEffectOptions = {
  /** Base URL for the API (e.g., "http://localhost:4000/api/v0") */
  apiBaseUrl: string;
  /** JWT token for authentication */
  authToken: string;
  /** Whether to throw on critical failures (default: false) */
  throwOnCriticalFailure?: boolean;
  /** Custom fetch implementation (default: global fetch) */
  fetchImpl?: typeof fetch;
  /** Optional callback fired before each side effect API call */
  onRequest?: (log: SideEffectRequestLog) => void;
  /** Optional callback fired after each side effect completes */
  onResult?: (log: SideEffectResultLog) => void;
};

/**
 * Checks if a side effect condition is met
 *
 * @param condition - The condition to check
 * @param context - The submission context containing buildInputs
 * @returns True if the condition is met (or no condition specified)
 */
export function checkSideEffectCondition(
  condition: SideEffectCondition | undefined,
  context: SubmissionContext
): { shouldExecute: boolean; reason?: string } {
  if (!condition) {
    return { shouldExecute: true };
  }

  // Get the value from buildInputs using the path
  const value = getValueFromPath(context.buildInputs, condition.path);

  // Check if value matches expected
  const expectedValues = Array.isArray(condition.equals)
    ? condition.equals
    : [condition.equals];

  const matches = expectedValues.some((expected) => value === expected);

  if (!matches) {
    return {
      shouldExecute: false,
      reason: `Condition not met: ${condition.path} is "${value}", expected one of [${expectedValues.join(", ")}]`,
    };
  }

  return { shouldExecute: true };
}

/**
 * Executes a single side effect
 *
 * @param sideEffect - The side effect to execute
 * @param context - The submission context
 * @param options - Execution options
 * @param phase - The phase of execution (onSubmit or onConfirmation)
 * @returns Execution result
 */
export async function executeSideEffect(
  sideEffect: SideEffect,
  context: SubmissionContext,
  options: ExecuteSideEffectOptions,
  phase: "onSubmit" | "onConfirmation" = "onSubmit"
): Promise<SideEffectExecutionResult> {
  const { apiBaseUrl, authToken, fetchImpl = fetch, onRequest, onResult } = options;

  // Check conditional execution
  const conditionResult = checkSideEffectCondition(sideEffect.condition, context);
  if (!conditionResult.shouldExecute) {
    onResult?.({
      phase,
      description: sideEffect.def,
      success: true,
      skipped: true,
      skipReason: conditionResult.reason,
    });
    return {
      sideEffect,
      success: true,
      skipped: true,
    };
  }

  // Skip "Not implemented" endpoints
  if (sideEffect.endpoint === "Not implemented") {
    onResult?.({
      phase,
      description: sideEffect.def,
      success: true,
      skipped: true,
      skipReason: "Not implemented",
    });
    return {
      sideEffect,
      success: true,
      skipped: true,
    };
  }

  try {
    // Resolve path parameters
    const resolvedEndpoint = resolvePathParams(
      sideEffect.endpoint,
      sideEffect.pathParams,
      context
    );

    // Construct request body
    const body = constructRequestBody(sideEffect.body, context);

    // Log the request
    const url = `${apiBaseUrl}${resolvedEndpoint}`;
    onRequest?.({
      phase,
      description: sideEffect.def,
      method: sideEffect.method,
      endpoint: url,
      body,
    });

    // Make API call
    const response = await fetchImpl(url, {
      method: sideEffect.method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `API call failed with status ${response.status}: ${errorText}`
      );
    }

    const responseData = await response.json();

    // Log the result
    onResult?.({
      phase,
      description: sideEffect.def,
      success: true,
      response: responseData,
    });

    return {
      sideEffect,
      success: true,
      skipped: false,
      response: responseData,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    // Log the error
    onResult?.({
      phase,
      description: sideEffect.def,
      success: false,
      error: errorMessage,
    });

    return {
      sideEffect,
      success: false,
      skipped: false,
      error: errorMessage,
    };
  }
}

/**
 * Executes all onSubmit side effects for a transaction
 *
 * This function should be called by the T3 app template immediately after
 * a transaction is submitted to the blockchain.
 *
 * @param onSubmit - Array of onSubmit side effects from transaction definition
 * @param context - Submission context with transaction details
 * @param options - Execution options
 * @returns Execution results for all side effects
 *
 * @example
 * ```typescript
 * import { executeOnSubmit } from "@andamio/transactions";
 * import { MINT_MODULE_TOKENS } from "@andamio/transactions";
 *
 * // After submitting transaction
 * const txHash = await wallet.submitTx(signedTx);
 *
 * // Execute onSubmit side effects
 * const context: SubmissionContext = {
 *   txHash,
 *   signedCbor,
 *   unsignedCbor,
 *   userId,
 *   walletAddress,
 *   buildInputs,
 *   timestamp: new Date(),
 * };
 *
 * const result = await executeOnSubmit(
 *   MINT_MODULE_TOKENS.onSubmit,
 *   context,
 *   {
 *     apiBaseUrl: process.env.NEXT_PUBLIC_ANDAMIO_API_URL,
 *     authToken: session.token,
 *   }
 * );
 *
 * if (!result.success) {
 *   console.error("Some side effects failed:", result.criticalErrors);
 * }
 * ```
 */
export async function executeOnSubmit(
  onSubmit: OnSubmit | undefined,
  context: SubmissionContext,
  options: ExecuteSideEffectOptions
): Promise<ExecuteOnSubmitResult> {
  if (!onSubmit || onSubmit.length === 0) {
    return {
      success: true,
      results: [],
      criticalErrors: [],
    };
  }

  const results: SideEffectExecutionResult[] = [];
  const criticalErrors: string[] = [];

  // Execute all side effects sequentially
  for (const sideEffect of onSubmit) {
    const result = await executeSideEffect(sideEffect, context, options, "onSubmit");
    results.push(result);

    // Track critical failures
    if (!result.success && !result.skipped && sideEffect.critical) {
      const errorMsg = `Critical side effect failed: ${sideEffect.def} - ${result.error}`;
      criticalErrors.push(errorMsg);

      if (options.throwOnCriticalFailure) {
        throw new Error(errorMsg);
      }
    }
  }

  return {
    success: criticalErrors.length === 0,
    results,
    criticalErrors,
  };
}

/**
 * Helper to check if a side effect should be executed
 *
 * This checks:
 * 1. The endpoint is not "Not implemented"
 * 2. Any condition on the side effect is met (if context provided)
 *
 * @param sideEffect - The side effect to check
 * @param context - Optional submission context for condition checking
 * @returns True if the side effect should be executed
 */
export function shouldExecuteSideEffect(
  sideEffect: SideEffect,
  context?: SubmissionContext
): boolean {
  // Skip "Not implemented" endpoints
  if (sideEffect.endpoint === "Not implemented") {
    return false;
  }

  // If no context provided, we can't check conditions - assume should execute
  if (!context) {
    return true;
  }

  // Check condition if present
  const conditionResult = checkSideEffectCondition(sideEffect.condition, context);
  return conditionResult.shouldExecute;
}

/**
 * Helper to filter only executable side effects
 *
 * @param sideEffects - Array of side effects
 * @param context - Optional submission context for condition checking
 * @returns Filtered array of executable side effects
 */
export function getExecutableSideEffects(
  sideEffects: OnSubmit | undefined,
  context?: SubmissionContext
): SideEffect[] {
  if (!sideEffects) return [];
  return sideEffects.filter((se) => shouldExecuteSideEffect(se, context));
}
