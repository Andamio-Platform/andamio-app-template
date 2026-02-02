---
name: tx-ux-audit-20260202
description: Interview-based subskill for confirming that all Andamio transactions are fully functional in this app.
invocation: /transaction-auditor then ask to "run tx ux audit"
---

# TX UX Audit

An interactive, interview-driven audit of every Andamio transaction type. Walk through each TX with a tester to verify submit, confirmation, off-chain sync, and UX refresh.

## Status Table

Persistent state is tracked in:
- `tx-ux-audit-status.md` (same directory) — the canonical audit status table

Read this file at the start of every session and present it to the user.

## Process

1. **Present the status table** from `tx-ux-audit-status.md`. Show row numbers for easy selection.
2. **Prompt**: "Which TX are we working on?" (quick-select by row number)
3. **Run the decision tree** (below) for the selected TX.
4. **Update** `tx-ux-audit-status.md` with results.
5. **Present the updated table** so the user sees progress.
6. **Run documentation**: If code changes were made, run `/project-manager` and `/documentarian`.
7. **Repeat** — prompt for the next TX or offer to stop.

## Decision Tree

For the selected transaction, ask the user four quick-select questions in order:

### Q1: Does the TX submit without error?
- **pass** — TX submits, wallet signs, goes on-chain. Proceed to Q2.
- **fail** — Record the error. Write a note for the ops team describing the failure (TX type, error message, steps to reproduce). Mark column as `fail`. **Pause** — offer to continue when resolved.

### Q2: Does a confirmation message automatically appear in the UX?
- **pass** — Toast or badge shows success after gateway returns `updated` state. Proceed to Q3.
- **fail** — Check if the component uses `useTxStream` and handles the `updated` state correctly. If the issue is frontend-only (missing toast, wrong state check), **fix it immediately** in the codebase. If the issue is backend (gateway never reaches `updated`), write an ops team note. Mark column accordingly.

### Q3: Does the off-chain data update as expected via Andamio DB API?
- **pass** — Query the relevant endpoint and confirm the data reflects the TX. Proceed to Q4.
- **fail** — This is a gateway/backend issue. Write an ops team note describing which endpoint returns stale data and what the expected state should be. Mark column as `fail`. **Pause**.

### Q4: Does the UX update as the user expects upon TX confirmation?
- **pass** — The UI shows fresh data without a manual page reload. Mark all columns as `pass`.
- **fail** — This is a frontend cache/query invalidation issue. **Fix it immediately**: check that the `onComplete` callback invalidates the right query keys or calls the right refetch. Ask the user clarifying questions if needed (e.g., "What data are you expecting to see update?"). After fixing, have the user re-test.

## Ops Team Note Format

When routing issues to the ops team, provide:

```
## TX Audit Issue — [TX Type Name]

**Transaction**: [TransactionType enum value]
**Endpoint**: [Gateway endpoint path]
**Failed Check**: [Q1/Q2/Q3 description]
**Error**: [Error message or observed behavior]
**Expected**: [What should happen]
**Steps to Reproduce**: [Brief steps]
**Component**: [src/components/tx/filename.tsx]
```

## Reference

- **All 17 TX types**: See `SKILL.md` § Transaction Types table
- **TX State Machine**: See `../audit-api-coverage/tx-state-machine.md`
- **Terminal states**: `updated`, `failed`, `expired` — NOT `confirmed`
- **TX components**: `src/components/tx/*.tsx`
- **TX hooks**: `src/hooks/tx/use-transaction.ts`, `use-tx-stream.ts`
- **TX config**: `src/config/transaction-ui.ts`, `transaction-schemas.ts`

## Current Coverage

- **16/17** TX types have UI components
- **Missing**: `PROJECT_USER_TREASURY_ADD_FUNDS` (schema only, no component)
- All implemented components use `useTransaction()` + `useTxStream()`
- All show toast feedback on success/error
