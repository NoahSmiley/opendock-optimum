import { test, expect } from "@playwright/test";
import { loginUser, navigateTo, createBoard } from "./helpers";

async function setupBoardWithTicket(page: import("@playwright/test").Page) {
  await navigateTo(page, "Boards");
  await createBoard(page);
  // Create ticket via first column
  await page.locator('button:has-text("Create")').first().click();
  await page.locator('input[placeholder="What needs to be done?"]').fill("Comment Ticket");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1000);
  // Open ticket detail by clicking the key (not the title)
  const card = page.locator(`[data-rfd-draggable-id]`).filter({ hasText: "Comment Ticket" });
  await card.locator("span.font-mono").click();
  await page.waitForTimeout(500);
}

test.describe("Boards — Comments", () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
    await setupBoardWithTicket(page);
  });

  test("shows activity section with comment input", async ({ page }) => {
    await expect(page.locator("text=Activity").first()).toBeVisible();
    await expect(page.locator('textarea[placeholder="Add a comment..."]')).toBeVisible();
  });

  test("can add a comment", async ({ page }) => {
    const textarea = page.locator('textarea[placeholder="Add a comment..."]');
    await textarea.click();
    await page.waitForTimeout(300);
    await textarea.pressSequentially("This is a test comment", { delay: 20 });
    await page.waitForTimeout(300);
    await page.locator('button:has-text("Save")').click();
    await page.waitForTimeout(1500);
    await expect(page.locator("text=This is a test comment")).toBeVisible();
  });

  test("comment input expands on focus", async ({ page }) => {
    const textarea = page.locator('textarea[placeholder="Add a comment..."]');
    await textarea.click();
    await expect(page.locator('button:has-text("Save")')).toBeVisible();
    await expect(page.locator('button:has-text("Cancel")').last()).toBeVisible();
  });

  test("can cancel comment", async ({ page }) => {
    const textarea = page.locator('textarea[placeholder="Add a comment..."]');
    await textarea.click();
    await textarea.fill("Discard this");
    await page.locator('button:has-text("Cancel")').last().click();
    await page.waitForTimeout(300);
    await expect(page.locator('button:has-text("Save")')).not.toBeVisible();
  });

  test("save button is disabled when comment is empty", async ({ page }) => {
    const textarea = page.locator('textarea[placeholder="Add a comment..."]');
    await textarea.click();
    const saveBtn = page.locator('button:has-text("Save")');
    await expect(saveBtn).toBeDisabled();
  });
});
