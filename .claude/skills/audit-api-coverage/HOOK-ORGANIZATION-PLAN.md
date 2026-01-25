# Hook Organization Strategy

> **Status**: ✅ APPROVED - Ready for implementation
> **Created**: January 25, 2026
> **Related**: API-HOOKS-CLEANUP-PLAN.md

## Refinements Applied

1. **`usePublishedCourses` → `useActiveCourses`**: Aligns with `CourseStatus = "draft" | "active" | "unregistered"` terminology
2. **Removed `useUpdateIntroduction`**: Redundant - same endpoint as `useUpdateCourse`. Introduction fields are part of course metadata.
3. **`useTeacherCommitments` → `useTeacherAssignmentCommitments`**: Matches API endpoint naming: `/course/teacher/assignment-commitments/list`

## Decision: Option A - Two-Tier Hybrid

Entity files own types/transforms/public queries. Role files contain role-specific hooks.

---

## Complete Course Hook Structure

```
src/hooks/api/course/
├── use-course.ts              # Core types + PUBLIC queries only
├── use-course-owner.ts        # Owner mutations (NEW)
├── use-course-teacher.ts      # Teacher queries + mutations (RENAME)
├── use-course-student.ts      # Student queries + mutations (RENAME)
├── use-course-module.ts       # Module entity CRUD
├── use-slt.ts                 # SLT entity CRUD
├── use-lesson.ts              # Lesson entity CRUD
├── use-assignment.ts          # Assignment entity CRUD (NEW)
└── use-module-wizard-data.ts  # Composite UI hook
```

---

## Entity & Role Mapping

### Core Course (`use-course.ts`)

**Owns:** `Course`, `CourseDetail`, `CourseStatus`, `transformCourse`, `courseKeys`

| Hook | API Endpoint | Purpose |
|------|--------------|---------|
| `useCourse` | GET `/course/user/course/get/{id}` | Fetch single course (public) |
| `useActiveCourses` | GET `/course/user/courses/list` | List all active courses (on-chain + DB) |

---

### Course Owner (`use-course-owner.ts`) - NEW

**Imports from:** `use-course.ts` (types, transforms, keys)

| Hook | API Endpoint | Purpose |
|------|--------------|---------|
| `useOwnerCourses` | POST `/course/owner/courses/list` | List owned courses |
| `useCreateCourse` | POST `/course/owner/course/create` | Create new course |
| `useUpdateCourse` | POST `/course/owner/course/update` | Update course metadata (including intro) |
| `useDeleteCourse` | POST `/course/owner/course/delete` | Delete course |
| `useRegisterCourse` | POST `/course/owner/course/register` | Register on-chain course |

**Note:** Introduction (title, description, image_url, video_url) is updated via `useUpdateCourse`, not a separate hook.

---

### Course Teacher (`use-course-teacher.ts`) - RENAME from use-teacher-courses.ts

**Owns:** `TeacherCourse`, `TeacherAssignmentCommitment`, `transformTeacherCourse`

| Hook | API Endpoint | Purpose |
|------|--------------|---------|
| `useTeacherCourses` | POST `/course/teacher/courses/list` | List courses I teach |
| `useTeacherAssignmentCommitments` | POST `/course/teacher/assignment-commitments/list` | List pending student submissions |
| `useReviewCommitment` | POST `/course/teacher/assignment-commitment/review` | Approve/deny student submission |

---

### Course Student (`use-course-student.ts`) - RENAME from use-student-courses.ts

**Owns:** `StudentCourse`, `StudentCommitment`, `transformStudentCourse`

| Hook | API Endpoint | Purpose |
|------|--------------|---------|
| `useStudentCourses` | POST `/course/student/courses/list` | List my enrolled courses |
| `useCreateCommitment` | POST `/course/student/commitment/create` | Enroll / commit to assignment |
| `useUpdateCommitment` | POST `/course/student/commitment/update` | Update submission evidence |
| `useSubmitCommitment` | POST `/course/student/commitment/submit` | Submit for review |
| `useClaimCredential` | POST `/course/student/commitment/claim` | Claim earned credential |

---

### Module (`use-course-module.ts`) - KEEP as entity file

**Owns:** `CourseModule`, `ModuleSource`, `transformCourseModule`, `courseModuleKeys`

| Hook | API Endpoint | Purpose |
|------|--------------|---------|
| `useCourseModules` | GET `/course/user/modules/{courseId}` | List modules (public) |
| `useTeacherCourseModules` | POST `/course/teacher/modules/list` | List modules (teacher view) |
| `useCourseModule` | GET `/course/user/modules/{courseId}` | Get single module |
| `useCreateCourseModule` | POST `/course/teacher/module/create` | Create module |
| `useUpdateCourseModule` | POST `/course/teacher/module/update` | Update module |
| `useDeleteCourseModule` | POST `/course/teacher/module/delete` | Delete module |

---

### SLT (`use-slt.ts`) - KEEP as entity file

**Owns:** `SLT`, `transformSLT`, `sltKeys`

| Hook | API Endpoint | Purpose |
|------|--------------|---------|
| `useSLTs` | GET `/course/user/slts/{courseId}/{moduleCode}` | List SLTs (public) |
| `useCreateSLT` | POST `/course/teacher/slt/create` | Create SLT |
| `useUpdateSLT` | POST `/course/teacher/slt/update` | Update SLT |
| `useDeleteSLT` | POST `/course/teacher/slt/delete` | Delete SLT |

