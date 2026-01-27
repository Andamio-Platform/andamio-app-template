# Course Routes Sitemap

This document maps all implemented Course-related routes in the Andamio T3 App Template.

## Summary

| # | Route | Purpose | Auth | Type |
|---|-------|---------|------|------|
| 1 | `/course` | Public course catalog | Not required | Learner |
| 2 | `/course/[coursenft]` | Course detail with modules | Not required | Learner |
| 3 | `/course/[coursenft]/[modulecode]` | Module detail with SLTs & lessons | Not required | Learner |
| 4 | `/course/[coursenft]/[modulecode]/[moduleindex]` | Individual lesson page | Not required | Learner |
| 5 | `/course/[coursenft]/[modulecode]/assignment` | Assignment detail page | Not required | Learner |
| 6 | `/courses` | My owned courses list | Required | Creator |
| 7 | `/studio` | Studio home dashboard | Required | Creator |
| 8 | `/studio/course` | Course management dashboard | Required | Creator |
| 9 | `/studio/course/[coursenft]` | Course CRUD management | Required | Creator |
| 10 | `/studio/course/[coursenft]/teacher` | Instructor dashboard (student commitments) | Required | Creator |
| 11 | `/studio/course/[coursenft]/[modulecode]` | Course Module CRUD management | Required | Creator |
| 12 | `/studio/course/[coursenft]/[modulecode]/slts` | SLT List CRUD management | Required | Creator |
| 13 | `/studio/course/[coursenft]/[modulecode]/assignment` | Assignment CRUD management | Required | Creator |
| 14 | `/studio/course/[coursenft]/[modulecode]/[moduleindex]` | Lesson CRUD management (one for each moduleindex) | Required | Creator |
| 15 | `/studio/course/[coursenft]/[modulecode]/introduction` | Introduction CRUD management | Required | Creator |

**Total: 15 Course Routes Implemented**

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
- **API Endpoint**: `GET /course/published`
- **Type**: `ListPublishedCoursesOutput`

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
  - `POST /course/get` - Course details
  - `POST /course-module/list` - Module list
- **Types**:
  - `CourseOutput`
  - `ListCourseModulesOutput`

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
  - `POST /course-module/get` - Module details
  - `POST /slt/list` - SLT list
  - `POST /lesson/list` - Lesson list
- **Types**:
  - `CourseModuleOutput`
  - `ListSLTsOutput`
  - `ListLessonsOutput`

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
- **API Endpoint**: `POST /lesson/get`
- **Type**: `LessonWithSLTOutput`

#### `/course/[coursenft]/[modulecode]/assignment`
- **Purpose**: Learner-facing assignment detail page
- **Authentication**: Not required (public)
- **URL Parameters**:
  - `coursenft` - Course NFT Policy ID
  - `modulecode` - Module code
- **Features**:
  - Back button to module page
  - Assignment code badge
  - Live/Draft status badge
  - Assignment title and description
  - Linked SLTs display (shows which learning targets the assignment covers)
  - Assignment content (Tiptap RenderEditor)
  - Media links (image URL, video URL)
  - Assignment commitment component:
    - Create commitments
    - Submit evidence
    - Track progress
  - Loading/error/empty states
- **Component**: `src/app/(app)/course/[coursenft]/[modulecode]/assignment/page.tsx`
- **API Endpoint**: `POST /assignment/get`
- **Type**: `AssignmentOutput`

---

### 2. Other Routes

#### `/courses`
- **Purpose**: My owned courses list (alternative to `/studio/course`)
- **Authentication**: Required (JWT)
- **Features**:
  - Displays owned courses using `OwnedCoursesList` component
  - Course cards with badges (Live/Draft, category, access tier)
  - Loading states, error handling, empty states
  - Auth gate (shows login if not authenticated)
- **Component**: `src/app/(app)/courses/page.tsx`
- **API Endpoint**: `POST /course/owned`
- **Type**: `ListOwnedCoursesOutput`
- **Note**: This provides the same functionality as `/studio/course` but in the main app area instead of the studio section

---

### 3. Studio/Management Routes (Creator-Facing)

These routes are for course creators to manage their courses and require authentication.

#### `/studio`
- **Purpose**: Studio home dashboard
- **Authentication**: Required (JWT)
- **Features**:
  - Welcome header with description
  - Card grid with studio options:
    - **Course Studio** - Active link to `/studio/course`
    - **Project Studio** - Coming soon (disabled)
  - Auth gate (shows login if not authenticated)
- **Component**: `src/app/(app)/studio/page.tsx`
- **API Endpoint**: None (static page)
- **Type**: N/A

#### `/studio/course`
- **Purpose**: Course studio/management dashboard
- **Authentication**: Required (JWT)
- **Features**:
  - Displays owned courses table with "Manage" action buttons
  - Each course links to its individual edit page
  - Uses `OwnedCoursesList` component
  - Auth gate (shows login if not authenticated)
- **Component**: `src/app/(app)/studio/course/page.tsx`
- **API Endpoint**: `POST /course/owned`
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
  - Link to instructor dashboard
  - Save/Cancel actions
  - Loading/error states
