/**
 * Transaction Parameter Schemas
 *
 * Zod schemas for validating transaction parameters before submission.
 * Extracted from @andamio/transactions package for use with the new
 * gateway auto-confirmation flow.
 *
 * ## Usage
 *
 * ```tsx
 * import { txSchemas, type TxParams } from "~/config/transaction-schemas";
 *
 * // Validate before submission
 * const result = txSchemas.COURSE_STUDENT_ASSIGNMENT_COMMIT.safeParse(formData);
 * if (!result.success) {
 *   console.error(result.error.flatten());
 *   return;
 * }
 *
 * // Use validated data
 * const params: TxParams["COURSE_STUDENT_ASSIGNMENT_COMMIT"] = result.data;
 * ```
 *
 * @see https://docs.andamio.io/docs/protocol/v2/transactions
 */

import { z } from "zod";
import type { TransactionType } from "./transaction-ui";

// =============================================================================
// Common Schema Building Blocks
// =============================================================================

/**
 * Alias schema - User access token alias
 * 1-31 alphanumeric characters
 */
export const aliasSchema = z.string().min(1).max(31);

/**
 * Policy ID schema - 56 character hex string
 * Used for course_id, project_id, contributor_state_id, etc.
 */
export const policyIdSchema = z.string().length(56);

/**
 * Hash schema - 64 character hex string
 * Used for slt_hash, task_hash, module_hash, etc.
 */
export const hashSchema = z.string().length(64);

/**
 * Short text schema - Max 140 characters
 * Used for assignment_info, project_info, task content, etc.
 */
export const shortTextSchema = z.string().max(140);

/**
 * Wallet data schema - Optional initiator data for transaction building
 */
export const walletDataSchema = z
  .object({
    used_addresses: z.array(z.string()),
    change_address: z.string(),
  })
  .optional();

/**
 * ListValue schema - Array of [asset_class, quantity] tuples
 * Used for deposit_value, native_assets, etc.
 */
export const listValueSchema = z.array(z.tuple([z.string(), z.number()]));

// =============================================================================
// Transaction Parameter Schemas
// =============================================================================

/**
 * All transaction parameter schemas mapped by transaction type
 */
