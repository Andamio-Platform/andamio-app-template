# Andamio API V2 - Frontend Integration Checklist

> **Status**: ✅ MIGRATION COMPLETE - Implemented on `update/andamioscan` branch
> **Last Updated**: 2026-01-18
> **Completed In**: Session 16 (January 17-18, 2026)

---

## ✅ MIGRATION COMPLETE

This checklist was used to plan and track the V2 Gateway API migration. The migration has been completed on the `update/andamioscan` branch.

### Summary of Changes

- **60+ files updated** to use `/api/gateway/api/v2/*` paths
- **New unified proxy** at `/api/gateway/[...path]/route.ts`
- **Types generated** from OpenAPI spec to `src/types/generated/`
- **Legacy code removed** (old proxy routes, deprecated hooks)
- **New role-based hooks** created for courses and projects

See `STATUS.md` Session 16 Summary for full details.

---

## Pre-Integration Checklist (COMPLETED)

### Environment Setup

- [x] Install Mesh SDK: `npm install @meshsdk/core @meshsdk/react`
- [x] Configure MeshProvider in app layout
- [x] Set up API base URL environment variable: `NEXT_PUBLIC_ANDAMIO_GATEWAY_URL`
- [x] Create API client wrapper (`src/lib/gateway.ts`)

### Authentication

- [x] Implement wallet connection UI (CardanoWallet component or custom)
- [x] Implement challenge/verify login flow:
  - [x] `POST /api/v2/auth/login/session` - Get nonce
  - [x] Sign nonce with wallet (`wallet.signData`)
  - [x] `POST /api/v2/auth/login/validate` - Verify signature, get session
- [x] Store and manage session tokens
- [x] Implement token refresh logic
- [x] Handle session expiry gracefully

---

## Breaking Changes Checklist (COMPLETED)

### 1. New Endpoints

| Status | Endpoint | Method | Purpose |
|--------|----------|--------|---------|
| [x] | `/api/v2/course/owner/course/register` | POST | Register on-chain course not yet in DB |
| [x] | `/api/v2/project/owner/project/register` | POST | Register on-chain project not yet in DB |
| [x] | `/api/v2/project/owner/projects/list` | POST | List all projects owned by owner |

**Register endpoints usage**:
```typescript
// When owner sees an on-chain course not in DB, register it:
POST /api/v2/course/owner/course/register
{ policy_id: string, title: string }

// When owner sees an on-chain project not in DB:
POST /api/v2/project/owner/project/register
{ policy_id: string, title: string }
```

### 2. Renamed Endpoints

| Status | Old Endpoint | New Endpoint |
|--------|--------------|--------------|
| [x] | `/course/teacher/assignment-commitments/list-by-course` | `/course/teacher/assignment-commitments/list` |
| [x] | `/course/student/assignment-commitments/list-by-course` | `/course/student/assignment-commitments/list` |
| [x] | `/course/teacher/slt/update-index` | `/course/teacher/slt/reorder` |

**Note**: The `list` endpoints now accept `course_id` as an **optional** filter. When omitted, returns all commitments the user has access to.

### 3. Method/Parameter Changes

| Status | Old | New |
|--------|-----|-----|
| [x] | `GET /project/user/tasks/{project_state_policy_id}` | `POST /project/user/tasks/list` with `{project_id}` in body |
| [x] | `GET /project/manager/tasks/{project_state_policy_id}` | `POST /project/manager/tasks/list` with `{project_id}` in body |

### 4. Role Naming Change (Project System)

| Status | Change |
|--------|--------|
| [x] | Project TX endpoints use `owner` instead of `admin` |

**Important**: TX routes use `/project/owner/*` but some DB routes still use `/project/admin/*`. Use the endpoint paths as documented here.

| Old Pattern | New Pattern |
|-------------|-------------|
| `/api/v2/project/admin/*` (DB) | Keep using `/api/v2/project/admin/*` for now |
| `/api/v2/tx/project/admin/*` | `/api/v2/tx/project/owner/*` |

### 5. Removed Endpoints