- **Component**: `src/app/(app)/studio/course/[coursenft]/page.tsx`
- **API Endpoints**:
  - `POST /course/get` - Get course
  - `POST /course-module/list` - Get modules
  - `PATCH /course/update` - Update course (authenticated)
- **Types**:
  - `CourseOutput`
  - `ListCourseModulesOutput`

#### `/studio/course/[coursenft]/teacher`
- **Purpose**: Instructor dashboard - view student assignment commitments
- **Authentication**: Required (JWT)
- **URL Parameters**:
  - `coursenft` - Course NFT Policy ID
- **Features**:
  - Back button to course page
  - Course title display
  - Statistics cards:
    - Total commitments count
    - Pending commitments count
    - Accepted commitments count
    - Denied commitments count
  - Filtering system:
    - Filter by network status (Awaiting Evidence, Pending Approval, Accepted, Denied, Claimed)
    - Filter by assignment
    - Search by learner ID
  - Commitments table showing:
    - Learner ID (truncated)
    - Assignment title and code
    - Network status badge (with color coding)
    - Private status badge
    - Evidence preview
  - Empty states with filter clear option
  - Loading/error states
- **Component**: `src/app/(app)/studio/course/[coursenft]/teacher/page.tsx`
- **API Endpoints**:
  - `POST /course/get` - Get course details
  - `POST /assignment-commitment/list-by-course` - Get all commitments for course (authenticated)
- **Types**:
  - `CourseOutput`
  - `AssignmentCommitmentWithAssignmentOutput`

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
  - `POST /course-module/get` - Get module
  - `PATCH /course-module/update` - Update module (authenticated)
  - `PATCH /course-module/update-status` - Update status (authenticated)
- **Types**:
  - `CourseModuleOutput`

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
  - `POST /course-module/get` - Module details
  - `POST /slt/list` - SLT list
  - `POST /lesson/list` - Lesson list
  - `POST /slt/create` - Create SLT (authenticated)
  - `PATCH /slt/update` - Update SLT (authenticated)
  - `DELETE /slt/delete` - Delete SLT (authenticated)
- **Types**:
  - `CourseModuleOutput`
  - `ListSLTsOutput`
  - `SLTOutput`
  - `ListLessonsOutput`

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
  - `POST /assignment/get` - Get assignment
  - `POST /slt/list` - Get SLTs for linking
  - `POST /assignment/create` - Create assignment (authenticated)
  - `PATCH /assignment/update` - Update assignment (authenticated)
  - `DELETE /assignment/delete` - Delete assignment (authenticated)
- **Types**:
  - `AssignmentOutput`
  - `ListSLTsOutput`

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
  - `POST /lesson/get` - Get lesson
  - `POST /lesson/create` - Create lesson (authenticated)
  - `PATCH /lesson/update` - Update lesson (authenticated)
  - `DELETE /lesson/delete` - Delete lesson (authenticated)
- **Types**:
  - `LessonWithSLTOutput`

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
  - `POST /introduction/get` - Get introduction
  - `POST /introduction/create` - Create introduction (authenticated)
  - `PATCH /introduction/update` - Update introduction (authenticated)
  - **Note**: No DELETE endpoint (introductions cannot be deleted, only updated)
- **Types**:
  - `IntroductionOutput`

---

## Route Hierarchy Visualization

