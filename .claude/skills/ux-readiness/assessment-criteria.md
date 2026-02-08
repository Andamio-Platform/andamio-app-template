# UX Readiness Assessment Criteria

This rubric defines what makes an app flow ready to document in a user-facing guide. Each guide covers one or more app routes — every route is assessed individually, and the guide's overall score is the worst score among its routes.

## Score Levels

### Blocked

The flow **cannot be completed** by a user following the guide. Any one of these is a blocker:

| Criterion | What to check |
|-----------|---------------|
| **Transaction failure** | TX submission errors, missing UTxOs, script validation failures |
| **Route crash** | Unhandled exceptions, white screen, React error boundaries triggered |
| **Data doesn't load** | API returns errors, infinite loading spinners, empty state when data exists |
| **Impossible step** | A step the guide describes cannot physically be performed (button missing, route inaccessible, feature not implemented) |
| **Auth gate failure** | User cannot reach the route despite having the correct role/token |
| **Wrong data displayed** | Critical data mismatch — e.g. showing another user's courses, wrong credential counts |
| **Missing required route** | A route the guide needs to reference doesn't exist yet |

**Action**: Create a GitHub issue with label `documentation,ux-readiness` and severity `blocker`. Guide writing is gated until all blockers close.

---

### Friction

The flow **can be completed** but the experience would confuse or frustrate a user following the guide. Any of these count as friction:

| Criterion | What to check |
|-----------|---------------|
| **Jargon in UI copy** | Technical terms without explanation (e.g. "UTxO", "datum", "redeemer" in user-facing text) |
| **Missing loading states** | No skeleton/spinner during data fetch — user sees empty page then sudden content |
| **Confusing navigation** | Non-obvious how to get from one step to the next (hidden menus, unclear breadcrumbs) |
| **Unclear form labels** | Input fields without helpful labels, placeholders, or validation messages |
| **Missing confirmation** | Destructive or important actions with no confirmation dialog |
| **Broken but non-critical UI** | Layout issues, truncated text, misaligned elements that don't block the flow |
| **Missing empty states** | No guidance shown when lists are empty (e.g. "No modules yet" with no action hint) |
| **Inconsistent terminology** | Same concept called different things across screens |
| **Missing success feedback** | User completes an action but gets no visual confirmation |
| **Slow response** | Noticeable delay (>3s) on actions without progress indication |

**Action**: Create a GitHub issue with label `documentation,ux-readiness` and severity `friction`. Guide writing can proceed — add a `<Callout type="warn">` noting the known issue.

---

### Ready

The flow **completes start to finish** with clear UX at every step. All of these must be true:

| Criterion | What to check |
|-----------|---------------|
| **Full flow completion** | Every step in the guide can be performed without workaround |
| **Clear navigation** | User can follow the path described without confusion |
| **Appropriate feedback** | Loading states, success messages, error messages are present |
| **Correct data** | Displayed data matches what was submitted/expected |
| **Consistent copy** | Terminology matches the glossary and is used consistently |
| **Responsive** | Works on desktop viewport (mobile is a bonus, not required for guides) |

**Action**: No issues needed. Guide is clear to write and publish.

---

## Assessment Process

1. **Read the guide's `appRoutes`** from the tracker to know which routes to inspect
2. **Walk the flow mentally** — imagine a new user following the guide step by step
3. **Read route components** — check page.tsx and key child components for:
   - Error boundaries and fallbacks
   - Loading states (Suspense, skeletons)
   - Empty states
   - Form validation
   - Success/error toasts
4. **Check for open issues** — search GitHub for existing issues related to these routes
5. **Score conservatively** — if in doubt between friction and ready, choose friction. Better to flag an issue than miss it.

## Issue Labels

All issues created by this skill use these labels:
- `documentation` — marks it as doc-related
- `ux-readiness` — marks it as discovered during guide assessment

These labels allow the `guide-pipeline` skill to query relevant issues:
```bash
gh issue list --repo Andamio-Platform/andamio-app-v2 --label "documentation,ux-readiness" --state open
```

## Relationship to Other Audits

- **`/qa` checklist**: Overlaps with readiness criteria but focuses on code quality, not documentation flow. A route can pass QA but have friction for guide purposes (e.g. technically correct but confusing copy).
- **`/design-system review`**: Catches styling issues. Misaligned layouts or wrong colors may count as friction.
- **`/product-iteration` TEST phase**: UX readiness assessment is a formalized version of the test phase focused specifically on documentable flows.
