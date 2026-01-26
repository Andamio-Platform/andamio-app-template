# API Hooks Audit

Audit `src/hooks/api/` for consistent patterns, types, and transformers.

## Goal

Ensure every API endpoint category has well-designed hooks that:
1. Export app-ready types with direct, semantic names
2. Provide transformers from API types → App types
3. Use React Query correctly with proper cache invalidation
4. Export query keys for external cache management

## Exemplary Pattern: `use-course.ts`

The course hook is the gold standard. All other hooks should follow this pattern:

```typescript
// =============================================================================
// 1. App-Level Types (exported for components)
// =============================================================================

/**
 * Lifecycle status - derived from API source field
 * - "draft": DB only, not yet on-chain
 * - "active": On-chain + DB, fully operational
 * - "unregistered": On-chain but needs DB registration
 */
export type CourseStatus = "draft" | "active" | "unregistered";

export interface Course {
  courseId: string;           // camelCase, not course_id
  title: string;              // flattened from content.title
  description?: string;
  status: CourseStatus;       // semantic status, not raw API source
  // ... other fields
}

export interface CourseDetail extends Course {
  modules?: CourseModule[];
}

// =============================================================================
// 2. Transform Functions
// =============================================================================

// Helper to derive semantic status from API source field
function getStatusFromSource(source: string | undefined): CourseStatus {
  switch (source) {
    case "merged": return "active";
    case "chain_only": return "unregistered";
    case "db_only":
    default: return "draft";
  }
}

export function transformCourse(item: OrchestrationMergedCourseListItem): Course {
  return {
    courseId: item.course_id ?? "",
    title: item.content?.title ?? "",
    status: getStatusFromSource(item.source),
    // ... convert snake_case → camelCase, flatten nested fields
  };
}

// =============================================================================
// 3. Query Keys
// =============================================================================

export const courseKeys = {
  all: ["courses"] as const,
  lists: () => [...courseKeys.all, "list"] as const,
  published: () => [...courseKeys.all, "published"] as const,
  owned: () => [...courseKeys.all, "owned"] as const,
  details: () => [...courseKeys.all, "detail"] as const,
  detail: (id: string) => [...courseKeys.details(), id] as const,
};

// =============================================================================
// 4. Query Hooks
// =============================================================================

export function useCourse(courseId: string | undefined) {
  return useQuery({
    queryKey: courseKeys.detail(courseId ?? ""),
    queryFn: async (): Promise<CourseDetail | null> => {
      const response = await fetch(`/api/gateway/...`);
      const result = await response.json();
      return transformCourseDetail(result.data);
    },
    enabled: !!courseId,
  });
}

// =============================================================================
// 5. Mutation Hooks
// =============================================================================

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ courseId, data }) => { ... },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: courseKeys.detail(variables.courseId),
      });
      void queryClient.invalidateQueries({
        queryKey: courseKeys.lists(),
      });
    },
  });
}
```

## Type Ownership Rule

**Types flow UP the hierarchy.** Each hook owns its primary types, and other hooks can import from it.

### Ownership Hierarchy

```
use-course.ts (owns Course, CourseDetail)
    ↑ imports CourseModule
use-course-module.ts (owns CourseModule, SLT, Lesson, Assignment, Introduction)
    ↑ can be imported by
use-slt.ts, use-lesson.ts, use-assignment.ts, use-introduction.ts (use imported types)
```

### Rules

1. **Each hook owns its primary types** - Define types in the hook that creates/manages that data
2. **Import, don't duplicate** - If another hook needs a type, import it from the owner
3. **No circular imports** - Imports must flow in one direction (up the hierarchy)
4. **Lower-level hooks can be imported by higher-level hooks** - `use-course.ts` can import from `use-course-module.ts`, but not vice versa

## Audit Checklist

### For Each Hook File

| Check | Description |
|-------|-------------|
| **Types** | |
| ☐ App types exported | Direct names like `Course`, `Task`, `Assignment` |
| ☐ camelCase fields | No snake_case in exported types |
| ☐ Flattened content | `title` not `content.title` |
| ☐ Source type if merged | Track data source (merged/chain_only/db_only) |
| **Transformers** | |
| ☐ Transform function exported | `transformCourse`, `transformTask`, etc. |
| ☐ Handles nulls safely | Uses `??` for defaults |
| ☐ Type-safe return | Return type matches app type |
| **Query Keys** | |
| ☐ Keys object exported | `courseKeys`, `taskKeys`, etc. |
| ☐ Hierarchical structure | `all` → `lists()` → `detail(id)` |
| ☐ `as const` assertions | For proper type inference |
| **Hooks** | |
| ☐ Hooks use transformers | Don't return raw API types |
| ☐ Auth hooks use `authenticatedFetch` | From `useAndamioAuth` |
| ☐ Public hooks check enabled | `enabled: !!id` pattern |
| ☐ 404 handled as empty | Return `null` or `[]`, not throw |
| **Mutations** | |
| ☐ Cache invalidation | Invalidate relevant query keys |
| ☐ Optimistic updates | Where appropriate |
| **Exports** | |
| ☐ Types exported from index | `src/hooks/api/index.ts` |
| ☐ Deprecated aliases if migrating | For backward compat |

