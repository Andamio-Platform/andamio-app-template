# Transaction Sponsorship for Access Token Migration

## Overview

Add gasless transaction sponsorship to the V1→V2 access token migration flow using `@utxos/sdk`. Users migrating their access token will not need ADA for transaction fees — the developer wallet pays the fee.

**Scope:** Only the `GLOBAL_USER_ACCESS_TOKEN_CLAIM` transaction type. All other transactions remain unchanged.

---

## How @utxos/sdk Sponsorship Works

The sponsorship flow has 4 phases:

1. **Static Placeholders** — `sdk.sponsorship.getStaticInfo()` returns a fake UTXO and change address used as placeholders during transaction construction
2. **Transaction Building** — The gateway builds the unsigned CBOR using these placeholders instead of real user UTXOs for fees
3. **Sponsor Rewrite** — `sdk.sponsorship.sponsorTx({ sponsorshipId, tx })` sends the CBOR to the UTXOS API, which rewrites it: removes the placeholder UTXO, inserts a real UTXO from the developer's funded wallet, recalculates fees, and partially signs with the developer key
4. **User Signs + Submit** — User signs with `signTx(tx, true)` (partial sign), then submits

**Key constraint:** `sponsorTx()` MUST run server-side because it requires `WEB3_SDK_API_KEY` and `WEB3_SDK_PRIVATE_KEY`.

---

## Current Transaction Flow (Migration)

```
Client                          Gateway API                    Blockchain
  |                                |                              |
  |-- POST /tx/.../claim -------->|                              |
  |     { alias }                  |-- builds unsigned CBOR ----->|
  |<-- { unsigned_tx } -----------|                              |
  |                                |                              |
  |-- wallet.signTx(cbor, true) --|                              |
  |-- wallet.submitTx(signed) ----|------------------------------>|
  |                                |                              |
  |-- POST /tx/register --------->|-- monitors tx hash --------->|
```

**Problem:** The gateway builds the CBOR expecting the user's wallet to provide UTXOs for fees. Users without ADA can't complete the migration.

---

## Proposed Flow (Sponsored)

```
Client                     Next.js API Route              UTXOS API / Gateway        Blockchain
  |                              |                              |                       |
  |-- POST /api/sponsor-        |                              |                       |
  |   migrate { alias,          |                              |                       |
  |     changeAddr, utxos }     |                              |                       |
  |                              |-- POST /tx/.../claim ------->|                       |
  |                              |     { alias, sponsor_info }  |                       |
  |                              |<-- { unsigned_tx } ----------|                       |
  |                              |                              |                       |
  |                              |-- sdk.sponsorship            |                       |
  |                              |     .sponsorTx(cbor) ------->|                       |
  |                              |<-- { sponsored_tx } ---------|                       |
  |                              |     (dev-wallet-signed)      |                       |
  |<-- { sponsored_tx } --------|                              |                       |
  |                              |                              |                       |
  |-- wallet.signTx(tx, true) --|                              |                       |
  |-- wallet.submitTx(signed) --|----------------------------------------------------->|
  |                              |                              |                       |
  |-- POST /tx/register ------->|------------------------------>|                       |
```

**The key change:** A new Next.js API route sits between the client and the gateway, intercepting the unsigned CBOR and running it through `sponsorTx()` before returning the sponsored (dev-wallet-signed) CBOR to the client.

---

## Architecture Decision: Next.js API Route vs tRPC

**Decision: Next.js API Route** (`src/app/api/sponsor-migrate/route.ts`)

Reasons:
- tRPC in this app is minimal (only an example router) — adding a full tRPC mutation for one endpoint is over-engineering
- The route handler is simple: call gateway → sponsor → return
- Aligns with the existing pattern of API routes in `src/app/api/gateway/` and `src/app/api/gateway-stream/`
- No client-side state management needed (the existing `useTransaction` hook handles that)

---

## Implementation Plan

