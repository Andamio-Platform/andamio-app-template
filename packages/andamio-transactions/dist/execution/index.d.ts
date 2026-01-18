/**
 * Side effect execution utilities
 *
 * These utilities are used by the T3 app template to execute onSubmit side effects
 * after a transaction is submitted.
 */
import type { SideEffect, SubmissionContext, OnSubmit, SideEffectCondition } from "../types";
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
export declare function checkSideEffectCondition(condition: SideEffectCondition | undefined, context: SubmissionContext): {
    shouldExecute: boolean;
    reason?: string;
};
/**
 * Executes a single side effect
 *
 * @param sideEffect - The side effect to execute
 * @param context - The submission context
 * @param options - Execution options
 * @param phase - The phase of execution (onSubmit or onConfirmation)
 * @returns Execution result
 */
export declare function executeSideEffect(sideEffect: SideEffect, context: SubmissionContext, options: ExecuteSideEffectOptions, phase?: "onSubmit" | "onConfirmation"): Promise<SideEffectExecutionResult>;
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
 *     apiBaseUrl: "/api/gateway/api/v2",
 *     authToken: session.token,
 *   }
 * );
 *
 * if (!result.success) {
 *   console.error("Some side effects failed:", result.criticalErrors);
 * }
 * ```
 */
export declare function executeOnSubmit(onSubmit: OnSubmit | undefined, context: SubmissionContext, options: ExecuteSideEffectOptions): Promise<ExecuteOnSubmitResult>;
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
export declare function shouldExecuteSideEffect(sideEffect: SideEffect, context?: SubmissionContext): boolean;
/**
 * Helper to filter only executable side effects
 *
 * @param sideEffects - Array of side effects
 * @param context - Optional submission context for condition checking
 * @returns Filtered array of executable side effects
 */
export declare function getExecutableSideEffects(sideEffects: OnSubmit | undefined, context?: SubmissionContext): SideEffect[];
