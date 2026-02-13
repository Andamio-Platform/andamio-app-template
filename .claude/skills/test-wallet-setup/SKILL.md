---
name: test-wallet-setup
description: Set up isolated test wallets for E2E testing with real Cardano transactions.
---

# Test Wallet Setup

Guide developers through setting up isolated test wallets for E2E testing with real Cardano transactions.

## When to Use

- Developer wants to run E2E tests with real wallets
- Developer needs to set up Blockfrost API
- Developer needs to generate or fund test wallets
- Developer needs to mint Access Tokens for test wallets
- Developer asks about wallet testing infrastructure

## Quick Reference

### Prerequisites
- Node.js 18+
- Blockfrost API key (free at https://blockfrost.io/)

### Commands
```bash
# Generate new wallets
npx ts-node e2e/scripts/generate-test-wallets.ts --save

# Check wallet balances
source .env.test.local
BLOCKFROST_PREPROD_API_KEY="your-key" npx playwright test tests/real-wallet-tx.spec.ts --grep "check all configured"

# Fund wallets (after funding student from faucet)
BLOCKFROST_PREPROD_API_KEY="your-key" npx ts-node e2e/scripts/fund-test-wallets.ts --amount 250

# Mint Access Tokens (required for transaction loops)
source .env.test.local
BLOCKFROST_PREPROD_API_KEY="your-key" npx ts-node e2e/scripts/mint-access-tokens.ts

# Run real wallet E2E tests
source .env.test.local
BLOCKFROST_PREPROD_API_KEY="your-key" npx playwright test e2e/tests/real-wallet-loop2.spec.ts
```

## Setup Flow

Guide developers through this flow:

### Step 1: Blockfrost API Key

1. Go to https://blockfrost.io/
2. Create free account
3. Create project → Select "Cardano preprod"
4. Copy Project ID (starts with `preprod...`)

Add to `.env`:
```bash
BLOCKFROST_PREPROD_API_KEY="preprodXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

### Step 2: Generate Wallets

```bash
npx ts-node e2e/scripts/generate-test-wallets.ts --save
```

This creates `.env.test.local` with 5 wallets:
- **student** - For student role tests
- **teacher** - For teacher role tests
- **owner** - For course/project owner tests
- **contributor** - For project contributor tests
- **manager** - For project manager tests

### Step 3: Fund Wallets

**Option A: Fund one wallet, distribute to others (Recommended)**

1. Copy the **student** wallet address from output
2. Go to https://docs.cardano.org/cardano-testnets/tools/faucet/
3. Select "Preprod Testnet"
4. Paste address and request 1000+ ADA
5. Wait 1-2 minutes for confirmation
6. Run distribution:
   ```bash
   source .env.test.local
   BLOCKFROST_PREPROD_API_KEY="your-key" npx ts-node e2e/scripts/fund-test-wallets.ts --amount 250
   ```

**Option B: Fund each wallet individually**

Request from faucet for each address (50+ ADA each).

### Step 4: Mint Access Tokens

**IMPORTANT:** Access Tokens are required before running transaction loop tests (Loop 2, etc.).

```bash
source .env.test.local
BLOCKFROST_PREPROD_API_KEY="your-key" npx ts-node e2e/scripts/mint-access-tokens.ts
```

This mints Access Tokens for student and teacher wallets:
- Student alias: `e2e_student_01`
- Teacher alias: `e2e_teacher_01`

**Options:**
```bash
# Mint for specific role only
npx ts-node e2e/scripts/mint-access-tokens.ts --role student
npx ts-node e2e/scripts/mint-access-tokens.ts --role teacher

# Dry run (see what would happen without minting)
npx ts-node e2e/scripts/mint-access-tokens.ts --dry-run
```

**Cost:** ~8 ADA per Access Token mint

**Wait:** 1-2 minutes for transaction to confirm on preprod before running tests.

### Step 5: Verify Setup

```bash
source .env.test.local
BLOCKFROST_PREPROD_API_KEY="your-key" npx playwright test tests/real-wallet-tx.spec.ts --grep "Role-Based"
```

### Step 6: Setup E2E Test Course (Required for Loop 2)

**IMPORTANT:** This step creates a test course where your e2e wallets have proper permissions.

```bash
cd e2e
set -a && source ../.env && source ../.env.test.local && set +a
npx ts-node scripts/setup-e2e-course.ts
```

This script:
1. Creates a new course owned by `e2e_student_01`
2. Adds `e2e_teacher_01` as a teacher
3. Creates a test module for assignment submissions

**Output:** The script outputs a course ID. Update `e2e/tests/real-wallet-loop2-transactions.spec.ts` with this ID.

**Cost:** ~50-100 ADA total for all transactions

**Why is this needed?** Loop 2 tests require:
- A course where the student can commit to assignments
- A teacher authorized to assess submissions
- Without this step, teacher assessment will fail with `TEACHER_NOT_ALLOWED`

### Step 7: Run Authentication Tests

Verify wallets can authenticate with Gateway using User Auth (nonce signing):

```bash
cd e2e
set -a && source ../.env && source ../.env.test.local && set +a
npx playwright test tests/real-wallet-auth.spec.ts --project=real-wallet
```

This tests:
- User Auth flow (session → sign nonce → validate → JWT)
- Authenticated page access
- Multi-role isolation

### Step 8: Run Loop 2 Transaction Tests

```bash
cd e2e
set -a && source ../.env && source ../.env.test.local && set +a
npx playwright test tests/real-wallet-loop2-transactions.spec.ts --project=real-wallet
```

This executes the full Loop 2 "Earn a Credential" flow:
1. Student commits to assignment
2. Teacher accepts assignment
3. Student claims credential

## Authentication Flow

Real wallet tests use **User Auth** (nonce signing) for authentication:

```
1. POST /api/v2/auth/login/session → get {id, nonce}
2. Sign nonce with wallet (hex-encoded): wallet.signData(Buffer.from(nonce).toString('hex'))
3. POST /api/v2/auth/login/validate → get JWT
```

The `authenticateWalletWithGateway()` function in `e2e/mocks/real-wallet.ts` handles this flow.

### Usage Example

```typescript
import { authenticateWalletWithGateway, getRoleWalletConfig } from "../mocks/real-wallet";

const config = getRoleWalletConfig("student");
const auth = await authenticateWalletWithGateway(config, GATEWAY_URL, API_KEY);
// auth.jwt, auth.userId, auth.address, auth.alias
```

### Injecting Auth into Browser

```typescript
await page.addInitScript(({ jwt, user }) => {
  localStorage.setItem("andamio_jwt", jwt);
  localStorage.setItem("andamio-user", JSON.stringify({
    id: user.userId,
    cardanoBech32Addr: user.address,
    accessTokenAlias: user.alias,
  }));
}, { jwt: auth.jwt, user: auth });
```

## Troubleshooting

### "No Blockfrost API key"
Set `BLOCKFROST_PREPROD_API_KEY` environment variable.

### "No mnemonic found for role"
Run `source .env.test.local` or generate wallets with `--save` flag.

### "Insufficient funds"
Fund student wallet from faucet first, then run fund script.

### Balance shows 0 after funding
Wait 1-2 minutes for transaction to confirm on preprod.

### Address not found (404)
Address has no transactions yet. Fund it from faucet.

### "Access Token required" / Loop 2 tests fail
Mint Access Tokens first:
```bash
source .env.test.local
BLOCKFROST_PREPROD_API_KEY="your-key" npx ts-node e2e/scripts/mint-access-tokens.ts
```

### Access Token mint fails
- Check wallet has at least 10 ADA
- Alias may already be taken - edit `ROLE_CONFIGS` in script to use different alias
- Wait and retry - Blockfrost may be slow

### "TEACHER_NOT_ALLOWED" error in Loop 2
This means the teacher wallet isn't authorized for the course. Run the course setup:
```bash
cd e2e
set -a && source ../.env && source ../.env.test.local && set +a
npx ts-node scripts/setup-e2e-course.ts
```
Then update the test file with the new course ID.

## File Reference

| File | Purpose |
|------|---------|
| `e2e/scripts/generate-test-wallets.ts` | Generate fresh wallets |
| `e2e/scripts/fund-test-wallets.ts` | Distribute ADA between wallets |
| `e2e/scripts/mint-access-tokens.ts` | Mint Access Tokens for wallets |
| `e2e/scripts/setup-e2e-course.ts` | Create test course with proper permissions |
| `e2e/mocks/real-wallet.ts` | Real wallet integration |
| `e2e/tests/real-wallet-auth.spec.ts` | Authentication tests |
| `e2e/tests/real-wallet-loop2-transactions.spec.ts` | Loop 2 transaction tests |
| `.env.test.local` | Saved wallet mnemonics (gitignored) |

## Security Notes

- **NEVER** use mainnet mnemonics for testing
- **NEVER** commit `.env.test.local` to git
- These are **preprod testnet** wallets only
- Test ADA has no real value

## Current Test Wallet Status

If using the existing E2E test wallets (as of 2026-02-05):

| Role | Alias | Balance | Access Token |
|------|-------|---------|--------------|
| student | e2e_student_01 | ~8600 ADA | ✅ Minted |
| teacher | e2e_teacher_01 | ~240 ADA | ✅ Minted |
| owner | - | 250 ADA | Not needed yet |
| contributor | - | 250 ADA | Not needed yet |
| manager | - | 250 ADA | Not needed yet |

### E2E Test Course

The current E2E test course (for Loop 2 tests):

| Property | Value |
|----------|-------|
| Course ID | `7f2c62d009890a957b15ba93f71dd6c09f53956e2338b4a716a273dc` |
| Owner | e2e_student_01 |
| Teacher | e2e_teacher_01 |
| Module Code | E2E101 |

If this course needs to be regenerated, run `setup-e2e-course.ts` and update the test file.
