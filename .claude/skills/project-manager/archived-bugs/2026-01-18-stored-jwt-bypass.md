# Bug Archive: Stored JWT Bypassing Wallet Signing Flow

**Date**: 2026-01-18
**Status**: Fixed
**Severity**: Medium (Security/UX)

## Summary

Stored JWTs from developer auth sessions were being restored without requiring wallet signing, bypassing the CIP-30 authentication flow that end users should go through.

## Symptoms

1. User connects wallet
2. No wallet signing prompt appears
3. User is immediately authenticated
4. Dashboard shows user data without any login interaction

## Root Cause

Two issues combined:

### Issue 1: Developer Auth Priority

`authenticateWithWallet()` in `src/lib/andamio-auth.ts` tried **developer auth first** if an access token was detected in the wallet:

```typescript
// OLD CODE - PROBLEMATIC
if (accessTokenAlias) {
  try {
    const developerResponse = await loginWithGateway({
      alias: accessTokenAlias,
      walletAddress: params.address,
    });
    return developerResponse; // ← Skips wallet signing!
  } catch {
    // Only falls back to wallet signing if dev auth fails
  }
}
```

Developer auth doesn't require wallet signing - it just looks up alias + address. This is insecure for browser-based end users.

### Issue 2: Stored JWT Restoration

When a JWT exists in localStorage:
1. Page loads
2. JWT is validated against connected wallet address
3. If match, session is restored WITHOUT re-authentication
4. No login flow triggered at all

## The Fix

### Fix 1: Always Use Wallet Signing for End Users

Removed developer auth from `authenticateWithWallet()`. The function now always:
1. Gets nonce from `/api/v2/auth/login/session`
2. Prompts user to sign with CIP-30 wallet
3. Validates at `/api/v2/auth/login/validate`
4. Returns JWT

Developer auth (`loginWithGateway()`) is still available separately for programmatic/API access.

### Fix 2: Clear Old JWTs

Users with stored JWTs from developer auth sessions need to clear them:
```javascript
localStorage.removeItem('andamio_jwt');
```

## Files Changed

- `src/lib/andamio-auth.ts` - Removed developer auth from `authenticateWithWallet()`

## Testing

After fix:
1. Clear localStorage
2. Connect wallet
3. Should see wallet signing prompt
4. Logs should show:
   ```
   POST /api/v2/auth/login/session 200
   POST /api/v2/auth/login/validate 200
   ```

## Lessons Learned

1. **Developer auth vs User auth**: Developer auth (no signing) should only be used for programmatic access, never for end-user browser authentication
2. **Stored credentials from different auth flows**: When changing auth flows, consider that users may have stored credentials from the old flow
3. **Security-first**: CIP-30 wallet signing provides cryptographic proof of ownership - don't bypass it for convenience

## Related

- CLAUDE.md Authentication Flow section
- `src/contexts/andamio-auth-context.tsx` - JWT restoration logic
