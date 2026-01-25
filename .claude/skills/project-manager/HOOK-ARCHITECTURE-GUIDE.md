# Hook Architecture Guide

> **Last Updated**: January 24, 2026
> **Status**: Pattern established and validated on Course side. Ready for Project side migration.

---

## 🎯 TOP PRIORITY: Apply This Pattern to ALL Hooks

The **Colocated Types Pattern** is now the standard for this codebase. All hooks MUST follow this pattern.

---

## The Pattern: Colocated Types

### Core Principle

**App-level types and transform functions live IN the hook file.**

```
Gateway API (snake_case) → Hook (transform) → Component (camelCase)
```

### Key Rules

1. **App-level types use camelCase** and are defined IN hook files
2. **Transform functions** convert snake_case API responses to camelCase app types
3. **Components import from hooks**, NEVER from `~/types/generated`
4. **Clean domain names**: `Course`, `CourseModule`, `Task` - never "Merged" or "Flattened" prefixes
5. **The `source` field** indicates data origin (`"merged"`, `"chain_only"`, `"db_only"`), not the type name

### File Structure

```
src/hooks/api/
├── index.ts                    # Central exports
├── course/
│   ├── use-course.ts           # Course, CourseDetail types + hooks
│   ├── use-course-module.ts    # CourseModule, SLT, Lesson types + hooks
│   ├── use-teacher-courses.ts  # TeacherCourse, TeacherAssignmentCommitment + hooks
│   ├── use-student-courses.ts  # StudentCourse type + hooks (needs migration)
│   ├── use-slt.ts              # SLT mutations (uses SLT from use-course-module)
│   └── use-lesson.ts           # Lesson mutations (uses Lesson from use-course-module)
└── project/
    ├── use-project.ts          # Project, Task types + hooks (needs migration)
    ├── use-contributor-projects.ts
    └── use-manager-projects.ts
```

### Hook File Template

```typescript
// src/hooks/api/[domain]/use-[entity].ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
// Import raw API types from generated (internal use only)
import type { SomeApiResponseType } from "~/types/generated/gateway";

// =============================================================================
// App-Level Types (exported for components)
// =============================================================================

/**
 * Data source indicator
 */
export type EntitySource = "merged" | "chain_only" | "db_only";

/**
 * App-level Entity type with camelCase fields
 */
export interface Entity {
  entityId: string;           // NOT entity_id
  title: string;              // Flattened from content.title
  description?: string;       // Flattened from content.description
  imageUrl?: string;          // NOT image_url
  source: EntitySource;
}

// =============================================================================
// Transform Functions
// =============================================================================

/**
 * Transform raw API response to app-level type
 */
export function transformEntity(raw: SomeApiResponseType): Entity {
  return {
    entityId: raw.entity_id ?? "",
    title: raw.content?.title ?? "",
    description: raw.content?.description,
    imageUrl: raw.content?.image_url,
    source: (raw.source as EntitySource) ?? "db_only",
  };
}

// =============================================================================
// Query Keys
// =============================================================================

export const entityKeys = {
  all: ["entities"] as const,
  lists: () => [...entityKeys.all, "list"] as const,
  list: (filters?: string) => [...entityKeys.lists(), filters] as const,
  details: () => [...entityKeys.all, "detail"] as const,
  detail: (id: string) => [...entityKeys.details(), id] as const,
};

// =============================================================================
// Query Hooks
// =============================================================================

export function useEntity(entityId: string | undefined) {
  return useQuery({
    queryKey: entityKeys.detail(entityId ?? ""),
    queryFn: async (): Promise<Entity | null> => {
      const response = await fetch(`/api/gateway/api/v2/.../get/${entityId}`);
      if (!response.ok) return null;
      const result = await response.json() as { data?: SomeApiResponseType };
      return result.data ? transformEntity(result.data) : null;
    },
    enabled: !!entityId,
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

export function useUpdateEntity() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async ({ entityId, data }: { entityId: string; data: Partial<Entity> }) => {
      const response = await authenticatedFetch(`/api/gateway/api/v2/.../update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity_id: entityId, ...data }),
      });
      if (!response.ok) throw new Error("Failed to update");
      await response.json(); // Consume response, don't return typed data
    },
    onSuccess: (_, variables) => {
      // Cache invalidation triggers refetch with fresh data
      void queryClient.invalidateQueries({ queryKey: entityKeys.detail(variables.entityId) });
      void queryClient.invalidateQueries({ queryKey: entityKeys.lists() });
    },
  });
}
```

### Import Pattern

```typescript
// ✅ CORRECT - Components import from hooks
import { useEntity, type Entity, type EntitySource } from "~/hooks/api";

