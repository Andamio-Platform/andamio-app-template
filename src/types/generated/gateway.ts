/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export enum AndamioDbClientReviewAssignmentCommitmentV2RequestDecision {
  ReviewAssignmentCommitmentV2RequestDecisionAccept = "accept",
  ReviewAssignmentCommitmentV2RequestDecisionRefuse = "refuse",
}

export enum AndamioDbClientCourseModuleV2ModuleStatus {
  CourseModuleV2ModuleStatusAPPROVED = "APPROVED",
  CourseModuleV2ModuleStatusARCHIVED = "ARCHIVED",
  CourseModuleV2ModuleStatusDEPRECATED = "DEPRECATED",
  CourseModuleV2ModuleStatusDRAFT = "DRAFT",
  CourseModuleV2ModuleStatusONCHAIN = "ON_CHAIN",
  CourseModuleV2ModuleStatusPENDINGTX = "PENDING_TX",
}

export enum AndamioDbClientAggregateUpdateModuleV2RequestStatus {
  AggregateUpdateModuleV2RequestStatusAPPROVED = "APPROVED",
}

export enum AndamioDbClientAggregateUpdateErrorResponseFailedOperationOperation {
  Approve = "approve",
  Create = "create",
  Delete = "delete",
  Update = "update",
}

export enum AndamioDbClientAggregateUpdateErrorResponseFailedOperationEntity {
  AggregateUpdateErrorResponseFailedOperationEntityAssignment = "assignment",
  AggregateUpdateErrorResponseFailedOperationEntityIntroduction = "introduction",
  AggregateUpdateErrorResponseFailedOperationEntityLesson = "lesson",
  AggregateUpdateErrorResponseFailedOperationEntityModule = "module",
  AggregateUpdateErrorResponseFailedOperationEntitySlt = "slt",
}

export enum AndamioDbClientAggregateUpdateErrorResponseCode {
  BADREQUEST = "BAD_REQUEST",
  INVALIDSLTHASH = "INVALID_SLT_HASH",
  MODULENOTFOUND = "MODULE_NOT_FOUND",
  SLTLOCKED = "SLT_LOCKED",
  UNAUTHORIZED = "UNAUTHORIZED",
}

export interface AdminViewmodelsSetUserRoleRequest {
  /** @example 1 */
  tier_id?: number;
  /** @example "pro" */
  tier_name?: string;
  /** @example "123e4567-e89b-12d3-a456-426614174000" */
  user_id: string;
}

export interface AdminViewmodelsSetUserRoleResponse {
  /** @example "User role updated successfully." */
  message?: string;
  /**
   * @min 1
   * @example 1
   */
  tier_id: number;
  /**
   * @minLength 1
   * @example "pro"
   */
  tier_name: string;
  /** @example "123e4567-e89b-12d3-a456-426614174000" */
  user_id?: string;
}

export interface AndamioApiInternalInternalApiAndamioDbClientAddTeachersV2Request {
  aliases?: string[];
  course_id?: string;
}

export interface AndamioApiInternalInternalApiAndamioDbClientAssignmentV2 {
  /** ContentJson Tiptap JSON content */
  content_json?: Record<string, any>;
  created_by_alias?: string;
  description?: string;
  image_url?: string;
  is_live?: boolean;
  title?: string;
  video_url?: string;
}

export interface AndamioApiInternalInternalApiAndamioDbClientClaimCredentialV2Request {
  course_id?: string;
  course_module_code?: string;
  pending_tx_hash?: string;
}

export interface AndamioApiInternalInternalApiAndamioDbClientCourseModuleV2 {
  /** Assignment Assignment V2 (one-to-one with module) */
  assignment?: AndamioApiInternalInternalApiAndamioDbClientAssignmentV2;
  course_module_code?: string;
  created_by_alias?: string;
  description?: string;
  image_url?: string;
  introduction?: AndamioApiInternalInternalApiAndamioDbClientIntroductionV2;
  is_live?: boolean;
  module_status?: AndamioDbClientCourseModuleV2ModuleStatus;
  /** SltHash Hash of SLT list, used as module token name on-chain */
  slt_hash?: string;
  slts?: AndamioApiInternalInternalApiAndamioDbClientSltV2[];
  title?: string;
  video_url?: string;
}

export interface AndamioApiInternalInternalApiAndamioDbClientCreateAssignmentCommitmentV2Request {
  course_id?: string;
  course_module_code?: string;
}

export interface AndamioApiInternalInternalApiAndamioDbClientDeleteModuleV2Request {
  course_id?: string;
  course_module_code?: string;
}

export interface AndamioApiInternalInternalApiAndamioDbClientIntroductionV2 {
  /** ContentJson Tiptap JSON content */
  content_json?: Record<string, any>;
  created_by_alias?: string;
  description?: string;
  image_url?: string;
  is_live?: boolean;
  title?: string;
  video_url?: string;
}

export interface AndamioApiInternalInternalApiAndamioDbClientLeaveAssignmentCommitmentV2Request {
  course_id?: string;
  course_module_code?: string;
  pending_tx_hash?: string;
}

export interface AndamioApiInternalInternalApiAndamioDbClientLessonV2 {
  /** ContentJson Tiptap JSON content */
  content_json?: Record<string, any>;
  created_by_alias?: string;
  description?: string;
  image_url?: string;
  is_live?: boolean;
  title?: string;
  video_url?: string;
}

export interface AndamioApiInternalInternalApiAndamioDbClientPublishModuleV2Request {
  course_id?: string;
  course_module_code?: string;
}

export interface AndamioApiInternalInternalApiAndamioDbClientRegisterCourseV2Request {
  category?: string;
  course_id?: string;
  description?: string;
  image_url?: string;
  is_public?: boolean;
  title?: string;
  tx_hash?: string;
  video_url?: string;
}

export interface AndamioApiInternalInternalApiAndamioDbClientRegisterProjectRequest {
  description?: string;
  image_url?: string;
  project_id?: string;
  title?: string;
}

export interface AndamioApiInternalInternalApiAndamioDbClientRemoveTeachersV2Request {
  aliases?: string[];
  course_id?: string;
}

export interface AndamioApiInternalInternalApiAndamioDbClientReviewAssignmentCommitmentV2Request {
  course_id?: string;
  course_module_code?: string;
  decision?: AndamioDbClientReviewAssignmentCommitmentV2RequestDecision;
  participant_alias?: string;
  pending_tx_hash?: string;
}

export interface AndamioApiInternalInternalApiAndamioDbClientSltV2 {
  created_by_alias?: string;
  lesson?: AndamioApiInternalInternalApiAndamioDbClientLessonV2;
  /** SltIndex 1-based SLT index (starts at 1, not 0) */
  slt_index?: number;
  slt_text?: string;
}

export interface AndamioApiInternalInternalApiAndamioDbClientSubmitAssignmentCommitmentV2Request {
  /** CourseId The course ID (policy ID) */
  course_id?: string;
  /** Evidence Tiptap JSON evidence content */
  evidence?: Record<string, any>;
  /** EvidenceHash Hash of the evidence for on-chain verification */
  evidence_hash?: string;
  /** PendingTxHash The pending transaction hash */
  pending_tx_hash?: string;
  /** SltHash The SLT hash identifying the module (on-chain identifier) */
  slt_hash?: string;
}

export interface AndamioApiInternalInternalApiAndamioDbClientUpdateAssignmentCommitmentV2Request {
  course_id?: string;
  course_module_code?: string;
  evidence?: Record<string, any>;
  evidence_hash?: string;
}

export interface AndamioApiInternalInternalApiAndamioDbClientUpdateTeachersV2Request {
  /** Add Aliases to add as teachers */
  add?: string[];
  course_id?: string;
  /** Remove Aliases to remove as teachers */
  remove?: string[];
}

export interface AndamioApiInternalInternalApiAndamioDbClientUpdateTeachersV2Response {
  course_id?: string;
  success?: boolean;
  teachers_added?: string[];
  /** TeachersCurrent Final list of teachers after updates */
  teachers_current?: string[];
  teachers_removed?: string[];
}