### Step 1: Add `UTXOS_SPONSORSHIP_ID` env var

**File:** `src/env.js`

Add to the `server` schema:
```typescript
UTXOS_SPONSORSHIP_ID: z.string().optional(),
```

Add to `runtimeEnv`:
```typescript
UTXOS_SPONSORSHIP_ID: process.env.UTXOS_SPONSORSHIP_ID,
```

This is the sponsorship ID from the UTXOS Dashboard. Optional so the app still works without sponsorship configured (graceful degradation).

---

### Step 2: Create server-side Web3Sdk factory

**File:** `src/lib/utxos-sdk.ts` (new)

```typescript
import { Web3Sdk } from "@utxos/sdk";
import { BlockfrostProvider } from "@meshsdk/core";
import { env } from "~/env";

/**
 * Server-side Web3Sdk instance for transaction sponsorship.
 * Returns null if required env vars are not configured.
 */
let _sdk: Web3Sdk | null = null;

export function getWeb3Sdk(): Web3Sdk | null {
  if (_sdk) return _sdk;

  const apiKey = env.WEB3_SDK_API_KEY;
  const privateKey = env.WEB3_SDK_PRIVATE_KEY;
  const projectId = process.env.NEXT_PUBLIC_WEB3_SDK_PROJECT_ID;

  if (!apiKey || !privateKey || !projectId) return null;

  const network = (process.env.NEXT_PUBLIC_WEB3_SDK_NETWORK ?? "testnet") as
    | "mainnet"
    | "testnet";

  const blockfrostKey = process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID;
  const fetcher = blockfrostKey ? new BlockfrostProvider(blockfrostKey) : undefined;
  const submitter = fetcher;

  _sdk = new Web3Sdk({
    projectId,
    apiKey,
    network,
    privateKey,
    fetcher,
    submitter,
  });

  return _sdk;
}

/**
 * Check if sponsorship is available (all required env vars configured).
 */
export function isSponsorshipAvailable(): boolean {
  return (
    !!env.WEB3_SDK_API_KEY &&
    !!env.WEB3_SDK_PRIVATE_KEY &&
    !!process.env.NEXT_PUBLIC_WEB3_SDK_PROJECT_ID &&
    !!process.env.UTXOS_SPONSORSHIP_ID
  );
}
```

Singleton pattern avoids creating a new SDK instance per request.

---

### Step 3: Create the sponsor-migrate API route

**File:** `src/app/api/sponsor-migrate/route.ts` (new)

