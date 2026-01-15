# Application Sitemap

> **Complete route and page mapping for Andamio T3 App Template**
> Last Updated: January 14, 2026

This document provides a comprehensive overview of all routes, their purpose, authentication requirements, and API dependencies.

---

## Route Overview

### Route Groups

| Group | Path Prefix | Layout | Purpose |
|-------|-------------|--------|---------|
| (app) | `/` | AppLayout with Sidebar | Main application pages |
| (studio) | `/studio` | StudioLayout with Header | Studio/creator pages |
| Root | `/` | None | Redirects to /dashboard |

---

## Static Routes

### Main Navigation

| Route | Page | Auth | Description |
|-------|------|------|-------------|
| `/` | `app/page.tsx` | No | Redirects to `/dashboard` |
| `/dashboard` | `app/(app)/dashboard/page.tsx` | Yes | User dashboard with wallet info, My Learning |
| `/course` | `app/(app)/course/page.tsx` | No | Public course catalog (Learner browse) |
| `/project` | `app/(app)/project/page.tsx` | No | Public project catalog (Contributor browse) |
| `/courses` | `app/(app)/courses/page.tsx` | Yes | Legacy course management page |
| `/studio` | `app/(app)/studio/page.tsx` | Yes | Studio hub with links to Course/Project Studio |
| `/sitemap` | `app/(app)/sitemap/page.tsx` | No | Development sitemap tool |
| `/editor` | `app/(app)/editor/page.tsx` | No | Standalone editor demo |
| `/components` | `app/(app)/components/page.tsx` | No | Component library showcase |
| `/credentials` | `app/(app)/credentials/page.tsx` | Yes | On-chain credentials display |

### Studio Pages

| Route | Page | Auth | Description |
|-------|------|------|-------------|
| `/studio` | `app/(studio)/studio/page.tsx` | Yes | Studio hub |
| `/studio/course` | `app/(studio)/studio/course/page.tsx` | Yes | Course Studio - split-pane layout |
| `/studio/project` | `app/(studio)/studio/project/page.tsx` | Yes | Project Studio - manage owned projects |

---

## Dynamic Routes

### Learner Course Routes

| Route | Page | Auth | Description |
|-------|------|------|-------------|
| `/course/[coursenft]` | `app/(app)/course/[coursenft]/page.tsx` | No | Course detail view |
| `/course/[coursenft]/[modulecode]` | `app/(app)/course/[coursenft]/[modulecode]/page.tsx` | No | Module detail with SLTs and lessons |
| `/course/[coursenft]/[modulecode]/[moduleindex]` | `app/(app)/course/[coursenft]/[modulecode]/[moduleindex]/page.tsx` | No | Lesson viewer |
| `/course/[coursenft]/[modulecode]/assignment` | `app/(app)/course/[coursenft]/[modulecode]/assignment/page.tsx` | No | Assignment viewer and commitment |

### Contributor Project Routes

| Route | Page | Auth | Description |
|-------|------|------|-------------|
| `/project/[projectid]` | `app/(app)/project/[projectid]/page.tsx` | No | Project detail with tasks |
| `/project/[projectid]/contributor` | `app/(app)/project/[projectid]/contributor/page.tsx` | Yes | Contributor dashboard - enroll, commit tasks, claim credentials |
| `/project/[projectid]/[taskhash]` | `app/(app)/project/[projectid]/[taskhash]/page.tsx` | No | Task detail and commitment |

### Creator Studio - Course Routes

| Route | Page | Auth | Description |
|-------|------|------|-------------|
| `/studio/course` | `app/(studio)/studio/course/page.tsx` | Yes | Course studio landing with split-pane layout |
| `/studio/course/[coursenft]` | `app/(studio)/studio/course/[coursenft]/page.tsx` | Yes | Course editor with credential tabs |
| `/studio/course/[coursenft]/new` | `app/(studio)/studio/course/[coursenft]/new/page.tsx` | Yes | New module wizard |
| `/studio/course/[coursenft]/instructor` | `app/(studio)/studio/course/[coursenft]/instructor/page.tsx` | Yes | Instructor view - student submissions |
| `/studio/course/[coursenft]/[modulecode]` | `app/(studio)/studio/course/[coursenft]/[modulecode]/page.tsx` | Yes | Module wizard editor |
| `/studio/course/[coursenft]/[modulecode]/introduction` | `app/(studio)/studio/course/.../introduction/page.tsx` | Yes | Introduction content editor |
| `/studio/course/[coursenft]/[modulecode]/slts` | `app/(studio)/studio/course/.../slts/page.tsx` | Yes | SLT management |
| `/studio/course/[coursenft]/[modulecode]/assignment` | `app/(studio)/studio/course/.../assignment/page.tsx` | Yes | Assignment editor |
| `/studio/course/[coursenft]/[modulecode]/[moduleindex]` | `app/(studio)/studio/course/.../[moduleindex]/page.tsx` | Yes | Lesson editor |