export interface AndamioApiInternalInternalApiAtlasTxClientAddFundsTxRequest {
  /** Plain text alias. Any characters allowed. */
  alias?: string;
  /** List of (asset class, quantity) pairs. This is an asset class, i.e. either \"lovelace\" or some other token with its minting policy and token name delimited by dot (.). */
  deposit_value?: Record<string, any>[][];
  initiator_data?: AndamioApiInternalInternalApiAtlasTxClientWalletData;
  /** This is the hash of a minting policy script. */
  project_id?: string;
}

export interface AndamioApiInternalInternalApiAtlasTxClientAssessAssignmentsTxRequest {
  /** Plain text alias. Any characters allowed. */
  alias?: string;
  assignment_decisions?: AndamioApiInternalInternalApiAtlasTxClientAssignmentOutcome[];
  /** This is the hash of a minting policy script. */
  course_id?: string;
  initiator_data?: AndamioApiInternalInternalApiAtlasTxClientWalletData;
}

export interface AndamioApiInternalInternalApiAtlasTxClientAssignmentActionTxRequest {
  /** Plain text alias. Any characters allowed. */
  alias?: string;
  /** A text string with a maximum length of 140 characters */
  assignment_info?: string;
  /** This is the hash of a minting policy script. */
  course_id?: string;
  initiator_data?: AndamioApiInternalInternalApiAtlasTxClientWalletData;
}

export interface AndamioApiInternalInternalApiAtlasTxClientAssignmentOutcome {
  /** Plain text alias. Any characters allowed. */
  alias?: string;
  outcome?: string;
}

export interface AndamioApiInternalInternalApiAtlasTxClientClaimCourseCredentialsTxRequest {
  /** Plain text alias. Any characters allowed. */
  alias?: string;
  /** This is the hash of a minting policy script. */
  course_id?: string;
  initiator_data?: AndamioApiInternalInternalApiAtlasTxClientWalletData;
}

export interface AndamioApiInternalInternalApiAtlasTxClientClaimProjectCredentialsTxRequest {
  /** Plain text alias. Any characters allowed. */
  alias?: string;
  /** This is the hash of a minting policy script. */
  contributor_state_id?: string;
  fee_tier?: string;
  initiator_data?: AndamioApiInternalInternalApiAtlasTxClientWalletData;
  /** This is the hash of a minting policy script. */
  project_id?: string;
}

export interface AndamioApiInternalInternalApiAtlasTxClientClaimV2AccessTokenTxRequest {
  /** Plain text alias. Any characters allowed. */
  alias?: string;
}

export interface AndamioApiInternalInternalApiAtlasTxClientCommitAssignmentTxRequest {
  /** Plain text alias. Any characters allowed. */
  alias?: string;
  /** A text string with a maximum length of 140 characters */
  assignment_info?: string;
  /** This is the hash of a minting policy script. */
  course_id?: string;
  initiator_data?: AndamioApiInternalInternalApiAtlasTxClientWalletData;
  /** Hex encoded hash of slts (exactly 64 characters) */
  slt_hash?: string;
}

export interface AndamioApiInternalInternalApiAtlasTxClientCommitTaskTxRequest {
  /** Plain text alias. Any characters allowed. */
  alias?: string;
  /** This is the hash of a minting policy script. */
  contributor_state_id?: string;
  fee_tier?: string;
  initiator_data?: AndamioApiInternalInternalApiAtlasTxClientWalletData;
  /** This is the hash of a minting policy script. */
  project_id?: string;
  /** Hex encoded hash of slts (exactly 64 characters) */
  task_hash?: string;
  /** A text string with a maximum length of 140 characters */
  task_info?: string;
}

export interface AndamioApiInternalInternalApiAtlasTxClientCreateCourseTxRequest {
  /** Plain text alias. Any characters allowed. */
  alias?: string;
  initiator_data?: AndamioApiInternalInternalApiAtlasTxClientWalletData;
  teachers?: string[];
}

export interface AndamioApiInternalInternalApiAtlasTxClientCreateProjectTxRequest {
  /** Plain text alias. Any characters allowed. */
  alias?: string;
  course_prereqs?: Record<string, any>[][];
  initiator_data?: AndamioApiInternalInternalApiAtlasTxClientWalletData;
  managers?: string[];
}

export interface AndamioApiInternalInternalApiAtlasTxClientManageContributorBlacklistTxRequest {
  /** Plain text alias. Any characters allowed. */
  alias?: string;
  aliases_to_add?: string[];
  aliases_to_remove?: string[];
  initiator_data?: AndamioApiInternalInternalApiAtlasTxClientWalletData;
  /** This is the hash of a minting policy script. */
  project_id?: string;
}

export interface AndamioApiInternalInternalApiAtlasTxClientManageManagersTxRequest {
  /** Plain text alias. Any characters allowed. */
  alias?: string;
  initiator_data?: AndamioApiInternalInternalApiAtlasTxClientWalletData;
  managers_to_add?: string[];
  managers_to_remove?: string[];
  /** This is the hash of a minting policy script. */
  project_id?: string;
}

export interface AndamioApiInternalInternalApiAtlasTxClientManageModulesTxRequest {
  /** Plain text alias. Any characters allowed. */
  alias?: string;
  /** This is the hash of a minting policy script. */
  course_id?: string;
  initiator_data?: AndamioApiInternalInternalApiAtlasTxClientWalletData;
  modules_to_add?: AndamioApiInternalInternalApiAtlasTxClientMintModuleV2[];
  modules_to_remove?: string[];
  modules_to_update?: AndamioApiInternalInternalApiAtlasTxClientUpdateModuleV2[];
}

export interface AndamioApiInternalInternalApiAtlasTxClientManageTasksTxRequest {
  /** Plain text alias. Any characters allowed. */
  alias?: string;
  /** This is the hash of a minting policy script. */
  contributor_state_id?: string;
  /** List of (asset class, quantity) pairs. This is an asset class, i.e. either \"lovelace\" or some other token with its minting policy and token name delimited by dot (.). */
  deposit_value?: Record<string, any>[][];
  initiator_data?: AndamioApiInternalInternalApiAtlasTxClientWalletData;
  /** This is the hash of a minting policy script. */
  project_id?: string;
  tasks_to_add?: AndamioApiInternalInternalApiAtlasTxClientTaskData[];
  tasks_to_remove?: AndamioApiInternalInternalApiAtlasTxClientTaskData[];
}

export interface AndamioApiInternalInternalApiAtlasTxClientManageTeachersTxRequest {
  /** Plain text alias. Any characters allowed. */
  alias?: string;
  /** This is the hash of a minting policy script. */
  course_id?: string;
  initiator_data?: AndamioApiInternalInternalApiAtlasTxClientWalletData;
  teachers_to_add?: string[];
  teachers_to_remove?: string[];
}

export interface AndamioApiInternalInternalApiAtlasTxClientMintAccessTokenTxRequest {
  /** Plain text alias. Any characters allowed. */
  alias?: string;
  /** An address, serialised as Bech32. */
  initiator_data?: string;
}

export interface AndamioApiInternalInternalApiAtlasTxClientMintModuleV2 {
  allowed_student_state_ids?: string[];
  prereq_slt_hashes?: string[];
  slts?: string[];
}

export interface AndamioApiInternalInternalApiAtlasTxClientProjectOutcome {
  /** Plain text alias. Any characters allowed. */
  alias?: string;
  outcome?: string;
}

export interface AndamioApiInternalInternalApiAtlasTxClientTaskActionTxRequest {
  /** Plain text alias. Any characters allowed. */
  alias?: string;
  initiator_data?: AndamioApiInternalInternalApiAtlasTxClientWalletData;
  /** This is the hash of a minting policy script. */
  project_id?: string;
  /** A text string with a maximum length of 140 characters */
  project_info?: string;
}

export interface AndamioApiInternalInternalApiAtlasTxClientTaskData {
  expiration_posix?: number;
  lovelace_amount?: number;
  /** List of (asset class, quantity) pairs. This is an asset class, i.e. either \"lovelace\" or some other token with its minting policy and token name delimited by dot (.). */
  native_assets?: Record<string, any>[][];
  /** A text string with a maximum length of 140 characters */
  project_content?: string;
}

export interface AndamioApiInternalInternalApiAtlasTxClientTasksAssessV2TxRequest {
  /** Plain text alias. Any characters allowed. */
  alias?: string;
  /** This is the hash of a minting policy script. */
  contributor_state_id?: string;
  initiator_data?: AndamioApiInternalInternalApiAtlasTxClientWalletData;
  /** This is the hash of a minting policy script. */
  project_id?: string;
  task_decisions?: AndamioApiInternalInternalApiAtlasTxClientProjectOutcome[];
}

