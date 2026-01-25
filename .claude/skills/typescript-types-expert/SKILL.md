---
name: typescript-types-expert
description: Audit, fix, and design TypeScript types for type safety and API integration.
---

# TypeScript Types Expert

Expertise in the Andamio type system with three operational modes for auditing, fixing, and designing types.

## Modes

| Mode | Command | Purpose |
|------|---------|---------|
| **Audit** | `/typescript-types-expert audit` | Analyze type usage in a file |
| **Fix** | `/typescript-types-expert fix` | Fix type issues and anti-patterns |
| **Design** | `/typescript-types-expert` | Design types for new features |

---

## Mode 1: Audit (Type Analysis)

Analyze type usage in a file or component to identify issues and improvement opportunities.

> **Full audit rules and scoring**: See [audit-rules.md](./audit-rules.md)

### Instructions

#### Step 1: Identify Target

If no file provided, ask for one. Accept:
- File path: `src/hooks/api/use-course.ts`
- Component reference: "the course hooks"
- Feature area: "project-related types"

#### Step 2: Apply Type Colocation Principle

Before flagging inline types as issues, apply the colocation principle (see [type-colocation.md](./type-colocation.md)):

| Type Usage | Correct Location |
|------------|-----------------|
| Single-use (1 file) | Inline in that file ✅ |
| Multi-use (2+ files) | Shared feature file or `~/types/` |
| API response | Import from `~/types/generated` |
| UI pattern (2+ files) | Import from `~/types/ui` |

**Key insight**: Inline types for component props, hook options, and page state are CORRECT, not technical debt.

#### Step 3: Check Import Discipline

Verify all API type imports come from the correct source:

```typescript
// ✅ CORRECT - Import from ~/types/generated
import { type CourseResponse, type ProjectV2Output } from "~/types/generated";

// ❌ WRONG - Direct import from gateway.ts
import { type OrchestrationMergedCourseDetail } from "~/types/generated/gateway";
```

**Red flags:**
- Imports from `~/types/generated/gateway`
- Inline interface definitions that duplicate API types
- Duplicate types across multiple files

#### Step 4: Check NullableString Handling

Look for fields that need `getString`/`getOptionalString` from `~/lib/type-helpers`:

**Common NullableString fields:**
- `title`, `description`, `content`
- `policy_id`, `asset_name`
- `task_hash`, `slt_hash`

```typescript
// ✅ CORRECT - Using type helpers
import { getString, getOptionalString } from "~/lib/type-helpers";
const title = getString(course.title);

// ✅ CORRECT - Inline extraction (documented pattern)
const rawTitle = task.title as unknown;
const title = typeof rawTitle === "string" ? rawTitle : "";

// ❌ WRONG - Direct access (may error at runtime)
const title = course.title;
```

#### Step 5: Check Type Assertions

Apply the assertion rules from [audit-rules.md](./audit-rules.md):

| Pattern | Status |
|---------|--------|
| `as Type` (compatible types) | ✅ Pass |
| `as any` | ❌ Fail |
| `as unknown as Type` (NullableString) | ✅ Pass - documented workaround |
| `as unknown as Type` (other) | ⚠️ Warning |
| `@ts-ignore` without comment | ❌ Fail |

#### Step 6: Check Zod Schema Alignment

For files with form validation:
- Verify Zod schemas match API spec
- Check that `z.infer<typeof schema>` matches expected request type
- Ensure building blocks are used from `transaction-schemas.ts`

#### Step 7: Generate Health Report

Output using the report template from [audit-rules.md](./audit-rules.md):

```markdown
## Type System Health Report

**File(s) Audited**: [file list]
**Date**: [date]
**Score**: [X]/100 (Grade: [A-F])

### Import Discipline (X/25)
- [ ] All API types from ~/types/generated
- [ ] UI types from ~/types/ui
- [ ] Type helpers used for NullableString

### Inline Type Validity (X/20)
- [ ] Single-use types correctly inline
- [ ] No duplicate interfaces across files
- [ ] No inline API type definitions

### NullableString Handling (X/20)
- [ ] getString/getOptionalString used
- [ ] No direct field access
- [ ] Documented inline patterns acceptable

### Type Assertions (X/20)
- [ ] Zero `as any` casts
- [ ] All @ts-ignore have explanations
- [ ] `as unknown` only for NullableString

### Zod Schema Alignment (X/15)
- [ ] Schemas match API spec
- [ ] Building blocks reused
- [ ] Types inferred from schemas

### Issues Found
1. [Issue description] - [File:line]

### Recommendations
1. [Recommendation]

### Good Patterns Observed
- [Pattern description]
```

---

## Mode 2: Fix (Type Corrections)

Fix type issues identified during audit or development.

### Instructions

#### Step 1: Identify the Issue

Common issues to fix:

| Issue | Solution |
|-------|----------|
| Direct gateway.ts imports | Change to `~/types/generated` |
| Missing null handling | Add `getString`/`getOptionalString` |
| Inline API type definitions | Import from generated types |
| `as any` assertions | Add proper type guards |
| Stale request types | Update from API spec |

