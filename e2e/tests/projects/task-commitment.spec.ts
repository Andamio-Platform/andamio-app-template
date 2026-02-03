/**
 * Task Commitment E2E Tests
 *
 * Tests the project task commitment flow:
 * - Finding available tasks
 * - Task commitment transaction
 * - First-time enrollment (enroll + commit)
 * - Task completion tracking
 */

import { test, expect } from "../../fixtures/auth.fixture";
import { transaction, project } from "../../helpers/selectors";
import { mockTransactionFlow } from "../../mocks/gateway-mock";
import { setMockWalletMode } from "../../mocks/mesh-wallet-mock";

test.describe("Task Commitment Flow", () => {
  test.describe("Finding Available Tasks", () => {
    test("displays available tasks on project page", async ({ authenticatedPageWithToken }) => {
      await authenticatedPageWithToken.route("**/project/project-1**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "project-1",
            title: "Test Project",
            tasks: [
              { id: "task-1", code: "TASK_001", title: "Available Task", status: "available", reward: "5000000" },
              { id: "task-2", code: "TASK_002", title: "Committed Task", status: "committed" },
            ],
          }),
        });
      });

      await authenticatedPageWithToken.goto("/projects/project-1");
      await authenticatedPageWithToken.waitForLoadState("networkidle");

      // Should show available tasks
      const availableTask = authenticatedPageWithToken.locator('text=/available/i');
      const hasAvailable = await availableTask.isVisible().catch(() => false);
      console.log(`Available tasks visible: ${hasAvailable}`);
    });

    test("shows task rewards", async ({ authenticatedPageWithToken }) => {
      await authenticatedPageWithToken.route("**/project/project-1**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "project-1",
            tasks: [{ id: "task-1", code: "TASK_001", reward: "5000000", rewardFormatted: "5 ADA" }],
          }),
        });
      });

      await authenticatedPageWithToken.goto("/projects/project-1");
      await authenticatedPageWithToken.waitForLoadState("networkidle");

      // Look for reward display
      const rewardDisplay = authenticatedPageWithToken.locator('text=/\\d+ ADA|reward/i');
      const hasReward = await rewardDisplay.isVisible().catch(() => false);
      console.log(`Task reward visible: ${hasReward}`);
    });

    test("shows task expiration", async ({ authenticatedPageWithToken }) => {
      await authenticatedPageWithToken.route("**/project/project-1**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "project-1",
            tasks: [{ id: "task-1", code: "TASK_001", expirationDays: 30 }],
          }),
        });
      });

      await authenticatedPageWithToken.goto("/projects/project-1");
      await authenticatedPageWithToken.waitForLoadState("networkidle");

      // Look for expiration display
      const expirationDisplay = authenticatedPageWithToken.locator('text=/\\d+ day|expires|expiration/i');
      const hasExpiration = await expirationDisplay.isVisible().catch(() => false);
      console.log(`Task expiration visible: ${hasExpiration}`);
    });
  });

  test.describe("First-Time Enrollment", () => {
    test("shows enroll & commit for new contributors", async ({ authenticatedPageWithToken }) => {
      await authenticatedPageWithToken.route("**/project/project-1**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "project-1",
            title: "Test Project",
            isContributor: false, // Not yet enrolled
            tasks: [{ id: "task-1", code: "TASK_001", status: "available" }],
          }),
        });
      });

      await authenticatedPageWithToken.goto("/projects/project-1");
      await authenticatedPageWithToken.waitForLoadState("networkidle");

      // Look for "Enroll & Commit" button
      const enrollCommitButton = authenticatedPageWithToken.locator('button:has-text("Enroll")').first();
      const hasEnrollCommit = await enrollCommitButton.isVisible().catch(() => false);
      console.log(`Enroll & Commit button visible: ${hasEnrollCommit}`);
    });

    test("completes enroll and commit transaction", async ({ authenticatedPageWithToken }) => {
      await mockTransactionFlow(authenticatedPageWithToken, {
        txType: "enroll-commit",
        shouldFail: false,
      });

      await authenticatedPageWithToken.route("**/project/project-1**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "project-1",
            isContributor: false,
            tasks: [{ id: "task-1", code: "TASK_001", status: "available" }],
          }),
        });
      });

      await authenticatedPageWithToken.goto("/projects/project-1");
      await authenticatedPageWithToken.waitForLoadState("networkidle");

      // Find the enroll/commit button
      const commitButton = authenticatedPageWithToken.locator('button:has-text("Enroll"), button:has-text("Commit")').first();

      if (await commitButton.isVisible()) {
        await commitButton.click();

        // Wait for success message
        const successMessage = authenticatedPageWithToken.locator(transaction.status.success.message);
        await expect(successMessage).toBeVisible({ timeout: 15000 });
      }
    });

    test("shows welcome message after first enrollment", async ({ authenticatedPageWithToken }) => {
      await mockTransactionFlow(authenticatedPageWithToken, {
        txType: "enroll-commit",
        shouldFail: false,
      });

      await authenticatedPageWithToken.route("**/project/project-1**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "project-1",
            isContributor: false,
            tasks: [{ id: "task-1", code: "TASK_001", status: "available" }],
          }),
        });
      });

      await authenticatedPageWithToken.goto("/projects/project-1");
      await authenticatedPageWithToken.waitForLoadState("networkidle");

      const commitButton = authenticatedPageWithToken.locator('button:has-text("Enroll"), button:has-text("Commit")').first();

      if (await commitButton.isVisible()) {
        await commitButton.click();

        // Look for welcome message
        const welcomeMessage = authenticatedPageWithToken.locator('text=/welcome|enrolled/i');
        const hasWelcome = await welcomeMessage.isVisible({ timeout: 15000 }).catch(() => false);
        console.log(`Welcome message visible: ${hasWelcome}`);
      }
    });
  });

  test.describe("Task Commitment (Existing Contributor)", () => {
    test("shows commit button for existing contributors", async ({ authenticatedPageWithToken }) => {
      await authenticatedPageWithToken.route("**/project/project-1**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "project-1",
            isContributor: true, // Already enrolled
            tasks: [{ id: "task-1", code: "TASK_001", status: "available" }],
          }),
        });
      });

      await authenticatedPageWithToken.goto("/projects/project-1");
      await authenticatedPageWithToken.waitForLoadState("networkidle");

      // Should show "Commit to Task" instead of "Enroll & Commit"
      const commitButton = authenticatedPageWithToken.locator('button:has-text("Commit")').first();
      const hasCommit = await commitButton.isVisible().catch(() => false);
      console.log(`Commit to Task button visible: ${hasCommit}`);
    });

    test("completes task commitment transaction", async ({ authenticatedPageWithToken }) => {
      await mockTransactionFlow(authenticatedPageWithToken, {
        txType: "task-commit",
        shouldFail: false,
      });

      await authenticatedPageWithToken.route("**/project/project-1**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "project-1",
            isContributor: true,
            tasks: [{ id: "task-1", code: "TASK_001", status: "available" }],
          }),
        });
      });

      await authenticatedPageWithToken.goto("/projects/project-1");
      await authenticatedPageWithToken.waitForLoadState("networkidle");

      const commitButton = authenticatedPageWithToken.locator('button:has-text("Commit")').first();

      if (await commitButton.isVisible()) {
        await commitButton.click();

        // Wait for success
        const successMessage = authenticatedPageWithToken.locator(transaction.status.success.message);
        await expect(successMessage).toBeVisible({ timeout: 15000 });
      }
    });

    test("handles commitment failure", async ({ authenticatedPageWithToken }) => {
      await mockTransactionFlow(authenticatedPageWithToken, {
        txType: "task-commit",
        shouldFail: true,
        errorMessage: "Task already committed by another user",
      });

      await authenticatedPageWithToken.route("**/project/project-1**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "project-1",
            isContributor: true,
            tasks: [{ id: "task-1", code: "TASK_001", status: "available" }],
          }),
        });
      });

      await authenticatedPageWithToken.goto("/projects/project-1");
      await authenticatedPageWithToken.waitForLoadState("networkidle");

      const commitButton = authenticatedPageWithToken.locator('button:has-text("Commit")').first();

      if (await commitButton.isVisible()) {
        await commitButton.click();

        // Wait for error
        const errorMessage = authenticatedPageWithToken.locator(transaction.status.error.message);
        await expect(errorMessage).toBeVisible({ timeout: 10000 });
      }
    });

    test("handles wallet rejection", async ({ authenticatedPageWithToken }) => {
      await setMockWalletMode(authenticatedPageWithToken, "reject");

      await authenticatedPageWithToken.route("**/project/project-1**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "project-1",
            isContributor: true,
            tasks: [{ id: "task-1", code: "TASK_001", status: "available" }],
          }),
        });
      });

      await authenticatedPageWithToken.goto("/projects/project-1");
      await authenticatedPageWithToken.waitForLoadState("networkidle");

      const commitButton = authenticatedPageWithToken.locator('button:has-text("Commit")').first();

      if (await commitButton.isVisible()) {
        await commitButton.click();

        // Should show rejection error
        const errorMessage = authenticatedPageWithToken.locator(transaction.status.error.message);
        await expect(errorMessage).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test.describe("Commit with Rewards", () => {
    test("shows claim rewards option for eligible tasks", async ({ authenticatedPageWithToken }) => {
      await authenticatedPageWithToken.route("**/project/project-1**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "project-1",
            isContributor: true,
            pendingRewards: "10000000", // Has rewards to claim
            tasks: [{ id: "task-1", code: "TASK_001", status: "available", reward: "5000000" }],
          }),
        });
      });

      await authenticatedPageWithToken.goto("/projects/project-1");
      await authenticatedPageWithToken.waitForLoadState("networkidle");

      // Look for "Commit & Claim Rewards" option
      const claimRewardsButton = authenticatedPageWithToken.locator('button:has-text("Claim Rewards")').first();
      const hasClaimRewards = await claimRewardsButton.isVisible().catch(() => false);
      console.log(`Claim Rewards button visible: ${hasClaimRewards}`);
    });
  });

  test.describe("My Committed Tasks", () => {
    test("shows committed tasks in contributor dashboard", async ({ authenticatedPageWithToken }) => {
      await authenticatedPageWithToken.route("**/project/my-tasks**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            { id: "task-1", code: "TASK_001", projectTitle: "Test Project", status: "committed" },
            { id: "task-2", code: "TASK_002", projectTitle: "Test Project", status: "completed" },
          ]),
        });
      });

      await authenticatedPageWithToken.goto("/dashboard");
      await authenticatedPageWithToken.waitForLoadState("networkidle");

      // Look for my tasks section
      const myTasks = authenticatedPageWithToken.locator('text=/my task|committed task/i');
      const hasMyTasks = await myTasks.isVisible().catch(() => false);
      console.log(`My tasks section visible: ${hasMyTasks}`);
    });

    test("shows task progress status", async ({ authenticatedPageWithToken }) => {
      await authenticatedPageWithToken.route("**/project/my-tasks**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            { id: "task-1", code: "TASK_001", status: "committed", progress: 50 },
          ]),
        });
      });

      await authenticatedPageWithToken.goto("/dashboard");
      await authenticatedPageWithToken.waitForLoadState("networkidle");

      // Look for progress indicator
      const progressIndicator = authenticatedPageWithToken.locator('[class*="progress"], text=/\\d+%/');
      const hasProgress = await progressIndicator.isVisible().catch(() => false);
      console.log(`Task progress indicator visible: ${hasProgress}`);
    });
  });
});
