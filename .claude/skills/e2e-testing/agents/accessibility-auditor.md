# Accessibility Auditor Agent

The Accessibility Auditor checks for WCAG 2.1 AA compliance and generates accessibility violation reports.

## Responsibilities

1. **WCAG 2.1 AA Compliance Checks**
   - Color contrast validation
   - Keyboard navigation testing
   - Focus management verification
   - ARIA attribute validation

2. **Transaction-Specific A11y**
   - Status announcements
   - Loading state communication
   - Error message accessibility

3. **Navigation A11y**
   - Skip links
   - Landmark regions
   - Heading hierarchy

## Audit Categories

### Perceivable

| Criterion | What We Check |
|-----------|---------------|
| 1.1.1 Non-text Content | Images have alt text |
| 1.3.1 Info and Relationships | Semantic HTML structure |
| 1.3.2 Meaningful Sequence | Reading order makes sense |
| 1.4.3 Contrast (Minimum) | 4.5:1 for text, 3:1 for large text |
| 1.4.11 Non-text Contrast | 3:1 for UI components |

### Operable

| Criterion | What We Check |
|-----------|---------------|
| 2.1.1 Keyboard | All interactive elements keyboard accessible |
| 2.1.2 No Keyboard Trap | Can navigate away from all elements |
| 2.4.1 Bypass Blocks | Skip links present |
| 2.4.3 Focus Order | Tab order is logical |
| 2.4.4 Link Purpose | Links have descriptive text |
| 2.4.6 Headings and Labels | Headings describe content |
| 2.4.7 Focus Visible | Focus indicator visible |

### Understandable

| Criterion | What We Check |
|-----------|---------------|
| 3.1.1 Language of Page | html lang attribute set |
| 3.2.1 On Focus | No unexpected changes on focus |
| 3.2.2 On Input | No unexpected changes on input |
| 3.3.1 Error Identification | Errors are described |
| 3.3.2 Labels or Instructions | Form fields have labels |

### Robust

| Criterion | What We Check |
|-----------|---------------|
| 4.1.1 Parsing | Valid HTML |
| 4.1.2 Name, Role, Value | ARIA used correctly |
| 4.1.3 Status Messages | Status updates announced |

## Transaction A11y Checks

### Loading States
- Screen reader announces loading start
- Loading indicator has accessible text
- Progress updates announced (for long operations)

### Success States
- Success message in live region
- Transaction hash accessible
- Action buttons clearly labeled

### Error States
- Error message in live region
- Error linked to failed action
- Recovery options accessible

### Wallet Interaction
- Signing prompt announced
- Wallet status communicated
- Timeout warnings accessible

## Report Format

### Summary

```markdown
## Accessibility Audit Summary

**Session:** {session_id}
**Standard:** WCAG 2.1 AA
**Date:** {date}

### Compliance Score
- Critical Violations: {count}
- Serious Violations: {count}
- Moderate Violations: {count}
- Minor Violations: {count}

### By Category
- Perceivable: {pass/fail}
- Operable: {pass/fail}
- Understandable: {pass/fail}
- Robust: {pass/fail}
```

### Violations Section

```markdown
## Violations

### Critical

#### V1: Missing Form Labels
**WCAG:** 3.3.2 Labels or Instructions
**Impact:** Critical
**Elements:** 3 affected

**Description:**
Form inputs do not have associated labels, making them inaccessible to screen reader users.

**Affected Elements:**
- `input#taskCode` - Missing label
- `input#taskHash` - Missing label
- `input#expiration` - Missing label

**Fix:**
Add `<label>` elements with `htmlFor` attribute or `aria-label` attributes.

---

### Serious

#### V2: Insufficient Color Contrast
**WCAG:** 1.4.3 Contrast (Minimum)
**Impact:** Serious
**Elements:** 2 affected

**Description:**
Text does not have sufficient contrast against its background.

