# Course Routes Sitemap

This document maps all implemented Course-related routes in the Andamio T3 App Template.

## Summary

| # | Route | Purpose | Auth | Type |
|---|-------|---------|------|------|
| 1 | `/course` | Public course catalog | Not required | Learner |
| 2 | `/course/[coursenft]` | Course detail with modules | Not required | Learner |
| 3 | `/course/[coursenft]/[modulecode]` | Module detail with SLTs & lessons | Not required | Learner |
| 4 | `/course/[coursenft]/[modulecode]/[moduleindex]` | Individual lesson page | Not required | Learner |
| 5 | `/studio/course` | Course management dashboard | Required | Creator |
| 6 | `/studio/course/[coursenft]/[modulecode]` | Course Module CRUD management | Required | Creator |
| 7 | `/studio/course/[coursenft]/[modulecode]/slts` | SLT List CRUD management | Required | Creator |
| 8 | `/studio/course/[coursenft]/[modulecode]/assignment` | Assignment CRUD management | Required | Creator |
| 9 | `/studio/course/[coursenft]/[modulecode]/[moduleindex]` | Lesson CRUD management (one for each moduleindex) | Required | Creator |
| 10 | `/studio/course/[coursenft]/[modulecode]/introduction` | Introduction CRUD management | Required | Creator |

**Total: 10 Course Routes Implemented**

---

## Route Categories

### 1. Public Course Routes (Learner-Facing)

These routes are accessible to all users (authenticated or not) and provide the course browsing and learning experience.

#### `/course`
- **Purpose**: Browse all published courses (course catalog)
- **Authentication**: Not required (public)
- **Features**:
  - Displays table of all published courses
  - Shows course title, NFT policy ID, description
  - Links to individual course pages
  - Loading/error/empty states
- **Component**: `src/app/(app)/course/page.tsx`
- **API Endpoint**: `GET /courses/published`
- **Type**: `RouterOutputs["course"]["getPublishedCourses"]`

#### `/course/[coursenft]`
- **Purpose**: Individual course detail page
- **Authentication**: Not required (public)
- **URL Parameters**:
  - `coursenft` - Course NFT Policy ID
- **Features**:
  - Displays course title, description
  - Shows table of course modules with:
    - Module code
    - Title (linked to module page)
    - Description
    - Status badge
  - Loading/error/empty states
- **Component**: `src/app/(app)/course/[coursenft]/page.tsx`
- **API Endpoints**:
  - `GET /courses/{courseNftPolicyId}` - Course details
  - `GET /courses/{courseNftPolicyId}/course-modules` - Module list
- **Types**:
  - `RouterOutputs["course"]["getCourseByPolicyId"]`
  - `RouterOutputs["courseModule"]["getCourseModuleOverviewsByCourseNftPolicyId"]`

#### `/course/[coursenft]/[modulecode]`
- **Purpose**: Course module detail page with learning targets and lessons
- **Authentication**: Optional (shows "Manage SLTs" button if authenticated)
- **URL Parameters**:
  - `coursenft` - Course NFT Policy ID
  - `modulecode` - Module code
- **Features**:
  - Displays module title, description, code, status
  - Combined table of SLTs and Lessons showing:
    - Index/position
    - Learning target text
    - Lesson title (linked to lesson page)
    - Lesson description
    - Media badges (Image/Video)
    - Status (Live/Draft/No Lesson)
  - "Manage SLTs" button (if authenticated) → links to `/studio/course/[coursenft]/[modulecode]/slts`
  - Loading/error/empty states
- **Component**: `src/app/(app)/course/[coursenft]/[modulecode]/page.tsx`
- **API Endpoints**:
  - `GET /course-modules/{courseNftPolicyId}/{moduleCode}` - Module details
  - `GET /slts/{courseNftPolicyId}/{moduleCode}` - SLT list
  - `GET /courses/{courseNftPolicyId}/modules/{moduleCode}/lessons` - Lesson list
- **Types**:
  - `RouterOutputs["courseModule"]["getCourseModuleByCourseNftPolicyId"]`
  - `RouterOutputs["slt"]["getModuleSLTs"]`
  - `RouterOutputs["lesson"]["getModuleLessons"]`