### Creator Studio - Project Routes

| Route | Page | Auth | Description |
|-------|------|------|-------------|
| `/studio/project/[projectid]` | `app/(app)/studio/project/[projectid]/page.tsx` | Yes | Project dashboard |
| `/studio/project/[projectid]/manager` | `app/(app)/studio/project/[projectid]/manager/page.tsx` | Yes | Manager dashboard - review task submissions, accept/deny |
| `/studio/project/[projectid]/draft-tasks` | `app/(app)/studio/project/.../draft-tasks/page.tsx` | Yes | Task list management |
| `/studio/project/[projectid]/draft-tasks/new` | `app/(app)/studio/project/.../new/page.tsx` | Yes | Create new task |
| `/studio/project/[projectid]/draft-tasks/[taskindex]` | `app/(app)/studio/project/.../[taskindex]/page.tsx` | Yes | Edit existing task |
| `/studio/project/[projectid]/commitments` | `app/(app)/studio/project/.../commitments/page.tsx` | Yes | Manager view - pending assessments, DB sync |

---

## API Dependencies by Route

### Public Routes (No Auth)

#### `/course` - Course Catalog
```
GET  /course/published           List all published courses
```

#### `/course/[coursenft]` - Course Detail
```
POST /course/get                 Get course by policy ID
POST /course-module/list         Get modules for course
```

#### `/course/[coursenft]/[modulecode]` - Module Detail
```
POST /course/get                 Get course info
POST /course-module/get          Get module details
POST /slt/list                   Get SLTs for module
POST /lesson/list                Get lessons for module
```

#### `/course/[coursenft]/[modulecode]/[moduleindex]` - Lesson Viewer
```
POST /course/get                 Get course info
POST /course-module/get          Get module info
POST /lesson/get                 Get lesson content
```

#### `/course/[coursenft]/[modulecode]/assignment` - Assignment Viewer
```
POST /course/get                 Get course info
POST /course-module/get          Get module info
POST /assignment/get             Get assignment content
POST /assignment-commitment/list Get learner's commitments (if auth)
```

#### `/project` - Project Catalog
```
POST /projects/list              List all published projects
```

#### `/project/[projectid]` - Project Detail
```
POST /projects/list              Filter to specific project
POST /tasks/list                 Get tasks for project
```

#### `/project/[projectid]/[taskhash]` - Task Detail
```
POST /tasks/list                 Filter to specific task
POST /task-commitments/get       Get commitment if exists (if auth)
```
**Components**: `AndamioDashboardStat` (stats grid), `ContentEditor` (evidence), `ProjectEnroll` / `TaskCommit` (transactions)

### Protected Routes (Requires Auth)

#### `/dashboard` - User Dashboard
```
GET  /learner/my-learning        Get learner's enrolled courses
POST /credential/list            Get learner's credentials (per course)
```
**Andamioscan Hooks**: `useEnrolledCourses`, `usePendingAssessments`, `useCompletedCourses`, `useContributingProjects`, `useManagingProjects`, `useOwnedCourses`, `useUserGlobalState`

#### `/credentials` - Credentials Page
```
GET  /v2/users/{alias}/courses/completed    Get completed courses (Andamioscan)
```
**Andamioscan Hooks**: `useCompletedCourses`

#### `/studio/course` - Course Studio
```
GET  /courses/owned              Get owned courses
POST /course-modules/list        Get module counts (by policy IDs)
```

#### `/studio/course/[coursenft]` - Course Editor
```
POST /course/get                 Get course details
POST /course-module/list         Get modules
POST /course-module/with-assignments  Get modules with assignment status
GET  /course/unpublished-projects Get linked projects
PATCH /course/update             Save course changes
DELETE /course/delete            Delete course
```

#### `/studio/course/[coursenft]/instructor` - Instructor View
```
POST /course/get                 Get course details
POST /assignment-commitment/by-course  Get all student submissions
```

#### `/studio/course/[coursenft]/[modulecode]` - Module Editor
```
POST /course/get                 Get course info
POST /course-module/get          Get module details
POST /course-module/list         Get sibling modules for nav
PATCH /course-module/update      Save module changes
PATCH /course-module/update-status  Update publication status
DELETE /course-module/delete     Delete module
```

#### `/studio/course/.../introduction` - Introduction Editor
```
POST /course/get                 Get course info
POST /course-module/get          Get module info
POST /introduction/get           Get introduction content
POST /introduction/create        Create new introduction
POST /introduction/update        Update introduction
POST /introduction/publish       Toggle live status
```

