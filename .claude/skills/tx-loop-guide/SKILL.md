---
name: tx-loop-guide
description: Guide testers through transaction loops to validate functionality, data visibility, and query completeness. Creates GitHub issues for blockers and feedback digests.
---

# Tx Loop Guide

Guide testers through Andamio transaction loops while collecting UX feedback.

## Critical Behaviors (Do Not Skip)

1. **Starting a session** → Read [loop-history.md](./loop-history.md) FIRST to suggest loops
2. **Blocker bugs** → Create GitHub issue IMMEDIATELY using `gh issue create`
3. **Session ends** → Create feedback digest issue AUTOMATICALLY (don't wait to be asked)
4. **After session** → Update [loop-history.md](./loop-history.md) with new status, date, and issue links
5. **UX friction noted** → Track it and include in the digest issue

## Purpose

This skill guides a tester or developer through a specified Andamio Transaction (Tx) Loop. Each loop is a chance to improve the T3 App Template through structured testing and feedback collection.

## Reference Files

- **[tx-loops.md](./tx-loops.md)** - Catalog of all V2 tx loops with steps and side effects
- **[loop-history.md](./loop-history.md)** - Testing status and history for each loop
- **[@andamio/transactions](../../../packages/andamio-transactions/README.md)** - Transaction definitions (V2 pattern)

## V2 Gateway API

All transactions now use the V2 Gateway API with auto-confirmation. The simplified flow is:

```
BUILD → SIGN → SUBMIT → (Gateway auto-confirms)
```

No manual TX registration or polling needed.

## Goals & Questions

### Current Phase (2026-01-24)

| Domain | Phase | Priority |
|--------|-------|----------|
| Course Owner/Teacher | **UX Testing** | Ready - focus on polish |
| Course Student | **Initial Validation** | High - not yet tested |
| Project | **Not Implemented** | Blocked - needs UI development |

**Course Owner/Teacher loops** (1, 3, 6) are functionally validated and ready for UX testing.
**Course Student loops** (2, 4, 5) need initial validation - this is the current priority.
**Project loops** (P1-P6) require frontend UI development before testing can begin.

### Validation Questions

We're validating that the core experience works before optimizing it. Each loop session should answer:

1. **Do transactions work?** — Can users complete each transaction without errors?
2. **Is data visible?** — Can users see the information they need at each step?
3. **Are queries complete?** — Does the UI show all relevant data, or is something missing/wrong?
4. **Do side effects run?** — Does the DB API update correctly after each transaction?
5. **Does the UI update?** — Does data refresh automatically without requiring a page reload?

A loop is **validated** when testers can confidently say "yes" to all five.

### Questions to Ask

**After each transaction:**
- "Did that work? Any errors or unexpected behavior?"
- "Can you see the data you expected to see?"
- "Is anything missing or showing incorrectly?"
- "Did the UI update automatically, or did you have to refresh?"

**About side effects:**
- "Did the database reflect the change? (Check the relevant list/detail view)"
- "Did status indicators update correctly?"

**At decision points (e.g., finding where to enroll, locating a submission):**
- "Were you able to find what you needed?"
- "What did you expect to see here?"

**After completing the loop:**
- "Did all the transactions succeed?"
- "Was any data missing or confusing?"
- "Did you have to refresh the page at any point?"
- "What would need to change for this to feel ready?"

### When Is a Loop "Done"?

A loop moves to **Validated** status when:
- [ ] All transactions complete successfully
- [ ] All required data is visible at each step
- [ ] Side effects update the database correctly
- [ ] UI updates automatically (no page refresh needed)
- [ ] No blocking issues remain open
- [ ] Tester confirms: "This works, data is complete"

Until then, keep running loops and filing issues.

## How to Guide

### Starting a Loop

**Step 1: Check loop-history.md**

Always read [loop-history.md](./loop-history.md) first to see current status. Suggest loops based on:

| Priority | Status | Reasoning |
|----------|--------|-----------|
| 1 | **Untested** | Unknown state — need baseline data |
| 2 | **Blocked** | May be unblocked by recent fixes |
| 3 | **Issues Found** | Re-test to verify fixes |
| 4 | **Validated** | Only re-test if related code changed |

**Dependencies to consider:**
- Loop 1 (Onboarding) must be validated before others — users need Access Tokens ✅ Done
- Loop 3 (Create & Publish Course) should be validated before Loop 2 — need a course to enroll in ✅ Done
- **Loop 2 (Earn Credential) is now the priority** — foundation for student flows
- Loops 4, 5 build on Loop 2's foundation
- Loop 6 (Team Teaching) is validated ✅ Done
- Project loops (P1-P6) need UI implementation before testing

**Step 2: Suggest a loop (or series)**

Present the tester with a recommendation based on current phase:

For **Course Student validation** (current priority):
> "Based on loop-history.md, **Loop 2: Earn a Credential** is the next priority — Course Owner/Teacher flows are validated, so we can now test the student experience. Want to run that one?"

For **UX testing** (owner/teacher flows):
> "Loops 1, 3, and 6 are functionally validated and ready for UX testing. Want to do a detailed UX review of the course creation flow?"

For **Project flows** (blocked):
> "Project loops (P1-P6) need UI development before testing. The transaction definitions exist but there's no frontend to trigger them yet."

**Step 3: Confirm role setup**

Once a loop is selected:
- Do they have the required Access Tokens minted?
- Are they using multiple browser profiles or wallet accounts?
- Offer to help with setup if needed

**Step 4: Brief the tester**

Explain what the loop tests and how many transactions are involved.

### During Each Step

**Say things like:**
> "Next, try to enroll in a course and commit to an assignment. This will be the `COURSE_STUDENT_ASSIGNMENT_COMMIT` transaction."

**Wait for the user to navigate and attempt the action.** Don't tell them where to go unless they ask. This tests discoverability.

If they ask for help:
- Guide them to the correct route
- Note that they needed help (this is feedback!)

After each transaction:
- Confirm the transaction succeeded
- Ask about the experience:
  - "How did that feel? Anything confusing?"
  - "Did things load quickly enough?"
  - "Could you find what you needed?"

### Handling Blockers

**CRITICAL: Create GitHub issues IMMEDIATELY when blockers are found. Do not wait for the user to remind you.**

If the user encounters a bug that blocks progress:
1. Document the bug clearly
2. **IMMEDIATELY** create a GitHub issue using `gh issue create` — do this right away, not at the end
3. Then decide whether to:
   - Work around it and continue
   - Stop the loop and focus on the bug
   - Switch to a different loop

## Collecting Feedback

### During the Loop

Take notes on:
- **Navigation confusion** - Did they know where to go?
- **Loading/performance** - Anything feel slow?
- **Visual clarity** - Was status clear? Could they tell what happened?
- **Error handling** - Did errors make sense? Could they recover?
- **Missing features** - What did they expect that wasn't there?

### After the Loop (or when user stops)

**CRITICAL: Always create a feedback digest issue using `gh issue create` when:**
- The loop is completed
- The user decides to stop
- The session ends for any reason

Do NOT skip this step. Do NOT wait for the user to ask. Create the issue automatically.

## Issue Templates

### Blocker Bug Issue

```markdown
## Bug: [Brief description]

**Tx Loop:** [Loop name, e.g., "Earn a Credential"]
**Step:** [Step number and transaction]
**Blocker:** Yes

### What happened
[Description of the bug]

### Expected behavior
[What should have happened]

### Steps to reproduce
1. [Step 1]
2. [Step 2]
3. ...

### Environment
- Browser: [e.g., Chrome 120]
- Wallet: [e.g., Eternl]
- Network: [e.g., Preprod]
```

### Feedback Digest Issue

```markdown
## Tx Loop Feedback: [Loop Name]

**Date:** [Date]
**Tester:** [Name/alias]
**Loop completed:** [Yes/No/Partial]

### Summary
[1-2 sentence summary of overall experience]

### Navigation & Discoverability
- [ ] Issue: [Description] | Severity: [Low/Medium/High]
- [ ] Issue: [Description] | Severity: [Low/Medium/High]

### Performance
- [ ] Issue: [Description] | Severity: [Low/Medium/High]

### Visual Design & Clarity
- [ ] Issue: [Description] | Severity: [Low/Medium/High]

### Error Handling
- [ ] Issue: [Description] | Severity: [Low/Medium/High]

### Feature Requests
- [ ] Request: [Description] | Priority: [Nice-to-have/Should-have/Must-have]

### Positive Notes
[What worked well - important for knowing what NOT to change]

### Blockers Encountered
- [Link to blocker issue #X] - [Brief description]
```

## Role Setup Reminders

**For solo testing:**
- Multiple browser profiles with separate wallets work best
- Alternative: Multi-account wallet (Eternl), logout/login between roles
- Each account needs its own Access Token (run Loop 1: Onboarding first)

**For pair testing:**
- Assign roles upfront (e.g., "You're the Student, I'm the Teacher")
- Coordinate handoffs ("I just approved your assignment, check your dashboard")

## Example Session

```
User: Let's test the credential flow

Guide: Great! That's Loop 2: Earn a Credential. It's 3 transactions across 2 roles
(Student and Teacher). Before we start:
- Do you have Access Tokens minted for both roles?
- Are you set up with two browser profiles or wallet accounts?

User: Yes, ready to go

Guide: Perfect. You'll start as the Student.

**Step 1 of 3:** Try to enroll in a course and commit to an assignment.
This will be the `COURSE_STUDENT_ASSIGNMENT_COMMIT` transaction (V2 Gateway).

User: Done! That worked.

Guide: Nice. The Gateway should have auto-confirmed that. Could you find where to enroll easily?

User: Took me a minute to find the enroll button, it was hidden in a dropdown.

Guide: Good note - I'll capture that. Now switch to your Teacher account.

**Step 2 of 3:** Try to find and approve the student's submission.
This will be the `COURSE_TEACHER_ASSIGNMENTS_ASSESS` transaction.

[...continues through the loop...]

Guide: Loop complete! Let me create the feedback digest issue with everything we noted.
```