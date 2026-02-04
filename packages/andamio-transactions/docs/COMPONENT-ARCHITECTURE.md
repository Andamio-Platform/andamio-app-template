# Transaction Component Architecture

> How @andamio/transactions definitions power T3 App UX

## Overview

This document describes the architecture for creating transaction UIs in the Andamio T3 App Template, powered by transaction definitions from `@andamio/transactions`.

## The Problem We Solved

**Before:** Each transaction component was 200+ lines of duplicated code:
- Hardcoded UI strings
- Manual input validation
- Repeated transaction flow logic
- No single source of truth

**After:** Transaction components are now ~80 lines, mostly input preparation:
- UI metadata comes from transaction definitions
- Schema validation is automatic
- Transaction flow is handled generically
- Single source of truth in `@andamio/transactions`

## Architecture

### 1. Transaction Definition (`@andamio/transactions`)

Every transaction is defined once in the `@andamio/transactions` package:

```typescript
// packages/andamio-transactions/src/definitions/course-creator/mint-module-tokens.ts

export const MINT_MODULE_TOKENS: AndamioTransactionDefinition = {
  txType: "MINT_MODULE_TOKENS",
  role: "course-creator",

  // Protocol specification (references YAML in andamio-docs)
  protocolSpec: {
    version: "v1",
    id: "course-creator.mint-module-tokens",
    yamlPath: "/yaml/transactions/v1/course-creator/mint-module-tokens.yaml",
    requiredTokens: ["global-state.access-token-user", "course.course-nft"],
  },

  // Build configuration with Zod schema
  buildTxConfig: {
    inputSchema: z.object({
      userAccessTokenUnit: z.string().min(62),
      courseNftPolicyId: z.string().length(56),
      moduleInfos: z.string().min(1),
    }),
    builder: {
      type: "api-endpoint",
      endpoint: "/tx/course-creator/mint-module-tokens"
    },
    estimatedCost: getProtocolCost(protocolId),
  },

  // Side effects (no payloadBuilder - handled by monitoring service)
  onSubmitTx: [
    { def: "updateUserPendingTxs", endpoint: "/v0/users/pending-transactions" },
    { def: "updateModuleStatus", endpoint: "/v0/courses/modules/status" },
  ],

  onConfirmation: [
    {
      def: "updateModuleStatusOnChain",
      endpoint: "/v0/courses/modules/status",
      critical: true,
      retry: { maxAttempts: 5, backoffMs: 2000 }
    },
  ],

  // UI metadata
  ui: {
    buttonText: "Mint Module Tokens",
    title: "Mint Module Tokens",
    description: ["Minting module tokens creates on-chain credentials..."],
    footerLink: "https://docs.andamio.io/docs/protocol/v1/transactions/...",
    footerLinkText: "Tx Documentation",
    successInfo: "Module tokens minted successfully!",
  },

  // Documentation
  docs: {
    protocolDocs: "https://docs.andamio.io/docs/protocol/v1/transactions/...",
    apiDocs: "https://api.andamio.io/docs#/transactions/mint-module-tokens",
  },
};
```

### 2. Generic Transaction Component

The `AndamioTransaction` component works with ANY transaction definition:

```typescript
// src/components/transactions/andamio-transaction.tsx

export function AndamioTransaction<TInput>({
  definition,        // Transaction definition from @andamio/transactions
  inputs,            // Input data matching definition.buildTxConfig.inputSchema
  onSuccess,         // Callback when transaction succeeds
  onError,           // Callback when transaction fails
  // ... other optional props (title, description, icon, etc.)
}) {
  // Validate inputs against schema
  const validatedInputs = definition.buildTxConfig.inputSchema.parse(inputs);

  // Execute transaction
  const handleExecute = async () => {
    await execute({
      endpoint: definition.buildTxConfig.builder.endpoint,
      params: validatedInputs,
      onSuccess: (result) => {
        toast.success(definition.ui.successInfo);
        onSuccess?.(result);
      },
    });
  };

  // Render UI from definition
  return (
    <Card>
      <CardHeader>
        <CardTitle>{definition.ui.title}</CardTitle>
        <CardDescription>{definition.ui.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <TransactionButton
          txState={state}
          onClick={handleExecute}
          stateText={{ idle: definition.ui.buttonText }}
        />
        {/* Cost estimation, documentation links, etc. */}
      </CardContent>
    </Card>
  );
}
```

**Key Features:**
- ✅ Automatic input validation via Zod schema
- ✅ UI rendered from definition metadata
- ✅ Transaction flow handled generically
- ✅ Cost estimation displayed
- ✅ Documentation links included
- ✅ Success/error handling with toasts
- ✅ Full TypeScript type safety

### 3. Specific Transaction Component

Specific components now just prepare inputs and call the generic component:

```typescript
// src/components/transactions/mint-module-tokens.tsx

export function MintModuleTokens({
  courseNftPolicyId,
  modules,
  onSuccess,
  onError,
}) {
  const { user } = useAndamioAuth();

  // Prepare inputs
  const inputs = {
    userAccessTokenUnit: buildAccessTokenUnit(
      user.accessTokenAlias,
      env.NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID
    ),
    courseNftPolicyId,
    moduleInfos: JSON.stringify(modules),
  };

  // Render generic component with definition
  return (
    <AndamioTransaction
      definition={MINT_MODULE_TOKENS}
      inputs={inputs}
      icon={<Coins className="h-5 w-5" />}
      onSuccess={onSuccess}
      onError={onError}
    />
  );
}
```

**Just 80 lines!** Most of which is input preparation and requirements checking.

## Benefits

### 1. Single Source of Truth

Transaction details live in ONE place: the definition in `@andamio/transactions`.

