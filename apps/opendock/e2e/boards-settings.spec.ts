import { test, expect } from "@playwright/test";
import { loginUser, navigateTo, createBoard } from "./helpers";

test.describe("Boards — Settings", () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
    await navigateTo(page, "Boards");
    await createBoard(page);
  });

  test("can open board settings", async ({ page }) => {
    await page.locator(".lucide-settings").click();
    await page.waitForTimeout(300);
    await expect(page.locator("text=Board Settings")).toBeVisible();
    await expect(page.locator('button:has-text("columns")')).toBeVisible();
    await expect(page.locator('button:has-text("labels")')).toBeVisible();
    await expect(page.locator('button:has-text("info")')).toBeVisible();
  });

  test("columns tab shows default columns", async ({ page }) => {
    await page.locator(".lucide-settings").click();
    await page.waitForTimeout(300);
    // Settings modal shows column names, use .first() since board headers also match
    await expect(page.locator("text=To Do").first()).toBeVisible();
    await expect(page.locator("text=In Progress").first()).toBeVisible();
    await expect(page.locator("text=Done").first()).toBeVisible();
  });

  test("can add a new column", async ({ page }) => {
    await page.locator(".lucide-settings").click();
    await page.waitForTimeout(300);
    const input = page.locator('input[placeholder*="column"]').or(page.locator('input[placeholder*="Column"]'));
    await input.fill("Review");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);
    await expect(page.locator("text=Review").first()).toBeVisible();
  });

  test("labels tab shows default labels", async ({ page }) => {
    await page.locator(".lucide-settings").click();
    await page.waitForTimeout(300);
    await page.locator('button:has-text("labels")').click();
    await page.waitForTimeout(300);
    await expect(page.locator("text=Bug")).toBeVisible();
    await expect(page.locator("text=Feature")).toBeVisible();
    await expect(page.locator("text=Enhancement")).toBeVisible();
    await expect(page.locator("text=Documentation")).toBeVisible();
    // High Priority may appear in filter bar too
    await expect(page.locator("text=High Priority").first()).toBeVisible();
  });

  test("can create a new label", async ({ page }) => {
    await page.locator(".lucide-settings").click();
    await page.waitForTimeout(300);
    await page.locator('button:has-text("labels")').click();
    await page.waitForTimeout(300);
    await page.locator('input[placeholder="Label name..."]').fill("Custom Label");
    await page.locator('button:has-text("Add")').click();
    await page.waitForTimeout(500);
    await expect(page.locator("text=Custom Label")).toBeVisible();
  });

  test("can close settings modal", async ({ page }) => {
    await page.locator(".lucide-settings").click();
    await page.waitForTimeout(300);
    await page.locator(".lucide-x").first().click();
    await page.waitForTimeout(300);
    await expect(page.locator("text=Board Settings")).not.toBeVisible();
  });

  test("board selector dropdown works", async ({ page }) => {
    await page.locator(".lucide-chevron-down").first().click();
    await page.waitForTimeout(300);
    const dropdown = page.locator(".absolute.z-50");
    await expect(dropdown.first()).toBeVisible();
  });
});
