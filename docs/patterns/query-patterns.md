# Andamio Template Query Patterns

## Current:

Here is an example from `src/app/(app)/studio/course/[coursenft]/[modulecode]/[moduleindex]/page.tsx`

```typescript
  useEffect(() => {
    const fetchLesson = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/lessons/${courseNftPolicyId}/${moduleCode}/${moduleIndex}`
        );

        if (response.ok) {
          const data = (await response.json()) as LessonOutput;
          setLesson(data);
          setLessonExists(true);
          setTitle(data.title ?? "");
          setDescription(data.description ?? "");
          setImageUrl(data.imageUrl ?? "");
          setVideoUrl(data.videoUrl ?? "");
          setLive(data.live ?? false);
        } else if (response.status === 404) {
          // Lesson doesn't exist yet - that's OK, we'll create it
          setLessonExists(false);
        } else {
          throw new Error(`Failed to fetch lesson: ${response.statusText}`);
        }
      } catch (err) {
        console.error("Error fetching lesson:", err);
        setError(err instanceof Error ? err.message : "Failed to load lesson");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchLesson();
  }, [courseNftPolicyId, moduleCode, moduleIndex]);
```

Or for the list of published courses in `src/app/(app)/course/page.tsx`

```typescript
  useEffect(() => {
    const fetchPublishedCourses = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/courses/published`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch courses: ${response.statusText}`);
        }

        const data = (await response.json()) as ListCoursesOutput;
        setCourses(data ?? []);
      } catch (err) {
        console.error("Error fetching published courses:", err);
        setError(err instanceof Error ? err.message : "Failed to load courses");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchPublishedCourses();
  }, []);
```

As you can see, the current query pattern is simply to fetch data as needed.

## So we have these design questions:

1. In the most basic template, is this actually the best option to fetch data as needed?
2. Do we want to add something like Tanstack useQuery for caching and re-using data? Or is that decision best left to devs who build upon this repo?
3. Do we want to build a set of hooks for interact with this data, so that it will work more like Andamio SDK? Should we have a library of hooks that pull API data into state, so that builders using the template don't even need to touch the API endpoints?
4. So far, TRPC is not needed. But it's always an option to route API queries through there if we want to follow patterns from the existing `andamio-platform`. I don't think this will be the best option, but not removing it yet.

## Types

In any query we make, it should be easy for the developer to see the types of:

1. Params being passed to an endpoint
2. Query results

We must export well-structured types from `andamio-db-api`.

Create a set of rules for these type names.

---

## Recommendations

### On Query Pattern Choice

**Current direct fetch approach is appropriate for the template** because:

1. **Zero dependencies** - No additional libraries to learn or maintain
2. **Maximum flexibility** - Developers can see exactly what's happening and customize easily
3. **Educational value** - Transparent pattern that teaches core concepts
4. **No lock-in** - Easy for devs to replace with their preferred solution later

**However, consider the pain points:**
- Boilerplate repetition across components
- No built-in caching or request deduplication
- Manual state management (loading, error, data)
- No automatic refetching or background updates

### Design Question Responses

**1. Is direct fetch the best option for the basic template?**

Yes, for now. It's the simplest pattern that requires no explanation. But...

**Recommended Evolution Path:**
- **Phase 1 (Current)**: Direct fetch with `authenticatedFetch` helper ✅
- **Phase 2 (Suggested)**: Add optional custom hooks that wrap common patterns
- **Phase 3 (Future)**: Extract to `@andamio/react` package with TanStack Query under the hood

**2. Should we add TanStack Query?**

**Not in the base template.** Here's why:
- Adds learning curve and dependency weight
- Different projects have different caching needs
- T3 already includes tRPC which has its own caching

**But consider:**
- Add TanStack Query example in docs/examples
- Create a separate `andamio-t3-tanstack-template` variant
- Document the migration path clearly

**3. Should we build a set of hooks?**

**Yes, with constraints.** Create lightweight hooks that:
- Wrap `authenticatedFetch` with common patterns
- Handle loading/error states consistently
- Are **optional** - devs can still use direct fetch
- Live in `src/hooks/use-andamio-data.ts` or similar

**Example Hook Pattern:**
```typescript
// src/hooks/use-andamio-data.ts
export function useAndamioQuery<T>(
  endpoint: string,
  options?: { enabled?: boolean }
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { authenticatedFetch } = useAndamioAuth();

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}${endpoint}`
      );
      if (!response.ok) throw new Error(response.statusText);
      const result = (await response.json()) as T;
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, authenticatedFetch]);

  useEffect(() => {
    if (options?.enabled !== false) {
      void refetch();
    }
  }, [refetch, options?.enabled]);

  return { data, isLoading, error, refetch };
}

// Usage:
const { data, isLoading, error } = useAndamioQuery<ListCoursesOutput>(
  "/courses/published"
);
```

