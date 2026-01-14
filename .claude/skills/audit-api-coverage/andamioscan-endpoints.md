# Andamioscan API Endpoints

> **Base URL**: `https://preprod.andamioscan.io/api`
> **Docs**: [swagger.yaml](https://preprod.andamioscan.io/swagger.yaml)
> **Total Endpoints**: 34
> **Last Updated**: January 14, 2026

## Summary by Category

| Category | Count | Description |
|----------|-------|-------------|
| Health | 1 | Service health check |
| Courses | 4 | Course list, details, student status, pending assessments |
| Projects | 4 | Project list, details, contributor status, pending assessments |
| Users | 9 | User state, courses (4 endpoints), projects (4 endpoints) |
| Events | 15 | Transaction confirmation events |
| Transactions | 1 | Paginated transaction list |

## Purpose

Andamioscan is a **read-only blockchain indexer** that provides:
- On-chain course and project data
- User enrollment and credential status
- Transaction confirmation events (for replacing Koios polling)

---

## Health (1)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Service health status |

## Courses (4)

| Method | Path | Description | Client Function |
|--------|------|-------------|-----------------|
| GET | `/api/v2/courses` | List all courses | `getAllCourses()` |
| GET | `/api/v2/courses/{course_id}/details` | Course with modules, students | `getCourse(id)` |
| GET | `/api/v2/courses/{course_id}/students/{alias}/status` | Student progress in course | `getCourseStudent(id, alias)` |
| GET | `/api/v2/courses/teachers/{alias}/assessments/pending` | Pending assessments for teacher | `getPendingAssessments(alias)` |

## Projects (4)

| Method | Path | Description | Client Function |
|--------|------|-------------|-----------------|
| GET | `/api/v2/projects` | List all projects | `getAllProjects()` |
| GET | `/api/v2/projects/{project_id}/details` | Project with tasks, contributors | `getProject(id)` |
| GET | `/api/v2/projects/{project_id}/contributors/{alias}/status` | Contributor status | `getProjectContributorStatus(id, alias)` |
| GET | `/api/v2/projects/managers/{alias}/assessments/pending` | Pending task assessments | `getManagerPendingAssessments(alias)` |

## Users (9)

| Method | Path | Description | Client Function |
|--------|------|-------------|-----------------|
| GET | `/api/v2/users/{alias}/state` | User's global on-chain state | `getUserGlobalState(alias)` |
| GET | `/api/v2/users/{alias}/courses/teaching` | Courses user teaches | `getCoursesOwnedByAlias(alias)` |
| GET | `/api/v2/users/{alias}/courses/enrolled` | Courses user is enrolled in | `getEnrolledCourses(alias)` |
| GET | `/api/v2/users/{alias}/courses/completed` | Courses user completed | `getCompletedCourses(alias)` |
| GET | `/api/v2/users/{alias}/courses/owned` | Courses user owns/admin | `getOwnedCourses(alias)` |
| GET | `/api/v2/users/{alias}/projects/contributing` | Projects user contributes to | `getContributingProjects(alias)` |
| GET | `/api/v2/users/{alias}/projects/managing` | Projects user manages | `getManagingProjects(alias)` |
| GET | `/api/v2/users/{alias}/projects/owned` | Projects user owns | `getOwnedProjects(alias)` |
| GET | `/api/v2/users/{alias}/projects/completed` | Projects user completed | `getCompletedProjects(alias)` |

## Events (15)

Events provide **transaction confirmation** by tx_hash. These replace Koios polling.

| Method | Path | Description | Response Type |
|--------|------|-------------|---------------|
| GET | `/api/v2/events/access-tokens/mint/{tx_hash}` | Access token mint | `UserAccessTokenMintResponse` |
| GET | `/api/v2/events/courses/create/{tx_hash}` | Course creation | `AdminCourseCreateResponse` |
| GET | `/api/v2/events/teachers/update/{tx_hash}` | Teachers update | `AdminCourseTeachersUpdateResponse` |
| GET | `/api/v2/events/modules/manage/{tx_hash}` | Module manage | `TeacherCourseModulesManageResponse` |
| GET | `/api/v2/events/enrollments/enroll/{tx_hash}` | Student enrollment | `StudentCourseEnrollResponse` |
| GET | `/api/v2/events/assignments/submit/{tx_hash}` | Assignment submission | `StudentCourseAssignmentSubmitResponse` |
| GET | `/api/v2/events/assessments/assess/{tx_hash}` | Assessment decision | `TeacherCourseAssignmentsAssessResponse` |
| GET | `/api/v2/events/credential-claims/claim/{tx_hash}` | Course credential claim | `StudentCourseCredentialClaimResponse` |
| GET | `/api/v2/events/projects/create/{tx_hash}` | Project creation | `AdminProjectCreateResponse` |
| GET | `/api/v2/events/projects/join/{tx_hash}` | Project join | `ContributorProjectJoinResponse` |
| GET | `/api/v2/events/tasks/manage/{tx_hash}` | Tasks manage | `ManagerProjectTasksManageResponse` |
| GET | `/api/v2/events/tasks/submit/{tx_hash}` | Task submission | `ContributorProjectSubmitTaskResponse` |
| GET | `/api/v2/events/tasks/assess/{tx_hash}` | Task assessment | `ManagerProjectAssessTaskResponse` |
| GET | `/api/v2/events/credential-claims/project/{tx_hash}` | Project credential | `ContributorProjectCredentialClaimResponse` |
| GET | `/api/v2/events/treasury/fund/{tx_hash}` | Treasury funding | `ManagerProjectFundTreasuryResponse` |

## Transactions (1)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v2/transactions` | Paginated list of all tracked transactions |

**Query Parameters**: `page` (default: 1), `limit` (default: 10)

---

## Client Implementation

All endpoints are implemented in `src/lib/andamioscan.ts`:

```typescript
import {
  getAllCourses,
  getCourse,
  getCourseStudent,
  getPendingAssessments,
  getUserGlobalState,
  getEnrolledCourses,
  // ... etc
} from "~/lib/andamioscan";
```

### React Query Hooks

Hooks are in `src/hooks/use-andamioscan.ts`:

```typescript
import {
  useAllCourses,
  useCourse,
  useCourseStudent,
  useUserGlobalState,
  // ... etc
} from "~/hooks/use-andamioscan";
```

---

*Last Updated: January 11, 2026*
