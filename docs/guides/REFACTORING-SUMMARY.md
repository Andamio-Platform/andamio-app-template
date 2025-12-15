# T3 App Template Type Refactoring Summary

## Goal
Refactor all API calls to use the new exported types from `andamio-db-api` instead of `RouterOutputs` type lookups, making the codebase an excellent reference implementation.

## Pattern to Follow

### ❌ Old Pattern (Do Not Use)
```typescript
import { type RouterOutputs } from "andamio-db-api";
type CourseOutput = RouterOutputs["course"]["getCourseByPolicyId"];
```

### ✅ New Pattern (Use This)
```typescript
import { type CourseOutput } from "andamio-db-api";
```

## Files Completed

### Components
- ✅ `src/components/courses/owned-courses-list.tsx` - Uses `ListOwnedCoursesOutput`

### Public Pages
- ✅ `src/app/(app)/course/page.tsx` - Uses `ListPublishedCoursesOutput`
- ✅ `src/app/(app)/course/[coursenft]/page.tsx` - Uses `CourseOutput`, `ListCourseModulesOutput`
- ⏳ `src/app/(app)/course/[coursenft]/[modulecode]/page.tsx` - TODO: Use `CourseModuleOutput`, `ListSLTsOutput`, `ListLessonsOutput`
- ⏳ `src/app/(app)/course/[coursenft]/[modulecode]/[moduleindex]/page.tsx` - TODO: Use `LessonOutput`

### Studio Pages (Authenticated)
- ⏳ `src/app/(app)/studio/course/[coursenft]/page.tsx` - TODO: Use `CourseOutput`, `ListCourseModulesOutput`
- ⏳ `src/app/(app)/studio/course/[coursenft]/[modulecode]/page.tsx` - TODO: Use `CourseModuleOutput`
- ⏳ `src/app/(app)/studio/course/[coursenft]/[modulecode]/[moduleindex]/page.tsx` - TODO: Use `LessonOutput`
- ⏳ `src/app/(app)/studio/course/[coursenft]/[modulecode]/introduction/page.tsx` - TODO: Use `IntroductionOutput`
- ⏳ `src/app/(app)/studio/course/[coursenft]/[modulecode]/assignment/page.tsx` - TODO: Use `AssignmentOutput`, `ListSLTsOutput`
- ⏳ `src/app/(app)/studio/course/[coursenft]/[modulecode]/slts/page.tsx` - TODO: Use `CourseModuleOutput`, `SLTOutput`, `ListSLTsOutput`, `ListLessonsOutput`

## Type Mapping Reference

| Old RouterOutputs Pattern | New Direct Export |
|---------------------------|-------------------|
| `RouterOutputs["course"]["getPublishedCourses"]` | `ListPublishedCoursesOutput` |
| `RouterOutputs["course"]["getCourseByPolicyId"]` | `CourseOutput` |
| `RouterOutputs["course"]["listOwned"]` | `ListOwnedCoursesOutput` |
| `RouterOutputs["courseModule"]["getCourseModuleOverviewsByCourseNftPolicyId"]` | `ListCourseModulesOutput` |
| `RouterOutputs["courseModule"]["getCourseModuleByCourseNftPolicyId"]` | `CourseModuleOutput` |
| `RouterOutputs["lesson"]["getModuleLessons"]` | `ListLessonsOutput` |
| `RouterOutputs["lesson"]["getLessonByPolicyId"]` | `LessonOutput` |
| `RouterOutputs["slt"]["getModuleSLTs"]` | `ListSLTsOutput` |
| `RouterOutputs["slt"]["getSLT"]` | `SLTOutput` |
| `RouterOutputs["assignment"]["getAssignmentByCourseModuleCodes"]` | `AssignmentOutput` |
| `RouterOutputs["introduction"]["getIntroduction"]` | `IntroductionOutput` |

## Documentation Pattern

Each refactored file should include a JSDoc comment at the top explaining:
- What the page/component does
- Which API endpoints it uses
- Reference to API-TYPE-REFERENCE.md

### Example:
```typescript
/**
 * Public page displaying course details and module list
 *
 * API Endpoints:
 * - POST /course/get (public)
 * - POST /course-module/list (public)
 * Type Reference: See API-TYPE-REFERENCE.md in andamio-db-api
 */
export default function CourseDetailPage() {
  // ...
}
```

## Benefits

1. **Cleaner Imports** - Direct type imports are more readable
2. **Better DX** - IDE autocomplete shows all available types
3. **Type Safety** - Types are auto-generated from API procedures
4. **Single Source of Truth** - API-TYPE-REFERENCE.md documents all types
5. **Zero Type Drift** - Types automatically stay in sync with API

## Next Steps

1. Complete remaining public pages
2. Refactor all studio pages
3. Run `npm run typecheck` to verify all changes
4. Update README with new type usage patterns
