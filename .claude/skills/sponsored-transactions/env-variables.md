# Sponsorship Environment Variables

> **Last Updated**: 2026-02-12

This document tracks all environment variables related to transaction sponsorship, their usage, and deployment configuration.

## Quick Reference

| Variable | Side | Injection | GCloud | Usage |
|----------|------|-----------|--------|-------|
| `NEXT_PUBLIC_WEB3_SDK_PROJECT_ID` | Client | Build-time | GitHub var | Social wallet login, SDK init |
| `NEXT_PUBLIC_WEB3_SDK_NETWORK` | Client | Build-time | GitHub var | Network selection (testnet/mainnet) |
| `WEB3_SDK_API_KEY` | Server | Runtime | Secret Manager | UTXOS API authentication |
| `WEB3_SDK_PRIVATE_KEY` | Server | Runtime | Secret Manager | Developer wallet signing |
| `UTXOS_SPONSORSHIP_ID` | Server | Runtime | Secret Manager | Sponsorship tank identifier |

## Variable Details

### `NEXT_PUBLIC_WEB3_SDK_PROJECT_ID`

**Type**: Client-side (baked into JS bundle)

**Used in**:
- `src/config/wallet.ts:27` — `WEB3_SERVICES_CONFIG.projectId`
- `src/lib/utxos-sdk.ts:17` — `Web3Sdk({ projectId })`

**Purpose**: Identifies the UTXOS project for both social wallet login and server-side sponsorship SDK.

**Current value**: `4a606bec-f3b4-49bd-a9e6-ad16f7b81d74`

**Deployment**:
```yaml
# .github/workflows/deploy-*.yml (build-args)
NEXT_PUBLIC_WEB3_SDK_PROJECT_ID=${{ vars.DEV_WEB3_SDK_PROJECT_ID }}
```

```dockerfile
# Dockerfile (ARG + ENV)
ARG NEXT_PUBLIC_WEB3_SDK_PROJECT_ID
ENV NEXT_PUBLIC_WEB3_SDK_PROJECT_ID=${NEXT_PUBLIC_WEB3_SDK_PROJECT_ID}
```

---

### `NEXT_PUBLIC_WEB3_SDK_NETWORK`

**Type**: Client-side (baked into JS bundle)

**Used in**:
- `src/config/wallet.ts:28` — `WEB3_SERVICES_CONFIG.networkId` (0=testnet, 1=mainnet)
- `src/lib/utxos-sdk.ts:21` — `Web3Sdk({ network })`

**Purpose**: Determines which Cardano network to use for social wallets and sponsorship.

**Current value**: `testnet`

**Valid values**: `testnet` | `mainnet`

**Deployment**:
```yaml
# .github/workflows/deploy-*.yml (build-args)
NEXT_PUBLIC_WEB3_SDK_NETWORK=${{ vars.DEV_WEB3_SDK_NETWORK }}
```

---

### `WEB3_SDK_API_KEY`

**Type**: Server-side only (runtime secret)

**Used in**:
- `src/lib/utxos-sdk.ts:15` — `Web3Sdk({ apiKey })`

**Purpose**: Authenticates server-side requests to the UTXOS API for sponsorship operations.

**Current value**: _(stored in GCloud Secret Manager)_

**⚠️ Security**: This is a secret. Never commit to repo or expose to client.

**Deployment**:
- Store in Google Cloud Secret Manager as `WEB3_SDK_API_KEY`
- Configure Cloud Run to mount secret as environment variable
- Not in workflow files, not in Dockerfile

---

### `WEB3_SDK_PRIVATE_KEY`

**Type**: Server-side only (runtime secret)

**Used in**:
- `src/lib/utxos-sdk.ts:16` — `Web3Sdk({ privateKey })`

**Purpose**: Developer wallet private key for signing sponsored transactions. The sponsorship tank withdraws fees from this wallet.

**Current value**: _(stored in GCloud Secret Manager)_

**⚠️ Security**: This is a CRITICAL secret. Never commit to repo, never expose to client, never log.

**Deployment**:
- Store in Google Cloud Secret Manager as `WEB3_SDK_PRIVATE_KEY`
- Configure Cloud Run to mount secret as environment variable
- Not in workflow files, not in Dockerfile

---

### `UTXOS_SPONSORSHIP_ID`

**Type**: Server-side only (runtime)

**Used in**:
- `src/app/api/sponsor-migrate/route.ts:23` — `sdk.sponsorship.sponsorTx({ sponsorshipId })`