| Status | Removed | Use Instead |
|--------|---------|-------------|
| [x] | `/course/user/course-module/get/{policy_id}/{module_code}` | `/course/user/course-modules/list/{policy_id}` + filter client-side |
| [x] | `/course/user/slt/get/{policy_id}/{module_code}/{index}` | `/course/user/slts/list/{policy_id}/{module_code}` + filter client-side |
| [x] | `/project/user/task/get/{task_hash}` | `/project/user/tasks/list` + filter client-side |
| [x] | `/project/user/project-state/{project_state_policy_id}` | Data now included in `/projects/list` and `/project/get` |
| [x] | `/course/user/modules/assignment-summary/{policy_id}` | Use `/course/get` for counts |

---

## Merged Endpoints Checklist (COMPLETED)

These endpoints return **enriched data** combining DB + on-chain data. No separate calls needed.

### Course System

| Status | Endpoint | What's Merged |
|--------|----------|---------------|
| [x] | `GET /api/v2/course/user/courses/list` | DB courses + on-chain state |
| [x] | `GET /api/v2/course/user/course/get/{course_id}` | DB course + on-chain details |
| [x] | `POST /api/v2/course/owner/courses/list` | DB courses + unregistered on-chain courses |
| [x] | `POST /api/v2/course/student/courses/list` | DB enrollment + on-chain enrollment state |
| [x] | `POST /api/v2/course/student/assignment-commitments/list` | DB commitments + on-chain status |
| [x] | `POST /api/v2/course/student/assignment-commitment/get` | DB commitment + on-chain status |
| [x] | `POST /api/v2/course/teacher/courses/list` | DB courses + on-chain state |
| [x] | `POST /api/v2/course/teacher/assignment-commitments/list` | DB commitments + on-chain status |

### Project System

| Status | Endpoint | What's Merged |
|--------|----------|---------------|
| [x] | `GET /api/v2/project/user/projects/list` | DB projects + on-chain project-state |
| [x] | `GET /api/v2/project/user/project/{project_id}` | DB project + on-chain details |
| [x] | `POST /api/v2/project/user/tasks/list` | DB tasks + on-chain task state |
| [x] | `POST /api/v2/project/owner/projects/list` | DB projects + unregistered on-chain projects |
| [x] | `POST /api/v2/project/manager/projects/list` | DB projects + on-chain state |
| [x] | `POST /api/v2/project/manager/tasks/list` | DB tasks + on-chain state |
| [x] | `POST /api/v2/project/manager/commitments/list` | DB commitments + on-chain status |
| [x] | `POST /api/v2/project/contributor/projects/list` | DB projects + on-chain contributor status |
| [x] | `POST /api/v2/project/contributor/commitments/list` | DB commitments + on-chain status |
| [x] | `POST /api/v2/project/contributor/commitment/get` | DB commitment + on-chain status |

---

## Transaction System Checklist (COMPLETED)

### TX Build Endpoints (17 total)

All TX types follow the pattern: **BUILD** (Gateway) -> **SIGN** (Wallet) -> **SUBMIT** (Network) -> **CONFIRM** (Gateway auto)

#### Global

| Status | Route | Notes |
|--------|-------|-------|
| [x] | `POST /api/v2/tx/global/user/access-token/mint` | First TX users need |

#### Instance (Course/Project Creation)

| Status | Route | Notes |
|--------|-------|-------|
| [x] | `POST /api/v2/tx/instance/owner/course/create` | Creates course on-chain |
| [x] | `POST /api/v2/tx/instance/owner/project/create` | Creates project on-chain |

#### Course

| Status | Route | Notes |
|--------|-------|-------|
| [x] | `POST /api/v2/tx/course/owner/teachers/manage` | Add/remove teachers |
| [x] | `POST /api/v2/tx/course/teacher/modules/manage` | Add/update/remove modules |
| [x] | `POST /api/v2/tx/course/teacher/assignments/assess` | Batch assess submissions |
| [x] | `POST /api/v2/tx/course/student/assignment/commit` | Submit assignment |
| [x] | `POST /api/v2/tx/course/student/assignment/update` | Update submission |
| [x] | `POST /api/v2/tx/course/student/credential/claim` | Claim course credential |

#### Project

| Status | Route | Notes |
|--------|-------|-------|
| [x] | `POST /api/v2/tx/project/owner/managers/manage` | Add/remove managers |
| [x] | `POST /api/v2/tx/project/owner/contributor-blacklist/manage` | Manage blacklist |
| [x] | `POST /api/v2/tx/project/manager/tasks/manage` | Add/remove tasks |
| [x] | `POST /api/v2/tx/project/manager/tasks/assess` | Assess task submissions |
| [x] | `POST /api/v2/tx/project/contributor/task/commit` | Commit to task |
| [x] | `POST /api/v2/tx/project/contributor/task/action` | Submit/leave/update task |
| [x] | `POST /api/v2/tx/project/contributor/credential/claim` | Claim project credential |
| [x] | `POST /api/v2/tx/project/user/treasury/add-funds` | Fund project treasury |

