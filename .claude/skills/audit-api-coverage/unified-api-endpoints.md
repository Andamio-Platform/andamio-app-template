# Unified API Gateway Endpoints

> **Source of Truth**: [API Documentation](https://andamio-api-gateway-701452636305.us-central1.run.app/api/v1/docs/doc.json)
> **Base URL**: `https://andamio-api-gateway-701452636305.us-central1.run.app`
> **Total Endpoints**: 108
> **Last Updated**: January 20, 2026

This file documents the main endpoints available in the Unified Andamio API Gateway.

---

## API Version Structure

The gateway uses two API versions:
- **v1** (`/v1/*`): Legacy auth, user, admin, API key endpoints
- **v2** (`/v2/*`): Courses, projects, transactions, and new auth

---

## Endpoint Categories

| Category | Count | Description |
|----------|-------|-------------|
| [Authentication](#authentication-6-endpoints) | 6 | User login and registration (v1 & v2) |
| [User Management](#user-management-6-endpoints) | 6 | User profile and access token management |
| [API Key Management](#api-key-management-9-endpoints) | 9 | API key lifecycle (v1 & v2) |
| [Admin Functions](#admin-functions-4-endpoints) | 4 | Admin-only operations |
| [Courses](#courses-42-endpoints) | 42 | Course CRUD, modules, SLTs, assignments |
| [Projects](#projects-20-endpoints) | 20 | Project CRUD, tasks, commitments |
| [TX: Courses](#tx-courses-6-endpoints) | 6 | Course transaction building |
| [TX: Projects](#tx-projects-8-endpoints) | 8 | Project transaction building |
| [TX: Instance/Global](#tx-instanceglobal-7-endpoints) | 7 | Instance, global, and TX state machine |

---

## Authentication (6 endpoints)

### v1 Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/auth/login` | Direct login (API key users) |
| POST | `/v1/auth/register` | Register new user |

### v2 Auth (Wallet-based)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/v2/auth/login/session` | Create login session, get nonce |
| POST | `/v2/auth/login/validate` | Validate wallet signature, get JWT |
| POST | `/v2/auth/developer/account/login` | Developer account login |
| POST | `/v2/auth/developer/account/register` | Developer account registration |

### Authentication Flow

**Browser-based (CIP-30 signing)** - Used by T3 App Template:
```
1. POST /v2/auth/login/session → { id, nonce }
2. wallet.signData(nonce) → signature
3. POST /v2/auth/login/validate → { jwt, user }
```

---

## User Management (6 endpoints)

### v1 User
| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/user/me` | Get authenticated user's profile |
| POST | `/v1/user/delete` | Delete user account |
| GET | `/v1/user/usage` | Get current usage metrics |
| POST | `/v1/user/usage/daily` | Get daily API usage data |

### v2 User
| Method | Path | Description |
|--------|------|-------------|
| POST | `/v2/user/access-token-alias` | Get access token alias for wallet |
| POST | `/v2/user/init-roles` | Initialize user roles |

---

## API Key Management (9 endpoints)

### v1 API Key
| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/apikey/request` | Generate new API key |
| POST | `/v1/apikey/delete` | Revoke API key |
| POST | `/v1/apikey/rotate` | Extend API key expiration |

### v2 Developer API Key
| Method | Path | Description |
|--------|------|-------------|
| POST | `/v2/apikey/developer/account/delete` | Delete developer account |
| POST | `/v2/apikey/developer/key/request` | Request new developer key |
| POST | `/v2/apikey/developer/key/delete` | Delete developer key |
| POST | `/v2/apikey/developer/key/rotate` | Rotate developer key |
| GET | `/v2/apikey/developer/profile/get` | Get developer profile |
| GET | `/v2/apikey/developer/usage/get` | Get developer usage stats |

---

## Admin Functions (4 endpoints)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/admin/set-user-role` | Set user subscription tier |
| POST | `/v1/admin/usage/user-api-usage` | Get user API usage |
| POST | `/v1/admin/usage/any-user-daily-api-usage` | Get daily usage for users |
| GET | `/v2/admin/tx/stats` | Get transaction statistics |

---

## Courses (42 endpoints)

### Owner Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | `/v2/course/owner/courses/list` | List owner's courses |
| POST | `/v2/course/owner/course/create` | Create course (on-chain TX) |
| POST | `/v2/course/owner/course/register` | Register on-chain course in DB |
| POST | `/v2/course/owner/course/update` | Update course metadata |
| POST | `/v2/course/owner/teacher/add` | Add teacher to course |
| POST | `/v2/course/owner/teacher/remove` | Remove teacher from course |

### Teacher Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | `/v2/course/teacher/courses/list` | List courses where user is teacher |
| POST | `/v2/course/teacher/course-modules/list` | List modules for course |
| POST | `/v2/course/teacher/course-module/create` | Create course module |
| POST | `/v2/course/teacher/course-module/update` | Update course module |
| POST | `/v2/course/teacher/course-module/delete` | Delete course module |
| POST | `/v2/course/teacher/course-module/publish` | Publish module on-chain |
| POST | `/v2/course/teacher/slt/create` | Create SLT |
| POST | `/v2/course/teacher/slt/update` | Update SLT |
| POST | `/v2/course/teacher/slt/delete` | Delete SLT |
| POST | `/v2/course/teacher/slt/reorder` | Reorder SLTs |
| POST | `/v2/course/teacher/lesson/create` | Create lesson |
| POST | `/v2/course/teacher/lesson/update` | Update lesson |
| POST | `/v2/course/teacher/lesson/delete` | Delete lesson |
| POST | `/v2/course/teacher/introduction/create` | Create introduction |
| POST | `/v2/course/teacher/introduction/update` | Update introduction |
| POST | `/v2/course/teacher/introduction/delete` | Delete introduction |
| POST | `/v2/course/teacher/assignment/create` | Create assignment |
| POST | `/v2/course/teacher/assignment/update` | Update assignment |
| POST | `/v2/course/teacher/assignment/delete` | Delete assignment |
| POST | `/v2/course/teacher/assignment-commitments/list` | List pending assessments |
| POST | `/v2/course/teacher/assignment-commitment/review` | Review assignment |

### Student Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | `/v2/course/student/courses/list` | List enrolled courses |
| POST | `/v2/course/student/commitment/create` | Create enrollment commitment |
| POST | `/v2/course/student/commitment/submit` | Submit assignment |
| POST | `/v2/course/student/commitment/update` | Update commitment |
| POST | `/v2/course/student/commitment/claim` | Claim credential |
| POST | `/v2/course/student/commitment/leave` | Leave course |
| POST | `/v2/course/student/assignment-commitments/list` | List student's commitments |
| POST | `/v2/course/student/assignment-commitment/get` | Get specific commitment |

### User (Public) Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/v2/course/user/courses/list` | List all published courses |
| GET | `/v2/course/user/course/get/{course_id}` | Get course details |
| GET | `/v2/course/user/modules/{course_id}` | Get course modules |
| GET | `/v2/course/user/slts/{course_id}/{course_module_code}` | Get module SLTs |
| GET | `/v2/course/user/assignment/{course_id}/{course_module_code}` | Get assignment |
| GET | `/v2/course/user/lesson/{course_id}/{course_module_code}/{slt_index}` | Get lesson |

### Shared Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | `/v2/course/shared/commitment/get` | Get commitment (any role) |

---

## Projects (20 endpoints)

### Owner Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | `/v2/project/owner/projects/list` | List owner's projects |
| POST | `/v2/project/owner/project/create` | Create project (on-chain TX) |
| POST | `/v2/project/owner/project/register` | Register on-chain project in DB |
| POST | `/v2/project/owner/project/update` | Update project metadata |

### Manager Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | `/v2/project/manager/projects/list` | List managed projects |
| POST | `/v2/project/manager/tasks/list` | List tasks (POST body) |
| GET | `/v2/project/manager/tasks/{project_state_policy_id}` | List tasks (GET param) |
| POST | `/v2/project/manager/task/create` | Create task |
| POST | `/v2/project/manager/task/update` | Update task |
| POST | `/v2/project/manager/task/delete` | Delete task |
| POST | `/v2/project/manager/commitments/list` | List pending assessments |

### Contributor Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | `/v2/project/contributor/projects/list` | List contributor projects |
| POST | `/v2/project/contributor/commitments/list` | List contributor commitments |
| POST | `/v2/project/contributor/commitment/create` | Create task commitment |
| POST | `/v2/project/contributor/commitment/get` | Get commitment details |
| POST | `/v2/project/contributor/commitment/update` | Update commitment |
| POST | `/v2/project/contributor/commitment/delete` | Delete commitment |

### User (Public) Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/v2/project/user/projects/list` | List all published projects |
| GET | `/v2/project/user/project/{project_id}` | Get project details |
| POST | `/v2/project/user/tasks/list` | List project tasks |

---

## TX: Courses (6 endpoints)

| Method | Path | Description | Transaction Type |
|--------|------|-------------|------------------|
| POST | `/v2/tx/course/owner/teachers/manage` | Add/remove teachers | `COURSE_OWNER_TEACHERS_MANAGE` |
| POST | `/v2/tx/course/teacher/modules/manage` | Manage modules | `COURSE_TEACHER_MODULES_MANAGE` |
| POST | `/v2/tx/course/teacher/assignments/assess` | Assess assignments | `COURSE_TEACHER_ASSIGNMENTS_ASSESS` |
| POST | `/v2/tx/course/student/assignment/commit` | Commit to assignment | `COURSE_STUDENT_ASSIGNMENT_COMMIT` |
| POST | `/v2/tx/course/student/assignment/update` | Update assignment | `COURSE_STUDENT_ASSIGNMENT_UPDATE` |
| POST | `/v2/tx/course/student/credential/claim` | Claim credential | `COURSE_STUDENT_CREDENTIAL_CLAIM` |

---

## TX: Projects (8 endpoints)

| Method | Path | Description | Transaction Type |
|--------|------|-------------|------------------|
| POST | `/v2/tx/project/owner/managers/manage` | Add/remove managers | `PROJECT_OWNER_MANAGERS_MANAGE` |
| POST | `/v2/tx/project/owner/contributor-blacklist/manage` | Manage blacklist | `PROJECT_OWNER_BLACKLIST_MANAGE` |
| POST | `/v2/tx/project/manager/tasks/manage` | Manage tasks | `PROJECT_MANAGER_TASKS_MANAGE` |
| POST | `/v2/tx/project/manager/tasks/assess` | Assess tasks | `PROJECT_MANAGER_TASKS_ASSESS` |
| POST | `/v2/tx/project/contributor/task/commit` | Commit to task | `PROJECT_CONTRIBUTOR_TASK_COMMIT` |
| POST | `/v2/tx/project/contributor/task/action` | Task action | `PROJECT_CONTRIBUTOR_TASK_ACTION` |
| POST | `/v2/tx/project/contributor/credential/claim` | Claim credential | `PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM` |
| POST | `/v2/tx/project/user/treasury/add-funds` | Add treasury funds | `PROJECT_USER_TREASURY_ADD_FUNDS` |

---

## TX: Instance/Global (7 endpoints)

### Instance Creation
| Method | Path | Description | Transaction Type |
|--------|------|-------------|------------------|
| POST | `/v2/tx/instance/owner/course/create` | Create course on-chain | `INSTANCE_COURSE_CREATE` |
| POST | `/v2/tx/instance/owner/project/create` | Create project on-chain | `INSTANCE_PROJECT_CREATE` |

### Global Operations
| Method | Path | Description | Transaction Type |
|--------|------|-------------|------------------|
| POST | `/v2/tx/global/user/access-token/mint` | Mint access token | `GLOBAL_GENERAL_ACCESS_TOKEN_MINT` |

### TX State Machine
| Method | Path | Description |
|--------|------|-------------|
| POST | `/v2/tx/register` | Register TX for monitoring |
| GET | `/v2/tx/status/{tx_hash}` | Get TX status |
| GET | `/v2/tx/pending` | List pending TXs |
| GET | `/v2/tx/types` | Get valid TX types |

---

## Migration Notes

### Path Changes (January 2026)

The API paths were restructured for cleaner URL generation:

| Old Pattern | New Pattern |
|-------------|-------------|
| `/api/v1/auth/*` | `/v1/auth/*` |
| `/api/v2/course/*` | `/v2/course/*` |
| `/api/v2/project/*` | `/v2/project/*` |
| `/api/v2/tx/*` | `/v2/tx/*` |

### Removed: Scan Endpoints

On-chain indexed data endpoints (`/v2/courses`, `/v2/projects`) are no longer in this gateway. The merged endpoints (`/v2/course/*`, `/v2/project/*`) now include on-chain state where applicable.

---

**Last Updated**: January 20, 2026
