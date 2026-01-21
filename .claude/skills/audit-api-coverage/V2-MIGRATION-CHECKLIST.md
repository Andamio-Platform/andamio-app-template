# V2 Gateway API Migration Checklist

**Created**: 2026-01-17
**Status**: ✅ COMPLETE (January 17, 2026)
**Purpose**: Historical record of V2 Gateway migration changes

---

## Migration Summary

The V2 Gateway API migration has been completed. All API calls now flow through the unified gateway proxy at `/api/gateway/`.

### What Was Done

| Task | Status |
|------|--------|
| Created unified gateway proxy | ✅ `/api/gateway/[...path]/route.ts` |
| Created gateway client | ✅ `src/lib/gateway.ts` |
| Removed old proxy routes | ✅ `/api/andamioscan/`, `/api/atlas-tx/` |
| Removed `NEXT_PUBLIC_ANDAMIO_API_URL` | ✅ Env var removed |
| Migrated auth to v2 | ✅ All auth endpoints use `/api/v2/auth/` |
| Generated types from OpenAPI | ✅ `src/types/generated/` |
| Removed `@andamio/db-api-types` | ✅ NPM dependency removed |
| Updated 50+ files | ✅ All use gateway proxy |

---

## Historical Stats (Pre-Migration)

| Category | Count |
|----------|-------|
| Files using legacy DB API (`NEXT_PUBLIC_ANDAMIO_API_URL`) | 62 → **0** |
| Files using `/course/owner/` (correct - stayed `owner`) | 21 |
| Files using `/project-v2/` → `/project/` | 31 |
| Files importing from `andamioscan.ts` | 21 |
| Files using `authenticatedFetch` | 48 |
| Pages with `useEffect` patterns | 21 |
| Proxy routes consolidated | 2 → 1 |
| API client files consolidated | 3 → 1 |

---

## Part 1: Infrastructure Changes

### 1.1 Create Single Gateway Proxy

**Action**: Create unified proxy route, consolidate existing routes

| Current | New | Status |
|---------|-----|--------|
| `/api/andamioscan/[...path]/route.ts` | `/api/gateway/[...path]/route.ts` | ⬜ Create |
| `/api/atlas-tx/[...path]/route.ts` | (merge into gateway) | ⬜ Remove |
| `/api/koios/[...path]/route.ts` | (keep for now) | — |

**File to create**: `src/app/api/gateway/[...path]/route.ts`
- Forward all requests to `NEXT_PUBLIC_ANDAMIO_GATEWAY_URL`
- Include `X-API-Key` header from `ANDAMIO_API_KEY`
- Support GET and POST methods
- Include caching for GET requests

### 1.2 Configure QueryClient Defaults

**File**: `src/app/providers.tsx` (or wherever QueryClient is configured)

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // 5 min default
      gcTime: 1000 * 60 * 30,         // 30 min garbage collection
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

### 1.3 Create Gateway Client Utility

**File to create**: `src/lib/gateway.ts`

```typescript
// Single client for all gateway calls
export async function gateway<T>(path: string, options?: RequestInit): Promise<T>;
export async function gatewayAuth<T>(path: string, jwt: string, options?: RequestInit): Promise<T>;
```

---

## Part 2: Endpoint Renames

### 2.1 Role Name: Course System Uses `owner` (No Change)

**Note**: Course system already uses `/course/owner/` - this is CORRECT and does not change.

| File | Status |
|------|--------|
| `src/contexts/andamio-auth-context.tsx` | ✅ Already uses `/course/owner/` |
| `src/hooks/api/use-course.ts` | ✅ Already uses `/course/owner/` |
| `src/hooks/use-owned-courses.ts` | ✅ Already uses `/course/owner/` |
| `src/app/(studio)/studio/course/page.tsx` | ⚠️ Update `/course/owner/course/mint` → `/course/owner/course/register` |
| `src/components/studio/course-teachers-card.tsx` | ✅ Already uses `/course/owner/` |
| `src/components/courses/on-chain-courses-section.tsx` | ✅ Already uses `/course/owner/` |
| `src/components/auth/require-course-access.tsx` | ✅ Already uses `/course/owner/` |
| `src/components/transactions/teachers-update.tsx` | ✅ Already uses `/course/owner/` |

**Note**: The only change is the endpoint name `mint` → `register`, not the role.

### 2.2 List Endpoint Renames

| Old Endpoint | New Endpoint | Files Affected |
|--------------|--------------|----------------|
| `/course/teacher/assignment-commitments/list-by-course` | `/course/teacher/assignment-commitments/list` | `src/app/(app)/studio/course/[coursenft]/instructor/page.tsx` |
| `/course/student/assignment-commitments/list-by-course` | `/course/student/assignment-commitments/list` | (check for usage) |
| `/course/teacher/slt/update-index` | `/course/teacher/slt/reorder` | (check for usage) |
| `/course/teacher/slts/batch-update-indexes` | `/course/teacher/slts/batch-reorder` | `src/components/studio/wizard/steps/step-slts.tsx` |

