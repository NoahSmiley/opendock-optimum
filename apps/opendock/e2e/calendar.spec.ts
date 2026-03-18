import { test, expect } from "@playwright/test";
import { loginUser, navigateTo } from "./helpers";

test.describe("Calendar", () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
    await navigateTo(page, "Calendar");
  });

  test("shows calendar header with month and New Event button", async ({ page }) => {
    await expect(page.locator("text=New Event").first()).toBeVisible();
    const now = new Date();
    const monthName = now.toLocaleString("en-US", { month: "long" });
    await expect(page.locator(`text=${monthName}`).first()).toBeVisible();
  });

  test("shows mini calendar sidebar with day headers", async ({ page }) => {
    for (const day of ["S", "M", "T", "W", "F"]) {
      await expect(page.locator(`text=${day}`).first()).toBeVisible();
    }
  });

  test("mini calendar highlights today", async ({ page }) => {
    const todayCell = page.locator(".bg-blue-600");
    await expect(todayCell.first()).toBeVisible();
  });

  test("can navigate months via mini calendar arrows", async ({ page }) => {
    const nextBtn = page.locator(".lucide-chevron-right").first();
    await nextBtn.click();
    await page.waitForTimeout(300);
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth() + 1);
    const nextMonth = next.toLocaleString("en-US", { month: "long" });
    await expect(page.locator(`text=${nextMonth}`).first()).toBeVisible();
  });

  test("can navigate to previous month", async ({ page }) => {
    const prevBtn = page.locator(".lucide-chevron-left").first();
    await prevBtn.click();
    await page.waitForTimeout(300);
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1);
    const prevMonth = prev.toLocaleString("en-US", { month: "long" });
    await expect(page.locator(`text=${prevMonth}`).first()).toBeVisible();
  });

  test("can open new event form", async ({ page }) => {
    await page.locator("text=New Event").first().click();
    await page.waitForTimeout(300);
    await expect(page.locator('input[placeholder="Event title"]')).toBeVisible();
    await expect(page.locator('input[type="datetime-local"]').first()).toBeVisible();
  });

  test("new event form has location field", async ({ page }) => {
    await page.locator("text=New Event").first().click();
    await page.waitForTimeout(300);
    await expect(page.locator('input[placeholder="Location"]')).toBeVisible();
  });

  test("new event form has all-day checkbox", async ({ page }) => {
    await page.locator("text=New Event").first().click();
    await page.waitForTimeout(300);
    await expect(page.locator('input[type="checkbox"]')).toBeVisible();
  });

  test("create button is disabled when title is empty", async ({ page }) => {
    await page.locator("text=New Event").first().click();
    await page.waitForTimeout(300);
    const createBtn = page.locator('button:has-text("Create")');
    await expect(createBtn).toBeDisabled();
  });

  test("can cancel event creation", async ({ page }) => {
    await page.locator("text=New Event").first().click();
    await page.waitForTimeout(300);
    await page.locator("text=Cancel").first().click();
    await page.waitForTimeout(300);
    await expect(page.locator('input[placeholder="Event title"]')).not.toBeVisible();
  });

  test("can create an event", async ({ page }) => {
    const eventName = `Event ${Date.now()}`;
    await page.locator("text=New Event").first().click();
    await page.waitForTimeout(300);
    await page.locator('input[placeholder="Event title"]').fill(eventName);
    await page.locator('button:has-text("Create")').click();
    await page.waitForTimeout(1000);
    await expect(page.locator(`text=${eventName}`).first()).toBeVisible();
  });

  test("can create an all-day event", async ({ page }) => {
    const eventName = `AllDay ${Date.now()}`;
    await page.locator("text=New Event").first().click();
    await page.waitForTimeout(300);
    await page.locator('input[placeholder="Event title"]').fill(eventName);
    await page.locator('input[type="checkbox"]').check();
    await page.locator('button:has-text("Create")').click();
    await page.waitForTimeout(1000);
    await expect(page.locator(`text=${eventName}`).first()).toBeVisible();
  });

  test("can create an event with location", async ({ page }) => {
    const eventName = `Located ${Date.now()}`;
    await page.locator("text=New Event").first().click();
    await page.waitForTimeout(300);
    await page.locator('input[placeholder="Event title"]').fill(eventName);
    await page.locator('input[placeholder="Location"]').fill("Conference Room A");
    await page.locator('button:has-text("Create")').click();
    await page.waitForTimeout(1000);
    await expect(page.locator(`text=${eventName}`).first()).toBeVisible();
  });

  test("can click event to edit it", async ({ page }) => {
    const eventName = `Editable ${Date.now()}`;
    await page.locator("text=New Event").first().click();
    await page.waitForTimeout(300);
    await page.locator('input[placeholder="Event title"]').fill(eventName);
    await page.locator('button:has-text("Create")').click();
    await page.waitForTimeout(1000);
    await page.locator(`text=${eventName}`).first().click();
    await page.waitForTimeout(300);
    await expect(page.locator('input[placeholder="Event title"]')).toHaveValue(eventName);
    await expect(page.locator('button:has-text("Save")')).toBeVisible();
    await expect(page.locator("text=Delete").first()).toBeVisible();
  });

  test("can delete an event", async ({ page }) => {
    const eventName = `Delete ${Date.now()}`;
    await page.locator("text=New Event").first().click();
    await page.waitForTimeout(300);
    await page.locator('input[placeholder="Event title"]').fill(eventName);
    await page.locator('button:has-text("Create")').click();
    await page.waitForTimeout(1000);
    await page.locator(`text=${eventName}`).first().click();
    await page.waitForTimeout(300);
    await page.locator("text=Delete").first().click();
    await page.waitForTimeout(1000);
    await expect(page.locator(`text=${eventName}`)).not.toBeVisible();
  });

  test("shows agenda empty state or events", async ({ page }) => {
    const empty = page.locator("text=No upcoming events");
    const today = page.locator("text=TODAY").or(page.locator("text=Today"));
    await expect(empty.or(today.first())).toBeVisible();
  });
});
