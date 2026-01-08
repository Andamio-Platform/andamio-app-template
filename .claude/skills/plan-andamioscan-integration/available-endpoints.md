# Available Andamioscan V2 Endpoints

Base URL: `https://preprod.andamioscan.io/api`

Swagger UI: https://preprod.andamioscan.io/api

---

## Course Endpoints

### Data Queries

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v2/courses` | GET | List all courses on-chain (basic info, no modules) |
| `/v2/courses/{course_id}/details` | GET | Get full course details with modules and students |
| `/v2/courses/{course_id}/students/{student_alias}/status` | GET | Get specific student's progress in a course |
| `/v2/courses/teachers/{alias}/assessments/pending` | GET | Get assignments pending teacher review |

### Parameters

**Course Details**
- `course_id`: Course NFT Policy ID (56 hex chars)

**Student Status**
- `course_id`: Course NFT Policy ID
- `student_alias`: Student's access token alias

**Pending Assessments**
- `alias`: Teacher's access token alias

---

## User Endpoints

### Data Queries

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v2/users/{alias}/state` | GET | Get user's global state (enrollments, credentials) |
| `/v2/users/{alias}/courses/enrolled` | GET | Get courses user is enrolled in |
| `/v2/users/{alias}/courses/completed` | GET | Get courses user has completed |
| `/v2/users/{alias}/courses/teaching` | GET | Get courses where user is a teacher |
| `/v2/users/{alias}/courses/owned` | GET | Get courses where user is admin/owner |

### Parameters

- `alias`: User's access token alias

---

## Project Endpoints

### Data Queries

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v2/projects` | GET | List all projects on-chain |
| `/v2/projects/{project_id}/details` | GET | Get full project details |
| `/v2/projects/{project_id}/contributors/{contributor_alias}/status` | GET | Get contributor's status in project |
| `/v2/projects/managers/{alias}/assessments/pending` | GET | Get tasks pending manager review |

### User Project Queries

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v2/users/{alias}/projects/contributing` | GET | Projects user is contributing to |
| `/v2/users/{alias}/projects/managing` | GET | Projects user is managing |
| `/v2/users/{alias}/projects/owned` | GET | Projects user owns |
| `/v2/users/{alias}/projects/completed` | GET | Projects user has completed |

### Parameters

**Project Details**
- `project_id`: Project NFT Policy ID

**Contributor Status**
- `project_id`: Project NFT Policy ID
- `contributor_alias`: Contributor's access token alias

---

## Event Endpoints

These endpoints are for querying transaction events by tx_hash. Useful for confirming on-chain actions.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v2/events/access-tokens/mint/{tx_hash}` | GET | Access token mint event |
| `/v2/events/courses/create/{tx_hash}` | GET | Course creation event |
| `/v2/events/enrollments/enroll/{tx_hash}` | GET | Course enrollment event |
| `/v2/events/modules/manage/{tx_hash}` | GET | Module management event |
| `/v2/events/assignments/submit/{tx_hash}` | GET | Assignment submission event |
| `/v2/events/assessments/assess/{tx_hash}` | GET | Assessment event |
| `/v2/events/credential-claims/claim/{tx_hash}` | GET | Credential claim event |
| `/v2/events/teachers/update/{tx_hash}` | GET | Teacher update event |
| `/v2/events/projects/create/{tx_hash}` | GET | Project creation event |
| `/v2/events/projects/join/{tx_hash}` | GET | Project join event |
| `/v2/events/tasks/manage/{tx_hash}` | GET | Task management event |
| `/v2/events/tasks/submit/{tx_hash}` | GET | Task submission event |
| `/v2/events/tasks/assess/{tx_hash}` | GET | Task assessment event |
| `/v2/events/credential-claims/project/{tx_hash}` | GET | Project credential claim |
| `/v2/events/treasury/fund/{tx_hash}` | GET | Treasury funding event |

### Parameters

- `tx_hash`: Transaction hash (64 hex chars)

---

## Other Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v2/transactions` | GET | Query transactions (params unknown) |

---

## Response Patterns

### Course List Item
```typescript
{
  tx_hash: string;
  slot: number;
  course_id: string;
  admin: string;
  teachers: string[];
  course_address: string;
  course_state_policy_id: string;
}
```

### Course Details
```typescript
{
  course_id: string;
  course_address: string;
  course_state_policy_id: string;
  teachers: string[];
  modules: Array<{
    assignment_id: string;
    module: { slts: string[]; prerequisites: string[] };
    created_by: string;
  }>;
  students: string[];
  past_students: string[];
}
```

### Student Status
```typescript
{
  alias: string;
  course_id: string;
  completed_assignments: Array<{
    assignment_id: string;
    content: string;
  }>;
  current_assignment: string | null;
}
```

### User State
```typescript
{
  alias: string;
  enrolled_courses: string[];
  completed_courses: Array<{
    course_id: string;
    claimed_credentials: string[];
  }>;
  joined_projects: string[];
  completed_projects: Array<{
    project_id: string;
    credentials: Array<{ policy_id: string; name: string; amount: string }>;
  }>;
}
```

---

## Notes

- All endpoints are public (no authentication required)
- Data is read-only (indexed from blockchain)
- For transaction building, use Atlas TX API instead
- Course/Project IDs are NFT Policy IDs (56 hex characters)
- Aliases are user's access token names
