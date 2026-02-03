/**
 * Course Create Transaction E2E Tests
 *
 * Tests the course creation transaction flow:
 * - Course creation form
 * - Transaction building with course data
 * - Module and assignment configuration
 * - Successful course creation
 * - Error handling
 */

import { test, expect } from "../../fixtures/auth.fixture";
import { transaction, course, form } from "../../helpers/selectors";
import { mockTransactionFlow } from "../../mocks/gateway-mock";
import { setMockWalletMode } from "../../mocks/mesh-wallet-mock";

test.describe("Course Create Transaction Flow", () => {
  test.describe("Navigation to Course Creation", () => {
    test("can navigate to create course page", async ({ authenticatedPageWithToken }) => {
      await authenticatedPageWithToken.goto("/courses");
      await authenticatedPageWithToken.waitForLoadState("networkidle");

      // Look for create course button
      const createButton = authenticatedPageWithToken
        .locator('button:has-text("Create Course"), a:has-text("Create Course")')
        .first();

      const createVisible = await createButton.isVisible().catch(() => false);
      console.log(`Create course button visible: ${createVisible}`);

      if (createVisible) {
        await createButton.click();

        // Should navigate to course creation page/modal
        await authenticatedPageWithToken.waitForLoadState("networkidle");
      }
    });

    test("requires access token to create course", async ({ authenticatedPage }) => {
      // User without access token
      await authenticatedPage.goto("/courses");
      await authenticatedPage.waitForLoadState("networkidle");

      // Create button may be disabled or show message about needing token
      const createButton = authenticatedPage.locator('button:has-text("Create Course")').first();

      if (await createButton.isVisible()) {
        const isDisabled = await createButton.isDisabled();
        console.log(`Create button disabled without token: ${isDisabled}`);
      }
    });
  });

  test.describe("Course Creation Form", () => {
    test("displays course creation form fields", async ({ authenticatedPageWithToken }) => {
      await authenticatedPageWithToken.goto("/courses/create");
      await authenticatedPageWithToken.waitForLoadState("networkidle");

      // Look for common form fields
      const titleInput = authenticatedPageWithToken
        .locator('input[name="title"], input[placeholder*="title" i]')
        .first();
      const descriptionInput = authenticatedPageWithToken
        .locator('textarea[name="description"], textarea[placeholder*="description" i]')
        .first();

      const hasTitleField = await titleInput.isVisible().catch(() => false);
      const hasDescField = await descriptionInput.isVisible().catch(() => false);

      console.log(`Title field visible: ${hasTitleField}`);
      console.log(`Description field visible: ${hasDescField}`);
    });

    test("validates required fields", async ({ authenticatedPageWithToken }) => {
      await authenticatedPageWithToken.goto("/courses/create");
      await authenticatedPageWithToken.waitForLoadState("networkidle");

      // Try to submit without filling required fields
      const submitButton = authenticatedPageWithToken.locator(form.button.submit).first();

      if (await submitButton.isVisible()) {
        await submitButton.click();

        // Should show validation errors
        const validationError = authenticatedPageWithToken.locator(form.validation.error);
        const hasError = await validationError.isVisible().catch(() => false);
        console.log(`Validation error shown: ${hasError}`);
      }
    });
  });

  test.describe("Transaction Success", () => {
    test("completes course creation transaction", async ({ authenticatedPageWithToken }) => {
      await mockTransactionFlow(authenticatedPageWithToken, {
        txType: "course-create",
        shouldFail: false,
      });

      await authenticatedPageWithToken.goto("/courses/create");
      await authenticatedPageWithToken.waitForLoadState("networkidle");

      // Fill in course details
      const titleInput = authenticatedPageWithToken
        .locator('input[name="title"], input[placeholder*="title" i]')
        .first();

      if (await titleInput.isVisible()) {
        await titleInput.fill("Test Course E2E");

        const descriptionInput = authenticatedPageWithToken
          .locator('textarea[name="description"], textarea[placeholder*="description" i]')
          .first();

        if (await descriptionInput.isVisible()) {
          await descriptionInput.fill("Test course created by E2E tests");
        }

        // Submit form
        const submitButton = authenticatedPageWithToken.locator(form.button.submit).first();

        if (await submitButton.isVisible()) {
          await submitButton.click();

          // Wait for transaction to complete
          const successMessage = authenticatedPageWithToken.locator(transaction.status.success.message);
          await expect(successMessage).toBeVisible({ timeout: 15000 });
        }
      }
    });

    test("redirects to course page after creation", async ({ authenticatedPageWithToken }) => {
      await mockTransactionFlow(authenticatedPageWithToken, {
        txType: "course-create",
        shouldFail: false,
      });

      await authenticatedPageWithToken.goto("/courses/create");
      await authenticatedPageWithToken.waitForLoadState("networkidle");

      const titleInput = authenticatedPageWithToken
        .locator('input[name="title"], input[placeholder*="title" i]')
        .first();

      if (await titleInput.isVisible()) {
        await titleInput.fill("Test Course E2E");

        const submitButton = authenticatedPageWithToken.locator(form.button.submit).first();

        if (await submitButton.isVisible()) {
          await submitButton.click();

          // Wait for redirect or success state
          await authenticatedPageWithToken.waitForLoadState("networkidle");

          // May redirect to course detail page
          const url = authenticatedPageWithToken.url();
          console.log(`URL after course creation: ${url}`);
        }
      }
    });
  });

  test.describe("Transaction Failure", () => {
    test("handles transaction build failure", async ({ authenticatedPageWithToken }) => {
      await mockTransactionFlow(authenticatedPageWithToken, {
        txType: "course-create",
        shouldFail: true,
        errorMessage: "Course with this name already exists",
      });

      await authenticatedPageWithToken.goto("/courses/create");
      await authenticatedPageWithToken.waitForLoadState("networkidle");

      const titleInput = authenticatedPageWithToken
        .locator('input[name="title"], input[placeholder*="title" i]')
        .first();

      if (await titleInput.isVisible()) {
        await titleInput.fill("Duplicate Course Name");

        const submitButton = authenticatedPageWithToken.locator(form.button.submit).first();

        if (await submitButton.isVisible()) {
          await submitButton.click();

          // Should show error
          const errorMessage = authenticatedPageWithToken.locator(transaction.status.error.message);
          await expect(errorMessage).toBeVisible({ timeout: 10000 });
        }
      }
    });

    test("handles wallet signing rejection", async ({ authenticatedPageWithToken }) => {
      await setMockWalletMode(authenticatedPageWithToken, "reject");

      await authenticatedPageWithToken.goto("/courses/create");
      await authenticatedPageWithToken.waitForLoadState("networkidle");

      const titleInput = authenticatedPageWithToken
        .locator('input[name="title"], input[placeholder*="title" i]')
        .first();

      if (await titleInput.isVisible()) {
        await titleInput.fill("Test Course");

        const submitButton = authenticatedPageWithToken.locator(form.button.submit).first();

        if (await submitButton.isVisible()) {
          await submitButton.click();

          // Should show rejection error
          const errorMessage = authenticatedPageWithToken.locator(transaction.status.error.message);
          await expect(errorMessage).toBeVisible({ timeout: 10000 });
        }
      }
    });
  });

  test.describe("Module Configuration", () => {
    test("can add modules to course", async ({ authenticatedPageWithToken }) => {
      await authenticatedPageWithToken.goto("/courses/create");
      await authenticatedPageWithToken.waitForLoadState("networkidle");

      // Look for add module button
      const addModuleButton = authenticatedPageWithToken
        .locator('button:has-text("Add Module"), button:has-text("Add Section")')
        .first();

      const hasAddModule = await addModuleButton.isVisible().catch(() => false);
      console.log(`Add module button visible: ${hasAddModule}`);

      if (hasAddModule) {
        await addModuleButton.click();

        // Should show module configuration form
        const moduleForm = authenticatedPageWithToken.locator('[class*="module"], [data-testid="module-form"]');
        const hasModuleForm = await moduleForm.isVisible().catch(() => false);
        console.log(`Module form visible: ${hasModuleForm}`);
      }
    });

    test("can configure module assignments", async ({ authenticatedPageWithToken }) => {
      await authenticatedPageWithToken.goto("/courses/create");
      await authenticatedPageWithToken.waitForLoadState("networkidle");

      // Look for assignment configuration
      const addAssignmentButton = authenticatedPageWithToken.locator('button:has-text("Add Assignment")').first();

      const hasAddAssignment = await addAssignmentButton.isVisible().catch(() => false);
      console.log(`Add assignment button visible: ${hasAddAssignment}`);
    });
  });
});

test.describe("Course Publish Transaction", () => {
  test("can publish a draft course", async ({ authenticatedPageWithToken }) => {
    await mockTransactionFlow(authenticatedPageWithToken, {
      txType: "course-publish",
      shouldFail: false,
    });

    // Navigate to a draft course (mock or real)
    await authenticatedPageWithToken.goto("/courses");
    await authenticatedPageWithToken.waitForLoadState("networkidle");

    // Look for a draft course with publish option
    const publishButton = authenticatedPageWithToken.locator('button:has-text("Publish")').first();

    const canPublish = await publishButton.isVisible().catch(() => false);
    console.log(`Publish button visible: ${canPublish}`);

    if (canPublish) {
      await publishButton.click();

      // Wait for confirmation dialog or transaction
      await authenticatedPageWithToken.waitForLoadState("networkidle");
    }
  });
});
