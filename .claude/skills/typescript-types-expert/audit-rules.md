# Type Audit Rules

Clear pass/fail criteria for auditing type system health in the Andamio T3 App.

## Quick Health Check

Run these commands for a fast assessment:

```bash
# Check for wrong imports
grep -r "from.*generated/gateway\"" src/ --include="*.ts" --include="*.tsx" | grep -v "types/generated/index.ts"

# Check for unsafe casts
grep -r "as any" src/ --include="*.ts" --include="*.tsx"

# Check for suppressed errors
grep -r "@ts-ignore" src/ --include="*.ts" --include="*.tsx"

# Type check
npm run typecheck
```

---

## Audit Categories

### 1. Import Discipline

| Rule | Pass | Fail |
|------|------|------|
| API types from `~/types/generated` | All API type imports use barrel export OR are in `src/hooks/api/` (see exception below) | Direct imports from `gateway.ts` in components/pages |
| UI types from `~/types/ui` | Shared patterns imported from `ui.ts` | Duplicate NavItem, IconComponent definitions |
| Type helpers from `~/lib/type-helpers` | getString/getOptionalString used | Direct NullableString field access |

**Known Exception — Hook files import directly from `gateway.ts`**:

Hook files in `src/hooks/api/` intentionally import from `~/types/generated/gateway` instead of the barrel export to **avoid circular dependencies**. The barrel `index.ts` re-exports hook types alongside generated types, so hooks importing from it would create a circular import chain. This is documented and acceptable:

```typescript
// ✅ PASS — Hook file importing directly (avoids circular dep)
// src/hooks/api/course/use-course.ts
import type { OrchestrationMergedCourseDetail } from "~/types/generated/gateway";

// ❌ FAIL — Component/page importing directly (should use barrel)
// src/components/courses/course-card.tsx
import type { OrchestrationMergedCourseDetail } from "~/types/generated/gateway";
```

**8 hook files** have this intentional pattern. Components and pages must always import from `~/types/generated`.

**How to check**:

```bash
# Check for direct gateway imports OUTSIDE of hooks (should be 0)
grep -r "from \"~/types/generated/gateway\"" src/ --include="*.ts" --include="*.tsx" | grep -v "index.ts" | grep -v "src/hooks/api/"

# Check hooks (these are expected/acceptable)
grep -r "from \"~/types/generated/gateway\"" src/hooks/api/ --include="*.ts" | wc -l  # ~8 files, acceptable

# Should return 0 results (types imported, not duplicated)
grep -r "interface NavItem" src/ | wc -l  # Should be 1 (in ui.ts)
```

---

### 2. Inline Type Validity

These inline types are **CORRECT** (pass):

| Location | Type | Reason |
|----------|------|--------|
| Component file | Component props | Single-use, co-located |
| Hook file | Hook options/return type | Single-use, co-located |
| Page file | Page-specific state | Single-use, scoped |
| Utility file | Local helper types | Single-use |

These inline types **need extraction** (fail):

| Symptom | Fix |
|---------|-----|
| Same interface in 2+ files | Extract to shared location |
| Interface duplicates API type | Import from `~/types/generated` |
| Interface duplicates UI type | Import from `~/types/ui` |

**How to check**:

```bash
# Look for duplicate interface names (manual review needed)
grep -roh "interface [A-Z][a-zA-Z]*" src/ | sort | uniq -c | sort -rn | head -20
```

---

### 3. NullableString Handling

| Rule | Pass | Fail |
|------|------|------|
| Display fields | Uses `getString()` | Direct field access |
| Optional fields | Uses `getOptionalString()` | Unsafe cast to string |
| Inline extraction | Uses `as unknown` + typeof check | Uses `as string` |

**Known NullableString fields**:
- `title`, `description`, `content`
- `policy_id`, `asset_name`
- `task_hash`, `slt_hash`
- `module_code`, `course_id`

**Acceptable patterns**:

```typescript
// ✅ PASS - Using type helper
const title = getString(entity.title);

// ✅ PASS - Inline extraction (documented pattern)
const rawTitle = task.title as unknown;
const title = typeof rawTitle === "string" ? rawTitle : "";
```

---

### 4. Type Assertions

| Pattern | Status | Reason |
|---------|--------|--------|
| `as Type` (compatible types) | ✅ Pass | Normal TypeScript |
| `as any` | ❌ Fail | Escapes type system |
| `as unknown as Type` (NullableString) | ✅ Pass | Documented workaround |
| `as unknown as Type` (other) | ⚠️ Warning | Usually indicates type mismatch |
| `@ts-ignore` without comment | ❌ Fail | Hidden errors |
| `@ts-expect-error` with explanation | ✅ Pass | Documented exception |

