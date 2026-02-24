---
status: complete
priority: p1
issue_id: "012"
tags: [code-review, bug, ux]
dependencies: []
---

# Missing reset() on Failed/Expired Path in ManagersManage

## Problem Statement

In `src/components/tx/managers-manage.tsx`, the `useTxStream` `onComplete` callback handles the `updated` state correctly (calls `reset()` at line 106), but the `failed`/`expired` branch at lines 107-111 shows a toast error but never calls `reset()`. This leaves the component stuck in the "success" state with no way for the user to retry — the submit button is hidden and the gateway confirmation spinner stays visible forever.

The equivalent code in `teachers-update.tsx:90-94` correctly calls `reset()` on the failed/expired path.

**Why it matters:** Users who hit a failed/expired transaction on the managers page will see an infinite spinner with no way to recover except refreshing the page.

## Findings

- **Flagged by:** TypeScript reviewer, Architecture strategist, Code simplicity reviewer
- `teachers-update.tsx:94` correctly calls `reset()` after showing the error toast
- `managers-manage.tsx:107-111` is missing the `reset()` call
- The UI condition at line 334 (`state === "success" && result?.requiresDBUpdate && !txConfirmed && !txFailed`) keeps showing the spinner because `state` never returns to `idle`

**Evidence:**
```typescript
// managers-manage.tsx lines 107-111 (MISSING reset())
} else if (status.state === "failed" || status.state === "expired") {
  toast.error("Update Failed", {
    description: status.last_error ?? "Please try again or contact support.",
  });
  // BUG: no reset() here — UI gets stuck
}

// teachers-update.tsx lines 90-94 (CORRECT)
} else if (status.state === "failed" || status.state === "expired") {
  toast.error("Update Failed", {
    description: status.last_error ?? "Please try again or contact support.",
  });
  reset(); // ← This is missing in managers-manage.tsx
}
```

## Proposed Solutions

### Option A: Add reset() call (Recommended)
**Pros:** One-line fix, matches teachers-update.tsx pattern exactly
**Cons:** None
**Effort:** Small (2 min)
**Risk:** None

```typescript
} else if (status.state === "failed" || status.state === "expired") {
  toast.error("Update Failed", {
    description: status.last_error ?? "Please try again or contact support.",
  });
  reset(); // Add this line
}
```

## Recommended Action

Option A — trivial fix, clear bug.

## Technical Details

**Affected files:**
- `src/components/tx/managers-manage.tsx` (line 111)

## Acceptance Criteria

- [ ] `reset()` called on failed/expired path in managers-manage.tsx
- [ ] UI returns to idle state after failed TX, allowing retry
- [ ] Matches teachers-update.tsx behavior exactly

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #324 review | Copy-paste divergence between twin components |

## Resources

- PR #324: https://github.com/Andamio-Platform/andamio-app-v2/pull/324
- Correct pattern: `src/components/tx/teachers-update.tsx:90-94`
