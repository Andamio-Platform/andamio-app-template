/**
 * PR Spec: fix/post-claim-stale-ui
 *
 * Tests the fix for stale UI after a Leave & Claim transaction.
 *
 * Bug: After a contributor completes Leave & Claim, the gateway continues to
 * report `commitmentStatus: "ACCEPTED"` because the on-chain state hasn't
 * transitioned yet. This caused the project page to show "Task Accepted"
 * banners and the contributor page to show decision cards (Continue
 * Contributing / Leave & Claim) even though the user already claimed.
 *
 * Fix: The app now cross-references `project.credentialClaims` to detect
 * when the user has already claimed. If their alias appears in
 * credentialClaims, the stale "ACCEPTED" status is treated as historical —
 * banners are suppressed, decision cards are hidden, and the task detail
 * page shows "Rewards Claimed" instead of the post-acceptance flow.
 *
 * Tier 1: Mocked UI state assertions (always run)
 * Tier 2: Live smoke tests against dev environment (skipped by default)
 */

import { test, expect } from "../../fixtures/auth.fixture";
import { setupGatewayMock } from "../../mocks/gateway-mock";
import type { Page, Route } from "@playwright/test";

// ── Mock Data ──────────────────────────────────────────────────────────────

const PROJECT_ID = "mock-project-post-claim-test";
const TASK_HASH =
  "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
const USER_ALIAS = "TestAlias"; // Must match the auth fixture's accessTokenAlias

// Mock data uses API snake_case format — hooks transform it via
// transformProjectDetail / transformMergedTask / transformContributorCommitment.
const mockProject = {
  project_id: PROJECT_ID,
  content: {
    title: "Test Project (Post-Claim)",
    description: "A project for testing post-claim UI state",
  },
  contributor_state_id: "contributor-state-" + PROJECT_ID,
  treasury_address: "addr_test1mock",
  treasury_balance: 100000000,
  treasury_fundings: [],
  prerequisites: [],
  credential_claims: [{ alias: USER_ALIAS, tx: "claimed-tx-hash-123" }],
  contributors: [{ alias: USER_ALIAS }],
  submissions: [{ task_hash: TASK_HASH, submitted_by: USER_ALIAS }],
  assessments: [],
  tasks: [
    {
      task_hash: TASK_HASH,
      lovelace_amount: 5000000,
      expiration_posix: 1800000000000,
      on_chain_content: null,
    },
  ],
  source: "merged",
};

const mockCommitments = [
  {
    project_id: PROJECT_ID,
    task_hash: TASK_HASH,
    submission_tx: "submission-tx-hash-456",
    on_chain_content: null,
    on_chain_status: null,
    content: {
      commitment_status: "ACCEPTED",
      evidence: null,
      pending_tx_hash: null,
      task_evidence_hash: null,
      assessed_by: null,
      task_outcome: null,
    },
    source: "merged",
  },
];

const mockTasks = [
  {
    task_hash: TASK_HASH,
    project_id: PROJECT_ID,
    content: { title: "Test Task Alpha", description: "A test task", task_index: 0 },
    lovelace_amount: 5000000,
    expiration_posix: 1800000000000,
    contributor_state_id: "contributor-state-" + PROJECT_ID,
    created_by: "owner-alias",
    on_chain_content: null,
    source: "merged",
  },
  {
    task_hash: "available-task-hash-001",
    project_id: PROJECT_ID,
    content: { title: "Available Task 1", description: "An available task", task_index: 1 },
    lovelace_amount: 3000000,
    expiration_posix: 1800000000000,
    contributor_state_id: "contributor-state-" + PROJECT_ID,
    created_by: "owner-alias",
    on_chain_content: null,
    source: "merged",
  },
  {
    task_hash: "available-task-hash-002",
    project_id: PROJECT_ID,
    content: { title: "Available Task 2", description: "Another available task", task_index: 2 },
    lovelace_amount: 4000000,
    expiration_posix: 1800000000000,
    contributor_state_id: "contributor-state-" + PROJECT_ID,
    created_by: "owner-alias",
    on_chain_content: null,
    source: "merged",
  },
];

