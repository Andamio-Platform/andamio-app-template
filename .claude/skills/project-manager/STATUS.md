# Project Status

> **Last Updated**: December 29, 2025

Current implementation status of the Andamio T3 App Template.

---

## Upcoming Milestones

| Date | Milestone | Impact on Template |
|------|-----------|-------------------|
| **2026-01-09** | Andamio V2 Preprod Release | Template optimization complete |
| **2026-01-12** | Andamio Pioneers Program | Preprod testing begins |
| **2026-01-12 → 2026-02-06** | V1→V2 Migration Focus | Work shifts to app.andamio.io |
| **2026-02-06** | Andamio V2 Mainnet Launch | Feature backlog resumes |

**Note**: During Jan 12 → Feb 6, primary dev focus is on app.andamio.io (production fork). This template remains the reference implementation.

---

## Quick Status

| Area | Status | Progress |
|------|--------|----------|
| Course System | Stable | 15/15 routes, ~66% API coverage |
| Project System | Planned | 13 routes documented, 0 implemented |
| React Query Migration | In Progress | 18 hooks created, 1 page migrated |
| Transaction System | Stable | Side effects, pending tx monitoring |
| Styling System | Stable | Full semantic color system |

---

## Course System

### Routes: 15/15 Implemented

**Public (Learner)** - 5 routes:
- `/course` - Course catalog
- `/course/[coursenft]` - Course detail with modules
- `/course/[coursenft]/[modulecode]` - Module detail with SLTs/lessons
- `/course/[coursenft]/[modulecode]/[moduleindex]` - Lesson detail
- `/course/[coursenft]/[modulecode]/assignment` - Assignment with commitment flow

**Studio (Creator)** - 10 routes:
- `/studio` - Studio home dashboard
- `/studio/course` - Course management dashboard
- `/studio/course/[coursenft]` - Course editor
- `/studio/course/[coursenft]/instructor` - Instructor dashboard
- `/studio/course/[coursenft]/[modulecode]` - Module editor
- `/studio/course/[coursenft]/[modulecode]/slts` - SLT management
- `/studio/course/[coursenft]/[modulecode]/assignment` - Assignment editor
- `/studio/course/[coursenft]/[modulecode]/[moduleindex]` - Lesson editor
- `/studio/course/[coursenft]/[modulecode]/introduction` - Introduction editor

### API Coverage: ~66% (49/74 endpoints)

See `audit-api-coverage/api-coverage.md` for detailed breakdown.

| Category | Available | Implemented | Coverage |
|----------|-----------|-------------|----------|
| Course | 9 | 6 | 67% |
| Course Module | 9 | 6 | 67% |
| SLT | 7 | 6 | 86% |
| Lesson | 5 | 4 | 80% |
| Assignment | 5 | 4 | 80% |
| Assignment Commitment | 10 | 8 | 80% |
| Introduction | 4 | 4 | 100% |
| Auth | 3 | 3 | 100% |
| User | 7 | 0 | 0% |
| Project/Task | ~15 | 0 | 0% |

---

## React Query Migration

### Status: In Progress

**Target**: Complete before Preprod V2 Release (2026-01-09)

New hooks created in `src/hooks/api/`:

| Hook File | Hooks Created | Purpose |
|-----------|---------------|---------|
| `use-course.ts` | 5 | Course queries + mutations |
| `use-course-module.ts` | 6 | Module queries + mutations |
| `use-slt.ts` | 4 | SLT queries + mutations |
| `use-lesson.ts` | 3 | Lesson queries + mutations |
| **Total** | **18** | |

### Migration Status

| Page | Status | Target Hooks |
|------|--------|--------------|
| `course/[coursenft]/page.tsx` | Migrated | `useCourse`, `useCourseModules` |
| `course/[coursenft]/[modulecode]/page.tsx` | Pending | `useCourse`, `useCourseModule` |
| `studio/course/[coursenft]/page.tsx` | Pending | `useCourse`, `useCourseModules` |
| All other pages | Pending | See recommendations doc |

### Expected Impact

- **Request reduction**: 40-60% with full migration
- **Deduplication**: Automatic for identical requests
- **Cross-route caching**: Data shared between routes
- **Background refetching**: Stale data refreshed automatically

Full roadmap: `audit-api-coverage/api-recommendations-2025-12-19.md`

---

## Transaction System

### Core Components

| Component | Status | Purpose |
|-----------|--------|---------|
| `useTransaction` | Stable | Core transaction hook |
| `useAndamioTransaction` | Stable | Wrapper with side effects |
| `AndamioTransaction` | Stable | Transaction UI component |
| `PendingTxWatcher` | Stable | Automatic tx monitoring |

### Implemented Transactions

| Transaction | Type | Status |
|-------------|------|--------|
| Mint Access Token | User | Active |
| Enroll in Course | Learner | Active |
| Mint Module Tokens | Creator | Active |
| Accept Assignment | Instructor | Active |
| Deny Assignment | Instructor | Active |
| Commit to Assignment | Learner | Active |
| Update Assignment | Learner | Active |
| Leave Assignment | Learner | Active |

### Side Effects System

- Automatic `onSubmit` execution after transactions
- Status updates: `PENDING_TX` → `ON_CHAIN`
- Toast notifications for success/failure
- Error handling with retry logic

---

## Styling System

### Status: Stable

