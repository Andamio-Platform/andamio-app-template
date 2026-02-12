---
name: sponsored-transactions
description: Guide implementation of fee-sponsored transactions using utxos.dev sponsorship tank.
---

# Sponsored Transactions

**Purpose**: Enable gasless UX by allowing instance owners to sponsor transaction fees for their users via `@utxos/sdk` sponsorship tank integration.

> **Last Updated**: 2026-02-12

## When to Use

- When extending sponsorship to additional transaction types
- When debugging sponsored TX failures
- When configuring a new instance for fee sponsorship
- When auditing sponsorship-related environment variables
- When prompted with `/sponsored-transactions`

## Foundation: Jingles' Migration Sponsorship

The sponsored transactions pattern was established by Jingles in the `sponsored-migration` branch, implementing gasless V1→V2 access token migration. This serves as the reference implementation for all future sponsored TX types.

**Branch**: `Andamio-Platform/andamio-app-v2/tree/sponsored-migration`
**Plan Document**: `.claude/_plan/sponsorship.md` (582 lines of detailed architecture)

### What's Implemented

| Component | File | Status |
|-----------|------|--------|
| Server-side SDK singleton | `src/lib/utxos-sdk.ts` | ✅ Complete |
| Sponsored TX hook | `src/hooks/tx/use-sponsored-transaction.ts` | ✅ Complete |
| API route (migration) | `src/app/api/sponsor-migrate/route.ts` | ✅ Complete |
| Environment variables | `src/env.js` | ✅ Complete |
| Migration page integration | `src/app/migrate/page.tsx` | ✅ Complete |

### Sponsored TX Type

Currently only one TX type is sponsored:

| TX Type | Endpoint | Status |
|---------|----------|--------|
| `GLOBAL_USER_ACCESS_TOKEN_CLAIM` | `/api/sponsor-migrate` | ✅ Sponsored |
| All other 17 TX types | `/api/gateway/*` | ❌ User pays fees |

### Migration Deployment Note

> **Important**: The V1→V2 migration (`GLOBAL_USER_ACCESS_TOKEN_CLAIM`) only works on **staging** and **prod** deployments:
>
> | Environment | URL | Network | V1 Tokens |
> |-------------|-----|---------|-----------|
> | Staging | `preprod.app.andamio.io` | Preprod | ✅ Pre-minted |
> | Prod | `mainnet.app.andamio.io` | Mainnet | ✅ Pre-minted |
> | Dev | `dev.app.andamio.io` | Preprod | ❌ No V1 tokens |
>
> This is because V1 access tokens were pre-minted on preprod and mainnet only. The dev environment cannot test migration flows.
>
> **Test wallets**: James has a few V1 preprod access tokens available for testing on staging.

## Architecture

The sponsorship flow intercepts unsigned CBOR from the Gateway, rewrites it with the developer's fee UTXO via `@utxos/sdk`, and returns a partially-signed TX for the user to complete.

```
Client                     /api/sponsor-migrate          @utxos/sdk + Gateway
  │                              │                              │
  │── POST { alias } ──────────>│                              │
  │                              │── POST /tx/.../claim ──────>│
  │                              │<── { unsigned_tx } ─────────│
  │                              │                              │
  │                              │── sdk.sponsorship           │
  │                              │     .sponsorTx(cbor) ──────>│
  │                              │<── { sponsored_tx } ────────│
  │                              │     (dev-wallet-signed)     │
  │<── { sponsored_tx } ────────│                              │
  │                              │                              │
  │── wallet.signTx(tx, true) ──│  (partial sign)              │
  │── wallet.submitTx(signed) ──│──────────────────────────────>
  │                              │                              │
  │── POST /tx/register ───────>│  (standard confirmation)     │
```

### Key Insight: @utxos/sdk `sponsorTx()`