export interface AndamioApiInternalInternalApiAtlasTxClientUnsignedTxResponse {
  unsigned_tx?: string;
}

export interface AndamioApiInternalInternalApiAtlasTxClientUnsignedTxResponseInitCourse {
  /** This is the hash of a minting policy script. */
  course_id?: string;
  unsigned_tx?: string;
}

export interface AndamioApiInternalInternalApiAtlasTxClientUnsignedTxResponseInitProject {
  /** This is the hash of a minting policy script. */
  project_id?: string;
  unsigned_tx?: string;
}

export interface AndamioApiInternalInternalApiAtlasTxClientUpdateModuleV2 {
  allowed_student_state_ids?: string[];
  prereq_slt_hashes?: string[];
  /** Hex encoded hash of slts (exactly 64 characters) */
  slt_hash?: string;
}

export interface AndamioApiInternalInternalApiAtlasTxClientWalletData {
  /** An address, serialised as Bech32. */
  change_address?: string;
  used_addresses?: string[];
}

export interface AndamioDbClientAggregateAssignmentInput {
  content_json?: Record<string, any>;
  description?: string;
  image_url?: string;
  title?: string;
  video_url?: string;
}

export interface AndamioDbClientAggregateChangeSummary {
  assignment_created?: boolean;
  assignment_deleted?: boolean;
  assignment_updated?: boolean;
  introduction_created?: boolean;
  introduction_deleted?: boolean;
  introduction_updated?: boolean;
  lessons_created?: number;
  lessons_deleted?: number;
  lessons_updated?: number;
  module_updated?: boolean;
  slts_created?: number;
  slts_deleted?: number;
  slts_reordered?: boolean;
  slts_updated?: number;
  /** StatusChanged True if DRAFT → APPROVED */
  status_changed?: boolean;
}

export interface AndamioDbClientAggregateIntroductionInput {
  content_json?: Record<string, any>;
  description?: string;
  title?: string;
}

export interface AndamioDbClientAggregateLessonInput {
  content_json?: Record<string, any>;
  description?: string;
  image_url?: string;
  /** SltIndex 1-based SLT index this lesson belongs to */
  slt_index?: number;
  title?: string;
  video_url?: string;
}

export interface AndamioDbClientAggregateSltInput {
  /** SltIndex 1-based index. If provided: update existing. If omitted: create new. */
  slt_index?: number;
  /** SltText The SLT text content */
  slt_text?: string;
}

export interface AndamioDbClientAggregateUpdateErrorResponse {
  code?: AndamioDbClientAggregateUpdateErrorResponseCode;
  error?: string;
  failed_operation?: {
    entity?: AndamioDbClientAggregateUpdateErrorResponseFailedOperationEntity;
    entity_id?: number;
    operation?: AndamioDbClientAggregateUpdateErrorResponseFailedOperationOperation;
    reason?: string;
  };
  message?: string;
}

export interface AndamioDbClientAggregateUpdateModuleV2Request {
  assignment?: AndamioDbClientAggregateAssignmentInput;
  course_id?: string;
  course_module_code?: string;
  /** DeleteAssignment Set to true to delete the assignment */
  delete_assignment?: boolean;
  /** DeleteIntroduction Set to true to delete the introduction */
  delete_introduction?: boolean;
  /** Description Module description (only send if changed) */
  description?: string;
  /** ImageUrl Module image URL (only send if changed) */
  image_url?: string;
  introduction?: AndamioDbClientAggregateIntroductionInput;
  /** Lessons Flat array of lessons keyed by slt_index. Server diffs against current state. */
  lessons?: AndamioDbClientAggregateLessonInput[];
  /** SltHash Required when status = 'APPROVED'. Hash of the SLT list. */
  slt_hash?: string;
  /** Slts Full ordered list of SLTs. Server diffs against current state. ONLY allowed when status is DRAFT. */
  slts?: AndamioDbClientAggregateSltInput[];
  /** Status Set to 'APPROVED' to approve a DRAFT module */
  status?: AndamioDbClientAggregateUpdateModuleV2RequestStatus;
  /** Title Module title (only send if changed) */
  title?: string;
  /** VideoUrl Module video URL (only send if changed) */
  video_url?: string;
}

export interface AndamioDbClientAggregateUpdateModuleV2Response {
  /** Changes Summary of what changed in the aggregate update */
  changes?: AndamioDbClientAggregateChangeSummary;
  /** Data Course Module V2 with full content */
  data?: AndamioApiInternalInternalApiAndamioDbClientCourseModuleV2;
}

export interface AndamioDbClientProjectManagerTaskDeletePostRequest {
  task_hash?: string;
}

export interface AndamioDbClientUserAccessTokenAliasPostRequest {
  access_token_alias?: string;
}

export interface ApiKeyViewmodelsAPIKeyRequest {
  /**
   * @minLength 3
   * @maxLength 64
   * @example "MyFirstKey"
   */
  api_key_name: string;
  /**
   * @min 1
   * @example 365
   */
  expires_in_days?: number;
}

export interface ApiKeyViewmodelsAPIKeyResponse {
  /** @example "ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" */
  api_key?: string;
  /** @example "2025-08-31T23:59:59Z" */
  created_at?: string;
  /** @example "2026-08-31T23:59:59Z" */
  expires_at?: string;
  /** @example 365 */
  expires_in_days?: number;
  /** @example true */
  is_active?: boolean;
  /** @example "MyFirstKey" */
  name?: string;
}

export interface ApiKeyViewmodelsDeleteAPIKeyRequest {
  /**
   * @minLength 3
   * @maxLength 64
   * @example "MyFirstKey"
   */
  api_key_name: string;
}

export interface ApiKeyViewmodelsDeleteAPIKeyResponse {
  /** @example "API key deleted successfully" */
  confirmation?: string;
}

export interface ApiKeyViewmodelsRotateAPIKeyRequest {
  /**
   * @minLength 3
   * @maxLength 64
   * @example "MyFirstKey"
   */
  api_key_name: string;
  /**
   * @min 1
   * @example 365
   */
  expires_in_days?: number;
}

export interface ApiKeyViewmodelsRotateAPIKeyResponse {
  /** @example "API key expiration extended to 2026-08-31T23:59:59Z" */
  confirmation?: string;
}

export interface ApiTypesAsset {
  /** @example "1000000" */
  amount?: string;
  /** @example "AndamioToken" */
  name?: string;
  /** @example "abc123def456" */
  policy_id?: string;
}

export interface ApiTypesAssignmentCommitment {
  /** @example "submitted" */
  assignment_commitment_status?: string;
  assignment_evidence_hash?: string;
  content?: ApiTypesAssignmentCommitmentContent;
  course_id: string;
  created_at?: string;
  slt_hash: string;
  student_address: string;
  updated_at?: string;
}

export interface ApiTypesAssignmentCommitmentContent {
  feedback?: string;
  notes?: string;
  submission_url?: string;
}

export interface ApiTypesCourse {
  content?: ApiTypesCourseContent;
  course_address?: string;
  /** @example "policy_abc123" */
  course_id: string;
  created_slot?: number;
  created_tx?: string;
  /** @example "addr1_owner" */
  owner?: string;
  /** @example "chain+db" */
  source: string;
  student_state_id?: string;
  teachers?: string[];
}

export interface ApiTypesCourseContent {
  category?: string;
  /** @example "Learn blockchain basics" */
  description?: string;
  /** @example "https://example.com/image.png" */
  image_url?: string;
  /** @example true */
  is_public?: boolean;
  /** @example "Introduction to Cardano" */
  title: string;
  video_url?: string;
}

export interface ApiTypesCourseModule {
  course_id: string;
  course_module_code?: string;
  created_at?: string;
  description?: string;
  image_url?: string;
  is_live?: boolean;
  module_status?: string;
  slt_hash: string;
  sort_order?: number;
  title?: string;
  updated_at?: string;
  video_url?: string;
}

export interface ApiTypesCreateCourseRequest {
  content?: ApiTypesCourseContent;
  /** @example "policy_abc123" */
  course_id: string;
}

export interface ApiTypesCreateModuleRequest {
  content?: ApiTypesModuleContent;
}

