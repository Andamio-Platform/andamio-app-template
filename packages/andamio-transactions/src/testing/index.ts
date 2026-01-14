/**
 * Testing utilities for transaction side effects
 *
 * This module provides utilities for testing side effect definitions:
 * - Mock context creation
 * - Path parameter resolution
 * - Request body construction
 * - Endpoint validation
 */

import type {
  SideEffect,
  BodyField,
  PathParams,
  SubmissionContext,
  ConfirmationContext,
} from "../types";

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
export function resolvePathParams(
  endpoint: string,
  pathParams: PathParams | undefined,
  context: SubmissionContext | ConfirmationContext
): string {
  if (!pathParams) return endpoint;

  let resolved = endpoint;
  for (const [paramName, contextPath] of Object.entries(pathParams)) {
    const value = getValueFromPath(context, contextPath);
    if (value === undefined) {
      throw new Error(
        `Path parameter "${paramName}" could not be resolved from context path "${contextPath}"`
      );
    }
    resolved = resolved.replace(`{${paramName}}`, String(value));
  }

  return resolved;
}

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
export function constructRequestBody(
  bodyDef: Record<string, BodyField> | undefined,
  context: SubmissionContext | ConfirmationContext
): Record<string, unknown> | undefined {
  if (!bodyDef) return undefined;

  const body: Record<string, unknown> = {};

  // Debug: log the body definition and context keys
  console.log("[constructRequestBody] bodyDef:", bodyDef);
  console.log("[constructRequestBody] context keys:", Object.keys(context));
  console.log("[constructRequestBody] context.buildInputs:", (context as SubmissionContext).buildInputs);

  for (const [fieldName, fieldDef] of Object.entries(bodyDef)) {
    if (fieldDef.source === "literal") {
      body[fieldName] = fieldDef.value;
    } else if (fieldDef.source === "context") {
      const value = getValueFromPath(context, fieldDef.path);
      console.log(`[constructRequestBody] Resolving ${fieldName}: path="${fieldDef.path}" -> value=`, value);
      if (value !== undefined) {
        body[fieldName] = value;
      }
    } else if (fieldDef.source === "onChainData") {
      // onChainData only exists in ConfirmationContext
      if ("onChainData" in context) {
        const value = getValueFromPath(context.onChainData, fieldDef.path);
        if (value !== undefined) {
          body[fieldName] = value;
        }
      }
    }
  }

  console.log("[constructRequestBody] Final body:", body);
  return body;
}

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
export function getValueFromPath(
  obj: any,
  path: string
): unknown {
  const parts = path.split(".");
  let current = obj;

  for (const part of parts) {
    if (current === undefined || current === null) {
      return undefined;
    }

    // Handle array indexing: "mints[0]"
    const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, arrayName, index] = arrayMatch;
      current = current[arrayName!]?.[parseInt(index!, 10)];
    } else {
      current = current[part];
    }
  }

  return current;
}

/**
 * Validates that a side effect definition can be executed
 * Returns validation errors if any
 */
export function validateSideEffect(
  sideEffect: SideEffect,
  context: SubmissionContext | ConfirmationContext
): string[] {
  const errors: string[] = [];

  // Check endpoint is not empty
  if (!sideEffect.endpoint) {
    errors.push("Endpoint is required");
  }

  // Check method is valid
  if (!sideEffect.method) {
    errors.push("Method is required");
  }

  // Skip validation for "Not implemented" endpoints
  if (sideEffect.endpoint === "Not implemented") {
    return errors;
  }

  // Try to resolve path parameters
  try {
    resolvePathParams(sideEffect.endpoint, sideEffect.pathParams, context);
  } catch (error) {
    errors.push(`Path parameter resolution failed: ${error}`);
  }

  // Try to construct body
  if (sideEffect.body) {
    try {
      const body = constructRequestBody(sideEffect.body, context);
      if (!body || Object.keys(body).length === 0) {
        errors.push("Body construction resulted in empty object");
      }
    } catch (error) {
      errors.push(`Body construction failed: ${error}`);
    }
  }

  // Validate body is present for methods that require it
  if (
    ["POST", "PATCH", "PUT"].includes(sideEffect.method) &&
    !sideEffect.body
  ) {
    errors.push(`Method ${sideEffect.method} requires a body definition`);
  }

  return errors;
}

/**
 * Creates a mock SubmissionContext for testing
 */
export function createMockSubmissionContext(
  overrides?: Partial<SubmissionContext>
): SubmissionContext {
  return {
    txHash: "abc123def456",
    signedCbor: "84a30081825820...",
    unsignedCbor: "84a30081825820...",
    userId: "user_123",
    walletAddress: "addr1qy...",
    buildInputs: {
      user_access_token: "access_token_unit_123",
      policy: "policy1234567890abcdef",
      module_infos: JSON.stringify([
        {
          moduleId: "MODULE_1",
          slts: [{ sltId: "1", sltContent: "Learn basics" }],
          assignmentContent: "Complete the assignment",
        },
      ]),
    },
    timestamp: new Date("2025-01-20T12:00:00Z"),
    ...overrides,
  };
}

/**
 * Creates a mock ConfirmationContext for testing
 */
export function createMockConfirmationContext(
  overrides?: Partial<ConfirmationContext>
): ConfirmationContext {
  return {
    txHash: "abc123def456",
    signedCbor: "84a30081825820...",
    buildInputs: {
      user_access_token: "access_token_unit_123",
      policy: "policy1234567890abcdef",
      module_infos: JSON.stringify([
        {
          moduleId: "MODULE_1",
          slts: [{ sltId: "1", sltContent: "Learn basics" }],
          assignmentContent: "Complete the assignment",
        },
      ]),
    },
    userId: "user_123",
    walletAddress: "addr1qy...",
    blockHeight: 1000000,
    timestamp: new Date("2025-01-20T12:10:00Z"),
    onChainData: {
      mints: [
        {
          policyId: "policy1234567890abcdef",
          assetName: "4d4f44554c455f31", // "MODULE_1" in hex
          quantity: 1,
        },
      ],
      metadata: {
        "721": {
          policy1234567890abcdef: {
            MODULE_1: {
              name: "Module 1 Credential",
              description: "Credential for completing Module 1",
            },
          },
        },
      },
      outputs: [
        {
          address: "addr1qy...",
          value: {
            lovelace: "2000000",
            assets: [
              {
                unit: "policy1234567890abcdef4d4f44554c455f31",
                quantity: "1",
              },
            ],
          },
          datum: null,
          datumHash: null,
        },
      ],
    },
    ...overrides,
  };
}

/**
 * Tests a side effect against a context
 * Returns the resolved endpoint and constructed body
 */
export function testSideEffect(
  sideEffect: SideEffect,
  context: SubmissionContext | ConfirmationContext
): {
  valid: boolean;
  errors: string[];
  resolvedEndpoint?: string;
  requestBody?: Record<string, unknown>;
} {
  const errors = validateSideEffect(sideEffect, context);

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  try {
    const resolvedEndpoint = resolvePathParams(
      sideEffect.endpoint,
      sideEffect.pathParams,
      context
    );
    const requestBody = constructRequestBody(sideEffect.body, context);

    return {
      valid: true,
      errors: [],
      resolvedEndpoint,
      requestBody,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [`Unexpected error: ${error}`],
    };
  }
}
