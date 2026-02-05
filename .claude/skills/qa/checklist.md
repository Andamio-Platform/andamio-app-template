# QA Checklist

> Per-file checklist for route QA audits. Each rule has an ID for traceability in reports.
> See [best-practices.md](./best-practices.md) for detailed explanations and examples.

---

## 1. React Query & Data Fetching

| ID | Check | Severity | How to Verify |
|----|-------|----------|---------------|
| RQ-1 | Query keys use factory objects, not inline arrays | Warning | Grep for `queryKey: [` in component files |
| RQ-2 | Queries have explicit `staleTime` | Info | Check `useQuery` options for `staleTime` |
| RQ-3 | Mutations invalidate related queries via key factory | Critical | Check every `useMutation` for `onSuccess`/`onSettled` with `invalidateQueries` |
| RQ-4 | Dependent queries use `enabled: !!value` | Critical | Check queries that receive params from other queries/hooks |
| RQ-5 | No server state copied to `useState` | Critical | Look for `useState(queryResult.data)` or `useEffect` syncing query → state |
| RQ-6 | Components use hooks, not direct `gateway`/`fetch` calls | Warning | Grep for `gateway(`, `gatewayAuth(`, `fetch(` in `.tsx` files |
| RQ-7 | No duplicate queries — same data fetched by parent AND child | Warning | Check if parent and child both call the same hook |
| RQ-8 | Error states handled — `isError` check or error boundary | Warning | Check that query errors are surfaced to the user |

---

## 2. Component Structure

| ID | Check | Severity | How to Verify |
|----|-------|----------|---------------|
| CS-1 | Components have a single primary responsibility | Info | Read the component — can you describe what it does in one sentence? |
| CS-2 | No prop drilling past 2 levels | Warning | Trace props — does a prop pass through a component that doesn't use it? |
| CS-3 | State is colocated with its consumer | Warning | Check if `useState` lives in the lowest component that uses it |
| CS-4 | Files under ~200 lines (heuristic) | Info | Count lines — look for sections that could be extracted |
| CS-5 | No dead code (unused imports, variables, components) | Warning | Check imports, variables, and exported functions for usage |
| CS-6 | No duplicated logic — shared patterns extracted to utilities | Info | Look for copy-pasted blocks across sibling components |

---

## 3. TypeScript

| ID | Check | Severity | How to Verify |
|----|-------|----------|---------------|
| TS-1 | No `any` without justification comment | Warning | Grep for `: any` or `as any` |
| TS-2 | API types imported from `~/types/generated` | Critical | Check for hand-defined interfaces that mirror API shapes |
| TS-3 | Minimal `as` assertions (prefer `satisfies` or type narrowing) | Info | Grep for ` as ` excluding `as const` |
| TS-4 | Discriminated unions for mutually exclusive state | Info | Look for related boolean flags (`isLoading`, `isError`) defined manually |
| TS-5 | No `module` as variable name — use `courseModule` | Warning | Grep for `const module` or `let module` |
| TS-6 | Function params and return types annotated | Info | Check exported functions for type annotations |

---

## 4. Next.js Patterns

| ID | Check | Severity | How to Verify |
|----|-------|----------|---------------|
| NX-1 | `"use client"` only on files that use hooks/events/browser APIs | Warning | Check each `"use client"` file uses `useState`/`useEffect`/events |
| NX-2 | Route has `loading.tsx` or parent `<Suspense>` | Warning | Check directory for `loading.tsx` |
| NX-3 | Route has `error.tsx` for graceful degradation | Info | Check directory for `error.tsx` |
| NX-4 | `useSearchParams()` wrapped in Suspense | Critical | Grep for `useSearchParams` — verify Suspense boundary exists |
| NX-5 | `redirect()` not inside try/catch | Critical | Grep for `redirect(` — verify it's outside try blocks |
| NX-6 | No `fetch("/api/...")` in Server Components | Warning | Grep for `fetch.*"/api` in non-client files |

---

## 5. Performance

| ID | Check | Severity | How to Verify |
|----|-------|----------|---------------|
| PF-1 | No unjustified `useMemo`/`useCallback`/`React.memo` | Info | Each instance must have a comment or clear justification |
| PF-2 | Heavy below-fold components use `next/dynamic` | Info | Check if chart/editor/modal components are lazy loaded |
| PF-3 | Rapidly-changing state isolated to smallest component | Warning | Check if input state re-renders large sibling trees |
| PF-4 | Independent data sections use separate Suspense boundaries | Info | Check if page awaits multiple unrelated fetches sequentially |

---

## 6. Andamio Conventions

| ID | Check | Severity | How to Verify |
|----|-------|----------|---------------|
| AC-1 | Uses `Andamio`-prefixed components from `~/components/andamio/` | Warning | Check imports — no direct `~/components/ui/` usage |
| AC-2 | Semantic colors only — no hardcoded `text-green-600` etc. | Warning | Grep for `text-(red\|green\|blue\|yellow\|orange\|purple\|pink)-` |
| AC-3 | Icons from `~/components/icons` — no direct `lucide-react` imports | Warning | Grep for `from "lucide-react"` |
| AC-4 | `AndamioText` for paragraphs — no raw `<p>` tags | Info | Grep for `<p ` or `<p>` in component JSX |
| AC-5 | Loading states use `AndamioLoading`/`AndamioSkeleton` | Info | Check if loading states use Andamio components |
| AC-6 | Empty states use `AndamioEmptyState` | Info | Check empty/null data rendering |

---

## Quick Severity Guide

| Severity | When to Use | Examples |
|----------|-------------|---------|
| **Critical** | Causes bugs, stale data, crashes, or security issues | RQ-3 (stale data), RQ-4 (undefined params), RQ-5 (desynced state), NX-4 (broken SSR), NX-5 (broken redirects) |
| **Warning** | Technical debt, maintainability issues, convention violations | RQ-1 (key drift), CS-2 (prop drilling), TS-1 (any), AC-1 (wrong imports) |
| **Info** | Could be better, educational opportunity | CS-4 (file size), PF-1 (memoization), TS-4 (discriminated unions) |

---

**Last Updated**: February 5, 2026
