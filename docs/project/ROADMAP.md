# Andamio T3 Template - Development Roadmap

> **Strategy**: Build incrementally, test thoroughly, establish patterns that scale

This roadmap outlines the phased development of the Andamio T3 App Template as we implement the full Andamio platform feature set.

---

## Roadmap Overview

```
Phase 1: Course & Learning System (✅ COMPLETE)
    └─> Established patterns for transactions, DB APIs, UI components

Phase 2: Access Token & Global State (⏳ CURRENT)
    └─> User identity and platform-wide state management

Phase 3: Project & Contribution System (📋 NEXT)
    └─> Treasury management, contributor workflows, project lifecycle

Phase 4: Polish & Publish (🎯 FUTURE)
    └─> Package extraction, template publishing, documentation site
```

---

## ✅ Phase 1: Course & Learning System (COMPLETE)

**Duration**: Initial development through 2024-11-22
**Status**: All 8 transactions integrated, 129 tests passing

### What We Built

**Core Infrastructure**
- ✅ Database API with tRPC + OpenAPI dual interface
- ✅ JWT authentication with Cardano wallet signatures
- ✅ Role-based authorization (Learner, Creator)
- ✅ Transaction definition system with side effects
- ✅ Pending transaction monitoring (client + database)
- ✅ Hash handling patterns (on-chain computation, immutability)

**Database Schema**
- ✅ Course, Module, SLT (Student Learning Target)
- ✅ Assignment, AssignmentCommitment
- ✅ User, Learner roles
- ✅ Pending transaction tracking

**Transactions (8)**
- ✅ Course Creator: MINT_MODULE_TOKENS, ACCEPT_ASSIGNMENT, DENY_ASSIGNMENT
- ✅ Student: MINT_LOCAL_STATE, BURN_LOCAL_STATE, COMMIT_TO_ASSIGNMENT, UPDATE_ASSIGNMENT, LEAVE_ASSIGNMENT

**UI Components**
- ✅ Course listing and detail pages
- ✅ Student progress dashboard
- ✅ Assignment submission flow with Tiptap editor
- ✅ Instructor review dashboard
- ✅ Enrollment/unenrollment flows

### Patterns Established

These patterns will be reused in future phases:

1. **Transaction Definition Pattern**
   - Protocol spec (YAML reference, required tokens, costs)
   - Build config (input schemas, API endpoint)
   - Side effects (onSubmit, onConfirmation with path params and body fields)
   - UI metadata (button text, descriptions, success messages)
   - Documentation links

2. **Hash Handling Pattern**
   - Two-step: submission (empty hash) → confirmation (extract from on-chain data)
   - Immutability enforcement in database
   - Extraction from `onChainData.dataHash` or `onChainData.mints[0].assetName`
   - Critical confirmation endpoints for hash updates

3. **Database API Pattern**
   - URL-based versioning (`/api/v0/*`)
   - On-chain identifiers (never internal database IDs)
   - PENDING_TX protection (status updates blocked during pending transactions)
   - Confirmation endpoints require transaction hash proof

4. **UI Integration Pattern**
   - Generic `AndamioTransaction` component
   - Conditional rendering based on status
   - Input helper functions for complex data formatting
   - Success callbacks trigger data refetch/UI updates

### Key Learnings

✅ **What Worked Well**
- Type safety via workspace symlinks
- Transaction definition as single source of truth
- Side effect declarative syntax
- Hash handling patterns from blockchain

⚠️ **What Needs Improvement**
- API versioning still on v0 (unstable)
- Some manual refetching (window.location.reload)
- Need better error handling patterns
- Documentation could be more discoverable

---

## ⏳ Phase 2: Access Token & Global State (CURRENT PHASE)

**Estimated Duration**: 2-3 weeks
**Focus**: User identity and platform-wide state management

### Goals

**Primary Objectives**
1. Implement user access token minting and management
2. Establish global state tracking and synchronization
3. Create user onboarding flow for first-time users
4. Build foundation for cross-system user identity

