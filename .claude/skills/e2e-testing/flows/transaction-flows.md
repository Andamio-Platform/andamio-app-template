# Transaction Flows Definition

Step-by-step definitions of Cardano transaction flows for E2E testing.

## Flow Overview

| Flow | TX Type | Roles | Priority |
|------|---------|-------|----------|
| Mint Access Token | `ACCESS_TOKEN_MINT` | New User | High |
| Create Course | `COURSE_OWNER_CREATE` | Owner | Medium |
| Publish Course | `COURSE_OWNER_PUBLISH` | Owner | Medium |
| Assess Assignment | `COURSE_TEACHER_ASSESS` | Teacher | Medium |
| Task Commit | `PROJECT_CONTRIBUTOR_COMMIT` | Contributor | Low |

---

## Common Transaction States

All transactions follow this state machine:

```
IDLE → FETCHING → SIGNING → SUBMITTING → CONFIRMING → SUCCESS/ERROR
```

### State Selectors

```typescript
// Button states
transaction.button.idle        // Initial state
transaction.button.preparing   // "Preparing Transaction..."
transaction.button.signing     // "Sign in Wallet"
transaction.button.submitting  // "Submitting..."
transaction.button.confirming  // "Awaiting Confirmation..."
transaction.button.success     // "Transaction Successful"
transaction.button.failed      // "Transaction Failed"

// Status component
transaction.status.loading.preparing   // Building TX
transaction.status.loading.signing     // Awaiting wallet
transaction.status.loading.submitting  // Submitting to blockchain
transaction.status.loading.confirming  // Awaiting confirmations
transaction.status.success.message     // "Transaction submitted!"
transaction.status.error.message       // "Transaction failed"
transaction.status.error.retryButton   // "Try again"
```

---

## Flow 1: Mint Access Token

### Overview
| Property | Value |
|----------|-------|
| **Name** | Mint Access Token |
| **TX Type** | `ACCESS_TOKEN_MINT` |
| **Roles** | New user (no existing token) |
| **Prerequisites** | Authenticated, wallet has ADA |

### Steps

#### Step 1.1: Navigate to Mint

**Action:** Find mint option
**Expected State:**
- Mint button visible (for users without token)
- May be on dashboard or profile

#### Step 1.2: Configure Token

**Action:** Enter alias (if required)
**Expected State:**
- Alias input shown
- Validation feedback

#### Step 1.3: Build Transaction

**Action:** Click mint button
**Expected State:**
- Transaction building
- "Preparing Transaction..."

**Selectors:**
```typescript
transaction.button.preparing
```

#### Step 1.4: Sign in Wallet

**Action:** Approve in wallet
**Expected State:**
- Wallet popup/extension
- "Sign in Wallet" status

**Selectors:**
```typescript
transaction.button.signing
```

#### Step 1.5: Submit & Confirm

**Action:** Wait for blockchain
**Expected State:**
- Submitting status
- Confirmation countdown
- Success message

**Selectors:**
```typescript
transaction.button.submitting
transaction.status.success.message
```

#### Step 1.6: Verify Token

**Action:** Check token display
**Expected State:**
- Token alias in status bar
- JWT updated with alias

---

## Flow 2: Create Course (Owner)

### Overview
| Property | Value |
|----------|-------|
| **Name** | Create Course |
| **TX Type** | `COURSE_OWNER_CREATE` |
| **Roles** | Course Owner (has access token) |
| **Prerequisites** | Has access token |

### Steps

#### Step 2.1: Navigate to Create

**Action:** Open course creation
**URL:** `/courses/create` or modal

#### Step 2.2: Fill Course Details

**Action:** Complete course form
**Fields:**
- Title (required)
- Description
- Category
- Modules/assignments (optional)

#### Step 2.3: Build Transaction

**Action:** Click Create/Submit
**Expected State:**
- Form validated
- Transaction building

#### Step 2.4: Sign & Submit

**Action:** Approve in wallet
**Expected State:**
- Standard TX flow
- Course NFT minted

#### Step 2.5: Verify Creation

**Action:** Check course exists
**Expected State:**
- Course visible in owner's list
- Course ID generated
- Draft status

---

