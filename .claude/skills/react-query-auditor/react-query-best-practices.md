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

### staleTime vs gcTime

| Setting | Default | Purpose |
|---------|---------|---------|
| `staleTime` | 0 (instant) | How long until data is considered stale and eligible for background refetch |
| `gcTime` | 5 minutes | How long inactive query data stays in cache before garbage collection |

**Rule**: Adjust `staleTime` based on how often data changes. `gcTime` rarely needs changing.

```typescript
// Data that changes frequently (transactions, assignments)
useQuery({
  queryKey: ["assignments"],
  staleTime: 0, // Always refetch when needed (default)
});

// Data that changes rarely (course structure)
useQuery({
  queryKey: ["course", courseId],
  staleTime: 5 * 60 * 1000, // 5 minutes - reduce unnecessary refetches
});
```

### Background Refetching Triggers

React Query automatically refetches stale data when:

| Trigger | Default | Use Case |
|---------|---------|----------|
| `refetchOnWindowFocus` | `true` | User returns to tab after checking blockchain explorer |
| `refetchOnReconnect` | `true` | User's connection was temporarily lost |
| `refetchOnMount` | `true` | Component mounts and data is stale |
| `refetchInterval` | `false` | Polling for real-time updates (use sparingly) |

```typescript
// For blockchain data that may update externally
useQuery({
  queryKey: ["onchain", "course", courseId],
  refetchInterval: 30000, // Poll every 30 seconds
  refetchIntervalInBackground: false, // Don't poll when tab is hidden
});
```

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

### Pattern 2: Optimistic Updates (Instant Feedback)

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

### Pattern 3: Invalidate + Optimistic (Best of Both)

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

### Transaction Confirmation Flow

Blockchain transactions have delayed confirmation. Use this pattern:

```typescript
// 1. Optimistic update for immediate feedback
onMutate: () => {
  // Show "pending" state in UI
};

// 2. On TX submission success
onSuccess: (txHash) => {
  // Add to pending transactions list
  // Start watching for confirmation
};

// 3. On TX confirmation (via polling or websocket)
onTxConfirmed: () => {
  // Invalidate all affected queries
  queryClient.invalidateQueries({ queryKey: courseKeys.all });
};
```

### Role-Based Query Invalidation

Different user roles see different data. Invalidate all relevant role queries:

```typescript
// Student completes assignment
onSuccess: () => {
  // Invalidate student's view
  queryClient.invalidateQueries({ queryKey: studentCourseKeys.all });
  // Invalidate teacher's view (they see student progress)
  queryClient.invalidateQueries({ queryKey: teacherCourseKeys.commitments() });
};
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