**Color System** (light/dark mode):
- Primary: Sky blue (hue 250) - fresh, modern
- Base: `background`, `foreground`, `card`, `popover`
- Interactive: `primary`, `secondary`, `muted`, `accent`
- Status: `success`, `warning`, `info`, `destructive`
- Sidebar: Gray panel contrasting with white content area

**Components**:
- 45+ shadcn/ui components installed
- `AndamioText` for consistent text styling
- `AndamioStatusIcon` for status indicators with presets
- `AndamioPageLoading` / `AndamioStudioLoading` unified loading system
- Responsive breakpoints: xs (375px) → 2xl (1536px)

**Guidelines**:
- `.claude/skills/review-styling/` - Style rules, extracted components
- `.claude/skills/theme-expert/` - Layouts, colors, spacing, components

---

## Project System

### Status: Planned (Post-Mainnet)

**Timeline**: Implementation after 2026-02-06

13 routes documented in `project-local-state.md`:

**Public (Contributor)** - 3 routes:
- `/project` - Project catalog
- `/project/[treasurynft]` - Project detail with tasks
- `/project/[treasurynft]/[taskhash]` - Task detail with commitment

**Studio (Manager)** - 10 routes:
- `/studio/project` - Project management
- `/studio/project/[treasurynft]` - Project dashboard
- `/studio/project/[treasurynft]/manage-treasury`
- `/studio/project/[treasurynft]/manage-contributors`
- `/studio/project/[treasurynft]/commitments`
- `/studio/project/[treasurynft]/commitments/[alias]`
- `/studio/project/[treasurynft]/draft-tasks`
- `/studio/project/[treasurynft]/draft-tasks/new`
- `/studio/project/[treasurynft]/draft-tasks/[taskindex]`
- `/studio/project/[treasurynft]/transaction-history`

16 API endpoints mapped, awaiting implementation.

---

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| Next.js | 15.x | Framework |
| @tanstack/react-query | ^5.x | Data fetching |
| @meshsdk/core | ^2.x | Cardano wallet |
| @tiptap/react | ^2.x | Rich text editor |
| @dnd-kit/core | ^6.x | Drag and drop |
| @andamio/db-api | ^0.5.x | API types & schemas |
| @andamio/transactions | ^0.1.x | Transaction definitions |

---

## Recent Changes

### December 29, 2025 (Session 3)

- **StudioModuleCard Extracted**: New reusable component with 6-step progress indicator, status icons
- **RequireCourseAccess loadingVariant**: Added `loadingVariant` prop to prevent loading screen "flash" during navigation
- **Silent Refetch on Save**: `useModuleWizardData` no longer shows full loading screen when saving (assignment/lesson)
- **Inline Lesson Editing**: Lessons now edited inline in wizard (like assignments), removed broken external link
- **Documentation Updates**: Updated extracted-components.md, api-coverage.md, STATUS.md

### December 29, 2025 (Session 2)

- **Blueprint → Credential Rename**: Renamed wizard step from "Blueprint" to "Credential" across all files
- **Course Preview Panel Redesign**: New hero section with stat grid (Modules, On-Chain, SLTs), centered CTA, module code list
- **SLT Reference Format**: Now uses `<module-code>.<module-index>` (e.g., "101.3") instead of sequential numbers
- **Input Border Fix**: Fixed invisible borders on form inputs via `border-border` in globals.css
- **Error Boundary Fix**: Removed duplicate html/body tags from error.tsx
- **Optimistic SLT Updates**: Fixed React render error with updateSlts calls
- **New Coding Convention**: Documented Course Module/SLT reference rules in CLAUDE.md

### December 29, 2025 (Session 1)

- **Color System Overhaul**: New sky blue primary (hue 250), swapped sidebar/background for better contrast
- **Unified Loading System**: `AndamioPageLoading`, `AndamioStudioLoading`, `AndamioCardLoading`, etc.
- **AndamioStatusIcon**: Reusable status indicator with presets (`on-chain`, `pending`, `draft`, etc.)
- **SLT Drag & Drop**: Added @dnd-kit for reordering SLTs in module wizard
- **theme-expert Skill**: New comprehensive design system skill with layouts, colors, spacing docs
- **Wizard Step Simplification**: Removed redundant description from step headers

### December 19, 2025

- **V2 Release Schedule Confirmed**: Preprod 2026-01-09, Mainnet 2026-02-06
- Created 18 React Query hooks for Course/Module/SLT/Lesson
- Migrated `course/[coursenft]/page.tsx` to React Query
- Created API recommendations document with migration roadmap
- Cleaned up project-manager documentation (deleted 5 outdated files)
- Updated STATUS.md and ROADMAP.md with release timeline

### Previous Highlights

- Completed all 15 course routes
- Implemented transaction side effects system
- Added pending transaction monitoring with Koios
- Established semantic color system
- Completed input validation across all studio pages

---

## Known Issues

1. **Low Hook Coverage**: Most pages use `useState`/`useEffect` instead of React Query
2. **Project Routes Missing**: All project/task routes documented but not built
3. **User Endpoints Unused**: 0% of user-related API endpoints integrated
4. **Duplicate Routes**: `/courses` and `/studio/course` show same data

---

## Legend

- **Stable**: Production-ready, no major changes expected
- **In Progress**: Active development
- **Planned**: Documented, awaiting implementation
- **Pending**: Waiting for dependencies or prioritization
