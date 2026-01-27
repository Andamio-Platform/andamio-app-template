# Roles and Routes Reference

> **Consolidated mapping of user roles to frontend routes and API endpoints**
> Last Updated: January 27, 2026

This document provides a single reference for all user roles in the Andamio platform and the routes/endpoints each role requires.

---

## Role Overview

### Course System Roles

| Role | Description | Route Prefix |
|------|-------------|--------------|
| **User** (Public) | Browse courses, view content | `/course/*` |
| **Student** | Enroll, submit assignments, claim credentials | `/course/*` (with auth) |
| **Teacher** | Manage modules, SLTs, lessons, assignments, review submissions | `/studio/course/*` |
| **Owner** | Create courses, manage teachers, course settings | `/studio/course/*` |

### Project System Roles

| Role | Description | Route Prefix |
|------|-------------|--------------|
| **User** (Public) | Browse projects, view tasks | `/project/*` |
| **Contributor** | Enroll, commit to tasks, submit evidence, claim credentials | `/project/*/contributor` |
| **Manager** | Create tasks, review submissions, manage contributors | `/studio/project/*` |
| **Owner** | Create projects, manage managers, treasury operations | `/studio/project/*` |

---

## Course Routes by Role

### User (Public) - No Authentication

Browse and view course content without signing in.

| Route | Purpose |
|-------|---------|
| `/course` | Course catalog - browse all published courses |
| `/course/[coursenft]` | Course detail - view modules list |
| `/course/[coursenft]/[modulecode]` | Module detail - view SLTs and lessons |
| `/course/[coursenft]/[modulecode]/[moduleindex]` | Lesson viewer - read lesson content |
| `/course/[coursenft]/[modulecode]/assignment` | Assignment viewer - view assignment details |

**API Endpoints (Public)**:
- `GET /api/v2/course/user/courses/list` - List published courses
- `GET /api/v2/course/user/course/get/{course_id}` - Get course details
- `GET /api/v2/course/user/modules/{course_id}` - Get course modules
- `GET /api/v2/course/user/slts/{course_id}/{module_code}` - Get module SLTs
- `GET /api/v2/course/user/lesson/{course_id}/{module_code}/{slt_index}` - Get lesson
- `GET /api/v2/course/user/assignment/{course_id}/{module_code}` - Get assignment

---

### Student - Authentication Required

Enrolled learners who submit assignments and earn credentials.

| Route | Purpose |
|-------|---------|
| `/course/[coursenft]/[modulecode]/assignment` | Submit assignment commitment |
| `/dashboard` | View enrolled courses, progress |
| `/credentials` | View earned credentials |

**API Endpoints**:
- `POST /api/v2/course/student/courses/list` - List enrolled courses
- `POST /api/v2/course/student/commitment/create` - Create enrollment commitment
- `POST /api/v2/course/student/commitment/submit` - Submit assignment evidence
- `POST /api/v2/course/student/commitment/update` - Update commitment
- `POST /api/v2/course/student/commitment/claim` - Claim credential
- `POST /api/v2/course/student/commitment/leave` - Leave course
- `POST /api/v2/course/student/assignment-commitments/list` - List my commitments
- `POST /api/v2/course/student/assignment-commitment/get` - Get specific commitment

**Transaction Endpoints**:
- `POST /api/v2/tx/course/student/assignment/commit` - Commit to assignment (on-chain)
- `POST /api/v2/tx/course/student/assignment/update` - Update assignment (on-chain)
- `POST /api/v2/tx/course/student/credential/claim` - Claim credential (on-chain)

---

### Teacher - Authentication Required

Instructors who manage course content and review student submissions.

| Route | Purpose |
|-------|---------|
| `/studio/course` | Course studio - list courses where user is teacher |
| `/studio/course/[coursenft]` | Course editor - edit course metadata, view modules |
| `/studio/course/[coursenft]/teacher` | Instructor dashboard - review student submissions |
| `/studio/course/[coursenft]/new` | New module wizard |
| `/studio/course/[coursenft]/[modulecode]` | Module wizard - edit module |
| `/studio/course/[coursenft]/[modulecode]/introduction` | Introduction editor |
| `/studio/course/[coursenft]/[modulecode]/slts` | SLT management |
| `/studio/course/[coursenft]/[modulecode]/assignment` | Assignment editor |
| `/studio/course/[coursenft]/[modulecode]/[moduleindex]` | Lesson editor |

