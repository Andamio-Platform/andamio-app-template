# Hook Rules

> **This is the authoritative reference for hook structure in the Andamio App.**

Every API hook MUST follow these rules precisely. No exceptions.

---

## The Golden Rule

**Types, transformers, and queries are colocated in the hook file.**

Components import from hooks. Hooks import from generated types. Never the reverse.

```
src/types/generated/    →    src/hooks/api/    →    src/components/
     (API types)              (App types)           (Consumption)
```

---

## File Structure Template

Every hook file follows this exact structure:

```typescript
// src/hooks/api/[domain]/use-[entity].ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
// Import ONLY the raw API types you need (internal use only)
import type { ApiResponseType } from "~/types/generated/gateway";

// =============================================================================
// App-Level Types (exported for components)
// =============================================================================

/**
 * Lifecycle status derived from API source field.
 * - "draft": DB only, not on-chain
 * - "active": On-chain + DB, fully operational
 * - "unregistered": On-chain but needs DB registration
 */
export type EntityStatus = "draft" | "active" | "unregistered";

/**
 * App-level Entity type with camelCase fields.
 * This is what components receive and render.
 */
export interface Entity {
  entityId: string;           // NOT entity_id
  title: string;              // Flattened from content.title
  description?: string;       // Optional fields use ?
  imageUrl?: string;          // NOT image_url
  status: EntityStatus;       // Semantic status, not raw "source"
  createdAt?: string;         // ISO date string
}

// =============================================================================
// Transform Functions
// =============================================================================

/**
 * Convert raw API source field to semantic status.
 */
function getStatusFromSource(source: string | undefined): EntityStatus {
  switch (source) {
    case "merged":
      return "active";
    case "chain_only":
      return "unregistered";
    case "db_only":
    default:
      return "draft";
  }
}

/**
 * Transform raw API response to app-level type.
 * Handles null/undefined safely with ?? defaults.
 */
export function transformEntity(raw: ApiResponseType): Entity {
  return {
    entityId: raw.entity_id ?? "",
    title: raw.content?.title ?? "",
    description: raw.content?.description,
    imageUrl: raw.content?.image_url,
    status: getStatusFromSource(raw.source),
    createdAt: raw.created_at,
  };
}

// =============================================================================
// Query Keys
// =============================================================================

/**
 * Query key factory for cache management.
 * Structure: [domain] → [operation] → [params]
 */
export const entityKeys = {
  all: ["entities"] as const,
  lists: () => [...entityKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    [...entityKeys.lists(), filters] as const,
  details: () => [...entityKeys.all, "detail"] as const,
  detail: (id: string) => [...entityKeys.details(), id] as const,
};

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Fetch a single entity by ID.
 * Returns null if not found (404), throws on other errors.
 */
export function useEntity(entityId: string | undefined) {
  return useQuery({
    queryKey: entityKeys.detail(entityId ?? ""),
    queryFn: async (): Promise<Entity | null> => {
      const response = await fetch(
        `/api/gateway/api/v2/entity/get/${entityId}`
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch entity: ${response.statusText}`);
      }

      const result = (await response.json()) as { data?: ApiResponseType };
      return result.data ? transformEntity(result.data) : null;
    },
    enabled: !!entityId,
  });
}

/**
 * Fetch list of entities (public, no auth required).
 */
export function useEntities() {
  return useQuery({
    queryKey: entityKeys.lists(),
    queryFn: async (): Promise<Entity[]> => {
      const response = await fetch("/api/gateway/api/v2/entity/list");

      if (!response.ok) {
        throw new Error(`Failed to fetch entities: ${response.statusText}`);
      }

      const result = (await response.json()) as { data?: ApiResponseType[] };
      return (result.data ?? []).map(transformEntity);
    },
  });
}

/**
 * Fetch owned entities (requires authentication).
 */
