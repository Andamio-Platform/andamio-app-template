# Documentarian Backlog

Ideas, suggestions, and improvements gathered during documentation runs.

---

## Suggested New Skills

These skill ideas emerged from codebase pattern analysis during documentation runs.

| Skill | Purpose | Priority | Notes |
|-------|---------|----------|-------|
| `component-generator` | Create new Andamio wrapper components following the wrapper convention | High | Many wrappers follow identical patterns (re-export with Andamio prefix) |
| `type-auditor` | Verify all API types are imported from andamio-db-api, not locally defined | High | Critical for maintaining type safety across the stack |
| `route-creator` | Scaffold new app routes with proper auth gates, loading states, breadcrumbs | Medium | All routes follow consistent patterns |
| `wizard-step-generator` | Add new steps to the module wizard following existing patterns | Low | Useful as app grows, but wizard is fairly stable |

**Added**: 2025-12-19 (first documentarian run)

---

## Documentation Improvements

Ideas for improving existing documentation.

| Idea | Location | Priority | Notes |
|------|----------|----------|-------|
| - | - | - | No items yet |

---

## Process Improvements

Ideas for improving the documentarian skill itself.

| Idea | Priority | Notes |
|------|----------|-------|
| Add ESLint rule suggestions to style-rules.md automatically | Low | Currently manual grep commands documented |
| Track component usage counts | Low | Would help identify underused components |

---

## Completed Items

Items that have been addressed and can be archived.

| Item | Completed | Outcome |
|------|-----------|---------|
| - | - | - |
