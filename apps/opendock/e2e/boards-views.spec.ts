import { test, expect } from "@playwright/test";
import { loginUser, navigateTo, createBoard } from "./helpers";

async function setupBoardWithTickets(page: import("@playwright/test").Page) {
  await navigateTo(page, "Boards");
  await createBoard(page);
  for (const title of ["View Ticket A", "View Ticket B"]) {
    await page.locator('button:has-text("Create")').first().click();
    await page.locator('input[placeholder="What needs to be done?"]').fill(title);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(800);
  }
}

test.describe("Boards — Views & Filters", () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
    await setupBoardWithTickets(page);
  });

  test("board view is selected by default", async ({ page }) => {
    const boardTab = page.locator('button:has-text("Board")').first();
    await expect(boardTab).toBeVisible();
  });

  test("can switch to overview tab", async ({ page }) => {
    await page.locator('button:has-text("Overview")').click();
    await page.waitForTimeout(500);
    await expect(page.locator("text=Total Tickets")).toBeVisible();
    await expect(page.locator("text=Column Distribution")).toBeVisible();
  });

  test("overview shows correct ticket count", async ({ page }) => {
    await page.locator('button:has-text("Overview")').click();
    await page.waitForTimeout(500);
    await expect(page.locator("text=2").first()).toBeVisible();
  });

  test("can switch to backlog tab", async ({ page }) => {
    await page.locator('button:has-text("Backlog")').click();
    await page.waitForTimeout(500);
    await expect(page.locator("text=View Ticket A")).toBeVisible();
    await expect(page.locator("text=View Ticket B")).toBeVisible();
  });

  test("can search tickets", async ({ page }) => {
    await page.locator('input[placeholder="Search..."]').fill("Ticket A");
    await page.waitForTimeout(500);
    await expect(page.locator("text=View Ticket A")).toBeVisible();
    await expect(page.locator("text=View Ticket B")).not.toBeVisible();
  });

  test("search clears and shows all tickets", async ({ page }) => {
    const search = page.locator('input[placeholder="Search..."]');
    await search.fill("Ticket A");
    await page.waitForTimeout(300);
    await search.clear();
    await page.waitForTimeout(300);
    await expect(page.locator("text=View Ticket A")).toBeVisible();
    await expect(page.locator("text=View Ticket B")).toBeVisible();
  });

  test("filter bar has all quick filters", async ({ page }) => {
    await expect(page.locator('button:has-text("Recent")')).toBeVisible();
    await expect(page.locator('button:has-text("Unassigned")')).toBeVisible();
    await expect(page.locator('button:has-text("Due Soon")')).toBeVisible();
    await expect(page.locator('button:has-text("Overdue")')).toBeVisible();
    // High Priority appears both as filter button and column header text
    await expect(page.locator('button:has-text("High Priority")').first()).toBeVisible();
  });

  test("can toggle a quick filter", async ({ page }) => {
    const unassigned = page.locator('button:has-text("Unassigned")');
    await unassigned.click();
    await page.waitForTimeout(300);
    await expect(page.locator('button:has-text("Clear")')).toBeVisible();
    await unassigned.click();
    await page.waitForTimeout(300);
    await expect(page.locator('button:has-text("Clear")')).not.toBeVisible();
  });
});