export function useOwnedEntities() {
  const { authenticatedFetch, isAuthenticated } = useAndamioAuth();

  return useQuery({
    queryKey: [...entityKeys.all, "owned"] as const,
    queryFn: async (): Promise<Entity[]> => {
      const response = await authenticatedFetch(
        "/api/gateway/api/v2/entity/owner/list",
        { method: "POST" }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch owned entities: ${response.statusText}`);
      }

      const result = (await response.json()) as { data?: ApiResponseType[] };
      return (result.data ?? []).map(transformEntity);
    },
    enabled: isAuthenticated,
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Update an entity. Invalidates relevant caches on success.
 */
export function useUpdateEntity() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async ({
      entityId,
      data
    }: {
      entityId: string;
      data: { title?: string; description?: string }
    }) => {
      const response = await authenticatedFetch(
        "/api/gateway/api/v2/entity/update",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entity_id: entityId,
            title: data.title,
            description: data.description,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update entity");
      }

      // Consume response but don't return typed data
      // Cache invalidation will trigger refetch with fresh data
      await response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific entity and all lists
      void queryClient.invalidateQueries({
        queryKey: entityKeys.detail(variables.entityId),
      });
      void queryClient.invalidateQueries({
        queryKey: entityKeys.lists(),
      });
    },
  });
}

/**
 * Delete an entity. Invalidates all entity queries on success.
 */
export function useDeleteEntity() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async ({ entityId }: { entityId: string }) => {
      const response = await authenticatedFetch(
        "/api/gateway/api/v2/entity/delete",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entity_id: entityId }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete entity");
      }
    },
    onSuccess: () => {
      // Invalidate all entity queries
      void queryClient.invalidateQueries({
        queryKey: entityKeys.all,
      });
    },
  });
}

// =============================================================================
// Utility Hooks
// =============================================================================

/**
 * Invalidation helper for use after blockchain transactions.
 */
export function useInvalidateEntities() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () =>
      queryClient.invalidateQueries({ queryKey: entityKeys.all }),
    invalidateDetail: (entityId: string) =>
      queryClient.invalidateQueries({ queryKey: entityKeys.detail(entityId) }),
  };
}
```

---

## Naming Conventions

### Files

| Pattern | Example |
|---------|---------|
| Core entity | `use-course.ts`, `use-project.ts` |
| Role-specific | `use-course-owner.ts`, `use-project-manager.ts` |
| Sub-entity | `use-course-module.ts`, `use-slt.ts` |

### Types

| Pattern | Example |
|---------|---------|
| Entity | `Course`, `Project`, `Task` |
| Detail variant | `CourseDetail`, `ProjectDetail` |
| Status enum | `CourseStatus`, `TaskStatus` |
| List item (if different) | Avoid - use same type for list and detail |

**Never use prefixes like:**
- ~~`MergedCourse`~~ → use `Course` with `status: "active"`
- ~~`FlattenedTask`~~ → use `Task` (always flattened)
- ~~`ApiCourse`~~ → internal only, never export

### Transform Functions

| Pattern | Example |
|---------|---------|
| Single entity | `transformCourse()`, `transformTask()` |
| Status helper | `getStatusFromSource()` (internal) |

### Query Keys

| Pattern | Example |
|---------|---------|
| Factory name | `courseKeys`, `taskKeys` |
| All | `courseKeys.all` → `["courses"]` |
| Lists | `courseKeys.lists()` → `["courses", "list"]` |
| Detail | `courseKeys.detail(id)` → `["courses", "detail", id]` |

### Hooks

| Pattern | Example |
|---------|---------|
| Single query | `useCourse(id)`, `useTask(id)` |
| List query | `useCourses()`, `useTasks()` |
| Authenticated list | `useOwnedCourses()`, `useManagerTasks()` |
| Create mutation | `useCreateCourse()`, `useCreateTask()` |
| Update mutation | `useUpdateCourse()`, `useUpdateTask()` |
| Delete mutation | `useDeleteCourse()`, `useDeleteTask()` |
| Invalidation | `useInvalidateCourses()` |

---

## Type Ownership

Types flow UP the hierarchy. Each hook owns its primary types.

### Ownership Map

| Owner Hook | Types Owned |
|------------|-------------|
| `use-course.ts` | `Course`, `CourseDetail`, `CourseStatus` |
| `use-course-module.ts` | `CourseModule`, `CourseModuleStatus`, `SLT`, `Lesson`, `Assignment`, `Introduction` |
| `use-course-teacher.ts` | `TeacherCourse`, `TeacherCourseStatus`, `TeacherAssignmentCommitment` |
| `use-course-student.ts` | `StudentCourse` |
| `use-project.ts` | `Project`, `ProjectDetail`, `Task`, `TaskCommitment` |
| `use-project-manager.ts` | `ManagerProject`, `ManagerCommitment` |
| `use-project-contributor.ts` | `ContributorProject` |

### Import Rules

```typescript
// ✅ CORRECT - use-slt.ts imports from the owner
import { type SLT, transformSLT, sltKeys } from "./use-course-module";

// ✅ CORRECT - use-course.ts imports from child hook
import { type CourseModule } from "./use-course-module";

// ❌ WRONG - Circular import (child imports from parent)
// use-course-module.ts
import { type Course } from "./use-course"; // NO!

// ❌ WRONG - Duplicating types
export interface SLT { ... } // Already defined in use-course-module!
```

---

## Anti-Patterns

### 1. Types in Separate Files

```typescript
// ❌ WRONG - Types in separate file
// src/types/course.ts
export interface Course { ... }

// src/hooks/api/course/use-course.ts
import { type Course } from "~/types/course";

// ✅ CORRECT - Types colocated in hook
// src/hooks/api/course/use-course.ts
export interface Course { ... }
```

### 2. snake_case in App Types

```typescript
// ❌ WRONG
export interface Course {
  course_id: string;
  course_nft_policy_id: string;
}

// ✅ CORRECT
export interface Course {
  courseId: string;
  courseNftPolicyId: string;
}
```

### 3. Returning Raw API Types

```typescript
// ❌ WRONG - Returns raw API type
queryFn: async () => {
  const response = await fetch(...);
  return response.json() as ApiCourseResponse;
}

// ✅ CORRECT - Returns transformed app type
queryFn: async (): Promise<Course> => {
  const response = await fetch(...);
  const data = await response.json();
  return transformCourse(data);
}
```

### 4. Components Importing Generated Types

```typescript
// ❌ WRONG - Component imports generated types
import type { OrchestrationMergedCourseDetail } from "~/types/generated";

// ✅ CORRECT - Component imports from hook
import { type CourseDetail } from "~/hooks/api";
```

### 5. Direct API Calls in Components

```typescript
// ❌ WRONG - Direct fetch in component
function CourseCard({ id }) {
  const [course, setCourse] = useState(null);
  useEffect(() => {
    fetch(`/api/gateway/api/v2/course/get/${id}`)
      .then(r => r.json())
      .then(setCourse);
  }, [id]);
}

// ✅ CORRECT - Use hook
function CourseCard({ id }) {
  const { data: course } = useCourse(id);
}
```

### 6. Returning Typed Data from Mutations

```typescript
// ❌ WRONG - Returns typed data from mutation
mutationFn: async () => {
  const response = await fetch(...);
  return response.json() as Course; // Risky!
}

// ✅ CORRECT - Cache invalidation triggers refetch
mutationFn: async () => {
  const response = await fetch(...);
  await response.json(); // Consume but don't return
},
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: courseKeys.all });
}
```

---

## Checklist

Use this checklist when creating or reviewing hooks:

### Types
- [ ] App types use camelCase field names
- [ ] Types are colocated in the hook file
- [ ] Content fields are flattened (`title`, not `content.title`)
- [ ] Source field is converted to semantic status
- [ ] Optional fields use `?` modifier

### Transformers
- [ ] Transform function is exported
- [ ] Handles null/undefined with `??` defaults
- [ ] Return type matches app type exactly

### Query Keys
- [ ] Keys factory is exported
- [ ] Uses `as const` for type inference
- [ ] Follows hierarchy: all → lists → detail

### Query Hooks
- [ ] Returns transformed app types
- [ ] Has proper `enabled` condition
- [ ] 404 returns null/[], doesn't throw
- [ ] Auth hooks use `authenticatedFetch`

### Mutation Hooks
- [ ] Invalidates affected query keys on success
- [ ] Doesn't return typed data (uses cache invalidation)
- [ ] Uses `authenticatedFetch` for auth

### Exports
- [ ] All types exported
- [ ] All hooks exported
- [ ] Query keys exported
- [ ] Transform functions exported
- [ ] Added to `src/hooks/api/index.ts`

---

**Last Updated**: January 28, 2026