**Success Criteria**
- ✅ Users can mint access tokens via MINT_ACCESS_TOKEN transaction
- ✅ Access tokens properly tracked in database
- ✅ Global state synchronized with blockchain
- ✅ First-time user flow guides through token creation
- ✅ All patterns from Phase 1 applied consistently

### Planned Work

#### Database Schema Additions

```prisma
model AccessToken {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(...)
  policyId        String
  alias           String
  status          AccessTokenStatus @default(PENDING_TX)
  pendingTxHash   String?
  mintedAt        DateTime?

  @@unique([policyId, alias])
  @@index([userId])
}

enum AccessTokenStatus {
  PENDING_TX
  MINTED
  BURNED
}

model GlobalState {
  id                    String   @id @default(cuid())
  lastSyncedBlock       Int
  totalAccessTokens     Int
  totalCourses          Int
  totalProjects         Int
  syncStatus            SyncStatus @default(SYNCING)
  lastSyncedAt          DateTime

  @@index([lastSyncedBlock])
}
```

#### API Endpoints (Estimated: 5-8)

**Access Token**
- GET `/access-tokens/user/{userId}` - List user tokens
- GET `/access-tokens/{policyId}/{alias}` - Get specific token
- POST `/access-tokens` - Register minted token
- PATCH `/access-tokens/{policyId}/{alias}/status` - Update status
- DELETE `/access-tokens/{policyId}/{alias}` - Burn token

**Global State**
- GET `/global-state` - Current state
- GET `/global-state/history` - Historical snapshots
- PATCH `/global-state/sync` - Trigger sync

#### Transactions (2)

**MINT_ACCESS_TOKEN**
- **Role**: General (anyone)
- **Purpose**: Create user identity on Andamio
- **Required Tokens**: None (entry point to platform)
- **Side Effects**:
  - onSubmit: Create AccessToken record with PENDING_TX
  - onConfirmation: Update to MINTED, store on-chain data
- **UI**: Onboarding wizard, token alias selection

**PUBLISH_TX** (Generic)
- **Role**: General
- **Purpose**: Utility for publishing pre-built transactions
- **Required Tokens**: TBD
- **Use Case**: Advanced features, developer tools

#### UI Components

**Access Token Pages**
- `/dashboard` - Token management overview
- `/onboard` - First-time user wizard
- Token minting form with alias validation
- Token status display (pending, minted, burned)

**Global State Display**
- Platform statistics widget
- Network health indicators
- Last sync timestamp

### Dependencies & Blockers

**Required from Protocol Team**
- ✅ MINT_ACCESS_TOKEN validator specification
- ✅ Access token structure (policy ID format, alias rules)
- ⏳ Global state update mechanism (how often, what triggers)

**Technical Dependencies**
- ✅ Existing authentication system (ready)
- ✅ Transaction execution framework (ready)
- ⏳ Koios API for access token queries

### Testing Strategy

- Unit tests for transaction definitions (following Phase 1 patterns)
- Integration tests for access token minting flow
- Manual testing of onboarding UX
- Test cross-system token usage (Course enrollment with new token)

---

## 📋 Phase 3: Project & Contribution System (NEXT)

**Estimated Duration**: 4-6 weeks
**Focus**: Treasury management, contributor workflows, project lifecycle

### Goals

**Primary Objectives**
1. Implement full project local state system
2. Build contributor commitment and review workflows
3. Integrate treasury management and fund distribution
4. Create project marketplace/discovery UI

**Success Criteria**
- ✅ Contributors can join projects and commit to milestones
- ✅ Project creators can review and approve work
- ✅ Treasury funds properly tracked and distributed
- ✅ Complete project lifecycle demonstrated (creation → contributions → payouts)

### Planned Work

#### Database Schema Additions (Estimated: 10+ models)

