# Project Status

> **Last Updated**: February 10, 2026

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

## 📌 NEXT SESSION PROMPT

> **What shipped Feb 4–7 (migration testing + unified studio)**:
>
> **PR #189** — `fix: display titles instead of asset hashes on dashboard`
> **PR #190** — `fix: normalize UX copy — replace jargon with user-friendly language`
> **PR #191** — `fix: add inline ConnectWalletPrompt for wallet reconnect`
> **PR #192** — `fix: standardize connect-wallet auth gate across all pages`
> **PR #193** — `feat: unified studio with persistent sidebar layout`
> **PR #194** — `feat(EUS-47): Detect when wallet changes`
>
> **Unified Studio (PR #193)** — Major UX consolidation:
> - Persistent sidebar listing all courses and projects in split-pane layout
> - Studio routes moved from `(app)` to `(studio)` group with dedicated layout
> - Context-based state management for create flows (no URL params)
> - Prerequisites tooltip on project hover in sidebar
> - Sidebar hides in module wizard mode
> - Reusable `CopyId` component created (`src/components/andamio/copy-id.tsx`) — not yet wired into detail pages
>
> **Wallet Switch Detection (PR #194)** — Closes #47:
> - Auth context polls wallet address every 2s
> - Auto-logout when wallet changes during active session
> - Prevents session hijacking / data leakage
>
> ---
>
> **Remaining Open Issues (prioritized)**:
>
> | Issue | Priority | Notes |
> |-------|----------|-------|
> | #241 - Course detail returns content: null | 🔴 High | Missing title |
> | #224 - Create Access Token screen flashes | 🔴 High | UX bug |
> | #221 - Top bar disappears on course pages | 🔴 High | Layout bug |
> | #240 - Manager/Teacher invitation flow | 🟡 Medium | Consent before on-chain TX |
> | #239 - Project managers stale data | 🟡 Medium | Cache/sync issue |
> | #223 - Wrong pending review count | 🟡 Medium | Dashboard bug |
> | #222 - Processing message persists | 🟡 Medium | Assignment submission |
> | #220 - Simplified commitment lifecycle | 🟡 Medium | Frontend update |
> | #216 - Commitment state healing | 🟡 Medium | Gateway integration |
> | #214 - Dashboard API waterfall | 🟡 Medium | Performance |
> | #212 - Assignment status 'Unknown' | 🟡 Medium | Status mapping |
> | #144 - Batch assessment bug | 🟡 Medium | Only processes one module |
>
> ---
>
> **Issues resolved by recent work**:
> - **#47** — Auto-logout on wallet change → ✅ Closed by PR #194
> - **#187** — Studio projects: sortable lists, full policy ID, copy button → **Partially resolved** by unified studio (PR #193). CopyId component exists but not wired. Sorting not yet implemented.
> - **#188** — Studio courses: full course_id + unified studio UX → **Partially resolved**. Unified studio UX is done (the main discussion point). CopyId not yet wired.
>
> ---
>
> **Known API bugs**:
>
> - `/course/user/modules/` returns empty for on-chain-only courses — API team notified
>
> ---
>
> **Next Work**: High-priority bugs (#241 content:null, #224 token flash, #221 top bar) → #220 simplified commitment lifecycle → #214 dashboard performance

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

| Blocker | Priority | Status | Notes |
|---------|----------|--------|-------|
| **Access token mint fails on preprod** (#118) | 🔴 High | Open | Bug report from preprod.app.andamio.io |
| **Teacher assessment fires multiple TXs** (#182) | 🟡 Medium | PR #195 | Batched into single TX |
| **Project Hooks Migration** (#103) | 🟡 Medium | In Progress | 3 missing hooks: `useAssessCommitment`, `useClaimCommitment`, `useLeaveCommitment` |
| **Modules endpoint empty for on-chain courses** | 🟡 Medium | Waiting on API team | `/course/user/modules/` returns `[]` for on-chain-only courses |
| **ProjectTask sync errors** (#55) | 🟡 Medium | Open | Task manage TX sync failures |
| **Extra signature after mint** (#32) | 🟡 Medium | Open | Auth flow improvement |

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

