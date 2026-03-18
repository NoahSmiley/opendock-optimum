import type { Page } from "@playwright/test";

export const TEST_EMAIL = "e2e@test.com";
export const TEST_PASSWORD = "TestPassword1234";

/** Register (if needed) and login, ending up at /dashboard. */
export async function loginUser(page: Page) {
  await page.goto("/");
  await page.waitForSelector("form", { timeout: 5000 });
  const email = page.locator('input[type="email"]');
  const password = page.locator('input[type="password"]');
  if (!(await email.isVisible())) return; // already logged in

  // Try registering first (switch to register mode)
  await page.locator(".auth-switch button").click();
  await page.waitForTimeout(200);
  await email.fill(TEST_EMAIL);
  await password.fill(TEST_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(1500);

  // If still on auth page (registration failed — account exists), login
  if (await email.isVisible().catch(() => false)) {
    const heading = await page.locator("h1").textContent();
    if (heading !== "Sign In") {
      await page.locator(".auth-switch button").click();
      await page.waitForTimeout(200);
    }
    await email.fill(TEST_EMAIL);
    await password.fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
  }
  await page.waitForURL("**/dashboard", { timeout: 5000 }).catch(() => {});
}

/** Navigate to a page via sidebar link. */
export async function navigateTo(page: Page, label: string) {
  await page.locator(`.sidebar-nav-item:has-text("${label}")`).click();
  await page.waitForTimeout(500);
}

/** Create a board and select it. Returns board name. */
export async function createBoard(page: Page) {
  const boardName = `E2E Board ${Date.now()}`;
  await page.locator("text=Create new board").click();
  await page.waitForTimeout(300);
  const modal = page.locator(".fixed.z-50");
  await modal.locator("input").first().fill(boardName);
  await modal.locator('button:has-text("Create Board")').click();
  await page.waitForTimeout(1000);
  // Select the newly created board from the picker (may be off-screen with many boards)
  const boardBtn = page.locator(`button:has-text("${boardName}")`);
  await boardBtn.waitFor({ state: "attached", timeout: 5000 });
  await boardBtn.evaluate((el) => {
    el.scrollIntoView({ block: "center" });
    el.click();
  });
  await page.waitForTimeout(1000);
  return boardName;
}