## Flow 3: Publish Course (Owner)

### Overview
| Property | Value |
|----------|-------|
| **Name** | Publish Course |
| **TX Type** | `COURSE_OWNER_PUBLISH` |
| **Roles** | Course Owner |
| **Prerequisites** | Draft course with content |

### Steps

#### Step 3.1: View Draft Course

**Action:** Navigate to draft course
**Expected State:**
- Course detail visible
- Publish option available

#### Step 3.2: Initiate Publish

**Action:** Click Publish
**Expected State:**
- Confirmation dialog (optional)
- Transaction building

#### Step 3.3: Sign & Submit

**Action:** Approve in wallet
**Expected State:**
- Standard TX flow

#### Step 3.4: Verify Published

**Action:** Check course status
**Expected State:**
- Status changed to published
- Course visible in catalog
- Students can enroll

---

## Flow 4: Assess Assignment (Teacher)

### Overview
| Property | Value |
|----------|-------|
| **Name** | Assignment Assessment |
| **TX Type** | `COURSE_TEACHER_ASSIGNMENTS_ASSESS` |
| **Roles** | Teacher |
| **Prerequisites** | Student has committed submission |

### Steps

#### Step 4.1: View Submissions

**Action:** Navigate to submissions queue
**Expected State:**
- Pending submissions listed
- Student info visible

#### Step 4.2: Review Submission

**Action:** Open submission detail
**Expected State:**
- Submission content visible
- Assessment options

#### Step 4.3: Make Assessment

**Action:** Approve/request revision
**Expected State:**
- Assessment form
- Transaction preparation

#### Step 4.4: Sign & Submit

**Action:** Approve in wallet
**Expected State:**
- Standard TX flow

#### Step 4.5: Verify Assessment

**Action:** Check updated status
**Expected State:**
- Submission marked assessed
- Student notified (if applicable)
- SLT awarded (if approved)

---

## Flow 5: Task Commitment (Project)

### Overview
| Property | Value |
|----------|-------|
| **Name** | Task Commitment |
| **TX Type** | `PROJECT_CONTRIBUTOR_TASK_COMMIT` |
| **Roles** | Contributor |
| **Prerequisites** | Project with available tasks |

### Steps

#### Step 5.1: Browse Tasks

**Action:** View available tasks
**Expected State:**
- Task list visible
- Status indicators

#### Step 5.2: Select Task

**Action:** View task details
**Expected State:**
- Task description
- Reward info
- Expiration

#### Step 5.3: Commit to Task

**Action:** Click Commit
**Expected State:**
- Confirmation/enrollment
- Transaction building

**Selectors:**
```typescript
transaction.taskCommit.button.commit
transaction.taskCommit.button.enrollAndCommit  // If first time
```

#### Step 5.4: Sign & Submit

**Action:** Approve in wallet
**Expected State:**
- Standard TX flow

#### Step 5.5: Verify Commitment

**Action:** Check task status
**Expected State:**
- Task assigned to user
- Deadline tracking
- Contribution recorded

---

## Error Handling

### Common Errors

| Error | Cause | Recovery |
|-------|-------|----------|
| `InsufficientFunds` | Not enough ADA | Add ADA to wallet |
| `TokenAlreadyExists` | Duplicate mint | Cannot retry |
| `NotAuthorized` | Missing permissions | Check token/role |
| `InvalidInput` | Bad data | Fix form data |
| `NetworkError` | API/blockchain issue | Retry later |

### Test Scenarios

```typescript
// Test successful transaction
await mockTransactionFlow(page, {
  txType: 'mint-access-token',
  shouldFail: false
});

// Test transaction failure
await mockTransactionFlow(page, {
  txType: 'mint-access-token',
  shouldFail: true,
  errorMessage: 'Insufficient funds'
});

// Test wallet rejection
await setMockWalletMode(page, 'reject');
```

---

## V2 Gateway API Notes

The V2 Gateway API handles:
- Transaction building
- UTxO selection
- Auto-confirmation polling

Flow simplified from V1:
```
V1: BUILD → SIGN → SUBMIT → REGISTER → POLL → CONFIRM
V2: BUILD → SIGN → SUBMIT → (Gateway auto-confirms)
```