**API Endpoints**:
- `POST /api/v2/course/teacher/courses/list` - List courses where user is teacher
- `POST /api/v2/course/teacher/course-modules/list` - List modules
- `POST /api/v2/course/teacher/course-module/create` - Create module
- `POST /api/v2/course/teacher/course-module/register` - Register on-chain module
- `POST /api/v2/course/teacher/course-module/update` - Update module
- `POST /api/v2/course/teacher/course-module/delete` - Delete module
- `POST /api/v2/course/teacher/course-module/publish` - Publish module
- `POST /api/v2/course/teacher/slt/create` - Create SLT
- `POST /api/v2/course/teacher/slt/update` - Update SLT
- `POST /api/v2/course/teacher/slt/delete` - Delete SLT
- `POST /api/v2/course/teacher/slt/reorder` - Reorder SLTs
- `POST /api/v2/course/teacher/lesson/create` - Create lesson
- `POST /api/v2/course/teacher/lesson/update` - Update lesson
- `POST /api/v2/course/teacher/lesson/delete` - Delete lesson
- `POST /api/v2/course/teacher/introduction/create` - Create introduction
- `POST /api/v2/course/teacher/introduction/update` - Update introduction
- `POST /api/v2/course/teacher/introduction/delete` - Delete introduction
- `POST /api/v2/course/teacher/assignment/create` - Create assignment
- `POST /api/v2/course/teacher/assignment/update` - Update assignment
- `POST /api/v2/course/teacher/assignment/delete` - Delete assignment
- `POST /api/v2/course/teacher/assignment-commitments/list` - List pending assessments
- `POST /api/v2/course/teacher/assignment-commitment/review` - Review assignment

**Transaction Endpoints**:
- `POST /api/v2/tx/course/teacher/modules/manage` - Manage modules (on-chain)
- `POST /api/v2/tx/course/teacher/assignments/assess` - Assess assignments (on-chain)

---

### Owner - Authentication Required

Course creators who own courses and manage teacher access.

| Route | Purpose |
|-------|---------|
| `/studio/course` | Course studio - list owned courses |
| `/studio/course/[coursenft]` | Course editor - full access |
| All Teacher routes | Owners have full teacher access |

**API Endpoints** (in addition to Teacher endpoints):
- `POST /api/v2/course/owner/courses/list` - List owned courses
- `POST /api/v2/course/owner/course/create` - Create course
- `POST /api/v2/course/owner/course/register` - Register on-chain course
- `POST /api/v2/course/owner/course/update` - Update course metadata
- `POST /api/v2/course/owner/teachers/update` - Bulk update teachers

**Transaction Endpoints**:
- `POST /api/v2/tx/instance/owner/course/create` - Create course on-chain
- `POST /api/v2/tx/course/owner/teachers/manage` - Add/remove teachers (on-chain)

---

## Project Routes by Role

### User (Public) - No Authentication

Browse and view project details without signing in.

| Route | Purpose |
|-------|---------|
| `/project` | Project catalog - browse all published projects |
| `/project/[projectid]` | Project detail - view tasks list |
| `/project/[projectid]/[taskhash]` | Task detail - view task requirements |

**API Endpoints (Public)**:
- `GET /api/v2/project/user/projects/list` - List published projects
- `GET /api/v2/project/user/project/{project_id}` - Get project details
- `POST /api/v2/project/user/tasks/list` - List project tasks

---

### Contributor - Authentication Required

Project contributors who commit to tasks and earn credentials.

| Route | Purpose |
|-------|---------|
| `/project/[projectid]/contributor` | Contributor dashboard - enroll, commit, claim |
| `/project/[projectid]/[taskhash]` | Task commitment workflow |
| `/dashboard` | View contributing projects, progress |
| `/credentials` | View earned credentials |

**API Endpoints**:
- `POST /api/v2/project/contributor/projects/list` - List contributor projects
- `POST /api/v2/project/contributor/commitments/list` - List my commitments
- `POST /api/v2/project/contributor/commitment/create` - Create task commitment
- `POST /api/v2/project/contributor/commitment/get` - Get commitment details
- `POST /api/v2/project/contributor/commitment/update` - Update commitment
- `POST /api/v2/project/contributor/commitment/delete` - Delete commitment

**Transaction Endpoints**:
- `POST /api/v2/tx/project/contributor/task/commit` - Commit to task (on-chain)
- `POST /api/v2/tx/project/contributor/task/action` - Task action (on-chain)
- `POST /api/v2/tx/project/contributor/credential/claim` - Claim credential (on-chain)