```typescript
import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "~/env";
import { getWeb3Sdk } from "~/lib/utxos-sdk";

const requestSchema = z.object({
  alias: z.string().min(1).max(31),
});

export async function POST(request: Request) {
  try {
    // 1. Validate request
    const body = await request.json();
    const { alias } = requestSchema.parse(body);

    // 2. Check sponsorship availability
    const sdk = getWeb3Sdk();
    const sponsorshipId = env.UTXOS_SPONSORSHIP_ID;

    if (!sdk || !sponsorshipId) {
      return NextResponse.json(
        { error: "Transaction sponsorship is not configured" },
        { status: 503 }
      );
    }

    // 3. Build unsigned CBOR from gateway
    const gatewayUrl = env.NEXT_PUBLIC_ANDAMIO_GATEWAY_URL;
    const buildResponse = await fetch(
      `${gatewayUrl}/api/v2/tx/global/user/access-token/claim`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": env.ANDAMIO_API_KEY,
        },
        body: JSON.stringify({ alias }),
      }
    );

    if (!buildResponse.ok) {
      const errorText = await buildResponse.text();
      return NextResponse.json(
        { error: `Gateway error: ${buildResponse.status} - ${errorText}` },
        { status: buildResponse.status }
      );
    }

    const buildResult = await buildResponse.json();
    const unsignedTx = buildResult.unsigned_tx ?? buildResult.unsignedTxCBOR;

    if (!unsignedTx) {
      return NextResponse.json(
        { error: "No unsigned transaction returned from gateway" },
        { status: 500 }
      );
    }

    // 4. Sponsor the transaction
    const sponsorResult = await sdk.sponsorship.sponsorTx({
      sponsorshipId,
      tx: unsignedTx,
    });

    if (!sponsorResult.success) {
      console.error("[sponsor-migrate] Sponsorship failed:", sponsorResult.error);
      return NextResponse.json(
        { error: `Sponsorship failed: ${sponsorResult.error}` },
        { status: 502 }
      );
    }

    // 5. Return sponsored (dev-signed) CBOR
    return NextResponse.json({
      unsigned_tx: sponsorResult.data,
      sponsored: true,
      // Pass through any additional fields from gateway
      ...Object.fromEntries(
        Object.entries(buildResult).filter(
          ([k]) => k !== "unsigned_tx" && k !== "unsignedTxCBOR"
        )
      ),
    });
  } catch (error) {
    console.error("[sponsor-migrate] Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.flatten() },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

This route:
1. Validates the alias
2. Calls the gateway to build the unsigned CBOR
3. Runs `sponsorTx()` to rewrite the CBOR with the developer's fee UTXO and partial-sign
4. Returns the sponsored CBOR (user still needs to sign)

---

### Step 4: Create `useSponsoredTransaction` hook

**File:** `src/hooks/tx/use-sponsored-transaction.ts` (new)

This is a thin wrapper around the existing `useTransaction` pattern, but routes through the sponsorship endpoint instead of the gateway directly.

```typescript
import { useState, useCallback } from "react";
import { useWallet } from "@meshsdk/react";
import { toast } from "sonner";
import { env } from "~/env";
import { txLogger } from "~/lib/tx-logger";
import { getTransactionExplorerUrl } from "~/lib/constants";
import { getTransactionUI } from "~/config/transaction-ui";
import { registerTransaction, getGatewayTxType } from "~/hooks/tx/use-tx-watcher";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { txWatcherStore } from "~/stores/tx-watcher-store";
import type {
  SimpleTransactionState,
  SimpleTransactionResult,
} from "~/hooks/tx/use-transaction";

interface SponsoredMigrateConfig {
  alias: string;
  onSuccess?: (result: SimpleTransactionResult) => void | Promise<void>;
  onError?: (error: Error) => void;
}

