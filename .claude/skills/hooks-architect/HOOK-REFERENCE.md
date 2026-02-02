# Hook Reference

> **Complete reference of all API hooks in the Andamio App.**

All hooks are exported from `src/hooks/api/index.ts` for convenient imports:

```typescript
import { useCourse, type Course, courseKeys } from "~/hooks/api";
```

---

## Course Hooks

### use-course.ts

**Owner of**: `Course`, `CourseDetail`, `CourseStatus`

| Export | Type | Description |
|--------|------|-------------|
| `Course` | Type | Base course type with camelCase fields |
| `CourseDetail` | Type | Course with modules array |
| `CourseStatus` | Type | `"draft" \| "active" \| "unregistered"` |
| `transformCourse()` | Function | API → Course |
| `transformCourseDetail()` | Function | API → CourseDetail |
| `courseKeys` | Object | Query key factory |
| `useCourse(id)` | Hook | Get single course |
| `useActiveCourses()` | Hook | List published courses |

### use-course-owner.ts

**Imports from**: `use-course.ts`

| Export | Type | Description |
|--------|------|-------------|
| `courseOwnerKeys` | Object | Query key factory |
| `useOwnerCourses()` | Hook | List owner's courses |
| `useCreateCourse()` | Mutation | Create new course |
| `useUpdateCourse()` | Mutation | Update course metadata |
| `useDeleteCourse()` | Mutation | Delete draft course |
| `useRegisterCourse()` | Mutation | Register on-chain course to DB |

### use-course-teacher.ts

**Owner of**: `TeacherCourse`, `TeacherCourseStatus`, `TeacherAssignmentCommitment`

| Export | Type | Description |
|--------|------|-------------|
| `TeacherCourse` | Type | Course from teacher perspective |
| `TeacherCourseStatus` | Type | `"draft" \| "active" \| "unregistered"` |
| `TeacherAssignmentCommitment` | Type | Student submission for review |
| `TeacherCourseWithModules` | Type | Teacher course with modules |
| `transformTeacherCourse()` | Function | API → TeacherCourse |
| `transformTeacherCommitment()` | Function | API → TeacherAssignmentCommitment |
| `TEACHER_STATUS_MAP` | Const | Maps DB statuses (ACCEPTED/REFUSED) to display values (ACCEPTED/DENIED) |
| `mapToDisplayStatus()` | Function | Normalize commitment_status + source → display status |
| `courseTeacherKeys` | Object | Query key factory |
| `useTeacherCourses()` | Hook | List courses where user is teacher |
| `useTeacherCoursesWithModules()` | Hook | Teacher courses with module data |
| `useTeacherAssignmentCommitments()` | Hook | List pending submissions |
| `useInvalidateTeacherCourses()` | Hook | Cache invalidation helper |

### use-course-student.ts

**Owner of**: `StudentCourse`

| Export | Type | Description |
|--------|------|-------------|
| `StudentCourse` | Type | Course from student perspective |
| `transformStudentCourse()` | Function | API → StudentCourse |
| `courseStudentKeys` | Object | Query key factory |
| `useStudentCourses()` | Hook | List enrolled courses |
| `useInvalidateStudentCourses()` | Hook | Cache invalidation helper |

### use-course-module.ts

**Owner of**: `CourseModule`, `CourseModuleStatus`, `SLT`, `Lesson`, `Assignment`, `Introduction`

