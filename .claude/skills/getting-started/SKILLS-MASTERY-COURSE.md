# Andamio Skills Mastery Course

A curriculum for developers learning to build effectively with the Andamio T3 App Template and its AI-powered skill system.

**Prerequisite**: Basic familiarity with React, TypeScript, and Next.js.

**Outcome**: Developers who complete this course can independently build features, fix issues, maintain quality, and extend the Andamio platform — with AI assistance at every step.

---

## Module 1: First Contact

*Get oriented and make your first skill invocation*

### Learning Targets

1. I can invoke `/getting-started` and identify the right skill for my intent
2. I can run `/project-manager` and summarize the current project state
3. I can navigate the `.claude/skills/` directory and locate a skill's SKILL.md
4. I can read CLAUDE.md and list the critical rules for this codebase

---

## Module 2: Understanding Hooks

*Learn the hook layer that connects API to UI*

### Learning Targets

1. I can run `/hooks-architect learn` and explain the colocated types pattern
2. I can trace data flow from Gateway API to React component using a hook
3. I can identify the 5 modes of `/hooks-architect` and select the right one for a task
4. I can run `/hooks-architect audit` on a hook file and interpret the results
5. I can distinguish correct vs incorrect type imports in a component

---

## Module 3: Design System Fluency

*Master the UI patterns and styling rules*

### Learning Targets

1. I can run `/design-system reference` and apply semantic colors correctly
2. I can use `/design-system diagnose` to identify a CSS specificity conflict
3. I can run `/design-system review` on a route and fix all violations
4. I can identify the 4 Andamio layout patterns and choose the right one
5. I can create a new page that passes a design system audit

---

## Module 4: Type System Mastery

*Write type-safe code that integrates cleanly with the API*

### Learning Targets

1. I can run `/typescript-types-expert audit` and interpret the health score
2. I can use `/typescript-types-expert fix` to resolve a type violation
3. I can design types for a new feature and place them in the correct location
4. I can regenerate types from the API spec using `npm run generate:types`
5. I can explain when inline types are correct vs when extraction is needed

---

## Module 5: Transaction Flows

*Understand how blockchain transactions work in the app*

### Learning Targets

1. I can run `/tx-loop-guide` and complete Loop 1 (Onboarding)
2. I can explain the TX state machine states and why "confirmed" is not terminal
3. I can use `/transaction-auditor` to verify TX schemas match the API spec
4. I can trace a transaction from button click to on-chain confirmation
5. I can set up test wallets using `/test-wallet-setup`
6. I can complete Loop 2 (Earn Credential) with real test wallets

---

## Module 6: Debugging & Issue Resolution

*Find and fix problems efficiently*

### Learning Targets

1. I can use `/issue-handler` to diagnose an error and route it to the right team
2. I can enable "rabbit hole mode" and fix all instances of a pattern
3. I can use `/react-query-auditor` to diagnose stale data after a mutation
4. I can debug a transaction that succeeded on-chain but didn't update the UI
5. I can create a GitHub issue with proper reproduction steps

---

## Module 7: Quality Assurance

*Audit routes for production readiness*

### Learning Targets

1. I can run `/qa` on a route and explain the 6 audit categories
2. I can interpret a QA report and prioritize fixes by severity
3. I can use `/review-pr` to review a pull request comprehensively
4. I can run `/ux-readiness assess` and interpret the readiness score

---

## Module 8: The Shipping Workflow

*From fix to merged PR*

### Learning Targets

1. I can use `/fix` to create a branch and implement a fix from a GitHub issue
2. I can run `/ship` and complete the full shipping workflow
3. I can write a conventional commit message with proper format
4. I can create a PR with proper title, summary, and test plan
5. I can use `/documentarian` to update docs after shipping

---

## Module 9: E2E Testing

*Automated testing with Playwright and real wallets*

### Learning Targets

1. I can run `/e2e-testing` on the auth flow and interpret results
2. I can set up real wallet E2E tests using `/test-wallet-setup`
3. I can add a new test flow to the E2E test suite
4. I can use `/e2e-testing` with `--ux-analysis` flag to generate UX questions
5. I can debug a failing E2E test using Playwright traces

---

## Module 10: Extending the System

*Create your own skills and customize the template*

### Learning Targets

1. I can use `/bootstrap-skill` to scaffold a new skill
2. I can create supporting files (checklists, templates, references) for a skill
3. I can integrate my skill with existing skills via delegation
4. I can use `/sync-template` to sync changes to the template repo
5. I can design a skill that orchestrates multiple other skills
6. I can contribute a skill back to the Andamio ecosystem

---

## Quick Reference

| Module | Focus | Primary Skills |
|--------|-------|----------------|
| 1 | Orientation | `/getting-started`, `/project-manager` |
| 2 | Data Layer | `/hooks-architect` |
| 3 | UI Layer | `/design-system` |
| 4 | Type Safety | `/typescript-types-expert` |
| 5 | Blockchain | `/tx-loop-guide`, `/transaction-auditor`, `/test-wallet-setup` |
| 6 | Debugging | `/issue-handler`, `/react-query-auditor` |
| 7 | Quality | `/qa`, `/review-pr`, `/ux-readiness` |
| 8 | Shipping | `/fix`, `/ship`, `/documentarian` |
| 9 | Testing | `/e2e-testing`, `/test-wallet-setup` |
| 10 | Extending | `/bootstrap-skill`, `/sync-template` |