export interface ApiTypesCreateProjectRequest {
  content?: ApiTypesProjectContent;
  /** @example "policy_xyz789" */
  project_id: string;
}

export interface ApiTypesCreateTaskCommitmentRequest {
  evidence?: Record<string, any>;
  /** @example "hash_abc123" */
  task_hash: string;
}

export interface ApiTypesCreateTaskRequest {
  /** @example "Build a responsive login page" */
  content?: string;
  content_json?: Record<string, any>;
  /** @example "policy_xyz789" */
  contributor_state_id: string;
  /** @example "1735689600000" */
  expiration_time: string;
  /** @example "5000000" */
  lovelace_amount: string;
  /** @example "Build login page" */
  title: string;
  tokens?: ApiTypesCreateTaskToken[];
}

export interface ApiTypesCreateTaskToken {
  /** @example "MyToken" */
  asset_name: string;
  /** @example "abc123def456" */
  policy_id: string;
  /** @example "100" */
  quantity: string;
}

export interface ApiTypesDeleteTaskRequest {
  /** @example "policy_xyz789" */
  contributor_state_id: string;
  /** @example 0 */
  index: number;
}

export interface ApiTypesInitRolesResponse {
  courses?: ApiTypesCourse[];
  projects?: ApiTypesProject[];
}

export interface ApiTypesLoginSession {
  /** @example "2025-01-24T12:00:00Z" */
  expires_at: string;
  /** @example "session-123" */
  id: string;
  /** @example "abc123xyz" */
  nonce: string;
}

export interface ApiTypesModuleContent {
  course_module_code?: string;
  description?: string;
  image_url?: string;
  is_live?: boolean;
  module_status?: string;
  sort_order?: number;
  title?: string;
  video_url?: string;
}

export interface ApiTypesProject {
  content?: ApiTypesProjectContent;
  contributor_state_id?: string;
  created_at?: string;
  created_slot?: number;
  created_tx?: string;
  managers?: string[];
  owner?: string;
  project_address?: string;
  /** @example "policy_xyz789" */
  project_id: string;
  /** @example "chain+db" */
  source: string;
  treasury_address?: string;
}

export interface ApiTypesProjectContent {
  category?: string;
  description?: string;
  image_url?: string;
  /** @example true */
  is_public?: boolean;
  /** @example "Cardano Developer Tools" */
  title: string;
  video_url?: string;
}

export interface ApiTypesSignatureData {
  key: string;
  signature: string;
}

export interface ApiTypesSuccessResponse {
  /** @example "Operation completed" */
  message?: string;
  /** @example true */
  success?: boolean;
}

export interface ApiTypesTask {
  content?: ApiTypesTaskContent;
  contributor_state_id?: string;
  created_by?: string;
  expiration?: string;
  expiration_posix?: number;
  lovelace_amount?: number;
  on_chain_content?: string;
  project_id: string;
  source: string;
  /** @example "hash_abc123" */
  task_hash: string;
}

export interface ApiTypesTaskCommitment {
  content?: ApiTypesTaskCommitmentContent;
  contributor_address: string;
  created_at?: string;
  project_id: string;
  /** @example "pending" */
  task_commitment_status?: string;
  task_evidence_hash?: string;
  task_hash: string;
  updated_at?: string;
}

export interface ApiTypesTaskCommitmentContent {
  evidence_url?: string;
  notes?: string;
}

export interface ApiTypesTaskContent {
  description?: string;
  image_url?: string;
  title?: string;
}

export interface ApiTypesTokenResponse {
  expires_at: string;
  token: string;
}

export interface ApiTypesUpdateCourseRequest {
  category?: string;
  description?: string;
  image_url?: string;
  is_public?: boolean;
  title?: string;
  video_url?: string;
}

export interface ApiTypesUpdateProjectRequest {
  category?: string;
  description?: string;
  image_url?: string;
  is_public?: boolean;
  title?: string;
  video_url?: string;
}

export interface ApiTypesUpdateTaskCommitmentRequest {
  evidence?: Record<string, any>;
  /** @example "ev_hash_456" */
  evidence_hash?: string;
  /** @example "hash_abc123" */
  task_hash: string;
}

export interface ApiTypesUpdateTaskRequest {
  /** @example "Build a responsive login page" */
  content?: string;
  content_json?: Record<string, any>;
  /** @example "policy_xyz789" */
  contributor_state_id: string;
  /** @example "1735689600000" */
  expiration_time?: string;
  /** @example 0 */
  index: number;
  /** @example "5000000" */
  lovelace_amount?: string;
  /** @example "Build login page" */
  title?: string;
  tokens?: ApiTypesCreateTaskToken[];
}

export interface ApiTypesValidateSignatureRequest {
  session_id: string;
  signature: ApiTypesSignatureData;
}

export interface ApiUsageViewmodelsAPIUsage {
  /** @example "MyFirstKey" */
  api_key_name?: string;
  /** @example "v1" */
  api_version?: string;
  /** @example "API_KEY" */
  authentication_method?: string;
  /** @example false */
  cache_hit?: boolean;
  /** @example "2023-01-01T12:34:56Z" */
  created_at?: string;
  /** @example 1024 */
  data_transfer_in_bytes?: number;
  /** @example 2048 */
  data_transfer_out_bytes?: number;
  /** @example "/v1/data" */
  endpoint?: string;
  /** @example 0 */
  error_count?: number;
  /** @example "GET" */
  http_method?: string;
  /** @example "a1b2c3d4-e5f6-7890-1234-567890abcdef" */
  id?: string;
  /** @example "192.168.1.1" */
  ip_address?: string;
  /** @example 20 */
  latency_to_db_ms?: number;
  /** @example false */
  quota_exceeded?: boolean;
  /** @example "minute" */
  rate_limit_type?: string;
  /** @example false */
  rate_limited?: boolean;
  /** @example 999 */
  remaining_quota?: number;
  /** @example 99 */
  remaining_rate_limit?: number;
  /** @example 100 */
  request_body_size_bytes?: number;
  /** @example 1 */
  request_count?: number;
  /** @example "a1b2c3d4-e5f6-7890-1234-567890abcdef" */
  request_id?: string;
  /** @example 500 */
  response_body_size_bytes?: number;
  /** @example 150 */
  response_time_ms?: number;
  /** @example 200 */
  status_code?: number;
  /** @example 1 */
  tier_id?: number;
  /** @example "Free" */
  tier_name?: string;
  /** @example "2023-01-01T12:34:56Z" */
  timestamp?: string;
  /** @example "2023-01-01T12:34:56Z" */
  updated_at?: string;
  /** @example "Mozilla/5.0" */
  user_agent?: string;
  /** @example "a1b2c3d4-e5f6-7890-1234-567890abcdef" */
  user_id?: string;
}

export interface ApiUsageViewmodelsAPIUsageMetric {
  /** @example "MyFirstKey" */
  api_key_name?: string;
  usage_metrics?: ApiUsageViewmodelsAPIUsage[];
}

export interface ApiUsageViewmodelsAnyUserDailyApiUsageRequest {
  /** @example "2023-01-31" */
  end_date: string;
  /** @example "2023-01-01" */
  start_date: string;
  /**
   * @maxItems 64
   * @minItems 1
   */
  user_infos?: ApiUsageViewmodelsUserInfo[];
}

export interface ApiUsageViewmodelsAnyUserDailyApiUsageResponse {
  /** A list of usage data, aggregated by user. */
  users_usages?: ApiUsageViewmodelsUserUsage[];
}

export interface ApiUsageViewmodelsUsageData {
  /** @example "MyFirstKey" */
  api_key_name?: string;
  /** @example ["[\"v1\"]"] */
  api_versions?: string[];
  /** @example ["[\"API_KEY\"]"] */
  authentication_methods?: string[];
  /** @example "2023-01-01T00:00:00Z" */
  date?: string;
  /** @example ["[\"/v1/data\"]"] */
  endpoints?: string[];
  /** @example ["[\"GET\"]"] */
  http_methods?: string[];
  /** @example 500 */
  max_response_time_ms?: number;
  /** @example 10 */
  min_response_time_ms?: number;
  /** @example 1 */
  tier_id?: number;
  /** @example "Free" */
  tier_name?: string;
  /** @example 100 */
  total_cache_hit_count?: number;
  /** @example 1024000 */
  total_data_transfer_in_bytes?: number;
  /** @example 2048000 */
  total_data_transfer_out_bytes?: number;
  /** @example 50 */
  total_error_count?: number;
  /** @example 2 */
  total_quota_exceeded_count?: number;
  /** @example 5 */
  total_rate_limited_count?: number;
  /** @example 1000 */
  total_requests?: number;
  /** @example 50000 */
  total_response_time_ms?: number;
  /** @example "a1b2c3d4-e5f6-7890-1234-567890abcdef" */
  user_id?: string;
  /**
   * Added UserIPs
   * @example ["[\"192.168.1.1\"]"]
   */
  user_ips?: string[];
}

