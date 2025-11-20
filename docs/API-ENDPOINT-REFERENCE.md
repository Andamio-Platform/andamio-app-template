# API Endpoint Reference & UX Mapping

> **Complete mapping of Andamio Database API endpoints to frontend implementation**
> Last Updated: November 18, 2024
> API Version: **v0.1.0** (Unstable)
> Coverage: **51/52 endpoints (98.08%)**

This document provides a comprehensive reference for all API endpoints, their purpose, and where they are used in the T3 App Template. Use this as the alignment document between backend API and frontend UX.

---

## API Versioning

**Current Version**: `0.1.0` (Unstable)

The Andamio Database API uses **URL-based versioning**:

```
/api/v0/*    - Version 0 (Unstable - breaking changes may occur)
/trpc/v0/*   - Version 0 tRPC endpoints
```

**⚠️ Version 0.x Status**:
- **Unstable** - Breaking changes may occur between minor versions
- Use for **development and testing only**
- Not recommended for production
- Will be stabilized as v1.0.0 once API design is finalized

**Available Endpoints**:
- **Versioned**: `/api/v0/*` (recommended - used throughout this app)
- **Unversioned**: `/api/*` (backward compatibility alias, will be deprecated in v1)

**Documentation**:
- [CHANGELOG.md](../../andamio-db-api/CHANGELOG.md) - All version changes and breaking changes
- [Versioning Policy](../../andamio-db-api/CHANGELOG.md#versioning-policy)

---

## Table of Contents

- [API Versioning](#api-versioning)
- [Authentication](#authentication)
- [User Roles](#user-roles)
- [Courses](#courses)
- [Course Modules](#course-modules)
- [Student Learning Targets (SLTs)](#student-learning-targets-slts)
- [Lessons](#lessons)
- [Assignments](#assignments)
- [Module Introductions](#module-introductions)
- [Assignment Commitments](#assignment-commitments)
- [Learner Progress](#learner-progress)
- [Coverage Summary](#coverage-summary)

---

## Authentication

### POST `/api/v0/auth/login/session`

**Purpose**: Create a login session and return a nonce for wallet signature

**Access**: Public

**Used In**:
- `src/lib/andamio-auth.ts:44` - Initial authentication flow

**Role**: First step of Cardano wallet authentication. User connects wallet, this endpoint generates a unique nonce that must be signed by the wallet to prove ownership.

**Flow**:
```
1. User clicks "Connect Wallet"
2. Frontend calls this endpoint with wallet address
3. Backend returns nonce
4. User signs nonce with wallet
5. Frontend calls /api/v0/auth/login/validate with signature
```

---

### POST `/api/v0/auth/login/validate`

**Purpose**: Validate wallet signature and issue JWT token

**Access**: Public

**Used In**:
- `src/lib/andamio-auth.ts:72` - Authentication completion

**Role**: Second step of authentication. Validates the wallet signature against the nonce, then issues a JWT token for subsequent authenticated requests.

**Output**: JWT token stored in localStorage and used in Authorization header for all protected endpoints.

---

## User Roles

### POST `/api/v0/creator/create`

**Purpose**: Register authenticated user as a Creator

**Access**: Protected (requires JWT)

**Used In**:
- `src/contexts/andamio-auth-context.tsx:27` - Auto-registration on first auth

**Role**: Automatically registers users with Creator role upon first authentication, allowing them to create and manage courses.

---

### POST `/api/v0/learner/create`

**Purpose**: Register authenticated user as a Learner

**Access**: Protected (requires JWT)

**Used In**:
- `src/contexts/andamio-auth-context.tsx:47` - Auto-registration on first auth

**Role**: Automatically registers users with Learner role upon first authentication, allowing them to enroll in courses and complete assignments.

---

## Courses

### GET `/api/v0/courses/published`

**Purpose**: List all published courses (courses with NFT policy ID)

**Access**: Public

**Used In**:
- `src/app/(app)/course/page.tsx:30` - Public course catalog
- `src/components/learner/my-learning.tsx:72` - Learner dashboard

**Role**: Displays all courses that have been published to the Cardano blockchain. These courses are ready for learner enrollment.

---

### GET `/api/v0/courses/owned`

**Purpose**: List courses owned by authenticated user

**Access**: Protected (Creator role)

**Used In**:
- `src/components/courses/owned-courses-list.tsx:49` - Creator dashboard

**Role**: Shows creator their courses for management. Used in studio dashboard to display courses they can edit.

---

### GET `/api/v0/courses/check/{courseCode}`

**Purpose**: Check if a course code is already in use

**Access**: Public

**Used In**:
- `src/components/courses/create-course-dialog.tsx:64` - Course creation form

**Role**: Real-time validation during course creation to prevent duplicate course codes. Provides user feedback before form submission.

---

### GET `/api/v0/courses/{courseNftPolicyId}`

**Purpose**: Get detailed information about a specific course

**Access**: Public

**Used In**:
- `src/app/(app)/course/[coursenft]/page.tsx:40` - Public course detail page
- `src/app/(app)/studio/course/[coursenft]/page.tsx:74` - Studio course edit page

**Role**: Fetches course metadata (title, description, images, video URLs) for display on course pages and editing interfaces.

---

### POST `/api/v0/courses`

**Purpose**: Create a new course

**Access**: Protected (Creator role)

**Used In**:
- `src/components/courses/create-course-dialog.tsx:126` - Course creation dialog

**Role**: Creates a new course with initial metadata. Course starts in draft state (no NFT policy ID) until published to blockchain.

**Input Validation**: Uses `createCourseInputSchema`

---

### PATCH `/api/v0/courses/{courseCode}`

**Purpose**: Update course metadata

**Access**: Protected (Creator role, must own course)

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/page.tsx:147` - Course edit form

**Role**: Updates course title, description, image URLs, and video URLs. Used by creators to refine course presentation.

**Input Validation**: Uses `updateCourseInputSchema`

---

### DELETE `/api/v0/courses/{courseCode}`

**Purpose**: Delete a course and all its content

**Access**: Protected (Creator role, must own course)

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/page.tsx:186` - Course deletion confirmation

**Role**: Permanently removes course, all modules, lessons, SLTs, and assignments. Confirmation dialog prevents accidental deletion.

---

### GET `/api/v0/courses/{courseCode}/unpublished-projects`

**Purpose**: Get unpublished projects (treasuries) that require this course as prerequisite

**Access**: Protected (Creator role)

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/page.tsx:147` - Course dependencies card

**Role**: Shows creators which projects depend on their course as a prerequisite. Helps maintain course stability for dependent projects.

---

## Course Modules

### GET `/api/v0/course-modules/{courseNftPolicyId}/{moduleCode}`

**Purpose**: Get detailed information about a specific module

**Access**: Public

**Used In**:
- `src/app/(app)/course/[coursenft]/[modulecode]/page.tsx:150` - Public module page
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/page.tsx:96` - Studio module edit

**Role**: Fetches module metadata (title, description, status, hashes) for display and editing.

---

### GET `/api/v0/courses/{courseNftPolicyId}/course-modules`

**Purpose**: List all modules for a course with SLTs included

**Access**: Public

**Used In**:
- `src/app/(app)/course/[coursenft]/page.tsx:68` - Public course overview
- `src/app/(app)/studio/course/[coursenft]/page.tsx:92` - Studio course overview

**Role**: Displays module list with SLT counts included in the response. Shows module status and allows navigation to module editors. SLTs are now automatically included in all module listings.

**Benefit**: Single query returns both modules and their SLTs, improving performance.

---

### GET `/api/v0/course-modules/assignment-summary/{courseNftPolicyId}`

**Purpose**: Get modules with assignment summaries and publication status

**Access**: Public

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/page.tsx:119` - Assignment overview dashboard

**Role**: Provides at-a-glance view of all assignments across modules, showing which are live vs. draft. Helps creators manage publication workflow.

---

### POST `/api/v0/course-modules/list`

**Purpose**: Batch query to get modules for multiple courses

**Access**: Public

**Used In**:
- `src/components/courses/owned-courses-list.tsx:70` - Owned courses list with module counts

**Role**: Performance optimization - fetches module counts for multiple courses in single query. Displays module count badges in course list.

**Input**: Array of course codes
**Output**: Record mapping course codes to their modules

---

### POST `/api/v0/course-modules`

**Purpose**: Create a new course module

**Access**: Protected (Creator role, must own course)

**Used In**:
- `src/components/courses/create-module-dialog.tsx:86` - Module creation dialog

**Role**: Adds a new module to a course with title and description. Module starts in DRAFT status.

---

### PATCH `/api/v0/course-modules/{courseNftPolicyId}/{moduleCode}`

**Purpose**: Update module title and description

**Access**: Protected (Creator role, must own course)

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/page.tsx:150` - Module edit form

**Role**: Updates module metadata. Creators use this to refine module information during course development.

---

### PATCH `/api/v0/course-modules/{courseNftPolicyId}/{moduleCode}/status`

**Purpose**: Update module status (DRAFT → APPROVED → PENDING_TX → ON_CHAIN, etc.)

**Access**: Protected (Creator role, must own course)

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/page.tsx:184` - Status dropdown

**Role**: Manages module workflow through states. Status transitions are validated server-side to ensure proper workflow.

**Status Flow**:
```
DRAFT → APPROVED → PENDING_TX → ON_CHAIN
  ↓       ↓           ↓
BACKLOG  ARCHIVED   DEPRECATED
```

---

### PATCH `/api/v0/course-modules/{courseNftPolicyId}/{moduleCode}/code`

**Purpose**: Rename module code identifier

**Access**: Protected (Creator role, must own course)

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/page.tsx:284` - Rename dialog

**Role**: Allows creators to rename module codes. Automatically redirects to new URL after rename. Useful for reorganizing course structure.

---

### PATCH `/api/v0/course-modules/{courseNftPolicyId}/{moduleCode}/pending-tx`

**Purpose**: Set pending transaction hash for blockchain operation

**Access**: Protected (Creator role, must own course)

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/page.tsx:328` - Transaction tracking dialog

**Role**: Tracks on-chain transactions related to module publication. Links to CardanoScan explorer for transaction verification. Only works for DRAFT status modules.

---

### POST `/api/v0/course-modules/{courseNftPolicyId}/{moduleCode}/publish`

**Purpose**: Publish all module content (lessons, introduction, assignments) to live status

**Access**: Protected (Creator role, must own course)

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/page.tsx:368` - Publish all content button

**Role**: Bulk operation to make all module content visible to learners. Sets `live: true` on all lessons, introduction, and assignments in single transaction.

**Benefit**: Avoids need to publish each piece of content individually.

---

### DELETE `/api/v0/course-modules/{courseNftPolicyId}/{moduleCode}`

**Purpose**: Delete module and all its content

**Access**: Protected (Creator role, must own course)

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/page.tsx:224` - Module deletion

**Role**: Permanently removes module and cascades to delete all lessons, SLTs, introduction, and assignments. Confirmation dialog prevents accidents.

---

## Student Learning Targets (SLTs)

### GET `/api/v0/slts/{courseNftPolicyId}/{moduleCode}`

**Purpose**: Get all SLTs for a module

**Access**: Public

**Used In**:
- `src/app/(app)/course/[coursenft]/[modulecode]/page.tsx:162` - Public module page
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/slts/page.tsx:239` - SLT management

**Role**: Lists all learning objectives for a module. Used both for learner viewing and creator management.

---

### GET `/api/v0/slts/{courseNftPolicyId}/{moduleCode}/{moduleIndex}`

**Purpose**: Get a single SLT by module index

**Access**: Public

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/slts/page.tsx:579` - Quick jump feature

**Role**: Allows direct access to specific SLT for editing. Used in "Jump to SLT" feature where creator enters a module index to quickly edit that SLT.

**Use Case**: Deep linking and quick navigation in large SLT lists (up to 25 per module).

---

### POST `/api/v0/slts`

**Purpose**: Create a new Student Learning Target

**Access**: Protected (Creator role, must own course)

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/slts/page.tsx:417` - SLT creation

**Role**: Adds a new learning objective to a module with specific index and text. Maximum 25 SLTs per module.

---

### PATCH `/api/v0/slts/{courseNftPolicyId}/{moduleCode}/{moduleIndex}`

**Purpose**: Update SLT text

**Access**: Protected (Creator role, must own course)

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/slts/page.tsx:476` - SLT edit dialog

**Role**: Modifies the text of a learning objective. Used when refining learning outcomes during course development.

---

### PATCH `/api/v0/slts/batch-update-indexes`

**Purpose**: Reorder multiple SLTs in single operation

**Access**: Protected (Creator role, must own course)

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/slts/page.tsx:355` - Drag-and-drop reordering

**Role**: Updates moduleIndex for multiple SLTs simultaneously. Used when creator reorders SLTs via drag-and-drop interface. More efficient than individual updates.

**Input**: Array of `{ id, newModuleIndex }` pairs

---

### DELETE `/api/v0/slts/{courseNftPolicyId}/{moduleCode}/{moduleIndex}`

**Purpose**: Delete a Student Learning Target

**Access**: Protected (Creator role, must own course)

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/slts/page.tsx:514` - SLT deletion

**Role**: Removes a learning objective from a module. Also deletes associated lesson if one exists.

---

### ⚠️ PATCH `/api/v0/slts/{courseNftPolicyId}/{moduleCode}/{currentModuleIndex}/index`

**Purpose**: Update single SLT's index (reorder one SLT)

**Access**: Protected (Creator role, must own course)

**Used In**: ❌ **Not currently used**

**Role**: Allows reordering a single SLT without batch operation.

**Note**: The app uses the batch endpoint for all reordering (more efficient). This endpoint remains available for API consumers who prefer single-resource operations (CLI tools, scripts, external integrations).

---

## Lessons

### GET `/api/v0/lessons/{courseNftPolicyId}/{moduleCode}/{moduleIndex}`

**Purpose**: Get a specific lesson

**Access**: Public

**Used In**:
- `src/app/(app)/course/[coursenft]/[modulecode]/[moduleindex]/page.tsx:64` - Public lesson view
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/[moduleindex]/page.tsx:94` - Lesson editor

**Role**: Fetches lesson content (title, description, rich text content) for display or editing.

---

### GET `/api/v0/courses/{courseNftPolicyId}/modules/{moduleCode}/lessons`

**Purpose**: List all lessons for a module

**Access**: Public

**Used In**:
- `src/app/(app)/course/[coursenft]/[modulecode]/page.tsx:173` - Module overview
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/slts/page.tsx:250` - SLT management (shows linked lessons)

**Role**: Displays lesson list for learner navigation and creator management. Shows which SLTs have associated lessons.

---

### POST `/api/v0/lessons`

**Purpose**: Create a new lesson

**Access**: Protected (Creator role, must own course)

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/[moduleindex]/page.tsx:206` - Lesson creation

**Role**: Creates lesson content linked to a specific SLT (by moduleIndex). Lessons use Tiptap rich text editor.

---

### PATCH `/api/v0/lessons/{courseNftPolicyId}/{moduleCode}/{moduleIndex}`

**Purpose**: Update lesson content

**Access**: Protected (Creator role, must own course)

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/[moduleindex]/page.tsx:162` - Lesson editing
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/[moduleindex]/page.tsx:205` - Auto-save

**Role**: Updates lesson title, description, and rich text content. Supports auto-save functionality in lesson editor.

---

### DELETE `/api/v0/lessons/{courseNftPolicyId}/{moduleCode}/{moduleIndex}`

**Purpose**: Delete a lesson

**Access**: Protected (Creator role, must own course)

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/[moduleindex]/page.tsx:252` - Lesson deletion

**Role**: Removes lesson content. Does not delete the associated SLT (SLT can exist without lesson).

---

## Assignments

### GET `/api/v0/assignments/{courseNftPolicyId}/{moduleCode}`

**Purpose**: Get assignment for a module

**Access**: Public

**Used In**:
- `src/app/(app)/course/[coursenft]/[modulecode]/assignment/page.tsx:63` - Public assignment view
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/assignment/page.tsx:112` - Assignment editor

**Role**: Fetches assignment details including questions and grading criteria. One assignment per module.

---

### POST `/api/v0/assignments`

**Purpose**: Create a new assignment

**Access**: Protected (Creator role, must own course)

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/assignment/page.tsx:232` - Assignment creation

**Role**: Creates assignment with questions and instructions. Assignments are initially in draft state.

---

### PATCH `/api/v0/assignments/{courseNftPolicyId}/{moduleCode}`

**Purpose**: Update assignment details

**Access**: Protected (Creator role, must own course)

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/assignment/page.tsx:190` - Assignment editing

**Role**: Updates assignment questions, grading criteria, and instructions. Used during course development.

---

### PATCH `/api/v0/assignments/{courseNftPolicyId}/{moduleCode}/publish`

**Purpose**: Publish assignment to make it visible to learners

**Access**: Protected (Creator role, must own course)

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/assignment/page.tsx:306` - Publish button

**Role**: Sets assignment to live status. Learners can only see and submit to published assignments.

---

### DELETE `/api/v0/assignments/{courseNftPolicyId}/{moduleCode}`

**Purpose**: Delete an assignment

**Access**: Protected (Creator role, must own course)

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/assignment/page.tsx:274` - Assignment deletion

**Role**: Removes assignment from module. Also deletes all learner commitments to this assignment.

---

## Module Introductions

### GET `/api/v0/introductions/{courseNftPolicyId}/{moduleCode}`

**Purpose**: Get module introduction content

**Access**: Public

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/introduction/page.tsx:92` - Introduction editor

**Role**: Fetches introduction content that appears at the start of each module. Sets context for learners.

---

### POST `/api/v0/introductions`

**Purpose**: Create module introduction

**Access**: Protected (Creator role, must own course)

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/introduction/page.tsx:203` - Introduction creation

**Role**: Creates introduction content using rich text editor. One introduction per module.

---

### PATCH `/api/v0/introductions/{courseNftPolicyId}/{moduleCode}`

**Purpose**: Update introduction content

**Access**: Protected (Creator role, must own course)

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/introduction/page.tsx:164` - Introduction editing

**Role**: Updates introduction text and formatting. Used to refine module context during development.

---

### PATCH `/api/v0/introductions/{courseNftPolicyId}/{moduleCode}/publish`

**Purpose**: Publish introduction to make it visible to learners

**Access**: Protected (Creator role, must own course)

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/introduction/page.tsx:242` - Publish button

**Role**: Sets introduction to live status. Controls visibility to learners.

---

## Assignment Commitments

### GET `/api/v0/assignment-commitments/{courseNftPolicyId}/{moduleCode}/has-commitments`

**Purpose**: Quick check if module has any learner commitments

**Access**: Public

**Used In**:
- `src/components/learner/my-learning.tsx:103` - Dashboard optimization

**Role**: Performance optimization - checks if course has commitments before loading full list. Reduces unnecessary API calls for courses without learner activity.

**Returns**: `{ hasCommitments: boolean, count: number }`

---

### GET `/api/v0/assignment-commitments/course/{courseNftPolicyId}`

**Purpose**: Get all assignment commitments for a course (instructor view)

**Access**: Protected (Creator role)

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/instructor/page.tsx:141` - Instructor dashboard

**Role**: Shows instructors all learner submissions across the course. Used for grading and progress monitoring.

---

### GET `/api/v0/assignment-commitments/learner/course/{courseNftPolicyId}`

**Purpose**: Get authenticated learner's commitments for a course

**Access**: Protected (Learner role)

**Used In**:
- `src/components/learner/assignment-commitment.tsx:116` - Assignment progress
- `src/components/learner/my-learning.tsx:91` - Learning dashboard

**Role**: Shows learner their progress on course assignments. Displays submission status and evidence.

---

### POST `/api/v0/assignment-commitments`

**Purpose**: Create assignment commitment (learner starts assignment)

**Access**: Protected (Learner role)

**Used In**:
- `src/components/learner/assignment-commitment.tsx:153` - "Start Assignment" button

**Role**: Records learner's intent to complete assignment. Creates initial commitment with NOT_STARTED status.

**Prevents**: Duplicate commitments (enforced by unique constraint)

---

### PATCH `/api/v0/assignment-commitments/{id}/evidence`

**Purpose**: Update learner's assignment submission evidence

**Access**: Protected (Learner role, must own commitment)

**Used In**:
- `src/components/learner/assignment-commitment.tsx:193` - Evidence submission

**Role**: Allows learners to add/update proof of completion (links, descriptions). Evidence is hashed and stored for verification.

---

### DELETE `/api/v0/assignment-commitments/{id}`

**Purpose**: Delete assignment commitment (learner withdraws)

**Access**: Protected (Learner role, must own commitment)

**Used In**:
- `src/components/learner/assignment-commitment.tsx:229` - Withdraw from assignment

**Role**: Allows learners to remove commitment if they decide not to complete assignment.

---

## Learner Progress

### GET `/api/v0/user-course-status/{courseNftPolicyId}`

**Purpose**: Get comprehensive learner progress for a course

**Access**: Protected (Learner role)

**Used In**:
- `src/components/learner/user-course-status.tsx:76` - Course progress card

**Role**: Displays learner's overall progress including completed modules, assignments, and credentials earned. Shows percentage completion.

---

## Coverage Summary

### By Router

| Router | Endpoints Used | Total Endpoints | Coverage | Status |
|--------|----------------|-----------------|----------|--------|
| Auth | 2 | 2 | 100% | ✅ Complete |
| User Roles | 2 | 2 | 100% | ✅ Complete |
| Courses | 8 | 8 | 100% | ✅ Complete |
| Course Modules | 10 | 11 | 90.9% | 🟢 Excellent |
| SLTs | 6 | 7 | 85.7% | 🟢 Excellent |
| Lessons | 5 | 5 | 100% | ✅ Complete |
| Assignments | 5 | 5 | 100% | ✅ Complete |
| Introductions | 3 | 3 | 100% | ✅ Complete |
| Assignment Commitments | 6 | 6 | 100% | ✅ Complete |
| User Progress | 1 | 1 | 100% | ✅ Complete |

### Overall Coverage

**50 of 51 endpoints used (98.04%)**

### Unused Endpoints

1. **`PATCH /slts/{courseNftPolicyId}/{moduleCode}/{currentModuleIndex}/index`**
   - **Reason**: Batch endpoint (`/slts/batch-update-indexes`) is more efficient for UI operations
   - **Availability**: Remains available for external API consumers (CLI tools, scripts)
   - **Recommendation**: Keep for API completeness

---

## Key Patterns

### Authentication Flow
```
1. POST /api/v0/auth/login/session        → Get nonce
2. User signs nonce with wallet
3. POST /api/v0/auth/login/validate       → Get JWT token
4. All subsequent requests use:    Authorization: Bearer {token}
```

### Content Publication Workflow
```
DRAFT → Edit content → APPROVED → Set pending tx → PENDING_TX → ON_CHAIN
                                                                     ↓
                                                              DEPRECATED
```

### Learner Journey
```
1. GET /api/v0/courses/published                    → Browse courses
2. GET /api/v0/courses/{courseNftPolicyId}          → View course details
3. GET /api/v0/courses/.../course-modules           → See modules
4. POST /api/v0/assignment-commitments              → Start assignment
5. PATCH /api/v0/assignment-commitments/.../evidence → Submit work
6. GET /api/v0/user-course-status/...               → Track progress
```

### Creator Journey
```
1. POST /api/v0/courses                             → Create course
2. POST /api/v0/course-modules                      → Add modules
3. POST /api/v0/slts                                → Define learning objectives
4. POST /api/v0/lessons                             → Create lessons
5. POST /api/v0/assignments                         → Create assignments
6. POST /api/v0/course-modules/.../publish          → Publish all content
7. GET /api/v0/assignment-commitments/course/...    → Review submissions
```

---

## Performance Optimizations

### Batch Operations

| Single Operation | Batch Alternative | Benefit |
|------------------|-------------------|---------|
| GET `/api/v0/slts/{...}/{index}` | GET `/api/v0/slts/{...}` | Fetch all SLTs at once |
| PATCH `/api/v0/slts/{...}/{index}/index` | PATCH `/api/v0/slts/batch-update-indexes` | Reorder multiple SLTs |
| Multiple module queries | POST `/api/v0/course-modules/list` | Query multiple courses |

### Combined Queries

| Separate Calls | Combined Endpoint | Reduction |
|----------------|-------------------|-----------|
| GET modules + GET assignments | GET `/api/v0/course-modules/assignment-summary/...` | 2→1 calls |

**Note**: SLTs are now automatically included in all module listings via `GET /api/v0/courses/{courseNftPolicyId}/course-modules`, eliminating the need for separate SLT queries.

### Pre-flight Checks

| Heavy Operation | Pre-check Endpoint | Benefit |
|----------------|-------------------|---------|
| Load all commitments | GET `/api/v0/.../has-commitments` | Skip if none exist |

---

## Security Patterns

### Public Endpoints (19)
- Course browsing and viewing
- Module and lesson content
- SLT viewing
- Pre-flight checks

### Protected Endpoints (32)
- All CREATE operations
- All UPDATE operations
- All DELETE operations
- Learner progress and commitments
- Instructor views

### Authorization Checks
1. **JWT Validation** - All protected endpoints
2. **Role Verification** - Creator vs. Learner endpoints
3. **Ownership Validation** - Can only edit owned resources

---

## Type Safety

All endpoints use shared type definitions from `andamio-db-api`:

```typescript
import {
  type CourseOutput,
  type CreateCourseInput,
  type UpdateCourseInput,
  createCourseInputSchema,
  updateCourseInputSchema,
} from "andamio-db-api";
```

**Benefits**:
- Compile-time type checking
- Auto-complete in IDEs
- Runtime validation with Zod schemas
- No type drift between API and frontend

---

## Maintenance Notes

### Adding New Endpoints

1. Define in API router with OpenAPI metadata
2. Export types and schemas from `andamio-db-api`
3. Build API: `npm run build` in `andamio-db-api/`
4. Types automatically available in template
5. Implement UI using `authenticatedFetch`
6. Update this document

### Deprecating Endpoints

1. Mark as deprecated in OpenAPI docs
2. Add migration guide
3. Update UI to use replacement
4. Monitor usage via logs
5. Remove after grace period

### Version Strategy

Currently v1 (no versioning path in URLs). When breaking changes needed:
- Add `/v2/` path prefix
- Maintain both versions
- Document migration path
- Sunset v1 after adoption

---

## Related Documentation

- [API Design Principles](../../andamio-db-api/API-DESIGN-PRINCIPLES.md)
- [Authentication Guide](../../andamio-db-api/AUTHENTICATION.md)
- [Database API README](../../andamio-db-api/README.md)
- [Input Validation Patterns](./patterns/input-validation.md)

---

**Last Updated**: November 18, 2024
**Maintained By**: Andamio Platform Team
**Questions**: File an issue or update this doc via PR