### 2.3 Project Role Name Change: `admin` → `owner`

**Pattern**: `/project/admin/` → `/project/owner/`

This aligns Project with Course (which already uses `owner`). The `owner` role represents the entity that created and controls the instance.

| File | Current | New |
|------|---------|-----|
| `src/app/(app)/studio/project/page.tsx` | `/project-v2/admin/project/register` | `/project/owner/project/register` |
| Any `/project/admin/*` endpoints | `/project/admin/*` | `/project/owner/*` |

### 2.4 Project Path Standardization

**Pattern**: `/project-v2/` → `/project/`

| File | Current Pattern |
|------|-----------------|
| `src/lib/project-task-sync.ts` | `/project-v2/` |
| `src/lib/project-commitment-sync.ts` | `/project-v2/` |
| `src/app/(app)/studio/project/page.tsx` | `/project-v2/owner/project/register` |
| `src/app/(app)/studio/project/[projectid]/page.tsx` | `/project-v2/` |
| `src/app/(app)/studio/project/[projectid]/manager/page.tsx` | `/project-v2/` |
| `src/app/(app)/studio/project/[projectid]/draft-tasks/page.tsx` | `/project-v2/` |
| `src/app/(app)/studio/project/[projectid]/draft-tasks/new/page.tsx` | `/project-v2/` |
| `src/app/(app)/studio/project/[projectid]/draft-tasks/[taskindex]/page.tsx` | `/project-v2/` |
| `src/app/(app)/studio/project/[projectid]/commitments/page.tsx` | `/project-v2/` |
| `src/app/(app)/studio/project/[projectid]/manage-treasury/page.tsx` | `/project-v2/` |
| `src/app/(app)/project/[projectid]/contributor/page.tsx` | `/project-v2/` |
| `src/components/studio/project-managers-card.tsx` | `/project-v2/` |
| `src/components/transactions/task-commit.tsx` | `/project-v2/` |
| `src/components/transactions/task-action.tsx` | `/project-v2/` |
| `src/components/transactions/tasks-assess.tsx` | `/project-v2/` |

**Total**: ~31 files

---

## Part 3: Payload Field Changes

### 3.1 Course Register Payload

**Endpoint**: `POST /api/v2/course/owner/course/register`

| Old Field | New Field |
|-----------|-----------|
| `course_nft_policy_id` | `policy_id` |
| `title` | `title` (unchanged) |

**Files**:
- `src/app/(studio)/studio/course/page.tsx` (RegisterCourseDrawer)

### 3.2 Project Register Payload

**Endpoint**: `POST /api/v2/project/owner/project/register`

| Old Field | New Field |
|-----------|-----------|
| `project_id` | `policy_id` |
| `title` | `title` (unchanged) |

**Files**:
- `src/app/(app)/studio/project/page.tsx` (RegisterProjectDrawer)

---

## Part 4: Removed Endpoints

These endpoints are being removed. Code must be updated to use list + filter pattern.

### 4.1 Course Module Get (Removed)

**Old**: `GET /course/user/course-module/get/{policy_id}/{module_code}`
**New**: Use `GET /course/user/course-modules/list/{policy_id}` + filter client-side

| File | Line | Notes |
|------|------|-------|
| `src/hooks/api/use-course-module.ts` | 108-110 | `useCourseModule` hook |
| `src/hooks/use-module-wizard-data.ts` | 114-116 | Module wizard data fetch |
| `src/components/studio/wizard/module-wizard.tsx` | 149-151 | Module status refetch |
| `src/app/(app)/course/[coursenft]/[modulecode]/assignment/page.tsx` | 89-91 | Assignment page module fetch |

### 4.2 SLT Get (Removed)

**Old**: `GET /course/user/slt/get/{policy_id}/{module_code}/{index}`
**New**: Use `GET /course/user/slts/list/{policy_id}/{module_code}` + filter client-side

**Files**: (search for usage)

### 4.3 Task Get (Removed)

**Old**: `GET /project/user/task/get/{task_hash}`
**New**: Use `POST /project/user/tasks/list` + filter client-side

**Files**: (search for usage)

### 4.4 Project State (Removed)

**Old**: `GET /project/user/project-state/{project_state_policy_id}`
**New**: Data now included in `/projects/list` and `/project/get` responses

**Files**: (search for usage)

### 4.5 Assignment Summary (Removed)

**Old**: `GET /course/user/modules/assignment-summary/{policy_id}`
**New**: Use `/course/get` for counts

**Files**: (search for usage)

---

## Part 5: Method Changes (GET → POST)

### 5.1 Project Tasks List

