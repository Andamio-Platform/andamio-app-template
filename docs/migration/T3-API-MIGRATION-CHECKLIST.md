# T3 App Template - API Migration Checklist

> **Migration from plural to singular endpoint paths**
> Created: 2025-12-15
> DB API Version: 0.5.0
> **Status: ✅ COMPLETED**

This checklist documents all API endpoint updates required in the T3 App Template to align with the new singular path convention in `andamio-db-api`.

---

## Path Mapping Reference

### Course System (Ready to Migrate)

| Old Path (Plural) | New Path (Singular) | Status |
|-------------------|---------------------|--------|
| `/courses/published` | `/course/published` | ✅ |
| `/courses/owned` | `/course/list` | ✅ |
| `/courses/get` | `/course/get` | ✅ |
| `/courses/create-on-submit` | `/course/create-on-submit-minting-tx` | ✅ |
| `/courses/update` | `/course/update` | ✅ |
| `/courses/delete` | `/course/delete` | ✅ |
| `/courses/unpublished-projects` | `/course/unpublished-projects` | ✅ |
| `/course-modules/list` | `/course-module/list` | ✅ |
| `/course-modules/list-by-courses` | `/course-module/map` | ✅ |
| `/course-modules/get` | `/course-module/get` | ✅ |
| `/course-modules/create` | `/course-module/create` | ✅ |
| `/course-modules/update` | `/course-module/update` | ✅ |
| `/course-modules/update-status` | `/course-module/update-status` | ✅ |
| `/course-modules/update-code` | ❌ REMOVED | ✅ (disabled with message) |
| `/course-modules/set-pending-tx` | ❌ REMOVED | ✅ (disabled with message) |
| `/course-modules/publish` | ❌ REMOVED | ✅ (disabled with message) |
| `/course-modules/delete` | `/course-module/delete` | ✅ |
| `/course-modules/confirm-transaction` | `/course-module/confirm-transaction` | ✅ |
| `/course-modules/assignment-summary` | `/course-module/with-assignments` | ✅ |
| `/slts/list` | `/slt/list` | ✅ |
| `/slts/get` | `/slt/get` | ✅ |
| `/slts/create` | `/slt/create` | ✅ |
| `/slts/update` | `/slt/update` | ✅ |
| `/slts/delete` | `/slt/delete` | ✅ |
| `/slts/batch-update-indexes` | `/slt/reorder` | ✅ |
| `/lessons/list` | `/lesson/list` | ✅ |
| `/lessons/get` | `/lesson/get` | ✅ |
| `/lessons/create` | `/lesson/create` | ✅ |
| `/lessons/update` | `/lesson/update` | ✅ |
| `/lessons/delete` | `/lesson/delete` | ✅ |
| `/introductions/get` | `/introduction/get` | ✅ |
| `/introductions/create` | `/introduction/create` | ✅ |
| `/introductions/update` | `/introduction/update` | ✅ |
| `/introductions/publish` | `/introduction/publish` | ✅ |
| `/assignments/get` | `/assignment/get` | ✅ |
| `/assignments/create` | `/assignment/create` | ✅ |
| `/assignments/update` | `/assignment/update` | ✅ |
| `/assignments/delete` | `/assignment/delete` | ✅ |
| `/assignments/publish` | `/assignment/publish` | ✅ |
| `/assignment-commitments/list-learner-by-course` | `/assignment-commitment/list` | ✅ |
| `/assignment-commitments/list-by-course` | `/assignment-commitment/by-course` | ✅ |
| `/assignment-commitments/update-evidence` | `/assignment-commitment/update-evidence` | ✅ |
| `/assignment-commitments/delete` | `/assignment-commitment/delete` | ✅ |
| `/assignment-commitments/confirm-transaction` | `/assignment-commitment/update-status` | ✅ |
| `/user-course-status/get` | `/credential/list` | ✅ |

### App System (Ready to Migrate)

| Old Path (Plural) | New Path (Singular) | Status |
|-------------------|---------------------|--------|
| `/user/update-alias` | `/access-token/update-alias` | ✅ |
| `/user/update-unconfirmed-tx` | `/access-token/update-unconfirmed-tx` | ✅ |
| `/pending-transactions` | `/transaction/pending-transactions` | ✅ |
| `/creator/create` | `/creator/create` | ✅ (unchanged) |
| `/learner/create` | `/learner/create` | ✅ (unchanged) |
| `/learner/my-learning` | `/my-learning/get` | ✅ |

### Project System (NOT YET MIGRATED IN DB API)

These paths still use plural naming in the DB API and should NOT be changed yet:

