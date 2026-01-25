---
name: react-query-auditor
description: Audit React Query hooks for type safety, proper patterns, and cache management issues.
---

# React Query Auditor

Audit React Query (TanStack Query) hooks to ensure type safety, proper patterns, and correct cache management.

## Primary Goal: No Manual Refresh

> **Users should NEVER need to tap refresh to see the latest data.**

After any user action (mutation, transaction, navigation), the UI must automatically reflect the current state. This skill audits hooks to ensure:

1. **Mutations invalidate the right queries** - After updating data, related queries refetch automatically
2. **Blockchain transactions trigger updates** - After TX confirmation, affected data refreshes
3. **Cross-role updates work** - Teacher sees student progress; student sees teacher feedback
4. **Navigation shows fresh data** - Moving between pages doesn't show stale cache

See [react-query-best-practices.md](./react-query-best-practices.md) for patterns and solutions.

## Why This Matters

The issue that prompted this skill: `RequireCourseAccess` was checking `course_nft_policy_id` but the API returned `course_id`. This type mismatch caused "Access Denied" errors even when the API call succeeded.

React Query hooks are the bridge between API responses and UI components. Type mismatches here cause silent runtime bugs.

## Hook Locations

Hooks are organized by domain under `src/hooks/api/`:

### Course Hooks (`src/hooks/api/course/`)

| File | Purpose | Exports |
|------|---------|---------|
| `use-course.ts` | Course queries & mutations | `useCourse`, `usePublishedCourses`, `useOwnedCoursesQuery`, `useUpdateCourse`, `useDeleteCourse`, `courseKeys`; Types: `Course`, `CourseDetail`, `CourseSource` |
| `use-course-module.ts` | Module queries & mutations | `useCourseModules`, `useTeacherCourseModules`, `useCourseModule`, `useCourseModuleMap`, `useCreateCourseModule`, `useUpdateCourseModule`, `useUpdateCourseModuleStatus`, `useDeleteCourseModule`, `courseModuleKeys`; Types: `MergedCourseModule`, `ModuleSource` |
| `use-slt.ts` | SLT queries & mutations | `useSLTs`, `useCreateSLT`, `useUpdateSLT`, `useDeleteSLT`, `sltKeys` |
| `use-lesson.ts` | Lesson queries & mutations | `useLessons`, `useLesson`, `useCreateLesson`, `lessonKeys` |
| `use-teacher-courses.ts` | Teacher queries | `useTeacherCourses`, `useTeacherCommitments`, `useTeacherCoursesWithModules`, `useInvalidateTeacherCourses`, `teacherCourseKeys`; Types: `TeacherCourse`, `TeacherCoursesResponse`, `TeacherAssignmentCommitment`, `TeacherAssignmentCommitmentsResponse`, `TeacherCourseWithModules` |
| `use-student-courses.ts` | Student queries | `useStudentCourses`, `useInvalidateStudentCourses`, `studentCourseKeys`; Types: `StudentCourse`, `StudentCoursesResponse` |
| `use-owned-courses.ts` | Owned courses | `useOwnedCourses` |
| `use-module-wizard-data.ts` | Module wizard data | `useModuleWizardData` |

### Project Hooks (`src/hooks/api/project/`)

| File | Purpose | Exports |
|------|---------|---------|
| `use-project.ts` | Project queries | `useProject`, `useProjects`, `useInvalidateProjects`, `projectKeys` |
| `use-contributor-projects.ts` | Contributor queries | `useContributorProjects`, `useInvalidateContributorProjects`, `contributorProjectKeys`; Types: `ContributorProject`, `ContributorProjectsResponse` |
| `use-manager-projects.ts` | Manager queries | `useManagerProjects`, `useManagerCommitments`, `useInvalidateManagerProjects`, `managerProjectKeys`; Types: `ManagerProject`, `ManagerProjectsResponse`, `ManagerCommitment`, `ManagerCommitmentsResponse` |

### Centralized Exports

All hooks are re-exported from `src/hooks/api/index.ts` for convenient imports:

```typescript
import { useCourse, useCourseModules, useUpdateCourse, courseKeys } from "~/hooks/api";
```

## Audit Checklist

### 1. Type Safety

**Check that return types match generated API types:**

```typescript
// ✅ Correct - explicit return type from generated types
queryFn: async (): Promise<OrchestrationMergedCourseListItem[]> => {
  const result = await response.json() as MergedHandlersMergedCoursesResponse;
  return result.data ?? [];
}

// ❌ Wrong - inline interface that may drift from API
interface OwnedCourse {
  course_nft_policy_id: string | null;  // API now returns course_id!
}
```

