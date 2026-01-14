/**
 * Testing utilities for transaction side effects
 *
 * This module provides utilities for testing side effect definitions:
 * - Mock context creation
 * - Path parameter resolution
 * - Request body construction
 * - Endpoint validation
 */
import type { SideEffect, BodyField, PathParams, SubmissionContext, ConfirmationContext } from "../types";
/**
 * Resolves path parameters in an endpoint from context
 *
 * @example
 * ```typescript
 * const endpoint = "/course-modules/{courseNftPolicyId}/{moduleCode}/status";
 * const pathParams = {
 *   courseNftPolicyId: "buildInputs.policy",
 *   moduleCode: "buildInputs.moduleCode"
 * };
 * const resolved = resolvePathParams(endpoint, pathParams, context);
 * // => "/course-modules/policy123.../MODULE_1/status"
 * ```
 */
export declare function resolvePathParams(endpoint: string, pathParams: PathParams | undefined, context: SubmissionContext | ConfirmationContext): string;
/**
 * Constructs a request body from body field mappings and context
 *
 * @example
 * ```typescript
 * const bodyDef = {
 *   status: { source: "literal", value: "PENDING_TX" },
 *   pendingTxHash: { source: "context", path: "txHash" }
 * };
 * const body = constructRequestBody(bodyDef, context);
 * // => { status: "PENDING_TX", pendingTxHash: "abc123..." }
 * ```
 */
export declare function constructRequestBody(bodyDef: Record<string, BodyField> | undefined, context: SubmissionContext | ConfirmationContext): Record<string, unknown> | undefined;
/**
 * Extracts a value from an object using a dot-notation path
 * Supports array indexing: "mints[0].assetName"
 *
 * @example
 * ```typescript
 * const obj = { buildInputs: { policy: "abc123" } };
 * getValueFromPath(obj, "buildInputs.policy"); // => "abc123"
 *
 * const arr = { mints: [{ assetName: "token1" }] };
 * getValueFromPath(arr, "mints[0].assetName"); // => "token1"
 * ```
 */
export declare function getValueFromPath(obj: any, path: string): unknown;
/**
 * Validates that a side effect definition can be executed
 * Returns validation errors if any
 */
export declare function validateSideEffect(sideEffect: SideEffect, context: SubmissionContext | ConfirmationContext): string[];
/**
 * Creates a mock SubmissionContext for testing
 */
export declare function createMockSubmissionContext(overrides?: Partial<SubmissionContext>): SubmissionContext;
/**
 * Creates a mock ConfirmationContext for testing
 */
export declare function createMockConfirmationContext(overrides?: Partial<ConfirmationContext>): ConfirmationContext;
/**
 * Tests a side effect against a context
 * Returns the resolved endpoint and constructed body
 */
export declare function testSideEffect(sideEffect: SideEffect, context: SubmissionContext | ConfirmationContext): {
    valid: boolean;
    errors: string[];
    resolvedEndpoint?: string;
    requestBody?: Record<string, unknown>;
};