**Old**: `GET /project/user/tasks/{project_state_policy_id}`
**New**: `POST /project/user/tasks/list` with `{project_id}` in body

**Old**: `GET /project/manager/tasks/{project_state_policy_id}`
**New**: `POST /project/manager/tasks/list` with `{project_id}` in body

**Files**: (search for usage)

---

## Part 6: API Client Consolidation

### 6.1 Files to Remove/Consolidate

| File | Action | Notes |
|------|--------|-------|
| `src/lib/andamioscan.ts` | **Remove** | Direct Andamioscan calls → use gateway |
| `src/lib/andamio-gateway.ts` | **Keep/Update** | Update to use new proxy |
| `src/lib/andamio-auth.ts` | **Update** | Update endpoints |

### 6.2 Files Importing `andamioscan.ts` (21 files)

All these need to be updated to use gateway client or react-query hooks:

| File | Current Import |
|------|----------------|
| `src/lib/project-task-sync.ts` | `~/lib/andamioscan` |
| `src/lib/project-eligibility.ts` | `~/lib/andamioscan` |
| `src/lib/project-commitment-sync.ts` | `~/lib/andamioscan` |
| `src/hooks/use-hybrid-slts.ts` | `~/lib/andamioscan` |
| `src/hooks/use-event-confirmation.ts` | `~/lib/andamioscan` |
| `src/hooks/use-andamioscan.ts` | `~/lib/andamioscan` |
| `src/hooks/api/use-andamioscan.ts` | `~/lib/andamioscan` |
| `src/app/(app)/studio/project/[projectid]/manage-treasury/page.tsx` | `~/lib/andamioscan` |
| `src/app/(app)/studio/project/[projectid]/commitments/page.tsx` | `~/lib/andamioscan` |
| `src/app/(app)/studio/project/[projectid]/page.tsx` | `~/lib/andamioscan` |
| `src/app/(app)/studio/project/[projectid]/draft-tasks/page.tsx` | `~/lib/andamioscan` |
| `src/app/(app)/project/[projectid]/contributor/page.tsx` | `~/lib/andamioscan` |
| `src/app/(app)/project/[projectid]/page.tsx` | `~/lib/andamioscan` |
| `src/app/(app)/project/[projectid]/[taskhash]/page.tsx` | `~/lib/andamioscan` |
| `src/app/(app)/course/[coursenft]/[modulecode]/assignment/page.tsx` | `~/lib/andamioscan` |
| `src/app/(studio)/studio/course/[coursenft]/page.tsx` | `~/lib/andamioscan` |
| `src/components/learner/my-learning.tsx` | `~/lib/andamioscan` |
| `src/components/instructor/pending-reviews-list.tsx` | `~/lib/andamioscan` |
| `src/components/courses/slt-lesson-table.tsx` | `~/lib/andamioscan` |
| `src/components/courses/on-chain-slts-viewer.tsx` | `~/lib/andamioscan` |

---

## Part 7: React Query Migration

### 7.1 Pages Using `useEffect` + `useState` Pattern (Need react-query)

These pages fetch data with useEffect and should migrate to react-query hooks:

| Page | Priority |
|------|----------|
| `src/app/(app)/studio/project/page.tsx` | High |
| `src/app/(app)/studio/project/[projectid]/page.tsx` | High |
| `src/app/(app)/studio/project/[projectid]/manager/page.tsx` | High |
| `src/app/(app)/studio/project/[projectid]/draft-tasks/page.tsx` | High |
| `src/app/(app)/studio/project/[projectid]/draft-tasks/new/page.tsx` | Medium |
| `src/app/(app)/studio/project/[projectid]/draft-tasks/[taskindex]/page.tsx` | Medium |
| `src/app/(app)/studio/project/[projectid]/commitments/page.tsx` | Medium |
| `src/app/(app)/studio/project/[projectid]/manage-treasury/page.tsx` | Low |
| `src/app/(app)/project/page.tsx` | High |
| `src/app/(app)/project/[projectid]/page.tsx` | High |
| `src/app/(app)/project/[projectid]/contributor/page.tsx` | High |
| `src/app/(app)/project/[projectid]/[taskhash]/page.tsx` | High |
| `src/app/(app)/studio/course/[coursenft]/instructor/page.tsx` | High |
| `src/app/(app)/course/[coursenft]/[modulecode]/assignment/page.tsx` | High |
| `src/app/(studio)/studio/course/page.tsx` | Medium |
| `src/app/(studio)/studio/course/[coursenft]/page.tsx` | Medium |
| `src/app/(studio)/studio/course/[coursenft]/[modulecode]/page.tsx` | Medium |
| `src/app/(app)/sitemap/page.tsx` | Low |
| `src/app/(app)/api-setup/page.tsx` | Low |

### 7.2 Hooks to Create