The `sponsorTx()` method:
1. Receives the unsigned CBOR built by the Gateway
2. Removes placeholder UTXOs (if any)
3. Inserts a real UTXO from the developer's funded sponsorship wallet
4. Recalculates fees
5. Partially signs with the developer's private key
6. Returns CBOR ready for user's partial signature

**Critical**: `sponsorTx()` MUST run server-side because it requires `WEB3_SDK_PRIVATE_KEY`.

## Data Sources

| File | Purpose |
|------|---------|
| `src/lib/utxos-sdk.ts` | Server-side Web3Sdk singleton factory |
| `src/hooks/tx/use-sponsored-transaction.ts` | Client hook (migration-specific) |
| `src/app/api/sponsor-migrate/route.ts` | Server route for sponsored migration |
| `src/env.js` | Environment variable schema |
| `.env.example` | Variable documentation |
| `src/config/wallet.ts` | WEB3_SERVICES_CONFIG (env-configurable) |
| `.claude/_plan/sponsorship.md` | Jingles' detailed implementation plan |

### Skill Supporting Files

| File | Purpose |
|------|---------|
| `env-variables.md` | Complete env var tracking, deployment patterns, GCloud setup |
| `ops-setup.md` | Ops team instructions for GCloud secrets and Cloud Run config |

## Environment Variables

> **Full details**: See `env-variables.md` for usage locations, deployment patterns, and GCloud setup.

### Quick Reference

| Variable | Side | Injection | Purpose |
|----------|------|-----------|---------|
| `NEXT_PUBLIC_WEB3_SDK_PROJECT_ID` | Client | Build-time | Social login, SDK init |
| `NEXT_PUBLIC_WEB3_SDK_NETWORK` | Client | Build-time | Network (testnet/mainnet) |
| `WEB3_SDK_API_KEY` | Server | Runtime (GCloud) | UTXOS API auth |
| `WEB3_SDK_PRIVATE_KEY` | Server | Runtime (GCloud) | Wallet signing key |
| `UTXOS_SPONSORSHIP_ID` | Server | Runtime (GCloud) | Sponsorship tank ID |

### Current Values (Dev)

```bash
# Client-side (build-time, in GitHub vars)
NEXT_PUBLIC_WEB3_SDK_PROJECT_ID=4a606bec-f3b4-49bd-a9e6-ad16f7b81d74
NEXT_PUBLIC_WEB3_SDK_NETWORK=testnet

# Server-side (runtime, in GCloud Secret Manager)
WEB3_SDK_API_KEY=<secret>
WEB3_SDK_PRIVATE_KEY=<secret>
UTXOS_SPONSORSHIP_ID=8dd7a8b6-912c-4359-a8f0-2f99affb2b92
```

### Deployment Patterns

**Build-time (NEXT_PUBLIC_*)**:
- Store in GitHub repository variables (e.g., `DEV_WEB3_SDK_PROJECT_ID`)
- Pass via workflow `build-args` to Docker
- Add `ARG` + `ENV` in Dockerfile

**Runtime (server secrets)**:
- Store in Google Cloud Secret Manager
- Mount as Cloud Run environment variables
- Never in Dockerfile or workflow files

## Existing Implementation Reference

### `src/lib/utxos-sdk.ts`

Server-side singleton that creates the Web3Sdk instance:

```typescript
import { Web3Sdk } from "@utxos/sdk";
import { BlockfrostProvider } from "@meshsdk/core";
import { env } from "~/env";

let _sdk: Web3Sdk | null = null;

export function getWeb3Sdk(): Web3Sdk | null {
  if (_sdk) return _sdk;

  const apiKey = env.WEB3_SDK_API_KEY;
  const privateKey = env.WEB3_SDK_PRIVATE_KEY;
  const projectId = process.env.NEXT_PUBLIC_WEB3_SDK_PROJECT_ID;

  if (!apiKey || !privateKey || !projectId) return null;

  // ... creates and returns Web3Sdk instance
}
```

### `src/hooks/tx/use-sponsored-transaction.ts`

