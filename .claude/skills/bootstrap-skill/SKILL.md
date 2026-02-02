---
name: bootstrap-skill
description: Bootstrap new Claude skills with consistent structure, registration, and documentation.
---

# Bootstrap Skill

**Purpose**: Scaffold new Claude skills from scratch, ensuring they follow established patterns, get registered in all the right places, and integrate with the existing skill ecosystem.

> **Last Updated**: 2026-02-01

## When to Use

- When creating a brand new Claude skill
- When a skill exists as just an idea or a rough draft and needs proper structure
- When you notice a gap in the skill ecosystem and want to formalize a new skill
- When `/documentarian` suggests a new skill in the backlog
- When prompted with `/bootstrap-skill`

## Prerequisites

Before bootstrapping, you should have:
1. A clear **name** for the skill (kebab-case, e.g., `my-new-skill`)
2. A one-line **description** of what it does
3. A rough idea of **when it should be used**

If any of these are missing, the skill will interview the user to determine them.

## Workflow

### Step 1: Interview (if needed)

If the user hasn't provided a clear name, description, and purpose, ask:

**Question 1**: "What should this skill be called?" (kebab-case, e.g., `schema-validator`)

**Question 2**: "In one sentence, what does this skill do?"

**Question 3**: "When should someone use this skill?"

| Option | Description |
|--------|-------------|
| **After an event** | "Triggered by an external change (like API updates)" |
| **On demand** | "User invokes it when they need it" |
| **During a workflow** | "Called by another skill as part of a larger process" |
| **Periodically** | "Run on a schedule (daily, weekly, before releases)" |

**Question 4**: "Does this skill have modes?"

| Option | Description |
|--------|-------------|
| **No modes** | "Single workflow, always does the same thing" |
| **2-3 modes** | "A few distinct workflows under one skill" |
| **I'm not sure** | "Help me figure out if it needs modes" |

### Step 2: Scaffold the Directory

Create the skill directory and SKILL.md:

```
.claude/skills/{skill-name}/
├── SKILL.md              # Main skill definition (always required)
└── {supporting-files}    # Any reference docs the skill needs
```

### Step 3: Write the SKILL.md

Use this structure (matching the established pattern across all skills):

```markdown
---
name: {skill-name}
description: {one-line description}
---

# {Skill Title}

**Purpose**: {expanded description with context}

> **Last Updated**: {today's date}

## When to Use

- {trigger condition 1}
- {trigger condition 2}
- When prompted with `/{skill-name}`

## Data Sources

| File | Purpose |
|------|---------|
| {file} | {what it provides} |

## Workflow

### Step 1: {First Step}

{Clear instructions for what to do}

### Step 2: {Second Step}

{Clear instructions}

### Step N: Verify Changes

```bash
npm run typecheck
npm run build
```

## Integration with Other Skills

| Skill | Integration |
|-------|-------------|
| {skill} | {how they interact} |

## Quick Reference Commands

```bash
# {description}
{command}
```
```