export interface ApiUsageViewmodelsUsagePerApiKeyName {
  /** @example "MyFirstKey" */
  api_key_name?: string;
  usage_data?: ApiUsageViewmodelsUsageData[];
}

export interface ApiUsageViewmodelsUserAPIUsageRequest {
  /**
   * @minLength 1
   * @maxLength 64
   * @example "johndoe"
   */
  alias: string;
  /** @example ["[\"MyFirstKey\""," \"AnotherKey\"]"] */
  api_key_names?: string[];
  /** @example "2023-01-31" */
  end_date: string;
  /** @example "2023-01-01" */
  start_date: string;
}

export interface ApiUsageViewmodelsUserAPIUsageResponse {
  /** @example "johndoe" */
  alias?: string;
  api_usage_metrics?: ApiUsageViewmodelsAPIUsageMetric[];
}

export interface ApiUsageViewmodelsUserDailyApiUsageRequest {
  /** @example ["[\"MyFirstKey\""," \"AnotherKey\"]"] */
  api_key_names?: string[];
  /** @example "2023-01-31" */
  end_date: string;
  /** @example "2023-01-01" */
  start_date: string;
}

export interface ApiUsageViewmodelsUserDailyApiUsageResponse {
  user_usages?: ApiUsageViewmodelsUserUsagePerApiKeyName[];
}

export interface ApiUsageViewmodelsUserInfo {
  /**
   * @minLength 1
   * @maxLength 64
   * @example "johndoe"
   */
  alias: string;
  /** @example ["[\"MyFirstKey\""," \"AnotherKey\"]"] */
  api_key_names?: string[];
}

export interface ApiUsageViewmodelsUserUsage {
  /** @example "johndoe" */
  alias?: string;
  usages?: ApiUsageViewmodelsUsagePerApiKeyName[];
}

export interface ApiUsageViewmodelsUserUsageData {
  /** @example "MyFirstKey" */
  api_key_name?: string;
  /** @example ["[\"v1\"]"] */
  api_versions?: string[];
  /** @example ["[\"API_KEY\"]"] */
  authentication_methods?: string[];
  /** @example "2023-01-01" */
  date?: string;
  /** @example ["[\"/v1/data\"]"] */
  endpoints?: string[];
  /** @example ["[\"GET\"]"] */
  http_methods?: string[];
  /** @example 1 */
  tier_id?: number;
  /** @example "Free" */
  tier_name?: string;
  /** @example 50 */
  total_error_count?: number;
  /** @example 1000 */
  total_requests?: number;
}

export interface ApiUsageViewmodelsUserUsagePerApiKeyName {
  /** @example "MyFirstKey" */
  api_key_name?: string;
  usage_Data?: ApiUsageViewmodelsUserUsageData[];
}

export interface AuthViewmodelsJWTResponse {
  /** @example "2025-09-01T23:59:59Z" */
  expires_at?: string;
  /** @example "eyJhbGci..." */
  token?: string;
}

export interface AuthViewmodelsLoginRequest {
  /**
   * @minLength 1
   * @maxLength 32
   * @example "johndoe"
   */
  alias: string;
  /**
   * @minLength 103
   * @maxLength 108
   * @example "addr1q..."
   */
  wallet_address: string;
}

export interface AuthViewmodelsLoginResponse {
  /** @example "johndoe" */
  alias?: string;
  jwt?: AuthViewmodelsJWTResponse;
  /** @example "Free" */
  tier?: string;
  /** @example "a1b2c3d4-e5f6-7890-1234-567890abcdef" */
  user_id?: string;
}

export interface AuthViewmodelsRegisterCompleteRequest {
  /** @example "a1b2c3d4-e5f6-7890-1234-567890abcdef" */
  session_id: string;
  signature: AuthViewmodelsSignatureData;
}

export interface AuthViewmodelsRegisterRequest {
  /**
   * @minLength 1
   * @maxLength 32
   * @example "johndoe"
   */
  alias: string;
  /**
   * @minLength 1
   * @maxLength 254
   * @example "john.doe@example.com"
   */
  email: string;
  /**
   * @minLength 103
   * @maxLength 108
   * @example "addr1q..."
   */
  wallet_address: string;
}

export interface AuthViewmodelsRegisterResponse {
  /** @example "johndoe" */
  alias?: string;
  /** @example "2026-08-31T23:59:59Z" */
  subscription_expiration?: string;
  /** @example "Free" */
  tier?: string;
  /** @example "a1b2c3d4-e5f6-7890-1234-567890abcdef" */
  user_id?: string;
}

export interface AuthViewmodelsRegisterSessionRequest {
  /**
   * @minLength 1
   * @maxLength 32
   * @example "johndoe"
   */
  alias: string;
  /**
   * @minLength 1
   * @maxLength 254
   * @example "john.doe@example.com"
   */
  email: string;
  /**
   * @minLength 103
   * @maxLength 108
   * @example "addr1q..."
   */
  wallet_address: string;
}

export interface AuthViewmodelsRegisterSessionResponse {
  /** @example "2026-01-22T15:30:00Z" */
  expires_at?: string;
  /** @example "Please sign this message to verify wallet ownership: abc123..." */
  nonce?: string;
  /** @example "a1b2c3d4-e5f6-7890-1234-567890abcdef" */
  session_id?: string;
}

export interface AuthViewmodelsSignatureData {
  /** @example "a4010103272006215820..." */
  key: string;
  /** @example "84582aa201276761..." */
  signature: string;
}

export interface DbHandlersUpdateModuleStatusRequest {
  course_id?: string;
  course_module_code?: string;
  /** Required when status = "APPROVED" */
  slt_hash?: string;
  /** "APPROVED" or "DRAFT" */
  status?: string;
}

export interface ErrorsBadGatewayErrorResponse {
  details?: string;
  /** @example "Bad Gateway: The upstream server returned an invalid response." */
  message?: string;
  /** @example 502 */
  status_code?: number;
}

export interface ErrorsBadRequestErrorResponse {
  details?: string;
  /** @example "Bad Request: Invalid input." */
  message?: string;
  /** @example 400 */
  status_code?: number;
}

export interface ErrorsBadRequestResponse {
  details?: string;
  /** @example "Bad Request: Invalid input." */
  message?: string;
  /** @example 400 */
  status_code?: number;
}

export interface ErrorsConflictErrorResponse {
  details?: string;
  /** @example "Conflict - The provided alias is already taken by another user. Please choose a different alias." */
  message?: string;
  /** @example 409 */
  status_code?: number;
}

export interface ErrorsForbiddenErrorResponse {
  details?: string;
  /** @example "Forbidden: Insufficient permissions or tier access." */
  message?: string;
  /** @example 403 */
  status_code?: number;
}

export interface ErrorsGoneErrorResponse {
  details?: string;
  /** @example "Gone - The requested resource is no longer available." */
  message?: string;
  /** @example 410 */
  status_code?: number;
}

export interface ErrorsInternalServerErrorResponse {
  details?: string;
  /** @example "Internal Server Error: An unexpected error occurred." */
  message?: string;
  /** @example 500 */
  status_code?: number;
}

export interface ErrorsNotFoundErrorResponse {
  details?: string;
  /** @example "Not Found: The requested resource could not be found." */
  message?: string;
  /** @example 404 */
  status_code?: number;
}

export interface ErrorsTooManyRequestsErrorResponse {
  details?: string;
  /** @example "Too Many Requests: Rate limit or quota exceeded." */
  message?: string;
  /** @example 429 */
  status_code?: number;
}

export interface ErrorsUnauthorizedErrorResponse {
  details?: string;
  /** @example "Unauthorized: Invalid or missing credentials." */
  message?: string;
  /** @example 401 */
  status_code?: number;
}