**Project Core**
```prisma
model Project {
  id                  String         @id @default(cuid())
  projectNftPolicyId  String?        @unique
  projectCode         String         @unique
  title               String
  description         String?
  status              ProjectStatus  @default(DRAFT)
  treasuryPolicyId    String?

  milestones          Milestone[]
  contributors        Contributor[]
  treasury            Treasury?
}

model Milestone {
  id              String           @id @default(cuid())
  milestoneCode   String
  projectId       String
  project         Project          @relation(...)
  title           String
  description     String?
  rewardAmount    Int              // in lovelace
  status          MilestoneStatus  @default(OPEN)

  commitments     ContributorCommitment[]
}
```

**Contributor System**
```prisma
model Contributor {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(...)
  projectId       String
  project         Project   @relation(...)
  status          ContributorStatus @default(ACTIVE)
  joinedAt        DateTime  @default(now())

  commitments     ContributorCommitment[]
}

model ContributorCommitment {
  id                    String                    @id @default(cuid())
  milestoneId           String
  milestone             Milestone                 @relation(...)
  contributorId         String
  contributor           Contributor               @relation(...)
  networkStatus         ContributorNetworkStatus  @default(AWAITING_COMMITMENT)
  networkEvidence       Json?
  networkEvidenceHash   String?
  pendingTxHash         String?
  rewardClaimed         Boolean                   @default(false)
}
```

**Treasury**
```prisma
model Treasury {
  id                String              @id @default(cuid())
  projectId         String              @unique
  project           Project             @relation(...)
  treasuryPolicyId  String              @unique
  totalFunds        Int                 // in lovelace
  allocatedFunds    Int                 @default(0)
  distributedFunds  Int                 @default(0)

  allocations       TreasuryAllocation[]
  distributions     TreasuryDistribution[]
}
```

#### API Endpoints (Estimated: 20-30)

**Project Management**
- CRUD operations for projects, milestones
- Project discovery and filtering
- Contributor management

**Contributor Workflows**
- Join/leave project flows
- Milestone commitment CRUD
- Work submission and review

**Treasury Operations**
- Fund tracking and allocation
- Distribution history
- Reward claiming

#### Transactions (9+)

**Contributor Transactions (5)**
- `MINT_PROJECT_STATE` - Join project as contributor
- `BURN_PROJECT_STATE` - Leave project and claim rewards
- `COMMIT_PROJECT` - Commit to project milestone
- `UPDATE_PROJECT` - Update project commitment
- `LEAVE_PROJECT` - Withdraw from project commitment

**Project Creator Transactions (4+)**
- `MINT_TREASURY_TOKEN` - Initialize project treasury
- `ACCEPT_PROJECT` - Accept contributor's work
- `DENY_PROJECT` - Reject contributor's work
- `DISTRIBUTE_TREASURY` - Distribute project funds

**Admin/Governance** (TBD)
- `INIT_COURSE` - Initialize new course
- `ADD_COURSE_CREATORS` - Grant creator permissions
- Additional admin transactions as needed

#### UI Components

**Project Pages**
- `/projects` - Project marketplace/discovery
- `/projects/[projectnft]` - Project detail page
- `/projects/[projectnft]/milestones` - Milestone listing
- `/projects/[projectnft]/contributors` - Contributor dashboard
- `/projects/[projectnft]/treasury` - Treasury overview

**Contributor Dashboard**
- My projects
- Active commitments
- Pending rewards
- Work submission interface (similar to assignments)

**Treasury Management**
- Fund allocation interface
- Distribution controls
- Payout history
- Contributor earnings

### Dependencies & Blockers

**Required from Protocol Team**
- ⏳ Project Local State validator specifications
- ⏳ Treasury management validator specs
- ⏳ Token distribution mechanisms
- ⏳ Multi-signature requirements (if any)

**Technical Dependencies**
- ✅ Transaction execution framework (ready from Phase 1)
- ✅ Hash handling patterns (established in Phase 1)
- ⏳ Treasury balance queries (Koios integration)
- ⏳ Multi-asset support in UI

### Challenges & Risks