export function useSponsoredTransaction() {
  const { wallet, connected } = useWallet();
  const { jwt } = useAndamioAuth();
  const [state, setState] = useState<SimpleTransactionState>("idle");
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<SimpleTransactionResult | null>(null);

  const execute = useCallback(
    async (config: SponsoredMigrateConfig) => {
      const { alias, onSuccess, onError } = config;
      const txType = "GLOBAL_USER_ACCESS_TOKEN_CLAIM" as const;
      const ui = getTransactionUI(txType);

      setError(null);
      setResult(null);

      try {
        if (!connected || !wallet) {
          throw new Error("Wallet not connected");
        }

        // Step 1: Request sponsored CBOR from our API route
        setState("fetching");
        txLogger.buildRequest(txType, "/api/sponsor-migrate", "POST", { alias });

        const response = await fetch("/api/sponsor-migrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ alias }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.error ?? `Sponsorship error: ${response.status}`;
          throw new Error(errorMsg);
        }

        const data = await response.json();
        const sponsoredCbor = data.unsigned_tx;

        if (!sponsoredCbor) {
          throw new Error("No sponsored transaction returned");
        }

        txLogger.buildResult(txType, true, data);

        // Step 2: User signs the sponsored CBOR (partial sign)
        setState("signing");
        const signedTx = await wallet.signTx(sponsoredCbor, true);

        // Step 3: Submit to blockchain
        setState("submitting");
        const txHash = await wallet.submitTx(signedTx);

        const explorerUrl = getTransactionExplorerUrl(
          txHash,
          env.NEXT_PUBLIC_CARDANO_NETWORK
        );
        txLogger.txSubmitted(txType, txHash, explorerUrl);

        // Step 4: Register with gateway
        if (ui.requiresOnChainConfirmation) {
          try {
            const gatewayTxType = getGatewayTxType(txType);
            await registerTransaction(txHash, gatewayTxType, jwt);
          } catch (regError) {
            console.warn("[sponsored-migrate] Failed to register TX:", regError);
          }

          txWatcherStore.getState().register(txHash, txType, {
            successTitle: ui.successInfo,
            successDescription: "Transaction confirmed and database updated.",
            errorTitle: "Transaction Failed",
          });
        }

        // Step 5: Success
        setState("success");

        const txResult: SimpleTransactionResult = {
          txHash,
          success: true,
          blockchainExplorerUrl: explorerUrl,
          apiResponse: data,
          requiresDBUpdate: ui.requiresDBUpdate,
          requiresOnChainConfirmation: !!ui.requiresOnChainConfirmation,
        };
        setResult(txResult);

        toast.success(ui.successInfo, {
          description: "Sponsored transaction submitted to blockchain!",
          action: explorerUrl
            ? { label: "View", onClick: () => window.open(explorerUrl, "_blank") }
            : undefined,
        });

        await onSuccess?.(txResult);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error("[sponsored-migrate] Transaction failed:", error);
        txLogger.txError(txType, error);

        setError(error);
        setState("error");

        toast.error("Transaction Failed", { description: error.message });
        onError?.(error);
      }
    },
    [connected, wallet, jwt]
  );

  const reset = useCallback(() => {
    setState("idle");
    setError(null);
    setResult(null);
  }, []);

  return {
    state,
    error,
    result,
    execute,
    reset,
    isIdle: state === "idle",
    isFetching: state === "fetching",
    isSigning: state === "signing",
    isSubmitting: state === "submitting",
    isSuccess: state === "success",
    isError: state === "error",
    isLoading: ["fetching", "signing", "submitting"].includes(state),
  };
}
```

This follows the exact same interface as `useTransaction` so existing UI components (`TransactionButton`, `TransactionStatus`) work without modification.

---

### Step 5: Update the migrate page to use sponsored transaction

**File:** `src/app/migrate/page.tsx`

**Changes:**
1. Import `useSponsoredTransaction` instead of `useTransaction`
2. Change `handleClaim` to call the sponsored hook

```diff
- import { useTransaction } from "~/hooks/tx/use-transaction";
+ import { useSponsoredTransaction } from "~/hooks/tx/use-sponsored-transaction";

// In the component:
- const { execute, state: txState, result, error, reset } = useTransaction();
+ const { execute, state: txState, result, error, reset } = useSponsoredTransaction();

// Update handleClaim:
  const handleClaim = async () => {
    if (!detectedAlias) return;
-   await execute({
-     txType: "GLOBAL_USER_ACCESS_TOKEN_CLAIM",
-     params: { alias: detectedAlias },
-   });
+   await execute({ alias: detectedAlias });
  };
