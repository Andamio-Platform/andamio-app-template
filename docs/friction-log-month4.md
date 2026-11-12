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

---

## Notes

### Issue #1 — Generic auth error with no root cause
The `.env` placeholder `"your-api-key-here"` passes schema validation (`z.string().min(1)`) so the app starts without warning. The failure only surfaces at runtime when the wallet attempts to authenticate against the Gateway API and receives a `401 Unauthorized`. The error boundary shows a generic "try again" message with no indication of what went wrong or how to fix it.

**Proposed fixes:**
1. **In the app** — detect a 401 response during auth and surface a specific message: "API key missing or invalid — check `ANDAMIO_API_KEY` in your `.env`"
2. **In the CLI** — when a user skips the API key prompt, add a prominent warning in the outro and in the generated `.env` comment

---

## Walkthrough in progress

This log will be updated as the walkthrough continues.
