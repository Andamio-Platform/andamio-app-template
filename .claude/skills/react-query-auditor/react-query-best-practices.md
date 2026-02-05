# React Query Best Practices

> Supporting documentation for the `/react-query-auditor` skill.
> Focus: Ensuring UX updates automatically without manual refresh.

## The Core Problem

Users should **never need to tap refresh** to see the latest data after:
- Completing a transaction (mutation)
- Another user/process updates data
- Blockchain state changes

React Query solves this through cache invalidation, background refetching, and optimistic updates.

## Key Concepts

### Andamio QueryClient Configuration

The app configures global defaults in `src/trpc/query-client.ts`:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // 5 minutes — data stays fresh
      gcTime: 1000 * 60 * 30,         // 30 minutes — cache retention
      refetchOnWindowFocus: false,     // Disabled — rely on explicit invalidation
      retry: 1,                        // Single retry on failure
    },
  },
});
```

**Why `refetchOnWindowFocus: false`**: Andamio relies on explicit cache invalidation after mutations and transactions rather than automatic background refetching. This reduces API load and prevents unexpected refetches that could conflict with optimistic local state (e.g., unsaved draft edits in the module wizard).

**Why `staleTime: 5 minutes`**: With 30+ queries across a typical session, the default `0` would trigger refetches on every navigation. The 5-minute window balances freshness with performance.

### staleTime vs gcTime

| Setting | Andamio Default | Purpose |
|---------|-----------------|---------|
| `staleTime` | 5 minutes | How long until data is considered stale and eligible for background refetch |
| `gcTime` | 30 minutes | How long inactive query data stays in cache before garbage collection |

**When to override per-query**: Set a per-query `staleTime` when the data profile differs from the default:

| Data Type | staleTime | Example |
|-----------|-----------|---------|
| Real-time (TX status) | `0` | Pending transaction list |
| User-mutable | `5 min` (default) | Courses, modules, assignments |
| Reference/config | `30 min` | Category lists, feature flags |
| Immutable | `Infinity` | Confirmed blockchain TX history |

### Background Refetching Triggers

| Trigger | Andamio Setting | Why |
|---------|-----------------|-----|
| `refetchOnWindowFocus` | **`false`** | Explicit invalidation preferred |
| `refetchOnReconnect` | `true` (default) | Restore data after network loss |
| `refetchOnMount` | `true` (default) | Fetch on first mount if stale |
| `refetchInterval` | Not used | No polling — use SSE for real-time |

### React Query v5 Features in Use

**`keepPreviousData`**: Used in `use-course-module.ts` to maintain previous data while switching between modules, preventing layout flash:

```typescript
import { keepPreviousData } from "@tanstack/react-query";

