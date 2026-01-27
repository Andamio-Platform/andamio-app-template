# Assignment Commitment API Fixes

**Date:** January 19, 2026

## Summary

Fixed API field naming issues in `src/components/learner/assignment-commitment.tsx` causing 401/400 errors when fetching/creating assignment commitments.

## Issues Found

### 1. Wrong Endpoint Namespace
- **Before:** `/api/v2/course/shared/assignment-commitment/get`
- **After:** `/api/v2/course/student/assignment-commitment/get`
- **Reason:** `shared` endpoints require teacher permissions; `student` endpoints infer user from JWT

### 2. Wrong Field Name
- **Before:** `policy_id` in request bodies
- **After:** `course_id` in request bodies
- **Error:** `400 Bad Request - "course_id and module_code are required"`

## Files Changed

**`src/components/learner/assignment-commitment.tsx`**
- Line 196: `policy_id` → `course_id` (get)
- Line 295: `policy_id` → `course_id` (update-evidence)
- Line 333: `policy_id` → `course_id` (delete)
- Line 539: `policy_id` → `course_id` (create - sync flow)
- Line 560: `policy_id` → `course_id` (update-evidence - sync flow)

Also changed endpoint from `shared` to `student` namespace (line 191).

## Known Issue: Sync Problem

On-chain commitment exists but DB record missing because:
1. TX succeeded (on-chain) ✓
2. Side effect failed (DB create returned 400 due to `policy_id` issue) ✗

The component has sync flow code but it's disabled:
```typescript
// TODO: Re-enable when V2 student state endpoint is available
const hasOnChainCommitment = false;
```

## Endpoint Status

### Successful (200)
| Method | Endpoint |
|--------|----------|
| GET | `/api/v2/course/user/slts/list/{course_id}/{module_code}` |
| GET | `/api/v2/course/user/assignment/get/{course_id}/{module_code}` |
| GET | `/api/v2/courses/{course_id}/details` |
| GET | `/api/v2/course/user/courses/list` |
| GET | `/api/v2/course/user/course/get/{course_id}` |
| GET | `/api/v2/course/user/modules/list/{course_id}` |
| GET | `/api/v2/course/user/lessons/list/{course_id}/{module_code}` |
| POST | `/api/v2/course/student/courses/list` |
| POST | `/api/v2/course/teacher/courses/list` |
| POST | `/api/v2/course/teacher/assignment-commitments/list` |
| POST | `/api/v2/project/contributor/projects/list` |
| POST | `/api/v2/project/manager/projects/list` |
| POST | `/api/v2/tx/course/student/assignment/commit` |

### Failed
| Status | Endpoint | Error |
|--------|----------|-------|
| 404 | `GET /api/v2/course/user/course-module/get/{id}/{code}` | Endpoint doesn't exist on gateway |
| 404 | `POST /api/v2/user/unconfirmed-tx` | Endpoint doesn't exist on gateway |
| 404 | `POST /api/v2/course/student/assignment-commitment/get` | Expected - no DB record (sync issue) |

## Next Steps

1. ~~Test new assignment submission with fixed code~~
2. ~~Consider re-enabling on-chain state detection for sync flow~~ ✅ Fixed Jan 27, 2026
3. Investigate missing endpoints (`course-module/get`, `unconfirmed-tx`)

---

## Update: January 27, 2026 - On-Chain Sync Flow Enabled

**Problem**: Student "james" had an on-chain commitment but 404 from `/assignment-commitment/get` because the DB record was never created (original side effect failed due to `policy_id` bug).

**Root Cause**: The sync flow UI was disabled because `hasOnChainCommitment` was hardcoded to `false`.

**Fix**: Enabled on-chain state detection using existing `getCourseStudent()` function:

```typescript
// Before (disabled)
const hasOnChainCommitment = false;
const hasCompletedOnChain = false;
const refetchOnChain = async () => { /* No-op */ };

// After (enabled)
const [onChainStudent, setOnChainStudent] = useState<AndamioscanStudent | null>(null);
const refetchOnChain = useCallback(async () => {
  const studentState = await getCourseStudent(courseNftPolicyId, user.accessTokenAlias);
  setOnChainStudent(studentState);
}, [courseNftPolicyId, user?.accessTokenAlias]);

const hasOnChainCommitment = onChainStudent?.current === sltHash;
const hasCompletedOnChain = onChainStudent?.completed.includes(sltHash);
```

**Changes**:
- `src/components/learner/assignment-commitment.tsx`:
  - Import `getCourseStudent` and `AndamioscanStudent` from `~/lib/andamioscan-events`
  - Add `onChainStudent` state and `onChainLoading` state
  - Implement `refetchOnChain` callback using `getCourseStudent()`
  - Compute `hasOnChainCommitment` by comparing `onChainStudent.current` with `sltHash`
  - Compute `hasCompletedOnChain` by checking if `sltHash` is in `completed` array
  - Display on-chain evidence hash in sync flow UI for verification

**Result**: Users with orphaned on-chain commitments now see the "Sync Required" UI and can re-create their DB record.