export const txSchemas = {
  // ===========================================================================
  // Global Transactions
  // ===========================================================================

  /**
   * Mint access token to participate in the Andamio protocol
   */
  GLOBAL_GENERAL_ACCESS_TOKEN_MINT: z.object({
    initiator_data: z.string().min(1), // GYAddressBech32 - wallet address
    alias: aliasSchema,
  }),

  // ===========================================================================
  // Instance Transactions
  // ===========================================================================

  /**
   * Create a new course on-chain
   */
  INSTANCE_COURSE_CREATE: z.object({
    alias: aliasSchema,
    teachers: z.array(aliasSchema).min(1),
    initiator_data: walletDataSchema,
  }),

  /**
   * Create a new project on-chain
   */
  INSTANCE_PROJECT_CREATE: z.object({
    alias: aliasSchema,
    managers: z.array(aliasSchema),
    course_prereqs: z.array(
      z.tuple([
        policyIdSchema, // course_id
        z.array(hashSchema), // required module hashes
      ])
    ),
    deposit_value: listValueSchema,
    initiator_data: walletDataSchema,
  }),

  // ===========================================================================
  // Course - Owner Transactions
  // ===========================================================================

  /**
   * Add or remove teachers from a course
   */
  COURSE_OWNER_TEACHERS_MANAGE: z.object({
    alias: aliasSchema,
    course_id: policyIdSchema,
    teachers_to_add: z.array(aliasSchema),
    teachers_to_remove: z.array(aliasSchema),
    initiator_data: walletDataSchema,
  }),

  // ===========================================================================
  // Course - Teacher Transactions
  // ===========================================================================

  /**
   * Mint, update, or burn course modules
   */
  COURSE_TEACHER_MODULES_MANAGE: z.object({
    alias: aliasSchema,
    course_id: policyIdSchema,
    modules_to_mint: z.array(
      z.object({
        slts: z.array(z.string()),
        allowed_course_state_ids: z.array(policyIdSchema),
        prereq_slt_hashes: z.array(hashSchema),
      })
    ),
    modules_to_update: z.array(
      z.object({
        slt_hash: hashSchema,
        allowed_course_state_ids: z.array(policyIdSchema),
        prereq_slt_hashes: z.array(hashSchema),
      })
    ),
    modules_to_burn: z.array(hashSchema),
    initiator_data: walletDataSchema,
  }),

  /**
   * Assess student assignment submissions
   */
  COURSE_TEACHER_ASSIGNMENTS_ASSESS: z.object({
    alias: aliasSchema,
    course_id: policyIdSchema,
    assignment_decisions: z.array(
      z.object({
        alias: aliasSchema,
        outcome: z.enum(["accept", "refuse"]),
      })
    ),
    initiator_data: walletDataSchema,
  }),

  // ===========================================================================
  // Course - Student Transactions
  // ===========================================================================

  /**
   * Commit to an assignment (first-time enrollment or subsequent commitment)
   */
  COURSE_STUDENT_ASSIGNMENT_COMMIT: z.object({
    alias: aliasSchema,
    course_id: policyIdSchema,
    slt_hash: hashSchema,
    assignment_info: shortTextSchema.min(1),
    initiator_data: walletDataSchema,
    // Side effect params (optional, used by gateway for DB updates)
    module_code: z.string().optional(),
    network_evidence: z.unknown().optional(),
    network_evidence_hash: z.string().optional(),
  }),

  /**
   * Update assignment submission evidence
   */
  COURSE_STUDENT_ASSIGNMENT_UPDATE: z.object({
    alias: aliasSchema,
    course_id: policyIdSchema,
    assignment_info: shortTextSchema.min(1),
    initiator_data: walletDataSchema,
    // Side effect params (optional, used by gateway for DB updates)
    module_code: z.string().optional(),
    network_evidence: z.unknown().optional(),
    network_evidence_hash: z.string().optional(),
  }),

  /**
   * Claim course credential after completing all requirements
   */
  COURSE_STUDENT_CREDENTIAL_CLAIM: z.object({
    alias: aliasSchema,
    course_id: policyIdSchema,
    initiator_data: walletDataSchema,
  }),

  // ===========================================================================
  // Project - Owner Transactions
  // ===========================================================================

  /**
   * Add or remove managers from a project
   */
  PROJECT_OWNER_MANAGERS_MANAGE: z.object({
    alias: aliasSchema,
    project_id: policyIdSchema,
    managers_to_add: z.array(aliasSchema),
    managers_to_remove: z.array(aliasSchema),
  }),

  /**
   * Manage contributor blacklist
   */
  PROJECT_OWNER_BLACKLIST_MANAGE: z.object({
    alias: aliasSchema,
    project_id: policyIdSchema,
    aliases_to_add: z.array(aliasSchema),
    aliases_to_remove: z.array(aliasSchema),
  }),

  // ===========================================================================
  // Project - Manager Transactions
  // ===========================================================================

  /**
   * Add or remove tasks from a project
   */
  PROJECT_MANAGER_TASKS_MANAGE: z.object({
    alias: aliasSchema,
    project_id: policyIdSchema,
    contributor_state_id: policyIdSchema,
    prerequisites: z.array(
      z.object({
        course_id: policyIdSchema,
        assignment_ids: z.array(z.string()),
      })
    ),
    tasks_to_add: z.array(
      z.object({
        project_content: shortTextSchema,
        expiration_posix: z.number(),
        lovelace_amount: z.number(),
        native_assets: listValueSchema,
      })
    ),
    tasks_to_remove: z.array(
      z.object({
        project_content: shortTextSchema,
        expiration_posix: z.number(),
        lovelace_amount: z.number(),
        native_assets: listValueSchema,
      })
    ),
    deposit_value: listValueSchema,
    // Side effect params (optional, used by gateway for DB updates)
    task_codes: z.array(z.string()).optional(),
  }),

  /**
   * Assess contributor task submissions
   */
  PROJECT_MANAGER_TASKS_ASSESS: z.object({
    alias: aliasSchema,
    project_id: policyIdSchema,
    contributor_state_id: policyIdSchema,
    task_decisions: z.array(
      z.object({
        alias: aliasSchema,
        outcome: z.enum(["accept", "refuse", "deny"]),
      })
    ),
    // Side effect params (optional, used by gateway for DB updates)
    task_hash: hashSchema.optional(),
    contributor_alias: aliasSchema.optional(),
    decision: z.enum(["ACCEPTED", "REFUSED", "DENIED"]).optional(),
  }),

  // ===========================================================================
  // Project - Contributor Transactions
  // ===========================================================================

  /**
   * Commit to a new task in a project
   */
  PROJECT_CONTRIBUTOR_TASK_COMMIT: z.object({
    alias: aliasSchema,
    project_id: policyIdSchema,
    contributor_state_id: policyIdSchema,
    task_hash: hashSchema,
    task_info: shortTextSchema,
    tasks: z
      .array(
        z.object({
          task_hash: hashSchema,
          task_info: shortTextSchema,
          contributor_state_policy_id: policyIdSchema,
        })
      )
      .min(1)
      .max(1),
    // Side effect params (optional, used by gateway for DB updates)
    evidence: z.unknown().optional(),
  }),

  /**
   * Perform an action on current task (update submission, etc.)
   */
  PROJECT_CONTRIBUTOR_TASK_ACTION: z.object({
    alias: aliasSchema,
    project_id: policyIdSchema,
    project_info: shortTextSchema.optional(),
    // Side effect params (optional, used by gateway for DB updates)
    task_hash: hashSchema.optional(),
    evidence: z.unknown().optional(),
  }),

  /**
   * Claim credentials for completed project tasks
   */
  PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM: z.object({
    alias: aliasSchema,
    project_id: policyIdSchema,
    contributor_state_id: policyIdSchema,
  }),

  // ===========================================================================
  // Project - User (Treasury) Transactions
  // ===========================================================================

  /**
   * Add funds to project treasury
   */
  PROJECT_USER_TREASURY_ADD_FUNDS: z.object({
    alias: aliasSchema,
    project_id: policyIdSchema,
    funds: listValueSchema,
  }),
} as const satisfies Record<TransactionType, z.ZodObject<z.ZodRawShape>>;

