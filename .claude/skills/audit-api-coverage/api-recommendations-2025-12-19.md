# API Recommendations - December 19, 2025

> **Phase 2 Analysis: Query Optimization and API Improvements**

This document summarizes findings from the Phase 2 API audit and provides recommendations for improving the Andamio Database API and T3 App integration.

---

## Executive Summary

| Metric | Value |
|--------|-------|
| React Query Hooks Created | 4 new hook files (15+ hooks) |
| Components Migrated | 1 (demo: course detail page) |
| Redundant Query Patterns Found | 12+ locations |
| Estimated Request Reduction | 40-60% with full migration |

---

## New React Query Hooks Created

Located in `src/hooks/api/`:

### Course Hooks (`use-course.ts`)
- `useCourse(courseNftPolicyId)` - Fetch single course (cached)
- `usePublishedCourses()` - Fetch all published courses
- `useOwnedCoursesQuery()` - Fetch owned courses (authenticated)
- `useUpdateCourse()` - Mutation with cache invalidation
- `useDeleteCourse()` - Mutation with cache removal

### Course Module Hooks (`use-course-module.ts`)
- `useCourseModules(courseNftPolicyId)` - List modules (cached)
- `useCourseModule(courseNftPolicyId, moduleCode)` - Single module
- `useCourseModuleMap(courseCodes)` - Batch module counts
- `useCreateCourseModule()` - Create with invalidation
- `useUpdateCourseModule()` - Update with invalidation
- `useUpdateCourseModuleStatus()` - Status update

### SLT Hooks (`use-slt.ts`)
- `useSLTs(courseNftPolicyId, moduleCode)` - List SLTs (cached)
- `useCreateSLT()`, `useUpdateSLT()`, `useDeleteSLT()` - Mutations

### Lesson Hooks (`use-lesson.ts`)
- `useLessons(courseNftPolicyId, moduleCode)` - List lessons
- `useLesson(courseNftPolicyId, moduleCode, moduleIndex)` - Single lesson
- `useCreateLesson()` - Mutation

---

## Redundant Query Patterns Found

### Pattern 1: Same course fetched on every child route

**Problem**: When navigating `/course/[id]` → `/course/[id]/[module]` → `/course/[id]/[module]/[lesson]`, the course is re-fetched 3 times.

**Locations**:
- `course/[coursenft]/page.tsx`
- `course/[coursenft]/[modulecode]/page.tsx`
- `course/[coursenft]/[modulecode]/[moduleindex]/page.tsx`
- `course/[coursenft]/[modulecode]/assignment/page.tsx`
- `studio/course/[coursenft]/page.tsx`
- `studio/course/[coursenft]/instructor/page.tsx`

**Solution**: Use `useCourse()` hook - data cached across all routes.

### Pattern 2: Module list fetched multiple times

**Problem**: Module list fetched separately in course page and child components.

**Locations**:
- `course/[coursenft]/page.tsx`
- `studio/course/[coursenft]/page.tsx`
- `hooks/use-hybrid-slts.ts`
- `components/courses/on-chain-modules-section.tsx`
- `components/studio/wizard/steps/step-credential.tsx`

**Solution**: Use `useCourseModules()` hook - single cached fetch.

### Pattern 3: No query deduplication

**Problem**: Multiple components on same page making identical requests.

**Example**: Dashboard page with multiple widgets each fetching `/course/list`.

**Solution**: React Query deduplicates in-flight requests automatically.

---

## API Recommendations for Backend

### 1. Add Composite Endpoints

**Current**: Separate calls for course + modules + SLTs
**Recommended**: Add `/course/full` endpoint returning all nested data

```typescript
// Proposed endpoint
POST /course/full
Body: { course_nft_policy_id: string }
Returns: {
  course: CourseOutput,
  modules: CourseModuleOutput[],
  slts: Record<string, SLTOutput[]>,
  lessons: Record<string, LessonOutput[]>,
}
```

**Impact**: Reduce 4+ requests to 1 for course detail pages.

