---
name: qa
description: Quality assurance on individual app routes — audit components, hooks, types, and patterns against 2026 React/Next.js best practices.
---

# Route QA

**Purpose**: Systematically audit individual routes for production readiness — checking component structure, hook usage, TypeScript patterns, and React/Next.js best practices. Each audit produces a report with findings, fixes, and educational context for the team.

> **Last Updated**: February 5, 2026

## When to Use

- When preparing a route for production release
- When a route feels "messy" and needs cleanup
- After major refactoring to verify nothing was missed
- When onboarding a developer to a route's codebase
- When prompted with `/qa`

## Getting Started

### Step 1: Choose a Route

Ask the user which route to audit using AskUserQuestion:

**Question**: "Which route do you want to QA?"

| Option | Description |
|--------|-------------|
| **dashboard** | `/dashboard` — User dashboard |
| **course/[coursenft]** | `/course/[coursenft]` — Learner course detail + nested routes |
| **project/[projectid]** | `/project/[projectid]` — Project detail + nested routes |
| **studio/course** | `/studio/course` — Course Studio (owner) |
| **studio/project** | `/studio/project` — Project Studio (owner) |

If the user provides a route not listed (e.g., `credentials`, `studio/course/[coursenft]/teacher`), accept it — map it to the correct `src/app/` path.

### Step 2: Map the Route to Files

Convert the UX route to the file path:

| UX Route | File Path |
|----------|-----------|
| `dashboard` | `src/app/(app)/dashboard/page.tsx` |
| `course` | `src/app/(app)/course/page.tsx` |
| `course/[coursenft]` | `src/app/(app)/course/[coursenft]/page.tsx` |
| `course/[coursenft]/[modulecode]` | `src/app/(app)/course/[coursenft]/[modulecode]/page.tsx` |
| `course/[coursenft]/[modulecode]/assignment` | `src/app/(app)/course/[coursenft]/[modulecode]/assignment/page.tsx` |
| `course/[coursenft]/[modulecode]/[moduleindex]` | `src/app/(app)/course/[coursenft]/[modulecode]/[moduleindex]/page.tsx` |
| `project` | `src/app/(app)/project/page.tsx` |
| `project/[projectid]` | `src/app/(app)/project/[projectid]/page.tsx` |
| `project/[projectid]/contributor` | `src/app/(app)/project/[projectid]/contributor/page.tsx` |
| `project/[projectid]/[taskhash]` | `src/app/(app)/project/[projectid]/[taskhash]/page.tsx` |
| `studio/course` | `src/app/(studio)/studio/course/page.tsx` |
| `studio/course/[coursenft]` | `src/app/(studio)/studio/course/[coursenft]/page.tsx` |
| `studio/course/[coursenft]/teacher` | `src/app/(studio)/studio/course/[coursenft]/teacher/page.tsx` |
| `studio/course/[coursenft]/new` | `src/app/(studio)/studio/course/[coursenft]/new/page.tsx` |
| `studio/course/[coursenft]/[modulecode]` | `src/app/(studio)/studio/course/[coursenft]/[modulecode]/page.tsx` |
| `studio/project` | `src/app/(studio)/studio/project/page.tsx` or `src/app/(app)/studio/project/page.tsx` |
| `studio/project/[projectid]` | `src/app/(app)/studio/project/[projectid]/page.tsx` |
| `studio/project/[projectid]/manager` | `src/app/(app)/studio/project/[projectid]/manager/page.tsx` |
| `studio/project/[projectid]/draft-tasks` | `src/app/(app)/studio/project/[projectid]/draft-tasks/page.tsx` |
| `studio/project/[projectid]/commitments` | `src/app/(app)/studio/project/[projectid]/commitments/page.tsx` |
| `credentials` | `src/app/(app)/credentials/page.tsx` |

Also check for:
- `layout.tsx` in the same directory and parent directories
- `loading.tsx` in the same directory
- `error.tsx` in the same directory

### Step 3: Ask Audit Depth

**Question**: "What depth of audit?"

| Option | Description |
|--------|-------------|
| **Quick Scan** (Recommended) | Page file + direct imports only. Catches ~80% of issues. |
| **Full Audit** | Recursive analysis of all components, hooks, and utilities. Comprehensive but thorough. |

### Step 4: Collect the Component Tree

Read the page file. For each import that references a local component (`~/components/`, `./`, `../`):

1. Record the import path and component name
2. Read that component file
3. Record its imports (hooks, sub-components, utilities)
4. **Quick Scan**: Stop here — only one level deep
5. **Full Audit**: Repeat recursively until all leaf components are collected

Build a component tree as you go:

```
page.tsx
├── CourseHeader (~/components/courses/course-header.tsx)
│   ├── useCourse (~/hooks/api/use-course.ts)
│   └── AndamioPageHeader (~/components/andamio/)
├── ModuleList (~/components/courses/module-list.tsx)
│   ├── useCourseModules (~/hooks/api/use-course-module.ts)
│   └── ModuleCard (~/components/courses/module-card.tsx)  ← Full Audit only
└── AssignmentCommitment (~/components/courses/assignment-commitment.tsx)
    ├── useStudentAssignments (~/hooks/api/)
    └── useMutation + queryClient  ← check cache invalidation
```