export interface ErrorsUnprocessableEntityErrorResponse {
  details?: string;
  /** @example "Unprocessable Entity: Invalid request structure or data." */
  message?: string;
  /** @example 422 */
  status_code?: number;
}

export interface MergedHandlersContributorCommitmentResponse {
  data?: OrchestrationContributorCommitmentItem;
  warning?: string;
}

export interface MergedHandlersContributorCommitmentsResponse {
  data?: OrchestrationContributorCommitmentItem[];
  warning?: string;
}

export interface MergedHandlersContributorProjectsResponse {
  data?: OrchestrationContributorProjectListItem[];
  warning?: string;
}

export interface MergedHandlersErrorResponse {
  details?: string;
  error?: string;
}

export interface MergedHandlersGetContributorCommitmentRequest {
  project_id?: string;
  task_hash?: string;
}

export interface MergedHandlersGetStudentAssignmentCommitmentRequest {
  course_id?: string;
  /** Human-readable code (e.g., "101") - used for DB lookup */
  course_module_code?: string;
  /** On-chain hash - required for on-chain lookup */
  slt_hash?: string;
}

export interface MergedHandlersListManagerTasksRequest {
  project_id?: string;
}

export interface MergedHandlersListStudentAssignmentCommitmentsRequest {
  course_id?: string;
}

export interface MergedHandlersListTasksRequest {
  project_id?: string;
}

export interface MergedHandlersListTeacherAssignmentCommitmentsRequest {
  course_id?: string;
}

export interface MergedHandlersListTeacherCourseModulesRequest {
  course_id?: string;
}

export interface MergedHandlersManagerCommitmentsResponse {
  data?: OrchestrationManagerCommitmentItem[];
  warning?: string;
}

export interface MergedHandlersManagerProjectsResponse {
  data?: OrchestrationManagerProjectListItem[];
  warning?: string;
}

export interface MergedHandlersMergedAssignmentResponseWrapper {
  data?: OrchestrationMergedAssignmentResponse;
  warning?: string;
}

export interface MergedHandlersMergedCourseDetailResponse {
  data?: OrchestrationMergedCourseDetail;
  warning?: string;
}

export interface MergedHandlersMergedCourseModulesPublicResponse {
  data?: OrchestrationPublicCourseModuleItem[];
  warning?: string;
}

export interface MergedHandlersMergedCourseModulesResponse {
  data?: OrchestrationMergedCourseModuleItem[];
  warning?: string;
}

export interface MergedHandlersMergedCoursesResponse {
  data?: OrchestrationMergedCourseListItem[];
  warning?: string;
}

export interface MergedHandlersMergedIntroductionResponseWrapper {
  data?: OrchestrationMergedIntroductionResponse;
  warning?: string;
}

export interface MergedHandlersMergedLessonResponseWrapper {
  data?: OrchestrationMergedLessonResponse;
  warning?: string;
}

export interface MergedHandlersMergedProjectDetailResponse {
  data?: OrchestrationMergedProjectDetail;
  warning?: string;
}

export interface MergedHandlersMergedProjectsResponse {
  data?: OrchestrationMergedProjectListItem[];
  warning?: string;
}

export interface MergedHandlersMergedSltsResponseWrapper {
  data?: OrchestrationMergedSltsResponse;
  warning?: string;
}

export interface MergedHandlersMergedTasksResponse {
  data?: OrchestrationMergedTaskListItem[];
  warning?: string;
}

export interface MergedHandlersRegisterModuleFromChainRequest {
  course_id?: string;
  course_module_code?: string;
  slt_hash?: string;
}

export interface MergedHandlersRegisterModuleResponse {
  data?: OrchestrationRegisterModuleResponse;
}

export interface MergedHandlersStudentAssignmentCommitmentResponse {
  data?: OrchestrationStudentAssignmentCommitmentItem;
  warning?: string;
}

export interface MergedHandlersStudentAssignmentCommitmentsResponse {
  data?: OrchestrationStudentAssignmentCommitmentItem[];
  warning?: string;
}

export interface MergedHandlersStudentCoursesResponse {
  data?: OrchestrationStudentCourseListItem[];
  warning?: string;
}

export interface MergedHandlersStudentCredentialsResponse {
  data?: OrchestrationStudentCourseCredential[];
  warning?: string;
}

export interface MergedHandlersTeacherAssignmentCommitmentsResponse {
  data?: OrchestrationTeacherAssignmentCommitmentItem[];
  warning?: string;
}

export interface OrchestrationAssignmentCommitmentContent {
  /** Hash for on-chain verification */
  assignment_evidence_hash?: string;
  /** DRAFT, SUBMITTED, APPROVED, etc. */
  commitment_status?: string;
  /** JSON evidence data */
  evidence?: any;
}

export interface OrchestrationContributorCommitmentItem {
  /** Off-chain content (nested) */
  content?: OrchestrationTaskCommitmentContent;
  /** Hex-encoded */
  on_chain_content?: string;
  /** On-chain status */
  on_chain_status?: string;
  project_id?: string;
  /** Data source indicator */
  source?: string;
  submission_tx?: string;
  /** Identifiers */
  task_hash?: string;
}

export interface OrchestrationContributorProjectListItem {
  /** Off-chain content (nested) */
  content?: OrchestrationProjectContent;
  contributor_state_id?: string;
  created_at?: string;
  created_slot?: number;
  created_tx?: string;
  managers?: string[];
  /** Contributor's own commitments */
  my_commitments?: OrchestrationMyCommitmentSummary[];
  owner?: string;
  prerequisites?: OrchestrationProjectPrerequisite[];
  project_address?: string;
  /** On-chain fields (top level) */
  project_id?: string;
  /** Data source indicator */
  source?: string;
  treasury_address?: string;
}

export interface OrchestrationCourseContent {
  description?: string;
  image_url?: string;
  is_public?: boolean;
  title?: string;
}

export interface OrchestrationCourseModule {
  created_by?: string;
  prerequisites?: string[];
  slt_hash?: string;
  slts?: string[];
}

export interface OrchestrationCredentialModuleInfo {
  course_module_code?: string;
  slt_hash?: string;
  title?: string;
}

export interface OrchestrationManagerCommitmentItem {
  /** Off-chain content (nested) - contributor's evidence */
  content?: OrchestrationTaskCommitmentContent;
  /** Hex-encoded */
  on_chain_content?: string;
  /** Identifiers */
  project_id?: string;
  /** Data source indicator */
  source?: string;
  /** On-chain submission info */
  submission_tx?: string;
  submitted_by?: string;
  /** Task context */
  task?: OrchestrationManagerCommitmentTaskInfo;
  task_hash?: string;
}

export interface OrchestrationManagerCommitmentTaskInfo {
  assets?: ApiTypesAsset[];
  expiration?: string;
  expiration_posix?: number;
  lovelace_amount?: number;
  on_chain_content?: string;
}

export interface OrchestrationManagerProjectListItem {
  /** Off-chain content (nested) */
  content?: OrchestrationProjectContent;
  contributor_state_id?: string;
  created_at?: string;
  created_slot?: number;
  created_tx?: string;
  managers?: string[];
  owner?: string;
  /** Pending assessments for this manager */
  pending_assessments?: OrchestrationPendingAssessmentSummary[];
  prerequisites?: OrchestrationProjectPrerequisite[];
  project_address?: string;
  /** On-chain fields (top level) */
  project_id?: string;
  /** Data source indicator */
  source?: string;
  treasury_address?: string;
}

export interface OrchestrationMergedAssignmentContent {
  /** Tiptap JSON content */
  content_json?: Record<string, any>;
  description?: string;
  image_url?: string;
  title?: string;
  video_url?: string;
}

export interface OrchestrationMergedAssignmentResponse {
  /** Off-chain content (from DB API) */
  content?: OrchestrationMergedAssignmentContent;
  /** Course and module context */
  course_id?: string;
  course_module_code?: string;
  /** On-chain fields */
  created_by?: string;
  slt_hash?: string;
  /** Data source indicator */
  source?: string;
}

