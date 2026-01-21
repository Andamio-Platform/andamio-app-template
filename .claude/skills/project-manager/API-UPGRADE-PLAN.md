# API Upgrade Plan: Gateway URL Migration

> **Generated**: January 21, 2026
> **Based on**: `/audit-api-coverage` findings from new gateway URL
> **Current Coverage**: 63% (68/108 endpoints)

---

## Executive Summary

The new Andamio API Gateway has been deployed at:
- **URL**: `https://andamio-api-gateway-666713068234.us-central1.run.app`
- **Total Endpoints**: 108
- **Currently Implemented**: 68 (63%)
- **Missing**: 40 endpoints

### Coverage by Category

| Category | Coverage | Endpoints | Priority |
|----------|----------|-----------|----------|
| TX: Courses | **100%** | 6/6 | ✅ Complete |
| TX: Projects | **100%** | 8/8 | ✅ Complete |
| Merged Projects | **85%** | 17/20 | Low |
| Auth | **83%** | 5/6 | Low |
| TX: Instance/Global | **71%** | 5/7 | Medium |
| Merged Courses | **55%** | 23/42 | **High** |
| API Key Management | **33%** | 3/9 | Medium |
| User Management | **17%** | 1/6 | Medium |
| Admin Functions | **0%** | 0/4 | Low (admin-only) |

---

## Phase 1: Critical Path Updates (Immediate)

### 1.1 Update Gateway URL in Environment

**Status**: ✅ Complete (done in previous session)

All `.claude/skills/` documentation updated to reference new gateway URL.

### 1.2 Verify Proxy Route Compatibility

**Files to check**:
- `src/app/api/gateway/[...path]/route.ts`

**Potential Issue**: Path structure changed from `/api/v2/*` to `/v2/*`

The proxy currently forwards to:
```typescript
`${GATEWAY_URL}${path}`
```

If the frontend is calling `/api/gateway/api/v2/...` but the gateway expects `/v2/...`, requests will fail.

**Action Required**:
1. Check current proxy implementation
2. Verify path forwarding matches new gateway structure
3. Test a sample endpoint (e.g., course list)

### 1.3 Regenerate Types

```bash
npm run generate:types
```

This will fetch the latest OpenAPI spec from the new gateway and update:
- `src/types/generated/gateway.ts`
- `src/types/generated/index.ts`

---

## Phase 2: High-Priority Course Endpoints (19 missing)

The Course system has the most missing endpoints at 55% coverage (23/42).

### Student Commitment Endpoints (7 missing)

These are needed for the full student assignment flow:

| Endpoint | Purpose | Component Location |
|----------|---------|-------------------|
| `POST /v2/course/student/commitment/create` | Create assignment commitment | `assignment-commitment.tsx` |
| `POST /v2/course/student/commitment/submit` | Submit evidence | `assignment-commitment.tsx` |
| `POST /v2/course/student/commitment/update` | Update evidence | `assignment-commitment.tsx` |
| `POST /v2/course/student/commitment/leave` | Withdraw from assignment | `assignment-commitment.tsx` |
| `POST /v2/course/student/commitment/claim` | Claim credential | `credential-claim.tsx` |
| `POST /v2/course/student/assignment-commitments/list` | List my commitments | Dashboard |
| `POST /v2/course/shared/commitment/get` | Get commitment details | Shared |

**Implementation Notes**:
- These may already be implemented under different patterns (direct fetch vs hooks)
- Check if functionality exists but wasn't detected by audit script
- Consider creating `src/hooks/api/use-assignment-commitment.ts`

### Teacher Endpoints (6 missing)

| Endpoint | Purpose | Priority |
|----------|---------|----------|
| `POST /v2/course/teacher/assignment-commitment/review` | Review student work | High |
| `POST /v2/course/teacher/course-modules/list` | List modules (teacher view) | Medium |
| `POST /v2/course/teacher/course-module/publish` | Publish module | Medium |
| `POST /v2/course/teacher/assignment/delete` | Delete assignment | Low |
| `POST /v2/course/teacher/introduction/delete` | Delete intro | Low |
| `POST /v2/course/teacher/lesson/delete` | Delete lesson | Low |
| `POST /v2/course/teacher/slt/reorder` | Reorder SLTs | Low |

### Owner Endpoints (2 missing)

| Endpoint | Purpose | Priority |
|----------|---------|----------|
| `POST /v2/course/owner/teacher/add` | Add teacher to course | High |
| `POST /v2/course/owner/teacher/remove` | Remove teacher | Medium |

### Public User Endpoints (4 missing)

| Endpoint | Purpose | Priority |
|----------|---------|----------|
| `GET /v2/course/user/assignment/{course_id}/{module_code}` | Get assignment details | Medium |
| `GET /v2/course/user/lesson/{course_id}/{module_code}/{slt_index}` | Get lesson | Medium |
| `GET /v2/course/user/slts/{course_id}/{module_code}` | Get SLTs | Medium |

---

## Phase 3: Project Contributor Endpoints (3 missing)

Projects are at 85% coverage (17/20). Missing:

