import { test, expect } from "@playwright/test";

test.describe("Auth", () => {
  test("shows login form by default", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("form", { timeout: 5000 });
    await expect(page.locator("h1")).toHaveText("Sign In");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toHaveText("Sign In");
  });

  test("can toggle to register form", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("form", { timeout: 5000 });
    await page.locator('button:has-text("Register")').click();
    await expect(page.locator("h1")).toHaveText("Create Account");
    await expect(page.locator('button[type="submit"]')).toHaveText("Sign Up");
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("form", { timeout: 5000 });
    await page.locator('input[type="email"]').fill("wrong@test.com");
    await page.locator('input[type="password"]').fill("wrongpassword");
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1000);
    await expect(page.locator(".auth-error")).toBeVisible();
  });

  test("can register a new account", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("form", { timeout: 5000 });
    await page.locator('button:has-text("Register")').click();
    const unique = `e2e-${Date.now()}@test.com`;
    await page.locator('input[type="email"]').fill(unique);
    await page.locator('input[type="password"]').fill("TestPassword1234");
    await page.locator('button[type="submit"]').click();
    await page.waitForURL("**/dashboard", { timeout: 5000 });
    await expect(page.locator("text=Home")).toBeVisible();
  });

  test("can login with existing credentials", async ({ page }) => {
    // First register
    await page.goto("/");
    await page.waitForSelector("form", { timeout: 5000 });
    await page.locator('button:has-text("Register")').click();
    const unique = `e2e-login-${Date.now()}@test.com`;
    await page.locator('input[type="email"]').fill(unique);
    await page.locator('input[type="password"]').fill("TestPassword1234");
    await page.locator('button[type="submit"]').click();
    await page.waitForURL("**/dashboard", { timeout: 5000 });
    // Logout by clearing cookies
    await page.context().clearCookies();
    await page.goto("/");
    await page.waitForSelector("form", { timeout: 5000 });
    // Now login
    await page.locator('input[type="email"]').fill(unique);
    await page.locator('input[type="password"]').fill("TestPassword1234");
    await page.locator('button[type="submit"]').click();
    await page.waitForURL("**/dashboard", { timeout: 5000 });
    await expect(page.locator("text=Home")).toBeVisible();
  });

  test("shows OpenDock branding on auth page", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("form", { timeout: 5000 });
    await expect(page.locator("text=OpenDock")).toBeVisible();
  });

  test("can sign out via sidebar button", async ({ page }) => {
    // Register and login
    await page.goto("/");
    await page.waitForSelector("form", { timeout: 5000 });
    await page.locator('button:has-text("Register")').click();
    const unique = `e2e-signout-${Date.now()}@test.com`;
    await page.locator('input[type="email"]').fill(unique);
    await page.locator('input[type="password"]').fill("TestPassword1234");
    await page.locator('button[type="submit"]').click();
    await page.waitForURL("**/dashboard", { timeout: 5000 });

    // Verify we're logged in
    await expect(page.locator("text=Home")).toBeVisible();
    await expect(page.locator("text=Sign Out")).toBeVisible();

    // Click Sign Out
    await page.locator('button[aria-label="Sign out"]').click();
    await page.waitForTimeout(1000);

    // Should be back on auth page
    await expect(page.locator("h1")).toHaveText("Sign In");
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});
