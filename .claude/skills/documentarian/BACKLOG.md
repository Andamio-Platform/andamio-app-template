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
| `transaction-auditor` | Verify transaction definitions match API endpoints and schemas | **Critical** | Atlas API schema evolves but `@andamio/transactions` definitions lag behind. Should fetch swagger.json and validate all required fields. Caught COURSE_ADMIN_CREATE path mismatch and COURSE_TEACHER_MODULES_MANAGE schema drift (missing `allowed_course_state_ids`, `prereq_slt_hashes`). |
| `project-workflow-guide` | Document project contributor/manager workflows with transaction flows | Medium | New project system has complex workflows; would help onboard contributors to projects |
| `dashboard-builder` | Scaffold dashboard pages with stats grid, filters, and data tables | Medium | New dashboards (Manager, Contributor, Instructor) follow similar patterns with AndamioDashboardStat grids |
| `andamioscan-event-integrator` | Guide integration of Andamioscan Event endpoints for transaction confirmation | High | 15 Event endpoints remain unimplemented. Would replace Koios polling with entity-specific confirmation. See GitHub issue #26 |
| `api-migration-validator` | Validate T3 App endpoints match Go API swagger | **Critical** | Go API migration required updating 14 files. Would fetch swagger.json and compare all endpoint paths/methods against codebase. |

**Added**: 2025-12-19 (first documentarian run)
**Updated**: 2026-01-09 (added api-migration-validator suggestion)

---

## Documentation Improvements

Ideas for improving existing documentation.

| Idea | Location | Priority | Notes |
|------|----------|----------|-------|
| **Audit React Query cache invalidation after transactions** | `src/hooks/api/`, transaction components | **High** | Some routes require manual refresh after transactions complete. Need to ensure `queryClient.invalidateQueries()` is called with correct keys in all transaction `onSuccess` callbacks. Check: course creation, module minting, enrollment, assignment commits. |
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
| Add Andamioscan integration to CHANGELOG.md | 2026-01-08 | Documented 17 endpoints, 6 dashboard components |
| Add `/credentials` route to SITEMAP.md | 2026-01-08 | New protected route for on-chain credentials |
| Add Dashboard Summary Components to extracted-components.md | 2026-01-08 | 6 new components with common pattern |
| Add InstructorIcon to CHANGELOG.md | 2026-01-08 | Crown icon for course ownership |
| Update STATUS.md with Andamioscan progress | 2026-01-08 | 53% coverage (17/32) |
| Create GitHub issue #26 for Event endpoints | 2026-01-08 | 15 remaining endpoints for tx confirmation |
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
| Add AndamioDashboardStat to extracted-components.md | 2026-01-07 | Documented with props table, usage examples |
| Add AndamioSearchInput to extracted-components.md | 2026-01-07 | Documented with props table, usage examples |
| Add Contributor Dashboard route to SITEMAP.md | 2026-01-07 | `/project/[treasurynft]/contributor` with API deps |
| Add Manager Dashboard route to SITEMAP.md | 2026-01-07 | `/studio/project/[treasurynft]/manager` with API deps |
| Add project transaction components to CHANGELOG.md | 2026-01-07 | 8 new transaction components documented |
| Add new dashboard components to CHANGELOG.md | 2026-01-07 | AndamioDashboardStat, AndamioSearchInput |
| Add Task Detail Page Commitment Flow to CHANGELOG.md | 2026-01-07 | Full commitment workflow with evidence editor |
| Add task detail route to SITEMAP.md | 2026-01-07 | Component details for `/project/[treasurynft]/[taskhash]` |
| Review-styling task detail page | 2026-01-07 | Fixed 5 violations, added to Review History |
| Update tx-loop-guide SKILL.md with critical behaviors | 2026-01-07 | Added section on automatic issue creation |
| Add MintModuleTokens to On-Chain tab | 2026-01-07 | Fixed missing UI for module minting |
| Fix course creation side effect case mismatch | 2026-01-07 | Changed camelCase to snake_case mappings |
| Update modules-manage.ts schema | 2026-01-07 | Aligned with Atlas API swagger.json |
| Document tx loop session in STATUS.md | 2026-01-07 | Added Session 2 notes with bugs and systemic issues |
| Update CHANGELOG with tx loop bug fixes | 2026-01-07 | Added 4 new Fixed entries |
| Document partialSign option in TRANSACTION-COMPONENTS.md | 2026-01-09 | Added multi-sig support section, updated hook description |
| Add partialSign to CHANGELOG.md | 2026-01-09 | Added to Unreleased section |
| Audit all transaction components use useAndamioTransaction | 2026-01-09 | All 16 V2 transactions now use standardized hook pattern |
| Update MintAccessToken to use useAndamioTransaction | 2026-01-09 | Hybrid approach - auto side effects + manual JWT handling |
| Update TRANSACTION-COMPONENTS.md with V2 matrix | 2026-01-09 | Full matrix of 16 definitions to components |
| Add MintAccessToken hybrid approach to SIDE-EFFECTS-INTEGRATION.md | 2026-01-09 | Documented special JWT handling case |
| Document Go API migration in CHANGELOG.md | 2026-01-09 | Added 6 endpoint path changes, auth fix, null safety fix |
| Add Go API migration notice to api-endpoint-reference.md | 2026-01-09 | Added migration table and note about RESTful conventions |
| Add Go API migration notice to api-coverage.md | 2026-01-09 | Added migration table at top |
| Add Go API migration notice to data-sources.md | 2026-01-09 | Updated header with migration reference |
| Update SITEMAP.md endpoint paths | 2026-01-09 | Fixed /my-learning/get and /course/list references |
| Update SIDE-EFFECTS-INTEGRATION.md endpoint path | 2026-01-09 | Changed /access-token/update-alias to /user/access-token-alias |
| Update extracted-components.md endpoint reference | 2026-01-09 | Fixed RequireCourseAccess API docs |
| Update STATUS.md with Go API session notes | 2026-01-09 | Added Session 2 with migration details |