| Endpoint | Purpose | Priority |
|----------|---------|----------|
| `POST /v2/project/contributor/commitment/delete` | Cancel commitment | Medium |
| `POST /v2/project/contributor/commitment/update` | Update commitment | Medium |
| `POST /v2/project/contributor/commitments/list` | List my commitments | Medium |

---

## Phase 4: User & API Key Management (11 missing)

### User Management (5 missing)

| Endpoint | Purpose | Priority |
|----------|---------|----------|
| `GET /v1/user/me` | Get current user profile | High |
| `GET /v1/user/usage` | View API usage | Medium |
| `POST /v1/user/usage/daily` | Daily usage breakdown | Low |
| `POST /v1/user/delete` | Delete account | Low |
| `POST /v2/user/init-roles` | Initialize user roles | Medium |

### API Key Management (6 missing - v2 Developer API)

| Endpoint | Purpose | Priority |
|----------|---------|----------|
| `GET /v2/apikey/developer/profile/get` | Get developer profile | Medium |
| `GET /v2/apikey/developer/usage/get` | Get API key usage | Medium |
| `POST /v2/apikey/developer/key/request` | Request new key | Medium |
| `POST /v2/apikey/developer/key/rotate` | Rotate key | Medium |
| `POST /v2/apikey/developer/key/delete` | Delete key | Low |
| `POST /v2/apikey/developer/account/delete` | Delete dev account | Low |

**Note**: These v2 developer endpoints may be for a new developer portal feature.

---

## Phase 5: TX & Admin Endpoints (6 missing)

### TX Instance/Global (2 missing)

| Endpoint | Purpose | Priority |
|----------|---------|----------|
| `GET /v2/tx/pending` | List pending transactions | Medium |
| `GET /v2/tx/types` | List available TX types | Low |

### Admin Functions (4 missing)

| Endpoint | Purpose | Priority |
|----------|---------|----------|
| `POST /v1/admin/set-user-role` | Set user role | Admin-only |
| `POST /v1/admin/usage/user-api-usage` | View user usage | Admin-only |
| `POST /v1/admin/usage/any-user-daily-api-usage` | Daily usage any user | Admin-only |
| `GET /v2/admin/tx/stats` | TX statistics | Admin-only |

**Note**: Admin endpoints are low priority for the T3 template as they're typically handled in a separate admin panel.

---

## Implementation Recommendations

### Immediate Actions (This Week)

1. **Verify proxy compatibility** with new gateway path structure
2. **Regenerate types** from new OpenAPI spec
3. **Test core flows**:
   - Authentication (login, register)
   - Course creation
   - Module management
   - Assignment commitment

### Short-term (Next 2 Weeks)

1. **Implement student commitment hooks** (`use-assignment-commitment.ts`)
   - `create`, `submit`, `update`, `leave`, `claim`
2. **Add teacher review endpoint** for instructor dashboard
3. **Add teacher management endpoints** (add/remove teacher)

### Medium-term (Before Mainnet)

1. **User profile endpoint** (`/v1/user/me`)
2. **Usage tracking endpoints** (for analytics)
3. **Pending TX list endpoint** (for TX dashboard)

### Deferred (Post-Mainnet)

1. Developer API key management (new feature)
2. Admin endpoints (separate admin panel)

---

## Testing Checklist

After implementing changes:

- [ ] Authentication flows (login/logout/register)
- [ ] Course CRUD operations
- [ ] Module CRUD operations
- [ ] SLT CRUD operations
- [ ] Lesson CRUD operations
- [ ] Assignment commitment flow (student)
- [ ] Assignment review flow (teacher)
- [ ] Project CRUD operations
- [ ] Task commitment flow (contributor)
- [ ] Task assessment flow (manager)
- [ ] All 17 transaction types build successfully

---

## Files Likely to Require Updates

Based on path structure changes (`/api/v2/*` → `/v2/*`):

### Proxy Route
- `src/app/api/gateway/[...path]/route.ts`

### Auth
- `src/lib/andamio-auth.ts`
- `src/contexts/andamio-auth-context.tsx`

### API Hooks
- `src/hooks/api/use-course.ts`
- `src/hooks/api/use-course-module.ts`
- `src/hooks/api/use-slt.ts`
- `src/hooks/api/use-lesson.ts`
- `src/hooks/api/use-project.ts`
- `src/hooks/api/use-contributor-projects.ts`
- `src/hooks/api/use-manager-projects.ts`
- `src/hooks/api/use-student-courses.ts`
- `src/hooks/api/use-teacher-courses.ts`

### Transaction Config
- `src/config/transaction-ui.ts`
- `src/hooks/use-tx-watcher.ts`

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Overall Coverage | 63% | 75%+ |
| Course Coverage | 55% | 80%+ |
| Project Coverage | 85% | 90%+ |
| Critical Flows | TBD | All passing |

---

## Related Documents

- `COVERAGE-REPORT.md` - Detailed endpoint-by-endpoint status
- `coverage-report.json` - Machine-readable coverage data
- `unified-api-endpoints.md` - Complete endpoint reference
- `STATUS.md` - Project status and session notes
