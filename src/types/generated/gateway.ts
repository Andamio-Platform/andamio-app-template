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

export interface AndamioApiInternalInternalApiAndamioDbClientCreateProjectRequest {
  description?: string;
  image_url?: string;
  /** Blockchain transaction hash */
  pending_tx_hash?: string;
  project_address?: string;
  project_id?: string;
  title?: string;
  treasury_address?: string;
}

export interface AndamioApiInternalInternalApiAndamioDbClientCreateTaskCommitmentRequest {
  /** Optional initial evidence (Tiptap document) */
  evidence?: Record<string, any>;
  task_hash?: string;
}

export interface AndamioApiInternalInternalApiAndamioDbClientCreateTaskRequest {
  /** Off-chain content hash for TX matching (optional, client-generated) */
  arbitrary_hash?: string;
  content?: string;
  /** Rich JSON task description (Tiptap document) */
  content_json?: Record<string, any>;
  /** Expiration time (Unix timestamp ms as string) */
  expiration_time?: string;
  /** Lovelace amount (as string for BigInt) */
  lovelace_amount?: string;
  project_state_policy_id?: string;
  title?: string;
  tokens?: AndamioApiInternalInternalApiAndamioDbClientCreateTaskToken[];
}

export interface AndamioApiInternalInternalApiAndamioDbClientCreateTaskToken {
  asset_name?: string;
  policy_id?: string;
  quantity?: string;
}

export interface AndamioApiInternalInternalApiAndamioDbClientInitRolesResponse {
  message?: string;
  roles_created?: string[];
  success?: boolean;
}

export interface AndamioApiInternalInternalApiAndamioDbClientLoginSessionResponse {
  expires_at?: string;
  /** Session ID (required for validate endpoint) */
  id?: string;
  /** Random nonce to sign with wallet */
  nonce?: string;
}

export type AndamioApiInternalInternalApiAndamioDbClientNullableInt32 = object;

export type AndamioApiInternalInternalApiAndamioDbClientNullableString = object;

export interface AndamioApiInternalInternalApiAndamioDbClientProject {
  description?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  image_url?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  managers?: AndamioApiInternalInternalApiAndamioDbClientProjectManager[];
  owner_alias?: string;
  /** Pending transaction hash */
  pending_tx_hash?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  project_address?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  project_id?: string;
  project_status?: string;
  /** Blockchain slot */
  slot?: AndamioApiInternalInternalApiAndamioDbClientNullableInt32;
  states?: AndamioApiInternalInternalApiAndamioDbClientProjectState[];
  title?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  treasury_address?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  /** Confirmed transaction hash */
  tx_hash?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
}

export interface AndamioApiInternalInternalApiAndamioDbClientProjectManager {
  alias?: string;
  tx_hash?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
}

export interface AndamioApiInternalInternalApiAndamioDbClientProjectManagerTaskDeletePostRequest {
  task_hash?: string;
}

export interface AndamioApiInternalInternalApiAndamioDbClientProjectManagerTasksListPostRequest {
  project_id?: string;
  /** Optional: filter by task status */
  status?: string;
}

export interface AndamioApiInternalInternalApiAndamioDbClientProjectPrerequisite {
  assignment_ids?: string[];
  /** Course NFT policy ID */
  course_id?: string;
}

export interface AndamioApiInternalInternalApiAndamioDbClientProjectState {
  description?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  /** Pending transaction hash */
  pending_tx_hash?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  prerequisites?: AndamioApiInternalInternalApiAndamioDbClientProjectPrerequisite[];
  project_state_policy_id?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  project_state_status?: string;
  tasks?: AndamioApiInternalInternalApiAndamioDbClientProjectTask[];
  title?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
}

export interface AndamioApiInternalInternalApiAndamioDbClientProjectTask {
  /** Off-chain content hash for TX matching (set at task creation) */
  arbitrary_hash?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  /** Task commitments (when included) */
  commitments?: AndamioApiInternalInternalApiAndamioDbClientTaskCommitment[];
  /** Plain text content */
  content?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  /** Rich JSON task description (Tiptap document) */
  content_json?: Record<string, any>;
  /** Alias of creator */
  created_by_alias?: string;
  /** Expiration time (Unix timestamp ms as string) */
  expiration_time?: string;
  /** Task index within project state */
  index?: number;
  /** Lovelace reward amount (as string for BigInt) */
  lovelace_amount?: string;
  /** Pending transaction hash */
  pending_tx_hash?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  /** On-chain task hash (null for DRAFT) */
  task_hash?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  task_status?: string;
  title?: string;
  tokens?: AndamioApiInternalInternalApiAndamioDbClientProjectTaskToken[];
}