// ── Mock Setup ─────────────────────────────────────────────────────────────

/**
 * Intercept all project-related API calls with post-claim mock data.
 *
 * The user (TestAlias) has:
 * - A credential_claim (they already claimed)
 * - A commitment with commitment_status "ACCEPTED" (gateway hasn't transitioned)
 * - A contributor entry (gateway still lists them)
 * - A submission for their task
 * - 3 tasks on-chain: 1 submitted (their task), 2 available
 *
 * All mock data uses API snake_case format (the hooks transform it).
 */
async function setupPostClaimMocks(page: Page): Promise<void> {
  await setupGatewayMock(page, {
    customHandlers: {
      [`project/user/project/${PROJECT_ID}`]: async (route: Route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: mockProject }),
        });
      },
      "project/user/tasks/list": async (route: Route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: mockTasks }),
        });
      },
      "project/contributor/commitments/list": async (route: Route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: mockCommitments }),
        });
      },
      "project/contributor/commitment/get": async (route: Route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: mockCommitments[0] }),
        });
      },
    },
  });
}

// ── Tier 1: Mocked UI State Assertions ─────────────────────────────────────

test.describe("fix/post-claim-stale-ui — Tier 1: Mocked UI", () => {
  test("project page hides contributor status banner after claim", async ({
    authenticatedPageWithToken,
  }) => {
    const page = authenticatedPageWithToken;
    await setupPostClaimMocks(page);

    await page.goto(`/project/${PROJECT_ID}`, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });

    // The "Task Accepted" status banner should NOT be visible —
    // the contributorStatus memo returns null when hasClaimed is true.
    await expect(
      page.getByText("Task Accepted", { exact: false }),
    ).not.toBeVisible({ timeout: 5000 });

    // The "contributing to this project" enrollment banner should also be hidden.
    await expect(
      page.getByText("contributing to this project", { exact: false }),
    ).not.toBeVisible({ timeout: 5000 });
  });

  test("contributor page shows 'Welcome Back' status instead of 'Task Accepted'", async ({
    authenticatedPageWithToken,
  }) => {
    const page = authenticatedPageWithToken;
    await setupPostClaimMocks(page);

    await page.goto(`/project/${PROJECT_ID}/contributor`, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });

    // The status stat should show "Welcome Back" (hasClaimed + no pending).
    await expect(
      page.getByText("Welcome Back"),
    ).toBeVisible({ timeout: 10000 });

    // "Task Accepted" should NOT appear — the user already claimed.
    await expect(
      page.getByText("Task Accepted"),
    ).not.toBeVisible({ timeout: 5000 });
  });

  test("contributor page hides decision cards after claim", async ({
    authenticatedPageWithToken,
  }) => {
    const page = authenticatedPageWithToken;
    await setupPostClaimMocks(page);

    await page.goto(`/project/${PROJECT_ID}/contributor`, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });

    // Wait for the page to render contributor content.
    await expect(
      page.getByText("Welcome Back"),
    ).toBeVisible({ timeout: 10000 });

    // The ACCEPTED decision cards should NOT be visible because hasClaimed is true.
    // The active commitment card renders "Rewards Claimed" instead of the decision flow.
    await expect(
      page.getByText("Choose your next step"),
    ).not.toBeVisible({ timeout: 5000 });

    await expect(
      page.getByText("Continue Contributing"),
    ).not.toBeVisible({ timeout: 5000 });

    await expect(
      page.getByText("Leave & Claim"),
    ).not.toBeVisible({ timeout: 5000 });
  });

  test("contributor page shows correct earned rewards (5 ADA)", async ({
    authenticatedPageWithToken,
  }) => {
    const page = authenticatedPageWithToken;
    await setupPostClaimMocks(page);

    await page.goto(`/project/${PROJECT_ID}/contributor`, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });

    // Wait for the page to render.
    await expect(
      page.getByText("Welcome Back"),
    ).toBeVisible({ timeout: 10000 });

    // The task has lovelaceAmount "5000000" = 5 ADA.
    // After claim, all accepted rewards are earned (hasClaimed → return totalAccepted).
    // formatLovelace("5000000") should produce "5" or "5 ADA" depending on the formatter.
    // Look for "5" within the Claimed Rewards stat.
    await expect(
      page.getByText("Claimed Rewards"),
    ).toBeVisible({ timeout: 10000 });

    // formatLovelace("5000000") returns "5 ADA" — assert the exact formatted string.
    // Use .first() because "5 ADA" appears in multiple spots (stat, badge, task card).
    await expect(
      page.getByText("5 ADA").first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test("task detail page shows 'Rewards Claimed' instead of decision flow", async ({
    authenticatedPageWithToken,
  }) => {
    const page = authenticatedPageWithToken;
    await setupPostClaimMocks(page);

    await page.goto(`/project/${PROJECT_ID}/${TASK_HASH}`, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });

    // The "Rewards Claimed" text should be visible inside the commitment status card.
    // This is rendered when commitmentStatus === "ACCEPTED" && hasClaimed.
    await expect(
      page.getByText("Rewards Claimed"),
    ).toBeVisible({ timeout: 10000 });

    // The post-acceptance decision flow should NOT be visible.
    await expect(
      page.getByText("Choose your next step"),
    ).not.toBeVisible({ timeout: 5000 });

    // The credential claim confirmation text should be visible.
    await expect(
      page.getByText("claimed your credential and rewards", { exact: false }),
    ).toBeVisible({ timeout: 10000 });
  });
});