## Current Hook Status

### Course Hooks (`src/hooks/api/course/`)

| File | Types | Transformer | Keys | Status |
|------|-------|-------------|------|--------|
| `use-course.ts` | Course, CourseDetail, CourseStatus | transformCourse, transformCourseDetail | courseKeys | EXEMPLARY |
| `use-course-owner.ts` | (imports from use-course) | (imports from use-course) | courseOwnerKeys | COMPLETE |
| `use-course-teacher.ts` | TeacherCourse, TeacherCourseStatus | transformTeacherCourse, transformTeacherCommitment | courseTeacherKeys | COMPLETE |
| `use-course-student.ts` | StudentCourse | transformStudentCourse | courseStudentKeys | COMPLETE |
| `use-course-module.ts` | CourseModule, CourseModuleStatus, SLT, Lesson, Assignment, Introduction | All transforms | courseModuleKeys | COMPLETE |
| `use-slt.ts` | (imports from use-course-module) | (imports from use-course-module) | sltKeys | COMPLETE |
| `use-lesson.ts` | (imports from use-course-module) | (imports from use-course-module) | lessonKeys | COMPLETE |
| `use-assignment.ts` | (imports from use-course-module) | (imports from use-course-module) | assignmentKeys | COMPLETE |
| `use-introduction.ts` | (imports from use-course-module) | (imports from use-course-module) | introductionKeys | COMPLETE |

### Project Hooks (`src/hooks/api/project/`)

| File | Types | Transformer | Keys | Status |
|------|-------|-------------|------|--------|
| `use-project.ts` | Project, Task, TaskCommitment | transformProjectDetail, transformMergedTask, etc. | projectKeys | EXEMPLARY |
| `use-project-manager.ts` | ManagerProject (snake_case) | Inline flattening only | projectManagerKeys | NEEDS WORK |
| `use-project-contributor.ts` | ContributorProject (snake_case) | None | projectContributorKeys | NEEDS WORK |

## Missing Hooks

### Course Endpoints Without Hooks

| Endpoint | Priority | Notes |
|----------|----------|-------|
| `/v2/course/student/commitment/create` | High | Enrollment flow |
| `/v2/course/student/commitment/submit` | High | Assignment submission |
| `/v2/course/student/commitment/claim` | High | Credential claim |
| `/v2/course/teacher/assignment-commitment/review` | High | Assessment flow |
| `/v2/course/student/commitment/update` | Medium | Evidence update |
| `/v2/course/student/commitment/leave` | Low | Leave course |
| `/v2/course/shared/commitment/get` | Medium | View commitment |
| `/v2/course/owner/teachers/update` | Medium | Teacher management |

### Project Endpoints Without Hooks

| Endpoint | Priority | Notes |
|----------|----------|-------|
| `/v2/project/contributor/commitment/create` | High | Task commitment |
| `/v2/project/contributor/commitment/update` | Medium | Update submission |
| `/v2/project/contributor/commitment/delete` | Low | Withdraw |
| `/v2/project/owner/project/create` | Medium | Project creation (pre-TX) |

## Interactive Audit Process

When running this audit, I will:

1. **Scan hook files** in `src/hooks/api/`
2. **Check each file** against the checklist above
3. **Report issues** with specific file:line references
4. **Ask before fixing**:
   - "Found X issues in Y files. Fix them?"
   - "Missing hook for Z endpoint. Create it?"
5. **Update status** in this file after changes

## Fix Templates

### Adding App Types to Existing Hook

```typescript
// Add after imports, before hook definitions

// =============================================================================
// App-Level Types
// =============================================================================

export interface Task {
  taskHash: string;
  projectId: string;
  title: string;
  description?: string;
  lovelaceAmount: string;
  expiresAt?: string;
  status: "draft" | "published" | "completed";
}

export function transformTask(item: ProjectTaskV2Output): Task {
  return {
    taskHash: item.task_hash ?? "",
    projectId: item.project_state_policy_id ?? "",
    title: item.content?.title ?? "",
    description: item.content?.description,
    lovelaceAmount: item.lovelace_amount ?? "0",
    expiresAt: item.expiration_time,
    status: item.is_published ? "published" : "draft",
  };
}
```

### Creating New Hook File

See `use-course.ts` as template. Required sections:
1. File header comment with architecture notes
2. App-level types with JSDoc
3. Transform functions
4. Query keys object
5. Query hooks
6. Mutation hooks (if applicable)

---

**Last Updated**: January 26, 2026