| Current Path | Future Path (When DB API migrates) |
|--------------|-----------------------------------|
| `/projects/list` | `/project/list` |
| `/projects/list-owned` | `/project/owned` |
| `/projects/update` | `/project/update` |
| `/tasks/list` | `/task/list` |
| `/tasks/create` | `/task/create` |
| `/tasks/update` | `/task/update` |
| `/tasks/delete` | `/task/delete` |
| `/task-commitments/get` | `/contributor/task-commitment` |

---

## Files Updated

### Hooks (6 files) ✅

#### `src/hooks/use-andamio-transaction.ts`
- [x] Line 124: `/user/update-unconfirmed-tx` → `/access-token/update-unconfirmed-tx`

#### `src/hooks/use-pending-tx-watcher.ts`
- [x] Line 165: `/course-modules/confirm-transaction` → `/course-module/confirm-transaction`
- [x] Line 207: `/assignment-commitments/confirm-transaction` → `/assignment-commitment/update-status`
- [x] Line 267: `/user/update-unconfirmed-tx` → `/access-token/update-unconfirmed-tx`
- [x] Line 392: `/pending-transactions` → `/transaction/pending-transactions`

#### `src/hooks/use-hybrid-slts.ts`
- [x] Line 171: `/slts/list` → `/slt/list`
- [x] Line 343: `/course-modules/list` → `/course-module/list`

#### `src/hooks/use-owned-courses.ts`
- [x] Line 72: `/courses/owned` → `/course/list`
- [x] Line 93: `/course-modules/list-by-courses` → `/course-module/map`

#### `src/hooks/use-pending-transactions.ts`
- [x] Line 46: `/pending-transactions` → `/transaction/pending-transactions`

#### `src/hooks/use-andamio-fetch.ts`
- [x] Updated doc examples (lines 13, 18, 24, 38, 98, 114, 348)

### Contexts (1 file) ✅

#### `src/contexts/andamio-auth-context.tsx`
- [x] Line 57: `/user/update-alias` → `/access-token/update-alias`
- [x] Line 97: `/creator/create` - NO CHANGE (same path)
- [x] Line 117: `/learner/create` - NO CHANGE (same path)

### Components (8 files) ✅

#### `src/components/courses/on-chain-modules-section.tsx`
- [x] Line 111: `/course-modules/create` → `/course-module/create`
- [x] Line 132: `/slts/create` → `/slt/create`
- [x] Line 448: `/course-modules/list` → `/course-module/list`

#### `src/components/courses/on-chain-courses-section.tsx`
- [x] Line 100: `/courses/owned` → `/course/list`
- [x] Line 420: `/courses/create-on-submit` → `/course/create-on-submit-minting-tx`

#### `src/components/courses/hybrid-slt-status.tsx`
- [x] Line 149: `/slts/create` → `/slt/create`

#### `src/components/courses/create-module-dialog.tsx`
- [x] Line 86: `/course-modules/create` → `/course-module/create`

#### `src/components/learner/user-course-status.tsx`
- [x] Line 78: `/user-course-status/get` → `/credential/list`
- [x] Line 113: `/user-course-status/get` → `/credential/list`

#### `src/components/learner/assignment-commitment.tsx`
- [x] Line 165: `/assignment-commitments/list-learner-by-course` → `/assignment-commitment/list`
- [x] Line 263: `/assignment-commitments/update-evidence` → `/assignment-commitment/update-evidence`
- [x] Line 302: `/assignment-commitments/delete` → `/assignment-commitment/delete`

#### `src/components/learner/my-learning.tsx`
- [x] Line 47: `/learner/my-learning` → `/my-learning/get` (log message)
- [x] Line 51: `/learner/my-learning` → `/my-learning/get`

#### `src/components/transactions/mint-access-token.tsx`
- [x] Line 74: `/user/update-alias` → `/access-token/update-alias`

### Pages - Public Course (5 files) ✅

#### `src/app/(app)/course/page.tsx`
- [x] Line 31: `/courses/published` → `/course/published`

#### `src/app/(app)/course/[coursenft]/page.tsx`
- [x] Line 48: `/courses/get` → `/course/get`
- [x] Line 62: `/courses/get` → `/course/get` (error message)
- [x] Line 72: `/course-modules/list` → `/course-module/list`
- [x] Line 86: `/course-modules/list` → `/course-module/list` (error message)

#### `src/app/(app)/course/[coursenft]/[modulecode]/page.tsx`
- [x] Line 190: `/courses/get` → `/course/get`
- [x] Line 205: `/course-modules/get` → `/course-module/get`
- [x] Line 225: `/slts/list` → `/slt/list`
- [x] Line 244: `/lessons/list` → `/lesson/list`

