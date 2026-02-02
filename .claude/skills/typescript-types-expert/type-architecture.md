# Type Architecture

Overview of the type system hierarchy and organization in the Andamio T3 App.

## Type Flow Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│  OpenAPI Spec (Gateway API)                                     │
│  https://dev.api.andamio.io/api/v1/docs/openapi.json           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ npm run generate:types
┌─────────────────────────────────────────────────────────────────┐
│  src/types/generated/gateway.ts  (~2000 lines)                  │
│  - Raw auto-generated types                                     │
│  - All fields optional (OpenAPI default)                        │
│  - Verbose names (OrchestrationMergedCourseDetail)             │
│  - NullableString becomes 'object' type                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ Processing layer
┌─────────────────────────────────────────────────────────────────┐
│  src/types/generated/index.ts  (~500 lines)                     │
│  - Clean type aliases (CourseResponse)                          │
│  - Extended types with required fields                          │
│  - Backward compatibility types                                 │
│  - JSDoc documentation                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ Transform layer (snake_case → camelCase)
┌─────────────────────────────────────────────────────────────────┐
│  src/types/project.ts  (~450 lines)                             │
│  - App-level types (Task, Project, TaskCommitment)              │
│  - Flattened structure (content.title → title)                  │
│  - camelCase fields (taskHash, lovelaceAmount)                  │
│  - Transform functions (transformApiTask, etc.)                 │
│  - See: .claude/dev-notes/TYPE-TRANSFORMATION.md                │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ Transaction      │ │ UI Types         │ │ Component Types  │
│ Schemas (Zod)    │ │ ~/types/ui.ts    │ │ (inline props)   │
│ Runtime valid.   │ │ Shared patterns  │ │ Per-component    │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

## File Organization

### src/types/generated/

**gateway.ts** (auto-generated, never edit)
- Direct output from openapi-typescript
- All fields are optional (TypeScript partial)
- Names match OpenAPI schema exactly
- Contains NullableString issue (generates as `object`)

**index.ts** (curated exports)
- Clean type aliases for common types
- Extended interfaces with required fields
- Backward compatibility aliases
- JSDoc documentation for each type

### src/types/

**project.ts** (app-level types with transforms)
- `Task` - Flattened task type (camelCase)
- `Project` - Flattened project type (camelCase)
- `TaskCommitment` - Commitment type (camelCase)
- `transformApiTask()`, `transformOnChainTask()` - API → App transforms
- `transformProjectDetail()`, `transformProjectListItem()` - Project transforms
- `transformApiCommitment()` - Commitment transform

**ui.ts** (shared UI patterns)
- `IconComponent` - Lucide icon type alias
- `NavItem` - Navigation items with icon
- `StepItem` - Wizard/onboarding steps
- `TabItem` - Tab definitions
- `RouteInfo` / `RouteCategory` - Route documentation

**transaction.ts** (client-side TX flow)
- Transaction state types
- Pending transaction context
- TX status enums

### src/config/

**transaction-schemas.ts** (Zod validation)
- Schema building blocks (aliasSchema, policyIdSchema)
- Per-transaction-type schemas
- `TxParams` mapped type
- Type inference via `z.infer<typeof schema>`

**transaction-ui.ts** (TX metadata)
- `TransactionType` enum
- Endpoint mappings
- UI strings (titles, descriptions)

### src/lib/

**type-helpers.ts** (runtime utilities)
- `getString()` - Extract string from NullableString
- `getOptionalString()` - Same, returns undefined

## Import Hierarchy Rules

```typescript
// ✅ Correct import order and sources

// 1. App-level types - prefer from ~/types/project (camelCase, flat)
import { type Task, type Project, type TaskCommitment } from "~/types/project";

// 2. API types - from ~/types/generated (for raw API access)
import { type CourseResponse, type ApiTypesTask } from "~/types/generated";

// 3. UI types - always from ~/types/ui
import type { NavItem, IconComponent } from "~/types/ui";

// 4. Type helpers - from ~/lib/type-helpers (deprecated, use app types)
import { getString, getOptionalString } from "~/lib/type-helpers";

// 5. Transaction schemas - from ~/config
import { txSchemas, type TxParams } from "~/config/transaction-schemas";
```

```typescript
// ❌ Never do this

// Direct import from raw generated file
import { OrchestrationMergedCourseDetail } from "~/types/generated/gateway";

// Defining API types locally
interface Course {
  id: string;
  title: string;
}
```

## Type Location Decision Tree

```
New type needed?
│
├─ Is it from the API?
│  │
│  ├─ YES, exists in gateway.ts
│  │  └─ Add clean alias in index.ts if needed
│  │
│  └─ NO, request type not in spec
│     └─ Define in index.ts with "Request" suffix
│
├─ Is it a UI pattern used in 2+ files?
│  │
│  ├─ YES → Add to ~/types/ui.ts
│  └─ NO → Define inline in component
│
├─ Does it need runtime validation?
│  │
│  ├─ YES → Create Zod schema in appropriate config file
│  └─ NO → Use TypeScript interface
│
└─ Is it domain-specific utility type?
   │
   └─ Add to relevant lib file or hook file
```

## Naming Conventions

### API Types (from generated)

| Pattern | Example | Use |
|---------|---------|-----|
| `*Response` | `CourseResponse` | Single item response |
| `*ListResponse` | `CourseListResponse` | Array response wrapper |
| `*Item` | `CourseListItem` | Item within a list |
| `*V2Output` | `ProjectV2Output` | V2 API output |
| `*Content` | `ModuleContent` | Embedded content |

### UI Types

| Pattern | Example | Use |
|---------|---------|-----|
| `*Item` | `NavItem`, `StepItem` | Items in lists/collections |
| `*Component` | `IconComponent` | Component type aliases |
| `*Info` | `RouteInfo` | Metadata objects |

### Validation Types

| Pattern | Example | Use |
|---------|---------|-----|
| `*Schema` | `aliasSchema` | Zod schema object |
| `*Params` | `TxParams` | Inferred parameter types |
| `*Data` | `MyFormData` | Form data type |

## File Size Guidelines

Keep type files focused:

| File | Target Size | Contains |
|------|-------------|----------|
| gateway.ts | Any (auto-gen) | All API types |
| index.ts | <600 lines | Curated exports + extensions |
| ui.ts | <200 lines | UI patterns only |
| transaction.ts | <200 lines | Client TX flow only |
| transaction-schemas.ts | <600 lines | All TX validation |

If a file grows too large, split by domain (course-types.ts, project-types.ts).
