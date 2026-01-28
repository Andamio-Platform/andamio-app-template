---
name: react-query-auditor
description: Audit React Query hooks for type safety, proper patterns, and cache management issues.
---

# React Query Auditor

Diagnose and fix React Query runtime issues: stale data, missing updates, cache problems.

## When to Use This Skill

| Symptom | Use This Skill |
|---------|---------------|
| UI doesn't update after mutation | Yes - check cache invalidation |
| Data flickers or reverts | Yes - check race conditions |
| Stale data after navigation | Yes - check query keys |
| UI doesn't update after TX | Yes - check TX confirmation handler |

**For hook structure issues** (types, transformers, file organization), use `/hooks-architect` instead.

## Primary Goal: No Manual Refresh

> **Users should NEVER need to tap refresh to see the latest data.**

After any user action (mutation, transaction, navigation), the UI must automatically reflect the current state.

## Relationship with /hooks-architect

These skills are complementary:

| Concern | Skill |
|---------|-------|
| Hook file structure | `/hooks-architect` |
| Colocated types | `/hooks-architect` |
| Transform functions | `/hooks-architect` |
| Creating new hooks | `/hooks-architect` |
| **Cache invalidation** | **This skill** |
| **Stale data debugging** | **This skill** |
| **UX update issues** | **This skill** |
| **Query key matching** | **This skill** |

## Quick Diagnosis

### Symptom: UI doesn't update after mutation

**Check 1: Is the mutation invalidating queries?**
```typescript
// Look for onSuccess/onSettled callbacks
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ... });
}
```

**Check 2: Are ALL related queries invalidated?**
```typescript
// Updating a course should invalidate:
// - The specific course detail
// - Any list that contains courses
// - Related data (modules, SLTs if they embed course info)
onSuccess: (_, variables) => {
  queryClient.invalidateQueries({ queryKey: courseKeys.detail(variables.courseId) });
  queryClient.invalidateQueries({ queryKey: courseKeys.lists() }); // Don't forget lists!
};
```

**Check 3: Are query keys matching?**
```typescript
// Mutation uses: courseKeys.detail("abc123")
// Query uses: ["courses", "detail", "abc123"]
// These must match exactly for invalidation to work
```

### Symptom: UI doesn't update after blockchain transaction

**Check 1: Is there a TX confirmation handler?**
```typescript
// TX flow should have: submit -> watch -> confirm -> invalidate
onTxConfirmed: (txHash) => {
  queryClient.invalidateQueries({ queryKey: affectedKeys });
};
```

**Check 2: Are on-chain AND off-chain queries invalidated?**
```typescript
// Blockchain TX may affect both:
queryClient.invalidateQueries({ queryKey: studentCourseKeys.all }); // Off-chain
queryClient.invalidateQueries({ queryKey: ["onchain", "courses"] }); // On-chain
```

### Symptom: Other user's view doesn't update

**Check: Are cross-role queries invalidated?**
```typescript
// Student submits assignment -> Teacher should see it
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: studentCourseKeys.assignments() });
  queryClient.invalidateQueries({ queryKey: teacherCourseKeys.commitments() }); // Teacher's view!
};
```

### Symptom: Data flickers or reverts

**Check: Race condition with optimistic updates**
```typescript
// Cancel outgoing refetches before optimistic update
onMutate: async () => {
  await queryClient.cancelQueries({ queryKey });
  // ... optimistic update
};
```

## Audit Checklist

### 1. Cache Invalidation

For each mutation, verify:
- [ ] `onSuccess` invalidates the specific entity
- [ ] `onSuccess` invalidates related lists
- [ ] Cross-role queries are invalidated if applicable
- [ ] Uses `void` prefix for fire-and-forget invalidation

### 2. Query Keys

For each hook file, verify:
- [ ] Keys factory is exported (`courseKeys`, `taskKeys`, etc.)
- [ ] Keys use `as const` for type safety
- [ ] Keys follow hierarchy: `all` → `lists()` → `detail(id)`
- [ ] Mutation invalidation uses the same key factory

### 3. Enabled Conditions

For each query, verify:
- [ ] Auth queries have `enabled: isAuthenticated`
- [ ] Detail queries have `enabled: !!id`
- [ ] Dependent queries wait for parent data

### 4. Error Handling

For each queryFn, verify:
- [ ] Non-OK responses throw meaningful errors
- [ ] 404 returns `null` or `[]` (doesn't throw)
- [ ] Network errors are distinguishable from API errors

## Quick Scan Commands

```bash
# Find all query key patterns
grep -rn "queryKey:" src/hooks/api/

# Find mutations without onSuccess
grep -rn "useMutation" src/hooks/api/ -A 10 | grep -B 5 "mutationFn" | grep -v "onSuccess"

# Find invalidateQueries calls
grep -rn "invalidateQueries" src/hooks/api/

# Check for missing enabled conditions
grep -rn "useQuery" src/hooks/api/ -A 5 | grep -v "enabled"
```

## Common Issues

### Issue 1: Missing List Invalidation

**Symptom:** Detail page updates, but list page shows old data.

**Cause:** Mutation only invalidates detail key, not list keys.

**Fix:**
```typescript
onSuccess: (_, variables) => {
  void queryClient.invalidateQueries({ queryKey: entityKeys.detail(variables.id) });
  void queryClient.invalidateQueries({ queryKey: entityKeys.lists() }); // Add this!
};
```

### Issue 2: Query Key Mismatch

**Symptom:** Invalidation doesn't trigger refetch.

**Cause:** Hardcoded key doesn't match key factory.

**Fix:** Always use the exported key factory:
```typescript
// ❌ Wrong
queryClient.invalidateQueries({ queryKey: ["courses", "detail", id] });

// ✅ Correct
queryClient.invalidateQueries({ queryKey: courseKeys.detail(id) });
```

### Issue 3: Missing TX Invalidation

**Symptom:** Blockchain TX succeeds but UI doesn't update.

**Cause:** TX confirmation handler doesn't invalidate queries.

**Fix:** Add invalidation in TX component's `onTxConfirmed`:
```typescript
const { invalidateAll } = useInvalidateCourses();

// After TX confirms
invalidateAll();
```

### Issue 4: Stale Closure in Callback

**Symptom:** Callback uses old state values.

**Cause:** Callback captures stale closure.

**Fix:** Use refs for values needed in callbacks:
```typescript
const dataRef = useRef(data);
useEffect(() => { dataRef.current = data; }, [data]);

const callback = useCallback(() => {
  // Use dataRef.current instead of data
}, []); // Empty deps, uses ref
```

## Hook Reference

For the complete list of hooks and their exports, see `/hooks-architect reference`.

Current hooks:
- **Course**: 10 hook files (COMPLETE)
- **Project**: 3 hook files (IN PROGRESS)

## Related Skills

| Skill | When to Use |
|-------|-------------|
| `/hooks-architect` | Hook structure, types, creating hooks |
| `/transaction-auditor` | TX schema sync with gateway |
| `/issue-handler` | Route errors to correct repo |
| `/tx-loop-guide` | Test transaction flows end-to-end |

## Supporting Documentation

- **[react-query-best-practices.md](./react-query-best-practices.md)** - Detailed patterns for cache invalidation, optimistic updates, and blockchain TX flows

---

**Last Updated**: January 28, 2026
