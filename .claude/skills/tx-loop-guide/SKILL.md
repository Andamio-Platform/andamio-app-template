# Tx Loop Guide

Guide testers through Andamio transaction loops while collecting UX feedback.

## Critical Behaviors (Do Not Skip)

1. **Blocker bugs** → Create GitHub issue IMMEDIATELY using `gh issue create`
2. **Session ends** → Create feedback digest issue AUTOMATICALLY (don't wait to be asked)
3. **UX friction noted** → Track it and include in the digest issue

## Purpose

This skill guides a tester or developer through a specified Andamio Transaction (Tx) Loop. Each loop is a chance to improve the T3 App Template through structured testing and feedback collection.

## Reference Files

- **[tx-loops.md](./tx-loops.md)** - Catalog of all tx loops with steps and side effects
- **[@andamio/transactions](../../../packages/andamio-transactions/README.md)** - Transaction definitions and expected behavior

## How to Guide

### Starting a Loop

1. Ask which loop the user wants to test (or suggest one based on context)
2. Confirm their role setup:
   - Do they have the required Access Tokens minted?
   - Are they using multiple browser profiles or wallet accounts?
   - Offer to help with setup if needed
3. Briefly explain what the loop tests and how many transactions are involved

### During Each Step

**Say things like:**
> "Next, try to enroll in a course and commit to an assignment. This will be the `COURSE_STUDENT_ENROLL` transaction."

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
This will be the `COURSE_STUDENT_ENROLL` transaction.

User: Done! That worked.

Guide: Nice. How did that feel? Could you find where to enroll easily?

User: Took me a minute to find the enroll button, it was hidden in a dropdown.

Guide: Good note - I'll capture that. Now switch to your Teacher account.

**Step 2 of 3:** Try to find and approve the student's submission.
This will be the `COURSE_TEACHER_ASSIGNMENTS_ASSESS` transaction.

[...continues through the loop...]

Guide: Loop complete! Let me create the feedback digest issue with everything we noted.
```