**Technical Challenges**
- Treasury management complexity (multi-sig, escrow patterns)
- Reward distribution logic (multiple contributors per milestone)
- State synchronization across many contributors
- Performance with large contributor sets

**Design Challenges**
- Contributor discovery (how do projects find contributors?)
- Milestone definition (how granular? how to price?)
- Dispute resolution (what if work is rejected?)
- Incentive alignment (fair reward distribution)

**Mitigation Strategies**
- Start with simple treasury (single-sig, simple distribution)
- Iterate on contributor workflows based on Course system patterns
- Prototype UI early to identify UX issues
- Build admin tools for manual intervention initially

---

## 🎯 Phase 4: Polish & Publish (FUTURE)

**Estimated Duration**: 3-4 weeks
**Focus**: Package extraction, template publishing, documentation

### Goals

**Primary Objectives**
1. Extract reusable packages to npm
2. Publish clean template for community
3. Create comprehensive documentation site
4. Establish contribution guidelines

### Package Extraction Plan

**@andamio/core** (Planned)
- API client with type-safe wrappers
- Authentication utilities
- Common hooks and utilities
- Type definitions from db-api

**@andamio/transactions** (Ready)
- Transaction definition system
- Input helpers
- Side effect utilities
- Already developed, ready to publish

**@andamio/ui** (Planned)
- shadcn/ui extensions
- Andamio-specific components
- Theme configurations
- Component library

**@andamio/tiptap** (Planned)
- Tiptap editor wrapper
- Extension kits (Base, Basic, Full, ReadOnly)
- Evidence submission utilities
- Markdown conversion

**@andamio/mesh** (Planned)
- Mesh SDK utilities
- Wallet connection abstractions
- Transaction building helpers
- Cardano-specific utilities

### Template Publishing

**andamio-t3-template** (Clean Version)
- Remove monorepo-specific config
- Replace workspace imports with npm packages
- Minimal, production-ready starter
- Clear documentation and examples

**Template Features**
- Authentication ready (wallet + JWT)
- Database API integration
- Transaction system integrated
- UI component library
- Example pages for all systems

### Documentation Site

**docs.andamio.io Updates**
- API reference (auto-generated from OpenAPI)
- Transaction catalog (all definitions documented)
- Integration guides (step-by-step)
- Best practices and patterns
- Migration guides (v0 → v1)

### Success Criteria
- ✅ All packages published to npm
- ✅ Template available via `npx create-andamio-app`
- ✅ Documentation site live and comprehensive
- ✅ Community can build Andamio apps independently

---

## Timeline & Milestones

```
┌─────────────────────────────────────────────────────────────┐
│ 2024 Q4                                                     │
├─────────────────────────────────────────────────────────────┤
│ ✅ Phase 1: Course System (Complete)                       │
│    └─> 8 transactions, 129 tests, full integration         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 2024 Q4 - 2025 Q1                                          │
├─────────────────────────────────────────────────────────────┤
│ ⏳ Phase 2: Access Token & Global State                    │
│    └─> User identity, platform state, onboarding           │
│                                                             │
│ 📋 Phase 3: Project & Contribution System                  │
│    └─> Treasury, contributors, project lifecycle           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 2025 Q1-Q2                                                  │
├─────────────────────────────────────────────────────────────┤
│ 🎯 Phase 4: Polish & Publish                               │
│    └─> Package extraction, template publishing, docs       │
└─────────────────────────────────────────────────────────────┘
```

---

## Decision Log

### Key Decisions Made

**2024-11-22: Course System "Good Enough"**
- **Decision**: Declare Course DB APIs and Transactions complete for now
- **Rationale**: All 8 transactions integrated and tested, patterns established
- **Next**: Move to Access Token & Global State systems
- **Impact**: Can reference Course system as template for future development

**2024-11-22: Hash Handling Patterns Established**
- **Decision**: Document hash handling patterns in dedicated HASH-HANDLING.md files
- **Rationale**: Reusable pattern will apply to Projects and other systems
- **Implementation**: On-chain computation, two-step pattern, immutability
- **Impact**: All future systems will follow this pattern