**Key principles for SKILL.md**:
- Steps should be **concrete and actionable** — not vague guidance
- Include **file paths** that the skill reads or modifies
- Include **verification steps** (typecheck, build, grep)
- Include **examples** of expected output where possible
- Reference **Data Sources** so the skill knows where to look
- Keep the tone **instructional** (you're writing instructions for Claude, not docs for humans)

### Step 4: Create Supporting Files (if needed)

Supporting files are reference documents that the skill reads during execution. Common patterns:

| Type | Example | When to Create |
|------|---------|----------------|
| Reference doc | `api-endpoints.md` | Skill needs a curated reference that doesn't exist elsewhere |
| Checklist | `checklist.md` | Skill runs through a repeatable verification list |
| Templates | `templates/` | Skill generates structured output |
| Progress tracker | `PROGRESS.md` | Skill tracks work across sessions |
| Best practices | `best-practices.md` | Skill enforces patterns that need detailed explanation |

**Rule**: Only create supporting files if the SKILL.md would be too long (>300 lines) without them, or if the reference data changes independently of the workflow.

### Step 5: Register the Skill

Update these files to register the new skill:

#### 5a. SKILLS-AUDIT.md

Add an entry to `.claude/skills/SKILLS-AUDIT.md`:

**In the Summary table**:
```markdown
| `{skill-name}` | ✅ Active | Medium | {N} files | {brief note} |
```

**In the Skill Details section** (add a new numbered section):
```markdown
### {N}. `{skill-name}` ✅

**Purpose**: {description}

**Files** ({count}): `SKILL.md`, `{other files}`
```

**In the Skill Relationships diagram** (if it integrates with other skills):
Add the appropriate connections.

#### 5b. CLAUDE.md

Add the skill to the **Claude Skills** table in `.claude/CLAUDE.md`:

```markdown
| `{skill-name}` | {description} |
```

#### 5c. getting-started skill

If the skill is user-invocable, add it to:
- The "All Skills at a Glance" table in `.claude/skills/getting-started/SKILL.md`
- The appropriate intent category (Explore/Build/Fix/Review/Test)
- The `skill-reference.md` file if it exists

### Step 6: Verify Registration

Run these checks to confirm the skill is properly registered:

```bash
# Skill directory exists with SKILL.md
ls -la .claude/skills/{skill-name}/

# Skill appears in SKILLS-AUDIT.md
grep -c "{skill-name}" .claude/skills/SKILLS-AUDIT.md

# Skill appears in CLAUDE.md skills table
grep -c "{skill-name}" .claude/CLAUDE.md

# No broken cross-references
grep -r "{skill-name}" .claude/skills/ --include="*.md" -l
```

### Step 7: Test the Skill

Suggest the user test the new skill:

1. Invoke it with `/{skill-name}`
2. Verify it reads the correct files
3. Verify it produces the expected output
4. Check that integration with other skills works

## Maturity Levels

New skills start at **Low** maturity and graduate through use:

| Level | Criteria | What's Present |
|-------|----------|----------------|
| **Low** | Just created | SKILL.md only, basic workflow |
| **Medium** | Used a few times | SKILL.md + 1-2 supporting files, refined steps |
| **High** | Battle-tested | SKILL.md + multiple files, modes, examples, edge cases |

## Anti-Patterns

| Anti-Pattern | Why It's Bad | Instead |
|-------------|--------------|---------|
| Skill with no clear trigger | Nobody knows when to use it | Define explicit "When to Use" triggers |
| Skill that duplicates another | Confuses routing, splits docs | Extend existing skill with a new mode |
| Huge SKILL.md (500+ lines) | Hard to maintain, slow to read | Extract reference data to supporting files |
| Skill with no verification step | Can't tell if it worked | Always include typecheck/build/grep checks |
| Supporting files with no SKILL.md references | Orphaned docs | Every file must be referenced from SKILL.md |

## Integration with Other Skills

| Skill | Integration |
|-------|-------------|
| `documentarian` | Suggests new skills via BACKLOG.md → bootstrap-skill creates them |
| `getting-started` | Bootstrap-skill registers new skills here for discoverability |
| `review-pr` | New skills that touch PR review should be added as delegation targets |
| `project-manager` | Track skill creation in STATUS.md if it's part of a larger initiative |

## Quick Reference

```bash
# List all existing skills
ls .claude/skills/

# Check the template
cat .claude/skills/SKILL-template.md

# Count skills in audit
grep -c "✅ Active" .claude/skills/SKILLS-AUDIT.md

# Find all skill cross-references
grep -r "/{skill-name}" .claude/skills/ --include="*.md"
```

## Example: Bootstrapping a "schema-validator" Skill

**Input**: "I need a skill that validates Zod schemas against the API spec"

**Output**:

1. Created `.claude/skills/schema-validator/SKILL.md` with:
   - 5-step workflow (fetch spec → compare schemas → report drift → fix → verify)
   - Data sources table pointing to API spec URL and local schema files
   - Integration with `transaction-auditor` and `typescript-types-expert`

2. Created `.claude/skills/schema-validator/known-schemas.md` as reference

3. Registered in:
   - `SKILLS-AUDIT.md` (Summary + Details)
   - `CLAUDE.md` (Skills table)
   - `getting-started/SKILL.md` (Build mode recommendations)

4. Verification:
   ```
   ✅ Directory exists
   ✅ SKILL.md has frontmatter
   ✅ Registered in SKILLS-AUDIT.md
   ✅ Registered in CLAUDE.md
   ✅ Cross-references valid
   ```