| Hook | Endpoint | Priority |
|------|----------|----------|
| `useProjects` | `GET /api/v2/project/user/projects/list` | High |
| `useProject` | `GET /api/v2/project/user/project/get/{id}` | High |
| `useProjectTasks` | `POST /api/v2/project/user/tasks/list` | High |
| `useOwnerCourses` | `POST /api/v2/course/owner/courses/list` | High |
| `useOwnerProjects` | `POST /api/v2/project/owner/projects/list` | High |
| `useAssignmentCommitments` | `POST /api/v2/course/teacher/assignment-commitments/list` | High |
| `useStudentCommitments` | `POST /api/v2/course/student/assignment-commitments/list` | Medium |

---

## Part 8: Transaction Definitions

### 8.1 Side Effect Endpoint Updates

Transaction definitions with side effects that call legacy endpoints need updating:

| Definition | Current Side Effect | New Side Effect |
|------------|--------------------|-----------------|
| `INSTANCE_COURSE_CREATE` | `/course/owner/*` | `/course/owner/*` (no change) |
| `INSTANCE_PROJECT_CREATE` | `/project/admin/*` | `/project/owner/*` |
| Various project transactions | `/project/admin/*` | `/project/owner/*` |

**Note**: Course system keeps `owner`. Only Project system changes from `admin` → `owner`.

**Files in** `packages/andamio-transactions/src/definitions/v2/`:
- `instance/project-create.ts` - Update admin → owner
- `project/admin/*.ts` - Rename to `project/owner/*.ts`
- `course/owner/teachers-manage.ts` - No change needed
- `course/teacher/*.ts` - No change needed
- `course/student/*.ts` - No change needed

---

## Part 9: Proxy Routes to Remove

After consolidation:

| Route | Action |
|-------|--------|
| `src/app/api/andamioscan/[...path]/route.ts` | Rename to `/api/gateway/` |
| `src/app/api/atlas-tx/[...path]/route.ts` | **Remove** (merge into gateway) |

---

## Part 10: Environment Variables

### 10.1 Variables to Keep

```bash
NEXT_PUBLIC_ANDAMIO_GATEWAY_URL="https://andamio-api-gateway-701452636305.us-central1.run.app"
ANDAMIO_API_KEY="your-api-key"
NEXT_PUBLIC_CARDANO_NETWORK="preprod"
NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID="..."
```

### 10.2 Variables to Remove

```bash
# Remove - all traffic goes through gateway
NEXT_PUBLIC_ANDAMIO_API_URL="..."  # Legacy DB API - remove after migration
```

---

## Implementation Order

### Phase 1: Infrastructure (Do First)
1. ✅ Create `/api/gateway/[...path]/route.ts`
2. ✅ Configure QueryClient defaults
3. ✅ Create `src/lib/gateway.ts` client
4. ✅ Set up type generation from OpenAPI spec
5. ✅ Replace `@andamio/db-api-types` with generated types

### Phase 2: Endpoint Updates (Bulk Update)
4. ✅ Update all `/project/admin/` → `/project/owner/` (Course already uses `owner`)
5. ✅ Update all `/project-v2/` → `/project/`
6. ✅ Update list endpoint names (`list-by-course` → `list`)
7. ✅ Update payload field names (`course_nft_policy_id` → `course_id`)

### Phase 3: Removed Endpoints
8. ⬜ Replace `/course/user/course-module/get/` with list + filter
9. ⬜ Replace other removed endpoints with alternatives

### Phase 4: React Query Migration
10. ⬜ Create new hooks for gateway endpoints
11. ⬜ Migrate high-priority pages to react-query
12. ⬜ Migrate remaining pages

### Phase 5: Cleanup
13. ⏳ Keep `src/lib/andamioscan.ts` (uses gateway proxy, still useful)
14. ✅ Remove `/api/atlas-tx/` proxy route
15. ✅ Remove `/api/andamioscan/` proxy route (replaced by `/api/gateway/`)
16. ⏳ `NEXT_PUBLIC_ANDAMIO_API_URL` still used during migration
17. ✅ Update documentation (CLAUDE.md)

---

## Verification Checklist

After migration, verify:

- [ ] All pages load without errors
- [ ] Authentication flow works
- [ ] Course CRUD operations work
- [ ] Project CRUD operations work
- [ ] Transaction submissions work
- [ ] On-chain data displays correctly
- [ ] Cache invalidation works after mutations
- [ ] No console errors related to API calls
- [ ] Build completes without type errors

---

## Related Documents

- `API-REFINEMENT-SESSION.md` - V2 API change details
- `unified-api-endpoints.md` - All 92 gateway endpoints
- `../project-manager/STATUS.md` - Migration section
- `../project-manager/ROADMAP.md` - Phase 3.5

---

*Last updated: 2026-01-17*