### Step 5: Run QA Checks on Each File

For every `.tsx` / `.ts` file collected, apply the checks from [checklist.md](./checklist.md).

Work through the checklist categories in order:

1. **React Query & Data Fetching** — hooks, cache, queries
2. **Component Structure** — extraction, composition, responsibility
3. **TypeScript** — types, assertions, generics
4. **Next.js Patterns** — server/client boundaries, Suspense, error handling
5. **Performance** — memoization, re-renders, lazy loading
6. **Andamio Conventions** — design system, icons, naming

For each finding, classify its severity:

| Severity | Meaning | Action |
|----------|---------|--------|
| **Critical** | Breaks UX or causes bugs (stale data, missing error handling) | Fix now |
| **Warning** | Violates best practices, technical debt | Fix before release |
| **Info** | Could be better, educational opportunity | Document for team |

### Step 6: Produce the Report

After checking all files, produce a structured report:

```markdown
## QA Report: /route/path

**Audit depth**: Quick Scan / Full Audit
**Files analyzed**: N
**Component tree depth**: N levels

### Summary

| Severity | Count |
|----------|-------|
| Critical | N |
| Warning  | N |
| Info     | N |

### Critical Findings

#### C1: [Title]
**File**: `path/to/file.tsx:LINE`
**Rule**: [Rule ID from checklist]
**Issue**: What's wrong
**Fix**: How to fix it
**Why**: Educational context for the team

### Warning Findings

#### W1: [Title]
...

### Info Findings

#### I1: [Title]
...

### Component Extraction Recommendations

| Current Location | Suggested Component | Reason |
|-----------------|-------------------|--------|
| ... | ... | ... |

### Route Health Score

| Category | Score | Notes |
|----------|-------|-------|
| Data Fetching | Good/Needs Work/Critical | ... |
| Component Structure | Good/Needs Work/Critical | ... |
| TypeScript Safety | Good/Needs Work/Critical | ... |
| Next.js Patterns | Good/Needs Work/Critical | ... |
| Performance | Good/Needs Work/Critical | ... |
| Andamio Conventions | Good/Needs Work/Critical | ... |
```

### Step 7: Ask About Fixes

After presenting the report, ask:

**Question**: "Would you like me to fix the issues?"

| Option | Description |
|--------|-------------|
| **Fix Critical only** | Fix Critical issues, leave Warnings as TODOs |
| **Fix Critical + Warnings** | Fix everything actionable |
| **Report only** | Just the report, no changes |

### Step 8: Verify Changes

After making fixes:

```bash
npm run typecheck
npm run build
```

If either fails, diagnose and fix before completing.

## Data Sources

| File | Purpose |
|------|---------|
| [checklist.md](./checklist.md) | Per-file QA checklist with rule IDs |
| [best-practices.md](./best-practices.md) | Detailed best practices with examples and "why" explanations |

## Integration with Other Skills

| Skill | When QA Delegates |
|-------|-------------------|
| `/design-system review` | When styling violations are found — delegate for comprehensive style audit |
| `/hooks-architect audit` | When hook structure issues are found (wrong file, missing exports) |
| `/react-query-auditor` | When cache invalidation or stale data issues are found |
| `/typescript-types-expert audit` | When complex type issues need deeper analysis |

**Rule of thumb**: QA identifies the problem and classifies severity. If the fix requires deep domain knowledge (e.g., redesigning a hook's type architecture), QA recommends delegating to the specialized skill.

## Quick Reference Commands

```bash
# Find all page files
find src/app -name "page.tsx" | head -40

# Find direct API calls in components (should use hooks)
grep -rn "gateway\|gatewayAuth\|gatewayPost\|gatewayAuthPost" src/app/ src/components/ --include="*.tsx"

# Find "use client" directives
grep -rn "\"use client\"" src/app/ src/components/ --include="*.tsx"

# Find useState that might copy server state
grep -rn "useState.*data\|useState.*query\|useState.*result" src/app/ src/components/ --include="*.tsx"

# Find missing loading.tsx
for dir in $(find src/app -name "page.tsx" -exec dirname {} \;); do
  [ ! -f "$dir/loading.tsx" ] && echo "Missing: $dir/loading.tsx"
done

# Find missing error.tsx
for dir in $(find src/app -name "page.tsx" -exec dirname {} \;); do
  [ ! -f "$dir/error.tsx" ] && echo "Missing: $dir/error.tsx"
done

# Check for inline queryKey arrays
grep -rn "queryKey: \[" src/app/ src/components/ --include="*.tsx"

# Find any typed assertions
grep -rn " as " src/app/ src/components/ --include="*.tsx" | grep -v "as const" | grep -v "// safe"
```

---

**Last Updated**: February 5, 2026
