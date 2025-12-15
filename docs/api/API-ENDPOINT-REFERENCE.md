# API Endpoint Reference & UX Mapping

> **Complete mapping of Andamio Database API endpoints to frontend implementation**
> Last Updated: December 15, 2024
> API Version: **v0.5.0** (Unstable)
> Coverage: **51/52 endpoints (98.08%)**

This document provides a comprehensive reference for all API endpoints, their purpose, and where they are used in the T3 App Template. Use this as the alignment document between backend API and frontend UX.

---

## API Design Pattern

**All endpoints use POST requests with JSON bodies** (except `/transaction/pending-transactions` which is GET).

This design pattern provides:
- Consistent request format across all operations
- JSON bodies for all parameters (no URL parameters)
- snake_case field naming convention
- Action-based endpoint paths (e.g., `/course/get`, `/course/create`)

### Request Format

```typescript
// All requests use this format
const response = await fetch(`${API_URL}/endpoint-name`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ field_name: value }),
});

// Authenticated requests add Bearer token
const response = await authenticatedFetch(`${API_URL}/endpoint-name`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ field_name: value }),
});
```

---

## API Versioning

**Current Version**: `v0.5.0` (Unstable)

The Andamio Database API uses **URL-based versioning**:

```
/api/v0/*    - Version 0 (Unstable - breaking changes may occur)
/trpc/v0/*   - Version 0 tRPC endpoints
```

**Version 0.x Status**:
- **Unstable** - Breaking changes may occur between minor versions
- Use for **development and testing only**
- Not recommended for production
- Will be stabilized as v1.0.0 once API design is finalized