export interface OrchestrationMergedCourseDetail {
  /** Off-chain content (nested) */
  content?: OrchestrationCourseContent;
  course_address?: string;
  /** On-chain fields (top level) */
  course_id?: string;
  modules?: OrchestrationCourseModule[];
  /** WORKAROUND: fetched via extra API call until Andamioscan#15 is resolved */
  owner?: string;
  past_students?: string[];
  /** Data source indicator */
  source?: string;
  student_state_id?: string;
  students?: string[];
  teachers?: string[];
}

export interface OrchestrationMergedCourseListItem {
  /** Off-chain content (nested) */
  content?: OrchestrationCourseContent;
  course_address?: string;
  /** On-chain fields (top level) */
  course_id?: string;
  created_slot?: number;
  created_tx?: string;
  owner?: string;
  /** Data source indicator */
  source?: string;
  student_state_id?: string;
  teachers?: string[];
}

export interface OrchestrationMergedCourseModuleItem {
  /** Off-chain content (from DB API) */
  content?: OrchestrationModuleContent;
  /** Course context */
  course_id?: string;
  /** On-chain fields (from Andamioscan) */
  created_by?: string;
  /** SLT hashes from chain */
  on_chain_slts?: string[];
  /** On-chain prerequisite module hashes */
  prerequisites?: string[];
  /**
   * Primary identifier - matches on-chain slts_hash and DB slt_hash.
   * Empty string for db_only drafts without SLTs computed yet.
   */
  slt_hash?: string;
  /** Data source indicator */
  source?: string;
}

export interface OrchestrationMergedIntroductionContent {
  /** Tiptap JSON content */
  content_json?: Record<string, any>;
  description?: string;
  image_url?: string;
  title?: string;
  video_url?: string;
}

export interface OrchestrationMergedIntroductionResponse {
  content?: OrchestrationMergedIntroductionContent;
  course_id?: string;
  course_module_code?: string;
  created_by?: string;
  slt_hash?: string;
  /** "merged", "chain_only" */
  source?: string;
}

export interface OrchestrationMergedLessonContent {
  /** Tiptap JSON content */
  content_json?: Record<string, any>;
  description?: string;
  image_url?: string;
  title?: string;
  video_url?: string;
}

export interface OrchestrationMergedLessonResponse {
  content?: OrchestrationMergedLessonContent;
  course_id?: string;
  course_module_code?: string;
  created_by?: string;
  slt_hash?: string;
  slt_index?: number;
  slt_text?: string;
  /** "merged", "chain_only" */
  source?: string;
}

export interface OrchestrationMergedProjectDetail {
  assessments?: OrchestrationProjectAssessmentOnChain[];
  /** Off-chain content (nested) */
  content?: OrchestrationProjectContent;
  contributor_state_id?: string;
  contributors?: OrchestrationProjectContributorOnChain[];
  credential_claims?: OrchestrationProjectCredentialClaimOnChain[];
  managers?: string[];
  owner?: string;
  prerequisites?: OrchestrationProjectPrerequisite[];
  /** On-chain fields (top level) */
  project_id?: string;
  /** Data source indicator */
  source?: string;
  submissions?: OrchestrationProjectSubmissionOnChain[];
  tasks?: OrchestrationProjectTaskOnChain[];
  treasury_address?: string;
  treasury_fundings?: OrchestrationProjectTreasuryFundingOnChain[];
}

export interface OrchestrationMergedProjectListItem {
  /** Off-chain content (nested) */
  content?: OrchestrationProjectContent;
  contributor_state_id?: string;
  created_at?: string;
  created_slot?: number;
  created_tx?: string;
  managers?: string[];
  owner?: string;
  prerequisites?: OrchestrationProjectPrerequisite[];
  project_address?: string;
  /** On-chain fields (top level) */
  project_id?: string;
  /** Data source indicator */
  source?: string;
  treasury_address?: string;
}

export interface OrchestrationMergedSltItem {
  created_by?: string;
  has_lesson?: boolean;
  lesson?: OrchestrationMergedLessonContent;
  slt_index?: number;
  slt_text?: string;
}

export interface OrchestrationMergedSltsResponse {
  course_id?: string;
  course_module_code?: string;
  created_by?: string;
  slt_hash?: string;
  slts?: OrchestrationMergedSltItem[];
  /** "merged", "chain_only" */
  source?: string;
}

export interface OrchestrationMergedTaskListItem {
  /** Native assets */
  assets?: ApiTypesAsset[];
  /** Off-chain content (nested) */
  content?: OrchestrationTaskContent;
  contributor_state_id?: string;
  created_by?: string;
  /** ISO timestamp */
  expiration?: string;
  expiration_posix?: number;
  lovelace_amount?: number;
  /** Hex-encoded */
  on_chain_content?: string;
  project_id?: string;
  /** Data source indicator */
  source?: string;
  /** On-chain fields (top level) */
  task_hash?: string;
  /** DB task index (for draft identification) */
  task_index?: number;
  /** DB task status (for db_only tasks: DRAFT, PENDING_TX, ON_CHAIN, etc.) */
  task_status?: string;
}

export interface OrchestrationModuleContent {
  /** Full assignment content (AssignmentV2) */
  assignment?: any;
  course_module_code?: string;
  description?: string;
  image_url?: string;
  /** Full introduction content (IntroductionV2) */
  introduction?: any;
  is_live?: boolean;
  module_status?: string;
  /** Full SLT content from DB ([]SltV2) */
  slts?: any;
  title?: string;
  video_url?: string;
}

export interface OrchestrationMyCommitmentSummary {
  /** committed, submitted, approved, rejected */
  commitment_status?: string;
  content?: OrchestrationTaskCommitmentContent;
  task_hash?: string;
}

export interface OrchestrationPendingAssessmentSummary {
  on_chain_content?: string;
  submission_tx?: string;
  submitted_by?: string;
  task_hash?: string;
}

export interface OrchestrationProjectAssessmentOnChain {
  assessed_by?: string;
  /** ACCEPTED, REFUSED, DENIED */
  decision?: string;
  task_hash?: string;
  tx?: string;
}

export interface OrchestrationProjectContent {
  description?: string;
  image_url?: string;
  title?: string;
}

export interface OrchestrationProjectContributorOnChain {
  alias?: string;
}

export interface OrchestrationProjectCredentialClaimOnChain {
  alias?: string;
  tx?: string;
}

export interface OrchestrationProjectPrerequisite {
  course_id?: string;
  slt_hashes?: string[];
}

export interface OrchestrationProjectSubmissionOnChain {
  on_chain_content?: string;
  submission_tx?: string;
  submitted_by?: string;
  task_hash?: string;
}

export interface OrchestrationProjectTaskOnChain {
  /** Native assets */
  assets?: ApiTypesAsset[];
  contributor_state_id?: string;
  created_by?: string;
  /** ISO timestamp */
  expiration?: string;
  expiration_posix?: number;
  lovelace_amount?: number;
  /** Hex-encoded */
  on_chain_content?: string;
  task_hash?: string;
}

export interface OrchestrationProjectTreasuryFundingOnChain {
  alias?: string;
  assets?: ApiTypesAsset[];
  lovelace_amount?: number;
  slot?: number;
  tx_hash?: string;
}

export interface OrchestrationPublicCourseModuleItem {
  /** Off-chain content (from DB API) */
  content?: OrchestrationPublicModuleContent;
  /** Course context */
  course_id?: string;
  /** On-chain fields (from Andamioscan) */
  created_by?: string;
  /** SLT text from chain */
  on_chain_slts?: string[];
  /** On-chain prerequisite module hashes */
  prerequisites?: string[];
  /** Primary identifier - on-chain slts_hash */
  slt_hash?: string;
  /** Data source indicator */
  source?: string;
}

export interface OrchestrationPublicModuleContent {
  course_module_code?: string;
  description?: string;
  image_url?: string;
  is_live?: boolean;
  title?: string;
}

export interface OrchestrationRegisterModuleResponse {
  course_id?: string;
  course_module_code?: string;
  /** Should be "APPROVED" */
  module_status?: string;
  /** Number of SLTs successfully created */
  slt_count?: number;
  slt_hash?: string;
  slts?: OrchestrationRegisteredSltItem[];
  /** "merged" */
  source?: string;
}

export interface OrchestrationRegisteredSltItem {
  /** 1-based index */
  slt_index?: number;
  /** The SLT content */
  slt_text?: string;
}