#### `src/app/(app)/course/[coursenft]/[modulecode]/[moduleindex]/page.tsx`
- [x] Line 48: `/courses/get` → `/course/get`
- [x] Line 63: `/course-modules/get` → `/course-module/get`
- [x] Line 81: `/lessons/get` → `/lesson/get`

#### `src/app/(app)/course/[coursenft]/[modulecode]/assignment/page.tsx`
- [x] Line 67: `/courses/get` → `/course/get`
- [x] Line 82: `/course-modules/get` → `/course-module/get`
- [x] Line 100: `/assignments/get` → `/assignment/get`

### Pages - Studio Course (7 files) ✅

#### `src/app/(app)/studio/course/page.tsx`
- [x] Reviewed - no endpoint usage (uses hook)

#### `src/app/(app)/studio/course/[coursenft]/page.tsx`
- [x] Line 145: `/courses/get` → `/course/get`
- [x] Line 166: `/course-modules/list` → `/course-module/list`
- [x] Line 185: `/course-modules/assignment-summary` → `/course-module/with-assignments`
- [x] Line 207: `/courses/unpublished-projects` → `/course/unpublished-projects`
- [x] Line 386: `/courses/update` → `/course/update`
- [x] Line 406: `/courses/get` → `/course/get`
- [x] Line 432: `/courses/delete` → `/course/delete`
- [x] Line 565: `/course-modules/list` → `/course-module/list`

#### `src/app/(app)/studio/course/[coursenft]/instructor/page.tsx`
- [x] Line 125: `/courses/get` → `/course/get`
- [x] Line 146: `/assignment-commitments/list-by-course` → `/assignment-commitment/by-course`

#### `src/app/(app)/studio/course/[coursenft]/[modulecode]/page.tsx`
- [x] Line 146: `/courses/get` → `/course/get`
- [x] Line 161: `/course-modules/get` → `/course-module/get`
- [x] Line 185: `/course-modules/list` → `/course-module/list`
- [x] Line 243: `/course-modules/update` → `/course-module/update`
- [x] Line 277: `/course-modules/update-status` → `/course-module/update-status`
- [x] Line 295: `/course-modules/get` → `/course-module/get`
- [x] Line 324: `/course-modules/delete` → `/course-module/delete`
- [x] Line 373: `/course-modules/update-code` → ❌ REMOVED (disabled with user message)
- [x] Line 411: `/course-modules/set-pending-tx` → ❌ REMOVED (disabled with user message)
- [x] Line 446: `/course-modules/publish` → ❌ REMOVED (disabled with user message)
- [x] Line 923: `/course-modules/get` → `/course-module/get`

#### `src/app/(app)/studio/course/[coursenft]/[modulecode]/slts/page.tsx`
- [x] Line 250: `/slts/list` → `/slt/list`
- [x] Line 269: `/lessons/list` → `/lesson/list`
- [x] Line 315: `/courses/get` → `/course/get`
- [x] Line 330: `/course-modules/get` → `/course-module/get`
- [x] Line 405: `/slts/batch-update-indexes` → `/slt/reorder`
- [x] Line 467: `/slts/create` → `/slt/create`
- [x] Line 526: `/slts/update` → `/slt/update`
- [x] Line 564: `/slts/delete` → `/slt/delete`
- [x] Line 630: `/slts/get` → `/slt/get`

#### `src/app/(app)/studio/course/[coursenft]/[modulecode]/introduction/page.tsx`
- [x] Line 83: `/courses/get` → `/course/get`
- [x] Line 98: `/course-modules/get` → `/course-module/get`
- [x] Line 116: `/introductions/get` → `/introduction/get`
- [x] Line 198: `/introductions/update` → `/introduction/update`
- [x] Line 237: `/introductions/create` → `/introduction/create`
- [x] Line 275: `/introductions/publish` → `/introduction/publish`

#### `src/app/(app)/studio/course/[coursenft]/[modulecode]/assignment/page.tsx`
- [x] Line 95: `/courses/get` → `/course/get`
- [x] Line 110: `/course-modules/get` → `/course-module/get`
- [x] Line 128: `/slts/list` → `/slt/list`
- [x] Line 149: `/assignments/get` → `/assignment/get`
- [x] Line 232: `/assignments/update` → `/assignment/update`
- [x] Line 273: `/assignments/create` → `/assignment/create`
- [x] Line 314: `/assignments/delete` → `/assignment/delete`
- [x] Line 351: `/assignments/publish` → `/assignment/publish`

