# API Refinement Session Notes

**Date**: 2026-01-17
**Status**: V2 API changes NOT YET LIVE - planning integration now
**Total V2 Public Endpoints**: 92

---

## Session Goals

Audit current API endpoint usage in the T3 app to prepare for V2 API migration.

---

## V2 API Changes Summary

### 1. New Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v2/course/owner/course/register` | POST | Register on-chain course not yet in DB |
| `/api/v2/project/owner/project/register` | POST | Register on-chain project not yet in DB |
| `/api/v2/project/owner/projects/list` | POST | List all projects owned by owner |

**Register endpoint payloads**:
```typescript
// Course
POST /api/v2/course/owner/course/register
{ policy_id: string; title: string; }

// Project
POST /api/v2/project/owner/project/register
{ policy_id: string; title: string; }
```

---

### 2. Endpoint Renames

| Old Endpoint | New Endpoint |
|--------------|--------------|
| `/api/v2/course/teacher/assignment-commitments/list-by-course` | `/api/v2/course/teacher/assignment-commitments/list` |
| `/api/v2/course/student/assignment-commitments/list-by-course` | `/api/v2/course/student/assignment-commitments/list` |
| `/api/v2/course/teacher/slt/update-index` | `/api/v2/course/teacher/slt/reorder` |

**Note**: `list` endpoints now accept `course_id` as optional filter. When omitted, returns all accessible commitments.

---

### 3. Method/Parameter Changes (GET → POST)

| Old | New |
|-----|-----|
| `GET /api/v2/project/user/tasks/{project_state_policy_id}` | `POST /api/v2/project/user/tasks/list` with `{project_id}` body |
| `GET /api/v2/project/manager/tasks/{project_state_policy_id}` | `POST /api/v2/project/manager/tasks/list` with `{project_id}` body |

---

### 4. Merged Endpoints (Richer Data)

These endpoints now include on-chain data from Andamioscan - no separate calls needed:

| Endpoint | What's Merged |
|----------|---------------|
| `/api/v2/course/user/courses/list` | On-chain course data |
| `/api/v2/course/user/course/get/{policy_id}` | On-chain course data |
| `/api/v2/course/owner/courses/list` | Shows unregistered on-chain courses |
| `/api/v2/course/student/courses/list` | On-chain enrollment data |
| `/api/v2/course/student/course-status/get` | On-chain progress data |
| `/api/v2/course/student/assignment-commitments/list` | On-chain commitment data |
| `/api/v2/project/user/projects/list` | On-chain project + project-state |
| `/api/v2/project/user/project/get/{project_id}` | On-chain project + project-state |
| `/api/v2/project/user/tasks/list` | On-chain task data |
| `/api/v2/project/owner/projects/list` | Shows unregistered on-chain projects |
| `/api/v2/project/contributor/commitments/list` | On-chain commitment data |
| `/api/v2/project/contributor/commitment/get` | On-chain commitment data |
| `/api/v2/project/contributor/status/{project_id}/{alias}` | On-chain contributor status |

---

### 5. Removed Endpoints

| Removed | Use Instead |
|---------|-------------|
| `/api/v2/course/user/course-module/get/{policy_id}/{module_code}` | `/api/v2/course/user/course-modules/list/{policy_id}` + filter |
| `/api/v2/course/user/slt/get/{policy_id}/{module_code}/{index}` | `/api/v2/course/user/slts/list/{policy_id}/{module_code}` + filter |
| `/api/v2/project/user/task/get/{task_hash}` | `/api/v2/project/user/tasks/list` + filter |
| `/api/v2/project/user/project-state/{project_state_policy_id}` | Data in `/projects/list` and `/project/get` |
| `/api/v2/course/user/modules/assignment-summary/{policy_id}` | Use `/course/get` for counts |

---

### 6. Role Name Change (Project System)

| Old | New |
|-----|-----|
| `/api/v2/project/admin/*` | `/api/v2/project/owner/*` |

This aligns Project with Course (which already uses `owner`). The `owner` role represents the entity that created and controls the instance.

**Note**: Course system already uses `owner` and does not change.

---

## Quick Reference: Owner Endpoints

**Course Owner**:
```
POST /api/v2/course/owner/course/create
POST /api/v2/course/owner/course/register   ← NEW
POST /api/v2/course/owner/course/update
POST /api/v2/course/owner/course/delete
POST /api/v2/course/owner/courses/list      ← Merged (shows unregistered)
```

**Project Owner**:
```
POST /api/v2/project/owner/project/create
POST /api/v2/project/owner/project/register  ← NEW
POST /api/v2/project/owner/project/update
POST /api/v2/project/owner/projects/list     ← NEW + Merged
```

---

## App Impact Analysis

### Currently Used Endpoints (Legacy → V2)

| Current Usage | File | New Endpoint |
|---------------|------|--------------|
| `POST /course/owner/course/mint` | `src/app/(studio)/studio/course/page.tsx:660` | `POST /api/v2/course/owner/course/register` |
| `POST /project-v2/admin/project/register` | `src/app/(app)/studio/project/page.tsx:461` | `POST /api/v2/project/owner/project/register` |

### Payload Changes

**Course Register** (field name change):
```typescript
// Old
{ title: string; course_nft_policy_id: string; }

// New
{ title: string; policy_id: string; }
```

**Project Register** (field name change):
```typescript
// Old
{ title: string; project_id: string; }

// New
{ title: string; policy_id: string; }
```

---

## Audit TODO

Need to search codebase for usage of:

- [ ] `/course/teacher/assignment-commitments/list-by-course` → renamed
- [ ] `/course/student/assignment-commitments/list-by-course` → renamed
- [ ] `/course/teacher/slt/update-index` → renamed to `reorder`
- [ ] `GET /project/user/tasks/{id}` → now POST with body
- [ ] `GET /project/manager/tasks/{id}` → now POST with body
- [ ] `/course/user/course-module/get/` → removed
- [ ] `/course/user/slt/get/` → removed
- [ ] `/project/user/task/get/` → removed
- [ ] `/project/user/project-state/` → removed
- [ ] `/course/user/modules/assignment-summary/` → removed
- [ ] `/project/admin/` → renamed to `/project/owner/` (Course keeps `owner`)

---

## Session Log

| Time | Action |
|------|--------|
| Session start | Searched for `/course/admin/course/mint` - not found |
| | Identified course/project registration endpoints in use |
| | Documented initial findings |
| | Received full V2 API changes overview |
| | Updated document with complete change list |

---

## Timeline

1. **Now**: Audit codebase, plan integration changes
2. **Signal from API team**: V2 API is live
3. **After signal**: Implement integration changes

---

*Last updated: 2026-01-17*
