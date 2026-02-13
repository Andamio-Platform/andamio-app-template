# Project Status

> **Last Updated**: February 13, 2026
>
> **Real-time status**: Always run `gh issue list --state open` and `gh pr list` for current state.
> This file provides context but may lag behind GitHub.

Current implementation status of the Andamio T3 App Template.

---

## Quick Status

| Area | Status | Progress |
|------|--------|----------|
| Course System | Stable | 13/13 routes |
| Project System | In Progress | 10/11 routes |
| Transaction System | **100% Complete** | 17/17 V2 components |
| Gateway Migration | **Complete** | Unified V2 Gateway |
| L1 Core Package | **Complete** | `@andamio/core` created |
| Landing Page | **Complete** | Explore / Login / Register cards |
| TX Stream (SSE) | **Complete** | Real-time TX tracking with polling fallback |
| Andamioscan Removal | **✅ Complete** | `andamioscan-events.ts` deleted, 0 imports remain |
| Project Workflows | **Complete** | Owner/manager UX merged via PR #133 |
| Gateway API Sync | **Complete** | Types regenerated, SSE fix, Andamioscan regen (#139/#140) |
| **Unified Studio** | **✅ Complete** | Persistent sidebar, split-pane layout (PR #193) |
| **Wallet Switch Detection** | **✅ Complete** | Auto-logout on wallet change (PR #194) |
| **Migration Testing Fixes** | **✅ Complete** | PRs #189–#192: titles, UX copy, auth gates, wallet reconnect |
| **Custom Wallet UI** | **✅ Complete** | Replaced Mesh CardanoWallet with custom ConnectWalletButton |
| **Simplified Assignment Lifecycle** | **✅ Complete** | Frontend updated for simplified commitment status model |
| **API Hooks Cleanup** | **🔄 In Progress** | Course ✅ / Project Studio ✅ / Component Extraction ✅ / Project Hooks ⬜ |

---

## 📌 CURRENT STATUS

> **Get real-time status**: `gh issue list --state open` | `gh pr list`

### Open Issues (as of Feb 13, 2026)

Run `gh issue list --state open` to verify — issues change frequently.

| Issue | Category | Description |
|-------|----------|-------------|
| #280 | Enhancement | Unified TX error parser with user-friendly messages |
| #279 | Enhancement | Configurable max contributors per task (N-commits) |
| #277 | Enhancement | API: Include moduleCode in dashboard commitments for deep-linking |
| #260 | Enhancement | Unified transaction hooks for full TX lifecycle |
| #220 | Enhancement | Update frontend for simplified assignment commitment lifecycle |
| #143 | Enhancement | Contributor Qualification Course Template |
| #141 | Enhancement | Display native tokens in treasury balance view |

### Open PRs

Run `gh pr list` to see current PRs. Most are dependabot updates:
- Mesh SDK, ESLint, react-resizable-panels, react-day-picker, GitHub Actions

### Quick Commands

```bash
# View specific issue details
gh issue view 280

# View PR with diff
gh pr view 247 --web

# Close an issue
gh issue close <number> --comment "Resolved by PR #XXX"

# Create issue from template
gh issue create --title "bug: description" --label "bug"
```

---

## 🎯 TOP PRIORITY: API Hooks Cleanup

**Status**: Course hooks ✅ COMPLETE (8 files) | Project hooks ⬜ PENDING (3 files)

Standardizing all API hooks to follow the exemplary pattern from `use-course.ts`. Tracking in: `.claude/skills/hooks-architect/PROGRESS.md`

### The Pattern (Established)

```
Gateway API (snake_case) → Hook (transform) → Component (camelCase)
```

**Key Rules**:
1. App-level types (camelCase) defined IN hook files
2. Transform functions convert API snake_case → app camelCase
3. Components import types from hooks, NEVER from `~/types/generated`
4. Clean domain names: `Course`, `CourseModule`, `SLT` - never "Merged" prefixes
5. Semantic `status` field replaces raw `source` field

### Course Hooks (✅ Complete)

| Hook | Types | Status |
|------|-------|--------|
| `use-course.ts` | `Course`, `CourseDetail` | ✅ APPROVED |
| `use-course-owner.ts` | Uses Course types | ✅ APPROVED |
| `use-course-module.ts` | `CourseModule`, `SLT`, `Lesson`, `Assignment`, `Introduction` | ✅ APPROVED |
| `use-course-content.ts` | Public queries (useSLTs, useLesson, useAssignment, useIntroduction) | ✅ APPROVED |
| `use-course-student.ts` | `StudentCourse` | ✅ APPROVED |
| `use-course-teacher.ts` | `TeacherCourse`, `TeacherAssignmentCommitment` | ✅ APPROVED |
| `use-module-wizard-data.ts` | Composition hook | ✅ APPROVED |
| `use-save-module-draft.ts` | Aggregate mutation | ✅ APPROVED |

### Project Hooks (⬜ Pending)

| Hook | Types | Status |
|------|-------|--------|
| `use-project.ts` | Has transformers in `types/project.ts` | 🔶 Move types INTO hook |
| `use-project-manager.ts` | Raw API types | ⬜ Needs migration |
| `use-project-contributor.ts` | Raw API types | ⬜ Needs migration |
| `use-project-content.ts` | (planned) | ⬜ Create for public task queries |

### Module Wizard (Pending UX Testing)

**Commit**: `74ef3f4` - wip: Refactor wizard to use hook types

- `wizard/types.ts` now imports from `~/hooks/api`
- `use-module-wizard-data.ts` composes React Query hooks (no direct fetch)
- All step components use camelCase fields

**Next**: Manual UX testing of wizard flow

---

## Recent Completions

**February 10, 2026** (Dev API Security Fix):
- ✅ **API Setup Security Fix** (PR #251) — Closes #245, #246
  - API keys card only shows after successful profile load (not just stale JWT)
  - Clear stale dev JWT on 401/403 responses
  - Rotate/delete already used correct `api_key_name` field
- ✅ **Dev Onboarding UI Refresh** — Andamio components, DeveloperIcon, vertical stepper

**February 7, 2026** (Unified Studio + Migration Testing Fixes):
- ✅ **Unified Studio** (PR #193) — Persistent sidebar with split-pane layout, courses + projects in single view, context-based create flows, prerequisites tooltip, wizard mode detection
- ✅ **Wallet Switch Detection** (PR #194) — Auth context polls wallet address every 2s, auto-logout on change. Closes #47.
- ✅ **Auth gates standardized** (PR #192) — `ConnectWalletGate` component used across all pages
- ✅ **Wallet reconnect prompt** (PR #191) — Inline `ConnectWalletPrompt` for wallet reconnection
- ✅ **UX copy normalized** (PR #190) — Replaced jargon with user-friendly language
- ✅ **Dashboard titles** (PR #189) — Display course/project titles instead of asset hashes
- ✅ **CopyId component** created (`src/components/andamio/copy-id.tsx`) — Reusable copy-to-clipboard with responsive truncation + checkmark feedback
- ✅ **Studio routes relocated** — Project routes moved from `(app)` to `(studio)` group

*Older completions (Jan 24 – Feb 3) were archived during the Feb 7 skills cleanup. See git history for details.*

---

## Current Blockers

> **Check real-time blockers**: `gh issue list --state open --label "bug"`

Most legacy blockers have been resolved. Check GitHub for current status:

```bash
# View all open bugs
gh issue list --state open --label "bug"

# View enhancement requests
gh issue list --state open --label "enhancement"

# Search issues
gh issue list --state open --search "transaction"
```

---

## API Coverage Summary

| Category | Coverage | Status |
|----------|----------|--------|
| TX: Courses | **100%** (6/6) | Complete |
| TX: Projects | **100%** (8/8) | Complete |
| Merged Projects | **85%** (17/20) | Good |
| Authentication | **83%** (5/6) | Good |
| TX: Instance/Global | **71%** (5/7) | Minor gaps |
| Merged Courses | **55%** (23/42) | 19 missing |
| **Overall** | **63%** (68/108) | - |

> Run `npx tsx .claude/skills/audit-api-coverage/scripts/audit-coverage.ts` for live metrics.

**API Source of Truth**:
- **Gateway URL**: `https://andamio-api-gateway-666713068234.us-central1.run.app`
- **OpenAPI Spec**: `https://andamio-api-gateway-666713068234.us-central1.run.app/api/v1/docs/doc.json`

---

## System Status

### Course System (15/15 Routes)

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
- `/studio/course/[coursenft]/teacher` - Instructor dashboard
- `/studio/course/[coursenft]/[modulecode]` - Module editor
- `/studio/course/[coursenft]/[modulecode]/slts` - SLT management
- `/studio/course/[coursenft]/[modulecode]/assignment` - Assignment editor
- `/studio/course/[coursenft]/[modulecode]/[moduleindex]` - Lesson editor
- `/studio/course/[coursenft]/[modulecode]/introduction` - Introduction editor

### Project System (10/11 Routes)

**Public (Contributor)** - 4/4 routes:
- `/project` - Project catalog
- `/project/[projectid]` - Project detail with tasks
- `/project/[projectid]/contributor` - Contributor dashboard
- `/project/[projectid]/[taskhash]` - Task detail with commitment

**Studio (Manager/Owner)** - 6/7 routes:
- `/studio/project` - Project management
- `/studio/project/[projectid]` - Project dashboard (with Treasury + Blacklist tabs)
- `/studio/project/[projectid]/manager` - Manager dashboard - reviews task commitments
- `/studio/project/[projectid]/draft-tasks` - Task list management
- `/studio/project/[projectid]/draft-tasks/new` - Create new task
- `/studio/project/[projectid]/draft-tasks/[taskindex]` - Edit existing task
- `/studio/project/[projectid]/transaction-history` - **Planned**

### Transaction Components (16/16 Complete)

All transaction components are complete. See `TRANSACTION-COMPONENTS.md` for details.

---

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| Next.js | 15.x | Framework |
| @tanstack/react-query | ^5.x | Data fetching |
| @meshsdk/core | ^2.x | Cardano wallet |
| @tiptap/react | ^2.x | Rich text editor |
| @dnd-kit/core | ^6.x | Drag and drop |

---

## Milestones

| Date | Milestone | Status |
|------|-----------|--------|
| 2026-01-09 | Go API Migration Complete | Complete |
| 2026-01-14 | Andamio Pioneers Launch | Complete |
| 2026-01-17/18 | V2 Gateway API Migration | Complete |
| 2026-01-21 | L1 Core Package + TX Fixes | Complete |
| 2026-01-24 | **Course Side Colocated Types** | Complete |
| 2026-01-31 | **Landing Page + TX Stream + Bug Fixes** (PR #105) | Complete |
| 2026-02-01 | **Project Workflows** (PR #111) + owner/manager fixes | Complete |
| 2026-02-03 | **Gateway API Sync + TX UX Audit** — 6 issues closed, types regen | Complete |
| 2026-02-03 | **Draft Task Delete Fix** — #147/#148, typed assets, TX audit 9/16 | Complete |
| 2026-02-03 | **Contributor TX Cleanup** — All 3 contributor TXs production-ready | Complete |
| 2026-02-04–06 | **Migration Testing Fixes** — PRs #189–#192: titles, UX copy, auth gates | Complete |
| 2026-02-06 | **Unified Studio** (PR #193) — Persistent sidebar, split-pane layout | Complete |
| 2026-02-07 | **Wallet Switch Detection** (PR #194) — Auto-logout on wallet change, closes #47 | Complete |
| **2026-02-06** | **Andamio V2 Mainnet Launch** | Upcoming |