**Purpose**: Identifies the specific sponsorship tank to use for fee payment. Created in UTXOS Dashboard.

**Current value**: `8dd7a8b6-912c-4359-a8f0-2f99affb2b92`

**Deployment**:
- Can be stored in Secret Manager (recommended for consistency)
- Or as a Cloud Run env var (not strictly secret, but varies per environment)

---

## Deployment Patterns

### Pattern 1: Build-time (NEXT_PUBLIC_*)

Client-side variables are embedded during Docker build:

```
GitHub Vars → Workflow → Docker build-arg → Next.js bundle
```

**Steps**:
1. Add variable to GitHub repository settings → Variables
2. Add to workflow `build-args` section
3. Add `ARG` and `ENV` to Dockerfile
4. Add to `src/env.js` client schema

### Pattern 2: Runtime (Server-side secrets)

Server-side secrets are injected when Cloud Run starts:

```
Secret Manager → Cloud Run env → Next.js server
```

**Steps**:
1. Create secret in Google Cloud Secret Manager
2. Grant Cloud Run service account access to secret
3. Configure Cloud Run service to mount secret as env var
4. Add to `src/env.js` server schema

---

## Required Workflow Updates

To deploy sponsorship, add these to `.github/workflows/deploy-*.yml`:

```yaml
# In build-args section
build-args: |
  NEXT_PUBLIC_ANDAMIO_GATEWAY_URL=${{ vars.DEV_ANDAMIO_GATEWAY_URL }}
  NEXT_PUBLIC_CARDANO_NETWORK=${{ vars.DEV_CARDANO_NETWORK }}
  NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID=${{ vars.DEV_ACCESS_TOKEN_POLICY_ID }}
  NEXT_PUBLIC_WEB3_SDK_PROJECT_ID=${{ vars.DEV_WEB3_SDK_PROJECT_ID }}
  NEXT_PUBLIC_WEB3_SDK_NETWORK=${{ vars.DEV_WEB3_SDK_NETWORK }}
  NEXT_PUBLIC_BLOCKFROST_PROJECT_ID=${{ vars.DEV_BLOCKFROST_PROJECT_ID }}
```

---

## Required Dockerfile Updates

Add to Dockerfile builder stage:

```dockerfile
# Build-time environment variables (NEXT_PUBLIC_* are embedded at build time)
ARG NEXT_PUBLIC_ANDAMIO_GATEWAY_URL
ARG NEXT_PUBLIC_CARDANO_NETWORK
ARG NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID
ARG NEXT_PUBLIC_WEB3_SDK_PROJECT_ID
ARG NEXT_PUBLIC_WEB3_SDK_NETWORK
ARG NEXT_PUBLIC_BLOCKFROST_PROJECT_ID

# Set environment for build
ENV NEXT_PUBLIC_ANDAMIO_GATEWAY_URL=${NEXT_PUBLIC_ANDAMIO_GATEWAY_URL}
ENV NEXT_PUBLIC_CARDANO_NETWORK=${NEXT_PUBLIC_CARDANO_NETWORK}
ENV NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID=${NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID}
ENV NEXT_PUBLIC_WEB3_SDK_PROJECT_ID=${NEXT_PUBLIC_WEB3_SDK_PROJECT_ID}
ENV NEXT_PUBLIC_WEB3_SDK_NETWORK=${NEXT_PUBLIC_WEB3_SDK_NETWORK}
ENV NEXT_PUBLIC_BLOCKFROST_PROJECT_ID=${NEXT_PUBLIC_BLOCKFROST_PROJECT_ID}
```

---

## Required GCloud Secrets

Create these secrets in Google Cloud Secret Manager:

| Secret Name | Environment | Description |
|-------------|-------------|-------------|
| `WEB3_SDK_API_KEY` | dev/staging/prod | UTXOS API key |
| `WEB3_SDK_PRIVATE_KEY` | dev/staging/prod | Developer wallet private key |
| `UTXOS_SPONSORSHIP_ID` | dev/staging/prod | Sponsorship tank ID |

**Note**: Each environment (dev, staging, prod) should have its own set of secrets with different sponsorship tanks.

---

## GitHub Repository Variables

Add these variables to GitHub repository settings:

