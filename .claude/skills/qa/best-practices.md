# QA Best Practices Reference

> Detailed best practices with examples and educational "why" explanations.
> Read [checklist.md](./checklist.md) for the compact per-file checklist.

---

## 1. React Query & Data Fetching

### RQ-1: Use query key factories — never inline query keys

**Rule**: No component or hook file should contain a hardcoded `queryKey: ["string", ...]` array. All query keys must come from a factory object.

```typescript
// BAD: Inline keys scattered across components
useQuery({ queryKey: ["courses", "list"], queryFn: fetchCourses });

// GOOD: Factory-based (this is the Andamio pattern)
export const courseKeys = {
  all: ["courses"] as const,
  lists: () => [...courseKeys.all, "list"] as const,
  detail: (id: string) => [...courseKeys.all, "detail", id] as const,
};
useQuery({ queryKey: courseKeys.lists(), queryFn: fetchCourses });
```

**Why**: Factory objects create a single source of truth for keys, prevent typo-induced cache misses, and enable hierarchical invalidation (invalidate all lists without touching details).

### RQ-2: Set explicit `staleTime` — never rely on default (0)

**Rule**: Every query definition should include an explicit `staleTime`. The default of `0` means every query is immediately stale, triggering background refetches on every mount.

| Data type | Recommended staleTime |
|---|---|
| Real-time (chat, notifications) | `0` (with comment) |
| User-mutable (courses, assignments) | `2-5 minutes` |
| Reference data (categories, config) | `10-30 minutes` |
| Static (blockchain tx history) | `Infinity` |

**Why**: With the default `staleTime: 0` and dozens of queries, every navigation triggers unnecessary refetches. Setting intentional values reduces API load and improves perceived performance.

### RQ-3: Mutations must invalidate related queries

**Rule**: Every `useMutation` that modifies server state must invalidate the affected queries using the key factory.

```typescript
// BAD: No invalidation
const mutation = useMutation({ mutationFn: updateCourse });

// GOOD: Invalidate detail + lists
const mutation = useMutation({
  mutationFn: updateCourse,
  onSuccess: () => {
    void queryClient.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
    void queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
  },
});
```

**Why**: Without invalidation, users see stale data after mutations and must manually refresh. This is the #1 source of "UI didn't update" bugs.

### RQ-4: Use `enabled` for dependent queries

**Rule**: Any query whose `queryFn` requires a value from another query must include `enabled: !!dependentValue`.

```typescript
// BAD: Fires with undefined userId
const { data: courses } = useQuery(courseQueries.listByUser(userId));

// GOOD: Waits for userId
const { data: courses } = useQuery({
  ...courseQueries.listByUser(userId!),
  enabled: !!userId,
});
```

**Why**: Without `enabled`, the query fires immediately with `undefined`, gets cached under a bad key, and may return incorrect data.

### RQ-5: Never copy server state into local state

**Rule**: If a component calls `useQuery` and then uses `useState` to store the same data, that is a violation.

```typescript
// BAD: Severs connection to cache
const { data: course } = useCourse(id);
const [courseData, setCourseData] = useState(course);

// GOOD: Read directly from query, local state for drafts only
const { data: course } = useCourse(id);
const [draftTitle, setDraftTitle] = useState("");
```

**Why**: Copying severs the connection to the query cache — background refetches update the cache but the stale `useState` persists, showing outdated data.

### RQ-6: Components must use hooks, never call gateway directly

**Rule**: No component (`.tsx`) should import from `~/lib/gateway` or call `fetch()` directly. All API access goes through hooks in `~/hooks/api/`.

```typescript
// BAD: Direct API call in component
import { gateway } from "~/lib/gateway";
const data = await gateway<Course[]>("/api/v2/course/list");

// GOOD: Use the hook
import { useCourses } from "~/hooks/api";
const { data } = useCourses();
```

**Why**: Hooks provide caching, loading states, error handling, and type transformation. Direct calls bypass all of this.

---

## 2. Component Structure

### CS-1: Extract when there are multiple axes of change

**Rule**: Extract a component when it: (a) is used in more than one place, OR (b) manages its own state independently, OR (c) has a clearly distinct responsibility.

Do NOT extract single-use components with no internal state — that's over-extraction.