#### `/course/[coursenft]/[modulecode]/[moduleindex]`
- **Purpose**: Individual lesson detail page
- **Authentication**: Not required (public)
- **URL Parameters**:
  - `coursenft` - Course NFT Policy ID
  - `modulecode` - Module code
  - `moduleindex` - SLT index/lesson position (0-25)
- **Features**:
  - Back button to module page
  - Live/Draft badge
  - Student Learning Target card (index + text)
  - Lesson title and description
  - Media sections:
    - Video (embedded iframe, aspect-video)
    - Image (Next.js Image component, aspect-video)
  - Lesson content (Tiptap RenderEditor)
  - Handles missing lessons (404 state)
  - Empty content state
  - Loading/error states
- **Component**: `src/app/(app)/course/[coursenft]/[modulecode]/[moduleindex]/page.tsx`
- **API Endpoint**: `GET /lessons/{courseNftPolicyId}/{moduleCode}/{moduleIndex}`
- **Type**: `RouterOutputs["lesson"]["getLessonByPolicyId"]`

---

### 2. Studio/Management Routes (Creator-Facing)

These routes are for course creators to manage their courses and require authentication.

#### `/studio/course`
- **Purpose**: Course studio/management dashboard
- **Authentication**: Required (JWT)
- **Features**:
  - Displays owned courses table with "Manage" action buttons
  - Each course links to its individual edit page
  - Uses `OwnedCoursesList` component
  - Auth gate (shows login if not authenticated)
- **Component**: `src/app/(app)/studio/course/page.tsx`
- **API Endpoint**: `GET /courses/owned`
- **Type**: `ListOwnedCoursesOutput`

#### `/studio/course/[coursenft]`
- **Purpose**: Course CRUD management page
- **Authentication**: Required (JWT)
- **URL Parameters**:
  - `coursenft` - Course NFT Policy ID
- **Features**:
  - Edit course title, description, imageUrl, videoUrl
  - Course code (read-only)
  - View course modules in a table
  - Link to edit each module
  - Save/Cancel actions
  - Loading/error states
- **Component**: `src/app/(app)/studio/course/[coursenft]/page.tsx`
- **API Endpoints**:
  - `GET /courses/{courseNftPolicyId}` - Get course
  - `GET /courses/{courseNftPolicyId}/course-modules` - Get modules
  - `PATCH /courses/{courseCode}` - Update course (authenticated)
- **Types**:
  - `RouterOutputs["course"]["getCourseByPolicyId"]`
  - `RouterOutputs["courseModule"]["getCourseModuleOverviewsByCourseNftPolicyId"]`

#### `/studio/course/[coursenft]/[modulecode]`
- **Purpose**: Course Module CRUD management page
- **Authentication**: Required (JWT)
- **URL Parameters**:
  - `coursenft` - Course NFT Policy ID
  - `modulecode` - Module code
- **Features**:
  - Edit module title, description
  - Module code (read-only, shown in badge)
  - Status dropdown with valid transitions
  - Quick links to manage SLTs, Introduction, Assignment
  - Save/Cancel actions
  - Loading/error states
- **Component**: `src/app/(app)/studio/course/[coursenft]/[modulecode]/page.tsx`
- **API Endpoints**:
  - `GET /course-modules/{courseNftPolicyId}/{moduleCode}` - Get module
  - `PATCH /course-modules/{courseNftPolicyId}/{moduleCode}` - Update module (authenticated)
  - `PATCH /course-modules/{courseNftPolicyId}/{moduleCode}/status` - Update status (authenticated)
- **Types**:
  - `RouterOutputs["courseModule"]["getCourseModuleByCourseNftPolicyId"]`

#### `/studio/course/[coursenft]/[modulecode]/slts`
- **Purpose**: Manage Student Learning Targets (SLTs) for a module
- **Authentication**: Required (JWT)
- **URL Parameters**:
  - `coursenft` - Course NFT Policy ID
  - `modulecode` - Module code
