import { test, expect } from "@playwright/test";
import { loginUser } from "./helpers";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test("shows home heading and current date", async ({ page }) => {
    await expect(page.locator("h1")).toHaveText("Home");
    const now = new Date();
    const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
    await expect(page.locator(`text=${dayName}`)).toBeVisible();
  });

  test("shows sidebar with all nav items", async ({ page }) => {
    for (const label of ["Dashboard", "Boards", "Notes", "Calendar", "Files", "Sign Out"]) {
      await expect(page.locator(`.sidebar-nav-item:has-text("${label}")`)).toBeVisible();
    }
  });

  test("dashboard nav item is active", async ({ page }) => {
    const dashLink = page.locator('.sidebar-nav-item:has-text("Dashboard")');
    await expect(dashLink).toHaveClass(/active/);
  });

  test("can navigate to boards via sidebar", async ({ page }) => {
    await page.locator('.sidebar-nav-item:has-text("Boards")').click();
    await page.waitForURL("**/boards", { timeout: 5000 });
  });

  test("can navigate to notes via sidebar", async ({ page }) => {
    await page.locator('.sidebar-nav-item:has-text("Notes")').click();
    await page.waitForURL("**/notes", { timeout: 5000 });
  });

  test("can navigate to calendar via sidebar", async ({ page }) => {
    await page.locator('.sidebar-nav-item:has-text("Calendar")').click();
    await page.waitForURL("**/calendar", { timeout: 5000 });
  });

  test("can navigate to files via sidebar", async ({ page }) => {
    await page.locator('.sidebar-nav-item:has-text("Files")').click();
    await page.waitForURL("**/files", { timeout: 5000 });
  });

  test("can collapse and expand sidebar", async ({ page }) => {
    const sidebar = page.locator("nav.sidebar");
    await expect(sidebar).not.toHaveClass(/collapsed/);
    await page.locator('button[aria-label="Collapse sidebar"]').click();
    await expect(sidebar).toHaveClass(/collapsed/);
    await page.locator('button[aria-label="Expand sidebar"]').click();
    await expect(sidebar).not.toHaveClass(/collapsed/);
  });
});
