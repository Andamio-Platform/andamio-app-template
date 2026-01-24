# Anti-Patterns

What NOT to do with types in this codebase.

> **Important**: Before flagging something as an anti-pattern, check the "What IS Acceptable" section at the end of this document. Some patterns that look problematic are actually intentional and correct.

---

## What IS Acceptable

Before we cover anti-patterns, here are patterns that **look** wrong but are **actually correct**:

### ✅ Inline Types for Single-Use Cases

```typescript
// ✅ CORRECT - Component props inline
interface CourseCardProps {
  course: CourseResponse;
  onSelect: (id: string) => void;
}

// ✅ CORRECT - Hook return type inline
function useModuleStatus(): {
  isComplete: boolean;
  completedCount: number;
}
```

**Why it's correct**: Types used in only one place belong with their consumer. See [type-colocation.md](./type-colocation.md).

### ✅ `as unknown` for NullableString Fields

```typescript
// ✅ CORRECT - Documented workaround for OpenAPI NullableString
const rawTitle = task.title as unknown;
const title = typeof rawTitle === "string" ? rawTitle : "";
```

**Why it's correct**: The OpenAPI generator produces `object` type for NullableString fields. The `as unknown` followed by a typeof check is the documented inline extraction pattern.

### ✅ Large Number of Inline Types

Having 100+ inline types across a codebase is **not technical debt**. If each is used in only one file, they're correctly colocated.

---

## Import Anti-Patterns

### ❌ Direct Import from gateway.ts

```typescript
// ❌ WRONG - Importing from raw generated file
import { OrchestrationMergedCourseDetail } from "~/types/generated/gateway";
```

**Why it's wrong:**
- Bypasses the processing layer
- Uses verbose OpenAPI names
- Missing extended fields and JSDoc
- Changes when API names change

**Fix:**
```typescript
// ✅ CORRECT - Import from the barrel export
import { type CourseResponse } from "~/types/generated";
```

---

### ❌ Inline API Type Definitions

```typescript
// ❌ WRONG - Defining API types locally
interface Course {
  id: string;
  title: string;
  description: string;
}

function useCourse(id: string): Course { ... }
```

**Why it's wrong:**
- Drifts from actual API response
- No connection to API spec
- Duplicates maintenance effort
- Breaks when API changes

**Fix:**
```typescript
// ✅ CORRECT - Use generated types
import { type CourseResponse } from "~/types/generated";

function useCourse(id: string): CourseResponse { ... }
```

---

## NullableString Anti-Patterns

### ❌ Direct Access Without Type Helpers

```typescript
// ❌ WRONG - Direct access to NullableString field
const title = course.title;  // type is 'object | undefined'

<span>{course.title}</span>  // TypeScript may allow but risky
```

**Why it's wrong:**
- `course.title` is typed as `object`, not `string`
- May render `[object Object]` at runtime
- TypeScript won't catch the error

**Fix:**
```typescript
// ✅ CORRECT - Use type helpers
import { getString } from "~/lib/type-helpers";

const title = getString(course.title);

<span>{getString(course.title)}</span>
```

---

### ❌ Casting to String Without Checking

```typescript
// ❌ WRONG - Unsafe type assertion
const title = course.title as string;

const description = course.description as unknown as string;
```

**Why it's wrong:**
- Bypasses type safety completely
- Will error if value is actually null/undefined
- Makes runtime bugs harder to catch

**Fix:**
```typescript
// ✅ CORRECT - Safe extraction
import { getString, getOptionalString } from "~/lib/type-helpers";

const title = getString(course.title);
const description = getOptionalString(course.description);
```

---

## Type Assertion Anti-Patterns

### ❌ Using `as any`

```typescript
// ❌ WRONG - Escaping type system
const data = response.data as any;
const course = apiResult as any as CourseResponse;
```

**Why it's wrong:**
- Completely bypasses TypeScript
- Hides real type errors
- Makes refactoring dangerous

**Fix:**
```typescript
// ✅ CORRECT - Proper type annotation
const data: CourseResponse = response.data;

// Or with validation
const result = courseSchema.safeParse(apiResult);
if (result.success) {
  const course = result.data;
}
```

---

### ⚠️ Using `as unknown as Type` (Context-Dependent)

```typescript
// ❌ WRONG - Double assertion to force incompatible types
const course = response as unknown as CourseResponse;

// ✅ CORRECT - For NullableString extraction (documented pattern)
const rawTitle = task.title as unknown;
const title = typeof rawTitle === "string" ? rawTitle : "";
```

**When it's wrong:**
- Forcing incompatible types without validation
- Hiding real type mismatches
- Bypassing type safety for convenience

