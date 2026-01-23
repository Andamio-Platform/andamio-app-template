/**
 * Type re-exports from generated gateway types
 *
 * This file provides:
 * 1. Clean type aliases for internal DB client types
 * 2. Re-exports for orchestration types (already well-named)
 * 3. Custom types not in the API spec
 *
 * @see gateway.ts - Raw auto-generated types from OpenAPI spec
 */

// =============================================================================
// DB Client Type Aliases - Course System
// =============================================================================

export type {
  AndamioApiInternalInternalApiAndamioDbClientCourseV2 as CourseResponse,
  AndamioApiInternalInternalApiAndamioDbClientCourseModuleV2 as CourseModuleResponse,
  AndamioApiInternalInternalApiAndamioDbClientCourseModuleV2Brief as CourseModuleBriefResponse,
  AndamioApiInternalInternalApiAndamioDbClientSltV2 as SLTResponse,
  AndamioApiInternalInternalApiAndamioDbClientAssignmentV2 as AssignmentResponse,
  AndamioApiInternalInternalApiAndamioDbClientIntroductionV2 as IntroductionResponse,
  AndamioApiInternalInternalApiAndamioDbClientAssignmentCommitmentV2 as AssignmentCommitmentResponse,
  AndamioApiInternalInternalApiAndamioDbClientCourseTeacherV2 as CourseTeacherResponse,
} from "./gateway";

// Extended type for lesson response - includes slt_index which the API returns but OpenAPI spec doesn't document
import type { AndamioApiInternalInternalApiAndamioDbClientLessonV2 } from "./gateway";
export type LessonResponse = AndamioApiInternalInternalApiAndamioDbClientLessonV2 & {
  /** The SLT index this lesson is associated with (returned by API but not in OpenAPI spec) */
  slt_index?: number;
};

// List type aliases (arrays of base types)
import type {
  AndamioApiInternalInternalApiAndamioDbClientCourseV2,
  AndamioApiInternalInternalApiAndamioDbClientCourseModuleV2,
  AndamioApiInternalInternalApiAndamioDbClientSltV2,
  AndamioApiInternalInternalApiAndamioDbClientAssignmentV2,
} from "./gateway";

export type CourseListResponse = AndamioApiInternalInternalApiAndamioDbClientCourseV2[];
export type CourseModuleListResponse = AndamioApiInternalInternalApiAndamioDbClientCourseModuleV2[];
export type SLTListResponse = AndamioApiInternalInternalApiAndamioDbClientSltV2[];
export type LessonListResponse = LessonResponse[];
export type AssignmentListResponse = AndamioApiInternalInternalApiAndamioDbClientAssignmentV2[];

// =============================================================================
// DB Client Type Aliases - Project System
// =============================================================================

export type {
  AndamioApiInternalInternalApiAndamioDbClientProject as ProjectV2Output,
  AndamioApiInternalInternalApiAndamioDbClientProjectTask as ProjectTaskV2Output,
  AndamioApiInternalInternalApiAndamioDbClientTaskCommitment as CommitmentV2Output,
  AndamioApiInternalInternalApiAndamioDbClientProjectState as ProjectStateOutput,
  AndamioApiInternalInternalApiAndamioDbClientProjectPrerequisite as ProjectPrerequisiteOutput,
  AndamioApiInternalInternalApiAndamioDbClientProjectTaskToken as ProjectTaskTokenOutput,
} from "./gateway";

// =============================================================================
// Orchestration Types (re-exports, already well-named)
// =============================================================================

export type {
  // Course orchestration
  OrchestrationCourseModule,
  OrchestrationCourseContent,
  OrchestrationMergedCourseDetail,
  OrchestrationMergedCourseListItem,
  OrchestrationStudentCourseListItem,
  OrchestrationStudentAssignmentCommitmentItem,
  OrchestrationTeacherAssignmentCommitmentItem,
  OrchestrationAssignmentCommitmentContent,

  // Project orchestration
  OrchestrationMergedProjectDetail,
  OrchestrationMergedProjectListItem,
  OrchestrationMergedTaskListItem,
  OrchestrationContributorProjectListItem,
  OrchestrationManagerProjectListItem,
  OrchestrationContributorCommitmentItem,
  OrchestrationManagerCommitmentItem,
  OrchestrationManagerCommitmentTaskInfo,
  OrchestrationProjectTaskOnChain,
  OrchestrationProjectContent,
  OrchestrationProjectPrerequisite,
  OrchestrationProjectContributorOnChain,
  OrchestrationProjectSubmissionOnChain,
  OrchestrationProjectAssessmentOnChain,
  OrchestrationProjectTreasuryFundingOnChain,
  OrchestrationProjectCredentialClaimOnChain,
  OrchestrationTaskCommitmentContent,
  OrchestrationTaskContent,
  OrchestrationMyCommitmentSummary,
  OrchestrationPendingAssessmentSummary,
} from "./gateway";

// =============================================================================
// Merged Handler Types (re-exports)
// =============================================================================

export type {
  // Course merged handlers
  MergedHandlersMergedCoursesResponse,
  MergedHandlersMergedCourseDetailResponse,
  MergedHandlersStudentCoursesResponse,
  MergedHandlersStudentAssignmentCommitmentResponse,
  MergedHandlersStudentAssignmentCommitmentsResponse,
  MergedHandlersTeacherAssignmentCommitmentsResponse,
  MergedHandlersGetStudentAssignmentCommitmentRequest,

  // Project merged handlers
  MergedHandlersMergedProjectsResponse,
  MergedHandlersMergedProjectDetailResponse,
  MergedHandlersContributorProjectsResponse,
  MergedHandlersManagerProjectsResponse,
  MergedHandlersContributorCommitmentResponse,
  MergedHandlersContributorCommitmentsResponse,
  MergedHandlersManagerCommitmentsResponse,
  MergedHandlersMergedTasksResponse,
  MergedHandlersGetContributorCommitmentRequest,
  MergedHandlersListManagerTasksRequest,
  MergedHandlersListTasksRequest,
  MergedHandlersErrorResponse,
} from "./gateway";

