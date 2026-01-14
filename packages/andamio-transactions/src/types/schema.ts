import { z } from "zod";
import type { SubmissionContext, ConfirmationContext } from "./context";

/**
 * Transaction name identifier
 * Matches the transaction IDs from protocol YAML files (e.g., "general.access-token-mint")
 */
export type TxName =
  // V1 - General
  | "PUBLISH_TX"
  | "ADD_COURSE_MANAGERS"
  | "ADD_PROJECT_MANAGERS"
  // V1 - Admin
  | "INIT_COURSE"
  | "ADD_COURSE_CREATORS"
  | "RM_COURSE_CREATORS"
  | "INIT_PROJECT_STEP_1"
  | "INIT_PROJECT_STEP_2"
  | "INIT_SINGLE_CONTRIBUTOR_STATE"
  | "ADD_PROJECT_CREATORS"
  | "RM_PROJECT_CREATORS"
  // V1 - Course Creator
  | "MINT_MODULE_TOKENS"
  | "ACCEPT_ASSIGNMENT"
  | "DENY_ASSIGNMENT"
  // V1 - Project Creator
  | "MINT_TREASURY_TOKEN"
  | "MANAGE_TREASURY_TOKEN"
  | "ACCEPT_PROJECT"
  | "REFUSE_PROJECT"
  | "DENY_PROJECT"
  // V1 - Contributor
  | "MINT_PROJECT_STATE"
  | "BURN_PROJECT_STATE"
  | "COMMIT_PROJECT"
  | "SUBMIT_PROJECT"
  | "ADD_INFO"
  | "GET_REWARDS"
  | "UNLOCK_PROJECT"
  // V1 - Student
  | "MINT_LOCAL_STATE"
  | "BURN_LOCAL_STATE"
  | "COMMIT_TO_ASSIGNMENT"
  | "UPDATE_ASSIGNMENT"
  | "LEAVE_ASSIGNMENT"
  // V2 - Global General (1)
  | "GLOBAL_GENERAL_ACCESS_TOKEN_MINT"
  // V2 - Instance Owner (2)
  | "INSTANCE_COURSE_CREATE"
  | "INSTANCE_PROJECT_CREATE"
  // V2 - Course Owner (1)
  | "COURSE_OWNER_TEACHERS_MANAGE"
  // V2 - Course Teacher (2)
  | "COURSE_TEACHER_MODULES_MANAGE"
  | "COURSE_TEACHER_ASSIGNMENTS_ASSESS"
  // V2 - Course Student (3)
  | "COURSE_STUDENT_ASSIGNMENT_COMMIT"
  | "COURSE_STUDENT_ASSIGNMENT_UPDATE"
  | "COURSE_STUDENT_CREDENTIAL_CLAIM"
  // V2 - Project Owner (2)
  | "PROJECT_OWNER_MANAGERS_MANAGE"
  | "PROJECT_OWNER_BLACKLIST_MANAGE"
  // V2 - Project Manager (2)
  | "PROJECT_MANAGER_TASKS_MANAGE"
  | "PROJECT_MANAGER_TASKS_ASSESS"
  // V2 - Project Contributor (3)
  | "PROJECT_CONTRIBUTOR_TASK_COMMIT"
  | "PROJECT_CONTRIBUTOR_TASK_ACTION"
  | "PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM";

/**
 * User role that can execute this transaction
 *
 * V2 roles align with API path structure:
 * - general: Cross-system transactions (access tokens)
 * - instance-owner: Creates courses/projects at instance level
 * - course-owner: Course administration (teachers)
 * - course-teacher: Course instruction (modules, assessments)
 * - course-student: Course participation (enroll, assignments, credentials)
 * - project-owner: Project administration (managers, blacklist)
 * - project-manager: Project management (tasks, assessments)
 * - project-contributor: Project participation (enroll, tasks, credentials)
 */
