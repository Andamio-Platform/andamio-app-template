# Zod Schemas

Runtime validation patterns using Zod for transaction parameters and form data.

## Overview

Zod schemas provide runtime validation that TypeScript cannot:
- Validate user input before API calls
- Ensure data matches API contract
- Generate TypeScript types automatically

## Schema Location

Primary location: `src/config/transaction-schemas.ts`

```typescript
import { z } from "zod";
import { txSchemas, type TxParams } from "~/config/transaction-schemas";
```

## Building Block Schemas

Reusable schemas for common field patterns:

```typescript
// Alias - User access token alias (1-31 chars)
export const aliasSchema = z.string().min(1).max(31);

// Policy ID - 56 character hex string
export const policyIdSchema = z.string().length(56);

// Hash - 64 character hex string (slt_hash, task_hash, etc.)
export const hashSchema = z.string().length(64);

// Short text - Max 140 characters (on-chain data)
export const shortTextSchema = z.string().max(140);

// Wallet data - For transaction building
export const walletDataSchema = z.object({
  used_addresses: z.array(z.string()),
  change_address: z.string(),
}).optional();

// Value - Asset class + quantity pairs
export const valueSchema = z.array(
  z.tuple([z.string(), z.number()])
);
```

## Transaction Schema Pattern

Each transaction type has a Zod schema:

```typescript
export const txSchemas = {
  // Course student commits to assignment
  COURSE_STUDENT_ASSIGNMENT_COMMIT: z.object({
    alias: aliasSchema,
    course_id: policyIdSchema,
    slt_hash: hashSchema,
    assignment_info: shortTextSchema,
    wallet_data: walletDataSchema,
  }),

  // Course owner publishes course
  COURSE_OWNER_COURSE_PUBLISH: z.object({
    alias: aliasSchema,
    course_id: policyIdSchema,
    wallet_data: walletDataSchema,
  }),

  // Add more as needed...
} as const;
```

## Type Inference

Get TypeScript types from Zod schemas:

```typescript
// Infer type from schema
type AssignmentCommitParams = z.infer<typeof txSchemas.COURSE_STUDENT_ASSIGNMENT_COMMIT>;
// { alias: string; course_id: string; slt_hash: string; assignment_info: string; wallet_data?: {...} }

// Using the TxParams mapped type
type TxParams = {
  [K in keyof typeof txSchemas]: z.infer<typeof txSchemas[K]>;
};

// Usage
function submitTx(params: TxParams["COURSE_STUDENT_ASSIGNMENT_COMMIT"]) {
  // params is fully typed
}
```

## Validation Patterns

### Form Submission

```typescript
import { txSchemas, type TxParams } from "~/config/transaction-schemas";

function handleSubmit(formData: FormData) {
  // Parse and validate
  const result = txSchemas.COURSE_STUDENT_ASSIGNMENT_COMMIT.safeParse({
    alias: formData.get("alias"),
    course_id: formData.get("course_id"),
    slt_hash: formData.get("slt_hash"),
    assignment_info: formData.get("assignment_info"),
  });

  if (!result.success) {
    // Handle validation errors
    console.error(result.error.flatten());
    return;
  }

  // Use validated data (fully typed)
  const params: TxParams["COURSE_STUDENT_ASSIGNMENT_COMMIT"] = result.data;
  submitTransaction(params);
}
```

### React Hook Form Integration

```typescript
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { txSchemas, type TxParams } from "~/config/transaction-schemas";

const formSchema = txSchemas.COURSE_STUDENT_ASSIGNMENT_COMMIT;
type FormData = TxParams["COURSE_STUDENT_ASSIGNMENT_COMMIT"];

function AssignmentForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      alias: "",
      course_id: "",
      slt_hash: "",
      assignment_info: "",
    },
  });

  function onSubmit(data: FormData) {
    // data is validated and typed
  }

  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>;
}
```

## Custom Form Schemas

For non-transaction forms, create local schemas:

```typescript
// In component or feature-specific file
import { z } from "zod";

const courseSettingsSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.enum(["development", "design", "business"]),
  isPublic: z.boolean().default(false),
});

type CourseSettings = z.infer<typeof courseSettingsSchema>;
```

## Error Handling

### Flatten Errors

```typescript
const result = schema.safeParse(data);

if (!result.success) {
  const errors = result.error.flatten();
  // errors.formErrors - top-level errors
  // errors.fieldErrors - per-field errors
  console.log(errors.fieldErrors);
  // { alias: ["Must be at least 1 character"], ... }
}
```

### Custom Error Messages

```typescript
const mySchema = z.object({
  title: z.string({
    required_error: "Title is required",
    invalid_type_error: "Title must be a string",
  }).min(1, "Title cannot be empty"),

  email: z.string().email("Please enter a valid email"),

  count: z.number().int().positive("Must be a positive integer"),
});
```

## Composing Schemas

### Extend Schemas

```typescript
const baseSchema = z.object({
  alias: aliasSchema,
  course_id: policyIdSchema,
});

const extendedSchema = baseSchema.extend({
  slt_hash: hashSchema,
  assignment_info: shortTextSchema,
});
```

### Merge Schemas

```typescript
const schemaA = z.object({ name: z.string() });
const schemaB = z.object({ age: z.number() });

const combined = schemaA.merge(schemaB);
// { name: string; age: number }
```

### Optional Fields

```typescript
const schema = z.object({
  required: z.string(),
  optional: z.string().optional(),
  nullable: z.string().nullable(),
  defaulted: z.string().default("default value"),
});
```

## Schema-First Design

When designing new features:

1. **Define the schema first:**
```typescript
const createProjectSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  category: z.enum(["development", "design", "content"]),
});
```

2. **Infer the type:**
```typescript
type CreateProjectData = z.infer<typeof createProjectSchema>;
```

3. **Use in components and API calls:**
```typescript
function createProject(data: CreateProjectData) { ... }
```

This ensures runtime validation and compile-time type safety are always in sync.

## Common Patterns

### Discriminated Unions

```typescript
const transactionResultSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("success"), txHash: z.string() }),
  z.object({ status: z.literal("error"), message: z.string() }),
  z.object({ status: z.literal("pending") }),
]);
```

### Transform Data

```typescript
const trimmedString = z.string().transform((s) => s.trim());

const upperCaseAlias = aliasSchema.transform((s) => s.toUpperCase());
```

### Refine with Custom Validation

```typescript
const passwordSchema = z.string()
  .min(8)
  .refine(
    (val) => /[A-Z]/.test(val),
    "Must contain at least one uppercase letter"
  )
  .refine(
    (val) => /[0-9]/.test(val),
    "Must contain at least one number"
  );
```
