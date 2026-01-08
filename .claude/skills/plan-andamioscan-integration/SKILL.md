# Plan Andamioscan Integration Skill

This skill helps plan and implement Andamioscan API endpoints into the Andamio T3 App UX.

## Purpose

Interview the user to understand their UX needs, then create implementation plans for integrating Andamioscan on-chain data endpoints.

## When to Use

- When the user wants to add new on-chain data features
- When planning which Andamioscan endpoints to implement next
- When reviewing what endpoints are available vs implemented

## Workflow

### Step 1: Show Current Status (DO THIS FIRST)

**When the skill is invoked, immediately read and display `implementation-status.md`.**

Show the user:
1. Summary table (implemented vs not implemented counts)
2. List of implemented endpoints with their functions/hooks
3. List of NOT implemented endpoints grouped by category
4. Priority recommendations

Example output:
```
## Andamioscan Integration Status

### Summary
- Implemented: 5 endpoints
- Not Implemented: 27 endpoints

### Already Implemented
- GET /v2/courses → getAllCourses() / useAllCourses()
- GET /v2/courses/{id}/details → getCourse() / useCourse()
- ...

### Not Yet Implemented

**High Priority (Core UX)**
- GET /v2/courses/teachers/{alias}/assessments/pending
- GET /v2/users/{alias}/courses/enrolled
- ...

What feature would you like to build?
```

### Step 2: Interview User

Ask the user questions to understand their needs:

1. **Feature Goal**: "What feature or UX improvement are you trying to build?"
2. **User Role**: "Which user role is this for?" (Learner, Teacher, Admin, Public)
3. **Data Needed**: Based on the goal, suggest which endpoints might be useful
4. **Priority**: If multiple endpoints needed, ask which to implement first
5. **Error Handling**: For each endpoint, ask about preferred error states:
   - What should show when data is loading?
   - What should show when the API returns empty data?
   - What should show when the API returns an error?
   - Should errors be blocking (show error page) or non-blocking (show inline message)?

### Step 3: Create Implementation Plan

For each endpoint to implement, document:

1. **Endpoint Details**
   - Path and method
   - Parameters required
   - Response structure (fetch from Swagger if needed)

2. **Client Implementation**
   - Function name for `src/lib/andamioscan.ts`
   - Hook name for `src/hooks/use-andamioscan.ts`
   - Type definitions needed

3. **UX Integration**
   - Which route(s) will use this data
   - Which component(s) need to be created/updated
   - Loading states (skeleton, spinner, etc.)
   - Empty states (no data message, call-to-action)
   - Error states (inline alert, toast, error boundary)

4. **Error Handling Strategy**
   - Loading: What placeholder UI to show
   - Empty: What message/UI when no data exists
   - Error: How to display and recover from errors
   - Retry: Should user be able to retry failed requests?

5. **Testing Plan**
   - How to verify the endpoint works
   - Sample data to test with
   - Edge cases to handle

### Step 4: Update Status

After planning, update `implementation-status.md` to mark endpoints as "Planned" with the target route/component.

## Available Endpoints

See `available-endpoints.md` for the full list of Andamioscan V2 API endpoints.

## Files

| File | Purpose |
|------|---------|
| `SKILL.md` | This file - skill instructions |
| `available-endpoints.md` | All Andamioscan V2 endpoints with descriptions |
| `implementation-status.md` | Tracking which endpoints are implemented |

## Example Interview

```
User: I want to show teachers their pending assignment reviews

Claude: Great! I can help plan that feature. Let me check the available endpoints...

The endpoint `/v2/courses/teachers/{alias}/assessments/pending` looks perfect for this.
It returns assignments awaiting teacher review.

A few questions:

1. Where should this appear in the UX?
   - Teacher dashboard?
   - Course-specific instructor page?
   - Both?

2. For error states, what would you prefer?
   - Loading: Skeleton cards or spinner?
   - Empty (no pending reviews): "All caught up!" message or hide section?
   - Error: Inline alert with retry button, or toast notification?

3. Should this data auto-refresh, or only on page load?

User: Dashboard, skeleton loading, show "No pending reviews" when empty, inline error with retry.

Claude: Perfect! Here's the implementation plan:

## Implementation Plan: Pending Assessments

### Endpoint
- Path: `GET /v2/courses/teachers/{alias}/assessments/pending`
- Param: `alias` - teacher's access token alias

### Client (`src/lib/andamioscan.ts`)
- Function: `getPendingAssessments(alias: string)`
- Hook: `usePendingAssessments(alias)`

### UX Integration
- Route: `/dashboard`
- Component: `PendingAssessmentsSection`

### Error States
- Loading: Skeleton cards (3 placeholder items)
- Empty: "No pending reviews" with checkmark icon
- Error: Inline alert with "Retry" button
- No auto-refresh (manual refresh available)

Shall I implement this now?
```

## Common Error State Patterns

### Loading States
- **Skeleton**: Best for cards, lists, tables - shows layout shape
- **Spinner**: Best for buttons, small areas
- **Shimmer**: Best for text content

### Empty States
- **Celebratory**: "All caught up!" - for task completion
- **Informative**: "No data yet" - neutral state
- **Action-oriented**: "Create your first X" - with CTA button

### Error States
- **Inline Alert**: Non-blocking, shows in content area
- **Toast**: Temporary notification, auto-dismisses
- **Error Boundary**: Full page error for critical failures
- **Retry Button**: Allow user to attempt request again