---

### Manager - Authentication Required

Project managers who create tasks and review contributor submissions.

| Route | Purpose |
|-------|---------|
| `/studio/project` | Project studio - list managed projects |
| `/studio/project/[projectid]` | Project dashboard |
| `/studio/project/[projectid]/manager` | Manager dashboard - review task commitments |
| `/studio/project/[projectid]/draft-tasks` | Task list management |
| `/studio/project/[projectid]/draft-tasks/new` | Create new task |
| `/studio/project/[projectid]/draft-tasks/[taskindex]` | Edit task |

**API Endpoints**:
- `POST /api/v2/project/manager/projects/list` - List managed projects
- `POST /api/v2/project/manager/tasks/list` - List tasks (POST body)
- `GET /api/v2/project/manager/tasks/{project_id}` - List tasks (GET param)
- `POST /api/v2/project/manager/task/create` - Create task
- `POST /api/v2/project/manager/task/update` - Update task
- `POST /api/v2/project/manager/task/delete` - Delete task
- `POST /api/v2/project/manager/commitments/list` - List pending assessments

**Transaction Endpoints**:
- `POST /api/v2/tx/project/manager/tasks/manage` - Manage tasks (on-chain)
- `POST /api/v2/tx/project/manager/tasks/assess` - Assess tasks (on-chain)

---

### Owner - Authentication Required

Project creators who own projects and manage treasury/managers.

| Route | Purpose |
|-------|---------|
| `/studio/project` | Project studio - list owned projects |
| `/studio/project/[projectid]` | Project dashboard - full access (includes Treasury + Blacklist tabs) |
| `/studio/project/[projectid]/transaction-history` | View transaction history |
| All Manager routes | Owners have full manager access |

**API Endpoints** (in addition to Manager endpoints):
- `POST /api/v2/project/owner/projects/list` - List owned projects
- `POST /api/v2/project/owner/project/create` - Create project
- `POST /api/v2/project/owner/project/register` - Register on-chain project
- `POST /api/v2/project/owner/project/update` - Update project metadata

**Transaction Endpoints**:
- `POST /api/v2/tx/instance/owner/project/create` - Create project on-chain
- `POST /api/v2/tx/project/owner/managers/manage` - Add/remove managers (on-chain)
- `POST /api/v2/tx/project/owner/contributor-blacklist/manage` - Manage blacklist (on-chain)

---

## Global Routes (All Authenticated Users)

| Route | Purpose | Roles |
|-------|---------|-------|
| `/dashboard` | User dashboard with wallet info, learning progress | All |
| `/credentials` | On-chain credentials display | All |
| `/studio` | Studio hub - links to Course/Project Studio | Owners, Teachers, Managers |

**Global API Endpoints**:
- `GET /api/v1/user/me` - Get user profile
- `GET /api/v1/user/usage` - Get usage metrics

**Global Transaction Endpoints**:
- `POST /api/v2/tx/global/user/access-token/mint` - Mint access token
- `POST /api/v2/tx/register` - Register TX for monitoring
- `GET /api/v2/tx/status/{tx_hash}` - Get TX status
- `GET /api/v2/tx/pending` - List pending TXs

---

## Role Hierarchy

```
Course System                    Project System
─────────────                    ──────────────
     Owner                            Owner
       │                                │
       ▼                                ▼
    Teacher                          Manager
       │                                │
       ▼                                ▼
    Student                        Contributor
       │                                │
       ▼                                ▼
     User                             User
   (Public)                         (Public)
```

**Inheritance**:
- **Course Owner** inherits all Teacher permissions
- **Project Owner** inherits all Manager permissions
- All authenticated users can access public routes
- Public users can only access unauthenticated routes

---

## Route Access Matrix

### Course Routes

| Route | User | Student | Teacher | Owner |
|-------|:----:|:-------:|:-------:|:-----:|
| `/course` | ✅ | ✅ | ✅ | ✅ |
| `/course/[id]` | ✅ | ✅ | ✅ | ✅ |
| `/course/[id]/[mod]` | ✅ | ✅ | ✅ | ✅ |
| `/course/[id]/[mod]/[idx]` | ✅ | ✅ | ✅ | ✅ |
| `/course/[id]/[mod]/assignment` | ✅ | ✅ | ✅ | ✅ |
| Assignment commitment UI | ❌ | ✅ | ✅ | ✅ |
| `/studio/course` | ❌ | ❌ | ✅ | ✅ |
| `/studio/course/[id]` | ❌ | ❌ | ✅ | ✅ |
| `/studio/course/[id]/teacher` | ❌ | ❌ | ✅ | ✅ |
| `/studio/course/[id]/[mod]/*` | ❌ | ❌ | ✅ | ✅ |
| Teacher management | ❌ | ❌ | ❌ | ✅ |

