/**
 * Generated API Types - Re-exports with Clean Names
 *
 * This file provides clean type aliases for the auto-generated gateway types.
 * Types are generated from the Andamio API Gateway OpenAPI/Swagger spec.
 *
 * Note: The raw generated types have all fields as optional due to Swagger 2.x
 * limitations. This file provides stricter versions with required fields
 * where the API contract guarantees non-null values.
 *
 * Usage:
 *   import { CourseResponse, CourseModuleResponse } from "~/types/generated";
 *
 * To regenerate types after API changes:
 *   npm run generate:types
 *
 * @see gateway.ts - Raw generated types (all fields optional)
 */

// Re-export all raw types for advanced use cases
export * from "./gateway";

// =============================================================================
// Strict Course Types (with required fields)
// =============================================================================

/**
 * Course response with required fields
 * API always returns these fields when a course exists
 */
export interface CourseResponse {
  title: string;
  course_code: string;
  course_nft_policy_id: string | null;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
}

export type CourseListResponse = CourseResponse[];

/**
 * SLT summary in module responses
 */
export interface SLTSummary {
  module_index: number;
  slt_text: string;
}

/**
 * Course module response with required fields
 */
export interface CourseModuleResponse {
  module_code: string;
  title: string;
  description: string | null;
  module_hash: string | null;
  pending_tx_hash: string | null;
  status: string;
  slts: SLTSummary[];
}

export type CourseModuleListResponse = CourseModuleResponse[];

/**
 * SLT (Student Learning Target) response
 */
export interface SLTResponse {
  policy_id: string;
  module_code: string;
  module_index: number;
  slt_text: string;
}

export type SLTListResponse = SLTResponse[];

/**
 * Lesson response with required fields
 */
export interface LessonResponse {
  title: string;
  module_index: number;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  slt_text: string | null;
  content_json: Record<string, unknown> | null;
  live: boolean;
}

export type LessonListResponse = LessonResponse[];

/**
 * Introduction response
 */
export interface IntroductionResponse {
  title: string;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  content_json: Record<string, unknown> | null;
  live: boolean;
}

/**
 * Assignment response
 */
export interface AssignmentResponse {
  title: string;
  assignment_code: string;
  module_code: string;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  content_json: Record<string, unknown> | null;
  slts: SLTSummary[];
  live: boolean;
}

/**
 * Assignment commitment response
 */
export interface AssignmentCommitmentResponse {
  policy_id: string;
  module_code: string;
  access_token_alias: string;
  status: string;
  assignment_title: string | null;
  evidence: Record<string, unknown> | null;
  pending_tx_hash: string | null;
  tx_hash: string | null;
}

/**
 * User course status response
 */
export interface UserCourseStatusResponse {
  policy_id: string;
  is_enrolled: boolean;
  modules_completed: number;
  total_modules: number;
  course: CourseResponse | null;
  commitments: AssignmentCommitmentResponse[];
}

// =============================================================================
// Strict Project Types (with required fields)
// =============================================================================

/**
 * Project task token output
 */
export interface ProjectTaskTokenOutput {
  policy_id: string | null;
  asset_name: string | null;
  asset_name_decoded: string | null;
  quantity: string;
  name: string | null;
  ticker: string | null;
  decimals: number | null;
  subject: string;
}

/**
 * Project task V2 output with required fields
 */
export interface ProjectTaskV2Output {
  index: number;
  title: string;
  content: string | null;
  content_json: Record<string, unknown> | null;
  created_by: string;
  expiration_time: string;
  lovelace: string;
  status: string;
  task_hash: string | null;
  tokens: ProjectTaskTokenOutput[];
}

/**
 * Project prerequisite output
 */
export interface ProjectPrerequisiteOutput {
  course_id: string;
  assignment_ids: string[];
}

/**
 * Project state output
 */
export interface ProjectStateOutput {
  project_state_policy_id: string | null;
  title: string | null;
  description: string | null;
  status: string;
  prerequisites: ProjectPrerequisiteOutput[];
  tasks: ProjectTaskV2Output[];
}

/**
 * Project manager output
 */
export interface ProjectManagerOutput {
  alias: string;
  tx_hash: string | null;
}

/**
 * Project V2 output with required fields
 */
export interface ProjectV2Output {
  project_id: string;
  admin_alias: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  project_address: string | null;
  treasury_address: string | null;
  status: string;
  managers: ProjectManagerOutput[];
  states: ProjectStateOutput[];
}

export type ProjectListResponse = ProjectV2Output[];

/**
 * Task commitment (contributor commitment to a task)
 */
export interface CommitmentV2Output {
  task_hash: string;
  alias: string;
  evidence: Record<string, unknown> | null;
  status: string;
  pending_tx_hash: string | null;
  tx_hash: string | null;
}

// =============================================================================
// Auth Types
// =============================================================================

export type { AndamioApiInternalInternalApiAndamioDbClientLoginSessionResponse as LoginSessionResponse } from "./gateway";

// =============================================================================
// Transaction Types (Atlas TX API)
// =============================================================================

