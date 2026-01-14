"use strict";
/**
 * Side effect execution utilities
 *
 * These utilities are used by the T3 app template to execute onSubmit side effects
 * after a transaction is submitted.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSideEffectCondition = checkSideEffectCondition;
exports.executeSideEffect = executeSideEffect;
exports.executeOnSubmit = executeOnSubmit;
exports.shouldExecuteSideEffect = shouldExecuteSideEffect;
exports.getExecutableSideEffects = getExecutableSideEffects;
const testing_1 = require("../testing");
/**
 * Checks if a side effect condition is met
 *
 * @param condition - The condition to check
 * @param context - The submission context containing buildInputs
 * @returns True if the condition is met (or no condition specified)
 */
function checkSideEffectCondition(condition, context) {
    if (!condition) {
        return { shouldExecute: true };
    }
    // Get the value from buildInputs using the path
    const value = (0, testing_1.getValueFromPath)(context.buildInputs, condition.path);
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
async function executeSideEffect(sideEffect, context, options, phase = "onSubmit") {
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
        const resolvedEndpoint = (0, testing_1.resolvePathParams)(sideEffect.endpoint, sideEffect.pathParams, context);
        // Construct request body
        const body = (0, testing_1.constructRequestBody)(sideEffect.body, context);
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
            throw new Error(`API call failed with status ${response.status}: ${errorText}`);
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
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
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
async function executeOnSubmit(onSubmit, context, options) {
    if (!onSubmit || onSubmit.length === 0) {
        return {
            success: true,
            results: [],
            criticalErrors: [],
        };
    }
    const results = [];
    const criticalErrors = [];
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
function shouldExecuteSideEffect(sideEffect, context) {
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
function getExecutableSideEffects(sideEffects, context) {
    if (!sideEffects)
        return [];
    return sideEffects.filter((se) => shouldExecuteSideEffect(se, context));
}
