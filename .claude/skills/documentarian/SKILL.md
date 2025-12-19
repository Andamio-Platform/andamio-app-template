---
name: documentarian
description: Review the latest changes and make sure they are updated in the docs.
---

# Documentarian

## Introduction

After changes are made to the codebase, your job is to review the changes and systematically update related documentation.

## Instructions

### 1. Review Latest Changes

Inspect the latest git commits and any unstaged changes. Make a list of files that were changed, including app routes, components, hooks, and utility functions.

This will serve as our checklist in Step 2.

### 2. Search Docs for Changed Files

Review existing documentation by searching the following locations for mentions of each changed file from Step 1:
- The `.claude` directory and all sub-folders. Treat Claude Skills and supporting files as documentation.
- The main `README.md` file.
- The `CHANGELOG.md`
- The `docs` directory. This will be mostly deprecated in the future, but for now it is still place where drafts are kept.

### 3. Update Existing Docs

Based on the results of your search in Step 2, update the related documentation files. Pay particular attention to the supporting files in each Claude Skill.

### 4. Create New Docs

If any features are not yet covered in the existing documentation, write the necessary docs, or add the new changes/features to existing docs.

### 5. Suggest New Claude Skills

Now that we are storing most documentation in Claude Skills, can you recommend any new Skills we should build to make this App Template more accessible to vibe coders?

Add any new skill suggestions to the `BACKLOG.md` file in this skill directory. This file tracks:
- Suggested new skills (with priority and rationale)
- Documentation improvement ideas
- Process improvements for the documentarian skill itself

Review the backlog periodically and move completed items to the archive section.

## Examples

Claude Code will build these examples, and they will be refined with each iteration.

## Output Format

- Simple report of all changes and recommendations in Claude REPL