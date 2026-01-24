# Type Checklist

Quick reference for common type-related tasks.

## When API Changes

After the backend API is updated:

```bash
# 1. Regenerate types from OpenAPI spec
npm run generate:types

# 2. Check for new type errors
npm run typecheck

# 3. Review changes in gateway.ts
git diff src/types/generated/gateway.ts

# 4. Update index.ts if new types need aliases
# 5. Update Zod schemas if request shapes changed
```

## Adding a New API Type

### Response Type (exists in API)

1. Check if it exists in `gateway.ts`
2. If the name is clean, just import it:
   ```typescript
   import { type SomeApiType } from "~/types/generated";
   ```
3. If name is verbose, add alias in `index.ts`:
   ```typescript
   export type { VerboseApiTypeName as CleanName } from "./gateway";
   ```

### Response Type (needs extension)

```typescript
// In index.ts
import type { BaseType } from "./gateway";

export interface ExtendedType extends BaseType {
  additionalField: string;
}
```

### Request Type (not in API spec)

```typescript
// In index.ts
export interface CreateEntityRequest {
  field1: string;
  field2?: string;
}
```

## Adding a New UI Type

If the pattern is used in 2+ files, add to `~/types/ui.ts`:

```typescript
// In src/types/ui.ts
export interface NewPattern {
  id: string;
  label: string;
  icon: IconComponent;
}
```

## Adding Form Validation

### For Transactions

Add to `src/config/transaction-schemas.ts`:

```typescript
export const txSchemas = {
  // ... existing schemas

  NEW_TRANSACTION_TYPE: z.object({
    alias: aliasSchema,
    entity_id: policyIdSchema,
    // ... other fields
    wallet_data: walletDataSchema,
  }),
};
```

### For Regular Forms

Create schema in component or feature file:

```typescript
import { z } from "zod";

const formSchema = z.object({
  title: z.string().min(1, "Required"),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;
```

## Handling NullableString Fields

### In Components

```typescript
import { getString, getOptionalString } from "~/lib/type-helpers";

// For required display
<span>{getString(entity.title)}</span>

// For optional display with fallback
<span>{getString(entity.description) || "No description"}</span>

// For conditional rendering
{getOptionalString(entity.subtitle) && (
  <p>{entity.subtitle}</p>
)}
```

### In Logic

```typescript
import { getString, getOptionalString } from "~/lib/type-helpers";

// Compare strings
const title = getString(course.title);
if (title === "Some Value") { ... }

// Check if has value
const description = getOptionalString(course.description);
if (description) {
  // description is string here
}
```

## Fixing Common Type Errors

### "Type 'object' is not assignable to type 'string'"

```typescript
// Problem: NullableString field
const title = course.title;  // object type

// Solution: Use type helper
import { getString } from "~/lib/type-helpers";
const title = getString(course.title);  // string type
```

### "Property 'x' does not exist on type"

```bash
# 1. Regenerate types
npm run generate:types

# 2. If still missing, check if it's a new field
# 3. Add to extended type in index.ts if needed
```

### "Cannot find name 'SomeType'"

```typescript
// Check import source
import { type SomeType } from "~/types/generated";  // API types
import type { SomeType } from "~/types/ui";  // UI types
```

## Before Creating a Pull Request

Run this type audit:

```bash
# 1. Check for type errors
npm run typecheck

# 2. Search for anti-patterns
grep -r "from.*gateway\"" src/  # Should only be in index.ts
grep -r "as any" src/  # Should be minimal/zero
grep -r "@ts-ignore" src/  # Should be minimal with explanation

# 3. Verify no inline API types
# Look for interface definitions that match API shapes
```

## Quick Import Reference

```typescript
// API types
import {
  type CourseResponse,
  type ProjectV2Output,
  type SLTResponse,
} from "~/types/generated";

// UI patterns
import type {
  NavItem,
  IconComponent,
  StepItem,
  TabItem,
} from "~/types/ui";

// Type helpers
import { getString, getOptionalString } from "~/lib/type-helpers";

// Zod schemas
import { txSchemas, type TxParams } from "~/config/transaction-schemas";
import { z } from "zod";
```

## File Locations Summary

| Type Category | File |
|--------------|------|
| API responses | `~/types/generated` |
| UI patterns | `~/types/ui` |
| Transaction schemas | `~/config/transaction-schemas.ts` |
| Transaction UI | `~/config/transaction-ui.ts` |
| Type helpers | `~/lib/type-helpers.ts` |
| On-chain types | `~/lib/andamioscan-events.ts` |

## When to Use Each Pattern

| Situation | Pattern |
|-----------|---------|
| Consuming API response | Import from `~/types/generated` |
| Displaying nullable field | Use `getString()`/`getOptionalString()` |
| Validating form input | Create Zod schema |
| Reusing UI pattern | Add to `~/types/ui.ts` |
| Extending API type | Extend in `~/types/generated/index.ts` |
| Component-specific props | Define inline in component |
