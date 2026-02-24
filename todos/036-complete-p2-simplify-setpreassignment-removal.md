---
status: complete
priority: p2
issue_id: "036"
tags: [code-review, simplicity, yagni, pr-337]
dependencies: []
---

# Simplify setPreAssignment Removal Path

## Problem Statement

The `setPreAssignment` function's removal path (lines 51-58) destructures `_metadata` to preserve hypothetical other metadata keys, uses `Record<string, unknown>` intersection type, and checks `Object.keys(rest).length`. Today there is exactly one metadata key (`preAssignment`). This is YAGNI — when a second key is added, the preservation logic can be added then.

## Findings

- **Source**: Code Simplicity Reviewer, TypeScript Reviewer
- **File**: `src/lib/task-metadata.ts`, lines 51-58
- **Evidence**: Only `preAssignment` exists as a metadata key. The `TaskMetadata & Record<string, unknown>` intersection cast is also a type safety concern.

## Proposed Solutions

### Option A: Replace with simple delete (Recommended)
```typescript
} else {
  delete doc._metadata;
  if (!contentJson && (!doc.content || doc.content.length === 0)) {
    return null;
  }
}
```

- **Effort**: Small (~10 lines saved)
- **Risk**: None — no other metadata keys exist today

## Acceptance Criteria

- [ ] `setPreAssignment(content, null)` removes `_metadata` entirely
- [ ] Empty-doc cleanup still works

## Work Log

- 2026-02-24: Created from PR #337 review