export interface AndamioApiInternalInternalApiAndamioDbClientProjectTaskToken {
  asset_name?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  asset_name_decoded?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  decimals?: AndamioApiInternalInternalApiAndamioDbClientNullableInt32;
  name?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  policy_id?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  /** Token quantity (as string for BigInt) */
  quantity?: string;
  /** Policy ID + asset name */
  subject?: string;
  ticker?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
}

export interface AndamioApiInternalInternalApiAndamioDbClientRegisterProjectRequest {
  description?: string;
  image_url?: string;
  project_id?: string;
  title?: string;
}

export interface AndamioApiInternalInternalApiAndamioDbClientSuccessResponse {
  message?: string;
  success?: boolean;
}

export interface AndamioApiInternalInternalApiAndamioDbClientTaskCommitment {
  /** Assessment transaction hash */
  assess_tx_hash?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  /** Claim transaction hash */
  claim_tx_hash?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  /** Commit transaction hash */
  commit_tx_hash?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  commitment_status?: string;
  /** Access token alias of the contributor */
  contributor_alias?: string;
  /** Rich JSON evidence content (Tiptap document) */
  evidence?: Record<string, any>;
  /** Alias of manager who assessed */
  manager_alias?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  pending_tx_hash?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  /** Submit transaction hash */
  submit_tx_hash?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  task?: AndamioApiInternalInternalApiAndamioDbClientProjectTask;
  /** Hash of evidence for on-chain verification */
  task_evidence_hash?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  task_hash?: string;
  task_outcome?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
}

export interface AndamioApiInternalInternalApiAndamioDbClientUpdateProjectRequest {
  data?: AndamioApiInternalInternalApiAndamioDbClientUpdateProjectRequestData;
  project_id?: string;
}

export interface AndamioApiInternalInternalApiAndamioDbClientUpdateProjectRequestData {
  description?: string;
  image_url?: string;
  project_address?: string;
  title?: string;
  treasury_address?: string;
}

export interface AndamioApiInternalInternalApiAndamioDbClientUpdateTaskCommitmentRequest {
  /** Rich JSON evidence content (Tiptap document) */
  evidence?: Record<string, any>;
  /** Hash of evidence for on-chain verification */
  evidence_hash?: string;
  task_hash?: string;
}

export interface AndamioApiInternalInternalApiAndamioDbClientUpdateTaskRequest {
  content?: string;
  /** Rich JSON task description (Tiptap document) */
  content_json?: Record<string, any>;
  expiration_time?: string;
  index?: number;
  lovelace_amount?: string;
  project_state_policy_id?: string;
  title?: string;
  tokens?: AndamioApiInternalInternalApiAndamioDbClientCreateTaskToken[];
}

export interface AndamioApiInternalInternalApiAndamioDbClientUserAccessTokenAliasPostRequest {
  access_token_alias?: string;
}

export interface AndamioApiInternalInternalApiAndamioDbClientValidateSignatureRequest {
  /** Wallet address (hex or bech32) */
  address?: string;
  /** Full access token unit (policyId + hex-encoded name) */
  andamio_access_token_unit?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  /** For wallets that hex-encode the nonce as UTF8 */
  convert_utf8?: boolean;
  /** Session ID from /auth/login/session */
  id?: string;
  signature?: AndamioDbClientSignatureData;
  /** Wallet name for debugging */
  wallet_preference?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
}

export interface AndamioApiInternalInternalApiAndamioDbClientValidateSignatureResponse {
  /** JWT token for authenticated requests */
  jwt?: string;
  user?: AndamioDbClientUserSummary;
}

export interface AndamioDbClientAddTeachersV2Request {
  aliases?: string[];
  course_id?: string;
}

