# Andamio DB API Endpoints

> **Base URL**: `https://andamio-db-api-343753432212.us-central1.run.app`
> **Docs**: [/docs/doc.json](https://andamio-db-api-343753432212.us-central1.run.app/docs/doc.json)
> **Total Endpoints**: 87
> **Last Updated**: January 11, 2026

## Summary by Category

| Category | Count | Description |
|----------|-------|-------------|
| Health & Auth | 3 | Health check, login session, login validate |
| User Management | 5 | Access token alias, unconfirmed tx (GET/POST), roles, pending transactions |
| Course User | 6 | Published courses, course details, module lists |
| Course Owner | 6 | Create, update, delete, mint, confirm courses |
| Course Teacher/Modules | 11 | Module CRUD, status updates, publishing, batch ops |
| SLTs | 7 | SLT CRUD, reordering (public + teacher) |
| Lessons | 6 | Lesson CRUD, publishing (public + teacher) |
| Assignments | 5 | Assignment CRUD, publishing (public + teacher) |
| Assignment Commitments | 10 | Student/teacher/shared commitment workflows |
| Module Introductions | 5 | Introduction CRUD (public + teacher) |
| Student Course Status | 2 | Learner course data |
| Project V2 User | 3 | Projects list, project details, tasks |
| Project V2 Admin | 3 | Project registration, list, update |
| Project V2 Manager/Tasks | 3 | Task create, update, delete |
| Project V2 Manager/Commitments | 2 | Manager commitment workflows |
| Project V2 Contributor/Commitments | 6 | Contributor commitment workflows |

---

## Health & Authentication (3)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Returns API health status |
| POST | `/auth/login/session` | Initiates wallet auth, generates nonce |
| POST | `/auth/login/validate` | Validates CIP-30 signature, returns JWT |

## User Management (5)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/user/access-token-alias` | Updates user's access token alias |
| GET | `/user/unconfirmed-tx` | Gets pending unconfirmed tx hash |
| POST | `/user/unconfirmed-tx` | Sets/clears pending tx hash |
| POST | `/user/init-roles` | Creates all 5 roles for user |
| GET | `/user/pending-transactions` | Returns all pending blockchain txs |

## Course User (6)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/course/user/courses/list` | All published courses (with NFT policy ID) |
| GET | `/course/user/course/get/{policy_id}` | Course details by NFT policy ID |
| GET | `/course/user/course/check/{code}` | Check if course code is in use |
| GET | `/course/user/course-modules/list/{policy_id}` | All modules for a course with SLT summaries |
| GET | `/course/user/course-module/get/{policy_id}/{module_code}` | Single module with SLTs |
| GET | `/course/user/course-modules/assignment-summary/{policy_id}` | Modules with has_assignment flag |

## Course Owner (6)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/course/owner/courses/list` | Courses owned or contributed by creator |
| POST | `/course/owner/course/create` | Create new course (draft) |
| POST | `/course/owner/course/update` | Update existing course |
| POST | `/course/owner/course/delete` | Delete course (owner only) |
| POST | `/course/owner/course/mint` | Create course on minting tx submit |
| POST | `/course/owner/course/confirm-mint` | Confirm course after blockchain confirmation |

## Course Teacher - Modules (11)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/course/teacher/course-modules/list` | Modules grouped by course policy ID |
| POST | `/course/teacher/course-module/create` | Create new module |
| POST | `/course/teacher/course-module/update` | Update module title/description |
| POST | `/course/teacher/course-module/delete` | Delete module |
| POST | `/course/teacher/course-module/update-status` | Update status (DRAFT, PENDING_TX, ON_CHAIN) |
| POST | `/course/teacher/course-module/update-code` | Rename module code |
| POST | `/course/teacher/course-module/publish` | Set all module content |
| POST | `/course/teacher/course-module/set-pending-tx` | Set pending tx hash for DRAFT modules |
| POST | `/course/teacher/course-module/confirm-tx` | Confirm on-chain tx for module |
| POST | `/course/teacher/course-modules/batch-update-status` | Update status for multiple modules |
| POST | `/course/teacher/course-modules/batch-confirm` | Confirm txs for multiple modules |

## SLTs - Student Learning Targets (7)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/course/user/slts/list/{policy_id}/{module_code}` | All SLTs for a module |
| GET | `/course/user/slt/get/{policy_id}/{module_code}/{index}` | Single SLT by module index |
| POST | `/course/teacher/slt/create` | Create new SLT |
| POST | `/course/teacher/slt/update` | Update SLT text |
| POST | `/course/teacher/slt/update-index` | Update SLT module index (reorder) |
| POST | `/course/teacher/slt/delete` | Delete SLT |
| POST | `/course/teacher/slts/batch-update-indexes` | Update multiple SLT indexes |

## Lessons (6)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/course/user/lessons/list/{policy_id}/{module_code}` | All lessons for a module |
| GET | `/course/user/lesson/get/{policy_id}/{module_code}/{index}` | Lesson by course/module/SLT index |
| POST | `/course/teacher/lesson/create` | Create new lesson |
| POST | `/course/teacher/lesson/update` | Update lesson content |
| POST | `/course/teacher/lesson/publish` | Toggle lesson live status |
| POST | `/course/teacher/lesson/delete` | Delete lesson |

## Assignments (5)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/course/user/assignment/get/{policy_id}/{module_code}` | Assignment with linked SLTs |
| POST | `/course/teacher/assignment/create` | Create new assignment |
| POST | `/course/teacher/assignment/update` | Update assignment content |
| POST | `/course/teacher/assignment/publish` | Toggle assignment live status |
| POST | `/course/teacher/assignment/delete` | Delete assignment |

## Assignment Commitments (10)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/course/user/assignment-commitment/has-commitments/{policy_id}/{module_code}` | Check if assignment has commitments |
| POST | `/course/teacher/assignment-commitments/list-by-course` | All commitments for course (teacher view) |
| POST | `/course/teacher/assignment-commitment/review` | Approve/reject learner assignment |
| POST | `/course/student/assignment-commitments/list-by-course` | Learner's commitments for course |
| POST | `/course/student/assignment-commitment/create` | Create commitment (start assignment) |
| POST | `/course/student/assignment-commitment/update-evidence` | Update commitment evidence |
| POST | `/course/student/assignment-commitment/delete` | Delete commitment |
| POST | `/course/shared/assignment-commitment/get` | Get commitment by course/module/alias |
| POST | `/course/shared/assignment-commitment/update-status` | Update network status |
| POST | `/course/shared/assignment-commitment/confirm-transaction` | Confirm on-chain tx |

## Module Introductions (5)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/course/user/introduction/get/{policy_id}/{module_code}` | Introduction content for module |
| POST | `/course/teacher/introduction/create` | Create new introduction |
| POST | `/course/teacher/introduction/update` | Update introduction content |
| POST | `/course/teacher/introduction/publish` | Toggle introduction live status |
| POST | `/course/teacher/introduction/delete` | Delete introduction |

## Student Course Status (2)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/course/student/courses` | Courses learner is enrolled in |
| POST | `/course/student/course-status` | Comprehensive course status for learner |

## Project V2 User (3)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/project-v2/user/projects/list` | All published projects |
| GET | `/project-v2/user/project/{project_id}` | Get project with states |
| GET | `/project-v2/user/tasks/{project_state_policy_id}` | All tasks for a project state |

## Project V2 Admin (3)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/project-v2/admin/projects/list` | List owned/managed projects |
| POST | `/project-v2/admin/project/register` | Register new project |
| POST | `/project-v2/admin/project/update` | Update project metadata |

## Project V2 Manager - Tasks (3)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/project-v2/manager/task/create` | Create new task (requires project_state_policy_id) |
| POST | `/project-v2/manager/task/update` | Update DRAFT task |
| POST | `/project-v2/manager/task/delete` | Delete DRAFT task (uses index not task_index) |

## Project V2 Manager - Commitments (2)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/project-v2/manager/commitment/update-status` | Manager updates commitment status |
| POST | `/project-v2/manager/commitment/confirm-transaction` | Confirm commitment tx |

## Project V2 Contributor - Commitments (6)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/project-v2/contributor/commitment/get` | Get commitment by task_hash |
| POST | `/project-v2/contributor/commitment/create` | Create task commitment |
| POST | `/project-v2/contributor/commitment/update-evidence` | Update commitment evidence |
| POST | `/project-v2/contributor/commitment/update-status` | Update commitment status |
| POST | `/project-v2/contributor/commitment/delete` | Delete commitment |
| POST | `/project-v2/contributor/commitment/confirm-transaction` | Confirm commitment tx |

---

*Last Updated: January 14, 2026*