### 2. Add Shallow vs Deep Fetch Options

**Current**: `/course-module/list` always includes full SLT objects
**Recommended**: Add `include_slts` parameter

```typescript
POST /course-module/list
Body: {
  course_nft_policy_id: string,
  include_slts?: boolean,  // default: true for backward compat
  include_lessons?: boolean,
}
```

**Impact**: Reduce payload size when SLT details not needed.

### 3. Implement ETags for Cache Validation

**Current**: Full refetch on every request
**Recommended**: Return ETag header, accept If-None-Match

```
Response: ETag: "abc123"
Request: If-None-Match: "abc123"
Response: 304 Not Modified (no body)
```

**Impact**: Reduce bandwidth for unchanged data.

### 4. Consider GraphQL for Complex Queries

**Observation**: Many pages need specific subsets of data
**Recommendation**: Evaluate GraphQL for:
- Course detail with specific module fields
- Dashboard aggregations
- Instructor views with commitment counts

**Impact**: Clients request exactly what they need.

---

## Migration Priority

### Phase 2a - Complete Hook Migration (Next Sprint)

| Component/Page | Current | Target Hook | Priority |
|----------------|---------|-------------|----------|
| `course/[id]/page.tsx` | useState + fetch | ✅ Done | - |
| `course/[id]/[module]/page.tsx` | useState + fetch | `useCourse`, `useCourseModule` | High |
| `course/[id]/[module]/[lesson]/page.tsx` | useState + fetch | `useCourse`, `useLesson` | High |
| `studio/course/[id]/page.tsx` | useState + fetch | `useCourse`, `useCourseModules` | High |
| `studio/course/page.tsx` | useState + fetch | `useOwnedCoursesQuery` | Medium |
| `course/page.tsx` | useState + fetch | `usePublishedCourses` | Medium |

### Phase 2b - Migrate Wizard Steps

| Component | Endpoints | Target Hooks |
|-----------|-----------|--------------|
| `step-credential.tsx` | module list/create | `useCourseModules`, `useCreateCourseModule` |
| `step-slts.tsx` | slt CRUD | `useSLTs`, `useCreateSLT`, `useUpdateSLT` |
| `step-lessons.tsx` | lesson create | `useCreateLesson` |
| `step-assignment.tsx` | assignment CRUD | (create hooks) |

### Phase 2c - Convert Existing Hooks

| Hook | Status | Action |
|------|--------|--------|
| `useOwnedCourses` | useState | Replace with `useOwnedCoursesQuery` |
| `useModuleWizardData` | useState | Refactor to use individual hooks |
| `useHybridSlts` | useState | Refactor to use `useSLTs`, `useCourseModules` |
| `usePendingTransactions` | useState | Convert to React Query |

---

## Endpoints to Consider Removing

| Endpoint | Reason | Alternative |
|----------|--------|-------------|
| `/slt/update-index` | Superseded by `/slt/reorder` | Use reorder for all index changes |
| `/course-module/batch-update-status` | Low usage | Use individual updates with React Query |
| `/assignment-commitment/has-any` | Deprecated | Use `/assignment-commitment/list` |

---

## Performance Impact Estimates

### Before Migration
- Average page load: 4-6 API requests
- Navigation between course pages: 3-4 duplicate requests
- No request deduplication

### After Full Migration
- Average page load: 2-3 API requests (40-50% reduction)
- Navigation uses cache: 0 duplicate requests
- In-flight deduplication: ~20% fewer requests
- Background refetching: Data stays fresh

### Estimated Bandwidth Savings
- Course navigation flow: 60% reduction
- Dashboard page: 40% reduction
- Studio editing: 30% reduction

---

## Next Steps

1. **Immediate**: Migrate remaining course pages to use new hooks
2. **Short-term**: Convert wizard step components
3. **Medium-term**: Deprecate old useState-based hooks
4. **Long-term**: Implement backend composite endpoints

---

**Generated**: December 19, 2025
**Audit Tool**: Claude Code audit-api-coverage skill