export type TransactionRole =
  // Legacy V1 roles
  | "general"
  | "admin"
  | "course-creator"
  | "teacher"
  | "project-creator"
  | "contributor"
  | "student"
  // V2 roles (aligned with API paths)
  | "instance-owner"
  | "course-owner"
  | "course-teacher"
  | "course-student"
  | "project-owner"
  | "project-manager"
  | "project-contributor";

/**
 * Protocol version (maps to YAML spec versions)
 */
export type ProtocolVersion = "v1" | "v2";

/**
 * Reference to the protocol specification YAML file
 */
export type ProtocolSpec = {
  /** Protocol version (v1, v2, etc.) */
  version: ProtocolVersion;

  /** Transaction ID from YAML (e.g., "general.access-token-mint") */
  id: string;

  /** Path to YAML file in andamio-docs repo */
  yamlPath: string;

  /** Tokens required to execute this transaction (from YAML metadata.requires_tokens) */
  requiredTokens?: string[];
};

/**
 * Transaction cost breakdown
 */
export type TransactionCost = {
  /** Estimated transaction fee in lovelace */
  txFee: number;

  /** Minimum ADA deposit required (e.g., for UTXOs) */
  minDeposit?: number;

  /** Additional costs (platform fees, etc.) */
  additionalCosts?: Array<{
    label: string;
    amount: number; // in lovelace
  }>;
};

/**
 * Helper function metadata for formatting transaction inputs
 */
export type InputHelper = {
  /** Name of the exported helper function (e.g., "formatModuleInfosForMintModuleTokens") */
  helperName: string;

  /** Description of what the helper does and when to use it */
  description: string;

  /** Optional usage example showing how to call the helper */
  example?: string;
};

/**
 * Configuration for building the transaction
 */
export type BuildTxConfig = {
  /**
   * Zod schema for transaction API inputs only (optional for backward compatibility)
   * These are the parameters required by the transaction builder endpoint
   * If not provided, inputSchema is assumed to contain all parameters
   */
  txApiSchema?: z.ZodSchema;

  /**
   * Zod schema for additional side effect parameters (optional)
   * These parameters are not used by the transaction API but are needed
   * for onSubmit/onConfirmation side effects
   */
  sideEffectSchema?: z.ZodSchema;

  /**
   * Combined schema for validating all build inputs
   * If txApiSchema is not provided, this is the only schema used (legacy mode)
   * If txApiSchema is provided, this should be the merge of txApiSchema and sideEffectSchema
   * Use this for validating inputs before execution
   */
  inputSchema: z.ZodSchema;

  /** How to build the transaction */
  builder: {
    type: "api-endpoint" | "local-function";
    /** API endpoint path (e.g., "/tx/course-creator/mint-module-tokens") */
    endpoint?: string;
    /** Local builder function (alternative to endpoint) */
    function?: (input: unknown) => Promise<string>; // returns unsigned CBOR
  };

  /** Estimated cost breakdown */
  estimatedCost?: TransactionCost;

  /**
   * Helper functions for formatting complex input fields
   * Maps input field names to their helper function metadata
   */
  inputHelpers?: Record<string, InputHelper>;
};

/**
 * Retry policy for side effects
 */
export type RetryPolicy = {
  /** Maximum number of retry attempts */
  maxAttempts: number;

  /** Backoff delay in milliseconds */
  backoffMs: number;
};

/**
 * HTTP methods for side effect API calls
 */
export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

/**
 * Path parameter mapping
 * Maps path parameter names to their sources in the context
 */
export type PathParams = Record<string, string>;

/**
 * Body field mapping
 * Maps request body field names to their sources in the context or literal values
 */
export type BodyField =
  | { source: "context"; path: string } // Extract from context (e.g., "txHash", "buildInputs.policy")
  | { source: "onChainData"; path: string } // Extract from onChainData (e.g., "mints[0].policyId")
  | { source: "literal"; value: unknown }; // Literal value (e.g., { source: "literal", value: "PENDING_TX" })