export type { AndamioApiInternalInternalApiAtlasTxClientCreateCourseTxRequest as CreateCourseTxRequest } from "./gateway";
export type { AndamioApiInternalInternalApiAtlasTxClientClaimCourseCredentialsTxRequest as ClaimCourseCredentialsTxRequest } from "./gateway";
export type { AndamioApiInternalInternalApiAtlasTxClientUnsignedTxResponseInitCourse as UnsignedTxResponseInitCourse } from "./gateway";
export type { AndamioApiInternalInternalApiAtlasTxClientUnsignedTxResponse as UnsignedTxResponse } from "./gateway";

// =============================================================================
// Merged/Orchestration Types (Combined DB + On-Chain Data)
// =============================================================================

export type { MergedHandlersMergedCourseDetailResponse as MergedCourseDetailResponse } from "./gateway";
export type { MergedHandlersMergedCoursesResponse as MergedCoursesResponse } from "./gateway";
export type { MergedHandlersStudentCoursesResponse as StudentCoursesResponse } from "./gateway";
export type { MergedHandlersStudentAssignmentCommitmentResponse as StudentAssignmentCommitmentResponse } from "./gateway";
export type { MergedHandlersStudentAssignmentCommitmentsResponse as StudentAssignmentCommitmentsResponse } from "./gateway";
export type { MergedHandlersTeacherAssignmentCommitmentsResponse as TeacherAssignmentCommitmentsResponse } from "./gateway";

export type { OrchestrationMergedCourseDetail as MergedCourseDetail } from "./gateway";
export type { OrchestrationMergedCourseListItem as MergedCourseListItem } from "./gateway";
export type { OrchestrationStudentCourseListItem as StudentCourseListItem } from "./gateway";
export type { OrchestrationStudentAssignmentCommitmentItem as StudentAssignmentCommitmentItem } from "./gateway";
export type { OrchestrationTeacherAssignmentCommitmentItem as TeacherAssignmentCommitmentItem } from "./gateway";
export type { OrchestrationCourseContent as CourseContent } from "./gateway";
export type { OrchestrationCourseModule as OrchestrationCourseModule } from "./gateway";
export type { OrchestrationAssignmentCommitmentContent as AssignmentCommitmentContent } from "./gateway";
export type { OrchestrationTaskCommitmentContent as TaskCommitmentContent } from "./gateway";

// =============================================================================
// Request Types (for API calls)
// =============================================================================

// Course requests
export type { AndamioApiInternalInternalApiAndamioDbClientCreateCourseRequest as CreateCourseRequest } from "./gateway";
export type { AndamioApiInternalInternalApiAndamioDbClientUpdateCourseRequest as UpdateCourseRequest } from "./gateway";
export type { AndamioApiInternalInternalApiAndamioDbClientCreateModuleRequest as CreateModuleRequest } from "./gateway";
export type { AndamioApiInternalInternalApiAndamioDbClientCreateSLTRequest as CreateSLTRequest } from "./gateway";
export type { AndamioApiInternalInternalApiAndamioDbClientCreateLessonRequest as CreateLessonRequest } from "./gateway";
export type { AndamioApiInternalInternalApiAndamioDbClientCreateIntroductionRequest as CreateIntroductionRequest } from "./gateway";
export type { AndamioApiInternalInternalApiAndamioDbClientCreateAssignmentRequest as CreateAssignmentRequest } from "./gateway";
export type { AndamioApiInternalInternalApiAndamioDbClientCreateAssignmentCommitmentRequest as CreateAssignmentCommitmentRequest } from "./gateway";
export type { AndamioApiInternalInternalApiAndamioDbClientReviewAssignmentCommitmentRequest as ReviewAssignmentCommitmentRequest } from "./gateway";
export type { AndamioApiInternalInternalApiAndamioDbClientMintCourseRequest as MintCourseRequest } from "./gateway";

// Project requests
export type { AndamioApiInternalInternalApiAndamioDbClientCreateProjectRequest as CreateProjectRequest } from "./gateway";
export type { AndamioApiInternalInternalApiAndamioDbClientCreateTaskRequest as CreateTaskRequest } from "./gateway";
export type { AndamioApiInternalInternalApiAndamioDbClientCreateTaskToken as CreateTaskToken } from "./gateway";
export type { AndamioApiInternalInternalApiAndamioDbClientCreateTaskCommitmentRequest as CreateTaskCommitmentRequest } from "./gateway";
export type { AndamioApiInternalInternalApiAndamioDbClientUpdateTaskCommitmentRequest as UpdateTaskCommitmentRequest } from "./gateway";

// =============================================================================
// Nullable Types (for reference)
// =============================================================================

export type { AndamioApiInternalInternalApiAndamioDbClientNullableString as NullableString } from "./gateway";
export type { AndamioApiInternalInternalApiAndamioDbClientNullableInt32 as NullableInt32 } from "./gateway";

// =============================================================================
// TX State Machine Types
// =============================================================================

export type { TxStateHandlersRegisterPendingTxRequest as TxRegisterRequest } from "./gateway";
export type { TxStateHandlersPendingTxResponse as TxStatusResponse } from "./gateway";
export type { TxStateHandlersValidTxTypesResponse as ValidTxTypesResponse } from "./gateway";
export type { TxStateHandlersTxStatsResponse as TxStatsResponse } from "./gateway";

/**
 * Valid transaction types for the TX State Machine
 * Use with POST /api/v2/tx/register
 */
export type GatewayTxType =
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
 * Transaction state in the TX State Machine lifecycle
 */
export type TxState = "pending" | "confirmed" | "updated" | "failed" | "expired";