**When it's acceptable:**
- NullableString field extraction (always followed by typeof check)
- Documented workarounds with runtime validation

**Fix for wrong usage:**
```typescript
// If API response type mismatch, regenerate types
npm run generate:types

// If truly unknown data, validate at runtime
const result = courseSchema.safeParse(response);
if (!result.success) {
  throw new Error("Invalid data");
}
const course = result.data;
```

**Acceptable NullableString pattern:**
```typescript
// ✅ CORRECT - as unknown followed by type guard
const rawTitle = task.title as unknown;
const title = typeof rawTitle === "string" ? rawTitle : "";

// ✅ ALSO CORRECT - Using type helpers (preferred)
import { getString } from "~/lib/type-helpers";
const title = getString(task.title);
```

---

## Location Anti-Patterns

### ❌ UI Types in Component Files

```typescript
// ❌ WRONG - Defining reusable UI type in component
// src/components/sidebar.tsx
interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

// src/components/mobile-nav.tsx
interface NavItem {  // Duplicate!
  name: string;
  href: string;
  icon: LucideIcon;
}
```

**Why it's wrong:**
- Duplicate type definitions
- Can drift between files
- Not discoverable

**Fix:**
```typescript
// ✅ CORRECT - Shared UI types
// src/types/ui.ts
export interface NavItem {
  name: string;
  href: string;
  icon: IconComponent;
}

// Components import from shared location
import type { NavItem } from "~/types/ui";
```

---

### ❌ API Types in Config Files

```typescript
// ❌ WRONG - Defining response types in config
// src/config/api.ts
interface CourseListResponse {
  courses: Course[];
  total: number;
}
```

**Why it's wrong:**
- Types belong with type definitions
- Config should be runtime values
- Creates confusion about source of truth

**Fix:**
```typescript
// ✅ CORRECT - Import from generated types
import { type CourseListResponse } from "~/types/generated";
```

---

## Validation Anti-Patterns

### ❌ Manual Validation Instead of Zod

```typescript
// ❌ WRONG - Manual validation
function validateCourse(data: unknown) {
  if (!data || typeof data !== "object") return false;
  if (!("title" in data) || typeof data.title !== "string") return false;
  if (data.title.length < 1 || data.title.length > 100) return false;
  // ... more checks
  return true;
}
```

**Why it's wrong:**
- Verbose and error-prone
- No type inference
- Easy to miss edge cases
- Hard to maintain

**Fix:**
```typescript
// ✅ CORRECT - Use Zod schema
import { z } from "zod";

const courseSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
});

const result = courseSchema.safeParse(data);
if (result.success) {
  const course = result.data; // Fully typed
}
```

---

### ❌ Duplicating Zod Schema as Interface

```typescript
// ❌ WRONG - Maintaining both
const courseSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
});

// Duplicate definition!
interface CourseData {
  title: string;
  description?: string;
}
```

**Why it's wrong:**
- Two sources of truth
- Can drift apart
- Double maintenance

**Fix:**
```typescript
// ✅ CORRECT - Infer type from schema
const courseSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
});

type CourseData = z.infer<typeof courseSchema>;
```

---

## Generic Anti-Patterns

### ❌ Ignoring TypeScript Errors

```typescript
// ❌ WRONG - Suppressing errors
// @ts-ignore
const result = badlyTypedFunction(data);

// @ts-expect-error
course.nonexistentField = "value";
```

**Why it's wrong:**
- Hides real type errors
- Breaks type safety
- Makes refactoring dangerous

**Fix:**
```typescript
// ✅ CORRECT - Fix the underlying type issue
// If the function has wrong types, fix them
// If you need a field, add it to the type properly
```

---

### ❌ Excessive Optional Chaining

```typescript
// ❌ WRONG - Over-defensive
const title = course?.data?.content?.title?.value?.toString() ?? "";
```

**Why it's wrong:**
- Usually indicates wrong types
- Masks data structure issues
- Makes debugging harder

**Fix:**
```typescript
// ✅ CORRECT - Trust your types, handle known optionality
import { getString } from "~/lib/type-helpers";

// If course is the only optional part:
const title = course ? getString(course.title) : "";
```

---

## Summary Checklist

Before committing, verify:

- [ ] No imports from `~/types/generated/gateway`
- [ ] No inline API type definitions
- [ ] No NullableString fields accessed directly
- [ ] No `as any` or `as unknown as Type`
- [ ] No duplicate type definitions across files
- [ ] No manual validation where Zod could be used
- [ ] No `@ts-ignore` or `@ts-expect-error` without explanation
