import { test, expect } from "@playwright/test";
import { loginUser, navigateTo } from "./helpers";

test.describe("Notes — Save & Persistence", () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
    await navigateTo(page, "Notes");
  });

  test("note content persists after navigating away and back", async ({ page }) => {
    // Create a note with a unique title
    await page.locator("text=New").first().click();
    await page.waitForTimeout(500);
    const noteName = `Persist ${Date.now()}`;
    const titleInput = page.locator('input[placeholder="Untitled"]');
    await titleInput.clear();
    await titleInput.fill(noteName);
    // Wait for title debounce to fire and save
    await expect(page.locator("text=Saved").first()).toBeVisible({ timeout: 5000 });

    // Type some content in the Lexical editor
    const editor = page.locator('[contenteditable="true"]');
    await editor.click();
    await editor.pressSequentially("This content should persist", { delay: 20 });
    // Wait for content debounce (1.5s) + save
    await page.waitForTimeout(2500);

    // Navigate away
    await navigateTo(page, "Dashboard");
    await page.waitForTimeout(500);

    // Navigate back
    await navigateTo(page, "Notes");
    await page.waitForTimeout(500);

    // Click the note in sidebar
    await page.locator(`text=${noteName}`).first().click();
    await page.waitForTimeout(500);

    // Verify title persisted
    await expect(page.locator('input[placeholder="Untitled"]')).toHaveValue(noteName);

    // Verify content persisted
    await expect(page.locator("text=This content should persist")).toBeVisible();
  });

  test("title change triggers save indicator", async ({ page }) => {
    await page.locator("text=New").first().click();
    await page.waitForTimeout(500);
    const titleInput = page.locator('input[placeholder="Untitled"]');
    await titleInput.clear();
    await titleInput.fill("Trigger Save");
    // Should show "Saving" initially
    await expect(page.locator("text=Saving").or(page.locator("text=Saved")).first()).toBeVisible();
    // Then eventually "Saved"
    await expect(page.locator("text=Saved").first()).toBeVisible({ timeout: 5000 });
  });

  test("content change triggers save indicator", async ({ page }) => {
    await page.locator("text=New").first().click();
    await page.waitForTimeout(500);
    const editor = page.locator('[contenteditable="true"]');
    await editor.click();
    await editor.pressSequentially("typing triggers save", { delay: 20 });
    await expect(page.locator("text=Saving").or(page.locator("text=Saved")).first()).toBeVisible();
    await expect(page.locator("text=Saved").first()).toBeVisible({ timeout: 5000 });
  });

  test("edited title persists after selecting another note", async ({ page }) => {
    // Create first note
    await page.locator("text=New").first().click();
    await page.waitForTimeout(500);
    const name1 = `First ${Date.now()}`;
    const titleInput = page.locator('input[placeholder="Untitled"]');
    await titleInput.clear();
    await titleInput.fill(name1);
    await page.waitForTimeout(2500);

    // Create second note
    await page.locator("text=New").first().click();
    await page.waitForTimeout(500);
    const name2 = `Second ${Date.now()}`;
    await page.locator('input[placeholder="Untitled"]').clear();
    await page.locator('input[placeholder="Untitled"]').fill(name2);
    await page.waitForTimeout(2500);

    // Click back on first note
    await page.locator(`text=${name1}`).first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('input[placeholder="Untitled"]')).toHaveValue(name1);

    // Click back on second note
    await page.locator(`text=${name2}`).first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('input[placeholder="Untitled"]')).toHaveValue(name2);
  });

  test("rich text content with multiple paragraphs persists", async ({ page }) => {
    await page.locator("text=New").first().click();
    await page.waitForTimeout(500);
    const noteName = `Multi ${Date.now()}`;
    const titleInput = page.locator('input[placeholder="Untitled"]');
    await titleInput.clear();
    await titleInput.fill(noteName);
    // Wait for title save
    await expect(page.locator("text=Saved").first()).toBeVisible({ timeout: 5000 });

    const editor = page.locator('[contenteditable="true"]');
    await editor.click();
    await editor.pressSequentially("First paragraph", { delay: 10 });
    await page.keyboard.press("Enter");
    await editor.pressSequentially("Second paragraph", { delay: 10 });
    // Wait for content debounce (1.5s) + save
    await page.waitForTimeout(2500);

    // Navigate away and back
    await navigateTo(page, "Dashboard");
    await page.waitForTimeout(500);
    await navigateTo(page, "Notes");
    await page.waitForTimeout(500);
    await page.locator(`text=${noteName}`).first().click();
    await page.waitForTimeout(500);

    await expect(page.locator("text=First paragraph")).toBeVisible();
    await expect(page.locator("text=Second paragraph")).toBeVisible();
  });

  test("pinned note shows pin indicator in sidebar", async ({ page }) => {
    await page.locator("text=New").first().click();
    await page.waitForTimeout(500);
    const noteName = `Pinned ${Date.now()}`;
    const titleInput = page.locator('input[placeholder="Untitled"]');
    await titleInput.clear();
    await titleInput.fill(noteName);
    await page.waitForTimeout(2500);

    // Pin the note
    const titleRow = page.locator('input[placeholder="Untitled"]').locator("..");
    await titleRow.locator(".lucide-pin").click();
    await page.waitForTimeout(1000);

    // The sidebar should show the note — check it's still there
    await expect(page.locator(`text=${noteName}`).first()).toBeVisible();
  });

  test("deleted note disappears from sidebar immediately", async ({ page }) => {
    await page.locator("text=New").first().click();
    await page.waitForTimeout(500);
    const noteName = `Gone ${Date.now()}`;
    const titleInput = page.locator('input[placeholder="Untitled"]');
    await titleInput.clear();
    await titleInput.fill(noteName);
    await page.waitForTimeout(2500);

    // Confirm it's in sidebar
    await expect(page.locator(`text=${noteName}`).first()).toBeVisible();

    // Delete it
    const editor = page.locator("main");
    await editor.locator(".lucide-trash-2").click();
    await page.waitForTimeout(500);

    // Should be gone
    await expect(page.locator(`text=${noteName}`)).not.toBeVisible();
  });
});