```typescript
// BAD: Over-extraction (3-line component, used once, no state)
// components/course-title.tsx
export function CourseTitle({ title }: { title: string }) {
  return <h1>{title}</h1>;
}

// GOOD: Cohesive component with clear responsibility
function CourseHeader({ course }: { course: Course }) {
  return (
    <div>
      <h1>{course.title}</h1>
      <AndamioText variant="muted">{course.description}</AndamioText>
      <Separator />
    </div>
  );
}
```

**Why**: Over-extraction creates navigational overhead (jumping between files) and false abstraction. Under-extraction creates god components. Extract at the boundary of responsibility.

### CS-2: Composition over prop drilling

**Rule**: If a prop passes through more than 2 components that don't use it, refactor to use composition or let the consumer fetch its own data.

```typescript
// BAD: userId drills through 3 components
<Page userId={userId}>
  <Layout userId={userId}>
    <Sidebar userId={userId}>
      <UserAvatar userId={userId} />

// GOOD: Consumer fetches its own data
function UserAvatar() {
  const { data: user } = useCurrentUser();
  return <Avatar src={user?.avatarUrl} />;
}
```

**Why**: Prop drilling couples intermediate components to data they don't use, creating a change cascade when the prop changes.

### CS-3: Colocate state with its consumer

**Rule**: `useState` should be declared in the lowest component that reads or writes the value. If state is only used in one subtree, it must not live in a parent.

```typescript
// BAD: Filter state re-renders Header and Sidebar
function Page() {
  const [filters, setFilters] = useState({});
  return (
    <>
      <Header />
      <Sidebar />
      <FilterPanel filters={filters} onChange={setFilters} />
      <CourseList filters={filters} />
    </>
  );
}

// GOOD: Isolated to consumers
function CoursesContent() {
  const [filters, setFilters] = useState({});
  return (
    <>
      <FilterPanel filters={filters} onChange={setFilters} />
      <CourseList filters={filters} />
    </>
  );
}
```

**Why**: State declared too high causes unnecessary re-renders of every sibling when that state changes.

### CS-4: Components over 200 lines likely need extraction

**Rule**: If a component file exceeds ~200 lines, look for internal sections that could be extracted. This is a heuristic, not absolute — some complex components are fine at 250 lines if they have a single responsibility.

### CS-5: No dead code — remove unused imports, variables, and components

**Rule**: Every import must be used. Every variable must be read. Every exported component must be imported somewhere. Dead code is noise.

---

## 3. TypeScript

### TS-1: Zero tolerance for `any`

**Rule**: No `any` without a justification comment. Use `unknown` for truly dynamic data and narrow with type guards.

```typescript
// BAD
function parse(data: any) { return data.name; }

// GOOD
function parse(data: unknown): string {
  if (typeof data === "object" && data !== null && "name" in data) {
    return (data as { name: string }).name;
  }
  throw new Error("Invalid shape");
}
```

**Why**: `any` disables type checking and is contagious — any value assigned from `any` becomes `any` itself.

### TS-2: Import types from `~/types/generated` — never hand-define API types

**Rule**: No file outside of `~/types/generated` should contain `type` or `interface` definitions that describe API response shapes.

**Why**: Hand-defined types drift from the API contract. Generated types are the single source of truth.

### TS-3: Use `satisfies` for configs, annotations for functions

**Rule**: `satisfies` for object literals that need validation + literal inference (config maps, route defs). Type annotations (`:`) for function parameters and return types. Minimize `as` assertions.

```typescript
// GOOD: satisfies preserves literal types
const routes = { home: "/", dashboard: "/dashboard" } satisfies Record<string, string>;

// GOOD: annotation for function contracts
function fetchCourse(id: string): Promise<Course> { ... }

// BAD: as bypasses validation
const config = { timeout: "oops" } as ApiConfig;
```

### TS-4: Use discriminated unions for mutually exclusive state

**Rule**: When a component has mutually exclusive states (loading/error/success), use a discriminated union — not independent boolean flags.

```typescript
// BAD: 2^3 = 8 states, most invalid
type State = { isLoading: boolean; isError: boolean; data?: User };

// GOOD: 3 valid states
type State =
  | { status: "loading" }
  | { status: "error"; error: Error }
  | { status: "success"; data: User };
```

**Why**: Independent booleans create impossible states. Discriminated unions make invalid states unrepresentable.

### TS-5: Never use `module` as a variable name

**Rule**: `module` is reserved. Use `courseModule` instead. This is an Andamio-specific rule documented in CLAUDE.md.

---

## 4. Next.js Patterns

### NX-1: Push `"use client"` to the leaf level

