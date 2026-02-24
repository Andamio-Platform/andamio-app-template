---
status: complete
priority: p2
issue_id: "035"
tags: [code-review, security, typescript, pr-337]
dependencies: []
---

# Add Runtime Type Validation in getPreAssignedAlias

## Problem Statement

`getPreAssignedAlias` uses unsafe type assertion chains (`as Record<string, unknown>` then `as TaskMetadata | undefined`) with no runtime validation. If a malicious or malformed `content_json` payload contains a non-string `alias` value, it propagates through the app as `preAssignedAlias` despite the `string | null` return type.

## Findings

- **Source**: Security Sentinel (Finding 3)
- **File**: `src/lib/task-metadata.ts`, lines 17-22
- **Evidence**: Double `as` cast with no runtime `typeof` check on the extracted alias value

## Proposed Solutions

### Option A: Add typeof checks (Recommended)
```typescript
export function getPreAssignedAlias(contentJson: unknown): string | null {
  if (!contentJson || typeof contentJson !== "object") return null;
  const doc = contentJson as Record<string, unknown>;
  const metadata = doc._metadata;
  if (!metadata || typeof metadata !== "object") return null;
  const preAssignment = (metadata as Record<string, unknown>).preAssignment;
  if (!preAssignment || typeof preAssignment !== "object") return null;
  const alias = (preAssignment as Record<string, unknown>).alias;
  if (typeof alias !== "string") return null;
  return alias || null;
}
```

- **Effort**: Small (~10 lines)
- **Risk**: None

## Acceptance Criteria

- [ ] Non-string alias values return null
- [ ] Valid string aliases still extracted correctly

## Work Log

- 2026-02-24: Created from PR #337 review
