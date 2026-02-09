/**
 * Type re-exports from generated gateway types
 *
 * This file provides:
 * 1. Clean type aliases for orchestration types (courses are now orchestration-based)
 * 2. DB client types for projects (still using DB client pattern)
 * 3. Custom types not in the API spec
 *
 * NOTE: As of API v2.0.0, course-related types have been consolidated into
 * orchestration types. The old DB client course types no longer exist in the API.
 *
 * @see gateway.ts - Raw auto-generated types from OpenAPI spec
 */

// =============================================================================
// Course System Types (now using Orchestration types)
// =============================================================================

// Course types - using orchestration types for merged data
export type { OrchestrationCourseContent as CourseContent } from "./gateway";
export type { OrchestrationModuleContent as ModuleContent } from "./gateway";
export type { OrchestrationMergedCourseDetail as CourseDetailResponse } from "./gateway";
export type { OrchestrationMergedCourseListItem as CourseListItem } from "./gateway";
export type { OrchestrationMergedCourseModuleItem as CourseModuleItem } from "./gateway";

// Legacy type aliases for backward compatibility
// These are now orchestration types but aliased for existing code
import type {
  OrchestrationMergedCourseDetail,
  OrchestrationMergedCourseListItem,
  OrchestrationMergedCourseModuleItem,
  OrchestrationModuleContent,
} from "./gateway";

/**
 * Course response type (backward compatibility)
 * Maps to OrchestrationMergedCourseDetail for full course data
 */
export type CourseResponse = OrchestrationMergedCourseDetail;

/**
 * Course module response type (backward compatibility)
 * Extends OrchestrationModuleContent with slt_hash from the parent merged item
 */
export interface CourseModuleResponse extends OrchestrationModuleContent {
  /** SLT hash from the merged module item (copied from parent) */
  slt_hash?: string;
}

/**
 * Course module brief response type (backward compatibility)
 */
export type CourseModuleBriefResponse = {
  course_module_code?: string;
  title?: string;
  module_status?: string;
};

/**
 * SLT response type (backward compatibility)
 * SLTs are now embedded in OrchestrationModuleContent.slts
 */
export interface SLTResponse {
  id?: number;
  slt_id?: string;
  slt_text?: string;
  module_index?: number;
  slt_index?: number; // Alias for module_index
  course_module_code?: string;
  created_at?: string;
  updated_at?: string;
  // Nested lesson data (populated by some endpoints)
  lesson?: LessonResponse | null;
}

/**
 * Assignment response type (backward compatibility)
 * Assignments are now embedded in OrchestrationModuleContent.assignment
 */
