# Andamioscan API Endpoints

This document maps all Andamioscan API endpoints used by the Andamio T3 App Template.

**Base URL**: `https://preprod.andamioscan.andamio.space` (preprod)

**Purpose**: Andamioscan provides **read-only on-chain data** about courses, students, and users. It indexes blockchain state and provides a queryable API. This is distinct from:
- **Andamio DB API** - Internal database for local state (drafts, metadata, CRUD operations)
- **Atlas Tx API** - Transaction building (documented in andamio-docs)

## Summary

| # | Endpoint | Method | Purpose | Used In |
|---|----------|--------|---------|---------|
| 1 | `/v2/courses` | GET | List all courses on-chain | Course catalog, discovery |
| 2 | `/v2/courses/{course_id}` | GET | Get course details | Course detail pages |
| 3 | `/v2/courses/{course_id}/students` | GET | List enrolled students | Instructor dashboard |
| 4 | `/v2/courses/{course_id}/students/{alias}` | GET | Get student details | Student progress view |
| 5 | `/v2/user/all` | GET | List all user aliases | Admin/discovery |
| 6 | `/v2/user/global-state/{alias}` | GET | Get user's courses & credentials | User profile, dashboard |

**Total: 6 Endpoints (4 Course + 2 User)**

---

## Course Endpoints

### 1. `GET /v2/courses`

**Purpose**: Get all courses indexed on-chain.

**Authentication**: None (public)

**Response**: Array of `Course` objects

```typescript
type Course = {
  course_id: string;          // Course identifier (policy ID)
  course_address: string;     // Course script address
  course_state_policy_id: string;
  teachers: string[];         // Array of teacher aliases
  modules: Module[];          // Array of on-chain modules
};

type Module = {
  assignment_id: string;      // Module hash (Blake2b-256 of SLTs)
  created_by: string;         // Creator alias
  prerequisites: string[];    // Prerequisite module hashes
  slts: string[];             // On-chain SLT content
};
```

**Used In**:
| Route | Component | Purpose |
|-------|-----------|---------|
| `/course` | `PublishedCoursesList` | Display course catalog from on-chain data |

**Notes**:
- Returns courses that exist on-chain (have been published via transaction)
- Module `assignment_id` is the SLT hash - matches `computeSltHash(slts)` from `@andamio/transactions`
- Combine with DB API `/course/published` to get full metadata (descriptions, categories, etc.)

---

### 2. `GET /v2/courses/{course_id}`

**Purpose**: Get details for a specific course.

**Authentication**: None (public)

**Parameters**:
| Name | Type | Location | Description |
|------|------|----------|-------------|
| `course_id` | string | path | Course NFT Policy ID |

**Response**: Single `Course` object (see above)

**Used In**:
| Route | Component | Purpose |
|-------|-----------|---------|
| `/course/[coursenft]` | `CourseDetailPage` | Verify course exists on-chain |
| `/studio/course/[coursenft]` | `CourseManagement` | Show on-chain status |

**Notes**:
- Use to verify a course has been published on-chain
- Teachers array shows who can manage the course
- Modules array shows what's been minted on-chain

---

### 3. `GET /v2/courses/{course_id}/students`

**Purpose**: Get all students enrolled in a course.

**Authentication**: None (public)

**Parameters**:
| Name | Type | Location | Description |
|------|------|----------|-------------|
| `course_id` | string | path | Course NFT Policy ID |

**Response**: Array of `Student` objects

```typescript
type Student = {
  alias: string;              // Student's access token alias
  course_id: string;          // Course they're enrolled in
  current: string | null;     // Current assignment (module hash)
  completed: string[];        // Array of completed module hashes
};
```

**Used In**:
| Route | Component | Purpose |
|-------|-----------|---------|
| `/studio/course/[coursenft]/instructor` | `InstructorDashboard` | View all enrolled students |
| `/studio/course/[coursenft]/instructor` | `StudentCommitmentsList` | Display student progress |

**Notes**:
- `current` is the module hash the student is currently working on
- `completed` contains hashes of modules they've completed (credentials earned)
- Cross-reference with DB API assignment commitments for evidence details

---

### 4. `GET /v2/courses/{course_id}/students/{alias}`

**Purpose**: Get details for a specific student in a course.

**Authentication**: None (public)

**Parameters**:
| Name | Type | Location | Description |
|------|------|----------|-------------|
| `course_id` | string | path | Course NFT Policy ID |
| `alias` | string | path | Student's access token alias |

**Response**: Single `Student` object (see above)

**Used In**:
| Route | Component | Purpose |
|-------|-----------|---------|
| `/studio/course/[coursenft]/instructor` | `StudentDetailView` | View individual student progress |
| `/course/[coursenft]/my-progress` | `StudentProgress` | Show learner their own progress |

**Notes**:
- Use to check if a specific user is enrolled in a course
- Compare `completed` array against DB API commitments for detailed evidence

---

## User Endpoints

### 5. `GET /v2/user/all`

**Purpose**: Get all user aliases that have minted access tokens.

**Authentication**: None (public)

**Response**: Array of strings (aliases)

```typescript
type Response = string[];
// Example: ["alice", "bob", "charlie"]
```

