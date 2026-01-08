# Andamioscan Endpoint Implementation Status

Last updated: 2026-01-08

---

## Summary

| Category | Implemented | Not Implemented | Total |
|----------|-------------|-----------------|-------|
| Courses | 4 | 0 | 4 |
| Users | 5 | 0 | 5 |
| Projects | 8 | 0 | 8 |
| Events | 0 | 15 | 15 |
| **Total** | **17** | **15** | **32** |

---

## Course Endpoints

| Endpoint | Status | Function | Hook | Used In |
|----------|--------|----------|------|---------|
| `GET /v2/courses` | ✅ Implemented | `getAllCourses()` | `useAllCourses()` | Course catalog |
| `GET /v2/courses/{id}/details` | ✅ Implemented | `getCourse()` | `useCourse()` | Course pages, modules viewer |
| `GET /v2/courses/{id}/students/{alias}/status` | ✅ Implemented | `getCourseStudent()` | `useCourseStudent()` | Student progress |
| `GET /v2/courses/teachers/{alias}/assessments/pending` | ✅ Implemented | `getPendingAssessments()` | `usePendingAssessments()` | Dashboard (summary), Instructor page (detailed list) |

---

## User Endpoints

| Endpoint | Status | Function | Hook | Used In |
|----------|--------|----------|------|---------|
| `GET /v2/users/{alias}/state` | ✅ Implemented | `getUserGlobalState()` | `useUserGlobalState()` | Dashboard, enrollment check |
| `GET /v2/users/{alias}/courses/teaching` | ✅ Implemented | `getCoursesOwnedByAlias()` | `useCoursesOwnedByAlias()` | Studio courses |
| `GET /v2/users/{alias}/courses/enrolled` | ✅ Implemented | `getEnrolledCourses()` | `useEnrolledCourses()` | Dashboard (summary), My Learning (on-chain indicator) |
| `GET /v2/users/{alias}/courses/completed` | ✅ Implemented | `getCompletedCourses()` | `useCompletedCourses()` | Dashboard (summary), Credentials page |
| `GET /v2/users/{alias}/courses/owned` | ✅ Implemented | `getOwnedCourses()` | `useOwnedCourses()` | Dashboard (summary), Studio courses (ownership indicator) |

---

## Project Endpoints

| Endpoint | Status | Function | Hook | Used In |
|----------|--------|----------|------|---------|
| `GET /v2/projects` | ✅ Implemented | `getAllProjects()` | `useAllProjects()` | Project catalog (on-chain indicator) |
| `GET /v2/projects/{id}/details` | ✅ Implemented | `getProject()` | `useProject()` | Project detail page (full on-chain data) |
| `GET /v2/projects/{id}/contributors/{alias}/status` | ✅ Implemented | `getProjectContributorStatus()` | `useProjectContributorStatus()` | Contributor progress check |
| `GET /v2/projects/managers/{alias}/assessments/pending` | ✅ Implemented | `getManagerPendingAssessments()` | `useManagerPendingAssessments()` | Manager dashboard |
| `GET /v2/users/{alias}/projects/contributing` | ✅ Implemented | `getContributingProjects()` | `useContributingProjects()` | Dashboard (summary) |
| `GET /v2/users/{alias}/projects/managing` | ✅ Implemented | `getManagingProjects()` | `useManagingProjects()` | Dashboard (summary, only if manager) |
| `GET /v2/users/{alias}/projects/owned` | ✅ Implemented | `getOwnedProjects()` | `useOwnedProjects()` | Project ownership check |
| `GET /v2/users/{alias}/projects/completed` | ✅ Implemented | `getCompletedProjects()` | `useCompletedProjects()` | Project credentials display |

---

## Event Endpoints

All event endpoints are ❌ Not Implemented.

These are used to confirm on-chain transactions by tx_hash:

| Endpoint | Status | Potential Use |
|----------|--------|---------------|
| `GET /v2/events/access-tokens/mint/{tx_hash}` | ❌ | Confirm access token minted |
| `GET /v2/events/courses/create/{tx_hash}` | ❌ | Confirm course created |
| `GET /v2/events/enrollments/enroll/{tx_hash}` | ❌ | Confirm enrollment |
| `GET /v2/events/modules/manage/{tx_hash}` | ❌ | Confirm module minted |
| `GET /v2/events/assignments/submit/{tx_hash}` | ❌ | Confirm assignment submitted |
| `GET /v2/events/assessments/assess/{tx_hash}` | ❌ | Confirm assessment |
| `GET /v2/events/credential-claims/claim/{tx_hash}` | ❌ | Confirm credential claimed |
| `GET /v2/events/teachers/update/{tx_hash}` | ❌ | Confirm teachers updated |
| `GET /v2/events/projects/create/{tx_hash}` | ❌ | Confirm project created |
| `GET /v2/events/projects/join/{tx_hash}` | ❌ | Confirm project joined |
| `GET /v2/events/tasks/manage/{tx_hash}` | ❌ | Confirm task created |
| `GET /v2/events/tasks/submit/{tx_hash}` | ❌ | Confirm task submitted |
| `GET /v2/events/tasks/assess/{tx_hash}` | ❌ | Confirm task assessed |
| `GET /v2/events/credential-claims/project/{tx_hash}` | ❌ | Confirm project credential |
| `GET /v2/events/treasury/fund/{tx_hash}` | ❌ | Confirm treasury funded |

---

## Implementation Priority