// =============================================================================
// Type Inference
// =============================================================================

/**
 * Inferred TypeScript types for each transaction's parameters
 *
 * @example
 * ```tsx
 * const params: TxParams["COURSE_STUDENT_ASSIGNMENT_COMMIT"] = {
 *   alias: "student1",
 *   course_id: "abc123...",
 *   slt_hash: "def456...",
 *   assignment_info: "My submission hash",
 * };
 * ```
 */
export type TxParams = {
  [K in TransactionType]: z.infer<(typeof txSchemas)[K]>;
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Validate transaction parameters and return typed result
 */
export function validateTxParams<T extends TransactionType>(
  txType: T,
  params: unknown
): z.SafeParseReturnType<unknown, TxParams[T]> {
  return txSchemas[txType].safeParse(params) as z.SafeParseReturnType<
    unknown,
    TxParams[T]
  >;
}

/**
 * Get schema for a transaction type
 */
export function getTxSchema<T extends TransactionType>(
  txType: T
): (typeof txSchemas)[T] {
  return txSchemas[txType];
}

/**
 * Parse and validate params, throwing on error
 */
export function parseTxParams<T extends TransactionType>(
  txType: T,
  params: unknown
): TxParams[T] {
  return txSchemas[txType].parse(params) as TxParams[T];
}