export interface AndamioDbClientAssignmentCommitmentV2 {
  assignment?: AndamioDbClientAssignmentV2;
  assignment_evidence_hash?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  commitment_status?: string;
  course_id?: string;
  course_module_code?: string;
  /** JSON evidence data */
  evidence?: Record<string, any>;
  /** Access token alias of the participant */
  participant_alias?: string;
  pending_tx_hash?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  slt_hash?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
}

export interface AndamioDbClientAssignmentV2 {
  /** Tiptap JSON content */
  content_json?: Record<string, any>;
  created_by_alias?: string;
  description?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  image_url?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  is_live?: boolean;
  title?: string;
  video_url?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
}

export interface AndamioDbClientClaimCredentialV2Request {
  course_id?: string;
  course_module_code?: string;
  pending_tx_hash?: string;
}

export interface AndamioDbClientCourseModuleV2 {
  assignment?: AndamioDbClientAssignmentV2;
  course_module_code?: string;
  created_by_alias?: string;
  description?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  image_url?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  introduction?: AndamioDbClientIntroductionV2;
  is_live?: boolean;
  module_status?: string;
  /** Hash of SLT list, used as module token name on-chain */
  slt_hash?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  slts?: AndamioDbClientSltV2[];
  title?: string;
  video_url?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
}

export interface AndamioDbClientCourseModuleV2Brief {
  course_module_code?: string;
  description?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  is_live?: boolean;
  module_status?: string;
  slt_hash?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  title?: string;
}

export interface AndamioDbClientCourseTeacherV2 {
  added_at?: string;
  alias?: string;
  tx_hash?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
}

export interface AndamioDbClientCourseV2 {
  category?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  /** Unique course identifier */
  course_id?: string;
  course_status?: string;
  description?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  image_url?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  is_public?: boolean;
  modules?: AndamioDbClientCourseModuleV2Brief[];
  /** Access token alias of the course owner */
  owner_alias?: string;
  teachers?: AndamioDbClientCourseTeacherV2[];
  title?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  video_url?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
}

export interface AndamioDbClientCreateAssignmentCommitmentV2Request {
  course_id?: string;
  course_module_code?: string;
}

export interface AndamioDbClientCreateAssignmentV2Request {
  content_json?: Record<string, any>;
  course_id?: string;
  course_module_code?: string;
  description?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  image_url?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  title?: string;
  video_url?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
}

export interface AndamioDbClientCreateCourseV2Request {
  category?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  course_id?: string;
  description?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  image_url?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  is_public?: boolean;
  pending_tx_hash?: string;
  title?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  video_url?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
}

export interface AndamioDbClientCreateIntroductionV2Request {
  /** Tiptap JSON content */
  content?: Record<string, any>;
  course_id?: string;
  course_module_code?: string;
  title?: string;
}

export interface AndamioDbClientCreateLessonV2Request {
  content_json?: Record<string, any>;
  course_id?: string;
  course_module_code?: string;
  description?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  image_url?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  slt_index?: number;
  title?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  video_url?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
}

export interface AndamioDbClientCreateModuleV2Request {
  course_id?: string;
  course_module_code?: string;
  description?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  image_url?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  title?: string;
  video_url?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
}

export interface AndamioDbClientCreateSltV2Request {
  course_id?: string;
  course_module_code?: string;
  /** Optional, appends to end if not provided */
  index?: AndamioApiInternalInternalApiAndamioDbClientNullableInt32;
  slt_text?: string;
}

export interface AndamioDbClientDeleteAssignmentV2Request {
  course_id?: string;
  course_module_code?: string;
}

export interface AndamioDbClientDeleteIntroductionV2Request {
  course_id?: string;
  course_module_code?: string;
}

export interface AndamioDbClientDeleteLessonV2Request {
  course_id?: string;
  course_module_code?: string;
  slt_index?: number;
}

export interface AndamioDbClientDeleteModuleV2Request {
  course_id?: string;
  course_module_code?: string;
}

export interface AndamioDbClientDeleteSltV2Request {
  course_id?: string;
  course_module_code?: string;
  index?: number;
}

export interface AndamioDbClientGetAssignmentCommitmentV2Request {
  /** Course NFT policy ID */
  course_id?: string;
  /** Module code within course */
  course_module_code?: string;
}

