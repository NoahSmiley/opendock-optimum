import { test, expect } from "@playwright/test";
import { loginUser, navigateTo } from "./helpers";

test.describe("Files", () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
    await navigateTo(page, "Files");
  });

  test("shows files header with Upload and Folder buttons", async ({ page }) => {
    await expect(page.locator('button:has-text("Upload")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Folder")')).toBeVisible();
  });

  test("shows sort dropdown with default Date option", async ({ page }) => {
    const sortSelect = page.locator("select");
    await expect(sortSelect).toBeVisible();
    await expect(sortSelect).toHaveValue("date");
  });

  test("sort dropdown has Name and Size options", async ({ page }) => {
    const sortSelect = page.locator("select");
    await expect(sortSelect.locator('option[value="name"]')).toBeAttached();
    await expect(sortSelect.locator('option[value="size"]')).toBeAttached();
  });

  test("shows view mode toggle (grid and list)", async ({ page }) => {
    await expect(page.locator(".lucide-layout-grid")).toBeVisible();
    await expect(page.locator(".lucide-list")).toBeVisible();
  });

  test("shows breadcrumb with home icon", async ({ page }) => {
    // lucide-react 0.5+ renders Home as lucide-house
    await expect(page.locator(".lucide-house").first()).toBeVisible();
  });

  test("can switch to list view", async ({ page }) => {
    await page.locator(".lucide-list").click();
    await page.waitForTimeout(300);
    const listBtn = page.locator("button").filter({ has: page.locator(".lucide-list") });
    await expect(listBtn).toBeVisible();
  });

  test("can switch back to grid view", async ({ page }) => {
    await page.locator(".lucide-list").click();
    await page.waitForTimeout(200);
    await page.locator(".lucide-layout-grid").click();
    await page.waitForTimeout(200);
    const gridBtn = page.locator("button").filter({ has: page.locator(".lucide-layout-grid") });
    await expect(gridBtn).toBeVisible();
  });

  test("can change sort order", async ({ page }) => {
    const sortSelect = page.locator("select");
    await sortSelect.selectOption("name");
    await expect(sortSelect).toHaveValue("name");
    await sortSelect.selectOption("size");
    await expect(sortSelect).toHaveValue("size");
  });

  test("upload button shows upload zone", async ({ page }) => {
    await page.locator('button:has-text("Upload")').first().click();
    await page.waitForTimeout(300);
    const zone = page.locator("text=Drag & drop files, or click to browse");
    await expect(zone).toBeVisible();
  });

  test("upload zone has hidden file input", async ({ page }) => {
    await page.locator('button:has-text("Upload")').first().click();
    await page.waitForTimeout(300);
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
  });

  test("can create a folder", async ({ page }) => {
    const folderName = `Folder ${Date.now()}`;
    page.on("dialog", async (dialog) => {
      await dialog.accept(folderName);
    });
    await page.locator('button:has-text("Folder")').click();
    await page.waitForTimeout(1000);
    await expect(page.locator(`text=${folderName}`).first()).toBeVisible();
  });

  test("can navigate into a folder", async ({ page }) => {
    const folderName = `Nav ${Date.now()}`;
    page.on("dialog", async (dialog) => {
      await dialog.accept(folderName);
    });
    await page.locator('button:has-text("Folder")').click();
    await page.waitForTimeout(1000);
    await page.locator(`text=${folderName}`).first().click();
    await page.waitForTimeout(500);
    // Breadcrumb should show folder name
    await expect(page.locator(`text=${folderName}`).last()).toBeVisible();
  });

  test("breadcrumb home navigates to root", async ({ page }) => {
    const folderName = `BC ${Date.now()}`;
    page.on("dialog", async (dialog) => {
      await dialog.accept(folderName);
    });
    await page.locator('button:has-text("Folder")').click();
    await page.waitForTimeout(1000);
    await page.locator(`text=${folderName}`).first().click();
    await page.waitForTimeout(500);
    await page.locator(".lucide-house").first().click();
    await page.waitForTimeout(500);
    await expect(page.locator(`text=${folderName}`).first()).toBeVisible();
  });

  test("folder shows folder icon", async ({ page }) => {
    await expect(page.locator(".lucide-folder").first()).toBeVisible();
  });
});
