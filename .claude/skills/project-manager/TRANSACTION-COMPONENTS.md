# Andamio Template Transaction Components

> Last Updated: January 9, 2026

Andamio is a Web3 platform with many transactions happening on-chain.

This document describes the transaction component architecture for the T3 App Template.

**Design Philosophy**:
- Minimal, consistent transaction UX using shadcn/ui and Andamio components
- Type-safe transaction definitions with declarative side effects
- Automatic pending transaction monitoring

## Initial Rules

1. **Andamioscan** returns unsigned CBOR that the user needs to sign
2. We hit the tx endpoints with nice fetch requests, just like any other data
3. Completed transactions need to update our database

---

## Transaction Architecture

### Core Components

**1. Transaction Hook (`useTransaction`)**
- Handles transaction lifecycle: fetch → sign → submit
- Manages transaction state (idle, loading, signing, submitting, success, error)
- Integrates with Mesh SDK for wallet signing
- Provides callbacks for success/error handling
- Supports partial signing for multi-sig transactions via `partialSign` option

**2. Transaction Button Component (`TransactionButton`)**
- Reusable button for initiating transactions
- Shows loading states during transaction flow
- Displays transaction status (signing, submitting, etc.)
- Uses AndamioButton with enhanced states

**3. Transaction Status Component (`TransactionStatus`)**
- Displays transaction progress/result
- Shows transaction hash in a formatted code block on success
- Provides "View on Cardano Explorer" button with external link
- Error messaging with retry option
- Uses semantic colors (success, error, info)
- Accepts custom messages for each transaction state

### Transaction Flow

```
1. User clicks TransactionButton
   ↓
2. useTransaction fetches unsigned CBOR from Andamioscan endpoint
   ↓
3. User signs transaction with wallet (Mesh SDK)
   ↓
4. useTransaction submits signed tx to blockchain
   ↓
5. On success: update database + show success state
   ↓
6. Display tx hash and Cardano explorer link
```

### Andamioscan Transaction Endpoints

Transaction endpoints can use different HTTP methods:
- **GET**: Parameters sent as query string (e.g., mint access token)
- **POST**: Parameters sent as JSON body (e.g., submit assignment)
- **Response**: Unsigned CBOR (hex string)
- **Endpoint**: `/api/andamioscan/tx/{transaction-name}`

The `useTransaction` hook automatically handles both methods based on the `method` parameter in the transaction config.

### Partial Signing (Multi-Sig Support)

For transactions that require multiple signatures (e.g., pre-signed by backend), use the `partialSign` option:

```typescript
await execute({
  endpoint: "/tx/v2/some/multi-sig-tx",
  params: { ... },
  partialSign: true,  // Preserves existing signatures when signing
  onSuccess: (result) => { ... },
});
```

When `partialSign: true`:
- The wallet adds its signature without clearing existing signatures in the CBOR
- Used when the unsigned CBOR already contains signatures from other parties
- The transaction is still submitted normally after signing

---

## Implemented Transactions

### Mint Access Token

**Status**: ✅ Active

**Purpose**: Mint a new Andamio Access Token NFT for the user

**Andamioscan Endpoint**: `/tx/access-token/mint`

**Frontend Endpoint**: `/api/andamioscan/tx/access-token/mint`

**HTTP Method**: `GET` (parameters sent as query string)

**Parameters**:
- `user_address` (string): User's Cardano wallet address (bech32 format)
- `new_alias` (string): Desired access token alias/username

**Flow**:
1. User enters desired alias on dashboard
2. Click "Mint Access Token" button
3. Fetch unsigned CBOR from Andamioscan
4. Sign with wallet
5. Submit to blockchain
6. Update database with new access token record

**Components**:
- `src/hooks/use-transaction.ts` - Core transaction hook
- `src/components/transactions/transaction-button.tsx` - Reusable tx button
- `src/components/transactions/transaction-status.tsx` - Status display
- `src/components/transactions/mint-access-token.tsx` - Mint token UI

**Used In**:
- Dashboard page - for users without access token

---

### Enroll in Course (Mint Local State)

**Status**: ✅ Active

**Purpose**: Enroll a learner in a course by minting their course local state NFT

**Andamioscan Endpoint**: `/tx/student/mint-local-state`

**Frontend Endpoint**: `/api/andamioscan/tx/student/mint-local-state`

**HTTP Method**: `GET` (parameters sent as query string)

**Parameters**:
- `user_access_token` (string): Concatenated access token policy ID + user's alias
- `policy` (string): Course NFT policy ID

**Flow**:
1. User visits course page
2. System checks enrollment status via `/user-course-status/{courseNftPolicyId}`
3. If not enrolled, show EnrollInCourse component
4. Click "Enroll in Course" button
5. Fetch unsigned CBOR from Andamioscan
6. Sign with wallet
7. Submit to blockchain
8. On success, refetch status to show progress card

**Components**:
- `src/components/transactions/enroll-in-course.tsx` - Enrollment transaction UI
- `src/components/learner/user-course-status.tsx` - Shows enrollment or progress

**Used In**:
- `/course/[coursenft]` - Course detail page (via UserCourseStatus component)

**Note**: The `user_access_token` is built by concatenating `NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID` + user's alias.

---

## Future Transactions

These will follow the same pattern:

- **Submit Assignment**
- **Issue Course Module Credential**
- **Create Course**
- **Update Course**
- **Burn Access Token**

---

## Package Extraction Plan

**Target Package**: `@andamio/transactions`

**Exports**:
```typescript
// Hooks
export { useTransaction } from "./hooks/use-transaction"

// Components
export { TransactionButton } from "./components/transaction-button"
export { TransactionStatus } from "./components/transaction-status"

// Types
export type {
  TransactionState,
  TransactionResult,
  TransactionConfig  // Includes partialSign option
} from "./types"
```

**Dependencies**:
- `@meshsdk/core` - Wallet integration
- `@andamio/ui` - UI components (when extracted)
- React

---

## Development Notes

- Use semantic colors for all transaction states
- All components should work with light/dark mode
- Transaction buttons should be disabled during signing/submission
- Always show clear error messages
- **Always use TransactionStatus to display successful transactions with txHash**
- Provide tx hash links to Cardano explorer on success
- Custom success messages can be provided via the `messages` prop
- TransactionStatus automatically shows/hides based on transaction state