| Export | Type | Description |
|--------|------|-------------|
| `CourseModule` | Type | Module with SLTs, lessons, assignment |
| `CourseModuleStatus` | Type | `"draft" \| "active" \| "unregistered"` |
| `SLT` | Type | Student Learning Target |
| `Lesson` | Type | Lesson content |
| `Assignment` | Type | Module assignment |
| `Introduction` | Type | Module introduction |
| `transformCourseModule()` | Function | API → CourseModule |
| `transformSLT()` | Function | API → SLT |
| `transformLesson()` | Function | API → Lesson |
| `transformAssignment()` | Function | API → Assignment |
| `transformIntroduction()` | Function | API → Introduction |
| `courseModuleKeys` | Object | Query key factory |
| `useCourseModules(courseId)` | Hook | List modules for course |
| `useTeacherCourseModules(courseId)` | Hook | Teacher view of modules |
| `useCourseModule(courseId, moduleCode)` | Hook | Get single module |
| `useCourseModuleMap(courseId)` | Hook | Module map by code |
| `useCreateCourseModule()` | Mutation | Create module |
| `useUpdateCourseModule()` | Mutation | Update module |
| `useUpdateCourseModuleStatus()` | Mutation | Update module status |
| `useDeleteCourseModule()` | Mutation | Delete module |
| `useRegisterCourseModule()` | Mutation | Register on-chain module |

### use-slt.ts

**Imports from**: `use-course-module.ts`

| Export | Type | Description |
|--------|------|-------------|
| `sltKeys` | Object | Query key factory |
| `useSLTs(courseId, moduleCode)` | Hook | List SLTs for module |
| `useCreateSLT()` | Mutation | Create SLT |
| `useUpdateSLT()` | Mutation | Update SLT |
| `useDeleteSLT()` | Mutation | Delete SLT |
| `useReorderSLT()` | Mutation | Reorder SLTs |

### use-lesson.ts

**Imports from**: `use-course-module.ts`

| Export | Type | Description |
|--------|------|-------------|
| `lessonKeys` | Object | Query key factory |
| `useLessons(courseId, moduleCode)` | Hook | List lessons |
| `useLesson(courseId, moduleCode, sltIndex)` | Hook | Get single lesson |
| `useCreateLesson()` | Mutation | Create lesson |
| `useUpdateLesson()` | Mutation | Update lesson |
| `useDeleteLesson()` | Mutation | Delete lesson |

### use-assignment.ts

**Imports from**: `use-course-module.ts`

| Export | Type | Description |
|--------|------|-------------|
| `assignmentKeys` | Object | Query key factory |
| `useAssignment(courseId, moduleCode)` | Hook | Get module assignment |
| `useCreateAssignment()` | Mutation | Create assignment |
| `useUpdateAssignment()` | Mutation | Update assignment |
| `useDeleteAssignment()` | Mutation | Delete assignment |

### use-introduction.ts

**Imports from**: `use-course-module.ts`

| Export | Type | Description |
|--------|------|-------------|
| `introductionKeys` | Object | Query key factory |
| `useCreateIntroduction()` | Mutation | Create introduction |
| `useUpdateIntroduction()` | Mutation | Update introduction |
| `useDeleteIntroduction()` | Mutation | Delete introduction |

### use-module-wizard-data.ts

**Composite Hook** - Combines multiple hooks for wizard UI

| Export | Type | Description |
|--------|------|-------------|
| `ModuleWizardData` | Type | Combined wizard data |
| `useModuleWizardData(courseId, moduleCode)` | Hook | All module data for wizard |

---

## Project Hooks

### use-project.ts

**Owner of**: `Project`, `ProjectDetail`, `Task`, `TaskCommitment`

| Export | Type | Description |
|--------|------|-------------|
| `Project` | Type | Base project type |
| `ProjectDetail` | Type | Project with tasks |
| `Task` | Type | Project task |
| `TaskCommitment` | Type | Task commitment/submission |
| `transformProjectDetail()` | Function | API → ProjectDetail |
| `transformMergedTask()` | Function | API → Task |
| `transformApiCommitment()` | Function | API → TaskCommitment |
| `projectKeys` | Object | Query key factory |
| `useProject(id)` | Hook | Get single project |
| `useProjects()` | Hook | List active projects |
| `useInvalidateProjects()` | Hook | Cache invalidation helper |

### use-project-manager.ts

**Owner of**: `ManagerProject`, `ManagerCommitment`

