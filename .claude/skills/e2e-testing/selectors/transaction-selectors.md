# Transaction Selectors Registry

Component selectors for transaction-related UI elements.

## Source Files

| Component | File Path |
|-----------|-----------|
| Transaction Button | `src/components/tx/transaction-button.tsx` |
| Transaction Status | `src/components/tx/transaction-status.tsx` |
| Task Commit | `src/components/tx/task-commit.tsx` |
| Tasks Manage | `src/components/tx/tasks-manage.tsx` |

## Transaction Button

### State Text

| State | Button Text |
|-------|------------|
| `idle` | Custom label or "Execute Transaction" |
| `fetching` | "Preparing Transaction..." |
| `signing` | "Sign in Wallet" |
| `submitting` | "Submitting to Blockchain..." or custom |
| `confirming` | "Awaiting Confirmation..." |
| `success` | "Transaction Successful" |
| `error` | "Transaction Failed" |

### Selectors

| State | Selector |
|-------|----------|
| Idle | `button:has-text("{label}")` |
| Preparing | `button:has-text("Preparing Transaction")` |
| Signing | `button:has-text("Sign in Wallet")` |
| Submitting | `button:has-text("Submitting")` |
| Success | `button:has-text("Transaction Successful")` |
| Failed | `button:has-text("Transaction Failed")` |
| Disabled | `button:disabled` |

## Transaction Status Component

### Container Classes

| State | Border/Background |
|-------|-------------------|
| Success | `border-primary/30 bg-primary/5` |
| Error | `border-destructive/30 bg-destructive/5` |
| Loading | `bg-muted/30` |

### Status Messages

| State | Message |
|-------|---------|
| Fetching | "Preparing your transaction..." |
| Signing | "Please sign the transaction in your wallet" |
| Submitting | "Submitting transaction to the blockchain..." |
| Confirming | "Waiting for blockchain confirmation..." |
| Success | "Transaction submitted successfully!" |
| Error | "Transaction failed" |

### Selectors

```typescript
export const transaction = {
  status: {
    container: '[class*="rounded-xl"]',
    success: {
      container: '[class*="border-primary/30"]',
      message: 'text="Transaction submitted successfully!"',
      viewLink: 'a:has-text("View")',
    },
    error: {
      container: '[class*="border-destructive/30"]',
      message: 'text="Transaction failed"',
      retryButton: 'button:has-text("Try again")',
    },
    loading: {
      container: '[class*="bg-muted/30"]',
      preparing: 'text="Preparing your transaction"',
      signing: 'text="Please sign the transaction in your wallet"',
      submitting: 'text="Submitting transaction"',
      confirming: 'text="Waiting for blockchain confirmation"',
    },
  },
};
```

## Task Commit Component

### Card Variants

| Variant | Title | Button |
|---------|-------|--------|
| First commit | "Enroll & Commit" | "Enroll & Commit" |
| With rewards | "Commit Task & Claim Rewards" | "Commit & Claim Rewards" |
| Standard | "Commit to Task" | "Commit to Task" |

### Elements

| Element | Selector |
|---------|----------|
| Enroll card | `heading:has-text("Enroll & Commit")` |
| Commit card | `heading:has-text("Commit to Task")` |
| Claim card | `heading:has-text("Commit Task & Claim Rewards")` |
| Task badge | `[class*="AndamioBadge"]` |
| Rewards badge | `span:has-text("+ Claim Rewards")` |
| Enroll warning | `text="This transaction enrolls you in the project"` |
| Enroll button | `button:has-text("Enroll & Commit")` |
| Commit button | `button:has-text("Commit to Task")` |
| Claim button | `button:has-text("Commit & Claim Rewards")` |
| Success (enroll) | `text="Welcome to the Project!"` |
| Success (commit) | `text="Task Commitment Recorded!"` |

### Selectors

```typescript
export const transaction = {
  taskCommit: {
    card: {
      enrollAndCommit: 'heading:has-text("Enroll & Commit")',
      commitTask: 'heading:has-text("Commit to Task")',
      commitAndClaim: 'heading:has-text("Commit Task & Claim Rewards")',
    },
    taskBadge: "[class*='AndamioBadge']",
    rewardsBadge: 'span:has-text("+ Claim Rewards")',
    enrollWarning: 'text="This transaction enrolls you in the project"',
    button: {
      enrollAndCommit: 'button:has-text("Enroll & Commit")',
      commit: 'button:has-text("Commit to Task")',
      commitAndClaim: 'button:has-text("Commit & Claim Rewards")',
    },
    success: {
      enrolled: 'text="Welcome to the Project!"',
      committed: 'text="Task Commitment Recorded!"',
    },
  },
};
```

## Tasks Manage Component

### Form Fields

| Field | Selector | Placeholder |
|-------|----------|-------------|
| Task Code | `input#taskCode` | "TASK_001" |
| Task Content | `input#taskHash` | "Complete the tutorial..." |
| Expiration | `input#expiration` | "30" |
| Reward | `input#reward` | "5000000" |

### Buttons

| Action | Selector |
|--------|----------|
| Add Task | `button:has-text("Add Task")` |
| Remove Task | `button:has-text("Remove Task")` |

### Status

| State | Message |
|-------|---------|
| Added | "Tasks Added!" |
| Removed | "Tasks Removed!" |
| Subtitle | "Task(s) have been added/removed successfully" |

### Selectors

```typescript
export const transaction = {
  tasksManage: {
    addTaskButton: 'button:has-text("Add Task")',
    removeTaskButton: 'button:has-text("Remove Task")',
    form: {
      taskCode: 'input#taskCode',
      taskHash: 'input#taskHash',
      expiration: 'input#expiration',
      reward: 'input#reward',
    },
    charCounter: 'text=/\\d+\\/140/',
    success: {
      added: 'text="Tasks Added!"',
      removed: 'text="Tasks Removed!"',
    },
  },
};
```

## Recommended data-testid Additions

```tsx
// transaction-button.tsx
<Button data-testid="tx-button" data-state={state}>
  ...
</Button>

// transaction-status.tsx
<div data-testid="tx-status" data-state={state}>
  <div data-testid="tx-status-message">...</div>
  <a data-testid="tx-hash-link">...</a>
  <button data-testid="tx-retry">...</button>
</div>

// task-commit.tsx
<AndamioCard data-testid="task-commit-card" data-variant={variant}>
  <div data-testid="task-badge">...</div>
  <Button data-testid="task-commit-button">...</Button>
</AndamioCard>

// tasks-manage.tsx
<div data-testid="tasks-manage">
  <input data-testid="task-code-input" />
  <input data-testid="task-hash-input" />
  <Button data-testid="add-task-button" />
  <Button data-testid="remove-task-button" />
</div>
```

## Animation Classes

| Animation | Class | Used For |
|-----------|-------|----------|
| Spin | `animate-spin` | Loading spinner |
| Pulse | `animate-pulse` | Skeleton loading |
| Bounce | `animate-bounce` | Success indicator |

## Icon Components

| State | Icon | Import |
|-------|------|--------|
| Loading | `LoadingIcon` | Spinner animation |
| Success | `VerifiedIcon` | Checkmark |
| Error | `ErrorIcon` | X mark |
| External | `ExternalLinkIcon` | View on explorer |
