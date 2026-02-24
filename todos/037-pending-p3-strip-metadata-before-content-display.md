---
status: pending
priority: p3
issue_id: "037"
tags: [code-review, architecture, pr-337]
dependencies: []
---

# Strip _metadata Before Passing to ContentDisplay

## Problem Statement

The task detail page passes raw `task.contentJson` (including `_metadata`) to `ContentDisplay`. While Tiptap currently ignores unknown keys, this is an implicit contract. If a future Tiptap version processes unknown keys, metadata could render as visible content.

## Findings

- **Source**: Architecture Strategist
- **File**: `src/app/(app)/project/[projectid]/[taskhash]/page.tsx` (content display section)
- **Evidence**: Design doc mentions `getTiptapContent()` helper but it was not implemented

## Proposed Solutions

Strip `_metadata` before rendering, or implement `getTiptapContent()` helper.

- **Effort**: Small
- **Risk**: None

## Work Log

- 2026-02-24: Created from PR #337 review