**Benefits:**
- Reduces boilerplate without adding dependencies
- Consistent error handling patterns
- Easy to understand and modify
- Can be extracted to package later

**4. Should we use tRPC for API queries?**

**No, avoid routing REST API calls through tRPC.** Reasons:
- tRPC is for type-safe **server actions** in Next.js
- Your `andamio-db-api` already provides REST + OpenAPI
- Adding tRPC as a proxy creates unnecessary complexity
- You already have type safety via direct imports from `andamio-db-api`

**Current tRPC usage should be for:**
- Next.js server-side operations
- Future Next.js API routes (if needed)
- Not as a proxy to external REST API

### Type Naming Conventions

**Establish consistent naming rules for all `andamio-db-api` exports:**

**Input Types** (parameters sent to API):
```typescript
// Pattern: {Action}{Resource}Input
CreateCourseInput
UpdateLessonInput
ListCoursesInput
GetModuleInput
```

**Output Types** (data returned from API):
```typescript
// Pattern: {Action}{Resource}Output
CreateCourseOutput
UpdateLessonOutput
ListCoursesOutput
GetModuleOutput

// For single resource: {Resource}Output
CourseOutput
LessonOutput
ModuleOutput
UserOutput
```

**Query Parameter Types** (URL params):
```typescript
// Pattern: {Resource}{Params}
CourseParams         // { courseNftPolicyId: string }
LessonParams        // { courseNftPolicyId, moduleCode, moduleIndex }
```

**Schema Types** (Zod schemas):
```typescript
// Pattern: {Name}Schema
CourseSchema
LessonSchema
CreateCourseInputSchema
ListCoursesOutputSchema
```

**Comprehensive Example:**
```typescript
// In andamio-db-api/src/routers/lessons.ts

// Input schema and type
export const createLessonInputSchema = z.object({
  courseNftPolicyId: z.string(),
  moduleCode: z.string(),
  moduleIndex: z.number(),
  title: z.string(),
  description: z.string().optional(),
  // ...
});
export type CreateLessonInput = z.infer<typeof createLessonInputSchema>;

// Output schema and type
export const lessonOutputSchema = z.object({
  courseNftPolicyId: z.string(),
  moduleCode: z.string(),
  moduleIndex: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  live: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type LessonOutput = z.infer<typeof lessonOutputSchema>;

// List output type
export const listLessonsOutputSchema = z.array(lessonOutputSchema);
export type ListLessonsOutput = z.infer<typeof listLessonsOutputSchema>;

// In frontend:
import {
  type CreateLessonInput,
  type LessonOutput,
  type ListLessonsOutput
} from "andamio-db-api";
```

**Rules:**
1. Always export both schema and type
2. Use `z.infer<>` for type generation (never manual types)
3. Input/Output suffixes are mandatory
4. Use consistent action verbs: Create, Update, Delete, Get, List
5. Singular for single resources, plural for lists
6. Never use abbreviations (e.g., `Lesson` not `Les`)

---

## Action Plan

### Immediate (This Sprint)

2. **Create optional query hook**
   - Implement `useAndamioQuery` in `src/hooks/use-andamio-data.ts`
   - Add usage examples in docs
   - Refactor 1-2 pages to demonstrate usage
   - Keep direct fetch examples for comparison

3. **Document the decision**
   - Update README with query pattern guidance
   - Add "When to use hooks vs direct fetch" section
   - Document migration path to TanStack Query

### Short-term (Next Sprint)

4. **Create advanced examples**
   - Add `docs/examples/tanstack-query-integration.md`
   - Add `docs/examples/custom-hooks-patterns.md`
   - Show mutation patterns (POST, PUT, DELETE)

5. **Consider hook variants**
   - `useAndamioMutation` for POST/PUT/DELETE
   - `useAndamioPaginatedQuery` for paginated lists
   - Keep minimal - only add if pattern is repeated 3+ times

### Future (Package Extraction)

6. **Extract to `@andamio/react` package**
   - Move hooks to dedicated package
   - Add TanStack Query integration layer
   - Provide both hook interfaces:
     - `@andamio/react/lite` - Current minimal hooks
     - `@andamio/react/query` - TanStack Query powered
   - Full TypeScript support with generics

7. **Template variants**
   - `andamio-t3-template` - Current (minimal)
   - `andamio-t3-tanstack-template` - With TanStack Query
   - `andamio-next-template` - Vanilla Next.js (no T3)

---

## Summary

**Recommendation: Incremental Enhancement Strategy**

1. ✅ **Keep direct fetch as default** - Simple, transparent, flexible
2. ✅ **Add optional custom hooks** - Reduce boilerplate, maintain simplicity
3. ✅ **Standardize type naming** - Critical for developer experience
4. ❌ **Don't add TanStack Query yet** - Document it, don't bundle it
5. ❌ **Don't use tRPC as API proxy** - Wrong tool for this job

