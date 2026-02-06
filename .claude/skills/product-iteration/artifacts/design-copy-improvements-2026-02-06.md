# Andamio App V2 -- Design & Copy Improvements Report

**Date:** 2026-02-06
**Scope:** UX copy audit, design pattern improvements, micro-copy library, IA improvements, and priority matrix
**Codebase:** `/Users/robertom/Documents/Workspace/Projects/andamio-app-v2/`

---

## Table of Contents

1. [UX Copy Audit](#1-ux-copy-audit)
2. [Design Pattern Improvements](#2-design-pattern-improvements)
3. [Micro-Copy Library](#3-micro-copy-library)
4. [Information Architecture Improvements](#4-information-architecture-improvements)
5. [Priority Matrix](#5-priority-matrix)

---

## 1. UX Copy Audit

### 1.1 Landing Page

**File:** `/Users/robertom/Documents/Workspace/Projects/andamio-app-v2/src/config/marketing.ts` (lines 108-128)
**File:** `/Users/robertom/Documents/Workspace/Projects/andamio-app-v2/src/components/landing/landing-hero.tsx`

#### Headline

| Aspect | Detail |
|--------|--------|
| **Current copy** | "Learn. Build. Earn On-Chain Credentials." |
| **Issue** | The headline uses periods between phrases, which fragments the reading flow and feels like a list of features rather than a compelling value proposition. "On-Chain Credentials" is jargon that new visitors may not understand. |
| **Suggested copy** | "Turn Learning Into Proof That Opens Doors" |
| **Rationale** | Focuses on the outcome (proof that enables opportunity) rather than the mechanism (on-chain credentials). Reads as a single coherent idea instead of a bullet list. |

#### Subtext

| Aspect | Detail |
|--------|--------|
| **Current copy** | "Andamio connects learning with real project contributions. Complete courses, earn credentials, join funded projects." |
| **Issue** | Two sentences that repeat the headline's structure (feature list). The brand name "Andamio" in the subtext is redundant since the user is already on the Andamio site. |
| **Suggested copy** | "Complete courses to earn verifiable credentials on Cardano. Use those credentials to unlock funded project opportunities." |
| **Rationale** | Clarifies the cause-and-effect chain: courses lead to credentials lead to projects. Mentions Cardano specifically for credibility with the target audience while explaining "on-chain" for newcomers. |

#### Primary CTA

| Aspect | Detail |
|--------|--------|
| **Current copy** | "Get Started" |
| **Issue** | Generic. Does not hint at what the user will do next (connect wallet, choose alias, mint token). For a Web3 app, "Get Started" feels too vague. |
| **Suggested copy** | "Create Your Identity" |
| **Rationale** | Hints at the unique Web3 onboarding step (minting an access token / choosing an alias) which sets Andamio apart from traditional sign-up. Creates intrigue. |

#### Sign-In Text

| Aspect | Detail |
|--------|--------|
| **Current copy** | "Already have an account? Sign In" |
| **Issue** | "Account" is misleading in a Web3 context where identity is wallet-based. Users do not have "accounts" -- they have wallets with access tokens. |
| **Suggested copy** | "Already have an access token? Sign In" |
| **Rationale** | Uses the domain-specific term that matches what users actually possess. Reinforces the mental model that identity lives in the wallet. |

#### Builder Section Headline

| Aspect | Detail |
|--------|--------|
| **Current copy** | "Want to build on Andamio?" |
| **Issue** | Phrased as a question that invites a "no" response. Does not communicate the value of building on the platform. |
| **Suggested copy** | "Build courses and projects that pay contributors" |
| **Rationale** | States the unique value (contributors get paid). Changes from a question to a statement of capability. |

---

### 1.2 Dashboard Page

**File:** `/Users/robertom/Documents/Workspace/Projects/andamio-app-v2/src/app/(app)/dashboard/page.tsx`

#### Unauthenticated State

| Aspect | Detail |
|--------|--------|
| **Current copy** | Title: "Welcome to Andamio" / Description: "Connect your Cardano wallet to access your personalized learning dashboard" |
| **Issue** | "Personalized learning dashboard" is generic SaaS language. The user navigated to /dashboard so they already know what page this is. Copy should motivate them to connect. |
| **Suggested copy** | Title: "Your Learning Journey Starts Here" / Description: "Connect your Cardano wallet to see your courses, credentials, and project opportunities." |
| **Rationale** | More specific about what they will see after connecting. Mentions the three pillars (courses, credentials, projects) to build anticipation. |

#### WelcomeHero -- No Access Token State

**File:** `/Users/robertom/Documents/Workspace/Projects/andamio-app-v2/src/components/dashboard/welcome-hero.tsx` (line 63)

| Aspect | Detail |
|--------|--------|
| **Current copy** | Displays "New Member" with "Setup Required" badge |
| **Issue** | "New Member" is impersonal. "Setup Required" sounds like a chore and an error state. |
| **Suggested copy** | Display the user's truncated wallet address with a "Mint Your Token" badge |
| **Rationale** | Acknowledges the user's presence (their wallet is connected) while making the next action clear and exciting rather than clinical. |

#### WelcomeHero -- Has Access Token State

**File:** `/Users/robertom/Documents/Workspace/Projects/andamio-app-v2/src/components/dashboard/welcome-hero.tsx` (line 108)

| Aspect | Detail |
|--------|--------|
| **Current copy** | "Your on-chain identity is active. Track your learning progress, manage your courses, and explore new opportunities." |
| **Issue** | "On-chain identity is active" is developer-speak. The sentence is a generic feature list. |
| **Suggested copy** | "Everything you learn and build is recorded on Cardano. Pick up where you left off." |
| **Rationale** | Explains the benefit of on-chain identity in plain language. "Pick up where you left off" is a more actionable welcome message for a returning user. |

#### GettingStarted Steps

**File:** `/Users/robertom/Documents/Workspace/Projects/andamio-app-v2/src/components/dashboard/getting-started.tsx`

| Aspect | Detail |
|--------|--------|
| **Current copy** | Steps: "Connect Wallet" / "Mint Access Token" / "Start Learning" |
| **Issue** | Steps are clear but the third step ("Start Learning") links to /course without context. Could be more motivating. |
| **Suggested copy** | "Connect Wallet" / "Choose Your Alias" / "Explore Courses" |
| **Rationale** | "Choose Your Alias" is more exciting than "Mint Access Token" (which sounds technical). "Explore Courses" is more inviting than "Start Learning" (which implies commitment before the user has browsed). |

---

### 1.3 Course Catalog Page

**File:** `/Users/robertom/Documents/Workspace/Projects/andamio-app-v2/src/app/(app)/course/page.tsx`

#### Page Description

| Aspect | Detail |
|--------|--------|
| **Current copy** | "Explore published courses on the Andamio platform" |
| **Issue** | "Andamio platform" is redundant. "Published" is internal jargon (vs. draft). |
| **Suggested copy** | "Browse available courses and start building your skills" |
| **Rationale** | More action-oriented. Focuses on user benefit (building skills) rather than platform state (published). |

#### Empty State

| Aspect | Detail |
|--------|--------|
| **Current copy** | Title: "No Published Courses" / Description: "There are currently no published courses available. Check back later or create your own course." |
| **Issue** | "Check back later" is passive and unhelpful. Offering to "create your own course" is a jarring pivot for someone looking to learn. |
| **Suggested copy** | Title: "No Courses Available Yet" / Description: "Courses are being prepared. In the meantime, explore projects or set up your access token." |
| **Rationale** | Provides alternative actions that are relevant to a learner. Avoids the course-creator pitch in a learner context. |

#### "Unregistered" Course Status Badge

**File:** `/Users/robertom/Documents/Workspace/Projects/andamio-app-v2/src/components/courses/course-card.tsx` (line 67)

| Aspect | Detail |
|--------|--------|
| **Current copy** | Badge: "Unregistered" / Tooltip: "On-chain but needs DB registration" |
| **Issue** | "Unregistered" and the tooltip expose internal system state (DB registration) that means nothing to users. This is the most egregious example of developer-facing copy in the UI. |
| **Suggested copy** | Badge: "Coming Soon" / Tooltip: "This course is being set up by the instructor" |
| **Rationale** | Communicates the same concept (course exists but is not ready) in user-friendly language. |

---

### 1.4 Course Detail Page

**File:** `/Users/robertom/Documents/Workspace/Projects/andamio-app-v2/src/app/(app)/course/[coursenft]/page.tsx`

#### Section Header: "Your Learning Journey"

| Aspect | Detail |
|--------|--------|
| **Current copy** | "Your Learning Journey" |
| **Issue** | Slightly grandiose for what is essentially a progress tracker card. |
| **Suggested copy** | "Your Progress" |
| **Rationale** | Shorter, scannable, and matches the card title already used inside `UserCourseStatus` ("Your Progress" at line 92 of `user-course-status.tsx`). Consistency matters. |

#### Course Outline Helper Text

| Aspect | Detail |
|--------|--------|
| **Current copy** | "This course is structured around specific learning targets. Complete each module to master these skills." |
| **Issue** | "Specific learning targets" is educator jargon. "Master these skills" is an overstatement -- completing a module is one step, not mastery. |
| **Suggested copy** | "Each module covers a set of learning goals. Complete modules to earn credentials toward project access." |
| **Rationale** | Connects module completion to the tangible outcome (credentials and project access), which is Andamio's core differentiator. |

---

### 1.5 User Course Status Component

**File:** `/Users/robertom/Documents/Workspace/Projects/andamio-app-v2/src/components/learner/user-course-status.tsx`

#### Not-Enrolled State

| Aspect | Detail |
|--------|--------|
| **Current copy** | Title: "Get Started" / Description: "Begin your learning journey in {course title}" / Helper: "Commit to a module assignment to start tracking your progress." |
| **Issue** | "Commit to a module assignment" is confusing for new users who do not yet understand the commit-then-review flow. The word "commit" has blockchain connotations that obscure the action. |
| **Suggested copy** | Title: "Ready to Begin?" / Description: "Start your first module in {course title}" / Helper: "Choose a module below, write your assignment, and submit it to enroll." |
| **Rationale** | Explains the actual steps in plain language. "Submit" is more universally understood than "commit." |

#### Credential Claim CTA -- All Accepted State

| Aspect | Detail |
|--------|--------|
| **Current copy** | "All assignments complete!" / "Claim your credential/credentials to mint a permanent, verifiable proof of achievement to your wallet." |
| **Issue** | "Mint a permanent, verifiable proof of achievement to your wallet" is dense and uses Web3 jargon. The excitement of the moment is buried under technicality. |
| **Suggested copy** | "All assignments complete!" / "You earned it. Claim your credentials to add them permanently to your wallet." |
| **Rationale** | Leads with celebration ("You earned it"), then states the action and result simply. "Add them permanently to your wallet" is clearer than "mint a permanent, verifiable proof of achievement." |

#### Continue CTA

| Aspect | Detail |
|--------|--------|
| **Current copy** | "Continue with next module" |
| **Issue** | Functional but could be more specific and motivating. |
| **Suggested copy** | "Continue to {next module title}" |
| **Rationale** | Personalizes the CTA with the actual module name, making the next step concrete. |

---

### 1.6 Assignment Commitment Component

**File:** `/Users/robertom/Documents/Workspace/Projects/andamio-app-v2/src/components/learner/assignment-commitment.tsx`

#### Unauthenticated State

| Aspect | Detail |
|--------|--------|
| **Current copy** | Title: "Assignment Progress" / Description: "Connect your wallet to start this assignment" |
| **Issue** | Shows an empty card with only a header -- no CTA button, no guidance on how to connect. |
| **Suggested copy** | Title: "Submit Your Assignment" / Description: "Connect your wallet to write and submit your work for this module." / Add: An `AndamioAuthButton` or a link back to the auth flow. |
| **Rationale** | "Submit Your Assignment" is more action-oriented. Including an actual connect button prevents a dead end. |

#### Module Not On-Chain

| Aspect | Detail |
|--------|--------|
| **Current copy** | "The instructor needs to mint this module on-chain before you can submit your assignment." |
| **Issue** | Exposes blockchain mechanics. The learner cannot do anything about it, so the message should set expectations without creating frustration. |
| **Suggested copy** | "This module is being prepared by the instructor. You will be able to submit your work once setup is complete." |
| **Rationale** | Same information, no jargon. "Being prepared" implies a temporary state without blaming anyone. |

#### Evidence Lock Flow

| Aspect | Detail |
|--------|--------|
| **Current copy** | Description: "Write your evidence below. When finished, lock it to generate a hash for blockchain submission." / Lock success: "Evidence locked! You can now submit to the blockchain." |
| **Issue** | "Lock it to generate a hash for blockchain submission" is deeply technical. The lock/hash concept is an implementation detail that should be invisible to learners. |
| **Suggested copy** | Description: "Write your assignment work below. When you are ready, click Finalize to prepare it for submission." / Finalize success: "Your work is ready to submit. Review it below, then confirm." |
| **Rationale** | Replaces "lock" with "finalize" (less confusing), removes hash/blockchain mentions. The two-step flow (finalize then submit) is preserved but explained in human terms. |

#### "Needs Revision" State

| Aspect | Detail |
|--------|--------|
| **Current copy** | "Your teacher has reviewed your work and requested revisions. Please update your evidence and resubmit." |
| **Issue** | "Evidence" is not a term most learners associate with coursework. |
| **Suggested copy** | "Your instructor reviewed your submission and requested changes. Update your work below and resubmit." |
| **Rationale** | "Submission" and "work" are more natural than "evidence." "Instructor" is more standard than "teacher" in higher education contexts. |

#### "Evidence Update Required" (chain_only) State

| Aspect | Detail |
|--------|--------|
| **Current copy** | "Your assignment commitment is on-chain but evidence is missing from the database. Update your evidence to enable teacher review." |
| **Issue** | Exposes internal architecture ("on-chain," "database"). The user does not need to know about chain vs. DB sync issues. |
| **Suggested copy** | "Your assignment was submitted but the details need to be updated. Please re-enter your work below so your instructor can review it." |
| **Rationale** | Describes the same recovery action without exposing system internals. |

#### Pending Review Banner -- Fallback Status

| Aspect | Detail |
|--------|--------|
| **Current copy** | "Your assignment has been recorded. Current status: {networkStatus}" (line 592) |
| **Issue** | Displays raw technical status values like `PENDING_TX_COMMITMENT_MADE` to the user. |
| **Suggested copy** | "Your assignment has been recorded and is being processed." |
| **Rationale** | Removes the raw status string. The user just needs to know it is in progress. |

---

### 1.7 Commitment Status Badge

**File:** `/Users/robertom/Documents/Workspace/Projects/andamio-app-v2/src/components/courses/commitment-status-badge.tsx`

| Aspect | Detail |
|--------|--------|
| **Current copy** | `ASSIGNMENT_ACCEPTED` shows label "Accepted" |
| **Issue** | "Accepted" is ambiguous -- accepted by whom? For what? The proposal (proposal-2026-01-27.md) already recommends "Completed" which is clearer. |
| **Suggested copy** | "Completed" (matching AssignmentStatusBadge) |
| **Rationale** | The `AssignmentStatusBadge` in `assignment-status-badge.tsx` already uses "Completed" for `ASSIGNMENT_ACCEPTED`. The two badge components should use the same labels. This is a consistency fix. |

| Aspect | Detail |
|--------|--------|
| **Current copy** | `PENDING_TX_COMMITMENT_MADE` shows label "Confirming..." |
| **Issue** | The ellipsis and truncated label do not tell the user what is being confirmed. |
| **Suggested copy** | "Submitting" |
| **Rationale** | Clearer at a glance. Pairs well with a spinner icon. |

---

### 1.8 Auth Components

**File:** `/Users/robertom/Documents/Workspace/Projects/andamio-app-v2/src/components/auth/andamio-auth-button.tsx`

#### Authenticated Card

| Aspect | Detail |
|--------|--------|
| **Current copy** | Title: "Authenticated" / Description: "Connected to Andamio APIs" |
| **Issue** | "Authenticated" and "Connected to Andamio APIs" are developer-facing debug information, not user-facing status. |
| **Suggested copy** | Title: "Connected" / Description: "Your wallet is linked to Andamio" |
| **Rationale** | "Connected" is simpler. "Linked to Andamio" conveys the same idea without mentioning APIs. |

#### Disconnect Button

| Aspect | Detail |
|--------|--------|
| **Current copy** | "Disconnect from Andamio" |
| **Issue** | Fine but uses a destructive variant which may alarm users. The action is reversible. |
| **Suggested copy** | "Sign Out" |
| **Rationale** | More conventional. "Disconnect from Andamio" sounds permanent. |

#### Require Course Access -- Access Denied

**File:** `/Users/robertom/Documents/Workspace/Projects/andamio-app-v2/src/components/auth/require-course-access.tsx` (line 119)

| Aspect | Detail |
|--------|--------|
| **Current copy** | "You don't have permission to edit this course. Only course owners and teachers can access this page." |
| **Issue** | Copy is clear but the recovery options could be more helpful. |
| **Suggested copy** | "Only course owners and instructors can access this page. If you believe you should have access, check that you are connected with the correct wallet." |
| **Rationale** | Provides a self-service troubleshooting hint (wrong wallet) rather than a dead-end denial. |

---

### 1.9 Transaction Components

**File:** `/Users/robertom/Documents/Workspace/Projects/andamio-app-v2/src/components/tx/transaction-button.tsx`

#### Default State Text

| Aspect | Detail |
|--------|--------|
| **Current copy** | idle: "Execute Transaction" / fetching: "Preparing Transaction..." / signing: "Sign in Wallet" / submitting: "Submitting to Blockchain..." / confirming: "Awaiting Confirmation..." / success: "Transaction Successful" / error: "Transaction Failed" |
| **Issue** | "Execute Transaction" is the fallback idle text and reads like a developer console. "Submitting to Blockchain..." uses jargon. |
| **Suggested copy** | idle: "Confirm" / fetching: "Preparing..." / signing: "Sign in Your Wallet" / submitting: "Submitting..." / confirming: "Confirming..." / success: "Done" / error: "Something Went Wrong" |
| **Rationale** | Shorter labels work better in buttons. "Sign in Your Wallet" adds the possessive for clarity. "Something Went Wrong" is friendlier than "Transaction Failed." Note: these are fallbacks; most components already override them with context-specific text. |

**File:** `/Users/robertom/Documents/Workspace/Projects/andamio-app-v2/src/components/tx/transaction-status.tsx`

#### Signing State Helper Text

| Aspect | Detail |
|--------|--------|
| **Current copy** | "Check your wallet" |
| **Issue** | Adequate but could be more precise about what to look for. |
| **Suggested copy** | "A signing request is waiting in your wallet" |
| **Rationale** | Tells the user exactly what to expect when they switch to their wallet extension. |

---

### 1.10 Credential Claim Component

**File:** `/Users/robertom/Documents/Workspace/Projects/andamio-app-v2/src/components/tx/credential-claim.tsx`

#### Card Description

| Aspect | Detail |
|--------|--------|
| **Current copy** | "Mint your credential token for completing this module" |
| **Issue** | "Mint your credential token" is jargon. |
| **Suggested copy** | "Claim your proof of achievement for this module" |
| **Rationale** | "Proof of achievement" is what the credential IS, stated in plain terms. |

#### "What You're Getting" Box

| Aspect | Detail |
|--------|--------|
| **Current copy** | Title: "On-Chain Credential" / "A native Cardano token that serves as permanent, verifiable proof of your achievement." |
| **Issue** | "Native Cardano token" is deeply technical. |
| **Suggested copy** | Title: "Permanent Credential" / "A verified record of your achievement, stored on the Cardano blockchain. It belongs to you and cannot be revoked." |
| **Rationale** | Focuses on the benefits (permanent, yours, irrevocable) rather than the technology (native token). |

---

### 1.11 Enroll in Course Component

**File:** `/Users/robertom/Documents/Workspace/Projects/andamio-app-v2/src/components/tx/enroll-in-course.tsx`

#### No Access Token State

| Aspect | Detail |
|--------|--------|
| **Current copy** | "You need an access token to enroll in courses. Please mint one first." |
| **Issue** | "Mint one first" is jargon and feels like a blocker. |
| **Suggested copy** | "You need an access token to enroll. Create one below -- it only takes a moment." |
| **Rationale** | "Create one" is less technical than "mint one." Adding "it only takes a moment" reduces perceived friction. |

#### "What happens" Box

| Aspect | Detail |
|--------|--------|
| **Current copy** | "A course state token is minted to your wallet and your first submission is recorded on-chain." |
| **Issue** | "Course state token" is an implementation detail. Users do not need to know about state tokens. |
| **Suggested copy** | "You will be enrolled in this course and your first assignment will be submitted." |
| **Rationale** | States the user-visible outcome. The blockchain mechanics are invisible. |

#### Missing Data Guidance

| Aspect | Detail |
|--------|--------|
| **Current copy** | "To enroll in this course, select a module and provide your initial evidence submission. This creates your course state token and records your first assignment on-chain." |
| **Issue** | "Evidence submission" and "course state token" are jargon. Two technical concepts in one sentence. |
| **Suggested copy** | "To enroll, choose a module from the list above and write your first assignment. Submitting it will automatically enroll you in the course." |
| **Rationale** | Plain language, single clear flow: choose, write, submit, enrolled. |

---

### 1.12 My Learning Component

**File:** `/Users/robertom/Documents/Workspace/Projects/andamio-app-v2/src/components/learner/my-learning.tsx`

#### Card Description (Repeated in Multiple States)

| Aspect | Detail |
|--------|--------|
| **Current copy** | "Your enrolled courses on-chain" |
| **Issue** | "On-chain" is technical detail that does not add user value here. |
| **Suggested copy** | "Courses you are enrolled in" |
| **Rationale** | Simpler. The on-chain nature is already indicated by the OnChainIcon badge on each course card. |

#### Empty State

| Aspect | Detail |
|--------|--------|
| **Current copy** | "You haven't enrolled in any courses yet." / "Browse courses and submit an assignment to enroll." |
| **Issue** | "Submit an assignment to enroll" reverses the expected order (you usually enroll first, then submit). This reflects the Andamio protocol where enrollment happens through assignment submission, but it confuses users. |
| **Suggested copy** | "You are not enrolled in any courses yet." / "Browse courses, pick a module, and submit your first assignment to get started." |
| **Rationale** | Preserves the actual flow (submit to enroll) but frames it as a natural sequence rather than a surprising requirement. |

---

### 1.13 Migrate Page

**File:** `/Users/robertom/Documents/Workspace/Projects/andamio-app-v2/src/app/migrate/page.tsx`

#### No V1 Token Found

| Aspect | Detail |
|--------|--------|
| **Current copy** | "No V1 access token was detected in this wallet. Make sure you connected the correct wallet." / Footer: "If you don't have a V1 token, you can mint a new V2 token from the home page." |
| **Issue** | The footer hint is easy to miss. There is no button to navigate to the home page. |
| **Suggested copy** | Same text but add a CTA button: "Go to Home Page" linking to `/` |
| **Rationale** | Users who landed on /migrate by mistake or who do not have a V1 token need a clear exit path. |

---

### 1.14 Marketing Config -- Disclaimer

**File:** `/Users/robertom/Documents/Workspace/Projects/andamio-app-v2/src/config/marketing.ts` (line 172)

| Aspect | Detail |
|--------|--------|
| **Current copy** | "An LLM wrote all the copy on this page, but the sentiments are true. Thank you for being here and please pardon any confusion." |
| **Issue** | This is self-deprecating and undermines trust. It signals that the copy may be unreliable. |
| **Suggested copy** | Remove entirely, or replace with: "This is a preview build. Some text may change before launch." |
| **Rationale** | Users do not care who wrote the copy. If the copy is good, the disclaimer is unnecessary. If the copy is bad, the disclaimer does not fix it. A preview-build notice is more useful. |

---

## 2. Design Pattern Improvements

### 2.1 Visual Hierarchy on Course Detail Page

**File:** `/Users/robertom/Documents/Workspace/Projects/andamio-app-v2/src/app/(app)/course/[coursenft]/page.tsx`

**Current state:** The page has four sections stacked vertically:
1. Course header (title + badges + stats)
2. "Your Learning Journey" section with `UserCourseStatus`
3. "Course Outline" section with `CourseModuleCard` list
4. "Course Team" section

**Issues:**
- The `UserCourseStatus` card and the `CourseModuleCard` list both show module status, creating redundancy.
- No visual separation between "status overview" and "content to explore."
- The Course Team section is at the bottom and easy to miss.

**Recommendations:**
1. **Merge the module checklist in `UserCourseStatus` with the `CourseModuleCard` list.** Currently the user sees module status in two places. Instead, `UserCourseStatus` should show only a progress bar + summary + CTA, and the `CourseModuleCard` list should carry the per-module status badges. This was already proposed in `proposal-2026-01-27.md` but the current implementation has both showing module-level detail.
2. **Add a sticky progress bar at the top** (when enrolled) that shows "2 of 5 modules complete" as a thin bar. This gives persistent context without scrolling back to the progress card.
3. **Move Course Team to a sidebar card on desktop** (or an expandable card on mobile) rather than the bottom of the page. Instructors are important for trust but do not need prime vertical real estate.

### 2.2 Progress Visualization

**Current state:** Progress is shown as:
- A checklist of modules with status badges in `UserCourseStatus`
- A text summary "X of Y assignments complete"

**Issues:**
- No progress bar in the enrolled state (the proposal calls for one but it is not implemented).
- The numeric text is buried after the checklist.

**Recommendations:**
1. **Add a `<AndamioProgress>` bar** at the top of the `UserCourseStatus` card showing `(accepted / totalModules) * 100` percent. The component already exists at `/Users/robertom/Documents/Workspace/Projects/andamio-app-v2/src/components/andamio/andamio-progress.tsx`.
2. **Include accessible progress text:** "2 of 5 modules complete" with `aria-valuenow` and `aria-valuemax` attributes.
3. **Use milestone markers** on the progress bar for credential-claim thresholds (if applicable).

### 2.3 Status Badge Consistency

**Current state:** Two badge components exist for assignment status:
- `CommitmentStatusBadge` at `/Users/robertom/Documents/Workspace/Projects/andamio-app-v2/src/components/courses/commitment-status-badge.tsx`
- `AssignmentStatusBadge` at `/Users/robertom/Documents/Workspace/Projects/andamio-app-v2/src/components/learner/assignment-status-badge.tsx`

**Issues:**
- Different labels for the same status: `CommitmentStatusBadge` shows "Accepted" for `ASSIGNMENT_ACCEPTED`; `AssignmentStatusBadge` shows "Completed."
- `CommitmentStatusBadge` does not handle `NOT_STARTED`, `IN_PROGRESS`, or `CREDENTIAL_CLAIMED`.
- Two components doing the same job creates maintenance risk and inconsistency.

**Recommendations:**
1. **Deprecate `CommitmentStatusBadge`** and use `AssignmentStatusBadge` everywhere. The status mapping utility in `/Users/robertom/Documents/Workspace/Projects/andamio-app-v2/src/lib/assignment-status.ts` already provides normalization that `AssignmentStatusBadge` uses.
2. **Add a "Credential Claimed" state** with a distinguished visual (gold/primary color with `CredentialIcon`) to celebrate the ultimate achievement.
3. **Ensure all badge variants have tooltips** explaining what the status means (e.g., "Pending Review: Your instructor is reviewing your submission").

### 2.4 Transaction Flow UX

**Current state:** Transaction feedback is handled by `TransactionButton` + `TransactionStatus`, with an additional `useTxStream` confirmation stage for gateway-tracked transactions.

**Issues:**
- The three-stage feedback (button state text -> TransactionStatus alert -> TxStream confirmation panel) creates a lot of UI churn. Panels appear, change, and disappear.
- The credential claim flow has duplicated confirmation UI between `CredentialClaim` and `CredentialClaimCTA` (both in user-course-status and assignment-commitment).
- No estimated time for blockchain confirmation. Users see "Confirming on blockchain..." with no context for how long this takes.

**Recommendations:**
1. **Add time estimates:** "This usually takes 20-60 seconds" after "Confirming on blockchain..." to reduce anxiety.
2. **Consolidate transaction confirmation into a single component** that wraps the three stages (button -> status -> stream) into a linear stepper:
   - Step 1: "Preparing" (auto)
   - Step 2: "Sign in wallet" (user action required)
   - Step 3: "Submitting" (auto)
   - Step 4: "Confirming on Cardano" with time estimate (auto)
   - Step 5: "Complete" with celebration
3. **Add a toast notification** when confirmation completes if the user has scrolled away from the transaction area. The `CredentialClaimCTA` already uses `toast.success` but other flows do not.

### 2.5 Empty State Designs

**Current state:** `AndamioEmptyState` at `/Users/robertom/Documents/Workspace/Projects/andamio-app-v2/src/components/andamio/andamio-empty-state.tsx` provides a consistent empty state with icon + title + description + optional action.

**Issues:**
- Empty states in `MyLearning` do not use `AndamioEmptyState` -- they use custom markup.
- `ProjectUnlockProgress` returns `null` when there are no items, making it invisible rather than showing an encouraging message.
- The course catalog empty state suggests "create your own course" to potential learners.

**Recommendations:**
1. **Standardize all empty states to use `AndamioEmptyState`** for visual consistency. `MyLearning` should use:
   ```
   <AndamioEmptyState
     icon={CourseIcon}
     title="No courses yet"
     description="Browse courses and submit your first assignment to get started."
     action={<Link href="/course"><AndamioButton>Browse Courses</AndamioButton></Link>}
   />
   ```
2. **Show `ProjectUnlockProgress` with an aspirational message** instead of hiding it:
   ```
   Title: "Project Opportunities"
   Description: "As you complete course modules, you will unlock real project opportunities here."
   ```
3. **Context-aware empty states:** The courses empty state should differ for authenticated vs. unauthenticated users. Authenticated users with an access token could see "Check back soon -- new courses are being added regularly."

### 2.6 Responsive Considerations

**Current state:** Components use Tailwind responsive classes (`sm:`, `md:`, `lg:`, `xs:`) fairly consistently.

**Issues:**
- The `CourseModuleCard` stacks status badges below the title on mobile but keeps the learning targets section expanded, making cards very tall.
- The `UserCourseStatus` module checklist has no horizontal scrolling or collapsing behavior -- long module titles truncate but many modules create a very long list.
- The `WelcomeHero` access token badge is `hidden sm:flex`, meaning mobile users miss the prominent token display.

**Recommendations:**
1. **Collapse learning targets on mobile** in `CourseModuleCard`. Show "3 learning targets" as a summary line with a "Show details" toggle, rather than always expanding the full list.
2. **Limit the `UserCourseStatus` checklist to 5 visible modules** with a "Show all X modules" toggle when the course has more than 5. This prevents the progress card from dominating the page.
3. **Show a simplified access token indicator on mobile** in `WelcomeHero` -- a small inline badge rather than completely hiding it.

---

## 3. Micro-Copy Library

### 3.1 Transaction States

| State | Button Text (Default) | Status Message | Helper Text |
|-------|----------------------|----------------|-------------|
| **idle** | "{Action Name}" | -- | -- |
| **fetching** | "Preparing..." | "Preparing your transaction" | "This takes a few seconds" |
| **signing** | "Sign in Your Wallet" | "Waiting for your signature" | "A signing request is waiting in your wallet" |
| **submitting** | "Submitting..." | "Submitting to the Cardano network" | "Almost there" |
| **confirming** | "Confirming..." | "Confirming on Cardano" | "This usually takes 20-60 seconds" |
| **success** | "Done" | "Transaction complete" | "Your changes are now on-chain" |
| **error** | "Try Again" | "{Specific error}" | "If this keeps happening, please contact support" |

#### Context-Specific Transaction Labels

| Transaction | Idle | Fetching | Signing | Submitting | Success |
|------------|------|----------|---------|------------|---------|
| Mint Access Token | "Create Access Token" | "Preparing..." | "Sign in Your Wallet" | "Creating..." | "Access Token Created" |
| Enroll / Commit | "Submit Assignment" | "Preparing..." | "Sign in Your Wallet" | "Submitting..." | "Assignment Submitted" |
| Update Assignment | "Resubmit Assignment" | "Preparing..." | "Sign in Your Wallet" | "Updating..." | "Assignment Updated" |
| Claim Credential | "Claim Credential" | "Preparing..." | "Sign in Your Wallet" | "Claiming..." | "Credential Claimed" |
| Create Course | "Create Course" | "Preparing..." | "Sign in Your Wallet" | "Creating..." | "Course Created" |
| Assess Assignment | "Submit Assessment" | "Preparing..." | "Sign in Your Wallet" | "Submitting..." | "Assessment Submitted" |

### 3.2 Assignment Statuses

| Status Code | User-Facing Label | Short Description | Icon Suggestion |
|-------------|-------------------|-------------------|-----------------|
| `NOT_STARTED` | "Not Started" | "You have not begun this module yet" | Empty circle |
| `IN_PROGRESS` | "In Progress" | "You are working on this assignment" | Pencil/Edit |
| `PENDING_APPROVAL` | "Under Review" | "Your instructor is reviewing your submission" | Clock |
| `ASSIGNMENT_ACCEPTED` | "Completed" | "Your assignment has been approved" | Checkmark |
| `ASSIGNMENT_DENIED` | "Revision Needed" | "Your instructor requested changes to your submission" | Alert circle |
| `CREDENTIAL_CLAIMED` | "Credential Earned" | "You claimed the credential for this module" | Shield/Award |
| `UNKNOWN` | "Processing" | "We are updating your status" | Info circle |

### 3.3 Empty States

| Context | Title | Description | CTA |
|---------|-------|-------------|-----|
| **No courses (learner, catalog)** | "No Courses Available Yet" | "Courses are being prepared. Check back soon." | "Explore Projects" |
| **No courses (learner, dashboard)** | "No Courses Yet" | "Browse courses and submit your first assignment to enroll." | "Browse Courses" |
| **No credentials** | "No Credentials Yet" | "Complete course modules and claim your credentials to see them here." | "View Courses" |
| **No projects (contributor)** | "No Project Opportunities" | "As you earn credentials, project opportunities will appear here." | "Browse Courses" |
| **No projects (catalog)** | "No Projects Available" | "Projects are being set up. Check back soon." | -- |
| **No enrolled courses (studio)** | "No Courses Created" | "Create your first course to start teaching on Andamio." | "Create Course" |
| **No commitments (module)** | "No Submissions Yet" | "Write your assignment and submit it to start." | -- |
| **No pending reviews (teacher)** | "All Caught Up" | "No student assignments are waiting for your review." | "View Course" |

### 3.4 CTAs

| Action | Primary CTA | Secondary CTA | Confirmation |
|--------|------------|---------------|--------------|
| **Enroll** | "Submit Assignment" | "Learn More About This Course" | -- |
| **Commit** | "Submit Assignment" | "Save as Draft" | -- |
| **Claim credential** | "Claim Credential" | "Learn What This Means" | "You are about to claim a permanent on-chain credential. This cannot be undone." |
| **Submit evidence** | "Submit Work" | "Edit" | -- |
| **Resubmit** | "Resubmit Work" | "View Feedback" | -- |
| **Continue** | "Continue to {Module Name}" | "View All Modules" | -- |
| **Create course** | "Create Course" | "Cancel" | "Creating a course will mint a Course NFT to your wallet." |
| **Mint access token** | "Create Access Token" | "What is an Access Token?" | "Your alias will be permanently linked to this token." |

### 3.5 Confirmations and Warnings

| Scenario | Title | Body | Primary | Secondary |
|----------|-------|------|---------|-----------|
| **Claim credential** | "Claim Your Credential?" | "This adds a permanent credential to your wallet. You may need to re-enroll to continue this course." | "Claim Credential" | "Not Yet" |
| **Re-enroll after claim** | "Continue This Course?" | "You have claimed a credential. Re-enroll to continue with the remaining modules." | "Re-enroll" | "View Dashboard" |
| **Delete draft** | "Delete This Draft?" | "This will permanently remove your draft assignment. This action cannot be undone." | "Delete Draft" | "Keep Draft" |
| **Disconnect wallet** | "Sign Out?" | "You will need to reconnect your wallet and sign in again to continue." | "Sign Out" | "Stay Connected" |
| **Leave with unsaved changes** | "Unsaved Changes" | "You have unsaved work. Are you sure you want to leave?" | "Leave" | "Stay" |

### 3.6 Success Celebrations

| Event | Toast Title | Toast Description | In-Page Message |
|-------|------------|-------------------|-----------------|
| **Access token minted** | "Access Token Created!" | "Your alias {alias} is now live on Cardano" | "Welcome to Andamio. Your on-chain identity is active." |
| **Enrolled in course** | "You are Enrolled!" | "You are now enrolled in {course title}" | "Your first assignment has been submitted. Your instructor will review it." |
| **Assignment submitted** | "Assignment Submitted!" | "Your work has been submitted for review" | "Your instructor will review your submission. Check back for feedback." |
| **Assignment accepted** | -- (push notification) | -- | "Your instructor approved your assignment. You can now claim your credential." |
| **Credential claimed** | "Credential Claimed!" | "Your credential for {module title} is in your wallet" | "Congratulations. You have earned a permanent, verifiable credential." |
| **Course completed** | "Course Complete!" | "You have completed {course title}" | "All modules complete. Your credentials are in your wallet." |
| **Project unlocked** | "New Project Available!" | "You have met all prerequisites for {project title}" | "You can now join {project title} as a contributor." |

---

## 4. Information Architecture Improvements

### 4.1 Navigation Clarity

**File:** `/Users/robertom/Documents/Workspace/Projects/andamio-app-v2/src/config/navigation.ts`

**Current structure:**
```
Overview > Dashboard
Discover > Browse Courses, Browse Projects
Studio > Course Studio, Project Studio
Dev Tools > API Setup, Component Library, Sitemap
```

**Issues:**
1. "Browse Courses" uses a `LearnerIcon` but "Browse Projects" uses a `ProjectIcon`. The section is "Discover" but the icons do not form a cohesive set.
2. There is no "My Learning" or "My Credentials" item in the sidebar. These are embedded in the dashboard but users may want quick access.
3. "Dev Tools" is visible to all users. This should be hidden behind a feature flag or only shown in development mode.
4. The "Studio" section label is vague. "My Content" or "Creator Studio" would be clearer.

**Recommendations:**
1. Add a "My Learning" link under Overview (or as a second item next to Dashboard) that links to `/course` with a filter for enrolled courses.
2. Add a "Credentials" link under Overview that links to `/credentials`.
3. Rename "Studio" to "Creator Tools" for clarity.
4. Hide "Dev Tools" section behind `process.env.NODE_ENV === "development"` or a feature flag.
5. Use consistent icon style within each section -- all Discover items should use outline-style icons, all Creator Tools should use filled-style icons.

### 4.2 Feature Discoverability

**Issues identified from feedback (feedback-2026-01-27.md):**
1. **Credential claiming is buried.** The claim CTA only appeared inside the module assignment page. This has been partially addressed in `UserCourseStatus` via `CredentialClaimCTA`, but the dashboard still does not surface claimable credentials.
2. **Project prerequisites are invisible.** The `ProjectUnlockProgress` component exists but returns `null` when there are no matches (and has a TODO for the commitments hook).
3. **No notification system.** When an instructor approves an assignment, the learner has no way to know without manually checking.

**Recommendations:**
1. **Add a "Claimable Credentials" alert to the dashboard** when any assignment has `ASSIGNMENT_ACCEPTED` status but the credential has not been claimed. This should be a prominent card (not just a badge) with a direct "Claim Now" button.
2. **Show `ProjectUnlockProgress` on the dashboard** even when empty, with an aspirational empty state (see Section 2.5).
3. **Add a badge counter to the sidebar "Dashboard" item** when there are pending actions (claimable credentials, accepted assignments).
4. **Consider a "What's New" or activity feed** on the dashboard that shows recent status changes: "Module 101 accepted by {teacher}" or "You unlocked access to Project Alpha."

### 4.3 User Onboarding Flow

**Current flow:**
1. Landing page -> "Get Started" -> Choose alias -> Connect wallet -> Mint token -> First login ceremony -> Dashboard
2. Landing page -> "Sign In" -> Connect wallet -> Sign message -> Dashboard

**Issues:**
1. The registration flow (alias -> wallet -> mint -> sign-out -> sign-in) has too many steps. The sign-out/sign-in cycle after minting is confusing.
2. No onboarding tour after first sign-in. Users land on the dashboard with no guidance on what to do next.
3. The `GettingStarted` component only shows for users without an access token, then disappears forever. There is no progressive onboarding.

**Recommendations:**
1. **Add a first-time dashboard tour** that highlights: (a) My Learning section, (b) Browse Courses CTA, (c) Course Studio for creators. Could be a dismissable banner or a 3-step tooltip walkthrough.
2. **Simplify the post-mint flow.** Instead of forcing sign-out/sign-in, auto-refresh the JWT after mint confirmation. The ceremony is nice but the wallet disconnection causes confusion.
3. **Add progressive onboarding milestones:**
   - "You enrolled in your first course!" (after first enrollment)
   - "Your first assignment was accepted!" (after first acceptance)
   - "You earned your first credential!" (after first claim)
   These can be toast notifications or a timeline in the dashboard.

### 4.4 Role-Based Experience Differentiation

**Current state:** The app serves three roles:
- **Learners** (course enrollment, assignments, credentials)
- **Instructors** (course management, assessment)
- **Project contributors** (task commitment, project credentials)

The sidebar shows all relevant sections based on auth state, but there is no explicit role selection or dashboard customization.

**Recommendations:**
1. **Differentiate the dashboard grid** based on detected role:
   - If user owns courses: show `OwnedCoursesSummary` and `PendingReviewsSummary` prominently
   - If user is enrolled in courses: show `MyLearning` and `StudentAccomplishments` prominently
   - If user contributes to projects: show `ContributingProjectsSummary` prominently
   This is already partially done (components return null when irrelevant) but the order should be role-prioritized.
2. **Add quick-action cards** at the top of the dashboard based on role:
   - Learner: "Continue {course name}" or "Claim credential for {module name}"
   - Instructor: "Review 3 pending assignments"
   - Contributor: "Submit work for {task name}"

---

## 5. Priority Matrix

Recommendations are scored by **Impact** (High/Med/Low) and **Effort** (High/Med/Low), then sorted by quick wins first (High Impact + Low Effort).

### Quick Wins (High Impact, Low Effort)

| # | Recommendation | Impact | Effort | File(s) |
|---|---------------|--------|--------|---------|
| 1 | **Unify status badge labels** -- deprecate `CommitmentStatusBadge`, use `AssignmentStatusBadge` everywhere | High | Low | `commitment-status-badge.tsx`, `course-module-card.tsx`, `user-course-status.tsx` |
| 2 | **Replace "Unregistered" badge** with "Coming Soon" on course cards | High | Low | `course-card.tsx` |
| 3 | **Remove raw status strings** from `CommitmentStatusBanner` fallback | High | Low | `assignment-commitment.tsx` (line 592) |
| 4 | **Remove LLM disclaimer** from marketing config | Med | Low | `marketing.ts` (line 172) |
| 5 | **Fix "Already have an account?"** to "Already have an access token?" | Med | Low | `marketing.ts` (line 116) |
| 6 | **Change "evidence" to "work/submission"** across all learner-facing copy | High | Low | `assignment-commitment.tsx`, `enroll-in-course.tsx` |
| 7 | **Replace "Authenticated" / "Connected to Andamio APIs"** with "Connected" / "Your wallet is linked to Andamio" | Med | Low | `andamio-auth-button.tsx` |
| 8 | **Change "Disconnect from Andamio"** to "Sign Out" | Med | Low | `andamio-auth-button.tsx` |
| 9 | **Add time estimate** to blockchain confirmation messages ("usually 20-60 seconds") | High | Low | `credential-claim.tsx`, `enroll-in-course.tsx`, `first-login-card.tsx`, `assignment-commitment.tsx` |
| 10 | **Fix "Your enrolled courses on-chain"** to "Courses you are enrolled in" | Med | Low | `my-learning.tsx` |

### Medium-Term Improvements (High/Med Impact, Med Effort)

| # | Recommendation | Impact | Effort | File(s) |
|---|---------------|--------|--------|---------|
| 11 | **Add progress bar** to `UserCourseStatus` enrolled state | High | Med | `user-course-status.tsx` |
| 12 | **Standardize all empty states** to use `AndamioEmptyState` | Med | Med | `my-learning.tsx`, `project-unlock-progress.tsx` |
| 13 | **Show ProjectUnlockProgress with aspirational empty state** instead of returning null | Med | Med | `project-unlock-progress.tsx` |
| 14 | **Add "Claimable Credentials" alert card** to dashboard | High | Med | `dashboard/page.tsx`, new component |
| 15 | **Collapse learning targets on mobile** in CourseModuleCard | Med | Med | `course-module-card.tsx` |
| 16 | **Replace "lock evidence" with "finalize"** and remove hash/blockchain language | High | Med | `assignment-commitment.tsx` |
| 17 | **Merge duplicate module status display** -- simplify `UserCourseStatus` to progress + CTA only, let `CourseModuleCard` carry per-module status | High | Med | `user-course-status.tsx`, course detail page |
| 18 | **Rewrite landing page headline and subtext** per Section 1.1 recommendations | Med | Med | `marketing.ts` |
| 19 | **Add sidebar badge counter** for pending actions | Med | Med | `app-sidebar.tsx`, `navigation.ts` |
| 20 | **Replace "mint" with "create"** in all user-facing access token copy | Med | Med | Multiple files (`marketing.ts`, `getting-started.tsx`, `welcome-hero.tsx`, `enroll-in-course.tsx`) |

### Strategic Investments (High Impact, High Effort)

| # | Recommendation | Impact | Effort | File(s) |
|---|---------------|--------|--------|---------|
| 21 | **Consolidate transaction confirmation into a linear stepper** component | High | High | `transaction-button.tsx`, `transaction-status.tsx`, all tx components |
| 22 | **Add first-time dashboard tour / progressive onboarding** | High | High | `dashboard/page.tsx`, new components |
| 23 | **Add activity feed / notification system** for status changes | High | High | New components, requires backend support |
| 24 | **Role-based dashboard reordering** | Med | High | `dashboard/page.tsx` |
| 25 | **Simplify post-mint flow** to avoid sign-out/sign-in cycle | High | High | `first-login-card.tsx`, auth hooks |
| 26 | **Hide Dev Tools section** behind env flag | Low | Low | `navigation.ts` |

### Low Priority / Polish

| # | Recommendation | Impact | Effort | File(s) |
|---|---------------|--------|--------|---------|
| 27 | **Add tooltips to all status badges** explaining their meaning | Low | Med | `assignment-status-badge.tsx` |
| 28 | **Limit `UserCourseStatus` checklist** to 5 visible modules with toggle | Low | Med | `user-course-status.tsx` |
| 29 | **Show simplified access token badge on mobile** in WelcomeHero | Low | Low | `welcome-hero.tsx` |
| 30 | **Personalize "Continue with next module"** to include the module title | Low | Low | `user-course-status.tsx` |
| 31 | **Add sticky progress bar** on course detail for enrolled users | Low | Med | Course detail page |
| 32 | **Move Course Team to sidebar on desktop** | Low | Med | Course detail page |

---

## Summary

The Andamio app has a solid foundation of reusable components and a well-structured design system. The most impactful improvements fall into three categories:

1. **Language normalization** (items 1-10): Replacing developer-facing terms ("evidence," "mint," "on-chain," "authenticated," "unregistered," raw status codes) with user-facing language across all components. This is high-impact, low-effort work that dramatically improves first impressions.

2. **Progress visibility** (items 11, 14, 17): Making the learner's advancement tangible through progress bars, claimable credential alerts, and streamlined module status display. This addresses the core feedback from proposal-2026-01-27.md.

3. **Transaction clarity** (items 9, 16, 21): Reducing anxiety during blockchain transactions by adding time estimates, simplifying the evidence submission language, and eventually consolidating the multi-stage feedback into a coherent stepper.

The quick wins (items 1-10) can be implemented in a single sprint with minimal risk, delivering immediate UX improvement across the entire app.