/**
 * Condition for conditional side effect execution
 * Specifies a path in buildInputs and the expected value for the side effect to execute
 */
export type SideEffectCondition = {
  /** Path to check in buildInputs (e.g., "hasCommitment", "assessmentResult") */
  path: string;

  /**
   * Expected value(s) for the side effect to execute
   * If an array, side effect executes if the value matches ANY item in the array
   */
  equals: unknown | unknown[];
};

/**
 * Side effect definition
 *
 * Defines an API call to execute during transaction lifecycle.
 * The transaction monitoring service uses the payload definition to construct
 * the request from transaction context.
 */
export type SideEffect = {
  /** Human-readable description of what this side effect does (e.g., "Update Course Module Status") */
  def: string;

  /** HTTP method for the API call */
  method: HttpMethod;

  /**
   * API endpoint to call (relative to API base URL) or "Not implemented" if not yet available
   * Can include path parameters in curly braces: "/course-modules/{courseNftPolicyId}/{moduleCode}/status"
   */
  endpoint: string;

  /**
   * Path parameter mappings (optional)
   * Maps path parameter names (from endpoint) to their sources in the context
   * Example: { courseNftPolicyId: "buildInputs.policy", moduleCode: "buildInputs.moduleCode" }
   */
  pathParams?: PathParams;

  /**
   * Request body field mappings (optional, required for POST/PATCH/PUT)
   * Maps request body field names to their sources in the context or literal values
   * Example: {
   *   status: { source: "literal", value: "PENDING_TX" },
   *   pendingTxHash: { source: "context", path: "txHash" }
   * }
   */
  body?: Record<string, BodyField>;

  /** Whether this side effect is critical (must succeed). Defaults to false if not specified. */
  critical?: boolean;

  /** Optional retry policy */
  retry?: RetryPolicy;

  /**
   * Optional condition for execution (optional)
   * If specified, the side effect only executes when the condition is met
   * Useful for transactions with optional side effects based on input parameters
   *
   * Example: { path: "hasCommitment", equals: true }
   * Example: { path: "assessmentResult", equals: ["accept", "deny"] }
   */
  condition?: SideEffectCondition;
};

/**
 * Side effects to execute on transaction submission
 */
export type OnSubmit = Array<SideEffect>;

/**
 * Side effects to execute on transaction confirmation
 */
export type OnConfirmation = Array<SideEffect>;

/**
 * UI metadata for displaying transaction in user interface
 */
export type UIMetadata = {
  /** Button text */
  buttonText: string;

  /** Dialog/modal title */
  title: string;

  /** Description paragraphs */
  description: string[];

  /** Link to documentation */
  footerLink: string;

  /** Link text for documentation */
  footerLinkText: string;

  /** Success message after transaction completes */
  successInfo: string;
};

/**
 * Documentation references
 */
export type Documentation = {
  /** Link to protocol documentation */
  protocolDocs: string;

  /** Link to API documentation (optional) */
  apiDocs?: string;

  /** Links to example implementations (optional) */
  examples?: string[];
};

/**
 * Complete transaction definition
 *
 * This schema unifies:
 * 1. Protocol specification (YAML files from andamio-docs)
 * 2. API lifecycle (build, submit, confirm)
 * 3. Side effects (database updates, notifications)
 * 4. UI metadata (user-facing strings)
 */
export type AndamioTransactionDefinition = {
  /** Transaction type identifier */
  txType: TxName;

  /** User role that can execute this transaction */
  role: TransactionRole;

  /** Reference to protocol specification */
  protocolSpec: ProtocolSpec;

  /** Configuration for building the transaction */
  buildTxConfig: BuildTxConfig;

  /**
   * Whether the transaction requires partial signing
   * Set to true for V2 transactions built by Atlas API, as they typically
   * require additional signatures from the backend. Eternl and other wallets
   * will fail if this is not set correctly.
   * @default true for V2 API transactions
   */
  partialSign?: boolean;

  /** Side effects on transaction submission (optional) */
  onSubmit?: OnSubmit;

  /** Side effects on transaction confirmation */
  onConfirmation: OnConfirmation;

  /** UI metadata */
  ui: UIMetadata;

  /** Documentation references */
  docs: Documentation;
};

