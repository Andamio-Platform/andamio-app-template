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
| `color-system` | Manage and update the semantic color palette in globals.css | Low | Useful for theme iterations; the theme-expert skill covers usage but not modification |
| `naming-convention-checker` | Validate naming conventions (module codes, SLT references) across components | Medium | New convention for `<module-code>.<module-index>` should be consistently applied |
| `loading-state-auditor` | Verify loading states match page layouts (loadingVariant patterns) | Low | Prevents loading screen "flash" issues; check RequireCourseAccess usage, React Query patterns |
| `transaction-auditor` | Verify transaction definitions match API endpoints | High | Caught endpoint path mismatch in COURSE_ADMIN_CREATE; side effects depend on exact paths |

**Added**: 2025-12-19 (first documentarian run)
**Updated**: 2025-12-31 (added transaction-auditor skill suggestion)

---

## Documentation Improvements

Ideas for improving existing documentation.

| Idea | Location | Priority | Notes |
|------|----------|----------|-------|
| Add @dnd-kit to dependencies list in CLAUDE.md | `.claude/CLAUDE.md` | Low | Now used for SLT reordering, should be documented as a core dependency |
| Document color system design decisions | `.claude/skills/theme-expert/` | Low | Current values use oklch with hue 250 (sky blue); rationale could be documented |

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
| Update step-blueprint.tsx → step-credential.tsx in api-coverage.md | 2025-12-29 | Fixed file references |
| Add StudioModuleCard to extracted-components.md | 2025-12-29 | Documented new component |
| Document RequireCourseAccess loadingVariant prop | 2025-12-29 | Updated props table and usage notes |
| Add inline lesson editing to CHANGELOG | 2025-12-29 | Added to Unreleased section |
| Document silent refetch fix in CHANGELOG | 2025-12-29 | Added to Fixed section |
| Update STATUS.md with Session 3 changes | 2025-12-29 | Added new session entry |
| Update StepBlueprint → StepCredential in theme-expert layouts.md | 2025-12-29 | Updated terminology |
| Update step-blueprint.tsx → step-credential.tsx in api-recommendations | 2025-12-29 | Updated file references |
| Update ?step=blueprint → ?step=credential in extracted-components.md | 2025-12-29 | Updated URL parameter |
| Add Course Module/SLT reference convention to CLAUDE.md | 2025-12-29 | Added new coding convention section |
| Document Course Preview Panel redesign in CHANGELOG | 2025-12-29 | Added to Unreleased section |
| Document PR Review skill in CLAUDE.md | 2025-12-31 | Added to Claude Skills table |
| Fix transaction endpoint paths in COURSE_ADMIN_CREATE | 2025-12-31 | Fixed in andamio-transactions package |
| Document Register Course Drawer in CHANGELOG | 2025-12-31 | Added to Unreleased section |
| Update SITEMAP.md with correct (studio) route group | 2025-12-31 | Fixed route group references |
| Update STATUS.md with Session 4 changes | 2025-12-31 | Added new session entry |
| Document Responsive Editor Toolbar in CHANGELOG | 2025-12-31 | Added to Unreleased section |
| Document Wizard Navigation fix in CHANGELOG | 2025-12-31 | Added to Fixed section |
| Document Sidebar User Info redesign in CHANGELOG | 2025-12-31 | Added to Fixed section |
| Document Code Element Styling fix in CHANGELOG | 2025-12-31 | Added to Fixed section |
| Add Rule 7 (No `<code>` Elements) to style-rules.md | 2025-12-31 | Added new rule for inline monospace |
| Fix raw `<input>` elements in studio/course/page.tsx | 2025-12-31 | Changed to AndamioInput |
| Update STATUS.md with Session 5 changes | 2025-12-31 | Added new session entry |
| Build `global-style-checker` skill | 2025-12-31 | Created SKILL.md and global-overrides.md reference |