```
/course (public - all published courses)
  └── /course/[coursenft] (course detail)
      └── /course/[coursenft]/[modulecode] (module detail with SLTs/lessons)
          ├── /course/[coursenft]/[modulecode]/[moduleindex] (lesson detail)
          └── /course/[coursenft]/[modulecode]/assignment (assignment detail)

/courses (my owned courses - requires auth)

/studio (studio home)
  └── /studio/course (course management dashboard - owned courses)
      └── /studio/course/[coursenft] (course CRUD)
          ├── /studio/course/[coursenft]/teacher (instructor dashboard)
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
| `/course/[coursenft]/[modulecode]/assignment` | No | - | Public |
| `/courses` | Yes | JWT | Creator |
| `/studio` | Yes | JWT | Creator |
| `/studio/course` | Yes | JWT | Creator |
| `/studio/course/[coursenft]` | Yes | JWT | Creator/Owner |
| `/studio/course/[coursenft]/teacher` | Yes | JWT | Creator/Owner |
| `/studio/course/[coursenft]/[modulecode]` | Yes | JWT | Creator/Owner |
| `/studio/course/[coursenft]/[modulecode]/slts` | Yes | JWT | Creator/Owner |
| `/studio/course/[coursenft]/[modulecode]/assignment` | Yes | JWT | Creator/Owner |
| `/studio/course/[coursenft]/[modulecode]/[moduleindex]` | Yes | JWT | Creator/Owner |
| `/studio/course/[coursenft]/[modulecode]/introduction` | Yes | JWT | Creator/Owner |

---

## API Endpoints Used by Course Routes

### Public Endpoints (No Auth)
- `GET /course/published` - List all published courses
- `POST /course/get` - Get course by policy ID
- `POST /course-module/list` - Get course modules
- `POST /course-module/get` - Get module details
- `POST /slt/list` - Get module SLTs
- `POST /lesson/list` - Get module lessons
- `POST /lesson/get` - Get lesson details
- `POST /assignment/get` - Get assignment for module (used by learner view)
- `POST /introduction/get` - Get introduction for module

### Authenticated Endpoints (JWT Required)

**Course Management:**
- `POST /course/owned` - List courses owned by authenticated user
- `PATCH /course/update` - Update course details

**Module Management:**
- `PATCH /course-module/update` - Update module details
- `PATCH /course-module/update-status` - Update module status

**SLT Management:**
- `POST /slt/create` - Create new SLT
- `PATCH /slt/update` - Update SLT
- `DELETE /slt/delete` - Delete SLT

**Lesson Management:**
- `POST /lesson/create` - Create new lesson
- `PATCH /lesson/update` - Update lesson
- `DELETE /lesson/delete` - Delete lesson

**Assignment Management:**
- `POST /assignment/create` - Create new assignment
- `PATCH /assignment/update` - Update assignment
- `DELETE /assignment/delete` - Delete assignment

**Introduction Management:**
- `POST /introduction/create` - Create new introduction
- `PATCH /introduction/update` - Update introduction
- **Note**: No DELETE endpoint (introductions cannot be deleted)

**Assignment Commitment Management:**
- `POST /assignment-commitment/list-by-course` - Get all assignment commitments for a course (used by instructor dashboard)
- `POST /assignment-commitment/create` - Create new assignment commitment (learner creates commitment)
- `PATCH /assignment-commitment/update` - Update assignment commitment
- `DELETE /assignment-commitment/delete` - Delete assignment commitment

---

## Shared Components Used

- `AndamioAuthButton` - Authentication UI (`src/components/auth/andamio-auth-button.tsx`)
- `OwnedCoursesList` - Displays owned courses (`src/components/courses/owned-courses-list.tsx`)
- `RenderEditor` - Tiptap editor renderer (`src/components/editor`)
- `AssignmentCommitment` - Assignment commitment workflow component (`src/components/learner/assignment-commitment.tsx`)
- Andamio components (prefixed with `Andamio*`):
  - AndamioTable, AndamioCard, AndamioBadge, AndamioButton, AndamioDialog
  - AndamioAlert, AndamioSkeleton, AndamioInput, AndamioTextarea, AndamioLabel
  - AndamioSelect, AndamioSeparator
  - All use semantic color system with light/dark mode support
  - All styled with Tailwind CSS v4

---

## Key Features by Route Type

### Learner Routes
- Browse public course catalog
- View course structure (modules → lessons)
- Read lesson content with media
- View assignments and learning targets
- Create assignment commitments
- Submit evidence for assignments
- Progressive disclosure (course → module → lesson/assignment)

### Creator Routes
- Manage owned courses (via `/courses` or `/studio/course`)
- Studio home with links to different management areas
- Course and module CRUD operations
- SLT management (create, edit, delete)
- Lesson and assignment content editing with Tiptap
- Instructor dashboard to monitor student progress
- View and filter assignment commitments
- Preview lesson/SLT associations
- Navigate between management and public views

---

## Notes

1. **On-Chain Identifiers**: All routes use `courseNftPolicyId` and `moduleCode` instead of internal database IDs
2. **Type Safety**: All routes import types from `andamio-db-api` package via npm workspace
3. **Loading States**: All routes implement skeleton loaders (AndamioSkeleton) during data fetching
4. **Error Handling**: All routes have error states with user-friendly messages using AndamioAlert
5. **Empty States**: All list/collection views have empty states with guidance and appropriate actions
6. **Responsive Design**: All routes use Andamio components (based on shadcn/ui) with Tailwind CSS v4
7. **Authentication Flow**: Uses `useAndamioAuth` hook with JWT stored in localStorage
8. **SLT Limit**: Maximum 25 SLTs per module (enforced in UI and API)
9. **Semantic Colors**: All components use semantic color variables (success, warning, info, destructive, etc.) for consistent theming
10. **Assignment Commitments**: Learners can create commitments, submit evidence, and track status through the assignment page
11. **Instructor Dashboard**: Provides comprehensive filtering and searching of student assignment commitments
12. **Duplicate Routes**: `/courses` and `/studio/course` provide similar functionality (owned courses list) in different contexts

---

## Future Routes (Not Yet Implemented)

These are potential course-related routes that could be added:

- `/studio/course/create` - Create new course wizard
- `/studio/course/[coursenft]/modules/create` - Create new module wizard
- `/course/[coursenft]/enroll` - Course enrollment page
- `/course/[coursenft]/[modulecode]/introduction` - Public introduction page (learner view)
- `/my-learning` - Learner dashboard with enrolled courses
- `/my-learning/[coursenft]` - Learner progress for specific course with commitment tracking
- `/my-learning/[coursenft]/commitments` - All commitments for a course from learner perspective
- `/studio/course/[coursenft]/students` - Alternative view of students enrolled in a course
- `/studio/course/[coursenft]/analytics` - Course analytics and insights
- `/studio/course/[coursenft]/[modulecode]/preview` - Preview module as learner would see it