```

That's it for the page — the hook has the same state/result interface, so `TransactionButton` and `TransactionStatus` work unchanged.

---

### Step 6: Add a "Sponsored" badge to the migration UI (optional UX enhancement)

Add a small visual indicator that this transaction is fee-free:

```tsx
{migrateState === "ready" && (
  <AndamioCard>
    <AndamioCardHeader>
      <AndamioCardTitle>V1 Token Detected</AndamioCardTitle>
      <AndamioCardDescription>
        Your V1 access token was found. Claim your V2 token to continue using the platform.
      </AndamioCardDescription>
    </AndamioCardHeader>
    <AndamioCardContent className="space-y-4">
      {/* Alias display */}
      ...

      {/* Sponsored badge */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-center">
        <AndamioText variant="small" className="text-primary">
          ✦ This transaction is sponsored — no ADA fee required
        </AndamioText>
      </div>

      <TransactionButton ... />
      <TransactionStatus ... />
    </AndamioCardContent>
  </AndamioCard>
)}
```

---

## Graceful Degradation

If sponsorship env vars are not configured (`UTXOS_SPONSORSHIP_ID`, `WEB3_SDK_API_KEY`, `WEB3_SDK_PRIVATE_KEY`):

- The `/api/sponsor-migrate` route returns 503
- The `useSponsoredTransaction` hook throws an error
- **Fallback option:** The migrate page could detect sponsorship unavailability and fall back to `useTransaction` (the normal unsponsored flow). This could be implemented by:
  1. Adding a client-side env check: `NEXT_PUBLIC_SPONSORSHIP_ENABLED=true`
  2. Conditionally using `useSponsoredTransaction` or `useTransaction`

For the initial implementation, we'll keep it simple: if sponsorship is configured, it's used. If not, the error message tells the user to contact support.

---

## Environment Variables Summary

| Variable | Side | Required | Purpose |
|----------|------|----------|---------|
| `WEB3_SDK_API_KEY` | Server | Yes (for sponsorship) | UTXOS API authentication |
| `WEB3_SDK_PRIVATE_KEY` | Server | Yes (for sponsorship) | Developer wallet signing key |
| `NEXT_PUBLIC_WEB3_SDK_PROJECT_ID` | Client+Server | Yes (for sponsorship) | UTXOS project identifier |
| `UTXOS_SPONSORSHIP_ID` | Server | Yes (for sponsorship) | From UTXOS Dashboard |
| `NEXT_PUBLIC_BLOCKFROST_PROJECT_ID` | Client+Server | Yes (for sponsorship) | Blockfrost provider for UTXO fetching |

All already exist in `env.js` except `UTXOS_SPONSORSHIP_ID`.

---

## Files Changed / Created

| File | Action | Purpose |
|------|--------|---------|
| `src/env.js` | Modified | Add `UTXOS_SPONSORSHIP_ID` env var |
| `src/lib/utxos-sdk.ts` | **New** | Server-side Web3Sdk singleton factory |
| `src/app/api/sponsor-migrate/route.ts` | **New** | Sponsorship API route |
| `src/hooks/tx/use-sponsored-transaction.ts` | **New** | Client-side sponsored transaction hook |
| `src/app/migrate/page.tsx` | Modified | Use sponsored hook + badge |

---

## Testing Checklist

- [ ] Migration page loads normally
- [ ] V1 token detection still works
- [ ] Clicking "Claim V2 Access Token" calls `/api/sponsor-migrate` instead of gateway directly
- [ ] The sponsored CBOR is returned and user is prompted to sign
- [ ] User signs with partial sign (no fee deducted from user wallet)
- [ ] Transaction submits successfully
- [ ] Transaction registers with gateway and confirmation tracking works
- [ ] Success state displays correctly
- [ ] Error states work: no V1 token, sponsorship not configured, gateway error, signing rejected

---

## UTXOS Dashboard Setup (Pre-requisite)

Before implementation, the team needs to:

1. Log in to [utxos.dev/dashboard](https://utxos.dev/dashboard)
2. Create a new Sponsorship under the project
3. Fund the sponsorship wallet with enough ADA (e.g., 50 ADA for ~10 sponsored transactions at 5 ADA each)
4. Copy the Sponsorship ID to `UTXOS_SPONSORSHIP_ID` env var
5. Ensure `WEB3_SDK_API_KEY` and `WEB3_SDK_PRIVATE_KEY` are set

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Sponsorship wallet runs out of ADA | Users can't migrate | Monitor wallet balance; set up UTXO pool replenishment |
| UTXOS API downtime | Sponsored migration fails | Error handling returns clear message; could add fallback to normal tx |
| Race condition (multiple users claim same UTXO) | One tx fails | SDK handles random UTXO selection; retry on failure |
| Private key exposure | Security breach | Key only accessed server-side via env var; never sent to client |