export interface OrchestrationStudentAssignmentCommitmentItem {
  /** Off-chain content (nested) */
  content?: OrchestrationAssignmentCommitmentContent;
  course_id?: string;
  course_module_code?: string;
  /** Hex-encoded on-chain content */
  on_chain_content?: string;
  /** On-chain status */
  on_chain_status?: string;
  /** Identifiers */
  slt_hash?: string;
  /** Data source indicator */
  source?: string;
}

export interface OrchestrationStudentCourseCredential {
  /** Claimed credentials (slt_hashes from on-chain, for completed courses) */
  claimed_credentials?: string[];
  /** Course identity */
  course_id?: string;
  course_title?: string;
  /** "enrolled", "completed" */
  enrollment_status?: string;
  /** Enrollment state (from on-chain) */
  is_enrolled?: boolean;
  /** Module metadata (from DB, for resolving slt_hash → title/code) */
  modules?: OrchestrationCredentialModuleInfo[];
  /** Data source indicator */
  source?: string;
}

export interface OrchestrationStudentCourseListItem {
  /** Off-chain content (nested) */
  content?: OrchestrationCourseContent;
  course_address?: string;
  /** On-chain fields (top level) */
  course_id?: string;
  created_slot?: number;
  created_tx?: string;
  /** "enrolled" or "completed" */
  enrollment_status?: string;
  owner?: string;
  /** Data source indicator */
  source?: string;
  student_state_id?: string;
  teachers?: string[];
}

export interface OrchestrationTaskCommitmentContent {
  /** Manager who assessed */
  assessed_by?: string;
  /** DRAFT, COMMITTED, SUBMITTED, ACCEPTED, etc. */
  commitment_status?: string;
  /** Tiptap JSON document */
  evidence?: any;
  /** Hash for on-chain verification */
  task_evidence_hash?: string;
  /** ACCEPTED, REFUSED, DENIED */
  task_outcome?: string;
}

export interface OrchestrationTaskContent {
  /** Rich Tiptap JSON document */
  content_json?: any;
  description?: string;
  task_index?: number;
  title?: string;
}

export interface OrchestrationTeacherAssignmentCommitmentItem {
  /** Off-chain content (nested) */
  content?: OrchestrationAssignmentCommitmentContent;
  /** Identifiers */
  course_id?: string;
  /** Human-readable module code (from DB) */
  course_module_code?: string;
  /** Hex-encoded on-chain content */
  on_chain_content?: string;
  /** On-chain student status (from course details) */
  on_chain_status?: string;
  slt_hash?: string;
  /** Data source indicator */
  source?: string;
  student_alias?: string;
  submission_slot?: number;
  /** On-chain submission info */
  submission_tx?: string;
}

export interface PublicScanHandlersAliasExistsResponse {
  alias?: string;
  exists?: boolean;
}

/** Response containing the current state of a tracked transaction. */
export interface TxStateHandlersPendingTxResponse {
  /**
   * Timestamp when the transaction was confirmed on-chain (RFC3339 format, null if not yet confirmed)
   * @example "2026-01-19T12:00:30Z"
   */
  confirmed_at?: string;
  /**
   * Timestamp when the transaction was registered (RFC3339 format)
   * @example "2026-01-19T12:00:00Z"
   */
  created_at?: string;
  /**
   * Optional instance ID (course_id or project_id)
   * @example "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2"
   */
  instance_id?: string;
  /**
   * Last error message if the transaction failed
   * @example ""
   */
  last_error?: string;
  /** Optional metadata stored with the transaction */
  metadata?: Record<string, string>;
  /**
   * Number of retry attempts for confirmation polling
   * @example 0
   */
  retry_count?: number;
  /**
   * Current state in the transaction lifecycle
   * @example "pending"
   */
  state?: "pending" | "confirmed" | "updated" | "failed" | "expired";
  /**
   * Transaction hash (64 hex characters)
   * @example "8a3b5c7d9e1f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b"
   */
  tx_hash?: string;
  /**
   * Transaction type
   * @example "assignment_submit"
   */
  tx_type?:
    | "course_create"
    | "course_enroll"
    | "modules_manage"
    | "teachers_update"
    | "managers_manage"
    | "assignment_submit"
    | "assessment_assess"
    | "credential_claim"
    | "project_create"
    | "project_join"
    | "tasks_manage"
    | "task_submit"
    | "task_assess"
    | "project_credential_claim"
    | "blacklist_update"
    | "treasury_fund"
    | "access_token_mint";
  /**
   * Timestamp of the last state update (RFC3339 format)
   * @example "2026-01-19T12:01:00Z"
   */
  updated_at?: string;
  /**
   * User ID who registered the transaction
   * @example "user_abc123"
   */
  user_id?: string;
}

/** Request body for registering a transaction with the TX State Machine. After submitting a signed transaction to the Cardano network, register it here so the Gateway can track confirmation and automatically update the database. */
export interface TxStateHandlersRegisterPendingTxRequest {
  /**
   * Optional instance ID (course_id or project_id) for scoping
   * @example "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2"
   */
  instance_id?: string;
  /** Optional metadata for off-chain data needed during DB update (e.g., policy_id, module_code) */
  metadata?: Record<string, string>;
  /**
   * Transaction hash (64 hex characters) returned from wallet.submitTx()
   * @example "8a3b5c7d9e1f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b"
   */
  tx_hash: string;
  /**
   * Transaction type - determines which Andamioscan event endpoint to poll and which DB update to perform
   * @example "assignment_submit"
   */
  tx_type:
    | "course_create"
    | "course_enroll"
    | "modules_manage"
    | "teachers_update"
    | "managers_manage"
    | "assignment_submit"
    | "assessment_assess"
    | "credential_claim"
    | "project_create"
    | "project_join"
    | "tasks_manage"
    | "task_submit"
    | "task_assess"
    | "project_credential_claim"
    | "blacklist_update"
    | "treasury_fund"
    | "access_token_mint";
}

/** Statistics about the TX State Machine for monitoring and debugging. */
export interface TxStateHandlersTxStatsResponse {
  /**
   * Number of transactions confirmed on-chain
   * @example 142
   */
  confirmed_count?: number;
  /**
   * Number of expired transactions (not confirmed within timeout)
   * @example 0
   */
  expired_count?: number;
  /**
   * Number of failed transactions
   * @example 2
   */
  failed_count?: number;
  /**
   * Number of transactions in pending state
   * @example 5
   */
  pending_count?: number;
  /**
   * Current length of the confirmation queue
   * @example 3
   */
  queue_length?: number;
  /** Breakdown of pending transactions by type */
  type_breakdown?: Record<string, number>;
  /**
   * Number of transactions with completed DB updates
   * @example 140
   */
  updated_count?: number;
}

/** List of valid transaction types that can be registered with the TX State Machine. */
export interface TxStateHandlersValidTxTypesResponse {
  /**
   * List of valid transaction type strings
   * @example ["course_create","assignment_submit","access_token_mint"]
   */
  types?: string[];
}

export interface UserViewmodelsDeleteUserRequest {
  /**
   * @minLength 3
   * @maxLength 50
   * @example "johndoe"
   */
  alias: string;
}

export interface UserViewmodelsDeleteUserResponse {
  /** @example "User deleted successfully." */
  message?: string;
}

export interface UserViewmodelsMeResponse {
  active_keys?: ApiKeyViewmodelsAPIKeyResponse[];
  /** @example "johndoe" */
  alias?: string;
  /** @example "2025-08-31T23:59:59Z" */
  created_at?: string;
  /** @example "Free" */
  tier?: string;
  /** @example "a1b2c3d4-e5f6-7890-1234-567890abcdef" */
  user_id?: string;
}

export interface UserViewmodelsUsageResponse {
  /** @example 50 */
  daily_quota_consumed?: number;
  /** @example 1000 */
  daily_quota_limit?: number;
  /** @example "2026-08-31T23:59:59Z" */
  expiration?: string;
  /** @example 500 */
  monthly_quota_consumed?: number;
  /** @example 10000 */
  monthly_quota_limit?: number;
  /** @example ["[\"100 req/min\""," \"1000 req/day\""," \"10000 req/month\"]"] */
  rate_limit_windows?: string[];
  /** @example 950 */
  remaining_daily?: number;
  /** @example 9500 */
  remaining_monthly?: number;
  /** @example "Free" */
  subscription_tier?: string;
}