export interface AndamioDbClientIntroductionV2 {
  /** Tiptap JSON content */
  content_json?: Record<string, any>;
  created_by_alias?: string;
  description?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  image_url?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  is_live?: boolean;
  title?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  video_url?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
}

export interface AndamioDbClientLeaveAssignmentCommitmentV2Request {
  course_id?: string;
  course_module_code?: string;
  pending_tx_hash?: string;
}

export interface AndamioDbClientLessonV2 {
  /** Tiptap JSON content */
  content_json?: Record<string, any>;
  created_by_alias?: string;
  description?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  image_url?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  is_live?: boolean;
  title?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  video_url?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
}

export interface AndamioDbClientListModulesV2Request {
  /** Optional course filter */
  course_id?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
}

export interface AndamioDbClientPublishModuleV2Request {
  course_id?: string;
  course_module_code?: string;
}

export interface AndamioDbClientRegisterCourseV2Request {
  category?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  course_id?: string;
  description?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  image_url?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  is_public?: boolean;
  title?: string;
  tx_hash?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  video_url?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
}

export interface AndamioDbClientRemoveTeachersV2Request {
  aliases?: string[];
  course_id?: string;
}

export interface AndamioDbClientReorderSltV2Request {
  course_id?: string;
  course_module_code?: string;
  new_index?: number;
  old_index?: number;
}

export interface AndamioDbClientReviewAssignmentCommitmentV2Request {
  course_id?: string;
  course_module_code?: string;
  decision?: string;
  participant_alias?: string;
  pending_tx_hash?: string;
}

export interface AndamioDbClientSignatureData {
  /** CIP-30 COSE_Key (hex) */
  key?: string;
  /** CIP-30 COSE_Sign1 signature (hex) */
  signature?: string;
}

export interface AndamioDbClientSltV2 {
  created_by_alias?: string;
  index?: number;
  lesson?: AndamioDbClientLessonV2;
  slt_text?: string;
}

export interface AndamioDbClientSubmitAssignmentCommitmentV2Request {
  course_id?: string;
  course_module_code?: string;
  evidence?: Record<string, any>;
  evidence_hash?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  pending_tx_hash?: string;
}

export interface AndamioDbClientUpdateAssignmentCommitmentV2Request {
  course_id?: string;
  course_module_code?: string;
  evidence?: Record<string, any>;
  evidence_hash?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
}

export interface AndamioDbClientUpdateAssignmentV2Request {
  /** Tiptap JSON content */
  content?: Record<string, any>;
  course_id?: string;
  course_module_code?: string;
  title?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
}

export interface AndamioDbClientUpdateCourseV2Request {
  course_id?: string;
  data?: AndamioDbClientUpdateCourseV2RequestData;
}

export interface AndamioDbClientUpdateCourseV2RequestData {
  category?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  description?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  image_url?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  is_public?: boolean;
  title?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  video_url?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
}

export interface AndamioDbClientUpdateIntroductionV2Request {
  /** Tiptap JSON content */
  content?: Record<string, any>;
  course_id?: string;
  course_module_code?: string;
  title?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
}

export interface AndamioDbClientUpdateLessonV2Request {
  /** Tiptap JSON content */
  content?: Record<string, any>;
  course_id?: string;
  course_module_code?: string;
  slt_index?: number;
}

export interface AndamioDbClientUpdateModuleV2Request {
  course_id?: string;
  course_module_code?: string;
  description?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  image_url?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  title?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  video_url?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
}

export interface AndamioDbClientUpdateSltV2Request {
  course_id?: string;
  course_module_code?: string;
  index?: number;
  slt_text?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
}

export interface AndamioDbClientUpdateTeachersV2Request {
  /** Aliases to add as teachers */
  add?: string[];
  course_id?: string;
  /** Aliases to remove as teachers */
  remove?: string[];
}

export interface AndamioDbClientUpdateTeachersV2Response {
  course_id?: string;
  success?: boolean;
  teachers_added?: string[];
  /** Final list of teachers after updates */
  teachers_current?: string[];
  teachers_removed?: string[];
}