**How to check**:

```bash
# Should be zero or near-zero
grep -c "as any" src/**/*.{ts,tsx}

# Review each @ts-ignore for explanation
grep -B1 -A1 "@ts-ignore" src/**/*.{ts,tsx}
```

---

### 5. Zod Schema Alignment

| Rule | Pass | Fail |
|------|------|------|
| TX schemas match API spec | Schema fields match endpoint requirements | Missing or extra fields |
| Types inferred from schemas | Uses `z.infer<typeof schema>` | Duplicate type definition |
| Building blocks reused | Uses `aliasSchema`, `policyIdSchema`, etc. | Inline regex patterns |

**How to check**:

```bash
# Schemas should use building blocks
grep -c "aliasSchema\|policyIdSchema\|walletDataSchema" src/config/transaction-schemas.ts
```

---

## Health Score Calculation

### Scoring System

| Category | Weight | Max Points |
|----------|--------|------------|
| Import Discipline | 25% | 25 |
| Inline Type Validity | 20% | 20 |
| NullableString Handling | 20% | 20 |
| Type Assertions | 20% | 20 |
| Zod Schema Alignment | 15% | 15 |

### Deductions

| Violation | Deduction |
|-----------|-----------|
| Direct gateway.ts import (outside hooks) | -5 per occurrence |
| `as any` usage | -3 per occurrence |
| `@ts-ignore` without explanation | -3 per occurrence |
| Duplicate interface (2+ files) | -2 per duplicate |
| Direct NullableString access | -2 per occurrence |
| Missing Zod schema for TX | -5 per TX type |

### Score Interpretation

| Score | Grade | Status |
|-------|-------|--------|
| 90-100 | A | Excellent - minor improvements only |
| 80-89 | B | Good - a few issues to address |
| 70-79 | C | Acceptable - needs attention |
| 60-69 | D | Poor - significant issues |
| <60 | F | Failing - urgent fixes needed |

---

## Audit Report Template

When performing an audit, use this output format:

```markdown
## Type System Health Report

**File(s) Audited**: [file list]
**Date**: [date]
**Score**: [X]/100 (Grade: [A-F])

### Import Discipline (X/25)
- [ ] All API types from ~/types/generated
- [ ] UI types from ~/types/ui
- [ ] Type helpers used for NullableString

### Inline Type Validity (X/20)
- [ ] Single-use types correctly inline
- [ ] No duplicate interfaces across files
- [ ] No inline API type definitions

### NullableString Handling (X/20)
- [ ] getString/getOptionalString used
- [ ] No direct field access
- [ ] Documented inline patterns acceptable

### Type Assertions (X/20)
- [ ] Zero `as any` casts
- [ ] All @ts-ignore have explanations
- [ ] `as unknown` only for NullableString

### Zod Schema Alignment (X/15)
- [ ] Schemas match API spec
- [ ] Building blocks reused
- [ ] Types inferred from schemas

### Issues Found
1. [Issue description] - [File:line]
2. [Issue description] - [File:line]

### Recommendations
1. [Recommendation]
2. [Recommendation]

### Good Patterns Observed
- [Pattern description]
- [Pattern description]
```

---

## Automated Checks

Add these to CI/pre-commit for automated enforcement:

```bash
#!/bin/bash
# .husky/pre-commit or CI script

set -e

echo "Running type audit..."

# Check for direct gateway imports outside hooks (hooks are allowed)
if grep -r "from \"~/types/generated/gateway\"" src/ --include="*.ts" --include="*.tsx" | grep -v "index.ts" | grep -v "src/hooks/api/"; then
  echo "ERROR: Direct imports from gateway.ts found outside hooks"
  exit 1
fi

# Check for 'as any'
ANY_COUNT=$(grep -r "as any" src/ --include="*.ts" --include="*.tsx" | wc -l)
if [ "$ANY_COUNT" -gt 0 ]; then
  echo "WARNING: $ANY_COUNT 'as any' casts found"
fi

# Type check
npm run typecheck

echo "Type audit passed!"
```

---

## Quick Reference Card

**Always Import From**:
- API types → `~/types/generated`
- UI types → `~/types/ui`
- Type helpers → `~/lib/type-helpers`
- Zod schemas → `~/config/transaction-schemas`

**Always Inline**:
- Component props (single-use)
- Hook options/returns (single-use)
- Page state (single-use)

**Never Do**:
- Import from `~/types/generated/gateway` in components/pages (hooks are the exception)
- Use `as any`
- Access NullableString fields directly
- Use `@ts-ignore` without explanation
- Define inline interfaces that duplicate API types