#### `/studio/course/.../slts` - SLT Management
```
POST /course/get                 Get course info
POST /course-module/get          Get module info
POST /slt/list                   Get all SLTs
POST /lesson/list                Get lessons for status
POST /slt/create                 Create new SLT
PATCH /slt/update                Update SLT text
DELETE /slt/delete               Delete SLT
POST /slt/reorder                Reorder SLTs
POST /slt/get                    Quick jump to SLT
```

#### `/studio/course/.../assignment` - Assignment Editor
```
POST /course/get                 Get course info
POST /course-module/get          Get module info
POST /slt/list                   Get SLTs for linking
POST /assignment/get             Get assignment content
POST /assignment/create          Create new assignment
PATCH /assignment/update         Update assignment
DELETE /assignment/delete        Delete assignment
POST /assignment/publish         Toggle live status
```

#### `/studio/course/.../[moduleindex]` - Lesson Editor
```
POST /course/get                 Get course info
POST /course-module/get          Get module info
POST /lesson/get                 Get lesson content
POST /lesson/create              Create new lesson
POST /lesson/update              Update lesson
POST /lesson/delete              Delete lesson
POST /lesson/publish             Toggle live status
```

#### `/studio/project` - Project Studio
```
POST /projects/list-owned        Get owned projects
```

#### `/studio/project/[projectid]` - Project Dashboard
```
POST /projects/list-owned        Filter to specific project
POST /tasks/list                 Get tasks for project
POST /projects/update            Update project metadata
```

#### `/studio/project/[projectid]/manager` - Manager Dashboard
```
POST /projects/list              Get project details
POST /task-submissions/list      Get all task submissions for project
POST /task-submissions/accept    Accept a task submission
POST /task-submissions/deny      Deny a task submission
```

#### `/project/[projectid]/contributor` - Contributor Dashboard
```
POST /projects/list              Get project details
POST /tasks/list                 Get available tasks
POST /contributor/enroll         Enroll in project and commit to task
POST /task-commit/create         Commit to a task
POST /credential/claim           Claim earned credentials
```

#### `/studio/project/.../draft-tasks` - Task Management
```
POST /tasks/list                 Get all tasks
DELETE /tasks/delete             Delete draft task
```

#### `/studio/project/.../draft-tasks/new` - Create Task
```
POST /tasks/create               Create new task
```

#### `/studio/project/.../draft-tasks/[taskindex]` - Edit Task
```
POST /tasks/list                 Filter to specific task
POST /tasks/update               Update task
```

---

## Route Parameter Reference

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `coursenft` | string | Course NFT policy ID | `abc123def456...` |
| `modulecode` | string | Module code slug | `module-101` |
| `moduleindex` | number | SLT/Lesson index (0-24) | `0`, `5`, `24` |
| `treasurynft` | string | Treasury NFT policy ID | `xyz789ghi012...` |
| `taskhash` | string | Task hash identifier | `task-abc123` |
| `taskindex` | number | Draft task index | `1`, `2`, `3` |

---

## Breadcrumb Navigation

### Course Routes (Public)
```
Browse Courses → Course Title → Module Title → Lesson/Assignment
/course        → [coursenft]  → [modulecode] → [moduleindex] or assignment
```

### Studio Course Routes (Protected)
```
Studio → Courses → Course Title → Module Title → Content Type
/studio/course → [coursenft] → [modulecode] → introduction/slts/assignment/[moduleindex]
```

### Studio Project Routes (Protected)
```
Studio → Projects → Project Title → Tasks
/studio/project → [projectid] → draft-tasks → new/[taskindex]
```

---

## Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    App Layout (app/(app))                    │
├────────────────┬────────────────────────────────────────────┤
│   Sidebar      │              Content Area                   │
│   (256px)      │                                            │
│                │   ┌────────────────────────────────────┐   │
│   Navigation   │   │  Page Header (Breadcrumb + Title)  │   │
│   - Dashboard  │   ├────────────────────────────────────┤   │
│   - Courses    │   │                                    │   │
│   - Projects   │   │         Page Content               │   │
│   - Studio     │   │         (Scrollable)               │   │
│                │   │                                    │   │
│   User Info    │   │                                    │   │
│   - Wallet     │   │                                    │   │
│   - Auth       │   └────────────────────────────────────┘   │
└────────────────┴────────────────────────────────────────────┘
```

---

## Related Documentation

- [API-COVERAGE.md](./api/API-COVERAGE.md) - API endpoint implementation status
- [API-ENDPOINT-REFERENCE.md](./api/API-ENDPOINT-REFERENCE.md) - Full endpoint documentation
- [sitemaps/README.md](./sitemaps/README.md) - API systems overview
- [sitemaps/course-local-state.md](./sitemaps/course-local-state.md) - Course API mapping
- [sitemaps/project-local-state.md](./sitemaps/project-local-state.md) - Project API mapping

---

**Last Updated**: January 8, 2026
**Maintained By**: Andamio Platform Team
