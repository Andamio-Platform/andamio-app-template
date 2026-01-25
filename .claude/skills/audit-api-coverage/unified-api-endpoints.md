# Unified API Gateway Endpoints

> **Source of Truth**: [API Documentation](https://dev.api.andamio.io/api/v1/docs/index.html)
> **Base URL**: `https://dev.api.andamio.io`
> **OpenAPI Spec**: [doc.json](https://dev.api.andamio.io/api/v1/docs/doc.json)
> **Last Updated**: January 25, 2026

This file documents all endpoints available in the Unified Andamio API Gateway.

---

## API Version Structure

The gateway uses two API versions:
- **v1** (`/api/v1/*`): Admin, user management endpoints
- **v2** (`/api/v2/*`): Auth, courses, projects, transactions, API key management

---

## Endpoint Categories

| Category | Count | Description |
|----------|-------|-------------|
| [Admin Functions](#admin-functions-4-endpoints) | 4 | Admin-only operations |
| [User Management](#user-management-4-endpoints) | 4 | User profile and usage |
| [Authentication](#authentication-6-endpoints) | 6 | User and developer login (v2) |
| [API Key Management](#api-key-management-6-endpoints) | 6 | Developer API key lifecycle (v2) |
| [Courses](#courses-41-endpoints) | 41 | Course CRUD, modules, SLTs, assignments |
| [Projects](#projects-17-endpoints) | 17 | Project CRUD, tasks, commitments |
| [TX: Courses](#tx-courses-6-endpoints) | 6 | Course transaction building |
| [TX: Projects](#tx-projects-8-endpoints) | 8 | Project transaction building |
| [TX: Instance/Global](#tx-instanceglobal-7-endpoints) | 7 | Instance, global, and TX state machine |

**Total: ~99 endpoints**

---

## Admin Functions (4 endpoints)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/admin/set-user-role` | Set user subscription tier |
| POST | `/api/v1/admin/usage/user-api-usage` | Get user API usage |
| POST | `/api/v1/admin/usage/any-user-daily-api-usage` | Get daily usage for users |
| GET | `/api/v2/admin/tx/stats` | Get transaction statistics |

---

## User Management (4 endpoints)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/user/me` | Get authenticated user's profile |
| POST | `/api/v1/user/delete` | Delete user account |
| GET | `/api/v1/user/usage` | Get current usage metrics |
| POST | `/api/v1/user/usage/daily` | Get daily API usage data |

---

## Authentication (6 endpoints)

### v2 Auth (Wallet-based)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v2/auth/login/session` | Create login session, get nonce |
| POST | `/api/v2/auth/login/validate` | Validate wallet signature, get JWT |

### v2 Developer Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v2/auth/developer/account/login` | Developer account login |
| POST | `/api/v2/auth/developer/account/register` | Developer account registration |
| POST | `/api/v2/auth/developer/register/session` | Initiate wallet-based dev registration |
| POST | `/api/v2/auth/developer/register/complete` | Complete wallet-based dev registration |

### Authentication Flow

**Browser-based (CIP-30 signing)** - Used by T3 App Template:
```
1. POST /api/v2/auth/login/session -> { id, nonce }
2. wallet.signData(nonce) -> signature
3. POST /api/v2/auth/login/validate -> { jwt, user }
```

---

## API Key Management (6 endpoints)

### v2 Developer API Key
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v2/apikey/developer/account/delete` | Delete developer account |
| POST | `/api/v2/apikey/developer/key/request` | Request new developer key |
| POST | `/api/v2/apikey/developer/key/delete` | Delete developer key |
| POST | `/api/v2/apikey/developer/key/rotate` | Rotate developer key |
| GET | `/api/v2/apikey/developer/profile/get` | Get developer profile |
| GET | `/api/v2/apikey/developer/usage/get` | Get developer usage stats |

---

## Courses (41 endpoints)

### Owner Endpoints (7)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v2/course/owner/courses/list` | List owner's courses |
| POST | `/api/v2/course/owner/course/create` | Create course |
| POST | `/api/v2/course/owner/course/register` | Register on-chain course in DB |
| POST | `/api/v2/course/owner/course/update` | Update course metadata |
| POST | `/api/v2/course/owner/teacher/add` | Add teacher to course **(DEPRECATED)** |
| POST | `/api/v2/course/owner/teacher/remove` | Remove teacher from course **(DEPRECATED)** |
| POST | `/api/v2/course/owner/teachers/update` | Bulk update teachers |

### Teacher Endpoints (19 + 1 requested)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v2/course/teacher/courses/list` | List courses where user is teacher |
| POST | `/api/v2/course/teacher/course-modules/list` | List modules for course |
| POST | `/api/v2/course/teacher/course-module/create` | Create course module |
| POST | `/api/v2/course/teacher/course-module/register` | Register on-chain module in DB ✅ |
| POST | `/api/v2/course/teacher/course-module/update` | Update course module |
| POST | `/api/v2/course/teacher/course-module/delete` | Delete course module |
| POST | `/api/v2/course/teacher/course-module/publish` | Publish module on-chain |
| POST | `/api/v2/course/teacher/slt/create` | Create SLT |
| POST | `/api/v2/course/teacher/slt/update` | Update SLT |
| POST | `/api/v2/course/teacher/slt/delete` | Delete SLT |
| POST | `/api/v2/course/teacher/slt/reorder` | Reorder SLTs |
| POST | `/api/v2/course/teacher/lesson/create` | Create lesson |
| POST | `/api/v2/course/teacher/lesson/update` | Update lesson |
| POST | `/api/v2/course/teacher/lesson/delete` | Delete lesson |
| POST | `/api/v2/course/teacher/introduction/create` | Create introduction |
| POST | `/api/v2/course/teacher/introduction/update` | Update introduction |
| POST | `/api/v2/course/teacher/introduction/delete` | Delete introduction |
| POST | `/api/v2/course/teacher/assignment/create` | Create assignment |
| POST | `/api/v2/course/teacher/assignment/update` | Update assignment |
| POST | `/api/v2/course/teacher/assignment/delete` | Delete assignment |
| POST | `/api/v2/course/teacher/assignment-commitments/list` | List pending assessments |
| POST | `/api/v2/course/teacher/assignment-commitment/review` | Review assignment |

### Student Endpoints (8)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v2/course/student/courses/list` | List enrolled courses |
| POST | `/api/v2/course/student/commitment/create` | Create enrollment commitment |
| POST | `/api/v2/course/student/commitment/submit` | Submit assignment |
| POST | `/api/v2/course/student/commitment/update` | Update commitment |
| POST | `/api/v2/course/student/commitment/claim` | Claim credential |
| POST | `/api/v2/course/student/commitment/leave` | Leave course |
| POST | `/api/v2/course/student/assignment-commitments/list` | List student's commitments |
| POST | `/api/v2/course/student/assignment-commitment/get` | Get specific commitment |

### User (Public) Endpoints (6)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v2/course/user/courses/list` | List all published courses |
| GET | `/api/v2/course/user/course/get/{course_id}` | Get course details |
| GET | `/api/v2/course/user/modules/{course_id}` | Get course modules |
| GET | `/api/v2/course/user/slts/{course_id}/{course_module_code}` | Get module SLTs |
| GET | `/api/v2/course/user/assignment/{course_id}/{course_module_code}` | Get assignment |
| GET | `/api/v2/course/user/lesson/{course_id}/{course_module_code}/{slt_index}` | Get lesson |

### Shared Endpoints (1)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v2/course/shared/commitment/get` | Get commitment (any role) |

---

## Projects (17 endpoints)

### Owner Endpoints (4)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v2/project/owner/projects/list` | List owner's projects |
| POST | `/api/v2/project/owner/project/create` | Create project |
| POST | `/api/v2/project/owner/project/register` | Register on-chain project in DB |
| POST | `/api/v2/project/owner/project/update` | Update project metadata |

### Manager Endpoints (7)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v2/project/manager/projects/list` | List managed projects |
| POST | `/api/v2/project/manager/tasks/list` | List tasks (POST body) |
| GET | `/api/v2/project/manager/tasks/{project_state_policy_id}` | List tasks (GET param) |
| POST | `/api/v2/project/manager/task/create` | Create task |
| POST | `/api/v2/project/manager/task/update` | Update task |
| POST | `/api/v2/project/manager/task/delete` | Delete task |
| POST | `/api/v2/project/manager/commitments/list` | List pending assessments |

### Contributor Endpoints (6)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v2/project/contributor/projects/list` | List contributor projects |
| POST | `/api/v2/project/contributor/commitments/list` | List contributor commitments |
| POST | `/api/v2/project/contributor/commitment/create` | Create task commitment |
| POST | `/api/v2/project/contributor/commitment/get` | Get commitment details |
| POST | `/api/v2/project/contributor/commitment/update` | Update commitment |
| POST | `/api/v2/project/contributor/commitment/delete` | Delete commitment |

### User (Public) Endpoints (3)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v2/project/user/projects/list` | List all published projects |
| GET | `/api/v2/project/user/project/{project_id}` | Get project details |
| POST | `/api/v2/project/user/tasks/list` | List project tasks |

---

## TX: Courses (6 endpoints)

| Method | Path | Description | Transaction Type |
|--------|------|-------------|------------------|
| POST | `/api/v2/tx/course/owner/teachers/manage` | Add/remove teachers | `COURSE_OWNER_TEACHERS_MANAGE` |
| POST | `/api/v2/tx/course/teacher/modules/manage` | Manage modules | `COURSE_TEACHER_MODULES_MANAGE` |
| POST | `/api/v2/tx/course/teacher/assignments/assess` | Assess assignments | `COURSE_TEACHER_ASSIGNMENTS_ASSESS` |
| POST | `/api/v2/tx/course/student/assignment/commit` | Commit to assignment | `COURSE_STUDENT_ASSIGNMENT_COMMIT` |
| POST | `/api/v2/tx/course/student/assignment/update` | Update assignment | `COURSE_STUDENT_ASSIGNMENT_UPDATE` |
| POST | `/api/v2/tx/course/student/credential/claim` | Claim credential | `COURSE_STUDENT_CREDENTIAL_CLAIM` |

---

## TX: Projects (8 endpoints)

| Method | Path | Description | Transaction Type |
|--------|------|-------------|------------------|
| POST | `/api/v2/tx/project/owner/managers/manage` | Add/remove managers | `PROJECT_OWNER_MANAGERS_MANAGE` |
| POST | `/api/v2/tx/project/owner/contributor-blacklist/manage` | Manage blacklist | `PROJECT_OWNER_BLACKLIST_MANAGE` |
| POST | `/api/v2/tx/project/manager/tasks/manage` | Manage tasks | `PROJECT_MANAGER_TASKS_MANAGE` |
| POST | `/api/v2/tx/project/manager/tasks/assess` | Assess tasks | `PROJECT_MANAGER_TASKS_ASSESS` |
| POST | `/api/v2/tx/project/contributor/task/commit` | Commit to task | `PROJECT_CONTRIBUTOR_TASK_COMMIT` |
| POST | `/api/v2/tx/project/contributor/task/action` | Task action | `PROJECT_CONTRIBUTOR_TASK_ACTION` |
| POST | `/api/v2/tx/project/contributor/credential/claim` | Claim credential | `PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM` |
| POST | `/api/v2/tx/project/user/treasury/add-funds` | Add treasury funds | `PROJECT_USER_TREASURY_ADD_FUNDS` |

---

## TX: Instance/Global (7 endpoints)

### Instance Creation
| Method | Path | Description | Transaction Type |
|--------|------|-------------|------------------|
| POST | `/api/v2/tx/instance/owner/course/create` | Create course on-chain | `INSTANCE_COURSE_CREATE` |
| POST | `/api/v2/tx/instance/owner/project/create` | Create project on-chain | `INSTANCE_PROJECT_CREATE` |

### Global Operations
| Method | Path | Description | Transaction Type |
|--------|------|-------------|------------------|
| POST | `/api/v2/tx/global/user/access-token/mint` | Mint access token | `GLOBAL_GENERAL_ACCESS_TOKEN_MINT` |

### TX State Machine
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v2/tx/register` | Register TX for monitoring |
| GET | `/api/v2/tx/status/{tx_hash}` | Get TX status |
| GET | `/api/v2/tx/pending` | List pending TXs |
| GET | `/api/v2/tx/types` | Get valid TX types |

---

## Deprecated Endpoints

The following endpoints have been removed or deprecated:

| Status | Endpoint | Replacement |
|--------|----------|-------------|
| Removed | `/api/v1/auth/login` | `/api/v2/auth/developer/account/login` |
| Removed | `/api/v1/auth/register` | `/api/v2/auth/developer/account/register` |
| Removed | `/api/v1/apikey/request` | `/api/v2/apikey/developer/key/request` |
| Removed | `/api/v1/apikey/delete` | `/api/v2/apikey/developer/key/delete` |
| Removed | `/api/v1/apikey/rotate` | `/api/v2/apikey/developer/key/rotate` |
| Deprecated | `/api/v2/course/owner/teacher/add` | `/api/v2/course/owner/teachers/update` |
| Deprecated | `/api/v2/course/owner/teacher/remove` | `/api/v2/course/owner/teachers/update` |

---

**Last Updated**: January 25, 2026
