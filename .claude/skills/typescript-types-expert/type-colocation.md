# Type Colocation

The principle of keeping types close to their usage, based on industry best practices from Matt Pocock / Total TypeScript.

## The Core Principle

> "Think of types like functions. If a function is only used in one place, you keep it in that file. Types are exactly the same."
> — Matt Pocock

Types are not sacred. They don't all need to live in a central `types/` folder. **Where a type lives should depend on how it's used.**

## The Three Rules

### Rule 1: Single-Use Types Stay Inline

Types used in only one file belong in that file. This includes:

- Component props
- Hook input/output types
- Page-specific state
- Local utility types

```typescript
// ✅ CORRECT - Props type inline in component file
// src/components/course/course-card.tsx

interface CourseCardProps {
  course: CourseResponse;
  onSelect: (id: string) => void;
  isSelected?: boolean;
}

export function CourseCard({ course, onSelect, isSelected }: CourseCardProps) {
  // ...
}
```

**Why this is correct**:
- The type is only used by this component
- Changes to the type are always co-located with the component
- No need to navigate to another file to understand the interface
- Reduces import clutter

### Rule 2: Multi-Use Types Get Extracted

Types used in 2+ places within a feature go to a shared location:

```
src/features/wizard/
├── wizard.types.ts      # Shared wizard types
├── wizard-context.tsx   # Uses wizard types
├── wizard-steps.tsx     # Uses wizard types
└── wizard-sidebar.tsx   # Uses wizard types
```

Or at the domain level:

```typescript
// src/types/ui.ts - Used across many components
export interface NavItem {
  name: string;
  href: string;
  icon: IconComponent;
  description?: string;
}
```

### Rule 3: App-Wide Types Are Centralized

Types used across multiple features go to `~/types/`:

| Location | Contains |
|----------|----------|
| `~/types/generated` | API response types |
| `~/types/ui.ts` | Shared UI patterns |
| `~/types/transaction.ts` | Transaction flow types |

## Why Inline Types Are CORRECT (Not Just Acceptable)

Many developers feel guilty about inline types. They shouldn't. Here's why inline types are often the **right** choice:

### 1. Locality of Behavior

When you're reading code, you want to understand it without jumping between files. An inline type definition is **self-documenting**.

```typescript
// Everything you need to understand this hook is right here
function useModuleStatus(courseModule: CourseModuleResponse): {
  isComplete: boolean;
  completedSlts: number;
  totalSlts: number;
} {
  // implementation
}
```

### 2. Refactoring Safety

Inline types change with their consumer. When you modify a component's behavior, you update its props type in the same commit. No risk of forgetting to update a distant type file.

### 3. No Premature Abstraction

Creating a shared type "just in case" is a form of premature abstraction. Wait until you actually have 2+ consumers before extracting.

### 4. Bundle Impact

TypeScript types are erased at compile time. There's zero runtime cost difference between inline and shared types. Organization is purely a developer experience decision.

## The "Types as Functions" Mental Model

Ask yourself: **"If this were a function, where would I put it?"**

| If the function would be... | Then the type should be... |
|----------------------------|---------------------------|
| Inline in this file | Inline in this file |
| In a shared utils file | In a shared types file |
| In a domain-specific module | In a domain-specific types file |
| In the app's core library | In `~/types/` |

## Codebase Examples

### Inline Types (Correct)

```typescript
// src/app/(app)/dashboard/page.tsx
interface DashboardStats {
  totalCourses: number;
  completedModules: number;
  pendingAssignments: number;
}

// src/hooks/api/use-course.ts
interface UseCourseOptions {
  courseId: string;
  enabled?: boolean;
}
```

### Shared Feature Types (Correct)

```typescript
// src/features/course-wizard/wizard.types.ts
export type WizardStep = "basics" | "modules" | "slts" | "review";

export interface WizardState {
  currentStep: WizardStep;
  course: Partial<CourseResponse>;
  validationErrors: Record<string, string>;
}
```

### App-Wide Types (Correct)

```typescript
// ~/types/generated/index.ts
export type { OrchestrationMergedCourseDetail as CourseResponse } from "./gateway";

// ~/types/ui.ts
export interface StepItem {
  id: string;
  label: string;
  icon: IconComponent;
  completed: boolean;
}
```

## What Is NOT Colocation

Colocation doesn't mean:

- ❌ Dumping all types in component files regardless of reuse
- ❌ Never having shared type files
- ❌ Duplicating types across files when they're the same
- ❌ Ignoring the generated types system

Colocation means:

- ✅ Keeping single-use types with their consumers
- ✅ Extracting when you have real reuse (2+ files)
- ✅ Using the right level of sharing for each type's scope

## Auditing Type Location

When auditing, ask these questions:

1. **Is this type used in multiple files?**
   - YES → Should it be in a shared location?
   - NO → Inline is correct

2. **Is this an API response type?**
   - YES → Import from `~/types/generated`
   - NO → Location depends on usage

3. **Is this a UI pattern type?**
   - YES, used 2+ places → Goes in `~/types/ui.ts`
   - YES, used 1 place → Inline is correct
   - NO → Domain-specific location

4. **Does this duplicate an existing type?**
   - YES → Consolidate to shared location
   - NO → Current location may be correct

## Summary

- **136 inline types in this codebase are NOT technical debt** — they're correct
- Extract types only when you have **real reuse** (2+ files)
- Think of types like functions: locality is a feature, not a bug
- API types belong in `~/types/generated`, UI patterns in `~/types/ui.ts`
- Everything else? Keep it where it's used

## References

- [Matt Pocock: Where To Put Your Types](https://www.totaltypescript.com/where-to-put-your-types-in-application-code)
- [Kent C. Dodds: Colocation](https://kentcdodds.com/blog/colocation)