Client hook with same interface as `useTransaction`:

```typescript
export function useSponsoredTransaction() {
  // Returns: { state, error, result, execute, reset, isLoading, ... }
  // execute({ alias }) → calls /api/sponsor-migrate
}
```

### `src/app/api/sponsor-migrate/route.ts`

Server route that:
1. Validates request (alias)
2. Calls Gateway to build unsigned CBOR
3. Calls `sdk.sponsorship.sponsorTx()` to rewrite with dev wallet
4. Returns sponsored (dev-signed) CBOR

## Extending to Other TX Types

### Pattern: Create New API Route Per TX Type

For each new sponsored TX type, create a dedicated route:

```
src/app/api/
├── sponsor-migrate/route.ts        # GLOBAL_USER_ACCESS_TOKEN_CLAIM ✅
├── sponsor-assignment/route.ts     # COURSE_STUDENT_ASSIGNMENT_COMMIT (future)
├── sponsor-credential/route.ts     # COURSE_STUDENT_CREDENTIAL_CLAIM (future)
└── sponsor-task/route.ts           # PROJECT_CONTRIBUTOR_TASK_* (future)
```

### Pattern: Generic Sponsored Hook

Create a parameterized hook that accepts any TX type:

```typescript
// src/hooks/tx/use-sponsored-tx.ts (future)
export function useSponsoredTx<T extends SponsoredTxType>(txType: T) {
  // Route to appropriate /api/sponsor-* endpoint based on txType
}
```

### Pattern: Sponsorship Config

Create a config that maps TX types to sponsorship settings:

```typescript
// src/config/sponsorship.ts (future)
export const SPONSORED_TX_CONFIG: Partial<Record<TransactionType, boolean>> = {
  GLOBAL_USER_ACCESS_TOKEN_CLAIM: true,
  COURSE_STUDENT_ASSIGNMENT_COMMIT: true,
  COURSE_STUDENT_CREDENTIAL_CLAIM: true,
  // ... etc
};

export function isTxTypeSponsored(txType: TransactionType): boolean {
  return SPONSORED_TX_CONFIG[txType] ?? false;
}
```

## Transaction Types by Sponsorship Priority

| Priority | TX Types | Rationale |
|----------|----------|-----------|
| **Done** | `GLOBAL_USER_ACCESS_TOKEN_CLAIM` | Migration — users may not have V2 ADA |
| **High** | Student/Contributor TXs | Onboarding friction — users may not have ADA |
| **Medium** | Credential claims | Reward moment — shouldn't cost user |
| **Low** | Owner/Manager TXs | Power users likely have ADA |
| **Skip** | `GLOBAL_GENERAL_ACCESS_TOKEN_MINT` | First TX — user needs ADA anyway |

### Recommended Next TX Types to Sponsor

```
COURSE_STUDENT_ASSIGNMENT_COMMIT
COURSE_STUDENT_ASSIGNMENT_UPDATE
COURSE_STUDENT_CREDENTIAL_CLAIM
PROJECT_CONTRIBUTOR_TASK_COMMIT
PROJECT_CONTRIBUTOR_TASK_ACTION
PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM
```

## UTXOS Dashboard Setup

Before sponsorship works, the team must:

1. Log in to [utxos.dev/dashboard](https://utxos.dev/dashboard)
2. Create a Sponsorship under the project
3. Fund the sponsorship wallet with ADA (e.g., 50 ADA for ~100 TXs)
4. Copy credentials to env vars:
   - `WEB3_SDK_API_KEY`
   - `WEB3_SDK_PRIVATE_KEY`
   - `UTXOS_SPONSORSHIP_ID`
   - `NEXT_PUBLIC_WEB3_SDK_PROJECT_ID`

## Testing

### Manual Testing Checklist

- [ ] Migration page loads normally
- [ ] V1 token detection works
- [ ] "Sponsored" badge appears
- [ ] Clicking claim calls `/api/sponsor-migrate`
- [ ] User is prompted to sign (partial sign)
- [ ] No fee deducted from user wallet
- [ ] Transaction submits successfully
- [ ] Confirmation tracking works

### Error Scenarios

- [ ] No V1 token → shows appropriate message
- [ ] Sponsorship not configured → returns 503
- [ ] Gateway error → returns gateway error
- [ ] User rejects signing → shows error state
- [ ] Tank depleted → sponsorship fails with clear message

## Common Issues

### Issue: "Transaction sponsorship is not configured"

**Symptom**: API returns 503.

**Cause**: Missing env vars.

**Debug**:
```bash
# Check if vars are set (don't log actual values!)
grep -E "WEB3_SDK|UTXOS_SPONSORSHIP" .env | wc -l
# Should be 4 lines
```

### Issue: TX fails after sponsorship

**Symptom**: `sponsorTx()` succeeds but blockchain submission fails.

**Possible causes**:
1. Tank wallet has insufficient ADA
2. Network mismatch (testnet vs mainnet)
3. Stale UTXO (already spent)

**Debug**: Check UTXOS dashboard for tank balance and recent transactions.

### Issue: Partial sign fails

**Symptom**: `wallet.signTx(cbor, true)` throws error.

**Cause**: Wallet doesn't support partial signing, or CBOR is malformed.

**Fix**: Ensure `signTx(cbor, true)` — the `true` is critical for partial sign.

## Integration with Other Skills

| Skill | Integration |
|-------|-------------|
| `transaction-auditor` | Sponsorship doesn't change TX state machine |
| `tx-loop-guide` | Add "sponsored migration" to test loops |
| `hooks-architect` | `useSponsoredTransaction` follows hook patterns |
| `e2e-testing` | Add sponsored TX test scenarios |

## Progress Tracker

### Phase 1: Migration Sponsorship ✅
- [x] Add environment variables to `env.js`
- [x] Document variables in `.env.example`
- [x] Create `src/lib/utxos-sdk.ts` singleton
- [x] Create `src/hooks/tx/use-sponsored-transaction.ts`
- [x] Create `src/app/api/sponsor-migrate/route.ts`
- [x] Update `src/app/migrate/page.tsx` to use sponsored hook
- [x] Add "Sponsored" badge to migration UI
- [x] Write implementation plan (`.claude/_plan/sponsorship.md`)

**Status**: Complete on `sponsored-migration` branch, pending merge

### Phase 2: Merge & Test
- [ ] Review `sponsored-migration` branch
- [ ] Set up UTXOS dashboard with test sponsorship
- [ ] Fund sponsorship wallet
- [ ] Test migration flow end-to-end
- [ ] Merge to main

### Phase 3: Expand to Student/Contributor TXs
- [ ] Create `src/config/sponsorship.ts` config
- [ ] Create generic `/api/sponsor-tx/route.ts` route
- [ ] Create parameterized `useSponsoredTx` hook
- [ ] Add sponsorship to assignment submission
- [ ] Add sponsorship to credential claims
- [ ] Add sponsorship to task commits

### Phase 4: UX Polish
- [ ] Show "Sponsored" indicator in TransactionButton
- [ ] Add tank balance to admin dashboard
- [ ] Set up low-balance alerts
- [ ] Document sponsorship setup for instance owners

## Quick Reference

```bash
# View Jingles' implementation
git show origin/sponsored-migration --stat

# Read the detailed plan
git show origin/sponsored-migration:.claude/_plan/sponsorship.md

# Check env vars on branch
git show origin/sponsored-migration:src/env.js

# View the sponsored hook
git show origin/sponsored-migration:src/hooks/tx/use-sponsored-transaction.ts

# View the API route
git show origin/sponsored-migration:src/app/api/sponsor-migrate/route.ts

# Check current sponsorship config (after merge)
grep -E "WEB3_SDK|UTXOS_SPONSORSHIP" src/env.js

# Type check
npm run typecheck
```
