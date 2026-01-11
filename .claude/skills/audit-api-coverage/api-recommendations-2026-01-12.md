# API Recommendations - Team Review

> **Date**: Monday, January 12, 2026
>
> **Purpose**: Review remaining API optimizations and decide what to prioritize post-Pioneers

---

## Context

This document originated from a Phase 2 API audit in December 2025. The React Query migration for primary course routes is complete. This review focuses on **remaining work** and **backend recommendations** that may or may not still be relevant.

---

## React Query Hooks Reference

These hooks are implemented and working in `src/hooks/api/`:

### Course Hooks (`use-course.ts`)
- `useCourse(courseNftPolicyId)` - Single course (cached)
- `usePublishedCourses()` - All published courses
- `useOwnedCoursesQuery()` - Owned courses (authenticated)
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

## Remaining Migration Work

### Wizard Step Components

| Component | Current State | Needs |
|-----------|---------------|-------|
| `step-credential.tsx` | Mixed | Migrate to `useCourseModules`, `useCreateCourseModule` |
| `step-slts.tsx` | Mixed | Migrate to `useSLTs`, `useCreateSLT`, `useUpdateSLT` |
| `step-lessons.tsx` | Mixed | Migrate to `useCreateLesson` |
| `step-assignment.tsx` | useState | Create assignment hooks, then migrate |

**Team Decision Needed**: Is wizard migration a priority for post-Pioneers?

### Legacy Hooks to Convert

| Hook | Current | Action |
|------|---------|--------|
| `useOwnedCourses` | useState | Replace with `useOwnedCoursesQuery` |
| `useModuleWizardData` | useState | Refactor to use individual hooks |
| `useHybridSlts` | useState | Refactor to use `useSLTs`, `useCourseModules` |
| `usePendingTransactions` | useState | Convert to React Query |

**Team Decision Needed**: Deprecate these or leave as-is for now?

---

## Backend API Recommendations

These were proposed in December 2025. Team should decide if any are worth pursuing.

### 1. Composite Endpoint (`/course/full`)

**Proposal**: Single endpoint returning course + modules + SLTs + lessons

```typescript
POST /course/full
Body: { course_nft_policy_id: string }
Returns: {
  course: CourseOutput,
  modules: CourseModuleOutput[],
  slts: Record<string, SLTOutput[]>,
  lessons: Record<string, LessonOutput[]>,
}
```

**Impact**: Reduce 4+ requests to 1 for course detail pages
**Team Decision**: Implement? Defer? Skip?

### 2. Shallow vs Deep Fetch Options

**Proposal**: Add optional include flags to reduce payload size

```typescript
POST /course-module/list
Body: {
  course_nft_policy_id: string,
  include_slts?: boolean,
  include_lessons?: boolean,
}
```

**Team Decision**: Worth the complexity?

### 3. ETags for Cache Validation

**Proposal**: Return ETag header, accept If-None-Match for 304 responses

**Impact**: Reduce bandwidth for unchanged data
**Team Decision**: Priority or future consideration?

---

## Endpoints to Consider Removing

| Endpoint | Reason | Alternative |
|----------|--------|-------------|
| `/slt/update-index` | Superseded by `/slt/reorder` | Use reorder for all index changes |
| `/course-module/batch-update-status` | Low usage | Use individual updates |
| `/assignment-commitment/has-any` | Deprecated | Use `/assignment-commitment/list` |

**Team Decision**: Clean these up or leave for backward compatibility?

---

## Performance Context

With React Query migration complete on primary routes:
- **Achieved**: Request deduplication, caching, background refresh
- **Estimated savings**: 40-50% fewer requests on course navigation

Remaining optimizations (wizard, legacy hooks) would provide incremental gains.

---

## Action Items for Team Review

1. [ ] Prioritize wizard migration: Yes / No / After mainnet
2. [ ] Deprecate legacy hooks: Yes / No / Gradual
3. [ ] Backend composite endpoint: Implement / Defer / Skip
4. [ ] Shallow fetch options: Implement / Defer / Skip
5. [ ] ETags: Implement / Defer / Skip
6. [ ] Remove deprecated endpoints: Yes / No

---

**Review Date**: Monday, January 12, 2026