- **Features**:
  - Back button to module page
  - "Add SLT" button (disabled if 25 SLTs exist)
  - SLT count card (X/25)
  - Combined table of SLTs and Lessons showing:
    - Index
    - Learning target text
    - Linked lesson info (title, description)
    - Status badge
    - Edit/Delete action buttons
  - **Create SLT Dialog**:
    - Module index input (0-25)
    - Learning target text (textarea)
    - Validation and error handling
  - **Edit SLT Dialog**:
    - Update index and/or text
    - Validation and error handling
  - **Delete SLT Dialog**:
    - Confirmation with preview
    - Warning about irreversibility
  - Real-time data refresh after CRUD operations
  - Empty state with "Create First SLT" button
  - Loading/error states
- **Component**: `src/app/(app)/studio/course/[coursenft]/[modulecode]/slts/page.tsx`
- **API Endpoints**:
  - `GET /course-modules/{courseNftPolicyId}/{moduleCode}` - Module details
  - `GET /slts/{courseNftPolicyId}/{moduleCode}` - SLT list
  - `GET /courses/{courseNftPolicyId}/modules/{moduleCode}/lessons` - Lesson list
  - `POST /slts` - Create SLT (authenticated)
  - `PATCH /slts/{courseNftPolicyId}/{moduleCode}/{moduleIndex}` - Update SLT (authenticated)
  - `DELETE /slts/{courseNftPolicyId}/{moduleCode}/{moduleIndex}` - Delete SLT (authenticated)
- **Types**:
  - `RouterOutputs["courseModule"]["getCourseModuleByCourseNftPolicyId"]`
  - `RouterOutputs["slt"]["getModuleSLTs"]`
  - `RouterOutputs["slt"]["getSLT"]`
  - `RouterOutputs["lesson"]["getModuleLessons"]`

#### `/studio/course/[coursenft]/[modulecode]/assignment`
- **Purpose**: Assignment CRUD management page
- **Authentication**: Required (JWT)
- **URL Parameters**:
  - `coursenft` - Course NFT Policy ID
  - `modulecode` - Module code
- **Features**:
  - Edit/Create assignment metadata (title, description, imageUrl, videoUrl, live status)
  - **Tiptap editor** for assignment content (contentJson)
  - SLT selection with checkboxes (select which SLTs the assignment covers)
  - Edit/Preview tabs
  - Create/Update/Delete operations
  - Loading/error states
- **Component**: `src/app/(app)/studio/course/[coursenft]/[modulecode]/assignment/page.tsx`
- **API Endpoints**:
  - `GET /assignments/{courseNftPolicyId}/{moduleCode}` - Get assignment
  - `GET /slts/{courseNftPolicyId}/{moduleCode}` - Get SLTs for linking
  - `POST /assignments` - Create assignment (authenticated)
  - `PATCH /assignments/{courseNftPolicyId}/{moduleCode}` - Update assignment (authenticated)
  - `DELETE /assignments/{courseNftPolicyId}/{moduleCode}` - Delete assignment (authenticated)
- **Types**:
  - `RouterOutputs["assignment"]["getAssignmentByCourseModuleCodes"]`
  - `RouterOutputs["slt"]["getModuleSLTs"]`

#### `/studio/course/[coursenft]/[modulecode]/[moduleindex]`
- **Purpose**: Lesson CRUD management page
- **Authentication**: Required (JWT)
- **URL Parameters**:
  - `coursenft` - Course NFT Policy ID
  - `modulecode` - Module code
  - `moduleindex` - SLT index (0-25)
- **Features**:
  - Edit/Create lesson metadata (title, description, imageUrl, videoUrl, live status)
  - **Tiptap editor** for lesson content (contentJson)
  - Shows linked SLT text
  - Title auto-generates from SLT text if left empty
  - Edit/Preview tabs
  - Create/Update/Delete operations
  - Loading/error states
- **Component**: `src/app/(app)/studio/course/[coursenft]/[modulecode]/[moduleindex]/page.tsx`
- **API Endpoints**:
  - `GET /lessons/{courseNftPolicyId}/{moduleCode}/{moduleIndex}` - Get lesson
  - `POST /lessons` - Create lesson (authenticated)
  - `PATCH /lessons/{courseNftPolicyId}/{moduleCode}/{moduleIndex}` - Update lesson (authenticated)
  - `DELETE /lessons/{courseNftPolicyId}/{moduleCode}/{moduleIndex}` - Delete lesson (authenticated)