**Audit command:**
```bash
# Find hooks with inline type definitions (potential drift)
grep -rn "interface.*{" src/hooks/api/course/ src/hooks/api/project/ | grep -v "import"
```

### 2. API Response Handling

**Check for both wrapped and raw response formats:**

```typescript
// ✅ Correct - handles both formats
const result = await response.json() as
  | OrchestrationMergedCourseListItem[]
  | MergedHandlersMergedCoursesResponse;

return Array.isArray(result) ? result : (result.data ?? []);
```

### 3. Query Keys

**Ensure consistent query key patterns:**

```typescript
// ✅ Correct - centralized key factory
export const courseKeys = {
  all: ["courses"] as const,
  lists: () => [...courseKeys.all, "list"] as const,
  detail: (id: string) => [...courseKeys.all, "detail", id] as const,
};
```

**Audit command:**
```bash
# Find all query key patterns
grep -rn "queryKey:" src/hooks/api/course/ src/hooks/api/project/
```

### 4. Cache Invalidation

**Check mutation onSuccess handlers invalidate correct keys:**

```typescript
// ✅ Correct - invalidates related queries
onSuccess: (_, variables) => {
  void queryClient.invalidateQueries({
    queryKey: courseKeys.detail(variables.courseNftPolicyId),
  });
  void queryClient.invalidateQueries({
    queryKey: courseKeys.lists(),
  });
},
```

### 5. Error Handling

**Check for proper error handling in queryFn:**

```typescript
// ✅ Correct - throws meaningful errors
if (!response.ok) {
  throw new Error(`Failed to fetch course: ${response.statusText}`);
}

// Also handle 404 as empty state when appropriate
if (response.status === 404) {
  return null;  // or return [] for lists
}
```

### 6. Enabled Conditions

**Check that queries are conditionally enabled:**

```typescript
// ✅ Correct - only runs when authenticated
return useQuery({
  queryKey: courseKeys.owned(),
  queryFn: async () => { ... },
  enabled: isAuthenticated,  // Don't run if not authenticated
});

// ✅ Correct - only runs when ID is provided
return useQuery({
  queryKey: courseKeys.detail(courseId ?? ""),
  queryFn: async () => { ... },
  enabled: !!courseId,  // Don't run if no ID
});
```

## UX Update Audit

When the UI doesn't update after an action, diagnose with this checklist:

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

## Running the Audit

### Quick Scan

```bash
# 1. Check for inline interfaces (potential type drift)
grep -rn "interface.*{" src/hooks/api/course/ src/hooks/api/project/ --include="*.ts"

# 2. Check for direct type assertions without generated types
grep -rn "as {" src/hooks/api/course/ src/hooks/api/project/ --include="*.ts"

# 3. Verify all hooks import from generated types
grep -rn "from \"~/types/generated\"" src/hooks/api/course/ src/hooks/api/project/

# 4. Check for missing error handling
grep -rn "response.json()" src/hooks/api/course/ src/hooks/api/project/ | grep -v "if.*response.ok"
```

### Deep Audit

For each hook file:

1. **List all return types** - verify they use generated types
2. **Check field access** - ensure field names match API response
3. **Verify cache invalidation** - mutations should invalidate related queries
4. **Check error boundaries** - errors should be meaningful

## Common Issues

### Issue 1: Field Name Mismatch

**Symptom:** API call succeeds (200) but data appears missing or access denied.

**Cause:** Code checks for field that doesn't exist in response.

**Fix:** Update to use correct field name from generated types.

### Issue 2: Missing Null Handling

**Symptom:** "Cannot read property X of undefined" errors.

**Cause:** API returns `null` but code doesn't handle it.

**Fix:** Add null checks and optional chaining.

### Issue 3: Stale Cache

**Symptom:** Data doesn't update after mutation.

**Cause:** Mutation doesn't invalidate the right query keys.

**Fix:** Add proper `invalidateQueries` calls in `onSuccess`.

### Issue 4: Race Conditions

**Symptom:** Inconsistent data display, especially on navigation.

**Cause:** Query runs before required data is available.

**Fix:** Add proper `enabled` conditions.

## Integration with Type Generation

When the API changes:

1. Run `npm run generate:types` to update generated types
2. Run this audit to catch mismatches
3. TypeScript will catch most issues, but field renames need manual review

## Supporting Documentation

- **[react-query-best-practices.md](./react-query-best-practices.md)** - Detailed patterns for cache invalidation, optimistic updates, and blockchain TX flows

## Related Skills

- **transaction-auditor**: Syncs TX schemas when API changes
- **audit-api-coverage**: Tracks which endpoints are implemented
- **tx-loop-guide**: Test transaction flows end-to-end