**Earlier: Dual API Interface (tRPC + OpenAPI)**
- **Decision**: Maintain both tRPC and REST endpoints from single codebase
- **Rationale**: Type safety for TypeScript, accessibility for other languages
- **Trade-off**: Slight complexity increase, but worth the flexibility

**Earlier: URL-Based Versioning**
- **Decision**: Use `/api/v0/*` style versioning
- **Rationale**: Clear version boundaries, easy to run multiple versions
- **Status**: Currently on v0 (unstable), will stabilize to v1

**2025-12-12: Task Expiration UI Handling**
- **Decision**: Tasks with `ON_CHAIN` status that have passed their `expiration_time` show only "Expired" badge (not "Live")
- **Implementation**: Client-side time comparison in `project/[treasurynft]/page.tsx` (line 108-114)
- **Rationale**: Clearer UX - expired tasks are visually distinct from active tasks
- **Open Questions**:
  - Should expired tasks be filtered out entirely or kept visible?
  - Should API provide a computed `is_expired` field vs client-side calculation?
  - How should expiration affect task commitments (can contributors still commit to expired tasks)?
  - Should there be a grace period after expiration before marking as expired?
- **Status**: Interim solution - needs product decision on expired task behavior

### Open Questions

**Access Token System**
- How should alias validation work? (uniqueness, format rules)
- What happens if user loses access token?
- Can users have multiple access tokens?

**Project System**
- How are milestone rewards determined?
- What's the dispute resolution process?
- How do we handle partial completion?
- **Task Expiration**: Should expired tasks remain claimable? What happens to in-progress commitments when a task expires?
- **Expiration Grace Period**: Should there be a buffer period between `expiration_time` and hard cutoff?
- **Expired Task Visibility**: Should expired tasks be hidden, archived, or remain fully visible?
- **Server vs Client Expiration Logic**: Should expiration status be computed server-side or client-side?

**Treasury Management**
- Single-sig or multi-sig for initial version?
- How to handle fund escrow?
- What's the distribution trigger mechanism?

---

## Contributing to the Roadmap

This roadmap is a living document. As we learn from each phase, we'll update future phases accordingly.

**Current Focus**: Phase 2 (Access Token & Global State)

**How to Contribute**:
1. Identify patterns from Phase 1 that should be reused
2. Propose API endpoints or transaction definitions
3. Share UX insights from Course system
4. Document learnings and gotchas

**Feedback Welcome On**:
- Priority ordering of features
- Technical approach and architecture
- User experience and workflows
- Testing and quality strategies

---

## Appendix: Metrics & KPIs

### Development Velocity

**Phase 1 Metrics**
- Duration: ~6-8 weeks (estimated)
- Transactions Implemented: 8
- Tests Written: 129
- Documentation Files: 35+ (across all packages)
- Lines of Code: ~15,000+ (estimated)

### Quality Metrics

**Test Coverage**
- Transaction Definitions: 100% (all 8 have tests)
- Side Effects: Comprehensive (path params, body, validation)
- UI Components: Manual testing (automated tests TBD)

**Documentation Coverage**
- API Endpoints: Documented in code + API-TYPE-REFERENCE.md
- Transactions: Documented in definitions + README.md
- Hash Handling: Dedicated guides (HASH-HANDLING.md x2)
- Integration: Multiple guides (T3-INTEGRATION.md, etc.)

### Success Metrics (Proposed)

**Phase 2 Success**
- Access token minting success rate > 95%
- Onboarding completion rate > 80%
- Global state sync latency < 5 seconds

**Phase 3 Success**
- Project creation to first contribution < 24 hours
- Contributor satisfaction score > 4/5
- Treasury distribution accuracy = 100%

**Phase 4 Success**
- Template downloads > 100 in first month
- Community contributions > 5 PRs
- Documentation satisfaction > 4/5