### Project Routes

| Route | User | Contributor | Manager | Owner |
|-------|:----:|:-----------:|:-------:|:-----:|
| `/project` | ✅ | ✅ | ✅ | ✅ |
| `/project/[id]` | ✅ | ✅ | ✅ | ✅ |
| `/project/[id]/[task]` | ✅ | ✅ | ✅ | ✅ |
| Task commitment UI | ❌ | ✅ | ✅ | ✅ |
| `/project/[id]/contributor` | ❌ | ✅ | ✅ | ✅ |
| `/studio/project` | ❌ | ❌ | ✅ | ✅ |
| `/studio/project/[id]` | ❌ | ❌ | ✅ | ✅ |
| `/studio/project/[id]/manager` | ❌ | ❌ | ✅ | ✅ |
| `/studio/project/[id]/draft-tasks/*` | ❌ | ❌ | ✅ | ✅ |
| Treasury tab (in dashboard) | ❌ | ❌ | ❌ | ✅ |
| Blacklist tab (in dashboard) | ❌ | ❌ | ❌ | ✅ |
| Manager management | ❌ | ❌ | ❌ | ✅ |

---

## Implementation Status

### Course Routes

| Route | Status | Notes |
|-------|--------|-------|
| `/course` | ✅ Implemented | Public catalog |
| `/course/[coursenft]` | ✅ Implemented | Course detail |
| `/course/[coursenft]/[modulecode]` | ✅ Implemented | Module detail |
| `/course/[coursenft]/[modulecode]/[moduleindex]` | ✅ Implemented | Lesson viewer |
| `/course/[coursenft]/[modulecode]/assignment` | ✅ Implemented | Assignment + commitment |
| `/studio/course` | ✅ Implemented | Course studio |
| `/studio/course/[coursenft]` | ✅ Implemented | Course editor |
| `/studio/course/[coursenft]/teacher` | ✅ Implemented | Instructor dashboard |
| `/studio/course/[coursenft]/[modulecode]` | ✅ Implemented | Module wizard |
| `/studio/course/[coursenft]/[modulecode]/slts` | ✅ Implemented | SLT management |
| `/studio/course/[coursenft]/[modulecode]/assignment` | ✅ Implemented | Assignment editor |
| `/studio/course/[coursenft]/[modulecode]/[moduleindex]` | ✅ Implemented | Lesson editor |
| `/studio/course/[coursenft]/[modulecode]/introduction` | ✅ Implemented | Introduction editor |

### Project Routes

| Route | Status | Notes |
|-------|--------|-------|
| `/project` | ✅ Implemented | Public catalog |
| `/project/[projectid]` | ✅ Implemented | Project detail |
| `/project/[projectid]/[taskhash]` | ✅ Implemented | Task detail |
| `/project/[projectid]/contributor` | ✅ Implemented | Contributor dashboard |
| `/studio/project` | ✅ Implemented | Project studio |
| `/studio/project/[projectid]` | ✅ Implemented | Project dashboard (Treasury + Blacklist tabs) |
| `/studio/project/[projectid]/manager` | ✅ Implemented | Manager dashboard - reviews task commitments |
| `/studio/project/[projectid]/draft-tasks` | ✅ Implemented | Task list |
| `/studio/project/[projectid]/draft-tasks/new` | ✅ Implemented | Create task |
| `/studio/project/[projectid]/draft-tasks/[taskindex]` | ✅ Implemented | Edit task |
| `/studio/project/[projectid]/transaction-history` | 🚧 Planned | TX history |

---

## Related Documentation

- **Route Reference**: `.claude/skills/design-system/route-reference.md`
- **Sitemap**: `.claude/skills/project-manager/SITEMAP.md`
- **API Endpoints**: `.claude/skills/audit-api-coverage/unified-api-endpoints.md`
- **Course Routes Detail**: `.claude/skills/project-manager/course-local-state.md`
- **Project Routes Detail**: `.claude/skills/project-manager/project-local-state.md`

---

**Last Updated**: January 27, 2026
**Maintained By**: Andamio Platform Team
