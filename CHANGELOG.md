# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Documentation reorganization with organized `docs/` folder structure
- Map of Content (MOC) at `docs/README.md` for easy navigation
- CONTRIBUTING.md with development guidelines
- This CHANGELOG.md

### Changed
- Moved all documentation to organized subdirectories
- Updated all internal documentation links

### Removed
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
