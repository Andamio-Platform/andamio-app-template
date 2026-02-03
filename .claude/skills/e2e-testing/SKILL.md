---
name: e2e-testing
description: AI-powered E2E testing orchestrator using Playwright MCP. Run comprehensive tests, UX analysis, accessibility audits, and automated bug reporting.
---

# E2E Testing Skill

AI-powered end-to-end testing for Andamio using Playwright MCP with specialist agents.

## Quick Start

```bash
# Run all tests
/e2e-testing run

# Run specific flow
/e2e-testing auth
/e2e-testing transactions
/e2e-testing courses

# Run with analysis
/e2e-testing auth --ux-analysis
/e2e-testing courses --accessibility
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    E2E Test Orchestrator                        │
│  (Coordinates test execution, delegates to specialist agents)  │
└─────────────────────────────────────────────────────────────────┘
        │                │                │                │
        ▼                ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  UX Analyst  │ │ Accessibility│ │   Visual     │ │     Bug      │
│              │ │   Auditor    │ │  Regression  │ │   Reporter   │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
        │                │                │                │
        └────────────────┴────────────────┴────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │   Playwright MCP      │
                    │  (Browser Automation) │
                    └───────────────────────┘
```

## Available Commands

| Command | Description |
|---------|-------------|
| `/e2e-testing run` | Run all E2E tests |
| `/e2e-testing auth` | Test authentication flows |
| `/e2e-testing transactions` | Test transaction flows |
| `/e2e-testing courses` | Test course flows |
| `/e2e-testing projects` | Test project flows |
| `/e2e-testing accessibility` | Run accessibility audit |
| `/e2e-testing report` | Generate test report |

## Flags

| Flag | Description |
|------|-------------|
| `--ux-analysis` | Include UX analysis with questions for PM |
| `--accessibility` | Include WCAG 2.1 AA accessibility audit |
| `--create-issues` | Create GitHub issues for blockers |
| `--headed` | Run tests with visible browser |
| `--debug` | Enable Playwright debug mode |

## Reference Files

### Playwright Tests
- `e2e/tests/auth/` - Authentication flow tests
- `e2e/tests/transactions/` - Transaction flow tests
- `e2e/tests/courses/` - Course flow tests
- `e2e/tests/projects/` - Project flow tests
- `e2e/tests/accessibility/` - Accessibility tests

### Mocks & Fixtures
- `e2e/mocks/mesh-wallet-mock.ts` - Mesh SDK wallet mock
- `e2e/mocks/gateway-mock.ts` - Gateway API mock
- `e2e/fixtures/auth.fixture.ts` - Auth state fixture

### Agent Configurations
- [agents/orchestrator.md](./agents/orchestrator.md) - Main orchestrator
- [agents/ux-analyst.md](./agents/ux-analyst.md) - UX analysis
- [agents/accessibility-auditor.md](./agents/accessibility-auditor.md) - A11y audits
- [agents/bug-reporter.md](./agents/bug-reporter.md) - Issue creation

### Flow Definitions
- [flows/auth-flow.md](./flows/auth-flow.md) - Auth flow steps
- [flows/course-flows.md](./flows/course-flows.md) - Course flow steps
- [flows/transaction-flows.md](./flows/transaction-flows.md) - TX flow steps
- [flows/project-flows.md](./flows/project-flows.md) - Project flow steps

### Selector Registry
- [selectors/auth-selectors.md](./selectors/auth-selectors.md)
- [selectors/transaction-selectors.md](./selectors/transaction-selectors.md)
- [selectors/navigation-selectors.md](./selectors/navigation-selectors.md)

## Test Flows

### Authentication Flow
1. Navigate to landing page
2. Connect wallet (mocked)
3. Sign authentication message
4. Verify JWT session established
5. Verify auth status bar shows authenticated

### Transaction Flows
1. **Mint Access Token** - New user onboarding
2. **Course Create** - Owner creates course
3. **Assignment Commit** - Student commits to assignment
4. **Assignment Assess** - Teacher assesses submission
5. **Credential Claim** - Student claims credential

### Course Flows
1. **Browse Catalog** - View available courses
2. **Enroll Flow** - Enroll in course, access modules
3. **Module Navigation** - Navigate lessons and assignments
4. **Credential Claim** - Complete course, claim credential

### Project Flows
1. **Browse Projects** - View available projects
2. **Task Commitment** - Commit to project task
3. **Contributor Dashboard** - View contributions

## Wallet Mock Modes

The wallet mock supports different behaviors:

```typescript
// Auto-approve all signing requests
setWalletMockMode('approve');

// Simulate user rejection
setWalletMockMode('reject');

// Simulate wallet timeout
setWalletMockMode('timeout');
```

## Output

### Local Reports (Always Generated)
- `e2e/reports/[session-id].md` - Markdown report
- `e2e/reports/[session-id].json` - JSON data
- `e2e/screenshots/` - Failure screenshots
- `e2e/reports/html/` - HTML report (view with `npm run test:e2e:report`)

### GitHub Issues (Critical Only)
Created automatically for:
- **Blocker bugs** - Tests that cannot complete
- **Critical UX issues** - Broken user flows
- **Accessibility violations** - WCAG AA failures

## Running Tests

### Via npm scripts
```bash
npm run test:e2e              # All tests
npm run test:e2e:ui           # Interactive UI mode
npm run test:e2e:debug        # Debug mode
npm run test:e2e:chromium     # Chromium only
npm run test:e2e:mobile       # Mobile viewport
npm run test:e2e:a11y         # Accessibility tests
npm run test:e2e:report       # View HTML report
```

### Via Playwright MCP
When Playwright MCP is configured, the orchestrator can:
- Take screenshots for visual analysis
- Read accessibility tree for semantic testing
- Generate traces for debugging
- Run tests with AI-powered analysis

## Environment Variables

```bash
PLAYWRIGHT_BASE_URL="http://localhost:3000"  # Override base URL
CI=true                                        # CI mode (no reuse, retries)
```

## Integration with tx-loop-guide

This skill complements `/tx-loop-guide` by providing automated testing:

| tx-loop-guide | e2e-testing |
|---------------|-------------|
| Manual guided testing | Automated regression testing |
| Real wallet, real blockchain | Mocked wallet, mocked API |
| UX feedback collection | UX analysis generation |
| Blocker issue creation | Automated issue creation |

Use `/tx-loop-guide` for exploratory testing with real users.
Use `/e2e-testing` for regression testing and CI/CD.

## Specialist Agents

### UX Analyst
Analyzes test results and generates questions:
- Navigation clarity assessment
- Feedback quality evaluation
- Transaction UX review
- Role-specific experience analysis

### Accessibility Auditor
Checks WCAG 2.1 AA compliance:
- Color contrast validation
- Keyboard navigation testing
- ARIA attribute verification
- Focus management review

### Bug Reporter
Creates GitHub issues:
- Formats blocker bug reports
- Creates feedback digest issues
- Links related issues
- Applies appropriate labels
