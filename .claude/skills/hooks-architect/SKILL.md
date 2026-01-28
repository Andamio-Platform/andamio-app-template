---
name: hooks-architect
description: Guide developers through creating, using, and auditing Andamio App hooks following established patterns.
---

# Hooks Architect

The Hooks Architect is your guide to the hook layer that connects the Andamio API to the app. Whether you're learning how hooks work, implementing a new hook, or auditing existing hooks for compliance, this skill has you covered.

## Getting Started

When invoked, ask the developer what they want to do:

**Question**: "What would you like to do with hooks?"

| Option | Description | Action |
|--------|-------------|--------|
| **Learn** | "I want to understand how hooks work" | Walk through [HOOK-RULES.md](./HOOK-RULES.md) |
| **Implement** | "I need to create a new hook" | Guide through hook creation |
| **Audit** | "I want to check existing hooks" | Run hook audit checklist |
| **Extract** | "I need to move API calls into hooks" | Guide through extraction process |
| **Reference** | "I need to find an existing hook" | Show [HOOK-REFERENCE.md](./HOOK-REFERENCE.md) |

## Core Principle

Hooks are the **ONLY** interface between UX and API:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Gateway API   │ ──► │     HOOKS       │ ──► │   Components    │
│  (snake_case)   │     │ (transformers)  │     │  (camelCase)    │
│  Generated Types│     │ App-ready Types │     │  Clean Props    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Components should NEVER:**
- Import from `~/types/generated`
- Call `fetch()` or `authenticatedFetch()` directly
- Define inline types for API responses

**Components ALWAYS:**
- Import hooks and types from `~/hooks/api`
- Use camelCase fields
- Trust the hook to handle caching and invalidation

## Reference Files

| File | Purpose |
|------|---------|
| [HOOK-RULES.md](./HOOK-RULES.md) | Precise rules for hook structure |
| [HOOK-REFERENCE.md](./HOOK-REFERENCE.md) | All existing hooks with exports |
| [PROGRESS.md](./PROGRESS.md) | Current work status (Phase 3.9, 3.10) |

## Learn Mode

When the developer wants to learn, walk them through the hook pattern step by step:

1. **Show the exemplary hook** - `use-course.ts` is the gold standard
2. **Explain each section** - Types, Transformers, Keys, Queries, Mutations
3. **Demonstrate consumption** - How components import and use hooks
4. **Show the type flow** - API → Transform → App Type → Component

Key teaching points:
- Types are **colocated** in the hook file, not separate type files
- Transform functions convert snake_case API → camelCase app types
- Query keys enable automatic cache invalidation
- `source` field becomes semantic `status` ("draft", "active", "unregistered")

## Implement Mode

When creating a new hook, guide through these steps:

### Step 1: Identify the Endpoints

Ask: "What API endpoint(s) will this hook use?"

Check if the endpoint exists in the API docs:
- **Gateway API Docs**: https://dev.api.andamio.io/api/v1/docs/index.html

### Step 2: Choose the Owner

Determine which hook file should own the types:
- Is there an existing hook that should own this? (add to existing file)
- Does this need a new file? (create new file with full structure)

Ownership hierarchy:
```
use-course.ts → Course, CourseDetail
use-course-module.ts → CourseModule, SLT, Lesson, Assignment, Introduction
use-project.ts → Project, Task, TaskCommitment
```

### Step 3: Generate the Hook

Use the template in [HOOK-RULES.md](./HOOK-RULES.md) to create:
1. App-level types with camelCase fields
2. Transform function(s)
3. Query key factory
4. Query hook(s) with proper `enabled` conditions
5. Mutation hook(s) with cache invalidation

### Step 4: Export from Index

Add exports to `src/hooks/api/index.ts`.

### Step 5: Update Reference

After implementing, update [HOOK-REFERENCE.md](./HOOK-REFERENCE.md) with the new exports.

## Audit Mode

Run through the checklist for each hook file:

### Quick Audit Commands

