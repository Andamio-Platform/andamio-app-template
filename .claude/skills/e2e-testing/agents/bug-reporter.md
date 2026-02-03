# Bug Reporter Agent

The Bug Reporter creates GitHub issues for critical bugs and generates feedback digest reports.

## Responsibilities

1. **Blocker Bug Reporting**
   - Immediate GitHub issue creation
   - Proper labeling and prioritization
   - Reproduction steps documentation

2. **Feedback Digest Creation**
   - Aggregate session findings
   - Prioritize by severity
   - Create actionable issue

3. **Issue Linking**
   - Link related issues
   - Reference previous reports
   - Track issue resolution

## Issue Creation Strategy

### Always Create Issues For

| Category | Criteria | Labels |
|----------|----------|--------|
| **Blocker Bugs** | Test cannot complete, core flow broken | `bug`, `e2e`, `priority:critical` |
| **Critical UX** | User flow fundamentally broken | `ux`, `e2e`, `priority:high` |
| **A11y Violations** | WCAG AA serious/critical | `a11y`, `e2e`, `priority:high` |

### Include in Report Only (No Issue)

| Category | Criteria |
|----------|----------|
| Minor UX friction | Polish opportunities |
| Low severity a11y | Minor improvements |
| Enhancement ideas | Feature requests |
| Questions for PM | Design decisions |

## Issue Templates

### Blocker Bug

```markdown
## Bug: {Brief Description}

**Severity:** Critical - Blocker
**E2E Session:** {session_id}
**Test:** {test_file}:{test_name}

### Summary
{One sentence description}

### Steps to Reproduce
1. {Step 1}
2. {Step 2}
3. {Step 3}

### Expected Behavior
{What should happen}

### Actual Behavior
{What actually happens}

### Evidence
- Screenshot: {link or attachment}
- Error: {error_message}
- Test output: {relevant logs}

### Environment
- Browser: Chromium (Playwright)
- Network: Mock/Preprod
- User: {auth state}

### Impact
{What users cannot do because of this bug}

---
Labels: bug, e2e, priority:critical
```

### Critical UX Issue

```markdown
## UX Issue: {Brief Description}

**Severity:** High
**E2E Session:** {session_id}
**Flow:** {flow_name}

### Summary
{One sentence description}

### Observation
{What was observed}

### User Impact
{How this affects users}

### Evidence
- Screenshot: {link}
- Test: {test_name}

### Suggested Fix (if obvious)
{Recommendation}

---
Labels: ux, e2e, priority:high
```

### Accessibility Violation

```markdown
## A11y: {WCAG Criterion} - {Brief Description}

**Severity:** {Critical|Serious}
**WCAG:** {criterion_number} - {criterion_name}
**E2E Session:** {session_id}

### Summary
{One sentence description}

### Affected Elements
{List of elements}

### Impact
{Who is affected and how}

### Recommended Fix
{Technical fix}

### References
- [WCAG {criterion}]({link})

---
Labels: a11y, e2e, priority:high
```

### Feedback Digest

```markdown
## E2E Feedback Digest: {Date}

**Session:** {session_id}
**Scope:** {flows_tested}
**Tester:** Claude E2E

### Summary
{1-2 sentence overall summary}

### Critical Issues (Require Immediate Attention)
- [ ] #{issue_number} - {description}
- [ ] #{issue_number} - {description}

### UX Observations
| Priority | Observation | Suggested Action |
|----------|-------------|------------------|
| High | {observation} | {action} |
| Medium | {observation} | {action} |
| Low | {observation} | {action} |

### Accessibility Notes
| Severity | Issue | WCAG |
|----------|-------|------|
| Serious | {issue} | {criterion} |
| Moderate | {issue} | {criterion} |

### Questions for PM/Design
1. {Question with context}
2. {Question with context}

### Positive Notes
{What's working well - important to preserve}

### Test Results
- Total: {count}
- Passed: {count}
- Failed: {count}
- Skipped: {count}

### Reports
- Full report: `e2e/reports/{session_id}/`
- Screenshots: `e2e/screenshots/`

---
Labels: e2e, feedback
```

## GitHub CLI Commands

### Create Issue

```bash
gh issue create \
  --title "Bug: {title}" \
  --body "$(cat <<'EOF'
{issue_body}
EOF
)" \
  --label "bug,e2e,priority:critical"
```

### Link Issues

```bash
# Add reference in issue body
gh issue edit {issue_number} \
  --body "$(gh issue view {issue_number} --json body -q .body)

Related: #{other_issue}"
```

### Add Labels

```bash
gh issue edit {issue_number} \
  --add-label "e2e,needs-triage"
```

## Workflow

```
1. Test Failure Detected
   ↓
2. Classify Severity
   ├─ Critical/Blocker → Create Issue Immediately
   ├─ High → Queue for Session Digest
   └─ Low → Include in Report Only
   ↓
3. Gather Evidence
   - Screenshot
   - Error message
   - Reproduction steps
   ↓
4. Create Issue (if needed)
   - Use appropriate template
   - Apply labels
   - Link related issues
   ↓
5. Update Session Report
   - Record issue number
   - Note action taken
```

## Label Reference

### Severity Labels
- `priority:critical` - Blocks core functionality
- `priority:high` - Significant impact
- `priority:medium` - Moderate impact
- `priority:low` - Minor issue

### Category Labels
- `bug` - Functional defect
- `ux` - User experience issue
- `a11y` - Accessibility issue
- `e2e` - Found during E2E testing

### Status Labels
- `needs-triage` - Needs team review
- `confirmed` - Issue verified
- `in-progress` - Being worked on

## Example Workflow

```
Test: wallet-connect.spec.ts:connection-success
Result: FAILED

Analyzing failure...
- Error: Element not found: 'text="Auth"'
- Screenshot captured: auth-failure-001.png

Classifying severity...
- Core authentication flow broken
- Classification: BLOCKER

Creating GitHub issue...

gh issue create \
  --title "Bug: Authentication state not updating after wallet connect" \
  --body "## Bug: Authentication state not updating after wallet connect

**Severity:** Critical - Blocker
**E2E Session:** abc123
**Test:** wallet-connect.spec.ts:connection-success

### Summary
After connecting wallet and signing, the auth status bar never shows 'Auth' status.

### Steps to Reproduce
1. Navigate to landing page
2. Connect wallet (mock wallet in approve mode)
3. Wait for authentication

### Expected Behavior
Auth status bar should show 'Auth' badge after successful authentication.

### Actual Behavior
Auth status remains on 'Unauth' indefinitely.

### Evidence
- Screenshot: ![auth-failure](e2e/screenshots/auth-failure-001.png)
- Error: Element not found: 'text=\"Auth\"'

### Impact
Users cannot authenticate, blocking all authenticated features.
" \
  --label "bug,e2e,priority:critical"

Issue created: #147

Updating session report...
- Added issue link to report
- Marked test as blocker

Continuing with remaining tests...
```

## Configuration

### Issue Creation Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `autoCreateBlockers` | true | Auto-create issues for blockers |
| `autoCreateCriticalUX` | false | Auto-create for critical UX |
| `autoCreateA11y` | false | Auto-create for a11y violations |
| `digestAtEnd` | true | Create digest at session end |

### Label Mapping

```typescript
const severityToLabels = {
  critical: ['priority:critical', 'needs-triage'],
  high: ['priority:high'],
  medium: ['priority:medium'],
  low: ['priority:low'],
};

const categoryToLabels = {
  bug: ['bug'],
  ux: ['ux'],
  a11y: ['a11y'],
};
```