---

### Lesson (`use-lesson.ts`) - KEEP as entity file

**Owns:** `Lesson`, `transformLesson`, `lessonKeys`

| Hook | API Endpoint | Purpose |
|------|--------------|---------|
| `useLessons` | GET `/course/user/lessons/{courseId}/{moduleCode}` | List lessons |
| `useLesson` | GET `/course/user/lesson/{courseId}/{moduleCode}/{index}` | Get single lesson |
| `useCreateLesson` | POST `/course/teacher/lesson/create` | Create lesson |
| `useUpdateLesson` | POST `/course/teacher/lesson/update` | Update lesson |
| `useDeleteLesson` | POST `/course/teacher/lesson/delete` | Delete lesson |

---

### Assignment (`use-assignment.ts`) - NEW entity file

**Owns:** `Assignment`, `transformAssignment`, `assignmentKeys`

| Hook | API Endpoint | Purpose |
|------|--------------|---------|
| `useAssignment` | GET `/course/user/assignment/{courseId}/{moduleCode}` | Get assignment |
| `useCreateAssignment` | POST `/course/teacher/assignment/create` | Create assignment definition |
| `useUpdateAssignment` | POST `/course/teacher/assignment/update` | Update assignment definition |
| `useDeleteAssignment` | POST `/course/teacher/assignment/delete` | Delete assignment |

**Note:** Assignment is the **definition** of what students must do. Assignment Commitment is the student's **submission**.

---

## Project Hook Structure (for completeness)

```
src/hooks/api/project/
├── use-project.ts              # Core types + PUBLIC queries
├── use-project-owner.ts        # Owner mutations (future)
├── use-project-manager.ts      # Manager queries + mutations (RENAME)
├── use-project-contributor.ts  # Contributor queries + mutations (RENAME)
└── use-task.ts                 # Task entity CRUD (if needed)
```

---

## Visual Summary: Who Does What

```
┌─────────────────────────────────────────────────────────────────┐
│                         COURSE SYSTEM                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │    OWNER     │    │   TEACHER    │    │   STUDENT    │      │
│  ├──────────────┤    ├──────────────┤    ├──────────────┤      │
│  │ List Courses │    │ Create Module│    │ Enroll       │      │
│  │ Create Course│    │ Create SLT   │    │ Submit Work  │      │
│  │ Update Course│    │ Create Lesson│    │ Claim Cred   │      │
│  │ Delete Course│    │ Create Assign│    │              │      │
│  │ Register     │    │ Review Commit│    │              │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                   │                   │               │
│         ▼                   ▼                   ▼               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    ENTITY FILES                          │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  use-course.ts    → Course, CourseDetail (types only)   │   │
│  │  use-course-module.ts → Module CRUD                     │   │
│  │  use-slt.ts       → SLT CRUD                            │   │
│  │  use-lesson.ts    → Lesson CRUD                         │   │
│  │  use-assignment.ts → Assignment CRUD                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Terminology

| Term | Definition | Created By | Managed By |
|------|------------|------------|------------|
| **Course** | Container for learning content | Owner | Owner |
| **Introduction** | Course metadata (title, description, video) | Owner | Owner |
| **Module** | Unit of learning within a course | Teacher | Teacher |
| **SLT** | Student Learning Target - learning objective | Teacher | Teacher |
| **Lesson** | Educational content for an SLT | Teacher | Teacher |
| **Assignment** | Definition of work students must complete | Teacher | Teacher |
| **Assignment Commitment** | Student's submission of evidence | Student | Teacher reviews |
| **Credential** | On-chain proof of completion | System | Student claims |

---

## Migration Steps

### Phase 1: Create new files
- [ ] Create `use-course-owner.ts` with owner hooks from `use-course.ts`
- [ ] Create `use-assignment.ts` (if API endpoints exist)

### Phase 2: Rename role files
- [ ] `use-teacher-courses.ts` → `use-course-teacher.ts`
- [ ] `use-student-courses.ts` → `use-course-student.ts`
- [ ] `use-manager-projects.ts` → `use-project-manager.ts`
- [ ] `use-contributor-projects.ts` → `use-project-contributor.ts`

### Phase 3: Refactor use-course.ts
- [ ] Move `useOwnedCoursesQuery` → `use-course-owner.ts` (rename to `useOwnerCourses`)
- [ ] Move `useUpdateCourse` → `use-course-owner.ts`
- [ ] Move `useDeleteCourse` → `use-course-owner.ts`
- [ ] Move `useRegisterCourse` → `use-course-owner.ts`
- [ ] Keep types, transforms, keys, and public queries

### Phase 4: Delete legacy
- [ ] Delete `use-owned-courses.ts` (legacy useState hook)

### Phase 5: Apply cleanup tasks
- [ ] Apply Task 1-6 from cleanup plan to all files
- [ ] Rename `courseNftPolicyId` → `courseId` in all files

### Phase 6: Update exports
- [ ] Update `src/hooks/api/course/index.ts`
- [ ] Update `src/hooks/api/index.ts`

---

## Verification

1. `npm run typecheck` after each phase
2. Test UI routes:
   - `/course` - public course list
   - `/studio/course` - owner course management
   - `/my-learning` - student enrolled courses
   - `/studio/course/[id]` - teacher content editing

---

## Open Questions

_Add any questions or refinements needed here:_

1.
2.
3.