// ── Tier 2: Live Smoke Tests ───────────────────────────────────────────────

test.describe("fix/post-claim-stale-ui — Tier 2: Live Smoke", () => {
  const LIVE_PROJECT_ID =
    process.env.E2E_PROJECT_ID ??
    "095b0bac55305cbc106305ebd2e5dbc9300842fc7ae96084c761deb0";

  // Skip all Tier 2 tests unless explicitly enabled via E2E_LIVE=true.
  test.beforeEach(() => {
    test.skip(
      process.env.E2E_LIVE !== "true",
      "Tier 2 live smoke tests require E2E_LIVE=true and a running dev server",
    );
  });

  test("project page loads without errors", async ({
    authenticatedPageWithToken,
  }) => {
    const page = authenticatedPageWithToken;

    await page.goto(`/project/${LIVE_PROJECT_ID}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Verify no error alerts are shown.
    const errorAlert = page.locator('[role="alert"]');
    await expect(errorAlert).not.toBeVisible({ timeout: 10000 });

    // Verify the page has meaningful content (not a blank/error page).
    const mainContent = page.locator("main");
    await expect(mainContent).toBeVisible({ timeout: 10000 });
  });

  test("task detail page loads without errors", async ({
    authenticatedPageWithToken,
  }) => {
    const page = authenticatedPageWithToken;

    // Navigate to the project page first to find a task link.
    await page.goto(`/project/${LIVE_PROJECT_ID}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Try to find and click a task link.
    const taskLink = page
      .locator(`a[href*="/project/${LIVE_PROJECT_ID}/"]`)
      .first();
    const taskLinkCount = await taskLink.count();

    if (taskLinkCount === 0) {
      test.skip(true, "No task links found on project page");
      return;
    }

    await taskLink.click();
    await page.waitForLoadState("domcontentloaded");

    // Verify no error alerts are shown.
    const errorAlert = page.locator('[role="alert"]');
    await expect(errorAlert).not.toBeVisible({ timeout: 10000 });

    // Verify the page has meaningful content.
    const mainContent = page.locator("main");
    await expect(mainContent).toBeVisible({ timeout: 10000 });
  });
});