export interface AssignmentResponse {
  id?: number;
  title?: string;
  assignment_content?: unknown;
  content_json?: unknown; // Alias for assignment_content (TipTap JSON)
  course_module_code?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Introduction response type (backward compatibility)
 * Introductions are now embedded in OrchestrationModuleContent.introduction
 */
export interface IntroductionResponse {
  id?: number;
  title?: string;
  introduction_content?: unknown;
  content_json?: unknown; // Alias for introduction_content (TipTap JSON)
  course_module_code?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Lesson response type (backward compatibility)
 */
export interface LessonResponse {
  id?: number;
  lesson_content?: unknown;
  content_json?: unknown; // Alias for lesson_content (TipTap JSON)
  slt_id?: string;
  slt_index?: number;
  course_module_code?: string;
  created_at?: string;
  updated_at?: string;
  // Additional display fields
  title?: string;
  description?: string;
  is_live?: boolean;
  image_url?: string;
  video_url?: string;
}

/**
 * Assignment commitment response type (backward compatibility)
 */
export type { OrchestrationAssignmentCommitmentContent as AssignmentCommitmentResponse } from "./gateway";

/**
 * Course teacher response type (backward compatibility)
 */
export interface CourseTeacherResponse {
  id?: number;
  course_nft_policy_id?: string;
  teacher_alias?: string;
  created_at?: string;
}

// List type aliases
export type CourseListResponse = OrchestrationMergedCourseListItem[];
export type CourseModuleListResponse = OrchestrationMergedCourseModuleItem[];
export type SLTListResponse = SLTResponse[];
export type LessonListResponse = LessonResponse[];
export type AssignmentListResponse = AssignmentResponse[];

// =============================================================================
// Project System Types (app-level flattened types)
// =============================================================================

// Import and re-export app-level types with backward-compatible names
// These types are colocated with the project hooks (single source of truth)
export {
  type Task as ProjectTaskV2Output,
  // Use ProjectDetail for pages that need full data (states, contributors, tasks, etc.)
  type ProjectDetail as ProjectV2Output,
  type TaskCommitment as CommitmentV2Output,
  type TaskToken as ProjectTaskTokenOutput,
  type ProjectState as ProjectStateOutput,
  type TaskStatusValue,
  // Transform functions for use in hooks/libs
  transformApiTask,
  transformApiProject,
  transformApiCommitment,
  transformOnChainTask,
  transformProjectDetail,
  transformProjectListItem,
  transformMergedTask,
} from "~/hooks/api/project/use-project";

// Re-export the app types with clean names too
export type { Task, Project, ProjectDetail, TaskCommitment, TaskToken, ProjectState } from "~/hooks/api/project/use-project";

// Legacy compatibility alias
export interface ProjectPrerequisiteOutput {
  id?: number;
  project_id?: string;
  prerequisite_type?: string;
  prerequisite_value?: string;
}

// =============================================================================
// Orchestration Types (re-exports, already well-named)
// =============================================================================

export type {
  // Course orchestration
  OrchestrationCourseModule,
  OrchestrationCourseContent,
  OrchestrationModuleContent,
  OrchestrationMergedCourseDetail,
  OrchestrationMergedCourseListItem,
  OrchestrationMergedCourseModuleItem,
  OrchestrationStudentCourseListItem,
  OrchestrationStudentAssignmentCommitmentItem,
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
  MergedHandlersMergedCourseModulesResponse,
  MergedHandlersStudentCoursesResponse,
  MergedHandlersStudentAssignmentCommitmentResponse,
  MergedHandlersStudentAssignmentCommitmentsResponse,
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
// TX Client Types (re-exports from generated gateway types)
// Types were renamed in API v2.1.0 with AndamioApiInternalInternalApi prefix
// We re-export with shorter aliases for backward compatibility
// =============================================================================

// Import with full names from gateway
import type {
  AndamioApiInternalInternalApiAtlasTxClientCreateCourseTxRequest,
  AndamioApiInternalInternalApiAtlasTxClientManageModulesTxRequest,
  AndamioApiInternalInternalApiAtlasTxClientMintModuleV2,
  AndamioApiInternalInternalApiAtlasTxClientUpdateModuleV2,
  AndamioApiInternalInternalApiAtlasTxClientCommitAssignmentTxRequest,
  AndamioApiInternalInternalApiAtlasTxClientAssignmentActionTxRequest,
  AndamioApiInternalInternalApiAtlasTxClientAssessAssignmentsTxRequest,
  AndamioApiInternalInternalApiAtlasTxClientClaimCourseCredentialsTxRequest,
  AndamioApiInternalInternalApiAtlasTxClientCreateProjectTxRequest,
  AndamioApiInternalInternalApiAtlasTxClientManageTasksTxRequest,
  AndamioApiInternalInternalApiAtlasTxClientTaskData,
  AndamioApiInternalInternalApiAtlasTxClientCommitTaskTxRequest,
  AndamioApiInternalInternalApiAtlasTxClientTaskActionTxRequest,
  AndamioApiInternalInternalApiAtlasTxClientTasksAssessV2TxRequest,
  AndamioApiInternalInternalApiAtlasTxClientClaimProjectCredentialsTxRequest,
  AndamioApiInternalInternalApiAtlasTxClientProjectOutcome,
  AndamioApiInternalInternalApiAtlasTxClientMintAccessTokenTxRequest,
  AndamioApiInternalInternalApiAtlasTxClientUnsignedTxResponse,
  AndamioApiInternalInternalApiAtlasTxClientUnsignedTxResponseInitCourse,
  AndamioApiInternalInternalApiAtlasTxClientUnsignedTxResponseInitProject,
} from "./gateway";

// Re-export with shorter aliases for backward compatibility
// Course transactions
export type AtlasTxClientCreateCourseTxRequest = AndamioApiInternalInternalApiAtlasTxClientCreateCourseTxRequest;
export type AtlasTxClientManageModulesTxRequest = AndamioApiInternalInternalApiAtlasTxClientManageModulesTxRequest;
export type AtlasTxClientMintModuleV2 = AndamioApiInternalInternalApiAtlasTxClientMintModuleV2;
export type AtlasTxClientUpdateModuleV2 = AndamioApiInternalInternalApiAtlasTxClientUpdateModuleV2;
export type AtlasTxClientCommitAssignmentTxRequest = AndamioApiInternalInternalApiAtlasTxClientCommitAssignmentTxRequest;
export type AtlasTxClientAssignmentActionTxRequest = AndamioApiInternalInternalApiAtlasTxClientAssignmentActionTxRequest;
export type AtlasTxClientAssessAssignmentsTxRequest = AndamioApiInternalInternalApiAtlasTxClientAssessAssignmentsTxRequest;
export type AtlasTxClientClaimCourseCredentialsTxRequest = AndamioApiInternalInternalApiAtlasTxClientClaimCourseCredentialsTxRequest;

// Project transactions
export type AtlasTxClientCreateProjectTxRequest = AndamioApiInternalInternalApiAtlasTxClientCreateProjectTxRequest;
export type AtlasTxClientManageTasksTxRequest = AndamioApiInternalInternalApiAtlasTxClientManageTasksTxRequest;
export type AtlasTxClientTaskData = AndamioApiInternalInternalApiAtlasTxClientTaskData;
export type AtlasTxClientCommitTaskTxRequest = AndamioApiInternalInternalApiAtlasTxClientCommitTaskTxRequest;
export type AtlasTxClientTaskActionTxRequest = AndamioApiInternalInternalApiAtlasTxClientTaskActionTxRequest;
export type AtlasTxClientTasksAssessV2TxRequest = AndamioApiInternalInternalApiAtlasTxClientTasksAssessV2TxRequest;
export type AtlasTxClientClaimProjectCredentialsTxRequest = AndamioApiInternalInternalApiAtlasTxClientClaimProjectCredentialsTxRequest;
export type AtlasTxClientProjectOutcome = AndamioApiInternalInternalApiAtlasTxClientProjectOutcome;

// Global transactions
export type AtlasTxClientMintAccessTokenTxRequest = AndamioApiInternalInternalApiAtlasTxClientMintAccessTokenTxRequest;

// Response types
export type AtlasTxClientUnsignedTxResponse = AndamioApiInternalInternalApiAtlasTxClientUnsignedTxResponse;
export type AtlasTxClientUnsignedTxResponseInitCourse = AndamioApiInternalInternalApiAtlasTxClientUnsignedTxResponseInitCourse;
export type AtlasTxClientUnsignedTxResponseInitProject = AndamioApiInternalInternalApiAtlasTxClientUnsignedTxResponseInitProject;

// =============================================================================
// Request Types (backward compatibility - custom definitions)
// =============================================================================

/**
 * Course request types (backward compatibility)
 * These are now custom types since the API no longer exposes these directly
 */
export interface AndamioDbClientCreateCourseV2Request {
  course_id: string;
  title: string;
  description?: string;
  image_url?: string;
}

export interface AndamioDbClientUpdateCourseV2Request {
  course_id: string;
  data: {
    title?: string;
    description?: string;
    image_url?: string;
    is_public?: boolean;
  };
}

export interface AndamioDbClientCreateModuleV2Request {
  course_id: string;
  course_module_code: string;
  title: string;
  description?: string;
}

export interface AndamioDbClientUpdateModuleV2Request {
  course_id: string;
  course_module_code: string;
  title?: string;
  description?: string;
}

export interface AndamioDbClientCreateSltV2Request {
  course_id: string;
  course_module_code: string;
  slt_text: string;
  module_index: number;
}

export interface AndamioDbClientUpdateSltV2Request {
  course_id: string;
  course_module_code: string;
  slt_id: string;
  slt_text?: string;
  module_index?: number;
}

export interface AndamioDbClientCreateLessonV2Request {
  course_id: string;
  course_module_code: string;
  slt_id: string;
  lesson_content: unknown;
}

export interface AndamioDbClientUpdateLessonV2Request {
  course_id: string;
  course_module_code: string;
  slt_id: string;
  lesson_content: unknown;
}

export interface AndamioDbClientCreateAssignmentV2Request {
  course_id: string;
  course_module_code: string;
  assignment_content: unknown;
}

export interface AndamioDbClientUpdateAssignmentV2Request {
  course_id: string;
  course_module_code: string;
  assignment_content: unknown;
}

export interface AndamioDbClientCreateIntroductionV2Request {
  course_id: string;
  course_module_code: string;
  introduction_content: unknown;
}

export interface AndamioDbClientUpdateIntroductionV2Request {
  course_id: string;
  course_module_code: string;
  introduction_content: unknown;
}

export interface AndamioDbClientCreateAssignmentCommitmentV2Request {
  course_id: string;
  course_module_code: string;
  student_alias: string;
}

export interface AndamioDbClientUpdateAssignmentCommitmentV2Request {
  course_id: string;
  course_module_code: string;
  student_alias: string;
  evidence_text?: string;
  evidence_url?: string;
}

export interface AndamioDbClientSubmitAssignmentCommitmentV2Request {
  course_id: string;
  course_module_code: string;
  student_alias: string;
}

export interface AndamioDbClientReviewAssignmentCommitmentV2Request {
  course_id: string;
  course_module_code: string;
  student_alias: string;
  approved: boolean;
  feedback?: string;
}

export interface AndamioDbClientLeaveAssignmentCommitmentV2Request {
  course_id: string;
  course_module_code: string;
  student_alias: string;
}

export interface AndamioDbClientGetAssignmentCommitmentV2Request {
  course_id: string;
  course_module_code: string;
  student_alias: string;
}

// Project requests (now using ApiTypes)
export type {
  ApiTypesCreateProjectRequest,
  ApiTypesUpdateProjectRequest,
  ApiTypesCreateTaskRequest,
  ApiTypesUpdateTaskRequest,
  ApiTypesCreateTaskCommitmentRequest,
  ApiTypesUpdateTaskCommitmentRequest,
} from "./gateway";

// =============================================================================
// Auth Types (re-exports for developer registration)
// =============================================================================

export type {
  // Developer registration (two-step flow)
  AuthViewmodelsRegisterSessionRequest,
  AuthViewmodelsRegisterSessionResponse,
  AuthViewmodelsRegisterCompleteRequest,
  AuthViewmodelsRegisterResponse,
  AuthViewmodelsSignatureData,

  // Developer login
  AuthViewmodelsLoginRequest,
  AuthViewmodelsLoginResponse,
  AuthViewmodelsJWTResponse,
} from "./gateway";

// =============================================================================
// API Key Types (re-exports for developer API key management)
// =============================================================================

export type {
  ApiKeyViewmodelsAPIKeyRequest,
  ApiKeyViewmodelsAPIKeyResponse,
  ApiKeyViewmodelsDeleteAPIKeyRequest,
  ApiKeyViewmodelsDeleteAPIKeyResponse,
  ApiKeyViewmodelsRotateAPIKeyRequest,
  ApiKeyViewmodelsRotateAPIKeyResponse,
} from "./gateway";

// Developer profile type (returned from /v2/apikey/developer/profile/get)
export type { UserViewmodelsMeResponse as DeveloperProfileResponse } from "./gateway";

// Developer usage type (returned from /v2/apikey/developer/usage/get)
export type { UserViewmodelsUsageResponse as DeveloperUsageResponse } from "./gateway";

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
  | "managers_manage"
  | "blacklist_update"
  | "tasks_manage"
  | "task_submit"
  | "task_assess"
  | "project_credential_claim"
  | "treasury_fund";

// =============================================================================
// Andamioscan types removed — use gateway merged API hooks instead.
// See ~/hooks/api/project/use-project.ts and ~/hooks/api/course/use-course.ts
// =============================================================================