**Documentation**:
- [CHANGELOG.md](../../andamio-db-api/CHANGELOG.md) - All version changes and breaking changes
- [Versioning Policy](../../andamio-db-api/CHANGELOG.md#versioning-policy)

---

## Table of Contents

- [API Design Pattern](#api-design-pattern)
- [API Versioning](#api-versioning)
- [Authentication](#authentication)
- [Access Token Management](#access-token-management)
- [Courses](#courses)
- [Course Modules](#course-modules)
- [Student Learning Targets (SLTs)](#student-learning-targets-slts)
- [Lessons](#lessons)
- [Assignments](#assignments)
- [Module Introductions](#module-introductions)
- [Assignment Commitments](#assignment-commitments)
- [Learner Progress](#learner-progress)
- [Pending Transactions](#pending-transactions)
- [Coverage Summary](#coverage-summary)

---

## Authentication

### POST `/api/v0/auth/login/session`

**Purpose**: Create a login session and return a nonce for wallet signature

**Access**: Public

**Request Body**:
```json
{
  "stake_address": "stake1..."
}
```

**Used In**:
- `src/lib/andamio-auth.ts` - Initial authentication flow

**Flow**:
```
1. User clicks "Connect Wallet"
2. Frontend calls this endpoint with stake address
3. Backend returns nonce
4. User signs nonce with wallet
5. Frontend calls /api/v0/auth/login/validate with signature
```

---

### POST `/api/v0/auth/login/validate`

**Purpose**: Validate wallet signature and issue JWT token

**Access**: Public

**Request Body**:
```json
{
  "stake_address": "stake1...",
  "signature": "...",
  "key": "..."
}
```

**Used In**:
- `src/lib/andamio-auth.ts` - Authentication completion

**Output**: JWT token stored in localStorage and used in Authorization header for all protected endpoints.

---

## Access Token Management

### POST `/api/v0/access-token/update-alias`

**Purpose**: Update user's access token alias

**Access**: Protected (requires JWT)

**Request Body**:
```json
{
  "access_token_alias": "my-alias"
}
```

**Used In**:
- `src/contexts/andamio-auth-context.tsx` - Sync alias on login
- `src/components/transactions/mint-access-token.tsx` - Update alias after minting

---

### POST `/api/v0/access-token/update-unconfirmed-tx`

**Purpose**: Update user's unconfirmed transaction hash

**Access**: Protected (requires JWT)

**Request Body**:
```json
{
  "tx_hash": "abc123..."
}
```

**Used In**:
- `src/hooks/use-andamio-transaction.ts` - Track pending transactions

---

### POST `/api/v0/creator/create`

**Purpose**: Register authenticated user as a Creator

**Access**: Protected (requires JWT)

**Request Body**:
```json
{}
```

**Used In**:
- `src/contexts/andamio-auth-context.tsx` - Auto-registration on first auth

---

### POST `/api/v0/learner/create`

**Purpose**: Register authenticated user as a Learner

**Access**: Protected (requires JWT)

**Request Body**:
```json
{}
```

**Used In**:
- `src/contexts/andamio-auth-context.tsx` - Auto-registration on first auth

---

### POST `/api/v0/my-learning/get`

**Purpose**: Get learner's courses with assignment progress

**Access**: Protected (Learner role)

**Request Body**:
```json
{}
```

**Used In**:
- `src/components/learner/my-learning.tsx` - My Learning dashboard

**Returns**: All courses where learner has commitments, with completion counts.

---

## Courses

### GET `/api/v0/course/published`

**Purpose**: List all published courses (courses with NFT policy ID)

**Access**: Public

**Used In**:
- `src/app/(app)/course/page.tsx` - Public course catalog

---

### POST `/api/v0/course/list`

**Purpose**: List courses owned by authenticated user

**Access**: Protected (Creator role)

**Request Body**:
```json
{}
```

**Used In**:
- `src/hooks/use-owned-courses.ts` - Creator dashboard
- `src/components/courses/on-chain-courses-section.tsx` - Course management

---

### POST `/api/v0/course/check`

**Purpose**: Check if a course code is already in use

**Access**: Public

**Request Body**:
```json
{
  "course_code": "my-course-101"
}
```

**Used In**:
- `src/components/courses/create-course-dialog.tsx` - Course creation validation

**Returns**: `boolean` - true if course code exists

---

### POST `/api/v0/course/get`

**Purpose**: Get detailed information about a specific course

**Access**: Public

**Request Body**:
```json
{
  "course_nft_policy_id": "abc123..."
}
```

**Used In**:
- `src/app/(app)/course/[coursenft]/page.tsx` - Public course detail
- `src/app/(app)/studio/course/[coursenft]/page.tsx` - Studio course edit
- `src/app/(app)/studio/course/[coursenft]/instructor/page.tsx` - Instructor view

---

### POST `/api/v0/course/create`

**Purpose**: Create a new course

**Access**: Protected (Creator role)

**Request Body**:
```json
{
  "course_code": "my-course-101",
  "title": "My Course",
  "description": "Course description",
  "image_url": "https://...",
  "video_url": "https://..."
}
```

**Used In**:
- `src/components/courses/create-course-dialog.tsx` - Course creation dialog

---

### POST `/api/v0/course/create-on-submit-minting-tx`

**Purpose**: Create course on submission of minting transaction

**Access**: Protected (Creator role)

**Request Body**: Course data with transaction details

**Used In**:
- `src/components/courses/on-chain-courses-section.tsx` - On-chain course creation

---

### POST `/api/v0/course/update`

**Purpose**: Update course metadata

**Access**: Protected (Creator role, must own course)

**Request Body**:
```json
{
  "course_nft_policy_id": "abc123...",
  "data": {
    "title": "Updated Title",
    "description": "Updated description",
    "image_url": "https://...",
    "video_url": "https://..."
  }
}
```

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/page.tsx` - Course edit form

---

### POST `/api/v0/course/delete`

**Purpose**: Delete a course and all its content

**Access**: Protected (Creator role, must own course)

**Request Body**:
```json
{
  "course_nft_policy_id": "abc123..."
}
```

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/page.tsx` - Course deletion

---

### POST `/api/v0/course/unpublished-projects`

**Purpose**: Get unpublished projects requiring this course as prerequisite

**Access**: Protected (Creator role)

**Request Body**:
```json
{
  "course_nft_policy_id": "abc123..."
}
```

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/page.tsx` - Course dependencies

---

## Course Modules

### POST `/api/v0/course-module/get`

**Purpose**: Get detailed information about a specific module

**Access**: Public

**Request Body**:
```json
{
  "course_nft_policy_id": "abc123...",
  "module_code": "module-101"
}
```

**Used In**:
- `src/app/(app)/course/[coursenft]/[modulecode]/page.tsx` - Public module view
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/page.tsx` - Studio module edit

---

### POST `/api/v0/course-module/list`

**Purpose**: List all modules for a course with SLTs included

**Access**: Public

**Request Body**:
```json
{
  "course_nft_policy_id": "abc123..."
}
```

**Used In**:
- `src/app/(app)/course/[coursenft]/page.tsx` - Public course overview
- `src/app/(app)/studio/course/[coursenft]/page.tsx` - Studio course overview
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/page.tsx` - Module navigation

---

### POST `/api/v0/course-module/map`

**Purpose**: Batch query to get modules for multiple courses

**Access**: Public

**Request Body**:
```json
{
  "course_nft_policy_ids": ["abc123...", "def456..."]
}
```

**Used In**:
- `src/hooks/use-owned-courses.ts` - Module counts

---

### POST `/api/v0/course-module/with-assignments`

**Purpose**: Get modules with assignment summaries and publication status

**Access**: Public

**Request Body**:
```json
{
  "course_nft_policy_id": "abc123..."
}
```

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/page.tsx` - Assignment overview

---

### POST `/api/v0/course-module/create`

**Purpose**: Create a new course module

**Access**: Protected (Creator role, must own course)

**Request Body**:
```json
{
  "course_nft_policy_id": "abc123...",
  "module_code": "module-101",
  "title": "Module Title",
  "description": "Module description",
  "status": "DRAFT"
}
```

**Used In**:
- `src/components/courses/create-module-dialog.tsx` - Module creation
- `src/components/courses/on-chain-modules-section.tsx` - On-chain module creation

---

### POST `/api/v0/course-module/update`

**Purpose**: Update module title and description

**Access**: Protected (Creator role, must own course)

**Request Body**:
```json
{
  "course_nft_policy_id": "abc123...",
  "module_code": "module-101",
  "title": "Updated Title",
  "description": "Updated description"
}
```

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/page.tsx` - Module edit

---

### POST `/api/v0/course-module/update-status`

**Purpose**: Update module status (DRAFT, APPROVED, PENDING_TX, ON_CHAIN, etc.)

**Access**: Protected (Creator role, must own course)

**Request Body**:
```json
{
  "course_nft_policy_id": "abc123...",
  "module_code": "module-101",
  "status": "APPROVED"
}
```

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/page.tsx` - Status dropdown

**Status Flow**:
```
DRAFT → APPROVED → PENDING_TX → ON_CHAIN
  ↓       ↓           ↓
BACKLOG  ARCHIVED   DEPRECATED
```

---

### POST `/api/v0/course-module/delete`

**Purpose**: Delete module and all its content

**Access**: Protected (Creator role, must own course)

**Request Body**:
```json
{
  "course_nft_policy_id": "abc123...",
  "module_code": "module-101"
}
```

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/page.tsx` - Module deletion

---

### POST `/api/v0/course-module/confirm-transaction`

**Purpose**: Confirm blockchain transaction for module

**Access**: Protected (Creator role)

**Request Body**:
```json
{
  "course_nft_policy_id": "abc123...",
  "module_code": "module-101",
  "tx_hash": "txhash123..."
}
```

**Used In**:
- `src/hooks/use-pending-tx-watcher.ts` - Transaction confirmation

---

## Student Learning Targets (SLTs)

### POST `/api/v0/slt/list`

**Purpose**: Get all SLTs for a module

**Access**: Public

**Request Body**:
```json
{
  "course_nft_policy_id": "abc123...",
  "module_code": "module-101"
}
```

**Used In**:
- `src/app/(app)/course/[coursenft]/[modulecode]/page.tsx` - Public module view
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/slts/page.tsx` - SLT management
- `src/hooks/use-hybrid-slts.ts` - Hybrid SLT fetching

---

### POST `/api/v0/slt/get`

**Purpose**: Get a single SLT by module index

**Access**: Public

**Request Body**:
```json
{
  "course_nft_policy_id": "abc123...",
  "module_code": "module-101",
  "module_index": 1
}
```

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/slts/page.tsx` - Quick jump

---

### POST `/api/v0/slt/create`

**Purpose**: Create a new Student Learning Target

**Access**: Protected (Creator role, must own course)

**Request Body**:
```json
{
  "course_nft_policy_id": "abc123...",
  "module_code": "module-101",
  "module_index": 1,
  "slt_text": "Student will be able to..."
}
```

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/slts/page.tsx` - SLT creation
- `src/components/courses/on-chain-modules-section.tsx` - On-chain SLT creation
- `src/components/courses/hybrid-slt-status.tsx` - Hybrid SLT creation

---

### POST `/api/v0/slt/update`

**Purpose**: Update SLT text

**Access**: Protected (Creator role, must own course)

**Request Body**:
```json
{
  "course_nft_policy_id": "abc123...",
  "module_code": "module-101",
  "module_index": 1,
  "slt_text": "Updated text..."
}
```

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/slts/page.tsx` - SLT edit

---

### POST `/api/v0/slt/delete`

**Purpose**: Delete a Student Learning Target

**Access**: Protected (Creator role, must own course)

**Request Body**:
```json
{
  "course_nft_policy_id": "abc123...",
  "module_code": "module-101",
  "module_index": 1
}
```

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/slts/page.tsx` - SLT deletion

---

### POST `/api/v0/slt/reorder`

**Purpose**: Reorder multiple SLTs in single operation

**Access**: Protected (Creator role, must own course)

**Request Body**:
```json
{
  "updates": [
    { "id": "slt-id-1", "new_module_index": 2 },
    { "id": "slt-id-2", "new_module_index": 1 }
  ]
}
```

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/slts/page.tsx` - Drag-and-drop

---

## Lessons

### POST `/api/v0/lesson/get`

**Purpose**: Get a specific lesson

**Access**: Public

**Request Body**:
```json
{
  "course_nft_policy_id": "abc123...",
  "module_code": "module-101",
  "module_index": 1
}
```

**Used In**:
- `src/app/(app)/course/[coursenft]/[modulecode]/[moduleindex]/page.tsx` - Public lesson
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/[moduleindex]/page.tsx` - Lesson editor

---

### POST `/api/v0/lesson/list`

**Purpose**: List all lessons for a module

**Access**: Public

**Request Body**:
```json
{
  "course_nft_policy_id": "abc123...",
  "module_code": "module-101"
}
```

**Used In**:
- `src/app/(app)/course/[coursenft]/[modulecode]/page.tsx` - Module overview
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/slts/page.tsx` - Lesson status

---

### POST `/api/v0/lesson/create`

**Purpose**: Create a new lesson

**Access**: Protected (Creator role, must own course)

**Request Body**:
```json
{
  "course_nft_policy_id": "abc123...",
  "module_code": "module-101",
  "module_index": 1,
  "title": "Lesson Title",
  "description": "Lesson description",
  "content_json": { "type": "doc", "content": [] }
}
```

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/[moduleindex]/page.tsx` - Lesson creation

---

### POST `/api/v0/lesson/update`

**Purpose**: Update lesson content

**Access**: Protected (Creator role, must own course)

**Request Body**:
```json
{
  "course_nft_policy_id": "abc123...",
  "module_code": "module-101",
  "module_index": 1,
  "title": "Updated Title",
  "description": "Updated description",
  "content_json": { "type": "doc", "content": [] },
  "live": true
}
```

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/[moduleindex]/page.tsx` - Lesson editing

---

### POST `/api/v0/lesson/delete`

**Purpose**: Delete a lesson

**Access**: Protected (Creator role, must own course)

**Request Body**:
```json
{
  "course_nft_policy_id": "abc123...",
  "module_code": "module-101",
  "module_index": 1
}
```

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/[moduleindex]/page.tsx` - Lesson deletion

---

## Assignments

### POST `/api/v0/assignment/get`

**Purpose**: Get assignment for a module

**Access**: Public

**Request Body**:
```json
{
  "course_nft_policy_id": "abc123...",
  "module_code": "module-101"
}
```

**Used In**:
- `src/app/(app)/course/[coursenft]/[modulecode]/assignment/page.tsx` - Public assignment
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/assignment/page.tsx` - Assignment editor

---

### POST `/api/v0/assignment/create`

**Purpose**: Create a new assignment

**Access**: Protected (Creator role, must own course)

**Request Body**:
```json
{
  "course_nft_policy_id": "abc123...",
  "module_code": "module-101",
  "assignment_code": "assignment-101",
  "title": "Assignment Title",
  "description": "Assignment description",
  "content_json": { "type": "doc", "content": [] }
}
```

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/assignment/page.tsx` - Assignment creation

---

### POST `/api/v0/assignment/update`

**Purpose**: Update assignment details

**Access**: Protected (Creator role, must own course)

**Request Body**:
```json
{
  "course_nft_policy_id": "abc123...",
  "module_code": "module-101",
  "title": "Updated Title",
  "description": "Updated description",
  "content_json": { "type": "doc", "content": [] },
  "live": true
}
```

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/assignment/page.tsx` - Assignment editing

---

### POST `/api/v0/assignment/publish`

**Purpose**: Publish assignment to make it visible to learners

**Access**: Protected (Creator role, must own course)

**Request Body**:
```json
{
  "course_nft_policy_id": "abc123...",
  "module_code": "module-101",
  "live": true
}
```

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/assignment/page.tsx` - Publish button

---

### POST `/api/v0/assignment/delete`

**Purpose**: Delete an assignment

**Access**: Protected (Creator role, must own course)

**Request Body**:
```json
{
  "course_nft_policy_id": "abc123...",
  "module_code": "module-101"
}
```

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/assignment/page.tsx` - Assignment deletion

---

## Module Introductions

### POST `/api/v0/introduction/get`

**Purpose**: Get module introduction content

**Access**: Public

**Request Body**:
```json
{
  "course_nft_policy_id": "abc123...",
  "module_code": "module-101"
}
```

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/introduction/page.tsx` - Introduction editor

---

### POST `/api/v0/introduction/create`

**Purpose**: Create module introduction

**Access**: Protected (Creator role, must own course)

**Request Body**:
```json
{
  "course_nft_policy_id": "abc123...",
  "module_code": "module-101",
  "title": "Introduction Title",
  "content_json": { "type": "doc", "content": [] }
}
```

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/introduction/page.tsx` - Introduction creation

---

### POST `/api/v0/introduction/update`

**Purpose**: Update introduction content

**Access**: Protected (Creator role, must own course)

**Request Body**:
```json
{
  "course_nft_policy_id": "abc123...",
  "module_code": "module-101",
  "title": "Updated Title",
  "content_json": { "type": "doc", "content": [] },
  "live": true
}
```

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/introduction/page.tsx` - Introduction editing

---

### POST `/api/v0/introduction/publish`

**Purpose**: Publish introduction to make it visible to learners

**Access**: Protected (Creator role, must own course)

**Request Body**:
```json
{
  "course_nft_policy_id": "abc123...",
  "module_code": "module-101",
  "live": true
}
```

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/[modulecode]/introduction/page.tsx` - Publish button

---

## Assignment Commitments

### POST `/api/v0/assignment-commitment/check`

**Purpose**: Check if learner has commitment for assignment

**Access**: Protected (Learner role)

**Request Body**:
```json
{
  "assignment_id": "assignment-uuid"
}
```

**Used In**:
- `src/components/learner/assignment-commitment.tsx` - Check existing commitment

---

### POST `/api/v0/assignment-commitment/by-course`

**Purpose**: Get all assignment commitments for a course (instructor view)

**Access**: Protected (Creator role)

**Request Body**:
```json
{
  "course_nft_policy_id": "abc123..."
}
```

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/instructor/page.tsx` - Instructor dashboard

---

### POST `/api/v0/assignment-commitment/list`

**Purpose**: Get authenticated learner's commitments for a course

**Access**: Protected (Learner role)

**Request Body**:
```json
{
  "course_nft_policy_id": "abc123..."
}
```

**Used In**:
- `src/components/learner/assignment-commitment.tsx` - Assignment progress

---

### POST `/api/v0/assignment-commitment/create`

**Purpose**: Create assignment commitment (learner starts assignment)

**Access**: Protected (Learner role)

**Request Body**:
```json
{
  "assignment_id": "assignment-uuid"
}
```

**Used In**:
- `src/components/learner/assignment-commitment.tsx` - Start Assignment button

---

### POST `/api/v0/assignment-commitment/update-evidence`

**Purpose**: Update learner's assignment submission evidence

**Access**: Protected (Learner role, must own commitment)

**Request Body**:
```json
{
  "course_nft_policy_id": "abc123...",
  "module_code": "module-101",
  "assignment_code": "assignment-101",
  "access_token_alias": "my-alias",
  "network_evidence": { "type": "doc", "content": [] },
  "network_evidence_hash": "hash123..."
}
```

**Used In**:
- `src/components/learner/assignment-commitment.tsx` - Evidence submission

---

### POST `/api/v0/assignment-commitment/update-status`

**Purpose**: Update commitment status (also used for transaction confirmation)

**Access**: Protected (Instructor/System)

**Request Body**:
```json
{
  "id": "commitment-uuid",
  "status": "COMPLETED",
  "tx_hash": "txhash123...",
  "network_evidence_hash": "hash123..."
}
```

**Used In**:
- `src/hooks/use-pending-tx-watcher.ts` - Transaction confirmation

---

### POST `/api/v0/assignment-commitment/delete`

**Purpose**: Delete assignment commitment (learner withdraws)

**Access**: Protected (Learner role, must own commitment)

**Request Body**:
```json
{
  "course_nft_policy_id": "abc123...",
  "module_code": "module-101",
  "assignment_code": "assignment-101",
  "access_token_alias": "my-alias"
}
```

**Used In**:
- `src/components/learner/assignment-commitment.tsx` - Withdraw from assignment

---

## Learner Progress

### POST `/api/v0/credential/list`

**Purpose**: Get comprehensive learner progress for a course

**Access**: Protected (Learner role)

**Request Body**:
```json
{
  "course_nft_policy_id": "abc123..."
}
```

**Used In**:
- `src/components/learner/user-course-status.tsx` - Course progress card

---

## Pending Transactions

### GET `/api/v0/transaction/pending-transactions`

**Purpose**: Get list of pending blockchain transactions

**Access**: Protected (requires JWT)

**Note**: This is the **only GET endpoint** in the API. It's a read-only list operation with no request body.

**Used In**:
- `src/hooks/use-pending-tx-watcher.ts` - Transaction status monitoring
- `src/hooks/use-pending-transactions.ts` - Transaction list

---

## Removed Endpoints (v0.5.0)

The following endpoints were removed in API v0.5.0:

| Endpoint | Purpose | Alternative |
|----------|---------|-------------|
| `/course-modules/update-code` | Rename module code | Delete and recreate module |
| `/course-modules/set-pending-tx` | Set pending tx hash | Use `/course-module/update-status` with `pending_tx_hash` |
| `/course-modules/publish` | Batch publish content | Publish each content type individually |

---

## Coverage Summary

### By Router

| Router | Endpoints Used | Total Endpoints | Coverage | Status |
|--------|----------------|-----------------|----------|--------|
| Auth | 2 | 2 | 100% | Complete |
| Access Token | 4 | 4 | 100% | Complete |
| Courses | 8 | 8 | 100% | Complete |
| Course Modules | 9 | 9 | 100% | Complete |
| SLTs | 6 | 6 | 100% | Complete |
| Lessons | 5 | 5 | 100% | Complete |
| Assignments | 5 | 5 | 100% | Complete |
| Introductions | 4 | 4 | 100% | Complete |
| Assignment Commitments | 7 | 7 | 100% | Complete |
| Learner Progress | 1 | 1 | 100% | Complete |
| Pending Transactions | 1 | 1 | 100% | Complete |

### Overall Coverage

**51 of 52 endpoints used (98.08%)**

### Unused Endpoints

1. **`POST /slt/update-index`**
   - **Reason**: Batch endpoint (`/slt/reorder`) is more efficient
   - **Availability**: Remains available for external API consumers

---

## Key Patterns

### Authentication Flow
```
1. POST /api/v0/auth/login/session        → Get nonce
2. User signs nonce with wallet
3. POST /api/v0/auth/login/validate       → Get JWT token
4. All subsequent requests use:           Authorization: Bearer {token}
```

### Content Publication Workflow
```
DRAFT → Edit content → APPROVED → PENDING_TX → ON_CHAIN
                                                    ↓
                                               DEPRECATED
```

### Learner Journey
```
1. GET  /api/v0/course/published                      → Browse courses
2. POST /api/v0/course/get                            → View course details
3. POST /api/v0/course-module/list                    → See modules
4. POST /api/v0/assignment-commitment/create          → Start assignment
5. POST /api/v0/assignment-commitment/update-evidence → Submit work
6. POST /api/v0/credential/list                       → Track progress
```

### Creator Journey
```
1. POST /api/v0/course/create                         → Create course
2. POST /api/v0/course-module/create                  → Add modules
3. POST /api/v0/slt/create                            → Define learning objectives
4. POST /api/v0/lesson/create                         → Create lessons
5. POST /api/v0/assignment/create                     → Create assignments
6. POST /api/v0/assignment/publish                    → Publish assignment
7. POST /api/v0/assignment-commitment/by-course       → Review submissions
```

---

## Security Patterns

### Public Endpoints
- Course browsing and viewing
- Module and lesson content
- SLT viewing

### Protected Endpoints
- All CREATE operations
- All UPDATE operations
- All DELETE operations
- Learner progress and commitments
- Instructor views
- Pending transactions list (GET)

### Authorization Checks
1. **JWT Validation** - All protected endpoints
2. **Role Verification** - Creator vs. Learner endpoints
3. **Ownership Validation** - Can only edit owned resources

---

## Type Safety

All endpoints use shared type definitions from `@andamio/db-api`:

```typescript
import {
  type CourseOutput,
  type CreateCourseInput,
  type UpdateCourseInput,
  createCourseInputSchema,
  updateCourseInputSchema,
} from "@andamio/db-api";
```

**Benefits**:
- Compile-time type checking
- Auto-complete in IDEs
- Runtime validation with Zod schemas
- No type drift between API and frontend

---

## Related Documentation

- [API Design Principles](../../andamio-db-api/docs/API-DESIGN-PRINCIPLES.md)
- [Authentication Guide](../../andamio-db-api/docs/AUTHENTICATION.md)
- [Database API README](../../andamio-db-api/README.md)

---

**Last Updated**: December 15, 2024
**Maintained By**: Andamio Platform Team