// =============================================================================
// TX Client Types (re-exports for transaction building)
// =============================================================================

export type {
  // Course transactions
  AtlasTxClientCreateCourseTxRequest,
  AtlasTxClientManageModulesTxRequest,
  AtlasTxClientMintModuleV2,
  AtlasTxClientUpdateModuleV2,
  AtlasTxClientCommitAssignmentTxRequest,
  AtlasTxClientAssignmentActionTxRequest,
  AtlasTxClientAssessAssignmentsTxRequest,
  AtlasTxClientClaimCourseCredentialsTxRequest,

  // Project transactions
  AtlasTxClientCreateProjectTxRequest,
  AtlasTxClientManageTasksTxRequest,
  AtlasTxClientTaskData,
  AtlasTxClientCommitTaskTxRequest,
  AtlasTxClientTaskActionTxRequest,
  AtlasTxClientTasksAssessV2TxRequest,
  AtlasTxClientClaimProjectCredentialsTxRequest,
  AtlasTxClientProjectOutcome,

  // Global transactions
  AtlasTxClientMintAccessTokenTxRequest,

  // Response types
  AtlasTxClientUnsignedTxResponse,
  AtlasTxClientUnsignedTxResponseInitCourse,
  AtlasTxClientUnsignedTxResponseInitProject,
} from "./gateway";

// =============================================================================
// Request/Response Types (re-exports)
// =============================================================================

export type {
  // Course requests
  AndamioApiInternalInternalApiAndamioDbClientCreateCourseV2Request as AndamioDbClientCreateCourseV2Request,
  AndamioApiInternalInternalApiAndamioDbClientUpdateCourseV2Request as AndamioDbClientUpdateCourseV2Request,
  AndamioApiInternalInternalApiAndamioDbClientCreateModuleV2Request as AndamioDbClientCreateModuleV2Request,
  AndamioApiInternalInternalApiAndamioDbClientUpdateModuleV2Request as AndamioDbClientUpdateModuleV2Request,
  AndamioApiInternalInternalApiAndamioDbClientCreateSltV2Request as AndamioDbClientCreateSltV2Request,
  AndamioApiInternalInternalApiAndamioDbClientUpdateSltV2Request as AndamioDbClientUpdateSltV2Request,
  AndamioApiInternalInternalApiAndamioDbClientCreateLessonV2Request as AndamioDbClientCreateLessonV2Request,
  AndamioApiInternalInternalApiAndamioDbClientUpdateLessonV2Request as AndamioDbClientUpdateLessonV2Request,
  AndamioApiInternalInternalApiAndamioDbClientCreateAssignmentV2Request as AndamioDbClientCreateAssignmentV2Request,
  AndamioApiInternalInternalApiAndamioDbClientUpdateAssignmentV2Request as AndamioDbClientUpdateAssignmentV2Request,
  AndamioApiInternalInternalApiAndamioDbClientCreateIntroductionV2Request as AndamioDbClientCreateIntroductionV2Request,
  AndamioApiInternalInternalApiAndamioDbClientUpdateIntroductionV2Request as AndamioDbClientUpdateIntroductionV2Request,
  AndamioApiInternalInternalApiAndamioDbClientCreateAssignmentCommitmentV2Request as AndamioDbClientCreateAssignmentCommitmentV2Request,
  AndamioApiInternalInternalApiAndamioDbClientUpdateAssignmentCommitmentV2Request as AndamioDbClientUpdateAssignmentCommitmentV2Request,
  AndamioApiInternalInternalApiAndamioDbClientSubmitAssignmentCommitmentV2Request as AndamioDbClientSubmitAssignmentCommitmentV2Request,
  AndamioApiInternalInternalApiAndamioDbClientReviewAssignmentCommitmentV2Request as AndamioDbClientReviewAssignmentCommitmentV2Request,
  AndamioApiInternalInternalApiAndamioDbClientLeaveAssignmentCommitmentV2Request as AndamioDbClientLeaveAssignmentCommitmentV2Request,
  AndamioApiInternalInternalApiAndamioDbClientGetAssignmentCommitmentV2Request as AndamioDbClientGetAssignmentCommitmentV2Request,

  // Project requests
  AndamioApiInternalInternalApiAndamioDbClientCreateProjectRequest,
  AndamioApiInternalInternalApiAndamioDbClientUpdateProjectRequest,
  AndamioApiInternalInternalApiAndamioDbClientCreateTaskRequest,
  AndamioApiInternalInternalApiAndamioDbClientUpdateTaskRequest,
  AndamioApiInternalInternalApiAndamioDbClientCreateTaskCommitmentRequest,
  AndamioApiInternalInternalApiAndamioDbClientUpdateTaskCommitmentRequest,
} from "./gateway";

// =============================================================================
// Custom Types (not in API spec)
// =============================================================================

/**
 * Valid gateway transaction type strings
 * These are the values the gateway expects for tx_type in transaction registration
 *
 * @see TX_TYPE_MAP in ~/hooks/use-tx-watcher.ts for frontend-to-gateway mapping
 */
export type GatewayTxType =
  | "access_token_mint"
  | "course_create"
  | "teachers_update"
  | "modules_manage"
  | "assignment_submit"
  | "assessment_assess"
  | "credential_claim"
  | "project_create"
  | "project_join"
  | "blacklist_update"
  | "tasks_manage"
  | "task_submit"
  | "task_assess"
  | "project_credential_claim"
  | "treasury_fund";