### TX State Machine Status

**Implementation Status**: 16/17 complete

| Status | TX Type | Gateway Confirms | DB Update |
|--------|---------|------------------|-----------|
| [x] | Access Token Mint | Yes | None needed |
| [x] | Course Create | Yes | Auto-registers course |
| [x] | Project Create | Yes | Auto-registers project |
| [x] | Teachers Manage | Yes | Syncs teacher list |
| [x] | Modules Manage | Yes | Batch confirms modules |
| [x] | Assignments Assess | Yes | Updates commitment status |
| [x] | Assignment Commit | Yes | Updates commitment status |
| [x] | Assignment Update | Yes | Updates evidence |
| [x] | Course Credential Claim | Yes | None needed |
| [x] | Blacklist Manage | Yes | None needed |
| [x] | Tasks Manage | Yes | Sets task_hash, status |
| [x] | Tasks Assess | Yes | Updates commitment status |
| [x] | Task Commit | Yes | Confirms commitment |
| [x] | Task Action (submit) | Yes | Updates status |
| [x] | Project Credential Claim | Yes | None needed |
| [x] | Treasury Add Funds | Yes | None needed |
| [ ] | **Managers Manage** | **BLOCKED** | Awaiting Andamioscan event endpoint |

### TX Confirmation Pattern

There is **no unified `/tx/confirm` endpoint**. Confirmation is automatic for implemented TX types.

```typescript
// After wallet.submitTx(signedTx) returns txHash:
const txHash = await wallet.submitTx(signedTx);

// For IMPLEMENTED transactions (16 types):
// Gateway auto-confirms via TxTypeRegistry. Just refetch data after delay.
toast.success('Transaction submitted! Data will update shortly.');
setTimeout(() => refetchData(), 30000); // ~30 seconds for block confirmation

// For BLOCKED transaction (Managers Manage):
// Show explorer link for manual verification
toast.info(`Transaction submitted. Check: cardanoscan.io/transaction/${txHash}`);
```

---

## API Client Pattern

### Recommended Implementation

```typescript
// lib/andamio-api.ts
const API_BASE = process.env.NEXT_PUBLIC_ANDAMIO_API_URL || 'https://api.andamio.io/api/v2';

class AndamioApiClient {
  private accessToken: string | null = null;

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.accessToken && { Authorization: `Bearer ${this.accessToken}` }),
      ...options.headers
    };

    const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }
    return response.json();
  }

  // Auth
  async getLoginSession(alias: string) {
    return this.request<{ nonce: string }>('/auth/login/session', {
      method: 'POST',
      body: JSON.stringify({ alias })
    });
  }

  async validateLogin(alias: string, signature: string, key: string) {
    return this.request<{ session: string }>('/auth/login/validate', {
      method: 'POST',
      body: JSON.stringify({ alias, signature, key })
    });
  }

  // Courses (merged endpoints)
  async listCourses() {
    return this.request<Course[]>('/course/user/courses/list');
  }

  async getCourse(courseId: string) {
    return this.request<Course>(`/course/user/course/get/${courseId}`);
  }

  // TX Building
  async buildTx(endpoint: string, params: unknown) {
    return this.request<{ unsigned_tx: string }>(`/tx${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }
}

export const andamioApi = new AndamioApiClient();
```

### Transaction Hook

```typescript
// hooks/useTransaction.ts
import { useState, useCallback } from 'react';
import { useWallet } from '@meshsdk/react';

type TxStatus = 'idle' | 'building' | 'signing' | 'submitting' | 'confirming' | 'confirmed' | 'error';