```bash
# Find hooks with inline type definitions (potential drift)
grep -rn "interface.*{" src/hooks/api/course/ src/hooks/api/project/ --include="*.ts"

# Check for direct type assertions without generated types
grep -rn "as {" src/hooks/api/course/ src/hooks/api/project/ --include="*.ts"

# Verify all hooks import from generated types
grep -rn "from \"~/types/generated\"" src/hooks/api/course/ src/hooks/api/project/

# Find all query key patterns
grep -rn "queryKey:" src/hooks/api/course/ src/hooks/api/project/
```

### Per-File Checklist

For each hook file, verify:

| Category | Check | Required |
|----------|-------|----------|
| **Types** | App types exported with direct names | Yes |
| **Types** | All fields are camelCase | Yes |
| **Types** | Content fields flattened (title, not content.title) | Yes |
| **Types** | Source type tracks data origin | If merged data |
| **Transformers** | Transform function exported | Yes |
| **Transformers** | Handles nulls safely with `??` | Yes |
| **Transformers** | Returns app type, not API type | Yes |
| **Keys** | Keys object exported | Yes |
| **Keys** | Uses `as const` assertions | Yes |
| **Keys** | Hierarchical structure (all → lists → detail) | Yes |
| **Queries** | Hooks use transformers | Yes |
| **Queries** | Auth hooks use authenticatedFetch | If authenticated |
| **Queries** | Proper `enabled` conditions | Yes |
| **Queries** | 404 returns null or [], not throws | Yes |
| **Mutations** | Invalidates correct query keys | Yes |
| **Exports** | Added to index.ts | Yes |

## Extract Mode

When extracting direct API calls to hooks:

### Step 1: Find Direct Calls

Search for violations:
```bash
# Find fetch() calls in pages/components
grep -rn "fetch(" src/app/ src/components/ --include="*.tsx" | grep -v "node_modules"

# Find authenticatedFetch() calls
grep -rn "authenticatedFetch(" src/app/ src/components/ --include="*.tsx"
```

### Step 2: Group by Endpoint

Group similar API calls. For example:
- 5 pages fetching `/project/user/project/{id}` → single `useProject(id)` hook
- 3 components calling `/course/student/commitment/submit` → single `useSubmitCommitment()` mutation

### Step 3: Create or Extend Hook

Either:
- Add to existing hook file if the type is already owned
- Create new hook file if new domain

### Step 4: Replace Direct Calls

Update components to use the hook:

```typescript
// Before (violation)
const response = await fetch(`/api/gateway/api/v2/project/user/project/${id}`);
const data = await response.json();

// After (correct)
import { useProject } from "~/hooks/api";
const { data: project } = useProject(id);
```

### Step 5: Track Progress

Update [PROGRESS.md](./PROGRESS.md) with completed extractions.

## Reference Mode

Direct developers to [HOOK-REFERENCE.md](./HOOK-REFERENCE.md) which contains:
- All hook files organized by domain
- Exported types from each hook
- Exported hooks (queries and mutations)
- Query key factories

## Related Skills

| Skill | When to Use |
|-------|-------------|
| `/react-query-auditor` | **Cache invalidation, stale data, UX update bugs** |
| `/typescript-types-expert` | Complex type issues, NullableString handling |
| `/transaction-auditor` | TX schema sync with gateway |
| `/audit-api-coverage` | Check which endpoints have hooks |

### Relationship with /react-query-auditor

These skills are complementary:

| Concern | Skill |
|---------|-------|
| **Hook file structure** | **This skill** |
| **Colocated types** | **This skill** |
| **Transform functions** | **This skill** |
| **Creating new hooks** | **This skill** |
| Cache invalidation | `/react-query-auditor` |
| Stale data debugging | `/react-query-auditor` |
| UX update issues | `/react-query-auditor` |
| Query key matching | `/react-query-auditor` |

**Rule of thumb**:
- Structure problems → `/hooks-architect`
- Runtime/cache problems → `/react-query-auditor`

---

**Last Updated**: January 28, 2026