useQuery({
  queryKey: courseModuleKeys.detail(courseId, moduleCode),
  queryFn: () => fetchModule(courseId, moduleCode),
  placeholderData: keepPreviousData, // v5 syntax
});
```

**SuperJSON serialization**: Used for SSR hydration/dehydration in `query-client.ts` to handle Date objects and other non-JSON-safe types across the server/client boundary.

## Cache Invalidation Patterns

### Pattern 1: Invalidate After Mutation (Most Common)

When a mutation succeeds, invalidate related queries so they refetch.

```typescript
const updateCourse = useMutation({
  mutationFn: async (data) => {
    return await api.updateCourse(data);
  },
  onSuccess: (_, variables) => {
    // Invalidate the specific course
    queryClient.invalidateQueries({
      queryKey: courseKeys.detail(variables.courseId),
    });
    // Invalidate course lists (they contain this course)
    queryClient.invalidateQueries({
      queryKey: courseKeys.lists(),
    });
  },
});
```

**What happens on invalidation:**
1. Query is marked as stale (ignores `staleTime`)
2. If query is currently rendered, it refetches in background
3. If query is inactive, it refetches on next use

### Pattern 2: Optimistic Updates (Advanced — Not Currently Used)

> **Note**: The Andamio codebase uses **invalidation-only** (Pattern 1) for all mutations. Optimistic updates are documented here as a reference for future use when instant UI feedback becomes necessary (e.g., toggle switches, drag-and-drop reordering).

Update the cache immediately, before the server responds. Roll back on error.

```typescript
const toggleComplete = useMutation({
  mutationFn: async ({ taskId, completed }) => {
    return await api.updateTask(taskId, { completed });
  },
  onMutate: async ({ taskId, completed }) => {
    // 1. Cancel outgoing refetches (prevent overwrite)
    await queryClient.cancelQueries({ queryKey: taskKeys.detail(taskId) });

    // 2. Snapshot previous value (for rollback)
    const previousTask = queryClient.getQueryData(taskKeys.detail(taskId));

    // 3. Optimistically update cache
    queryClient.setQueryData(taskKeys.detail(taskId), (old) => ({
      ...old,
      completed,
    }));

    // 4. Return context for rollback
    return { previousTask };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(
      taskKeys.detail(variables.taskId),
      context?.previousTask
    );
  },
  onSettled: (_, __, variables) => {
    // Always refetch after mutation settles
    queryClient.invalidateQueries({
      queryKey: taskKeys.detail(variables.taskId),
    });
  },
});
```

### Pattern 3: Invalidate + Optimistic (Advanced — Not Currently Used)

> **Note**: Same status as Pattern 2 — documented for reference, not currently implemented.

Combine optimistic updates with invalidation for instant feedback AND data accuracy.

```typescript
onMutate: async (newData) => {
  // Optimistic update for instant UI feedback
  queryClient.setQueryData(queryKey, (old) => ({ ...old, ...newData }));
},
onSettled: () => {
  // Always invalidate to get real server data
  queryClient.invalidateQueries({ queryKey });
},
```

### Pattern 4: Blockchain Transaction Flow

For transactions that hit the blockchain, use a multi-stage invalidation:

```typescript
const submitTransaction = useMutation({
  mutationFn: async (txData) => {
    // 1. Build transaction
    const unsignedTx = await api.buildTx(txData);
    // 2. Sign with wallet
    const signedTx = await wallet.signTx(unsignedTx);
    // 3. Submit to blockchain
    const txHash = await wallet.submitTx(signedTx);
    return txHash;
  },
  onSuccess: (txHash) => {
    // Immediate: Invalidate pending transactions
    queryClient.invalidateQueries({ queryKey: ["pending-tx"] });

    // Start polling for confirmation
    startTxConfirmationPolling(txHash, () => {
      // On confirmation: Invalidate affected data
      queryClient.invalidateQueries({ queryKey: courseKeys.all });
      queryClient.invalidateQueries({ queryKey: studentCourseKeys.all });
    });
  },
});
```

## Query Key Factory Pattern

Centralized query keys enable precise invalidation.

```typescript
export const courseKeys = {
  all: ["courses"] as const,
  lists: () => [...courseKeys.all, "list"] as const,
  owned: () => [...courseKeys.lists(), "owned"] as const,
  published: () => [...courseKeys.lists(), "published"] as const,
  detail: (id: string) => [...courseKeys.all, "detail", id] as const,
  modules: (courseId: string) => [...courseKeys.detail(courseId), "modules"] as const,
};
```

**Fuzzy matching**: Invalidating `courseKeys.all` invalidates ALL course queries.

```typescript
// Invalidate everything course-related
queryClient.invalidateQueries({ queryKey: courseKeys.all });

// Invalidate only lists (owned + published)
queryClient.invalidateQueries({ queryKey: courseKeys.lists() });

// Invalidate one specific course
queryClient.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
```

## Common Pitfalls

### 1. Forgetting to Invalidate Related Queries

**Problem**: Updated a course, but the course list still shows old data.

```typescript
// Wrong - only invalidates detail
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
};

// Correct - invalidates detail AND lists
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
  queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
};
```

### 2. Over-Invalidation

**Problem**: Invalidating too broadly causes unnecessary refetches.

```typescript
// Wrong - invalidates EVERYTHING
onSuccess: () => {
  queryClient.invalidateQueries(); // No filter!
};

// Correct - only invalidate what changed
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
};
```

### 3. Race Conditions with Concurrent Mutations

**Problem**: Two rapid mutations cause UI to flicker.

```typescript
// Check if other mutations are in-flight before invalidating
onSettled: () => {
  // Only invalidate if this is the last mutation
  if (queryClient.isMutating() === 1) {
    queryClient.invalidateQueries({ queryKey });
  }
};
```

### 4. Not Handling Enabled Conditions

**Problem**: Query runs before required data is available.

```typescript
// Wrong - runs immediately, courseId might be undefined
const { data } = useQuery({
  queryKey: courseKeys.detail(courseId),
  queryFn: () => fetchCourse(courseId),
});

// Correct - only runs when courseId exists
const { data } = useQuery({
  queryKey: courseKeys.detail(courseId ?? ""),
  queryFn: () => fetchCourse(courseId!),
  enabled: !!courseId,
});
```

### 5. Stale Closure in Callbacks

**Problem**: Callback uses stale variable values.

```typescript
// Wrong - courseId might be stale
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
};

