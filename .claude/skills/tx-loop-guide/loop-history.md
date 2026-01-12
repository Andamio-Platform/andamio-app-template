# Loop Testing History

Track the validation status of each transaction loop.

## Status Key

| Status | Meaning |
|--------|---------|
| **Untested** | Loop has never been run |
| **Blocked** | Blocker bug prevents completion |
| **Issues Found** | Completes but has data/UX/side-effect issues |
| **Validated** | All transactions work, data is complete, UI updates correctly |

## Validation Criteria

A loop is **Validated** when:
- All transactions complete successfully
- All required data is visible at each step
- Side effects update the database correctly
- UI updates automatically (no page refresh needed)
- No blocking issues remain open

## Loop Status

| Loop | Status | Last Tested | Tester | Open Issues | Notes |
|------|--------|-------------|--------|-------------|-------|
| 1: Onboarding | Issues Found | 2026-01-12 | @robertom | #28, #30 | Access Token mints successfully but UI stuck, alert keeps flashing |
| 3: Create & Publish Course | Untested | - | - | - | - |
| 2: Earn Credential | Blocked | 2026-01-12 | @robertom | #29, #30 | Enrollment blocked by missing transaction data |
| 4: Assignment Revision | Untested | - | - | - | - |
| 5: Multi-Module Path | Untested | - | - | - | - |
| 6: Team Teaching Setup | Untested | - | - | - | - |

## Session Log

Record each testing session here.

### 2026-01-12 — Loop 1: Onboarding

**Tester:** @robertom
**Result:** Issues Found

**Transactions:**
- [x] GENERAL_ACCESS_TOKEN_MINT — Success (on-chain) but UI stuck

**Issues Created:**
- #28 — Access Token mint UI stuck after successful transaction (blocker)
- #30 — Comprehensive feedback digest with UX issues

**Notes:**
- Transaction completed successfully on-chain (confirmed in wallet)
- UI remained stuck showing "Please sign the message in your wallet"
- Bottom-right alert notification stuck and flashing indefinitely
- Workaround: Refresh page and re-authenticate
- After refresh: Access Token and alias visible correctly
- Browser: Brave, Wallet: Eternl, Network: Preprod

**UX Findings:**
- Dashboard shows creator/teacher features to new learners prematurely
- Cost (~7.9 ADA) not shown before transaction initiation
- Alias selection flow worked well
- Navigation to minting feature was easy (center of screen)

---

### 2026-01-12 — Loop 2: Earn Credential (Enrollment Attempt)

**Tester:** @robertom
**Result:** Blocked

**Transactions:**
- [ ] COURSE_STUDENT_ENROLL — Failed (missing transaction data)

**Issues Created:**
- #29 — Transaction Input is invalid error blocks course enrollment (blocker)
- #30 — Comprehensive feedback digest (same as above)

**Notes:**
- Attempted to enroll in published course with modules
- User navigated through entire flow: selected module → started assignment → added evidence → locked evidence → attempted submission
- Transaction builder failed validation: missing alias, course_id, slt_hash, module_code, network_evidence_hash
- Console error: "Failed to fetch commitments" appeared before any user action
- Data flow issue between UI state and transaction builder
- Cannot proceed with enrollment testing until #29 is resolved

**UX Findings:**
- Enrollment flow uses unfamiliar terminology ("course state token")
- "Select Module to Begin" instruction misleading (actual requirement: submit assignment)
- Missing explanation of WHY/WHAT benefits of enrollment workflow
- "Manage SLTs" button visible to learners (should be teacher-only)
- "View Assignment" button styling unclear (document icon with text)
- Warning banner for unsaved work needs danger/warning colors
- Studio navigation inconsistent (Course Studio removes Browse links, Project Studio keeps them)
- Create Course vs Create Project UI patterns inconsistent
- Module status indicator ("101 APPROVED") meaning unclear
- Wallet disconnects on page refresh

---

### Template

```markdown
### YYYY-MM-DD — Loop X: [Name]

**Tester:** @username
**Result:** Validated | Issues Found | Blocked

**Transactions:**
- [ ] Tx 1: [name] — Success/Failed
- [ ] Tx 2: [name] — Success/Failed

**Issues Created:**
- #XX — [description]

**Notes:**
[Any observations, questions, or follow-ups]
```