/**
 * Transaction registry type
 * Maps transaction names to their definitions
 */
export type TransactionRegistry = Record<TxName, AndamioTransactionDefinition>;

// =============================================================================
// V2 API Response Types
// =============================================================================

/**
 * Standard unsigned transaction response
 * Most transaction endpoints return this format
 */
export type UnsignedTxResponse = {
  unsigned_tx: string;
};

/**
 * Response from course creation endpoint
 * Returns the course_id (policy ID) in addition to the unsigned transaction
 *
 * @see /v2/tx/instance/owner/course/create
 */
export type UnsignedTxResponseInitCourse = {
  unsigned_tx: string;
  course_id: string; // GYMintingPolicyId (56 char hex)
};

/**
 * Response from project creation endpoint
 * Returns the project_id (policy ID) in addition to the unsigned transaction
 *
 * @see /v2/tx/instance/owner/project/create
 */
export type UnsignedTxResponseInitProject = {
  unsigned_tx: string;
  project_id: string; // GYMintingPolicyId (56 char hex)
};

// =============================================================================
// V2 API Common Data Types
// =============================================================================

/**
 * Wallet data for initiating transactions
 * Used for transactions that require wallet context
 */
export type InitiatorData = {
  used_addresses: string[]; // GYAddressBech32[]
  change_address: string; // GYAddressBech32
};

/**
 * List value representing ADA and native assets
 * Used in project deposit/reward specifications
 */
export type ListValue = {
  lovelace: number;
  native_assets: Array<{
    policy_id: string; // GYMintingPolicyId
    assets: Array<{
      asset_name: string;
      quantity: number;
    }>;
  }>;
};

/**
 * Module specification for minting
 * Used in COURSE_TEACHER_MODULES_MANAGE
 */
export type MintModuleV2 = {
  slts: string[];
  allowed_students_v2: string[]; // GYMintingPolicyId[]
  prerequisite_assignments_v2: string[]; // SltHash[] (64 char hex)
};

/**
 * Module specification for updating
 * Used in COURSE_TEACHER_MODULES_MANAGE
 */
export type UpdateModuleV2 = {
  slt_hash: string; // SltHash (64 char hex)
  allowed_students_v2: string[]; // GYMintingPolicyId[]
  prerequisite_assignments_v2: string[]; // SltHash[] (64 char hex)
};

/**
 * Assignment decision for teacher assessment
 * Used in COURSE_TEACHER_ASSIGNMENTS_ASSESS
 */
export type AssignmentDecision = {
  alias: string; // Student's alias
  outcome: "accept" | "refuse";
};

/**
 * Task specification for project management
 * Used in PROJECT_MANAGER_TASKS_MANAGE
 */
export type TaskToAdd = {
  project_content: string; // Task hash (64 char hex)
  expiration_time: number; // Unix timestamp (POSIXTime)
  lovelace_amount: number;
  native_assets: ListValue["native_assets"];
};

/**
 * Task decision for manager assessment
 * Used in PROJECT_MANAGER_TASKS_ASSESS
 */
export type TaskDecision = {
  task_hash: string; // TaskHash (64 char hex)
  outcome: "accept" | "refuse" | "deny";
};

/**
 * Commit data for course enrollment
 * Used in COURSE_STUDENT_ASSIGNMENT_COMMIT
 */
export type CommitData = {
  slt_hash: string; // SltHash (64 char hex)
  assignment_info: string; // Assignment info hash
};
