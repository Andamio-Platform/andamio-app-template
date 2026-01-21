# Andamioscan API Endpoints

This document maps all Andamioscan API endpoints used by the Andamio T3 App Template.

**Base URL**: `https://preprod.andamioscan.io/api` (preprod)

**Purpose**: Andamioscan provides **read-only on-chain data** about courses, students, and users. It indexes blockchain state and provides a queryable API. This is distinct from:
- **Andamio DB API** - Internal database for local state (drafts, metadata, CRUD operations)
- **Atlas Tx API** - Transaction building (documented in andamio-docs)

## Summary

| # | Endpoint | Method | Purpose | Used In |
|---|----------|--------|---------|---------|
| 1 | `/v2/courses` | GET | List all courses on-chain (basic info) | Course catalog |
| 2 | `/v2/courses/{course_id}/details` | GET | Get course with modules & students | Course detail pages |
| 3 | `/v2/courses/{course_id}/students/{alias}/status` | GET | Get student progress in course | Student progress view |
| 4 | `/v2/users/{alias}/state` | GET | Get user's enrollments & credentials | User profile, dashboard |
| 5 | `/v2/users/{alias}/courses/teaching` | GET | Get courses user teaches | My courses page |

**Total: 5 Endpoints (3 Course + 2 User)**

---

## Course Endpoints

### 1. `GET /v2/courses`

**Purpose**: Get all courses indexed on-chain (basic info only).

**Authentication**: None (public)

**Response**: Array of course list items

```typescript
type CourseListItem = {
  tx_hash: string;            // Transaction that created the course
  slot: number;               // Slot number
  course_id: string;          // Course identifier (policy ID)
  admin: string;              // Course admin alias
  teachers: string[];         // Array of teacher aliases
  course_address: string;     // Course script address
  course_state_policy_id: string;
};
```

**Used In**:
| Route | Component | Purpose |
|-------|-----------|---------|
| `/course` | `PublishedCoursesList` | Display course catalog from on-chain data |

**Notes**:
- Returns basic course info **without modules**
- To get module data, use the `/details` endpoint
- Combine with DB API `/course/published` to get full metadata

---

### 2. `GET /v2/courses/{course_id}/details`

**Purpose**: Get full details for a specific course including modules and students.

**Authentication**: None (public)

**Parameters**:
| Name | Type | Location | Description |
|------|------|----------|-------------|
| `course_id` | string | path | Course NFT Policy ID |

**Response**: Full course details

```typescript
type CourseDetails = {
  course_id: string;
  course_address: string;
  course_state_policy_id: string;
  teachers: string[];
  modules: Module[];          // Full module data with SLTs
  students: string[];         // Currently enrolled student aliases
  past_students: string[];    // Previously enrolled students
};

type Module = {
  assignment_id: string;      // Module hash (Blake2b-256 of SLTs)
  module: {
    slts: string[];           // On-chain SLT content
    prerequisites: string[];  // Prerequisite content (not hashes)
  };
  created_by: string;         // Creator alias
};
```

**Used In**:
| Route | Component | Purpose |
|-------|-----------|---------|
| `/course/[coursenft]` | `CourseDetailPage` | Verify course exists on-chain |
| `/studio/course/[coursenft]` | `OnChainModulesSection` | Show on-chain modules |
| Various | `OnChainSltsViewer` | Display verified SLTs |

**Notes**:
- This is the main endpoint for course data
- `students` array is included - no separate students list endpoint
- Module `assignment_id` is the SLT hash - matches `computeSltHash(slts)`

---

### 3. `GET /v2/courses/{course_id}/students/{alias}/status`

**Purpose**: Get a specific student's progress in a course.

**Authentication**: None (public)

**Parameters**:
| Name | Type | Location | Description |
|------|------|----------|-------------|
| `course_id` | string | path | Course NFT Policy ID |
| `alias` | string | path | Student's access token alias |

**Response**: Student progress

```typescript
type StudentStatus = {
  alias: string;
  course_id: string;
  completed_assignments: Array<{
    assignment_id: string;    // Module hash
    content: string;          // Hex-encoded completion info
  }>;
  current_assignment: string | null;  // Current module hash or null
};
```

**Used In**:
| Route | Component | Purpose |
|-------|-----------|---------|
| `/studio/course/[coursenft]/instructor` | `StudentDetailView` | View individual student progress |
| `/course/[coursenft]/my-progress` | `StudentProgress` | Show learner their own progress |

**Notes**:
- Use to check if a specific user is enrolled and their progress
- `completed_assignments` includes the content hash submitted
- Cross-reference with DB API for full evidence details

---

## User Endpoints

### 4. `GET /v2/users/{alias}/state`

**Purpose**: Get a user's global state including all enrollments and credentials.

**Authentication**: None (public)

**Parameters**:
| Name | Type | Location | Description |
|------|------|----------|-------------|
| `alias` | string | path | User's access token alias |

**Response**: Raw API response (normalized by client)

