---
name: audit-api-coverage
description: Audit the usage of Andamio API endpoints across all three sub-systems.
---

# Audit API Coverage

Ensure consistent, well-designed hooks connect the Andamio API to the app. This skill audits API hooks, TX hooks, and the patterns that make them work together.

## Current Status

**Course Hooks**: COMPLETE - All 10 course-related hooks follow the exemplary pattern.

**Project Hooks**: IN PROGRESS - 2 hooks need camelCase type conversion.

See [HOOKS-STATUS.md](./HOOKS-STATUS.md) for the full status summary.

---

## Quick Links

| Resource | Description |
|----------|-------------|
| [API Docs](https://dev.api.andamio.io/api/v1/docs/index.html) | Live Swagger UI |
| [OpenAPI Spec](https://dev.api.andamio.io/api/v1/docs/doc.json) | Machine-readable spec |

## Subskills

This skill has two focused subskills:

| Subskill | File | Purpose |
|----------|------|---------|
| **api-hooks** | [api-hooks-audit.md](./api-hooks-audit.md) | Audit `src/hooks/api/` for patterns, types, transformers |
| **tx-hooks** | [tx-hooks-audit.md](./tx-hooks-audit.md) | Audit `src/hooks/tx/` and transaction config consistency |

### Related Skill: transaction-auditor

The **transaction-auditor** skill handles syncing with gateway API spec changes:

```
Run /transaction-auditor
```

Use when the gateway publishes breaking changes to TX endpoints. It provides step-by-step commands to fetch the latest spec, compare schemas, and update local files.

## Core Principle: Hooks as the Connection Layer

The hooks layer (`src/hooks/api/` and `src/hooks/tx/`) is the critical connection between:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Gateway API   │ ──► │     HOOKS       │ ──► │   Components    │
│  (snake_case)   │     │ (transformers)  │     │  (camelCase)    │
│  Generated Types│     │ App-ready Types │     │  Clean Props    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Hooks must:**
1. Import from `~/types/generated` (gateway types)
2. Export app-ready types with direct names (Course, Task, Assignment)
3. Provide transformers that convert API → App types
4. Use React Query for caching and deduplication
5. Handle auth via `useAndamioAuth`

## Running Audits

### Interactive Mode (Recommended)

Ask Claude to run a specific subskill:

```
Run /audit-api-coverage api-hooks
Run /audit-api-coverage tx-hooks
```

This will:
1. Scan the relevant files
2. Check against the pattern checklists
3. Report issues interactively
4. Suggest or apply fixes

### Full Audit

```
Run /audit-api-coverage
```

Runs both subskills and produces a consolidated report.

## Reference Files

| File | Purpose |
|------|---------|
| [HOOKS-STATUS.md](./HOOKS-STATUS.md) | Current implementation status summary |
| [unified-api-endpoints.md](./unified-api-endpoints.md) | All gateway endpoints |
| [api-coverage.md](./api-coverage.md) | Implementation status per endpoint |
| [tx-state-machine.md](./tx-state-machine.md) | TX registration and polling flow |
| [archive/](./archive/) | Completed work plans for team reference |

## Key Directories

| Directory | Contents |
|-----------|----------|
| `src/hooks/api/course/` | Course-related hooks |
| `src/hooks/api/project/` | Project-related hooks |
| `src/hooks/tx/` | Transaction hooks |
| `src/config/` | Transaction schemas and UI config |
| `src/types/generated/` | Auto-generated gateway types |

## Pattern Summary

### API Hooks Pattern

Every API hook file should have:

```typescript
// 1. App-level types (camelCase, direct names)
export interface Course { ... }
export interface CourseDetail extends Course { ... }

// 2. Transform functions
export function transformCourse(item: ApiType): Course { ... }

// 3. Query keys
export const courseKeys = {
  all: ["courses"] as const,
  detail: (id: string) => [...courseKeys.all, "detail", id] as const,
};

// 4. Query hooks (return transformed types)
export function useCourse(id: string) {
  return useQuery({
    queryKey: courseKeys.detail(id),
    queryFn: async () => transformCourse(await fetchCourse(id)),
  });
}

// 5. Mutation hooks (invalidate cache)
export function useUpdateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    onSuccess: () => queryClient.invalidateQueries({ queryKey: courseKeys.all }),
  });
}
```

### TX Hooks Pattern

Transaction flow requires consistency across:

```
transaction-ui.ts      → TransactionType, UI strings, endpoints
transaction-schemas.ts → Zod validation schemas
use-tx-watcher.ts      → TX_TYPE_MAP, registration, polling
```

Every TransactionType must have entries in all three files.

## Hook File Organization

```
src/hooks/api/course/
├── use-course.ts              # Core types + PUBLIC queries only
├── use-course-owner.ts        # Owner mutations
├── use-course-teacher.ts      # Teacher queries + mutations
├── use-course-student.ts      # Student queries + mutations
├── use-course-module.ts       # Module types + CRUD (owns SLT, Lesson, Assignment, Introduction types)
├── use-slt.ts                 # SLT queries + CRUD mutations
├── use-lesson.ts              # Lesson queries + CRUD mutations
├── use-assignment.ts          # Assignment query + CRUD mutations
├── use-introduction.ts        # Introduction CRUD mutations
└── use-module-wizard-data.ts  # Composite UI hook

src/hooks/api/project/
├── use-project.ts              # Core types + PUBLIC queries
├── use-project-manager.ts      # Manager queries + mutations
└── use-project-contributor.ts  # Contributor queries + mutations
```

---

**Last Updated**: January 26, 2026
