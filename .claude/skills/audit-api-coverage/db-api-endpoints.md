# Andamio DB API Endpoints

> **Base URL**: `https://andamio-db-api-343753432212.us-central1.run.app`
> **Docs**: [/docs/doc.json](https://andamio-db-api-343753432212.us-central1.run.app/docs/doc.json)
> **Total Endpoints**: 73

## Summary by Category

| Category | Count | Description |
|----------|-------|-------------|
| Health & Auth | 3 | Health check, login session, login validate |
| User Management | 5 | Access token alias, unconfirmed tx, roles, pending transactions |
| Course Public | 6 | Published courses, course details, module lists |
| Course Owner | 6 | Create, update, delete, mint, confirm courses |
| Course Teacher/Modules | 11 | Module CRUD, status updates, publishing |
| SLTs | 7 | SLT CRUD, reordering |
| Lessons | 6 | Lesson CRUD, publishing |
| Assignments | 5 | Assignment CRUD, publishing |
| Assignment Commitments | 9 | Student/teacher commitment workflows |
| Module Introductions | 5 | Introduction CRUD |
| Student Course Status | 2 | Learner course data |
| Project Public | 3 | Treasury list, tasks, prerequisites |
| Project Owner | 4 | Treasury CRUD, mint, confirm |
| Task Manager | 5 | Task CRUD, batch operations |
| Task Commitments | 8 | Manager and contributor commitment workflows |
| Contributor | 1 | Create contributor role |

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

## Course Public (6)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/course/public/courses/list` | All published courses (with NFT policy ID) |
| GET | `/course/public/course/get/{policy_id}` | Course details by NFT policy ID |
| GET | `/course/public/course/check/{code}` | Check if course code is in use |
| GET | `/course/public/course-modules/list/{policy_id}` | All modules for a course with SLT summaries |
| GET | `/course/public/course-module/get/{policy_id}/{module_code}` | Single module with SLTs |
| GET | `/course/public/course-modules/assignment-summary/{policy_id}` | Modules with has_assignment flag |

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
| GET | `/course/public/slts/list/{policy_id}/{module_code}` | All SLTs for a module |
| GET | `/course/public/slt/get/{policy_id}/{module_code}/{index}` | Single SLT by module index |
| POST | `/course/teacher/slt/create` | Create new SLT |
| POST | `/course/teacher/slt/update` | Update SLT text |
| POST | `/course/teacher/slt/update-index` | Update SLT module index (reorder) |
| POST | `/course/teacher/slt/delete` | Delete SLT |
| POST | `/course/teacher/slts/batch-update-indexes` | Update multiple SLT indexes |

## Lessons (6)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/course/public/lessons/list/{policy_id}/{module_code}` | All lessons for a module |
| GET | `/course/public/lesson/get/{policy_id}/{module_code}/{index}` | Lesson by course/module/SLT index |
| POST | `/course/teacher/lesson/create` | Create new lesson |
| POST | `/course/teacher/lesson/update` | Update lesson content |
| POST | `/course/teacher/lesson/publish` | Toggle lesson live status |
| POST | `/course/teacher/lesson/delete` | Delete lesson |

## Assignments (5)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/course/public/assignment/get/{policy_id}/{module_code}` | Assignment with linked SLTs |
| POST | `/course/teacher/assignment/create` | Create new assignment |
| POST | `/course/teacher/assignment/update` | Update assignment content |
| POST | `/course/teacher/assignment/publish` | Toggle assignment live status |
| POST | `/course/teacher/assignment/delete` | Delete assignment |

## Assignment Commitments (9)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/course/public/assignment-commitment/has-commitments/{policy_id}/{module_code}` | Check if assignment has commitments |
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
| GET | `/course/public/introduction/get/{policy_id}/{module_code}` | Introduction content for module |
| POST | `/course/teacher/introduction/create` | Create new introduction |
| POST | `/course/teacher/introduction/update` | Update introduction content |
| POST | `/course/teacher/introduction/publish` | Toggle introduction live status |
| POST | `/course/teacher/introduction/delete` | Delete introduction |

## Student Course Status (2)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/course/student/courses` | Courses learner is enrolled in |
| POST | `/course/student/course-status` | Comprehensive course status for learner |

## Project Public (3)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/project/public/treasury/list` | All published treasury projects |
| GET | `/project/public/task/list/{treasury_nft_policy_id}` | All tasks for a treasury |
| GET | `/project/public/prerequisite/list` | All ON_CHAIN contributor prerequisites |

## Project Owner (4)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/project/owner/treasury/list-owned` | Projects owned by user |
| POST | `/project/owner/treasury/update` | Update project metadata |
| POST | `/project/owner/treasury/mint` | Create project on mint tx submit |
| POST | `/project/owner/treasury/confirm-mint` | Confirm project after blockchain |

## Task Manager (5)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/project/manager/task/create` | Create new task (requires Manager role) |
| POST | `/project/manager/task/update` | Update DRAFT task |
| POST | `/project/manager/task/delete` | Delete DRAFT task |
| POST | `/project/manager/task/batch-update-status` | Update status for multiple tasks |
| POST | `/project/manager/task/batch-confirm` | Confirm multiple tasks after blockchain |

## Task Commitments - Manager (2)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/project/manager/commitment/update-status` | Manager updates commitment status |
| POST | `/project/manager/commitment/confirm-transaction` | Confirm commitment tx |

## Task Commitments - Contributor (6)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/project/contributor/commitment/get` | Get commitment by task_hash |
| POST | `/project/contributor/commitment/create` | Create task commitment |
| POST | `/project/contributor/commitment/update-evidence` | Update commitment evidence |
| POST | `/project/contributor/commitment/update-status` | Update commitment status |
| POST | `/project/contributor/commitment/delete` | Delete commitment |
| POST | `/project/contributor/commitment/confirm-transaction` | Confirm commitment tx |

## Contributor Management (1)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/project/shared/contributor/create` | Create contributor role for user |

---

*Last Updated: January 10, 2026*