**Affected Elements:**
- `.text-muted` on light background: 3.2:1 (requires 4.5:1)
- Status badge text: 2.8:1 (requires 4.5:1)

**Fix:**
Increase text color darkness or background lightness to achieve 4.5:1 ratio.
```

## Testing Methodology

### Automated Checks

Using Playwright's accessibility features:

```typescript
// Get accessibility snapshot
const accessibilitySnapshot = await page.accessibility.snapshot();

// Check for violations
const violations = await page.evaluate(() => {
  // Check for missing labels
  const inputs = document.querySelectorAll('input:not([aria-label]):not([id])');
  return inputs.length;
});
```

### Manual Verification Points

1. **Keyboard Navigation**
   - Tab through entire flow
   - Verify all interactive elements reachable
   - Check focus visible at all times

2. **Screen Reader Testing**
   - Key information announced
   - State changes announced
   - Error messages announced

3. **Visual Checks**
   - Text readable at 200% zoom
   - Focus indicators visible
   - No text in images

## Integration with Playwright MCP

When Playwright MCP is available:

1. **Accessibility Tree Mode**
   - Read semantic structure
   - Verify ARIA implementation
   - Check role assignments

2. **Screenshot Analysis**
   - Color contrast checking
   - Focus indicator visibility
   - Layout at different sizes

## Example Audit

```markdown
## Accessibility Audit Summary

**Session:** abc123
**Standard:** WCAG 2.1 AA
**Date:** 2026-02-03

### Compliance Score
- Critical Violations: 0
- Serious Violations: 2
- Moderate Violations: 3
- Minor Violations: 5

### By Category
- Perceivable: PASS (with warnings)
- Operable: PASS
- Understandable: PASS
- Robust: FAIL (2 serious)

## Violations

### Serious

#### V1: Live Region Missing for Transaction Status
**WCAG:** 4.1.3 Status Messages
**Impact:** Serious
**Elements:** 1 affected

**Description:**
Transaction status changes are not announced to screen readers. Users relying on assistive technology won't know when their transaction succeeds or fails.

**Affected Elements:**
- `TransactionStatus` component

**Fix:**
Add `role="status"` and `aria-live="polite"` to the status container:
```tsx
<div role="status" aria-live="polite">
  {statusMessage}
</div>
```

---

#### V2: Wallet Button Missing Accessible Name
**WCAG:** 4.1.2 Name, Role, Value
**Impact:** Serious
**Elements:** 1 affected

**Description:**
The wallet connect button (from CardanoWallet component) doesn't have an accessible name when showing only an icon.

**Affected Elements:**
- `CardanoWallet` connect button

**Fix:**
This may require coordination with Mesh SDK. As a workaround, wrap in a container with `aria-label`:
```tsx
<div aria-label="Connect Cardano wallet">
  <CardanoWallet />
</div>
```

### Moderate

#### V3: Heading Hierarchy Skip
**WCAG:** 2.4.6 Headings and Labels
**Impact:** Moderate
**Elements:** 2 affected

**Description:**
Page skips from h1 to h3 without h2, breaking heading hierarchy.

**Affected Elements:**
- `/courses` page
- `/dashboard` page

**Fix:**
Add h2 section headings or adjust existing h3 elements to h2.
```

## Output Files

Results are saved to:
- `e2e/reports/{session_id}/accessibility.md` - Human-readable report
- `e2e/reports/{session_id}/a11y-violations.json` - Machine-readable data

## GitHub Issue Template

For critical/serious violations, issues are created:

```markdown
## A11y Violation: {Brief Title}

**WCAG Criterion:** {criterion}
**Severity:** Critical | Serious
**E2E Session:** {session_id}

### Description
{violation_description}

### Affected Elements
{element_list}

### Recommended Fix
{fix_suggestion}

### References
- [WCAG {criterion}](link)
- Screenshot: {link}

---
Labels: a11y, e2e, priority:high
```
