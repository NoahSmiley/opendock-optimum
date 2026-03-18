import { test, expect } from "@playwright/test";
import { loginUser, navigateTo, createBoard } from "./helpers";

test.describe("Boards — CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
    await navigateTo(page, "Boards");
  });

  test("shows board picker when no board is selected", async ({ page }) => {
    await expect(page.locator("text=Your Boards")).toBeVisible();
    await expect(page.locator("text=Create new board")).toBeVisible();
  });

  test("can create a new board", async ({ page }) => {
    await createBoard(page);
    // Column headers are uppercase in the board view
    await expect(page.locator("text=TO DO").first()).toBeVisible();
    await expect(page.locator("text=IN PROGRESS").first()).toBeVisible();
    await expect(page.locator("text=DONE").first()).toBeVisible();
  });

  test("new board has default labels", async ({ page }) => {
    await createBoard(page);
    await page.locator(".lucide-settings").click();
    await page.waitForTimeout(300);
    await page.locator('button:has-text("labels")').click();
    await page.waitForTimeout(300);
    await expect(page.locator("text=Bug")).toBeVisible();
    await expect(page.locator("text=Feature")).toBeVisible();
  });

  test("new board has the creator as a member", async ({ page }) => {
    await createBoard(page);
    // Create a ticket
    await page.locator('button:has-text("Create")').first().click();
    await page.locator('input[placeholder="What needs to be done?"]').fill("Test Ticket");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(1000);
    // Open detail by clicking the ticket key (not the title)
    const card = page.locator(`[data-rfd-draggable-id]`).filter({ hasText: "Test Ticket" });
    await card.locator("span.font-mono").click();
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: "Assign", exact: true }).click();
    await page.waitForTimeout(300);
    const memberButtons = page.locator(".absolute.z-20 button");
    await expect(memberButtons.first()).toBeVisible();
  });
});