**Used In**:
| Route | Component | Purpose |
|-------|-----------|---------|
| Admin dashboard | `UserDiscovery` | Find users on the platform |

**Notes**:
- Returns aliases of all users who have minted an access token
- Useful for admin/discovery but may be large in production

---

### 6. `GET /v2/user/global-state/{alias}`

**Purpose**: Get a user's global state including all courses and credentials.

**Authentication**: None (public)

**Parameters**:
| Name | Type | Location | Description |
|------|------|----------|-------------|
| `alias` | string | path | User's access token alias |

**Response**: `UserGlobalState` object

```typescript
type UserGlobalState = {
  alias: string;
  courses: UserCourse[];
};

type UserCourse = {
  course_id: string;          // Course NFT Policy ID
  is_enrolled: boolean;       // Whether user is enrolled
  credential_id: string | null;  // Credential token if earned
  credentials: string[];      // All credentials earned in this course
};
```

**Used In**:
| Route | Component | Purpose |
|-------|-----------|---------|
| `/dashboard` | `UserDashboard` | Show user's enrollments and credentials |
| `/course/[coursenft]` | `EnrollmentStatus` | Check if user is enrolled |
| `/profile` | `CredentialsList` | Display earned credentials |

**Notes**:
- Single endpoint to get all of a user's on-chain activity
- `is_enrolled` true means they have a course state token
- `credentials` array contains module hashes they've completed

---

## Integration Patterns

### Combining Andamioscan + DB API Data

Most views require combining on-chain data (Andamioscan) with local metadata (DB API):

```typescript
// Example: Course detail page
async function getCourseWithMetadata(courseId: string) {
  // On-chain data: teachers, modules, students
  const onChain = await fetch(`${ANDAMIOSCAN_URL}/v2/courses/${courseId}`);

  // Local data: title, description, category, draft content
  const local = await fetch(`${DB_API_URL}/course/get`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ course_nft_policy_id: courseId })
  });

  return {
    ...await local.json(),
    onChain: await onChain.json(),
  };
}
```

### Verifying On-Chain Status

Before allowing certain actions, verify on-chain state:

```typescript
// Check if user is enrolled before showing assignment UI
const userState = await fetch(`${ANDAMIOSCAN_URL}/v2/user/global-state/${alias}`);
const { courses } = await userState.json();
const enrollment = courses.find(c => c.course_id === courseId);

if (!enrollment?.is_enrolled) {
  return <EnrollButton />;
}
```

### Module Hash Cross-Reference

Module `assignment_id` in Andamioscan = module token name = `computeSltHash(slts)`:

```typescript
import { computeSltHash } from "@andamio/transactions";

// Verify local module matches on-chain
const localModule = await getModuleFromDB(courseId, moduleCode);
const expectedHash = computeSltHash(localModule.slts.map(s => s.text));

const course = await fetch(`${ANDAMIOSCAN_URL}/v2/courses/${courseId}`);
const onChainModule = course.modules.find(m => m.assignment_id === expectedHash);

if (onChainModule) {
  console.log("Module is published on-chain");
}
```

---

## Coverage Checklist

### API Client ✅

All endpoints have typed client functions in `src/lib/andamioscan.ts`:

| Endpoint | Function | Hook |
|----------|----------|------|
| `GET /v2/courses` | `getAllCourses()` | `useAllCourses()` |
| `GET /v2/courses/{id}` | `getCourse(id)` | `useCourse(id)` |
| `GET /v2/courses/{id}/students` | `getCourseStudents(id)` | `useCourseStudents(id)` |
| `GET /v2/courses/{id}/students/{alias}` | `getCourseStudent(id, alias)` | `useCourseStudent(id, alias)` |
| `GET /v2/user/global-state/{alias}` | `getUserGlobalState(alias)` | `useUserGlobalState(alias)` |
| `GET /v2/user/all` | `getAllUsers()` | - |

### Utility Hooks

| Hook | Purpose |
|------|---------|
| `useIsEnrolled(courseId, alias)` | Check if user is enrolled |
| `useCourseOnChainStatus(courseId)` | Get on-chain status with module count |
| `useStudentProgress(courseId, alias)` | Get student's progress in course |

### Route Integration 🚧

| Endpoint | Route | Status |
|----------|-------|--------|
| `GET /v2/courses` | `/course` | 🚧 Needs integration |
| `GET /v2/courses/{id}` | `/course/[coursenft]` | 🚧 Needs integration |
| `GET /v2/courses/{id}/students` | `/studio/course/[coursenft]/instructor` | 🚧 Needs integration |
| `GET /v2/user/global-state/{alias}` | `/dashboard` | 🚧 Needs integration |

---

## Environment Configuration

```bash
# .env.local
NEXT_PUBLIC_ANDAMIOSCAN_URL="https://preprod.andamioscan.andamio.space"
```

```typescript
// src/env.js - Add to schema
NEXT_PUBLIC_ANDAMIOSCAN_URL: z.string().url(),
```

---

## Related Documentation

- **Andamio DB API Endpoints**: `course-local-state.md` - Local database CRUD operations
- **Atlas Tx API**: [andamio-docs](https://docs.andamio.io) - Transaction building
- **@andamio/transactions**: Hash utilities (`computeSltHash`, `computeAssignmentInfoHash`)
