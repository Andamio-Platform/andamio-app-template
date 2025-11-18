# Input Validation Pattern for POST/PATCH Requests

This document explains the pattern for validating inputs to POST and PATCH requests using schemas exported from `andamio-db-api`.

## Status: ✅ COMPLETE

All studio pages have been updated with input validation. Every POST and PATCH request now validates data before sending to the API, providing better error messages and preventing invalid requests.

## Why Input Validation?

1. **Runtime Safety** - Catch invalid data before sending to API
2. **Type Safety** - TypeScript compile-time + Zod runtime validation
3. **Better Error Messages** - Specific validation errors for users
4. **API Contract Enforcement** - Ensures frontend matches API expectations
5. **Zero Type Drift** - Uses same schemas as the API

## The Pattern

### Step 1: Import Type and Schema

```typescript
import {
  type UpdateCourseInput,  // TypeScript type for compile-time checking
  updateCourseInputSchema, // Zod schema for runtime validation
} from "andamio-db-api";
```

### Step 2: Build Input Object

```typescript
const input: UpdateCourseInput = {
  courseCode: course.courseCode,
  data: {
    title: title || undefined,
    description: description || undefined,
    imageUrl: imageUrl || undefined,
    videoUrl: videoUrl || undefined,
  },
};
```

### Step 3: Validate with Schema

```typescript
const validationResult = updateCourseInputSchema.safeParse(input);

if (!validationResult.success) {
  // Extract validation errors
  const errors = validationResult.error.errors
    .map((err) => `${err.path.join(".")}: ${err.message}`)
    .join(", ");
  throw new Error(`Validation failed: ${errors}`);
}
```

### Step 4: Send Validated Data

```typescript
const response = await authenticatedFetch(
  `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/courses/${course.courseCode}`,
  {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(validationResult.data), // Use validated data
  }
);
```

## Complete Example

See `src/app/(app)/studio/course/[coursenft]/page.tsx` for the reference implementation:

```typescript
import {
  type UpdateCourseInput,
  updateCourseInputSchema,
} from "andamio-db-api";

const handleSave = async () => {
  if (!isAuthenticated || !course) {
    setSaveError("You must be authenticated to edit courses");
    return;
  }

  setIsSaving(true);
  setSaveError(null);
  setSaveSuccess(false);

  try {
    // Build input object conforming to UpdateCourseInput type
    const input: UpdateCourseInput = {
      courseCode: course.courseCode,
      data: {
        title: title || undefined,
        description: description || undefined,
        imageUrl: imageUrl || undefined,
        videoUrl: videoUrl || undefined,
      },
    };

    // Validate input with schema
    const validationResult = updateCourseInputSchema.safeParse(input);

    if (!validationResult.success) {
      // Extract validation errors
      const errors = validationResult.error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join(", ");
      throw new Error(`Validation failed: ${errors}`);
    }

    // Send validated data to API
    const response = await authenticatedFetch(
      `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/courses/${course.courseCode}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validationResult.data),
      }
    );

    if (!response.ok) {
      const errorData = (await response.json()) as ApiError;
      throw new Error(errorData.message ?? "Failed to update course");
    }

    setSaveSuccess(true);
    // ... handle success
  } catch (err) {
    console.error("Error saving course:", err);
    setSaveError(err instanceof Error ? err.message : "Failed to save changes");
  } finally {
    setIsSaving(false);
  }
};
```

## Type/Schema Mapping

| Endpoint | Input Type | Input Schema |
|----------|-----------|--------------|
| `POST /courses` | `CreateCourseInput` | `createCourseInputSchema` |
| `PATCH /courses/{courseCode}` | `UpdateCourseInput` | `updateCourseInputSchema` |
| `POST /course-modules` | `CreateCourseModuleInput` | `createCourseModuleInputSchema` |
| `PATCH /course-modules/{courseNftPolicyId}/{moduleCode}` | `UpdateCourseModuleInput` | `updateCourseModuleInputSchema` |
| `PATCH /course-modules/{courseNftPolicyId}/{moduleCode}/status` | `UpdateModuleStatusInput` | `updateModuleStatusInputSchema` |
| `POST /lessons` | `CreateLessonInput` | `createLessonInputSchema` |
| `PATCH /lessons/{courseNftPolicyId}/{moduleCode}/{moduleIndex}` | `UpdateLessonInput` | `updateLessonInputSchema` |
| `POST /slts` | `CreateSLTInput` | `createSLTInputSchema` |
| `PATCH /slts/{courseNftPolicyId}/{moduleCode}/{moduleIndex}` | `UpdateSLTInput` | `updateSLTInputSchema` |
| `POST /assignments` | `CreateAssignmentInput` | `createAssignmentInputSchema` |
| `PATCH /assignments/{courseNftPolicyId}/{moduleCode}` | `UpdateAssignmentInput` | `updateAssignmentInputSchema` |
| `POST /introductions` | `CreateIntroductionInput` | `createIntroductionInputSchema` |
| `PATCH /introductions/{courseNftPolicyId}/{moduleCode}` | `UpdateIntroductionInput` | `updateIntroductionInputSchema` |
| `POST /assignment-commitments` | `CreateAssignmentCommitmentInput` | `createAssignmentCommitmentInputSchema` |
| `PATCH /assignment-commitments/{id}/evidence` | `UpdateAssignmentCommitmentEvidenceInput` | `updateAssignmentCommitmentEvidenceInputSchema` |

## Files Updated

All studio pages now use input validation:

### Studio Pages
- ✅ `src/app/(app)/studio/course/[coursenft]/page.tsx` - **COMPLETED** (reference implementation)
- ✅ `src/app/(app)/studio/course/[coursenft]/[modulecode]/page.tsx` - **COMPLETED** - Module editor (PATCH details + PATCH status)
- ✅ `src/app/(app)/studio/course/[coursenft]/[modulecode]/[moduleindex]/page.tsx` - **COMPLETED** - Lesson editor (POST/PATCH)
- ✅ `src/app/(app)/studio/course/[coursenft]/[modulecode]/introduction/page.tsx` - **COMPLETED** - Introduction editor (POST/PATCH)
- ✅ `src/app/(app)/studio/course/[coursenft]/[modulecode]/assignment/page.tsx` - **COMPLETED** - Assignment editor (POST/PATCH)
- ✅ `src/app/(app)/studio/course/[coursenft]/[modulecode]/slts/page.tsx` - **COMPLETED** - SLTs editor (POST/PATCH)

## Benefits of This Pattern

### 1. Compile-Time Type Safety
```typescript
const input: UpdateCourseInput = {
  courseCode: course.courseCode,
  data: {
    title: title || undefined,
    // TypeScript will error if you add invalid fields
  },
};
```

### 2. Runtime Validation
```typescript
const validationResult = updateCourseInputSchema.safeParse(input);
// Catches: missing required fields, invalid types, constraint violations
```

### 3. Better Error Messages
```
// Before: "Failed to update course"
// After: "Validation failed: data.title: String must contain at least 1 character(s)"
```

### 4. Single Source of Truth
- API defines schema once
- Frontend imports and uses it
- No duplication, no drift

## Common Validation Errors

### Required Field Missing
```
Error: Validation failed: courseCode: Required
```

### Invalid Type
```
Error: Validation failed: data.title: Expected string, received number
```

### Constraint Violation
```
Error: Validation failed: data.imageUrl: Invalid url
```

### Extra Fields
Zod will strip extra fields by default (using `.strip()` mode)

## Testing Validation

### Test Valid Input
```typescript
const validInput: UpdateCourseInput = {
  courseCode: "test-101",
  data: { title: "Test Course" },
};

const result = updateCourseInputSchema.safeParse(validInput);
expect(result.success).toBe(true);
```

### Test Invalid Input
```typescript
const invalidInput = {
  courseCode: "", // Too short
  data: { title: "" }, // Too short
};

const result = updateCourseInputSchema.safeParse(invalidInput);
expect(result.success).toBe(false);
expect(result.error.errors).toHaveLength(2);
```

## Next Steps

1. Apply this pattern to all remaining studio pages
2. Add validation to all POST/PATCH requests
3. Update error handling to display validation errors clearly
4. Add user-friendly field-level validation in forms

## Reference

- **API Type Reference**: `andamio-db-api/API-TYPE-REFERENCE.md`
- **Schema Exports**: `andamio-db-api/src/types/index.ts`
- **Zod Documentation**: https://zod.dev
