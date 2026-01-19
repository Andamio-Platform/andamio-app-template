# Unified API Gateway Endpoints

> **Source of Truth**: [API Documentation](https://dev-api.andamio.io/api/v1/docs/doc.json)
> **Base URL**: `https://dev-api.andamio.io`
> **Total Endpoints**: ~90+
> **Last Updated**: January 18, 2026

This file documents the main endpoints available in the Unified Andamio API Gateway.

---

## Endpoint Categories

| Category | Count | Description |
|----------|-------|-------------|
| [Authentication](#authentication-2-endpoints) | 2 | User login and registration |
| [User Management](#user-management-4-endpoints) | 4 | User profile and usage metrics |
| [API Key Management](#api-key-management-3-endpoints) | 3 | API key lifecycle |
| [Admin Functions](#admin-functions-3-endpoints) | 3 | Admin-only operations |
| [Merged Courses](#merged-courses-3-endpoints) | 3 | Combined off-chain + on-chain course data |
| [Merged Projects](#merged-projects-3-endpoints) | 3 | Combined off-chain + on-chain project data |
| [Scan: Courses](#scan-courses-4-endpoints) | 4 | On-chain indexed course data |
| [Scan: Projects](#scan-projects-4-endpoints) | 4 | On-chain indexed project data |
| [Scan: Transactions](#scan-transactions-1-endpoint) | 1 | Transaction list |
| [TX: Course Operations](#tx-course-operations-6-endpoints) | 6 | Course transaction building |
| [TX: Project Operations](#tx-project-operations-8-endpoints) | 8 | Project transaction building |
| [TX: Instance/Global](#tx-instanceglobal-operations-3-endpoints) | 3 | Instance and global transaction building |

---

## Authentication (4 endpoints)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v2/auth/login/session` | Create login session, get nonce for signing |
| POST | `/api/v2/auth/login/validate` | Validate wallet signature, get JWT |
| POST | `/api/v2/auth/login` | Direct login (no wallet verification) |
| POST | `/api/v2/auth/developer/account/login` | Developer account login |

### Authentication Flows

**Browser-based (CIP-30 signing)** - Used by T3 App Template:
```
1. POST /api/v2/auth/login/session → { id, nonce }
2. wallet.signData(nonce) → signature
3. POST /api/v2/auth/login/validate → { jwt, user }
```

**Programmatic (no verification)** - For API key access:
```
POST /api/v2/auth/login → { jwt, user }
```

### Request/Response Details

**POST `/api/v2/auth/login/session`**
```typescript
// Request
{ }  // Empty body

// Response
{
  id: string;     // Session ID
  nonce: string;  // Random nonce to sign
}
```

**POST `/api/v2/auth/login/validate`**
```typescript
// Request
{
  id: string;                    // Session ID from step 1
  signature: { signature: string; key: string };
  address: string;               // Wallet address (bech32)
  convert_utf8: boolean;
  wallet_preference: string;
  andamio_access_token_unit?: string;
}

// Response
{
  jwt: string;  // JWT token
  user: {
    id: string;
    cardano_bech32_addr: string;
    access_token_alias: string | null;
  }
}
```

---

## User Management (4 endpoints)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/user/me` | Retrieve authenticated user's full profile |
| POST | `/api/v1/user/delete` | Delete user account and associated data |
| GET | `/api/v1/user/usage` | Get current usage metrics for authenticated user |
| POST | `/api/v1/user/usage/daily` | Retrieve aggregated daily API usage data |

---

## API Key Management (3 endpoints)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/apikey/request` | Generate new API key for authenticated user |
| POST | `/api/v1/apikey/delete` | Revoke or delete specific API key |
| POST | `/api/v1/apikey/rotate` | Extend expiration of existing API key |

### Notes
- API keys are for programmatic access (not web app users)
- Requires access token to generate API key

---

## Admin Functions (3 endpoints)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/admin/set-user-role` | Set user subscription tier |
| POST | `/api/v1/admin/usage/user-api-usage` | Get API usage metrics for specified user |
| POST | `/api/v1/admin/usage/any-user-daily-api-usage` | Retrieve aggregated daily usage for multiple users |

### Notes
- Requires admin role
- Used for platform management

---

## Merged Courses (18+ endpoints)

These endpoints combine off-chain (DB) and on-chain (Andamioscan) data into unified responses.

### Public Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v2/course/user/courses/list` | List all published courses with on-chain state |
| GET | `/api/v2/course/user/course/get/{policy_id}` | Get course details with on-chain state |

### Owner Endpoints (requires auth)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v2/course/owner/courses/list` | List owner's courses (includes unregistered) |
| POST | `/api/v2/course/owner/course/register` | Register on-chain course in DB |

### Teacher Endpoints (requires auth)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v2/course/teacher/courses/list` | List courses where user is teacher |
| POST | `/api/v2/course/teacher/assignment-commitments/list` | List pending assignments to assess |

### Student Endpoints (requires auth)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v2/course/student/courses/list` | List enrolled courses |
| POST | `/api/v2/course/student/assignment-commitments/list` | List student's commitments |

### Response Format
```typescript
{
  data: Array<{
    course_id: string;
    owner: string;
    teachers: string[];
    content?: { title: string; code: string; live: boolean };  // Nested!
    source: "merged" | "chain_only";  // Indicates data origin
  }>;
}
```

**Note**: Hooks flatten `content.*` to top level for backward compatibility.

---

## Merged Projects (18+ endpoints)

These endpoints combine off-chain (DB) and on-chain (Andamioscan) data into unified responses.

### Public Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v2/project/user/projects/list` | List all published projects with on-chain state |
| POST | `/api/v2/project/user/project/get` | Get project details with on-chain state |

### Owner Endpoints (requires auth)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v2/project/owner/projects/list` | List owner's projects (includes unregistered) |
| POST | `/api/v2/project/owner/project/register` | Register on-chain project in DB |

### Manager Endpoints (requires auth)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v2/project/manager/projects/list` | List projects where user is manager |
| POST | `/api/v2/project/manager/commitments/list` | List pending task commitments to assess |

### Contributor Endpoints (requires auth)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v2/project/contributor/projects/list` | List projects where user is contributor |
| POST | `/api/v2/project/contributor/commitments/list` | List contributor's commitments |

### Response Format
Same pattern as courses - `content` is nested, `source` indicates data origin.

---

## Scan: Courses (4 endpoints)

Direct passthrough to Andamioscan for on-chain indexed course data.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v2/courses` | List all courses from on-chain index |
| GET | `/api/v2/courses/{course_id}/details` | Get consolidated course details |
| GET | `/api/v2/courses/{course_id}/students/{student_alias}/status` | Get student progress in course |
| GET | `/api/v2/courses/teachers/{alias}/assessments/pending` | Get pending assessments for teacher |

---

## Scan: Projects (4 endpoints)

Direct passthrough to Andamioscan for on-chain indexed project data.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v2/projects` | List all projects from on-chain index |
| GET | `/api/v2/projects/{project_id}/details` | Get consolidated project details |
| GET | `/api/v2/projects/{project_id}/contributors/{contributor_alias}/status` | Get contributor project progress |
| GET | `/api/v2/projects/managers/{alias}/assessments/pending` | Get pending task assessments for manager |

---

## Scan: Transactions (1 endpoint)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v2/transactions` | List paginated tracked transactions |

---

## TX: Course Operations (6 endpoints)

Transaction building endpoints for course-related operations.

| Method | Path | Description | Transaction Type |
|--------|------|-------------|------------------|
| POST | `/api/v2/tx/course/student/assignment/commit` | Build transaction to commit to assignment | `COURSE_STUDENT_ASSIGNMENT_COMMIT` |
| POST | `/api/v2/tx/course/student/assignment/update` | Build transaction to update assignment completion | `COURSE_STUDENT_ASSIGNMENT_UPDATE` |
| POST | `/api/v2/tx/course/student/credential/claim` | Build transaction to claim course credentials | `COURSE_STUDENT_CREDENTIAL_CLAIM` |
| POST | `/api/v2/tx/course/teacher/assignments/assess` | Build transaction to assess student assignments | `COURSE_TEACHER_ASSIGNMENTS_ASSESS` |
| POST | `/api/v2/tx/course/teacher/modules/manage` | Build transaction to manage course modules | `COURSE_TEACHER_MODULES_MANAGE` |
| POST | `/api/v2/tx/course/owner/teachers/manage` | Build transaction to add/remove course teachers | `COURSE_OWNER_TEACHERS_MANAGE` |

---

## TX: Project Operations (8 endpoints)

Transaction building endpoints for project-related operations.

| Method | Path | Description | Transaction Type |
|--------|------|-------------|------------------|
| POST | `/api/v2/tx/project/contributor/task/commit` | Build transaction to commit to project task | `PROJECT_CONTRIBUTOR_TASK_COMMIT` |
| POST | `/api/v2/tx/project/contributor/task/action` | Build transaction for task actions | `PROJECT_CONTRIBUTOR_TASK_ACTION` |
| POST | `/api/v2/tx/project/contributor/credential/claim` | Build transaction to claim project credentials | `PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM` |
| POST | `/api/v2/tx/project/manager/tasks/assess` | Build transaction to assess task submissions | `PROJECT_MANAGER_TASKS_ASSESS` |
| POST | `/api/v2/tx/project/manager/tasks/manage` | Manage project tasks | `PROJECT_MANAGER_TASKS_MANAGE` |
| POST | `/api/v2/tx/project/owner/managers/manage` | Manage project managers | `PROJECT_OWNER_MANAGERS_MANAGE` |
| POST | `/api/v2/tx/project/owner/contributor-blacklist/manage` | Manage contributor blacklist | `PROJECT_OWNER_BLACKLIST_MANAGE` |
| POST | `/api/v2/tx/project/user/treasury/add-funds` | Add funds to project treasury | `PROJECT_TREASURY_ADD_FUNDS` |

---

## TX: Instance/Global Operations (3 endpoints)

Transaction building endpoints for instance and global operations.

| Method | Path | Description | Transaction Type |
|--------|------|-------------|------------------|
| POST | `/api/v2/tx/global/user/access-token/mint` | Build transaction to mint user access token | `GLOBAL_ACCESS_TOKEN_MINT` |
| POST | `/api/v2/tx/instance/owner/course/create` | Build transaction to initialize new course | `INSTANCE_COURSE_CREATE` |
| POST | `/api/v2/tx/instance/owner/project/create` | Build transaction to initialize new project | `INSTANCE_PROJECT_CREATE` |

---

## Migration Notes

### From 3 APIs to 1

| Before (3 APIs) | After (Unified Gateway) |
|-----------------|-------------------------|
| DB API: `andamio-db-api-343753432212.us-central1.run.app` | `dev-api.andamio.io` |
| Andamioscan: `preprod.andamioscan.io/api` | Same gateway, `/api/v2/*` paths |
| Atlas TX API: `atlas-api-preprod-507341199760.us-central1.run.app` | Same gateway, `/api/v2/tx/*` paths |

### Key Changes

1. **Merged Endpoints**: `/api/v2/course/*` and `/api/v2/project/*` endpoints that combine DB + on-chain data
2. **Simplified Auth**: `/api/v1/auth/login` endpoint (no cryptographic verification - see security note above)
3. **API Key Support**: New capability for programmatic access via `/api/v1/apikey/*`
4. **Admin Endpoints**: Usage tracking and role management via `/api/v1/admin/*`

### Endpoint Path Mapping

| Old Path Pattern | New Path Pattern |
|------------------|------------------|
| DB API: `/course/*` | Gateway: `/api/v2/course/*` (merged) |
| DB API: `/project-v2/*` | Gateway: `/api/v2/project/*` (merged) |
| Andamioscan: `/api/v2/*` | Gateway: `/api/v2/*` (passthrough) |
| Atlas TX: `/v2/tx/*` | Gateway: `/api/v2/tx/*` (passthrough) |

### Important: All Gateway Routes Require `/api` Prefix

**CRITICAL**: All gateway endpoints require the `/api` prefix:
- Auth: `/api/v1/auth/*`
- User: `/api/v1/user/*`
- Admin: `/api/v1/admin/*`
- API Key: `/api/v1/apikey/*`
- Courses/Projects (merged): `/api/v2/course/*`, `/api/v2/project/*`
- On-chain (scan): `/api/v2/courses`, `/api/v2/projects`, `/api/v2/users/*`
- Transactions: `/api/v2/tx/*`

---

**Last Updated**: January 16, 2026
