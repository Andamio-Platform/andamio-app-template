# API Hooks Implementation Status

> **Last Updated**: January 28, 2026
> **Summary**: Course hooks COMPLETE, Project hooks need camelCase conversion

This document provides a quick status summary. For detailed hook patterns, rules, and progress tracking, see **`/hooks-architect`**.

---

## Overview

The app uses React Query hooks as the primary interface with the Andamio API.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Gateway API   │ ──► │     HOOKS       │ ──► │   Components    │
│  (snake_case)   │     │ (transformers)  │     │  (camelCase)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## Quick Status

| Domain | Status | Details |
|--------|--------|---------|
| Course Hooks | **COMPLETE** | All 10 hooks follow the pattern |
| Project Hooks | **IN PROGRESS** | 2 hooks need camelCase conversion |
| Transaction Hooks | **COMPLETE** | All TX types consistent |

---

## Course Hooks: COMPLETE

| File | Types Owned | Status |
|------|-------------|--------|
| `use-course.ts` | Course, CourseDetail, CourseStatus | APPROVED |
| `use-course-owner.ts` | (imports) | APPROVED |
| `use-course-teacher.ts` | TeacherCourse, TeacherAssignmentCommitment | COMPLETE |
| `use-course-student.ts` | StudentCourse | COMPLETE |
| `use-course-module.ts` | CourseModule, SLT, Lesson, Assignment, Introduction | COMPLETE |
| `use-slt.ts` | (imports) | COMPLETE |
| `use-lesson.ts` | (imports) | COMPLETE |
| `use-assignment.ts` | (imports) | COMPLETE |
| `use-introduction.ts` | (imports) | COMPLETE |
| `use-module-wizard-data.ts` | (composite) | COMPLETE |

## Project Hooks: IN PROGRESS

| File | Types Owned | Status |
|------|-------------|--------|
| `use-project.ts` | Project, Task, TaskCommitment | EXEMPLARY |
| `use-project-manager.ts` | ManagerProject, ManagerCommitment (snake_case) | NEEDS WORK |
| `use-project-contributor.ts` | ContributorProject (snake_case) | NEEDS WORK |

## Transaction Hooks: COMPLETE

All 17 transaction types have consistent entries across:
- `transaction-ui.ts`
- `transaction-schemas.ts`
- `use-tx-watcher.ts`

---

## Related Documentation

- **`/hooks-architect`** - Hook rules, patterns, and implementation guide
- **`/hooks-architect` PROGRESS.md** - Detailed progress tracking for Phase 3.9 and 3.10
- **api-coverage.md** - Endpoint implementation status

---

**For detailed hook patterns and rules, run `/hooks-architect`.**
