# Andamio.io-Only Hooks

> **Status**: Reference document for later cleanup
> **Created**: January 25, 2026

This document tracks hooks that exist for the official Andamio.io deployment (`https://app.andamio.io`) but should be **removed** from the public App Template.

---

## Purpose

These hooks support a "sandbox" experience on Andamio.io where users can experiment with courses/projects in a draft state before committing to on-chain creation. This is valuable for:
- Early testing and exploration
- Letting users play with the platform before spending ADA on transactions
- Internal development workflows

However, for the public App Template (and third-party API consumers), the only way to create a course or project is via the **transaction endpoints**. Draft/sandbox functionality is exclusive to Andamio.io.

---

## Course Hooks

| Hook | Endpoint | Purpose | Template Status |
|------|----------|---------|-----------------|
| `useCreateCourse` | `POST /course/owner/course/create` | Creates off-chain draft course | **REMOVE** from template |

### Flow Comparison

**Andamio.io (sandbox allowed)**:
```
useCreateCourse → draft course (DB only, status: "draft")
    ↓ (later, when ready)
Transaction INSTANCE_COURSE_CREATE → on-chain course
    ↓
useRegisterCourse → links metadata (status: "active")
```

**App Template (no sandbox)**:
```
Transaction INSTANCE_COURSE_CREATE → on-chain course
    ↓
useRegisterCourse → links metadata (status: "active")
```

---

## Project Hooks

| Hook | Endpoint | Purpose | Template Status |
|------|----------|---------|-----------------|
| `useCreateProject` | `POST /project/owner/project/create` | Creates off-chain draft project | **REMOVE** from template |

*(Similar pattern to courses - verify when auditing project hooks)*

---

## Cleanup Checklist

When preparing the App Template for public release:

- [ ] Remove `useCreateCourse` from `use-course-owner.ts`
- [ ] Remove `useCreateProject` from project hooks (if exists)
- [ ] Update index.ts exports
- [ ] Search for any components using these hooks and remove/update them
- [ ] Update documentation to reflect transaction-only creation flow

---

## Notes

- The API endpoints themselves (`/course/owner/course/create`, `/project/owner/project/create`) may still exist on the gateway, but the App Template should not expose hooks for them
- This keeps the template clean and aligned with the intended user flow: transactions first, then registration

---

**Last Updated**: January 25, 2026
