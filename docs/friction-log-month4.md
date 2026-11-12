# Fork-to-Deploy Friction Log — MRP Month 4

**Issue:** [#140](https://github.com/Andamio-Platform/andamio-app-template/issues/140)
**Date:** 2026-11-11
**Tester:** Cesar Gomez
**Method:** Manual fork → clone → configure → run (no CLI)

---

## Friction Log

| # | Time | Step | Issue | Severity |
|---|---|---|---|---|
| 1 | 3:45 | Wallet auth | "Sign-In Failed" with no actionable error. Root cause: `ANDAMIO_API_KEY` still set to placeholder value. App starts and appears healthy but fails silently at auth. UI shows generic "Something went wrong during sign-in. Please try again." with no mention of API key or `.env`. | **Blocker** |
| 2 | 10:00 | API key setup | Getting an API key requires visiting `app.andamio.io/api-setup`, switching wallet to mainnet to pay, then switching back to preprod to develop. Context switching between networks mid-setup is disruptive and not mentioned anywhere in the README or `.env.example`. | **Friction** |

---

## Notes

### Issue #1 — Generic auth error with no root cause
The `.env` placeholder `"your-api-key-here"` passes schema validation (`z.string().min(1)`) so the app starts without warning. The failure only surfaces at runtime when the wallet attempts to authenticate against the Gateway API and receives a `401 Unauthorized`. The error boundary shows a generic "try again" message with no indication of what went wrong or how to fix it.

**Proposed fixes:**
1. **In the app** — detect a 401 response during auth and surface a specific message: "API key missing or invalid — check `ANDAMIO_API_KEY` in your `.env`"
2. **In the CLI** — when a user skips the API key prompt, add a prominent warning in the outro and in the generated `.env` comment

### Issue #2 — API key requires mainnet wallet + network switch
Getting an API key at `app.andamio.io/api-setup` requires the developer to:
1. Switch their wallet to mainnet
2. Pay for the key with real ADA
3. Switch back to preprod to start developing

This is a significant context switch that isn't mentioned anywhere in the README or `.env.example`. A developer following the quick start has no warning this is coming.

**Proposed fixes:**
1. **In the README** — add a "Before you start" prerequisite step explicitly calling out that an API key requires a mainnet wallet and real ADA, before the Quick Start section
2. **In `.env.example`** — expand the API key comment to mention the network switch required
3. **Longer term** — explore whether a free preprod API key tier is feasible to remove this friction entirely for new developers

---

## Walkthrough in progress

This log will be updated as the walkthrough continues.
