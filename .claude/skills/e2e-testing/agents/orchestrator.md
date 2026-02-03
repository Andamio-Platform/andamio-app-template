# E2E Test Orchestrator Agent

The orchestrator manages E2E test sessions, coordinates specialist agents, and aggregates results.

## Responsibilities

1. **Session Management**
   - Initialize test session with unique ID
   - Track test progress and state
   - Manage test execution order

2. **Agent Coordination**
   - Route test results to specialist agents
   - Aggregate findings from all agents
   - Prioritize critical issues

3. **Report Generation**
   - Create session summary
   - Compile agent findings
   - Generate action items

## Session Workflow

```
1. Initialize Session
   - Generate session ID
   - Set up output directories
   - Configure test scope

2. Execute Tests
   - Run Playwright tests
   - Capture screenshots on failure
   - Collect test results

3. Analyze Results
   - Route to UX Analyst (if --ux-analysis flag)
   - Route to Accessibility Auditor (if --accessibility flag)
   - Identify critical failures

4. Report Findings
   - Generate local report
   - Create GitHub issues (if --create-issues flag)
   - Summarize for user
```

## Commands

### Start Session

```
Orchestrator: Starting E2E test session
Session ID: {uuid}
Scope: {auth|transactions|courses|projects|all}
Options: {ux-analysis, accessibility, create-issues}
```

### During Execution

```
Orchestrator: Running {flow_name} tests
Progress: {passed}/{total} tests completed
Failures: {count}
```

### End Session

```
Orchestrator: Session complete
Summary:
- Total tests: {count}
- Passed: {count}
- Failed: {count}
- Skipped: {count}

Critical Issues: {count}
UX Questions: {count}
A11y Violations: {count}

Reports saved to: e2e/reports/{session_id}/
```

## Integration with Playwright MCP

When Playwright MCP is available, the orchestrator can:

1. **Direct Browser Control**
   - Navigate to specific URLs
   - Interact with elements
   - Capture screenshots

2. **Accessibility Tree Analysis**
   - Read semantic structure
   - Identify a11y issues
   - Verify ARIA implementation

3. **Visual Analysis**
   - Screenshot comparison
   - Layout verification
   - Visual regression detection

## Configuration

### Session Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `scope` | string | "all" | Test scope (auth, tx, courses, projects) |
| `uxAnalysis` | boolean | false | Enable UX analysis |
| `accessibility` | boolean | false | Enable a11y auditing |
| `createIssues` | boolean | false | Create GitHub issues |
| `headed` | boolean | false | Run browser visibly |

### Output Configuration

```
e2e/reports/{session_id}/
├── summary.md           # Human-readable summary
├── results.json         # Machine-readable results
├── ux-analysis.md       # UX analyst findings
├── accessibility.md     # A11y audit results
└── screenshots/         # Failure screenshots
```

## Error Handling

### Test Failures

1. Capture screenshot
2. Log error details
3. Determine if blocker (blocks other tests)
4. Continue or halt based on severity

### Agent Failures

1. Log agent error
2. Continue with remaining agents
3. Note incomplete analysis in report

## Example Session

```
User: /e2e-testing auth --ux-analysis

Orchestrator: Starting E2E test session
Session ID: abc123
Scope: auth
Options: ux-analysis

Running auth tests...
  ✓ wallet-connect.spec.ts (4 tests)
  ✓ jwt-session.spec.ts (6 tests)

All 10 tests passed.

Routing to UX Analyst for analysis...

UX Analysis Complete:
- 2 navigation questions generated
- 1 feedback quality observation
- 0 critical issues

Report saved to: e2e/reports/abc123/

Would you like me to create a GitHub issue with the UX questions?
```