**Philosophy:** The template should be **minimal but complete**. Provide escape hatches and clear migration paths rather than making decisions for developers. Documentation and examples are better than baked-in dependencies for advanced features.

---

## ✅ IMPLEMENTED: Hybrid Type System with tRPC Inference

### Final Pattern (Validated 2025-01-18)

We've implemented a **hybrid approach** that provides the best of both worlds:
- Direct named type imports for excellent DX
- Auto-generated types from tRPC router (zero drift)
- Runtime validation schemas exported separately

### Architecture

**Backend** (`andamio-db-api`):
```typescript
// In router files (e.g., src/routers/course.ts)
// 1. Export schemas only (not types)
export const courseOutputSchema = z.object({
  courseCode: z.string(),
  title: z.string(),
  // ...
});

export const createCourseInputSchema = z.object({
  courseCode: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  // ...
});

// 2. Use schemas in router procedures
export const courseRouter = router({
  create: protectedMutation
    .input(createCourseInputSchema)
    .output(courseOutputSchema)
    .mutation(async ({ input, ctx }) => { /* ... */ }),
});
```

**Central Type Dictionary** (`andamio-db-api/src/types/index.ts`):
```typescript
import { type inferRouterInputs, type inferRouterOutputs } from '@trpc/server';
import { type AppRouter } from '../routers';

// CRITICAL: Export RouterInputs/RouterOutputs directly (not as re-export)
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;

// Auto-generate named types from router
export type CreateCourseInput = RouterInputs['course']['create'];
export type ListOwnedCoursesOutput = RouterOutputs['course']['listOwned'];

// Re-export schemas for runtime validation
export { courseOutputSchema, createCourseInputSchema } from '../routers/course';
```

**Frontend** (Clean developer experience):
```typescript
// Option A: Direct named import (Recommended)
import { type ListOwnedCoursesOutput } from "andamio-db-api";

const [courses, setCourses] = useState<ListOwnedCoursesOutput>([]);

// Option B: Manual extraction (For flexibility)
import { type RouterOutputs } from "andamio-db-api";
type ListOwnedCoursesOutput = RouterOutputs["course"]["listOwned"];
```

### Key Implementation Details

**✅ What Works:**
- Export `RouterInputs` and `RouterOutputs` **directly** in the same statement
- Use descriptive procedure names (they become part of type names)
- Import types with clear, predictable names
- Backwards compatible with manual extraction pattern

**❌ What Doesn't Work:**
- Defining types locally then re-exporting them (causes resolution issues)
- Using abbreviations or unclear procedure names
- Inline type definitions instead of exported schemas

### Type Naming Convention

**Inputs:**
```typescript
CreateCourseInput      // RouterInputs['course']['create']
UpdateLessonInput      // RouterInputs['lesson']['update']
ListOwnedCoursesInput  // RouterInputs['course']['listOwned']
```

**Outputs:**
```typescript
CourseOutput                // RouterOutputs['course']['getCourseByPolicyId']
ListOwnedCoursesOutput      // RouterOutputs['course']['listOwned']
CreateCourseOutput          // RouterOutputs['course']['create']
```

**Schemas:**
```typescript
courseOutputSchema          // For runtime validation
createCourseInputSchema     // For runtime validation
listOwnedCoursesOutputSchema // For list outputs
```

### Benefits Achieved

1. **Zero Type Drift** - Types are always in sync with router
2. **Excellent DX** - Clean, predictable type imports
3. **Type Safety** - Full IntelliSense and compile-time checking
4. **Runtime Validation** - Schemas available when needed
5. **Backwards Compatible** - Both import patterns work
6. **Single Source of Truth** - Router procedures define everything

### Example: Complete Flow

**1. Define endpoint in router:**
```typescript
// andamio-db-api/src/routers/course.ts
export const listOwnedCoursesInputSchema = z.object({
  limit: z.number().min(1).max(100).default(50),
});

export const courseRouter = router({
  listOwned: protectedProcedure
    .input(listOwnedCoursesInputSchema)
    .output(listOwnedCoursesOutputSchema)
    .query(async ({ input, ctx }) => {
      // Implementation
    }),
});
```

**2. Types auto-generated in types/index.ts:**
```typescript
export type ListOwnedCoursesInput = RouterInputs['course']['listOwned'];
export type ListOwnedCoursesOutput = RouterOutputs['course']['listOwned'];
export { listOwnedCoursesInputSchema, listOwnedCoursesOutputSchema } from '../routers/course';
```

**3. Use in frontend:**
```typescript
import { type ListOwnedCoursesOutput } from "andamio-db-api";

const fetchCourses = async () => {
  const response = await authenticatedFetch(`${API_URL}/courses/owned`);
  const data = (await response.json()) as ListOwnedCoursesOutput;
  setCourses(data);
};
```

**Result:** ✅ Zero TypeScript errors, perfect IntelliSense, clean imports!