- **Types**:
  - `RouterOutputs["lesson"]["getLessonByPolicyId"]`

#### `/studio/course/[coursenft]/[modulecode]/introduction`
- **Purpose**: Introduction CRUD management page
- **Authentication**: Required (JWT)
- **URL Parameters**:
  - `coursenft` - Course NFT Policy ID
  - `modulecode` - Module code
- **Features**:
  - Edit/Create introduction metadata (title, description, imageUrl, videoUrl, live status)
  - **Tiptap editor** for introduction content (contentJson)
  - Edit/Preview tabs
  - Create/Update operations (no delete - intentional)
  - Info card explaining introduction purpose
  - Loading/error states
- **Component**: `src/app/(app)/studio/course/[coursenft]/[modulecode]/introduction/page.tsx`
- **API Endpoints**:
  - `GET /introductions/{courseNftPolicyId}/{moduleCode}` - Get introduction
  - `POST /introductions` - Create introduction (authenticated)
  - `PATCH /introductions/{courseNftPolicyId}/{moduleCode}` - Update introduction (authenticated)
  - **Note**: No DELETE endpoint (introductions cannot be deleted, only updated)
- **Types**:
  - `RouterOutputs["introduction"]["getIntroduction"]`

---

## Route Hierarchy Visualization

```
/course (public - all published courses)
  └── /course/[coursenft] (course detail)
      └── /course/[coursenft]/[modulecode] (module detail with SLTs/lessons)
          └── /course/[coursenft]/[modulecode]/[moduleindex] (lesson detail)

/studio
  └── /studio/course (course management dashboard - owned courses)
      └── /studio/course/[coursenft] (course CRUD)
          └── /studio/course/[coursenft]/[modulecode] (module CRUD)
              ├── /studio/course/[coursenft]/[modulecode]/slts (SLT list management)
              ├── /studio/course/[coursenft]/[modulecode]/assignment (assignment CRUD)
              ├── /studio/course/[coursenft]/[modulecode]/introduction (introduction CRUD)
              └── /studio/course/[coursenft]/[modulecode]/[moduleindex] (lesson CRUD)
```

---

## URL Parameter Definitions

| Parameter | Description | Example | Constraints |
|-----------|-------------|---------|-------------|
| `coursenft` | Course NFT Policy ID | `e1b2c3d4...` | 56-character hex string |
| `modulecode` | Module code | `MOD-101` | Alphanumeric with hyphens |
| `moduleindex` | SLT/Lesson index | `0`, `1`, `24` | Integer 0-25 |

---

## Authentication Requirements Summary

| Route | Auth Required | Auth Type | Access Level |
|-------|---------------|-----------|--------------|
| `/course` | No | - | Public |
| `/course/[coursenft]` | No | - | Public |
| `/course/[coursenft]/[modulecode]` | No | - | Public |
| `/course/[coursenft]/[modulecode]/[moduleindex]` | No | - | Public |
| `/studio/course` | Yes | JWT | Creator |
| `/studio/course/[coursenft]` | Yes | JWT | Creator/Owner |
| `/studio/course/[coursenft]/[modulecode]` | Yes | JWT | Creator/Owner |
| `/studio/course/[coursenft]/[modulecode]/slts` | Yes | JWT | Creator/Owner |
| `/studio/course/[coursenft]/[modulecode]/assignment` | Yes | JWT | Creator/Owner |
| `/studio/course/[coursenft]/[modulecode]/[moduleindex]` | Yes | JWT | Creator/Owner |
| `/studio/course/[coursenft]/[modulecode]/introduction` | Yes | JWT | Creator/Owner |

---

## API Endpoints Used by Course Routes