| Variable | Dev | Staging | Prod |
|----------|-----|---------|------|
| `DEV_WEB3_SDK_PROJECT_ID` | `4a606bec-...` | — | — |
| `DEV_WEB3_SDK_NETWORK` | `testnet` | — | — |
| `DEV_BLOCKFROST_PROJECT_ID` | `preprod...` | — | — |
| `STAGING_WEB3_SDK_PROJECT_ID` | — | `...` | — |
| `STAGING_WEB3_SDK_NETWORK` | — | `testnet` | — |
| `PROD_WEB3_SDK_PROJECT_ID` | — | — | `...` |
| `PROD_WEB3_SDK_NETWORK` | — | — | `mainnet` |

---

## Graceful Degradation

If sponsorship variables are not configured:

| Missing Variable | Effect |
|------------------|--------|
| `NEXT_PUBLIC_WEB3_SDK_PROJECT_ID` | Social login hidden, sponsorship disabled |
| `NEXT_PUBLIC_WEB3_SDK_NETWORK` | Defaults to `testnet` |
| `WEB3_SDK_API_KEY` | `getWeb3Sdk()` returns `null`, sponsorship disabled |
| `WEB3_SDK_PRIVATE_KEY` | `getWeb3Sdk()` returns `null`, sponsorship disabled |
| `UTXOS_SPONSORSHIP_ID` | `/api/sponsor-migrate` returns 503 |

The app continues to work without sponsorship — users just pay their own fees.

---

## Verification Commands

```bash
# Check env schema includes all vars
grep -E "WEB3_SDK|UTXOS_SPONSORSHIP|BLOCKFROST" src/env.js

# Check local .env has values (without printing them)
grep -E "WEB3_SDK|UTXOS_SPONSORSHIP" .env | wc -l
# Expected: 5 lines

# Verify Dockerfile has ARGs
grep -E "ARG NEXT_PUBLIC_WEB3" Dockerfile

# Verify workflow has build-args
grep -E "WEB3_SDK_PROJECT_ID|WEB3_SDK_NETWORK" .github/workflows/deploy-dev.yml
```

---

## Migration Deployment Constraint

> **Important**: The V1→V2 migration (`GLOBAL_USER_ACCESS_TOKEN_CLAIM`) only works on **staging** and **prod**:
>
> | Environment | URL | Network | V1 Tokens | Can Test Migration? |
> |-------------|-----|---------|-----------|---------------------|
> | Dev | `dev.app.andamio.io` | Preprod | ❌ None | No |
> | Staging | `preprod.app.andamio.io` | Preprod | ✅ Pre-minted | Yes |
> | Prod | `mainnet.app.andamio.io` | Mainnet | ✅ Pre-minted | Yes |
>
> V1 access tokens were pre-minted on preprod and mainnet only. Dev environment cannot test migration flows.
>
> **Test wallets**: James has V1 preprod access tokens available for staging tests.

---

## Checklist: Deploy Sponsorship to Staging

Deploy to staging first (preprod) since it has V1 tokens for testing migration.

- [ ] Create UTXOS sponsorship in dashboard (preprod network)
- [ ] Fund sponsorship wallet with test ADA
- [ ] Add GitHub vars: `STAGING_WEB3_SDK_PROJECT_ID`, `STAGING_WEB3_SDK_NETWORK`, `STAGING_BLOCKFROST_PROJECT_ID`
- [ ] Create GCloud secrets: `WEB3_SDK_API_KEY`, `WEB3_SDK_PRIVATE_KEY`, `UTXOS_SPONSORSHIP_ID`
- [ ] Grant Cloud Run SA access to secrets
- [ ] Update Cloud Run service to mount secrets
- [ ] Update `deploy-staging.yml` with build-args
- [ ] Update `Dockerfile` with ARGs
- [ ] Merge `sponsored-migration` branch
- [ ] Deploy to staging
- [ ] Test with James's V1 preprod tokens

## Checklist: Deploy Sponsorship to Prod

After staging validation, deploy to mainnet.

- [ ] Create UTXOS sponsorship in dashboard (mainnet network)
- [ ] Fund sponsorship wallet with real ADA
- [ ] Add GitHub vars: `PROD_WEB3_SDK_PROJECT_ID`, `PROD_WEB3_SDK_NETWORK`, `PROD_BLOCKFROST_PROJECT_ID`
- [ ] Create GCloud secrets (prod): `WEB3_SDK_API_KEY`, `WEB3_SDK_PRIVATE_KEY`, `UTXOS_SPONSORSHIP_ID`
- [ ] Grant Cloud Run SA access to secrets
- [ ] Update Cloud Run service to mount secrets
- [ ] Update `deploy-prod.yml` with build-args
- [ ] Deploy to prod
- [ ] Monitor tank balance