| Export | Type | Description |
|--------|------|-------------|
| `ManagerProject` | Type | Project from manager perspective |
| `ManagerCommitment` | Type | Task commitment for review |
| `ManagerProjectsResponse` | Type | List response |
| `ManagerCommitmentsResponse` | Type | Commitments response |
| `projectManagerKeys` | Object | Query key factory |
| `useManagerProjects()` | Hook | List managed projects |
| `useManagerCommitments(projectId)` | Hook | List pending commitments |
| `useInvalidateManagerProjects()` | Hook | Cache invalidation helper |

### use-project-contributor.ts

**Owner of**: `ContributorProject`, `ContributorCommitment`, `MyCommitmentSummary`

| Export | Type | Description |
|--------|------|-------------|
| `ContributorProject` | Type | Project from contributor view |
| `ContributorCommitment` | Type | Task commitment with on-chain + off-chain data |
| `MyCommitmentSummary` | Type | Lightweight commitment summary |
| `PROJECT_STATUS_MAP` | Const | Maps DB statuses (ACCEPTED/REFUSED + legacy APPROVED/REJECTED) |
| `normalizeProjectCommitmentStatus()` | Function | Uppercase + alias normalization for commitment statuses |
| `projectContributorKeys` | Object | Query key factory |
| `useContributorProjects()` | Hook | List contributed projects |
| `useContributorCommitment(projectId, taskHash)` | Hook | Get specific task commitment |
| `useSubmitTaskEvidence()` | Mutation | Submit task evidence |
| `useInvalidateContributorProjects()` | Hook | Cache invalidation helper |

### use-student-assignment-commitments.ts

**Owner of**: `StudentCommitmentSummary`

| Export | Type | Description |
|--------|------|-------------|
| `StudentCommitmentSummary` | Type | Lightweight commitment with normalized status |
| `useStudentAssignmentCommitments(courseId)` | Hook | List all commitments for a course |
| `getModuleCommitmentStatus(commitments)` | Function | Derive single status from module's commitments |

**Status normalization**: Maps DB values (SUBMITTED→PENDING_APPROVAL, ACCEPTED→ASSIGNMENT_ACCEPTED, REFUSED→ASSIGNMENT_REFUSED) with APPROVED/REJECTED as legacy aliases.

### use-assignment-commitment.ts

**Owner of**: `AssignmentCommitment`

| Export | Type | Description |
|--------|------|-------------|
| `AssignmentCommitment` | Type | Student assignment commitment (full detail) |
| `useAssignmentCommitment(courseId, moduleCode, sltHash)` | Hook | Get student's commitment for a specific SLT |

**Status normalization**: Same STATUS_MAP as `use-student-assignment-commitments.ts`.

---

## User Hooks

### use-user.ts

| Export | Type | Description |
|--------|------|-------------|
| `useUpdateAccessTokenAlias()` | Mutation | Update access token alias after minting |

---

## Transaction Hooks

### use-transaction.ts

Full BUILD → SIGN → SUBMIT → REGISTER lifecycle hook.

| Export | Type | Description |
|--------|------|-------------|
| `SimpleTransactionState` | Type | `"idle" \| "fetching" \| "signing" \| "submitting" \| "success" \| "error"` |
| `useTransaction(txType)` | Hook | Execute full transaction flow |

### use-tx-watcher.ts (Polling)

| Export | Type | Description |
|--------|------|-------------|
| `TxState` | Type | `"pending" \| "confirmed" \| "updated" \| "failed" \| "expired"` |
| `TX_TYPE_MAP` | Object | Frontend → gateway tx_type mapping |
| `registerTransaction()` | Function | POST to `/api/v2/tx/register` |
| `useTxWatcher(txHash)` | Hook | Poll TX status every 15s until terminal |

### use-tx-stream.ts (SSE — Preferred)

Drop-in replacement for `useTxWatcher` using Server-Sent Events.

| Export | Type | Description |
|--------|------|-------------|
| `useTransactionStream()` | Hook | Low-level SSE connection with AbortController |
| `useTxStream(txHash)` | Hook | High-level SSE tracking with polling fallback |

**SSE Event Types** (from `~/types/tx-stream.ts`):
- `TxStateEvent` — Initial state on connect
- `TxStateChangeEvent` — State transition events
- `TxCompleteEvent` — Terminal state reached
- `TxStreamCallbacks` — Callback interface