**Rule**: Every file with `"use client"` must use at least one of: `useState`, `useReducer`, `useEffect`, `useRef` with DOM mutation, event handlers, or browser APIs. If it doesn't, the directive is unnecessary.

```typescript
// BAD: "use client" at page level because one child needs onClick
"use client";
export default function ProductPage() {
  return (
    <div>
      <StaticContent />
      <InteractiveButton />
    </div>
  );
}

// GOOD: Only the interactive part is client
import { InteractiveButton } from "./interactive-button"; // "use client" lives here
export default function ProductPage() {
  return (
    <div>
      <StaticContent />
      <InteractiveButton />
    </div>
  );
}
```

**Why**: `"use client"` converts the entire subtree to client JS. Push it down to minimize bundle size.

### NX-2: Data-fetching routes need `loading.tsx` or `<Suspense>`

**Rule**: Every route directory with a `page.tsx` that fetches data must have either `loading.tsx` or a parent `<Suspense>` boundary.

**Why**: Without a loading boundary, the entire route blocks until all data resolves. Users see a blank screen.

### NX-3: Critical routes need `error.tsx`

**Rule**: At minimum, `app/error.tsx` and `app/global-error.tsx` must exist. High-traffic route segments should have their own.

**Why**: Without error boundaries, a single failed API call crashes the entire page.

### NX-4: `useSearchParams()` requires a Suspense boundary

**Rule**: Every component using `useSearchParams()` must be wrapped in `<Suspense>`.

**Why**: Without Suspense, `useSearchParams()` opts the entire page into client-side rendering.

### NX-5: Never call `redirect()` inside try/catch

**Rule**: `redirect()` works by throwing a special error. If caught, the redirect silently fails.

```typescript
// BAD
try {
  const user = await getUser();
  if (!user) redirect("/login"); // Caught by catch!
} catch (e) { ... }

// GOOD
const user = await getUser().catch(() => null);
if (!user) redirect("/login");
```

---

## 5. Performance

### PF-1: No defensive memoization

**Rule**: Do NOT add `useMemo`/`useCallback`/`React.memo` by default. React 19's compiler handles this. Only add when:
- Profiling shows a bottleneck
- A third-party library requires referential stability
- An expensive computation (>1ms) is documented with a comment

**Why**: Manual memoization adds cognitive overhead and can hurt performance due to cache management costs. React 19's compiler memoizes automatically.

### PF-2: Use `next/dynamic` for heavy below-fold components

**Rule**: Components behind user interaction (modals, tabs) that import heavy dependencies (chart libraries, editors) should use dynamic imports.

```typescript
const AnalyticsChart = dynamic(() => import("~/components/analytics-chart"), {
  loading: () => <ChartSkeleton />,
});
```

**Why**: Reduces initial bundle size. Users only download the code they need.

### PF-3: Isolate rapidly-changing state

**Rule**: If `useState` setter fires frequently (input keystrokes, drag), keep it in the smallest possible component to limit re-render blast radius.

### PF-4: Use independent Suspense boundaries for parallel data

**Rule**: When a page has multiple independent async data needs, each should be in its own `<Suspense>` boundary.

```typescript
// BAD: Sequential waterfall
const courses = await getCourses();     // 500ms
const analytics = await getAnalytics(); // 500ms
// Total: 1000ms

// GOOD: Parallel streaming
<Suspense fallback={<CoursesSkeleton />}>
  <CourseList />
</Suspense>
<Suspense fallback={<AnalyticsSkeleton />}>
  <Analytics />
</Suspense>
// Total: 500ms (parallel)
```

---

## 6. Andamio Conventions

### AC-1: Use Andamio design system components

**Rule**: Import from `~/components/andamio/`, not `~/components/ui/` directly. Use `Andamio`-prefixed components.

### AC-2: Semantic colors only

**Rule**: Never hardcode colors (`text-green-600`, `bg-blue-500`). Use semantic tokens: `primary`, `secondary`, `muted`, `destructive`, `success`, `warning`, `info`.

### AC-3: Icons from `~/components/icons`

**Rule**: Never import directly from `lucide-react`. Use semantic icon imports from `~/components/icons`.

### AC-4: `AndamioText` for text content

**Rule**: Use `<AndamioText>` for paragraphs, not raw `<p>` tags.

### AC-5: Variable naming — `courseModule` not `module`

**Rule**: `module` is reserved in JS/TS. Always use explicit domain-prefixed names.

---

**Last Updated**: February 5, 2026
