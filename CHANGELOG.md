# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **StudioModuleCard Component**: New extracted component for displaying course modules in studio with 6-step progress indicator, status icons, and configurable display options
- **Inline Lesson Editing**: Lessons now edited inline in the wizard (like assignments) with expandable/collapsible editors, title input, and full ContentEditor
- **RequireCourseAccess loadingVariant**: New prop to match loading skeleton style to page layout (`page`, `studio-centered`, `studio-split`), prevents loading screen "flash" during navigation
- **Course Module/SLT Reference Convention**: New naming rule requiring Course Modules to be referenced by Module Code and SLTs by `<module-code>.<module-index>` format (e.g., "101.3")
- **Course Preview Panel**: Redesigned `/studio/course` landing page with hero section, stat grid (Modules, On-Chain, SLTs), centered CTA, and module code list
- **AndamioText Component**: Standardized text component with 5 variants (default, muted, small, lead, overline) replacing loose `<p className=...>` patterns throughout the codebase
- **Claude Skills System**: Migrated documentation from `docs/` to `.claude/skills/` for better AI-assisted development
  - `documentarian` skill for documentation maintenance
  - `review-styling` skill for style guide enforcement
  - `audit-api-coverage` skill for API coverage tracking
  - `project-manager` skill for project status tracking
- **New Andamio Components**: `AndamioEmptyState`, `AndamioNotFoundCard`, `AndamioPageLoading`, `AndamioStatCard`
- **New Course Components**: `CourseModuleCard`, `LessonMediaSection`, `SLTLessonTable`
- **New Studio Components**: `StudioCourseCard`, `StudioHubCard`
- **New Hooks**: `useModuleWizardData`, `useWizardNavigation`
- **Authorization Component**: `RequireCourseAccess` for course-level access control
- Global heading styles in `globals.css` with `!important` to override Tailwind preflight

### Changed
- **Blueprint → Credential Rename**: Renamed wizard step from "Blueprint" to "Credential" across all files (`step-blueprint.tsx` → `step-credential.tsx`, `WizardStepId` type, step order, completion state)
- **SLT Display Format**: SLT items now show `<module-code>.<module-index>` reference badge instead of sequential numbers
- **Input Border Fix**: Fixed invisible borders on form inputs by using `border-border` class consistently in globals.css
- Migrated all documentation from `docs/` folder to `.claude/skills/` directories
- All Andamio wrapper components now consistently export with `Andamio` prefix
- Updated all `<p className=...>` patterns to use `AndamioText` component (232+ occurrences)

### Fixed
- **Silent Refetch on Save**: `useModuleWizardData` no longer shows full loading screen when saving assignment/lesson content, uses `hasLoadedRef` to distinguish initial load from refetch
- **Error Boundary Hydration**: Removed duplicate `<html>` and `<body>` tags from `error.tsx` (only `global-error.tsx` should have these)
- **Optimistic SLT Updates**: Fixed React render error by moving `updateSlts` calls outside of state setter callbacks

### Removed
- `docs/` folder contents (migrated to `.claude/skills/`)
- Deprecated TODO-TRANSACTION-CONFIRMATION.md (superseded by PENDING-TX-WATCHER.md)
- NBA (Node Backend API) references throughout documentation

## [0.4.0] - 2025-12-11

### Added
- **Creator Studio**: Full course and module editing interface
  - Tabbed interface for course management
  - Rich text editing with Tiptap
  - On-chain sync for course publishing
- **Project System** (in progress): Treasury and task management foundation
- **Responsive Design**: Full mobile/tablet support with Andamio layout components
  - `AndamioPageHeader`, `AndamioSectionHeader`, `AndamioTableContainer`
  - Breakpoints from xs (375px) to 2xl (1536px)
- **Pending Transaction System**: Automatic blockchain transaction monitoring
  - `usePendingTxWatcher` hook
  - `PendingTxPopover` component
  - Database-backed transaction tracking
- **Semantic Color System**: Full light/dark mode with semantic variables
  - success, warning, info, destructive status colors
  - Consistent theming across all components
- **68+ Andamio UI Components**: shadcn/ui wrappers with enhanced features

### Changed
- Upgraded to Next.js 15 with App Router
- Upgraded to Tailwind CSS v4 with CSS-first configuration
- Transaction endpoints migrated to Andamioscan

### Fixed
- Various type safety improvements
- Editor content persistence issues

## [0.3.0] - 2025-11-XX

### Added
- Course & Learning system with 8 transactions and 129 tests
- Full learner lifecycle (enroll, progress, complete)
- Assignment commitment workflow
- Module credential issuance

### Changed
- Migrated from tRPC v10 to v11
- Updated Mesh SDK to latest beta

## [0.2.0] - 2025-10-XX

### Added
- Initial T3 Stack setup
- Cardano wallet integration via Mesh SDK
- JWT authentication with wallet signatures
- Basic course listing and viewing

### Changed
- Restructured to use App Router

## [0.1.0] - 2025-09-XX

### Added
- Initial project setup
- Basic Next.js configuration
- shadcn/ui component library installation
- Tailwind CSS configuration

---

[Unreleased]: https://github.com/Andamio-Platform/andamio-t3-app-template/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/Andamio-Platform/andamio-t3-app-template/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/Andamio-Platform/andamio-t3-app-template/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/Andamio-Platform/andamio-t3-app-template/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/Andamio-Platform/andamio-t3-app-template/releases/tag/v0.1.0