**Before:** UI strings scattered across:
- Transaction component (title, description, button text)
- Success toast messages
- Error messages
- Documentation links

**After:** All UI metadata in the definition.

### 2. Type Safety Across the Stack

```typescript
// Definition provides input schema
buildTxConfig: {
  inputSchema: z.object({
    courseNftPolicyId: z.string().length(56),
    moduleInfos: z.string().min(1),
  })
}

// Generic component validates at runtime
const validatedInputs = definition.buildTxConfig.inputSchema.parse(inputs);

// TypeScript ensures correct types at compile time
<AndamioTransaction<MintModuleTokensInput>
  definition={MINT_MODULE_TOKENS}
  inputs={inputs}  // Type-checked!
/>
```

### 3. Protocol Alignment

Every definition references the protocol YAML:

```typescript
protocolSpec: {
  version: "v1",
  id: "course-creator.mint-module-tokens",
  yamlPath: "/yaml/transactions/v1/course-creator/mint-module-tokens.yaml",
  requiredTokens: ["global-state.access-token-user", "course.course-nft"],
}
```

This ensures:
- UI matches protocol specification
- Token requirements are enforced
- Cost estimates align with protocol
- Documentation references are correct

### 4. Consistency

All 9 transactions (and future ones) use the same:
- UI patterns
- Transaction flow
- Error handling
- Success messaging
- Documentation linking
- Cost estimation display

### 5. Maintainability

**Update UI metadata once:**
```typescript
// In @andamio/transactions definition
ui: {
  buttonText: "Mint Module Tokens (NEW TEXT)",
  title: "Updated Title",
  // ...
}
```

**Changes apply everywhere automatically.**

## File Structure

```
andamio-app-v2/
├── packages/
│   └── andamio-transactions/          # Transaction definitions (embedded)
│       ├── src/
│       │   ├── definitions/
│       │   │   ├── course/            # Course transactions
│       │   │   └── project/           # Project transactions
│       │   └── types/
│       │       └── schema.ts          # Type system
│       └── README.md
│
└── src/                               # Next.js app
    ├── components/
    │   └── transactions/
    │       ├── course/                # Course transaction components
    │       └── project/               # Project transaction components
    └── app/
        └── (app)/                     # App routes with sidebar
```

## Usage Example

### Simple Usage

```tsx
import { MINT_MODULE_TOKENS } from "@andamio/transactions";
import { AndamioTransaction } from "~/components/transactions";

<AndamioTransaction
  definition={MINT_MODULE_TOKENS}
  inputs={{
    userAccessTokenUnit: "abc123...",
    courseNftPolicyId: "policy123...",
    moduleInfos: JSON.stringify([...modules])
  }}
  onSuccess={() => router.refresh()}
/>
```

### Custom UI Override

```tsx
<AndamioTransaction
  definition={MINT_MODULE_TOKENS}
  inputs={inputs}
  title="Custom Title"                    // Override definition title
  description="Custom description"        // Override definition description
  icon={<CustomIcon />}                   // Add custom icon
  showCard={false}                        // Render without card wrapper
/>
```

### Requirements Check

```tsx
<AndamioTransaction
  definition={MINT_MODULE_TOKENS}
  inputs={inputs}
  requirements={{
    check: user.hasCreatorRole,
    failureMessage: "You must be a course creator to mint module tokens",
    failureAction: <LinkToBecomeCreator />
  }}
/>
```

## Implementation Checklist

To add a new transaction:

- [x] 1. Create definition in `@andamio/transactions`
- [x] 2. Define Zod input schema
- [x] 3. Add UI metadata
- [x] 4. Reference protocol YAML
- [x] 5. Define side effects (onSubmitTx, onConfirmation)
- [x] 6. Create specific component (if needed) or use generic directly
- [x] 7. Use in pages/layouts

**Time saved:** 200+ lines of code → ~80 lines per transaction

## Transaction Lifecycle

1. **User clicks button** → `AndamioTransaction.handleExecute()`
2. **Inputs validated** → `definition.buildTxConfig.inputSchema.parse(inputs)`
3. **Transaction built** → API call to `definition.buildTxConfig.builder.endpoint`
4. **User signs** → Wallet signature
5. **Transaction submitted** → Blockchain submission
6. **onSubmitTx side effects** → Execute immediately (updateUserPendingTxs, etc.)
7. **Transaction confirmed** → Wait for blockchain confirmation
8. **onConfirmation side effects** → Execute critical updates with retry
9. **Success** → Show `definition.ui.successInfo` toast

## Future Enhancements

### Transaction Monitoring Service

The monitoring service will:
- Watch for submitted transactions
- Execute side effects based on definitions
- Construct payloads from endpoint type specs (db-api) + transaction context
- Retry critical side effects according to retry policies
- No `payloadBuilder` functions needed (removed from design)

### Remaining Transactions

Apply this pattern to all 46 transactions:
- [x] 4 course-creator (done)
- [x] 5 student (done)
- [ ] 2 general
- [ ] 13 contributor
- [ ] 8 project-creator
- [ ] 14 admin

## Conclusion

This architecture provides:
- **Clean separation** between transaction logic (definitions) and UI (components)
- **Type safety** from schema validation to component props
- **Consistency** across all transactions
- **Maintainability** through single source of truth
- **Protocol alignment** via YAML references

**Result:** Transaction components that are simple, consistent, and powerful.

---

**Demo:** See `/demo/mint-module-tokens` in the T3 app for a live example.

**Documentation:**
- Transaction definitions: `packages/andamio-transactions/README.md`
- Component API: `src/components/transactions/andamio-transaction.tsx`
- Protocol alignment: `packages/andamio-transactions/ALIGNMENT.md`