### Public Endpoints (No Auth)
- `GET /courses/published` - List all published courses
- `GET /courses/{courseNftPolicyId}` - Get course by policy ID
- `GET /courses/{courseNftPolicyId}/course-modules` - Get course modules
- `GET /course-modules/{courseNftPolicyId}/{moduleCode}` - Get module details
- `GET /slts/{courseNftPolicyId}/{moduleCode}` - Get module SLTs
- `GET /courses/{courseNftPolicyId}/modules/{moduleCode}/lessons` - Get module lessons
- `GET /lessons/{courseNftPolicyId}/{moduleCode}/{moduleIndex}` - Get lesson details
- `GET /assignments/{courseNftPolicyId}/{moduleCode}` - Get assignment for module
- `GET /introductions/{courseNftPolicyId}/{moduleCode}` - Get introduction for module

### Authenticated Endpoints (JWT Required)

**Course Management:**
- `GET /courses/owned` - List courses owned by authenticated user
- `PATCH /courses/{courseCode}` - Update course details

**Module Management:**
- `PATCH /course-modules/{courseNftPolicyId}/{moduleCode}` - Update module details
- `PATCH /course-modules/{courseNftPolicyId}/{moduleCode}/status` - Update module status

**SLT Management:**
- `POST /slts` - Create new SLT
- `PATCH /slts/{courseNftPolicyId}/{moduleCode}/{moduleIndex}` - Update SLT
- `DELETE /slts/{courseNftPolicyId}/{moduleCode}/{moduleIndex}` - Delete SLT

**Lesson Management:**
- `POST /lessons` - Create new lesson
- `PATCH /lessons/{courseNftPolicyId}/{moduleCode}/{moduleIndex}` - Update lesson
- `DELETE /lessons/{courseNftPolicyId}/{moduleCode}/{moduleIndex}` - Delete lesson

**Assignment Management:**
- `POST /assignments` - Create new assignment
- `PATCH /assignments/{courseNftPolicyId}/{moduleCode}` - Update assignment
- `DELETE /assignments/{courseNftPolicyId}/{moduleCode}` - Delete assignment

**Introduction Management:**
- `POST /introductions` - Create new introduction
- `PATCH /introductions/{courseNftPolicyId}/{moduleCode}` - Update introduction
- **Note**: No DELETE endpoint (introductions cannot be deleted)

---

## Shared Components Used

- `AndamioAuthButton` - Authentication UI (`src/components/auth/andamio-auth-button.tsx`)
- `OwnedCoursesList` - Displays owned courses (`src/components/courses/owned-courses-list.tsx`)
- `RenderEditor` - Tiptap editor renderer (`src/components/editor`)
- shadcn/ui components:
  - Table, Card, Badge, Button, Dialog
  - Alert, Skeleton, Input, Textarea, Label
  - All styled with Tailwind CSS

---

## Key Features by Route Type

### Learner Routes
- Browse public course catalog
- View course structure (modules → lessons)
- Read lesson content with media
- Progressive disclosure (course → module → lesson)

### Creator Routes
- Manage owned courses
- CRUD operations on SLTs
- Preview lesson/SLT associations
- Navigate between management and public views

---

## Notes

1. **On-Chain Identifiers**: All routes use `courseNftPolicyId` and `moduleCode` instead of internal database IDs
2. **Type Safety**: All routes import types from `andamio-db-api` package
3. **Loading States**: All routes implement skeleton loaders during data fetching
4. **Error Handling**: All routes have error states with user-friendly messages
5. **Empty States**: All list/collection views have empty states with guidance
6. **Responsive Design**: All routes use shadcn/ui components with Tailwind CSS
7. **Authentication Flow**: Uses `useAndamioAuth` hook with JWT stored in localStorage
8. **SLT Limit**: Maximum 25 SLTs per module (enforced in UI and API)

---

## Future Routes (Not Yet Implemented)

These are potential course-related routes that could be added:

- `/studio/course/create` - Create new course
- `/studio/course/[coursenft]/edit` - Edit course details
- `/studio/course/[coursenft]/modules` - Manage course modules
- `/studio/course/[coursenft]/[modulecode]/edit` - Edit module details
- `/studio/course/[coursenft]/[modulecode]/lessons/create` - Create new lesson
- `/studio/course/[coursenft]/[modulecode]/[moduleindex]/edit` - Edit lesson
- `/course/[coursenft]/enroll` - Course enrollment page
- `/my-learning` - Learner dashboard with enrolled courses
- `/my-learning/[coursenft]` - Learner progress for specific course