// Correct - use variables from mutation
onSuccess: (_, variables) => {
  queryClient.invalidateQueries({ queryKey: courseKeys.detail(variables.courseId) });
};
```

## Debugging Tips

### 1. Use React Query DevTools

```typescript
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// Add to app
<ReactQueryDevtools initialIsOpen={false} />
```

Shows:
- All cached queries and their state (fresh/stale/fetching)
- When queries were last updated
- What data is in the cache

### 2. Check Network Tab

After a mutation, you should see:
1. The mutation request (POST/PUT/DELETE)
2. Refetch requests for invalidated queries (GET)

If you don't see refetch requests, invalidation isn't working.

### 3. Log Invalidations

```typescript
onSuccess: () => {
  console.log("Invalidating:", courseKeys.detail(courseId));
  queryClient.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
};
```

## Andamio-Specific Patterns

### Role-Based Query Key Namespaces

Andamio uses separate query key namespaces per user role. This enables precise cache management — a student action invalidates student views, and optionally cross-invalidates teacher views.

```typescript
// Course domain — 4 role-based key factories
courseKeys.all               // ["courses"] — public/shared
courseOwnerKeys.all           // ["courses", "owner"]
courseTeacherKeys.all         // ["courses", "teacher"]
courseStudentKeys.all         // ["courses", "student"]

// Project domain — 3 role-based key factories
projectKeys.all              // ["projects"] — public/shared
projectManagerKeys.all       // ["projects", "manager"]
projectContributorKeys.all   // ["projects", "contributor"]
```

**Cross-role invalidation**: When a student action affects what a teacher sees:

```typescript
// Student completes assignment
onSuccess: () => {
  // Invalidate student's view
  void queryClient.invalidateQueries({ queryKey: courseStudentKeys.all });
  // Invalidate teacher's view (they see student progress)
  void queryClient.invalidateQueries({ queryKey: courseTeacherKeys.commitments() });
};
```

### Transaction Confirmation Flow

Blockchain transactions have delayed confirmation. The TX lifecycle uses dedicated hooks in `src/hooks/tx/` (NOT the API hooks in `src/hooks/api/`):

1. **`useTransaction()`** — Builds, signs, and submits the TX
2. **`useTxStream()`** / **`useTxWatcher()`** — Watches for on-chain confirmation via SSE or polling
3. **On confirmation** — Components invalidate affected API queries

```typescript
// In a transaction component (e.g., MintAccessToken)
const { invalidateAll: invalidateStudentCourses } = useInvalidateStudentCourses();

// After TX confirms (in the useTxStream callback)
onTxConfirmed: () => {
  invalidateStudentCourses(); // Refresh API data to reflect on-chain change
};
```

**Key distinction**: API hooks handle database state (CRUD). TX hooks handle blockchain state. After a TX confirms, the TX component explicitly invalidates the relevant API query caches.

### Error Handling Strategy

The codebase currently uses **`onSuccess`** callbacks for cache invalidation. Mutations do NOT use `onError` or `onSettled` handlers.

**Current approach**:
- Gateway errors throw and are caught by component-level error handling
- 404 responses return `null` or `[]` (don't throw)
- Network errors are distinguishable from API errors via `isGatewayError()` utility

**Recommended improvement** (not yet implemented):
```typescript
// Add global error handler for background refetch failures
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.state.data !== undefined) {
        toast.error(`Background update failed: ${error.message}`);
      }
    },
  }),
});
```

### DevTools

React Query DevTools are **not currently configured**. To add for debugging:

```typescript
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
// Add inside TRPCReactProvider
<ReactQueryDevtools initialIsOpen={false} />
```

## Sources

- [Query Invalidation | TanStack Query Docs](https://tanstack.com/query/v5/docs/framework/react/guides/query-invalidation)
- [Optimistic Updates | TanStack Query Docs](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
- [Important Defaults | TanStack Query Docs](https://tanstack.com/query/v4/docs/framework/react/guides/important-defaults)
- [Practical React Query | TkDodo's blog](https://tkdodo.eu/blog/practical-react-query)
- [Mastering Mutations in React Query | TkDodo's blog](https://tkdodo.eu/blog/mastering-mutations-in-react-query)
- [Automatic Query Invalidation after Mutations | TkDodo's blog](https://tkdodo.eu/blog/automatic-query-invalidation-after-mutations)
- [Concurrent Optimistic Updates in React Query | TkDodo's blog](https://tkdodo.eu/blog/concurrent-optimistic-updates-in-react-query)
- [React Query Cache Invalidation | Stackademic](https://medium.com/@kennediowusu/react-query-cache-invalidation-why-your-mutations-work-but-your-ui-doesnt-update-a1ad23bc7ef1)