---

## Query Key Reference

### Course Keys

```typescript
courseKeys.all                          // ["courses"]
courseKeys.lists()                      // ["courses", "list"]
courseKeys.published()                  // ["courses", "published"]
courseKeys.details()                    // ["courses", "detail"]
courseKeys.detail(id)                   // ["courses", "detail", id]

courseOwnerKeys.all                     // ["courses", "owner"]
courseOwnerKeys.lists()                 // ["courses", "owner", "list"]

courseTeacherKeys.all                   // ["courses", "teacher"]
courseTeacherKeys.lists()               // ["courses", "teacher", "list"]
courseTeacherKeys.commitments(courseId) // ["courses", "teacher", "commitments", courseId]

courseStudentKeys.all                   // ["courses", "student"]
courseStudentKeys.lists()               // ["courses", "student", "list"]

courseModuleKeys.all                    // ["courseModules"]
courseModuleKeys.list(courseId)         // ["courseModules", "list", courseId]
courseModuleKeys.detail(courseId, code) // ["courseModules", "detail", courseId, code]

sltKeys.all                             // ["slts"]
sltKeys.list(courseId, moduleCode)      // ["slts", "list", courseId, moduleCode]

lessonKeys.all                          // ["lessons"]
lessonKeys.list(courseId, moduleCode)   // ["lessons", "list", courseId, moduleCode]
lessonKeys.detail(courseId, code, idx)  // ["lessons", "detail", courseId, code, idx]
```

### Project Keys

```typescript
projectKeys.all                         // ["projects"]
projectKeys.lists()                     // ["projects", "list"]
projectKeys.details()                   // ["projects", "detail"]
projectKeys.detail(id)                  // ["projects", "detail", id]

projectManagerKeys.all                  // ["projects", "manager"]
projectManagerKeys.lists()              // ["projects", "manager", "list"]
projectManagerKeys.commitments(id)      // ["projects", "manager", "commitments", id]

projectContributorKeys.all              // ["projects", "contributor"]
projectContributorKeys.lists()          // ["projects", "contributor", "list"]
```

---

## Import Examples

### Basic Usage

```typescript
// Single hook
import { useCourse } from "~/hooks/api";

function CourseDetail({ id }: { id: string }) {
  const { data: course, isLoading } = useCourse(id);

  if (isLoading) return <Skeleton />;
  if (!course) return <NotFound />;

  return <h1>{course.title}</h1>;
}
```

### With Types

```typescript
import { useCourseModules, type CourseModule } from "~/hooks/api";

interface ModuleListProps {
  courseId: string;
  onSelect: (mod: CourseModule) => void;
}

function ModuleList({ courseId, onSelect }: ModuleListProps) {
  const { data: modules = [] } = useCourseModules(courseId);

  return (
    <ul>
      {modules.map((mod) => (
        <li key={mod.moduleCode} onClick={() => onSelect(mod)}>
          {mod.title}
        </li>
      ))}
    </ul>
  );
}
```

### Mutations

```typescript
import { useUpdateCourse, useCourse, courseKeys } from "~/hooks/api";
import { useQueryClient } from "@tanstack/react-query";

function CourseEditor({ courseId }: { courseId: string }) {
  const { data: course } = useCourse(courseId);
  const updateCourse = useUpdateCourse();

  const handleSave = async (title: string) => {
    await updateCourse.mutateAsync({
      courseId,
      data: { title },
    });
    // Cache automatically invalidated via onSuccess
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSave(title); }}>
      {/* form fields */}
    </form>
  );
}
```

### Manual Invalidation (after TX)

```typescript
import { useInvalidateProjects } from "~/hooks/api";

function TransactionComponent() {
  const { invalidateAll } = useInvalidateProjects();

  const onTxConfirmed = () => {
    // After blockchain TX confirms, invalidate cached data
    invalidateAll();
  };
}
```

---

**Last Updated**: January 30, 2026