```typescript
// Raw API Response
type RawUserState = {
  alias: string;
  enrolled_courses: string[];           // Array of course IDs
  completed_courses: Array<{
    course_id: string;
    claimed_credentials: string[];
  }>;
  joined_projects: string[];
  completed_projects: Array<{
    project_id: string;
    credentials: Array<{ policy_id: string; name: string; amount: string }>;
  }>;
};

// Normalized (by andamioscan.ts)
type UserGlobalState = {
  alias: string;
  courses: Array<{
    course_id: string;
    is_enrolled: boolean;
    credential_id: string | null;
    credentials: string[];
  }>;
};
```

**Used In**:
| Route | Component | Purpose |
|-------|-----------|---------|
| `/dashboard` | `OnChainStatus` | Show user's enrollments and credentials |
| `/course/[coursenft]` | `EnrollmentStatus` | Check if user is enrolled |

**Notes**:
- Single endpoint to get all of a user's on-chain activity
- Response is normalized by `andamioscan.ts` to a simpler format
- Includes both course and project data

---

### 5. `GET /v2/users/{alias}/courses/teaching`

**Purpose**: Get all courses where user is a teacher.

**Authentication**: None (public)

**Parameters**:
| Name | Type | Location | Description |
|------|------|----------|-------------|
| `alias` | string | path | User's access token alias |

**Response**: Array of course list items (same as `/v2/courses`)

**Used In**:
| Route | Component | Purpose |
|-------|-----------|---------|
| `/studio` | `OnChainCoursesSection` | Show teacher's courses |

**Notes**:
- More efficient than filtering all courses
- Returns basic info only - use `/details` endpoint for modules
- `getCoursesOwnedByAliasWithDetails()` fetches details for each course

---

## Integration Patterns

### Combining Andamioscan + DB API Data

Most views require combining on-chain data (Andamioscan) with local metadata (DB API):

```typescript
// Example: Course detail page
async function getCourseWithMetadata(courseId: string) {
  // On-chain data: teachers, modules, students
  const onChain = await fetch(`${ANDAMIOSCAN_URL}/v2/courses/${courseId}/details`);

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
const userState = await fetch(`${ANDAMIOSCAN_URL}/v2/users/${alias}/state`);
const { enrolled_courses } = await userState.json();
const isEnrolled = enrolled_courses.includes(courseId);

if (!isEnrolled) {
  return <EnrollButton />;
}
```

### Module Hash Cross-Reference

Module `assignment_id` in Andamioscan = module token name = `computeSltHashDefinite(slts)`:

```typescript
import { computeSltHashDefinite } from "~/lib/utils/slt-hash";

// Verify local module matches on-chain
const localModule = await getModuleFromDB(courseId, moduleCode);
const expectedHash = computeSltHashDefinite(localModule.slts.map(s => s.text));

const course = await fetch(`${ANDAMIOSCAN_URL}/v2/courses/${courseId}/details`);
const { modules } = await course.json();
const onChainModule = modules.find(m => m.assignment_id === expectedHash);

if (onChainModule) {
  console.log("Module is published on-chain");
}
```

---

## Coverage Checklist

### API Client

All endpoints have typed client functions in `src/lib/andamioscan.ts`:

| Endpoint | Function | Hook |
|----------|----------|------|
| `GET /v2/courses` | `getAllCourses()` | `useAllCourses()` |
| `GET /v2/courses/{id}/details` | `getCourse(id)` | `useCourse(id)` |
| `GET /v2/courses/{id}/students/{alias}/status` | `getCourseStudent(id, alias)` | `useCourseStudent(id, alias)` |
| `GET /v2/users/{alias}/state` | `getUserGlobalState(alias)` | `useUserGlobalState(alias)` |
| `GET /v2/users/{alias}/courses/teaching` | `getCoursesOwnedByAlias(alias)` | `useCoursesOwnedByAlias(alias)` |

### Additional Functions

| Function | Purpose |
|----------|---------|
| `getCourseStudents(id)` | Get student aliases from course details |
| `getCoursesOwnedByAliasWithDetails(alias)` | Get teaching courses with full module data |
| `isUserEnrolled(alias, courseId)` | Check enrollment status |
| `getUserCredentials(alias)` | Get all earned credentials |
| `isModuleOnChain(courseId, hash)` | Check if module is published |

---

## Environment Configuration

```bash
# .env.local
NEXT_PUBLIC_ANDAMIO_GATEWAY_URL="https://andamio-api-gateway-666713068234.us-central1.run.app"
ANDAMIO_API_KEY="your-api-key-here"
```

The Andamioscan API is now accessed via the unified V2 Gateway at `/api/gateway/v2/*` endpoints. On-chain data passthrough routes use `/v2/courses/*`, `/v2/projects/*`, etc.

---

## Related Documentation

- **V2 Gateway API**: `.claude/skills/audit-api-coverage/unified-api-endpoints.md` - Full endpoint reference
- **Hash Utilities**: `~/lib/utils/` - `slt-hash.ts`, `assignment-info-hash.ts`, `task-hash.ts`
- **API Docs**: https://andamio-api-gateway-666713068234.us-central1.run.app/api/v1/docs/doc.json
