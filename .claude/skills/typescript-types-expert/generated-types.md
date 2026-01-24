# Generated Types

Working with API types generated from the Andamio Gateway OpenAPI specification.

## Type Generation Workflow

### Regenerating Types

When the API changes, regenerate types:

```bash
npm run generate:types
```

This command:
1. Fetches OpenAPI spec from `https://dev.api.andamio.io/api/v1/docs/openapi.json`
2. Runs openapi-typescript to generate `src/types/generated/gateway.ts`
3. Types are ready for use via `~/types/generated`

### When to Regenerate

- After API version updates
- When endpoints return unexpected shapes
- After running `/transaction-auditor` skill
- Before starting work on new API features

## The Processing Layer

Raw generated types (gateway.ts) are processed through index.ts:

### Type Aliases

Provide clean names for verbose generated types:

```typescript
// In index.ts - clean alias
export type { OrchestrationMergedCourseDetail as CourseResponse } from "./gateway";

// Usage - clean import
import { type CourseResponse } from "~/types/generated";
```

### Extended Types

Add missing fields or combine types:

```typescript
// In index.ts - extended type
export interface CourseModuleResponse extends OrchestrationModuleContent {
  /** SLT hash from the merged module item */
  slt_hash?: string;
}
```

### Backward Compatibility

Maintain aliases for refactored types:

```typescript
// Legacy alias for code that used old names
export type CourseResponse = OrchestrationMergedCourseDetail;
```

## The NullableString Problem

### What Happens

The API spec defines `NullableString` for fields that can be `string` or `null`. The type generator outputs this as `object` type.

```typescript
// In gateway.ts (generated)
export interface OrchestrationCourseContent {
  title?: object;  // Should be string | null
  description?: object;
}
```

### Why It Happens

The OpenAPI spec uses a schema pattern that the generator doesn't handle correctly:

```yaml
NullableString:
  oneOf:
    - type: string
    - type: "null"
```

### The Solution

Use type helper functions from `~/lib/type-helpers`:

```typescript
import { getString, getOptionalString } from "~/lib/type-helpers";

// getString - returns string or empty string
const title = getString(course.title);  // string

// getOptionalString - returns string or undefined
const description = getOptionalString(course.description);  // string | undefined
```

### Common NullableString Fields

These fields typically need helper functions:

| Entity | Fields |
|--------|--------|
| Course | `title`, `description`, `category` |
| Module | `title`, `description` |
| SLT | `slt_text` |
| Lesson | `title`, `content` |
| Project | `title`, `description`, `project_info` |
| Task | `title`, `description`, `task_content` |
| Assignment | `assignment_info`, `evidence_hash` |

### Type Helper Implementation

```typescript
// src/lib/type-helpers.ts

export function getString(value: string | object | undefined | null): string {
  if (typeof value === "string") return value;
  return "";
}

export function getOptionalString(value: string | object | undefined | null): string | undefined {
  if (typeof value === "string") return value;
  return undefined;
}
```

## Request Types

Request types (for POST bodies) are often not in the OpenAPI spec. These are manually maintained in index.ts:

```typescript
// Manually defined request type
export interface CreateCourseRequest {
  course_id: string;
  title: string;
  description?: string;
  category?: string;
}
```

### Keeping Request Types Current

When API request shapes change:
1. Check the API docs for new field requirements
2. Update the request type in index.ts
3. Update corresponding Zod schema if exists
4. Run `npm run typecheck`

## Type Import Patterns

### Correct Import Pattern

```typescript
// Always import from ~/types/generated (the index.ts barrel)
import {
  type CourseResponse,
  type ProjectV2Output,
  type SLTResponse,
} from "~/types/generated";
```

### What NOT to Do

```typescript
// ❌ Never import from gateway.ts directly
import { OrchestrationMergedCourseDetail } from "~/types/generated/gateway";

// ❌ Never define API types inline
interface Course {
  id: string;
  title: string;
}
```

## Adding New Types

### For API Responses

1. Check if type exists in gateway.ts
2. If yes, add clean alias in index.ts:

```typescript
export type { GatewayTypeName as CleanName } from "./gateway";
```

3. If type needs extension:

```typescript
import type { GatewayTypeName } from "./gateway";

export interface ExtendedType extends GatewayTypeName {
  additionalField: string;
}
```

### For Request Types

1. Check API docs for exact field requirements
2. Define in index.ts with `Request` suffix:

```typescript
export interface CreateModuleRequest {
  course_id: string;
  module_code: string;
  title: string;
}
```

3. Consider adding Zod schema for validation

## Common Type Patterns

### List vs Single Response

```typescript
// Single item
type CourseResponse = { ... }

// List wrapper (often has metadata)
type CourseListResponse = {
  courses: CourseResponse[];
  total?: number;
}
```

### Merged Types (V2 API)

The V2 API merges on-chain and off-chain data:

```typescript
// Merged type combines DB + blockchain data
type CourseDetailResponse = OrchestrationMergedCourseDetail;
// Contains: course content + on-chain state + owner info
```

### Nested Content Types

```typescript
// Module contains nested SLTs, assignment, introduction
interface ModuleContent {
  slts?: SLTContent[];
  assignment?: AssignmentContent;
  introduction?: IntroductionContent;
}
```

## Debugging Type Issues

### Type Mismatch Errors

```typescript
// Error: Type 'object' is not assignable to type 'string'
```

Solution: Use `getString()` or `getOptionalString()`

### Missing Fields

```typescript
// Error: Property 'newField' does not exist
```

Solution: Regenerate types with `npm run generate:types`

### Optional vs Required

Generated types make all fields optional. If you need required fields:

```typescript
// Make specific fields required
type StrictCourse = Required<Pick<CourseResponse, 'id' | 'title'>> & CourseResponse;
```