#### Step 2: Apply Fixes

**Converting direct imports:**

```typescript
// Before
import { OrchestrationMergedCourseDetail } from "~/types/generated/gateway";

// After
import { type CourseResponse } from "~/types/generated";
```

**Adding null handling:**

```typescript
// Before
<span>{task.title}</span>

// After
import { getString } from "~/lib/type-helpers";
<span>{getString(task.title)}</span>
```

**Extracting repeated types:**

If you see the same interface defined in 2+ files, extract to appropriate shared location.

#### Step 3: Run Typecheck

After fixes:
```bash
npm run typecheck
```

Fix any cascading type errors.

#### Step 4: Report

Show what was changed and why.

---

## Mode 3: Design (New Types)

Design types for new features following project conventions.

### Instructions

#### Step 1: Understand the Feature

Ask about:
- What data is involved?
- Is it from the API or purely client-side?
- Does it need runtime validation (forms)?
- Is it reusable across components?

#### Step 2: Choose Type Location

Use this decision tree:

```
Is it from the API?
├─ YES → Import from ~/types/generated
│        Does it need a clean alias? → Add to ~/types/generated/index.ts
│
├─ NO → Is it a UI pattern?
│       ├─ YES → Add to ~/types/ui.ts
│       └─ NO → Is it component-specific?
│               ├─ YES → Define inline in component
│               └─ NO → Create domain-specific type file
```

#### Step 3: Design the Types

Follow these patterns:

**For API types:**
```typescript
// In ~/types/generated/index.ts
export type { OrchestrationMergedCourseDetail as CourseResponse } from "./gateway";
```

**For UI patterns:**
```typescript
// In ~/types/ui.ts
export interface StepItem {
  id: string;
  label: string;
  icon: IconComponent;
  completed: boolean;
}
```

**For Zod schemas (validated input):**
```typescript
// In relevant config file
import { z } from "zod";

export const myFormSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
});

export type MyFormData = z.infer<typeof myFormSchema>;
```

#### Step 4: Consider Runtime Validation

If the type is for:
- Form submission → Add Zod schema
- API requests → Check if request type needs manual definition
- External data → Add runtime type guards

#### Step 5: Document

Add JSDoc comments for complex types:

```typescript
/**
 * Course module response with optional SLT hash
 * Extended from OrchestrationModuleContent with slt_hash from parent
 */
export interface CourseModuleResponse extends OrchestrationModuleContent {
  /** SLT hash from the merged module item (copied from parent) */
  slt_hash?: string;
}
```

---

## Documentation Files

| File | Contents |
|------|----------|
| [type-architecture.md](./type-architecture.md) | Type hierarchy and file organization |
| [type-colocation.md](./type-colocation.md) | **NEW** - Colocation principle and when inline types are correct |
| [audit-rules.md](./audit-rules.md) | **NEW** - Pass/fail criteria and health scoring |
| [generated-types.md](./generated-types.md) | Working with API types |
| [zod-schemas.md](./zod-schemas.md) | Runtime validation patterns |
| [anti-patterns.md](./anti-patterns.md) | What NOT to do (and what IS acceptable) |
| [checklist.md](./checklist.md) | Quick reference for common tasks |

---

## Quick Reference

### Type File Locations

```
src/types/
├── generated/
│   ├── gateway.ts     # Raw auto-generated (never import directly)
│   └── index.ts       # Clean exports (import from here)
├── project.ts         # App-level types (Task, Project, TaskCommitment) + transforms
├── ui.ts              # Shared UI patterns (NavItem, IconComponent, etc.)
└── transaction.ts     # Client-side transaction flow

src/config/
├── transaction-schemas.ts   # Zod validation for TX params
└── transaction-ui.ts        # TX types, endpoints, strings

src/lib/
├── type-helpers.ts    # getString, getOptionalString (deprecated - use app types)
└── andamioscan-events.ts    # On-chain event types
```

**Type transformation docs**: `.claude/dev-notes/TYPE-TRANSFORMATION.md`

### Common Type Imports

```typescript
// App-level types (preferred for projects/tasks/commitments)
import { type Task, type Project, type TaskCommitment, transformApiTask } from "~/types/project";

// API response types (for raw API access)
import { type CourseResponse, type ProjectV2Output } from "~/types/generated";

// UI pattern types
import type { NavItem, IconComponent, StepItem } from "~/types/ui";

// Zod schemas and inferred types
import { txSchemas, type TxParams } from "~/config/transaction-schemas";

// Type helpers (deprecated - use app types instead)
import { getString, getOptionalString } from "~/lib/type-helpers";
```

### Naming Conventions

| Suffix | Purpose | Example |
|--------|---------|---------|
| `Response` | API response type | `CourseResponse` |
| `V2Output` | API v2 output type | `ProjectV2Output` |
| `ListResponse` | Array response | `CourseListResponse` |
| `Item` | Item in a list | `CourseListItem` |
| `Schema` | Zod schema | `txSchemas.COURSE_PUBLISH` |
| `Params` | Request parameters | `TxParams["COURSE_PUBLISH"]` |
