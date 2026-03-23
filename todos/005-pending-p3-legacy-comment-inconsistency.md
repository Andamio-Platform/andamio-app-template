---
status: complete
priority: p3
issue_id: "005"
tags: [code-review, cleanup, pr-45]
dependencies: []
---

# Minor: Inconsistent legacy comment wording across normalizer hooks

## Problem Statement

`use-student-assignment-commitments.ts:66` uses "remove after migration confirmed" while all other files use "remove after v2.2 confirmed". When doing the eventual grep cleanup, inconsistent wording makes it harder to find all legacy mappings.

## Proposed Solutions

Align to "remove after v2.2 confirmed" in all files.

- **Effort:** Small (1 comment change)

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-03-23 | Created | Found during PR #45 review |
