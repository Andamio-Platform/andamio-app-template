# Course Flows Definition

Step-by-step definitions of course-related user flows for E2E testing.

## Flow Overview

| Flow | Transactions | Roles | Priority |
|------|-------------|-------|----------|
| Browse Catalog | 0 | Any | High |
| Enroll in Course | 1 | Student | High |
| Navigate Modules | 0 | Student | Medium |
| Commit to Assignment | 1 | Student | High |
| Claim Credential | 1 | Student | Medium |

---

## Flow 1: Browse Course Catalog

### Overview
| Property | Value |
|----------|-------|
| **Name** | Browse Course Catalog |
| **Transactions** | 0 |
| **Roles** | Any (can be unauthenticated) |

### Steps

#### Step 1.1: Navigate to Courses

**Action:** Open courses page
**URL:** `/courses`
**Expected State:**
- Course catalog visible
- Course cards displayed
- Filter/search available

**Selectors:**
```typescript
course.catalog.container
course.catalog.grid
```

#### Step 1.2: View Course Cards

**Action:** Observe course listing
**Expected State:**
- Course title visible
- Course description/preview
- Enroll/View option

**Selectors:**
```typescript
course.catalog.courseCard
course.catalog.enrollButton
```

#### Step 1.3: Filter/Search (Optional)

**Action:** Use search or filters
**Expected State:**
- Results update
- Matching courses shown

#### Step 1.4: Select Course

**Action:** Click course card
**URL:** `/courses/{courseId}`
**Expected State:**
- Course detail page
- Full description
- Module list preview

---

## Flow 2: Enroll in Course

### Overview
| Property | Value |
|----------|-------|
| **Name** | Course Enrollment |
| **Transactions** | 1 (`COURSE_STUDENT_ENROLL`) |
| **Roles** | Student (authenticated) |
| **Prerequisites** | Authenticated, course selected |

### Steps

#### Step 2.1: View Course Detail

**Action:** Navigate to course page
**URL:** `/courses/{courseId}`
**Expected State:**
- Course details visible
- Enroll button available
- Requirements shown (if any)

**Selectors:**
```typescript
course.detail.title
course.catalog.enrollButton
```

#### Step 2.2: Initiate Enrollment

**Action:** Click Enroll button
**Expected State:**
- Transaction dialog/flow starts
- Enrollment details shown

**Selectors:**
```typescript
course.catalog.enrollButton
transaction.status.loading.preparing
```

#### Step 2.3: Confirm in Wallet

**Action:** Sign transaction
**Expected State:**
- Wallet signing prompt
- Transaction building status

**Selectors:**
```typescript
transaction.button.signing
```

#### Step 2.4: Wait for Confirmation

**Action:** Wait for blockchain confirmation
**Expected State:**
- Submitting status
- Confirmation status
- Success message

**Selectors:**
```typescript
transaction.button.submitting
transaction.button.confirming
transaction.status.success.message
```

#### Step 2.5: Access Enrolled Course

**Action:** Navigate to enrolled content
**Expected State:**
- Full module access
- Progress tracking enabled
- Assignment availability

---

## Flow 3: Navigate Course Content

### Overview
| Property | Value |
|----------|-------|
| **Name** | Module Navigation |
| **Transactions** | 0 |
| **Roles** | Enrolled Student |
| **Prerequisites** | Enrolled in course |

### Steps

#### Step 3.1: View Module List

**Action:** View course modules
**Expected State:**
- All modules listed
- Order indicated
- Completion status (if any)

**Selectors:**
```typescript
course.detail.moduleList
course.module.card
```

#### Step 3.2: Expand Module

**Action:** Click module to expand
**Expected State:**
- Lessons revealed
- Assignments revealed

**Selectors:**
```typescript
course.module.expandButton
course.detail.lessonList
course.detail.assignmentList
```

#### Step 3.3: View Lesson

**Action:** Click lesson link
**URL:** `/courses/{courseId}/lessons/{lessonId}`
**Expected State:**
- Lesson content displayed
- Navigation to next/prev

**Selectors:**
```typescript
course.module.lessonLink
```

#### Step 3.4: View Assignment

**Action:** Click assignment link
**URL:** `/courses/{courseId}/assignments/{assignmentId}`
**Expected State:**
- Assignment details shown
- Commit option available
- SLT indicator

**Selectors:**
```typescript
course.module.assignmentLink
course.assignment.sltBadge
```

---

## Flow 4: Commit to Assignment

### Overview
| Property | Value |
|----------|-------|
| **Name** | Assignment Commitment |
| **Transactions** | 1 (`COURSE_STUDENT_ASSIGNMENT_COMMIT`) |
| **Roles** | Enrolled Student |
| **Prerequisites** | Enrolled, viewing assignment |

### Steps

#### Step 4.1: View Assignment

**Action:** Navigate to assignment
**Expected State:**
- Assignment details visible
- Requirements clear
- Commit button enabled

**Selectors:**
```typescript
course.assignment.title
course.assignment.description
course.assignment.commitButton
```

#### Step 4.2: Initiate Commitment

**Action:** Click Commit button
**Expected State:**
- Transaction confirmation shown
- Assignment details confirmed

**Selectors:**
```typescript
transaction.taskCommit.card.commitTask
transaction.taskCommit.button.commit
```

#### Step 4.3: Sign Transaction

**Action:** Confirm in wallet
**Expected State:**
- Wallet prompt
- Signing status

#### Step 4.4: Confirmation

**Action:** Wait for confirmation
**Expected State:**
- Success message
- Assignment status updated
- SLT progress tracked

**Selectors:**
```typescript
transaction.status.success.message
```

---

## Flow 5: Claim Credential

### Overview
| Property | Value |
|----------|-------|
| **Name** | Credential Claim |
| **Transactions** | 1 (`COURSE_STUDENT_CREDENTIAL_CLAIM`) |
| **Roles** | Eligible Student |
| **Prerequisites** | All required SLTs completed |

### Steps

#### Step 5.1: View Credentials

**Action:** Navigate to credentials page
**URL:** `/credentials`
**Expected State:**
- Claimable credentials listed
- Requirements shown

**Selectors:**
```typescript
course.credential.card
course.credential.claimButton
```

#### Step 5.2: Initiate Claim

**Action:** Click Claim button
**Expected State:**
- Confirmation dialog
- Transaction preparation

#### Step 5.3: Sign Transaction

**Action:** Confirm in wallet
**Expected State:**
- Wallet prompt
- Transaction building

#### Step 5.4: Completion

**Action:** Wait for confirmation
**Expected State:**
- Credential claimed
- NFT minted
- Display updated

**Selectors:**
```typescript
transaction.status.success.message
course.credential.viewButton
```

---

## Test Coverage Matrix

| Flow | Test File | Priority |
|------|-----------|----------|
| Browse Catalog | `browse-catalog.spec.ts` | High |
| Enroll | `enroll-flow.spec.ts` | High |
| Navigate Content | `enroll-flow.spec.ts` | Medium |
| Commit Assignment | `enroll-flow.spec.ts` | High |
| Claim Credential | `credential-claim.spec.ts` | Medium |

## Error Scenarios

| Error | Cause | Test |
|-------|-------|------|
| Already enrolled | Re-enrollment attempt | `enroll-flow.spec.ts` |
| Not eligible | Requirements not met | `credential-claim.spec.ts` |
| Wallet rejection | User cancels | All transaction tests |
| Network error | API failure | Mock API failures |
