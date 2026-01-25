---
name: audit-api-coverage
description: Audit the usage of Andamio API endpoints across all three sub-systems.
---

# Audit API Coverage

Ensure consistent, well-designed hooks connect the Andamio API to the app. This skill audits API hooks, TX hooks, and the patterns that make them work together.

## 🔄 Session Resume

**Before starting new work**, check [API-HOOKS-CLEANUP-PLAN.md](./API-HOOKS-CLEANUP-PLAN.md) for in-progress work.

**Current state** (as of January 25, 2026):
- ✅ `use-course.ts` - APPROVED
- ✅ `use-course-owner.ts` - APPROVED
- 🔶 `use-course-module.ts` - Next up (needs Task 6 + cross-file fix)
- 🔶 5 more hooks need work

**Ask the user**: "Would you like to continue the API hooks cleanup from where we left off? Next hook is `use-course-module.ts`."

---

## 🚧 Current Priority: API Hooks Cleanup

**Active work tracked in**: [API-HOOKS-CLEANUP-PLAN.md](./API-HOOKS-CLEANUP-PLAN.md)

We're standardizing all API hooks to follow the exemplary pattern from `use-course.ts`. This involves:
- Adding app-level types with camelCase fields
- Adding transform functions for API → App conversion
- Ensuring consistent exports

**When this work is complete**, archive or delete `API-HOOKS-CLEANUP-PLAN.md` and remove this priority notice.

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
| [API-HOOKS-CLEANUP-PLAN.md](./API-HOOKS-CLEANUP-PLAN.md) | **🚧 Active** - Current cleanup tasks |
| [unified-api-endpoints.md](./unified-api-endpoints.md) | All gateway endpoints |
| [api-coverage.md](./api-coverage.md) | Implementation status per endpoint |
| [tx-state-machine.md](./tx-state-machine.md) | TX registration and polling flow |
| [COVERAGE-REPORT.md](./COVERAGE-REPORT.md) | Coverage summary |

## Key Directories

| Directory | Contents |
|-----------|----------|
| `src/hooks/api/` | API hooks (course, project, etc.) |
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

## Current Stats

| Category | Endpoints | Notes |
|----------|-----------|-------|
| Admin | 4 | Not hooked (admin panel not built) |
| User | 4 | Partial (auth flow only) |
| Auth | 6 | Complete |
| API Key | 6 | Complete |
| Courses | 41 | ~60% hooked |
| Projects | 17 | ~80% hooked |
| TX | 21 | Complete |

---

**Last Updated**: January 25, 2026 (Session resume added, 2 hooks APPROVED)