function MyComponent() {
  const { data: entity } = useEntity(id);
  return <div>{entity?.title}</div>;  // camelCase field access
}

// ❌ WRONG - Never import generated types in components
import type { SomeApiResponseType } from "~/types/generated"; // NO!
```

---

## Migration Status

### ✅ Course Side (Complete)

| Hook | Types Exported | Transform Functions | Status |
|------|---------------|-------------------|--------|
| `use-course.ts` | `Course`, `CourseDetail`, `CourseSource` | `transformCourse()`, `transformCourseDetail()` | ✅ Complete |
| `use-course-module.ts` | `CourseModule`, `SLT`, `Lesson`, `ModuleSource` | `transformCourseModule()`, `transformSLT()`, `transformLesson()` | ✅ Complete |
| `use-teacher-courses.ts` | `TeacherCourse`, `TeacherAssignmentCommitment`, `TeacherCourseWithModules`, `TeacherCourseSource` | `transformTeacherCourse()`, `transformTeacherCommitment()` | ✅ Complete |
| `use-owned-courses.ts` | Uses `Course` from use-course | Uses `transformCourse()` | ✅ Complete |

**Backward Compatibility Aliases** (deprecated, will be removed):
- `FlattenedCourseListItem` → `Course`
- `FlattenedCourseDetail` → `CourseDetail`
- `MergedCourseModule` → `CourseModule`

### ⬜ Project Side (Needs Migration)

| Hook | Current State | Action Needed |
|------|---------------|---------------|
| `use-project.ts` | Types in separate `types/project.ts` | Move types INTO hook, delete `types/project.ts` |
| `use-contributor-projects.ts` | Returns raw API types | Add `ContributorProject` type + transform |
| `use-manager-projects.ts` | Returns raw API types | Add `ManagerProject` type + transform |

### ⬜ Other Hooks (Needs Migration)

| Hook | Current State | Action Needed |
|------|---------------|---------------|
| `use-slt.ts` | Returns raw API types | Uses `SLT` from use-course-module (OK for queries) |
| `use-lesson.ts` | Returns raw API types | Uses `Lesson` from use-course-module (OK for queries) |
| `use-student-courses.ts` | Returns raw API types | Add `StudentCourse` type + transform |

---

## Anti-Patterns to Avoid

### 1. Types in separate files

```typescript
// ❌ BAD - Types in separate file
// src/types/course.ts
export interface Course { ... }

// src/hooks/api/course/use-course.ts
import { type Course } from "~/types/course";

// ✅ GOOD - Types colocated in hook
// src/hooks/api/course/use-course.ts
export interface Course { ... }
```

### 2. "Merged" or "Flattened" prefixes

```typescript
// ❌ BAD - Confusing prefixes
export interface MergedCourseModule { ... }
export interface FlattenedCourseDetail { ... }

// ✅ GOOD - Clean domain names
export interface CourseModule { ... }
export interface CourseDetail { ... }
// The `source` field tells you if it's merged/chain-only/db-only
```

### 3. snake_case in app types

```typescript
// ❌ BAD - snake_case field names
export interface Course {
  course_id: string;
  image_url?: string;
}

// ✅ GOOD - camelCase field names
export interface Course {
  courseId: string;
  imageUrl?: string;
}
```

### 4. Returning typed data from mutations

```typescript
// ❌ BAD - Returning typed response from mutation
mutationFn: async () => {
  const response = await fetch(...);
  return response.json() as Promise<Entity>; // Risky - API shape may change
}

// ✅ GOOD - Cache invalidation triggers refetch
mutationFn: async () => {
  const response = await fetch(...);
  await response.json(); // Consume response but don't return
},
onSuccess: () => {
  void queryClient.invalidateQueries({ queryKey: entityKeys.all });
}
```

### 5. Importing generated types in components

```typescript
// ❌ BAD - Components use generated types
import type { OrchestrationMergedCourseDetail } from "~/types/generated";

// ✅ GOOD - Components use hook-exported types
import { type CourseDetail } from "~/hooks/api";
```

---

## Testing Checklist

After migrating each hook:

1. `npm run typecheck` - No TypeScript errors
2. `npm run build` - Build passes
3. Test affected routes manually
4. Verify data displays correctly with camelCase access

---

## Related Documentation

- `STATUS.md` - Current project status
- `.claude/dev-notes/TYPE-TRANSFORMATION.md` - Detailed transformation patterns
- `.claude/skills/typescript-types-expert/` - Types expert skill for complex cases
- `.claude/skills/react-query-auditor/` - React Query patterns audit
