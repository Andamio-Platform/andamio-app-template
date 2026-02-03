# Authentication Flow Definition

Step-by-step definition of the authentication user flow for E2E testing.

## Flow Overview

| Property | Value |
|----------|-------|
| **Name** | Authentication Flow |
| **Transactions** | 0 (signature only) |
| **Roles** | Any user |
| **Priority** | High |
| **Prerequisites** | Cardano wallet with test ADA |

## Flow Steps

### Step 1: Navigate to Landing Page

**Action:** Load application
**URL:** `/`
**Expected State:**
- Landing page visible
- "Connect your Cardano wallet" card displayed
- Wallet connection options available

**Selectors:**
```typescript
auth.loginCard.title        // "Connect your Cardano wallet"
auth.walletSelector.button  // Connect button
```

---

### Step 2: Open Wallet Selector

**Action:** Click connect wallet button
**Expected State:**
- Wallet dropdown/modal appears
- Available wallets listed (Eternl, Nami, etc.)

**Selectors:**
```typescript
auth.walletSelector.dropdown  // Wallet options container
auth.walletSelector.eternl    // Specific wallet option
```

---

### Step 3: Select Wallet

**Action:** Click on desired wallet (e.g., Eternl)
**Expected State:**
- Wallet extension popup appears (or mock triggers)
- App shows connecting state

**Note:** In E2E tests with mock wallet, this step is automated.

---

### Step 4: Connect Wallet

**Action:** Approve connection in wallet
**Expected State:**
- Wallet connected
- App begins authentication process
- Signing request triggered

**Selectors:**
```typescript
auth.states.authenticating  // "Authenticating" state
```

---

### Step 5: Sign Authentication Message

**Action:** Sign nonce in wallet
**Expected State:**
- Signature completed
- JWT received from server
- Authentication state updated

**Note:** Mock wallet auto-approves in E2E tests.

---

### Step 6: Verify Authenticated State

**Action:** Check authentication indicators
**Expected State:**
- Status bar shows "Auth" badge
- JWT stored in localStorage
- User can access protected routes

**Selectors:**
```typescript
auth.statusBar.authBadge.authenticated  // "Auth" indicator
auth.statusBar.jwtTimer                 // JWT expiry countdown
auth.statusBar.walletStatus             // Wallet name shown
```

---

### Step 7: (Optional) Verify Access Token Detection

**If user has access token:**
- Status bar shows access token alias
- JWT includes `accessTokenAlias` claim

**Selectors:**
```typescript
auth.statusBar.accessTokenAlias  // Token alias badge
```

## Alternative Flows

### Flow A: Reject Wallet Connection

1. Navigate to landing page
2. Open wallet selector
3. Select wallet
4. **Reject** in wallet popup
5. Verify error state shown
6. Verify can retry connection

### Flow B: Reject Signature

1. Complete steps 1-4
2. **Reject** signature request
3. Verify error message
4. Verify wallet still connected
5. Verify can retry authentication

### Flow C: Session Restoration

1. Authenticate successfully
2. Close browser/tab
3. Reopen application
4. Verify auto-restoration from stored JWT
5. Verify no re-authentication needed

### Flow D: Session Expiry

1. Authenticate successfully
2. Wait for JWT to expire (or mock expiry)
3. Attempt protected action
4. Verify re-authentication required

## Logout Flow

### Step 1: Find Logout Button

**Selectors:**
```typescript
auth.statusBar.logoutButton  // "Logout" button
```

### Step 2: Click Logout

**Expected State:**
- JWT cleared from storage
- Wallet disconnected
- Redirected to landing page

### Step 3: Verify Logged Out

**Selectors:**
```typescript
auth.statusBar.authBadge.unauthenticated  // "Unauth" indicator
```

## Test Coverage Matrix

| Scenario | Test File | Status |
|----------|-----------|--------|
| Basic connection | `wallet-connect.spec.ts` | ✓ |
| Connection rejection | `wallet-connect.spec.ts` | ✓ |
| Signature rejection | `wallet-connect.spec.ts` | ✓ |
| Session persistence | `jwt-session.spec.ts` | ✓ |
| Session expiry | `jwt-session.spec.ts` | ✓ |
| Logout flow | `wallet-connect.spec.ts` | ✓ |
| Access token detection | `wallet-connect.spec.ts` | ✓ |

## Mock Configuration

### Approve Mode (Default)
```typescript
{
  mode: 'approve',
  address: 'addr_test1...',
  accessTokenUnit: undefined // or set for token tests
}
```

### Reject Mode
```typescript
{
  mode: 'reject',
  address: 'addr_test1...'
}
```

### Timeout Mode
```typescript
{
  mode: 'timeout',
  timeoutMs: 30000
}
```

## Error States

| Error | Cause | Recovery |
|-------|-------|----------|
| "User rejected" | Wallet rejection | Retry connection |
| "Signature failed" | Sign rejection | Retry authentication |
| "JWT expired" | Token timeout | Re-authenticate |
| "Popup blocked" | Browser popup blocker | Allow popups, retry |