export interface AndamioDbClientUserSummary {
  access_token_alias?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  cardano_bech32_addr?: AndamioApiInternalInternalApiAndamioDbClientNullableString;
  id?: string;
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

export interface AtlasTxClientAddFundsTxRequest {
  /** Plain text alias (not hex encoded). Only alphanumeric characters and underscores allowed. */
  alias?: string;
  /** List of (asset class, quantity) pairs. This is an asset class, i.e. either \"lovelace\" or some other token with its minting policy and token name delimited by dot (.). */
  deposit_value?: Record<string, any>[][];
  initiator_data?: AtlasTxClientWalletData;
  /** This is the hash of a minting policy script. */
  project_id?: string;
}

export interface AtlasTxClientAssessAssignmentsTxRequest {
  /** Plain text alias (not hex encoded). Only alphanumeric characters and underscores allowed. */
  alias?: string;
  assignment_decisions?: AtlasTxClientAssignmentOutcome[];
  /** This is the hash of a minting policy script. */
  course_id?: string;
  initiator_data?: AtlasTxClientWalletData;
}

export interface AtlasTxClientAssignmentActionTxRequest {
  /** Plain text alias (not hex encoded). Only alphanumeric characters and underscores allowed. */
  alias?: string;
  /** A text string with a maximum length of 140 characters */
  assignment_info?: string;
  /** This is the hash of a minting policy script. */
  course_id?: string;
  initiator_data?: AtlasTxClientWalletData;
}

export interface AtlasTxClientAssignmentOutcome {
  /** Plain text alias (not hex encoded). Only alphanumeric characters and underscores allowed. */
  alias?: string;
  outcome?: string;
}

export interface AtlasTxClientClaimCourseCredentialsTxRequest {
  /** Plain text alias (not hex encoded). Only alphanumeric characters and underscores allowed. */
  alias?: string;
  /** This is the hash of a minting policy script. */
  course_id?: string;
  initiator_data?: AtlasTxClientWalletData;
}

export interface AtlasTxClientClaimProjectCredentialsTxRequest {
  /** Plain text alias (not hex encoded). Only alphanumeric characters and underscores allowed. */
  alias?: string;
  /** This is the hash of a minting policy script. */
  contributor_state_id?: string;
  fee_tier?: string;
  initiator_data?: AtlasTxClientWalletData;
  /** This is the hash of a minting policy script. */
  project_id?: string;
}

export interface AtlasTxClientCommitAssignmentTxRequest {
  /** Plain text alias (not hex encoded). Only alphanumeric characters and underscores allowed. */
  alias?: string;
  /** A text string with a maximum length of 140 characters */
  assignment_info?: string;
  /** This is the hash of a minting policy script. */
  course_id?: string;
  initiator_data?: AtlasTxClientWalletData;
  /** Hex encoded hash of slts (exactly 64 characters) */
  slt_hash?: string;
}

export interface AtlasTxClientCommitTaskTxRequest {
  /** Plain text alias (not hex encoded). Only alphanumeric characters and underscores allowed. */
  alias?: string;
  /** This is the hash of a minting policy script. */
  contributor_state_id?: string;
  fee_tier?: string;
  initiator_data?: AtlasTxClientWalletData;
  /** This is the hash of a minting policy script. */
  project_id?: string;
  /** Hex encoded hash of slts (exactly 64 characters) */
  task_hash?: string;
  /** A text string with a maximum length of 140 characters */
  task_info?: string;
}

export interface AtlasTxClientCreateCourseTxRequest {
  /** Plain text alias (not hex encoded). Only alphanumeric characters and underscores allowed. */
  alias?: string;
  initiator_data?: AtlasTxClientWalletData;
  teachers?: string[];
}

export interface AtlasTxClientCreateProjectTxRequest {
  /** Plain text alias (not hex encoded). Only alphanumeric characters and underscores allowed. */
  alias?: string;
  course_prereqs?: Record<string, any>[][];
  initiator_data?: AtlasTxClientWalletData;
  managers?: string[];
}

export interface AtlasTxClientManageContributorBlacklistTxRequest {
  /** Plain text alias (not hex encoded). Only alphanumeric characters and underscores allowed. */
  alias?: string;
  aliases_to_add?: string[];
  aliases_to_remove?: string[];
  initiator_data?: AtlasTxClientWalletData;
  /** This is the hash of a minting policy script. */
  project_id?: string;
}

export interface AtlasTxClientManageManagersTxRequest {
  /** Plain text alias (not hex encoded). Only alphanumeric characters and underscores allowed. */
  alias?: string;
  initiator_data?: AtlasTxClientWalletData;
  managers_to_add?: string[];
  managers_to_remove?: string[];
  /** This is the hash of a minting policy script. */
  project_id?: string;
}

export interface AtlasTxClientManageModulesTxRequest {
  /** Plain text alias (not hex encoded). Only alphanumeric characters and underscores allowed. */
  alias?: string;
  /** This is the hash of a minting policy script. */
  course_id?: string;
  initiator_data?: AtlasTxClientWalletData;
  modules_to_add?: AtlasTxClientMintModuleV2[];
  modules_to_remove?: string[];
  modules_to_update?: AtlasTxClientUpdateModuleV2[];
}

export interface AtlasTxClientManageTasksTxRequest {
  /** Plain text alias (not hex encoded). Only alphanumeric characters and underscores allowed. */
  alias?: string;
  /** This is the hash of a minting policy script. */
  contributor_state_id?: string;
  /** List of (asset class, quantity) pairs. This is an asset class, i.e. either \"lovelace\" or some other token with its minting policy and token name delimited by dot (.). */
  deposit_value?: Record<string, any>[][];
  initiator_data?: AtlasTxClientWalletData;
  /** This is the hash of a minting policy script. */
  project_id?: string;
  tasks_to_add?: AtlasTxClientTaskData[];
  tasks_to_remove?: AtlasTxClientTaskData[];
}

export interface AtlasTxClientManageTeachersTxRequest {
  /** Plain text alias (not hex encoded). Only alphanumeric characters and underscores allowed. */
  alias?: string;
  /** This is the hash of a minting policy script. */
  course_id?: string;
  initiator_data?: AtlasTxClientWalletData;
  teachers_to_add?: string[];
  teachers_to_remove?: string[];
}

export interface AtlasTxClientMintAccessTokenTxRequest {
  /** Plain text alias (not hex encoded). Only alphanumeric characters and underscores allowed. */
  alias?: string;
  /** An address, serialised as Bech32. */
  initiator_data?: string;
}

export interface AtlasTxClientMintModuleV2 {
  allowed_student_state_ids?: string[];
  prereq_slt_hashes?: string[];
  slts?: string[];
}

export interface AtlasTxClientProjectOutcome {
  /** Plain text alias (not hex encoded). Only alphanumeric characters and underscores allowed. */
  alias?: string;
  outcome?: string;
}

export interface AtlasTxClientTaskActionTxRequest {
  /** Plain text alias (not hex encoded). Only alphanumeric characters and underscores allowed. */
  alias?: string;
  initiator_data?: AtlasTxClientWalletData;
  /** This is the hash of a minting policy script. */
  project_id?: string;
  /** A text string with a maximum length of 140 characters */
  project_info?: string;
}

export interface AtlasTxClientTaskData {
  expiration_posix?: number;
  lovelace_amount?: number;
  /** List of (asset class, quantity) pairs. This is an asset class, i.e. either \"lovelace\" or some other token with its minting policy and token name delimited by dot (.). */
  native_assets?: Record<string, any>[][];
  /** A text string with a maximum length of 140 characters */
  project_content?: string;
}

export interface AtlasTxClientTasksAssessV2TxRequest {
  /** Plain text alias (not hex encoded). Only alphanumeric characters and underscores allowed. */
  alias?: string;
  /** This is the hash of a minting policy script. */
  contributor_state_id?: string;
  initiator_data?: AtlasTxClientWalletData;
  /** This is the hash of a minting policy script. */
  project_id?: string;
  task_decisions?: AtlasTxClientProjectOutcome[];
}

export interface AtlasTxClientUnsignedTxResponse {
  unsigned_tx?: string;
}

export interface AtlasTxClientUnsignedTxResponseInitCourse {
  /** This is the hash of a minting policy script. */
  course_id?: string;
  unsigned_tx?: string;
}

export interface AtlasTxClientUnsignedTxResponseInitProject {
  /** This is the hash of a minting policy script. */
  project_id?: string;
  unsigned_tx?: string;
}

export interface AtlasTxClientUpdateModuleV2 {
  allowed_student_state_ids?: string[];
  prereq_slt_hashes?: string[];
  /** Hex encoded hash of slts (exactly 64 characters) */
  slt_hash?: string;
}

export interface AtlasTxClientWalletData {
  /** An address, serialised as Bech32. */
  change_address?: string;
  used_addresses?: string[];
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
  task_id?: string;
}

export interface MergedHandlersGetStudentAssignmentCommitmentRequest {
  course_id?: string;
  module_code?: string;
}

export interface MergedHandlersListManagerTasksRequest {
  project_id?: string;
}

export interface MergedHandlersListTasksRequest {
  project_id?: string;
}

export interface MergedHandlersManagerCommitmentsResponse {
  data?: OrchestrationManagerCommitmentItem[];
  warning?: string;
}

export interface MergedHandlersManagerProjectsResponse {
  data?: OrchestrationManagerProjectListItem[];
  warning?: string;
}

export interface MergedHandlersMergedCourseDetailResponse {
  data?: OrchestrationMergedCourseDetail;
  warning?: string;
}

export interface MergedHandlersMergedCoursesResponse {
  data?: OrchestrationMergedCourseListItem[];
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

export interface MergedHandlersMergedTasksResponse {
  data?: OrchestrationMergedTaskListItem[];
  warning?: string;
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
  task_id?: string;
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
  assignment_id?: string;
  created_by?: string;
  prerequisites?: string[];
  slts?: string[];
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
  task_id?: string;
}

export interface OrchestrationManagerCommitmentTaskInfo {
  assets?: any;
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

export interface OrchestrationMergedCourseDetail {
  /** Off-chain content (nested) */
  content?: OrchestrationCourseContent;
  course_address?: string;
  /** On-chain fields (top level) */
  course_id?: string;
  modules?: OrchestrationCourseModule[];
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

export interface OrchestrationMergedTaskListItem {
  /** Native assets */
  assets?: any;
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
  task_id?: string;
}

export interface OrchestrationMyCommitmentSummary {
  /** committed, submitted, approved, rejected */
  commitment_status?: string;
  content?: OrchestrationTaskCommitmentContent;
  task_id?: string;
}

export interface OrchestrationPendingAssessmentSummary {
  on_chain_content?: string;
  submission_tx?: string;
  submitted_by?: string;
  task_id?: string;
}

export interface OrchestrationProjectAssessmentOnChain {
  assessed_by?: string;
  /** ACCEPTED, REFUSED, DENIED */
  decision?: string;
  task_id?: string;
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
  assignment_ids?: string[];
  course_id?: string;
}

export interface OrchestrationProjectSubmissionOnChain {
  on_chain_content?: string;
  submission_tx?: string;
  submitted_by?: string;
  task_id?: string;
}

export interface OrchestrationProjectTaskOnChain {
  /** Native assets */
  assets?: any;
  contributor_state_id?: string;
  created_by?: string;
  /** ISO timestamp */
  expiration?: string;
  expiration_posix?: number;
  lovelace_amount?: number;
  /** Hex-encoded */
  on_chain_content?: string;
  task_id?: string;
}

export interface OrchestrationProjectTreasuryFundingOnChain {
  alias?: string;
  assets?: any;
  lovelace_amount?: number;
  slot?: number;
  tx_hash?: string;
}

export interface OrchestrationStudentAssignmentCommitmentItem {
  /** Identifiers */
  assignment_id?: string;
  /** Off-chain content (nested) */
  content?: OrchestrationAssignmentCommitmentContent;
  course_id?: string;
  module_code?: string;
  /** Hex-encoded on-chain content */
  on_chain_content?: string;
  /** On-chain status */
  on_chain_status?: string;
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
  description?: string;
  task_index?: number;
  title?: string;
}

export interface OrchestrationTeacherAssignmentCommitmentItem {
  assignment_id?: string;
  /** Off-chain content (nested) */
  content?: OrchestrationAssignmentCommitmentContent;
  /** Identifiers */
  course_id?: string;
  /** Hex-encoded on-chain content */
  on_chain_content?: string;
  /** Data source indicator */
  source?: string;
  student_alias?: string;
  submission_slot?: number;
  /** On-chain submission info */
  submission_tx?: string;
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