#### `src/app/(app)/studio/course/[coursenft]/[modulecode]/[moduleindex]/page.tsx`
- [x] Line 85: `/courses/get` → `/course/get`
- [x] Line 100: `/course-modules/get` → `/course-module/get`
- [x] Line 118: `/lessons/get` → `/lesson/get`
- [x] Line 197: `/lessons/update` → `/lesson/update`
- [x] Line 212: `/lessons/get` → `/lesson/get`
- [x] Line 250: `/lessons/create` → `/lesson/create`
- [x] Line 265: `/lessons/get` → `/lesson/get`
- [x] Line 304: `/lessons/delete` → `/lesson/delete`

### Pages - Project (DO NOT MIGRATE YET)

These files use Project System endpoints which are NOT yet migrated in the DB API:

- `src/app/(app)/project/page.tsx` - `/projects/list`
- `src/app/(app)/project/[treasurynft]/page.tsx` - `/projects/list`, `/tasks/list`
- `src/app/(app)/project/[treasurynft]/[taskhash]/page.tsx` - `/tasks/list`, `/task-commitments/get`
- `src/app/(app)/studio/project/page.tsx` - `/projects/list-owned`
- `src/app/(app)/studio/project/[treasurynft]/page.tsx` - `/projects/list-owned`, `/tasks/list`, `/projects/update`
- `src/app/(app)/studio/project/[treasurynft]/draft-tasks/page.tsx` - `/tasks/list`, `/tasks/delete`
- `src/app/(app)/studio/project/[treasurynft]/draft-tasks/new/page.tsx` - `/tasks/create`
- `src/app/(app)/studio/project/[treasurynft]/draft-tasks/[taskindex]/page.tsx` - `/tasks/list`, `/tasks/update`

### Pages - Other (1 file) ✅

#### `src/app/(app)/sitemap/page.tsx`
- [x] Line 279: `/courses/published` → `/course/published`
- [x] Line 292: `/projects/list` - NO CHANGE (Project System not migrated)
- [x] Line 308: `/courses/owned` → `/course/list`
- [x] Line 322: `/projects/owned` - NO CHANGE (Project System not migrated)

---

## Documentation to Update

After code migration, update these docs:

- [ ] `docs/api/API-ENDPOINT-REFERENCE.md` - Update all endpoint paths
- [ ] `docs/sitemaps/course-local-state.md` - Update endpoint references
- [ ] `docs/patterns/query-patterns.md` - Update examples
- [ ] `docs/architecture/DATA-SOURCES.md` - Update endpoint references
- [ ] `CHANGELOG.md` - Document breaking changes

---

## Migration Strategy

### Phase 1: Course System Migration ✅
1. ✅ Update all Course System endpoints (courses, modules, SLTs, lessons, assignments, introductions)
2. ✅ Update assignment commitment endpoints
3. ✅ Update credential endpoints
4. ⏳ Test all Course flows

### Phase 2: App System Migration ✅
1. ✅ Update user/access-token endpoints
2. ✅ Update pending transaction endpoints
3. ✅ Update my-learning endpoint
4. ⏳ Test auth and transaction flows

### Phase 3: Project System (FUTURE)
Wait for DB API v0.5.0 to migrate Project System endpoints before updating these files.

---

## Testing Checklist

After migration, verify:

- [ ] Public course browsing works
- [ ] Course detail pages load
- [ ] Module navigation works
- [ ] Lesson viewing works
- [ ] Assignment viewing works
- [ ] Creator can create courses
- [ ] Creator can create modules
- [ ] Creator can create SLTs
- [ ] Creator can create lessons
- [ ] Creator can create assignments
- [ ] Creator can publish content
- [ ] Learner can view my-learning
- [ ] Learner can submit assignments
- [ ] Pending transaction monitoring works
- [ ] Auth flow works (connect wallet, sync alias)

---

## Notes

### Removed Endpoints

These endpoints were removed from the DB API. The UI functions have been disabled with user-friendly error messages:

1. **`/course-modules/update-code`** - Module code renaming
   - **Status**: Disabled with message "Module renaming is temporarily unavailable"
   - Alternative: May need to delete and recreate module

2. **`/course-modules/set-pending-tx`** - Set pending transaction hash
   - **Status**: Disabled with message "Setting pending transaction manually is temporarily unavailable"
   - Alternative: Use `/course-module/update-status` with `pending_tx_hash` parameter

3. **`/course-modules/publish`** - Publish all module content
   - **Status**: Disabled with message "Batch publish is temporarily unavailable"
   - Alternative: Publish each content type individually (introduction, SLTs, lessons, assignment)

### Input Schema Changes

Some endpoints may have input schema changes. Check the DB API type exports:

```typescript
import {
  type CourseOutput,
  type ListCourseModulesInput,
  // ... etc
} from "@andamio/db-api";
```

---

*Last Updated: 2025-12-15*
*Migration Completed: 2025-12-15*