### High Priority (Core UX) - ✅ ALL COMPLETE
1. ~~`GET /v2/courses/teachers/{alias}/assessments/pending` - Teacher dashboard~~ ✅ Done
2. ~~`GET /v2/users/{alias}/courses/enrolled` - Learner dashboard~~ ✅ Done
3. ~~`GET /v2/projects` - Project catalog~~ ✅ Done
4. ~~`GET /v2/projects/{id}/details` - Project pages~~ ✅ Done

### Medium Priority (Enhanced Features) - ✅ ALL COMPLETE
5. ~~`GET /v2/projects/managers/{alias}/assessments/pending` - Manager dashboard~~ ✅ Done
6. ~~`GET /v2/users/{alias}/projects/contributing` - User profile~~ ✅ Done
7. ~~`GET /v2/users/{alias}/courses/completed` - Credentials display~~ ✅ Done

### Lower Priority (Confirmation/Validation)
8. Event endpoints - Transaction confirmation (15 endpoints remaining)

---

## Changelog

### 2026-01-08
- **Completed all Project Endpoints** (5 new implementations)
  - `GET /v2/users/{alias}/projects/managing` - Added `getManagingProjects()` / `useManagingProjects()`
  - `GET /v2/users/{alias}/projects/owned` - Added `getOwnedProjects()` / `useOwnedProjects()`
  - `GET /v2/users/{alias}/projects/completed` - Added `getCompletedProjects()` / `useCompletedProjects()`
  - `GET /v2/projects/{id}/contributors/{alias}/status` - Added `getProjectContributorStatus()` / `useProjectContributorStatus()`
  - `GET /v2/projects/managers/{alias}/assessments/pending` - Added `getManagerPendingAssessments()` / `useManagerPendingAssessments()`
  - Added helper hooks: `useIsProjectContributor()`, `useContributorProgress()`
  - Created `ManagingProjectsSummary` dashboard component
  - Added new types: `AndamioscanContributorStatus`, `AndamioscanProjectPendingAssessment`
  - **17 endpoints now implemented, 15 remaining (all Event endpoints)**

- Implemented `GET /v2/users/{alias}/courses/owned`
  - Added `getOwnedCourses()` function to `src/lib/andamioscan.ts`
  - Added `useOwnedCourses()` hook to `src/hooks/use-andamioscan.ts`
  - Created `OwnedCoursesSummary` component for dashboard
  - Enhanced Studio courses page with ownership indicator (crown icon badge)
  - Added `InstructorIcon` to centralized icon system
  - Shows: owned course count, course IDs, links to studio
  - 12 endpoints now implemented, 20 remaining

- Implemented `GET /v2/users/{alias}/projects/contributing`
  - Added `getContributingProjects()` function to `src/lib/andamioscan.ts`
  - Added `useContributingProjects()` hook to `src/hooks/use-andamioscan.ts`
  - Created `ContributingProjectsSummary` component for dashboard
  - Shows: project count, project IDs, links to project pages
  - 11 endpoints now implemented, 21 remaining

- Implemented `GET /v2/users/{alias}/courses/completed`
  - Added `getCompletedCourses()` function to `src/lib/andamioscan.ts`
  - Added `useCompletedCourses()` hook to `src/hooks/use-andamioscan.ts`
  - Created `CredentialsSummary` component for dashboard
  - Created `/credentials` page with full credential display
  - Shows: credential count, course IDs, on-chain verification indicator
  - 10 endpoints now implemented, 22 remaining

- Implemented `GET /v2/projects/{id}/details`
  - Added comprehensive types: `AndamioscanProjectDetails`, `AndamioscanTask`, `AndamioscanSubmission`, `AndamioscanAssessment`, `AndamioscanCredentialClaim`, `AndamioscanTreasuryFunding`, `AndamioscanPrerequisite`
  - Added `getProject()` function to `src/lib/andamioscan.ts`
  - Added `useProject()` hook to `src/hooks/use-andamioscan.ts`
  - Enhanced `/project/[treasurynft]` page with full on-chain data card
  - Shows: contributors, tasks, submissions, assessments, credentials, treasury fundings, prerequisites
  - 9 endpoints now implemented, 23 remaining

- Implemented `GET /v2/projects`
  - Added `AndamioscanProject` type and `getAllProjects()` function to `src/lib/andamioscan.ts`
  - Added `useAllProjects()` hook to `src/hooks/use-andamioscan.ts`
  - Enhanced `/project` page with on-chain status indicator
  - 8 endpoints now implemented, 24 remaining

- Implemented `GET /v2/users/{alias}/courses/enrolled`
  - Added `getEnrolledCourses()` function to `src/lib/andamioscan.ts`
  - Added `useEnrolledCourses()` hook to `src/hooks/use-andamioscan.ts`
  - Created `EnrolledCoursesSummary` component for dashboard
  - Enhanced `MyLearning` component with on-chain enrollment indicator
  - 7 endpoints now implemented, 25 remaining

- Implemented `GET /v2/courses/teachers/{alias}/assessments/pending`
  - Added `getPendingAssessments()` function to `src/lib/andamioscan.ts`
  - Added `usePendingAssessments()` hook to `src/hooks/use-andamioscan.ts`
  - Created `PendingReviewsSummary` component for dashboard
  - Created `PendingReviewsList` component for instructor page
  - 6 endpoints now implemented, 26 remaining

### 2025-01-08
- Initial status document created
- 5 endpoints implemented (3 course, 2 user)
- 27 endpoints remaining
