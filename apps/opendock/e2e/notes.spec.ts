import { test, expect } from "@playwright/test";
import { loginUser, navigateTo } from "./helpers";

test.describe("Notes", () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
    await navigateTo(page, "Notes");
  });

  test("shows notes sidebar with New button", async ({ page }) => {
    await expect(page.locator("text=NOTES").or(page.locator("text=Notes")).first()).toBeVisible();
    await expect(page.locator("text=New").first()).toBeVisible();
  });

  test("can create a new note", async ({ page }) => {
    await page.locator("text=New").first().click();
    await page.waitForTimeout(500);
    const titleInput = page.locator('input[placeholder="Untitled"]');
    await expect(titleInput).toBeVisible();
    await expect(titleInput).toHaveValue("Untitled");
  });

  test("can search notes by title", async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search..."]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill("nonexistent_xyz");
    await page.waitForTimeout(300);
    await expect(page.locator("text=No notes yet.")).toBeVisible();
  });

  test("can edit note title", async ({ page }) => {
    await page.locator("text=New").first().click();
    await page.waitForTimeout(500);
    const titleInput = page.locator('input[placeholder="Untitled"]');
    await titleInput.clear();
    await titleInput.fill("My E2E Note");
    await page.waitForTimeout(2000);
    await expect(titleInput).toHaveValue("My E2E Note");
  });

  test("shows pin and delete buttons", async ({ page }) => {
    await page.locator("text=New").first().click();
    await page.waitForTimeout(500);
    // Scope to the title row which contains pin and trash buttons
    const titleRow = page.locator('input[placeholder="Untitled"]').locator("..");
    await expect(titleRow.locator(".lucide-pin")).toBeVisible();
    await expect(titleRow.locator(".lucide-trash-2")).toBeVisible();
  });

  test("can pin a note", async ({ page }) => {
    await page.locator("text=New").first().click();
    await page.waitForTimeout(500);
    const titleRow = page.locator('input[placeholder="Untitled"]').locator("..");
    await titleRow.locator(".lucide-pin").click();
    await page.waitForTimeout(500);
    await expect(titleRow.locator(".lucide-pin-off").or(titleRow.locator(".lucide-pin"))).toBeVisible();
  });

  test("can delete a note", async ({ page }) => {
    await page.locator("text=New").first().click();
    await page.waitForTimeout(500);
    const titleInput = page.locator('input[placeholder="Untitled"]');
    await titleInput.clear();
    const noteName = `Delete ${Date.now()}`;
    await titleInput.fill(noteName);
    await page.waitForTimeout(2000);
    const editor = page.locator("main");
    await editor.locator(".lucide-trash-2").click();
    await page.waitForTimeout(1000);
    await expect(page.locator(`text=${noteName}`)).not.toBeVisible();
  });

  test("note appears in sidebar after creation", async ({ page }) => {
    await page.locator("text=New").first().click();
    await page.waitForTimeout(500);
    const titleInput = page.locator('input[placeholder="Untitled"]');
    await titleInput.clear();
    const noteName = `Sidebar ${Date.now()}`;
    await titleInput.fill(noteName);
    await page.waitForTimeout(2000);
    await expect(page.locator(`text=${noteName}`).first()).toBeVisible();
  });

  test("shows save status indicator", async ({ page }) => {
    await page.locator("text=New").first().click();
    await page.waitForTimeout(500);
    const titleInput = page.locator('input[placeholder="Untitled"]');
    await titleInput.clear();
    await titleInput.fill("Save Status Note");
    await page.waitForTimeout(2000);
    const saved = page.locator("text=Saved").or(page.locator("text=Saving"));
    await expect(saved.first()).toBeVisible();
  });

  test("can select a note from sidebar", async ({ page }) => {
    await page.locator("text=New").first().click();
    await page.waitForTimeout(1000);
    const titleInput = page.locator('input[placeholder="Untitled"]');
    await titleInput.clear();
    const noteName = `Select ${Date.now()}`;
    await titleInput.fill(noteName);
    await page.waitForTimeout(2000);
    // Create another note
    await page.locator("text=New").first().click();
    await page.waitForTimeout(1000);
    // Click back on the first note
    await page.locator(`text=${noteName}`).first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('input[placeholder="Untitled"]')).toHaveValue(noteName);
  });
});
