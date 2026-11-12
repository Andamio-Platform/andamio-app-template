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
| 3 | 16:00 | app.andamio.io registration | No "already registered" feedback — generic error shown when wallet already has an account. After multiple attempts the account gets rate-limited with no explanation of how long to wait. | **Blocker** (app.andamio.io) |

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

### Issue #3 — app.andamio.io registration gives no "already registered" feedback
When a developer tries to register at `app.andamio.io` with a wallet that already has an account, the app returns a generic error with no explanation. The developer has no way to know they're already registered and should just log in instead. After multiple failed attempts the account gets rate-limited and they are temporarily blocked from trying again.

**Severity:** Blocker (on the app.andamio.io side)

**Proposed fixes:**
1. **On app.andamio.io** — detect "already registered" and show a clear message: "This wallet already has an account. Try logging in instead."
2. **On app.andamio.io** — rate limit error should explain what happened and how long to wait
3. **In the template docs** — note in the README/troubleshooting that if you already have an Andamio account you should log in rather than register

> **Note:** This is an `app.andamio.io` issue, not a template issue, but it is part of the fork-to-deploy experience and should be reported to the relevant team.

---

### Issue #4 — Walkthrough blocked at 16 minutes
Tester was completely blocked at the 16-minute mark due to rate limiting on `app.andamio.io`. No path forward without waiting for the rate limit to clear. A new developer with no context would likely abandon at this point.

**Severity:** Blocker

**Root cause chain:**
1. `.env` placeholder not caught before app starts → auth fails silently
2. API key setup requires mainnet wallet switch → unexpected friction
3. Already-registered error gives no guidance → developer retries
4. Rate limit kicks in → completely blocked with no ETA

**The core problem:** The entire fork-to-deploy experience depends on `app.andamio.io` working smoothly, but there is no documentation warning developers about these steps before they start.

---

## Summary (walkthrough ended at 16 minutes — blocked)

| Metric | Result |
|---|---|
| Time to first credential | Did not complete — blocked at 16 min |
| Blockers | 2 (auth error, rate limit) |
| Friction points | 1 (network switch for API key) |
| Steps completed | Fork, clone, env setup, npm install, npm run dev |
| Steps not completed | Wallet auth, Access Token mint, first credential |

**Verdict:** A new developer cannot complete fork-to-first-credential without prior knowledge of the Andamio ecosystem. The critical path depends on `app.andamio.io` UX improvements and clearer prerequisite documentation in the template.
