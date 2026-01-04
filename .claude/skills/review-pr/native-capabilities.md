# Native Claude Code Capabilities for PR Review

Claude Code has several built-in capabilities that enhance PR reviews beyond what the GitHub CLI provides.

## GitHub CLI Commands

### PR Information
```bash
# View PR details
gh pr view <number>
gh pr view <number> --json title,body,author,state,labels,additions,deletions,changedFiles

# Get diff
gh pr diff <number>
gh pr diff <number> --name-only

# List PRs
gh pr list
gh pr list --author @me
gh pr list --state open

# Check PR status (CI, reviews)
gh pr checks <number>
gh pr view <number> --json reviews,reviewDecision
```

### Submitting Reviews
```bash
# Approve
gh pr review <number> --approve --body "LGTM"

# Request changes
gh pr review <number> --request-changes --body "Please fix..."

# Comment only
gh pr review <number> --comment --body "Some feedback..."
```

### PR Comments
```bash
# Add a general comment
gh pr comment <number> --body "Comment text"

# View comments
gh api repos/{owner}/{repo}/pulls/<number>/comments
```

---

## Git Commands for Analysis

### Compare Branches
```bash
# See what commits are in the PR
git log main..HEAD --oneline

# Full diff against base
git diff main...HEAD

# Stats summary
git diff main...HEAD --stat

# Only show file names
git diff main...HEAD --name-only
```

### Analyze Specific Changes
```bash
# Changes to specific file type
git diff main...HEAD -- "*.tsx"

# Changes in specific directory
git diff main...HEAD -- src/components/

# Show function-level changes
git diff main...HEAD --function-context
```

---

## Code Verification Commands

### TypeScript
```bash
# Full type check
npm run typecheck

# Type check specific files (if configured)
npx tsc --noEmit src/specific/file.ts
```

### Linting
```bash
# Run ESLint
npm run lint

# Auto-fix issues
npm run lint:fix

# Lint specific files
npx eslint src/specific/file.ts
```

### Build Verification
```bash
# Full build
npm run build

# Check for build errors without full output
npm run build 2>&1 | grep -E "(error|Error|failed)"
```

---

## File Analysis Patterns

### Find Patterns in Changed Files
```bash
# Get changed files, then search for patterns
gh pr diff <number> --name-only | xargs grep -l "pattern"

# Check for console.log in changed files
gh pr diff <number> --name-only | xargs grep -n "console.log"

# Check for TODO comments
gh pr diff <number> --name-only | xargs grep -n "TODO\|FIXME"
```

### Analyze Imports
```bash
# Find files importing from ui (should use andamio)
gh pr diff <number> --name-only | xargs grep -l "from \"~/components/ui"

# Find any type definitions (should import from andamio-db-api)
gh pr diff <number> --name-only | xargs grep -l "^type\|^interface"
```

---

## Automated Review Steps

These steps can be run automatically during a PR review:

### 1. Pre-Review Checks
```bash
# Ensure clean working directory
git status

# Fetch latest
git fetch origin

# Check out PR branch
gh pr checkout <number>
```

### 2. Static Analysis
```bash
# Type check - MUST PASS
npm run typecheck

# Lint check - SHOULD PASS (warnings acceptable)
npm run lint
```

### 3. Build Verification
```bash
# Build - MUST PASS
npm run build
```

### 4. Pattern Checks
```bash
# Check for hardcoded colors (should use semantic)
grep -rn "text-\(red\|green\|blue\|yellow\|orange\|purple\)-" src/ --include="*.tsx"

# Check for raw shadcn imports
grep -rn "from \"~/components/ui/" src/ --include="*.tsx"

# Check for 'any' types
grep -rn ": any" src/ --include="*.ts" --include="*.tsx"

# Check for console.log (except in designated logging files)
grep -rn "console.log" src/ --include="*.ts" --include="*.tsx" | grep -v "logger"
```

### 5. Security Checks
```bash
# Check for potential secrets
grep -rn "password\|secret\|api_key\|apikey" src/ --include="*.ts" --include="*.tsx" -i

# Check for hardcoded URLs (should use env vars)
grep -rn "http://\|https://" src/ --include="*.ts" --include="*.tsx" | grep -v "env\."
```

---

## Integration with Specialized Skills

### When to Invoke Each Skill

| Condition | Command | Skill to Invoke |
|-----------|---------|-----------------|
| `.tsx` files changed in `src/app/` or `src/components/` | Detected in diff | `review-styling` |
| Files importing from API or in `src/app/api/` | Detected in diff | `audit-api-coverage` |
| `.md` files changed OR large code changes | Detected in diff | `documentarian` |
| `package.json` changed | Detected in diff | Manual dependency review |
| `prisma/` files changed | Detected in diff | Schema migration review |

### Skill Invocation Pattern

```
# In the review flow:

1. Run: gh pr diff <number> --name-only
2. Categorize files by pattern
3. For each category, invoke the appropriate skill:

   UI changes detected:
   → /review-styling (provide route paths)

   API changes detected:
   → /audit-api-coverage

   Significant changes:
   → /documentarian
```

---

## Review Output Templates

### Quick Review (Small PRs)
```markdown
## PR Review: #<number>

**Checks:**
- [x] TypeScript: Pass
- [x] Lint: Pass
- [x] Build: Pass

**Finding:** None

**Verdict:** Approve
```

### Full Review (Large PRs)
```markdown
## PR Review: #<number> - <title>

### Automated Checks
| Check | Status | Details |
|-------|--------|---------|
| TypeScript | ✅ Pass | No type errors |
| ESLint | ⚠️ Warnings | 3 warnings (non-blocking) |
| Build | ✅ Pass | Built successfully |

### Pattern Checks
| Pattern | Status | Findings |
|---------|--------|----------|
| Hardcoded colors | ✅ None | - |
| Raw shadcn imports | ❌ Found | 2 files |
| `any` types | ✅ None | - |
| console.log | ⚠️ Found | 1 file (check if intentional) |

### Specialized Reviews
- **Styling**: Invoked review-styling → 2 issues
- **API**: Invoked audit-api-coverage → Coverage updated
- **Docs**: Invoked documentarian → CHANGELOG needs update

### Manual Review Notes
...

### Verdict
Request Changes - See issues above
```

---

## Useful gh API Calls

```bash
# Get detailed PR info
gh api repos/{owner}/{repo}/pulls/<number>

# Get PR comments
gh api repos/{owner}/{repo}/pulls/<number>/comments

# Get review comments
gh api repos/{owner}/{repo}/pulls/<number>/reviews

# Get PR files with patch info
gh api repos/{owner}/{repo}/pulls/<number>/files

# Get commit status checks
gh api repos/{owner}/{repo}/commits/<sha>/status
```