export function useTransaction<T>(buildFn: (params: T) => Promise<{ unsigned_tx: string }>) {
  const { wallet } = useWallet();
  const [status, setStatus] = useState<TxStatus>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (params: T) => {
    if (!wallet) throw new Error('Wallet not connected');
    setError(null);

    try {
      setStatus('building');
      const { unsigned_tx } = await buildFn(params);

      setStatus('signing');
      const signedTx = await wallet.signTx(unsigned_tx, true);

      setStatus('submitting');
      const hash = await wallet.submitTx(signedTx);
      setTxHash(hash);

      setStatus('confirming');
      // Gateway auto-confirms - just wait for block
      await new Promise(resolve => setTimeout(resolve, 30000));

      setStatus('confirmed');
      return hash;
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, [wallet, buildFn]);

  return { execute, status, txHash, error, reset: () => setStatus('idle') };
}
```

---

## Endpoint Reference Summary

### Public Endpoints (No Auth)

| System | Count | Base Path |
|--------|-------|-----------|
| Course User | 9 | `GET /api/v2/course/user/*` |
| Project User | 3 | `GET /api/v2/project/user/*` |
| **Total Public** | **12** | |

### Authenticated Endpoints

| System | Count | Base Path |
|--------|-------|-----------|
| Auth | 4 | `/api/v2/auth/*`, `/api/v2/apikey/*` |
| Course Owner | 5 | `POST /api/v2/course/owner/*` |
| Course Teacher | 24 | `POST /api/v2/course/teacher/*` |
| Course Student | 6 | `POST /api/v2/course/student/*` |
| Course Shared | 2 | `POST /api/v2/course/shared/*` |
| Project Admin/Owner | 4 | `POST /api/v2/project/admin/*` or `owner/*` |
| Project Manager | 6 | `POST /api/v2/project/manager/*` |
| Project Contributor | 6 | `POST /api/v2/project/contributor/*` |
| TX Building | 17 | `POST /api/v2/tx/*` |
| **Total Authenticated** | **74** | |

### Merged Endpoints (included in counts above)

| Count | Description |
|-------|-------------|
| 18 | Endpoints combining DB API + Andamioscan data |

---

## Known Issues / Notes

### Project Role Naming Inconsistency

The codebase currently has an inconsistency:
- **TX routes**: Use `/project/owner/*` (correct)
- **Merged routes**: Use `/project/owner/*` (correct)
- **DB routes**: Still use `/project/admin/*` (legacy)

**For frontend**: Use the endpoint paths as documented in this checklist. The `/project/admin/*` routes will be renamed to `/project/owner/*` in a future update.

### Internal Endpoints (Not for Frontend Use)

These endpoints exist in the codebase but are **internal only** (used by TX State Machine):
- `/course/owner/course/mint` - Use TX endpoint instead
- `/course/owner/course/confirm-mint` - Auto-handled by state machine
- `/course/teacher/course-module/confirm-tx` - Auto-handled
- `/course/teacher/course-module/set-pending-tx` - Auto-handled
- `/project/admin/project/confirm-tx` - Auto-handled
- `/project/admin/project/sync` - Internal sync
- `/project/admin/managers/sync` - Internal sync
- `/project/manager/task/confirm-tx` - Auto-handled
- `/project/contributor/commitment/confirm-tx` - Auto-handled

---

## Timeline (COMPLETED)

1. ✅ **2026-01-17**: Review this checklist, plan integration changes
2. ✅ **2026-01-17**: V2 API deployed to preprod
3. ✅ **2026-01-17/18**: Implement integration changes (Session 16)
4. ✅ **2026-01-18**: Migration complete on `update/andamioscan` branch
5. 🔄 **Next**: Test all routes, merge to main

---

## Next Steps

1. ✅ Fix remaining TypeScript errors (Session 17)
2. Test all course and project routes with the gateway
3. Verify authentication flows (login, register, session restore)
4. Test transaction flows end-to-end
5. Merge `update/andamioscan` branch to `main`

---

## Session 17 Post-Migration Fixes (January 18, 2026)

Resolved remaining import errors after V2 migration:

| Component | Issue | Fix |
|-----------|-------|-----|
| `PendingReviewsList` | Used non-existent `usePendingAssessments` hook | Changed to `useTeacherCommitments` |
| `ProjectCommitmentsPage` | Used non-existent `useManagerPendingAssessments` hook | Changed to `useManagerCommitments` |
| `CoursePrereqsSelector` | Used non-existent `useTeachableCoursesWithDetails` hook | Changed to `useTeacherCoursesWithModules` |

**Pattern Applied**: Components now use auth context internally via hooks instead of accepting `userAlias` or `accessTokenAlias` props.
