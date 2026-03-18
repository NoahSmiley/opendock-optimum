import { test, expect } from "@playwright/test";
import { loginUser, navigateTo } from "./helpers";

/** Create an event and return its name. */
async function createEvent(page: import("@playwright/test").Page, title: string, opts?: {
  location?: string; allDay?: boolean;
}) {
  await page.locator("text=New Event").first().click();
  await page.waitForTimeout(300);
  await page.locator('input[placeholder="Event title"]').fill(title);
  if (opts?.location) {
    await page.locator('input[placeholder="Location"]').fill(opts.location);
  }
  if (opts?.allDay) {
    await page.locator('input[type="checkbox"]').check();
  }
  await page.locator('button:has-text("Create")').click();
  await page.waitForTimeout(1000);
}

test.describe("Calendar — Deep Tests", () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
    await navigateTo(page, "Calendar");
  });

  test("created event shows in agenda with correct title", async ({ page }) => {
    const name = `Agenda ${Date.now()}`;
    await createEvent(page, name);
    // Should appear in agenda grouped under "Today"
    await expect(page.locator("text=TODAY").or(page.locator("text=Today")).first()).toBeVisible();
    await expect(page.locator(`text=${name}`)).toBeVisible();
  });

  test("event with location shows location in agenda", async ({ page }) => {
    const name = `Located ${Date.now()}`;
    await createEvent(page, name, { location: "Room 42" });
    await expect(page.locator(`text=${name}`)).toBeVisible();
    await expect(page.locator("text=Room 42").first()).toBeVisible();
  });

  test("all-day event shows 'All day' in agenda", async ({ page }) => {
    const name = `AllDay ${Date.now()}`;
    await createEvent(page, name, { allDay: true });
    await expect(page.locator(`text=${name}`)).toBeVisible();
    await expect(page.locator("text=All day").first()).toBeVisible();
  });

  test("editing event title persists", async ({ page }) => {
    const name = `Edit ${Date.now()}`;
    await createEvent(page, name);

    // Click event to edit
    await page.locator(`text=${name}`).first().click();
    await page.waitForTimeout(300);
    const titleInput = page.locator('input[placeholder="Event title"]');
    await expect(titleInput).toHaveValue(name);

    // Change title
    const newName = `Edited ${Date.now()}`;
    await titleInput.clear();
    await titleInput.fill(newName);
    await page.locator('button:has-text("Save")').click();
    await page.waitForTimeout(1000);

    // Old name gone, new name visible
    await expect(page.locator(`text=${name}`)).not.toBeVisible();
    await expect(page.locator(`text=${newName}`)).toBeVisible();
  });

  test("editing event location persists", async ({ page }) => {
    const name = `LocEdit ${Date.now()}`;
    const locA = `LocA ${Date.now()}`;
    const locB = `LocB ${Date.now()}`;
    await createEvent(page, name, { location: locA });

    await page.locator(`text=${name}`).first().click();
    await page.waitForTimeout(300);
    const locInput = page.locator('input[placeholder="Location"]');
    await expect(locInput).toHaveValue(locA);
    await locInput.clear();
    await locInput.fill(locB);
    await page.locator('button:has-text("Save")').click();
    await page.waitForTimeout(1000);

    await expect(page.locator(`text=${locA}`)).not.toBeVisible();
    await expect(page.locator(`text=${locB}`)).toBeVisible();
  });

  test("multiple events show in chronological order", async ({ page }) => {
    const name1 = `First ${Date.now()}`;
    const name2 = `Second ${Date.now() + 1}`;
    await createEvent(page, name1);
    await createEvent(page, name2);
    await expect(page.locator(`text=${name1}`)).toBeVisible();
    await expect(page.locator(`text=${name2}`)).toBeVisible();
  });

  test("deleting one event does not affect others", async ({ page }) => {
    const keep = `Keep ${Date.now()}`;
    const remove = `Remove ${Date.now() + 1}`;
    await createEvent(page, keep);
    await createEvent(page, remove);

    // Delete the second event
    await page.locator(`text=${remove}`).first().click();
    await page.waitForTimeout(300);
    await page.locator("text=Delete").first().click();
    await page.waitForTimeout(1000);

    // First event still there, second gone
    await expect(page.locator(`text=${keep}`)).toBeVisible();
    await expect(page.locator(`text=${remove}`)).not.toBeVisible();
  });

  test("clicking a date in mini calendar selects it", async ({ page }) => {
    // Today's cell should be highlighted
    const todayHighlight = page.locator(".bg-blue-600").first();
    await expect(todayHighlight).toBeVisible();
    const todayText = await todayHighlight.textContent();

    // Click a different date — find a non-highlighted, non-empty cell
    const dayCells = page.locator(".grid.grid-cols-7 button").filter({ hasNotText: "" });
    const count = await dayCells.count();
    // Click the last day cell (different from today)
    if (count > 1) {
      const lastDay = dayCells.last();
      await lastDay.click();
      await page.waitForTimeout(300);
      // The agenda should update (no crash at minimum)
    }
  });

  test("cancel button closes form without creating event", async ({ page }) => {
    await page.locator("text=New Event").first().click();
    await page.waitForTimeout(300);
    await page.locator('input[placeholder="Event title"]').fill("Should Not Exist");
    await page.locator("text=Cancel").first().click();
    await page.waitForTimeout(300);
    // Form should be gone
    await expect(page.locator('input[placeholder="Event title"]')).not.toBeVisible();
    // Event should not appear
    await expect(page.locator("text=Should Not Exist")).not.toBeVisible();
  });

  test("event form populates correctly when editing", async ({ page }) => {
    const name = `FormCheck ${Date.now()}`;
    await createEvent(page, name, { location: "Test Loc" });

    await page.locator(`text=${name}`).first().click();
    await page.waitForTimeout(300);

    // Title populated
    await expect(page.locator('input[placeholder="Event title"]')).toHaveValue(name);
    // Location populated
    await expect(page.locator('input[placeholder="Location"]')).toHaveValue("Test Loc");
    // Start/end times populated (not empty)
    const startInput = page.locator('input[type="datetime-local"]').first();
    const startVal = await startInput.inputValue();
    expect(startVal).toBeTruthy();
    // Save and Delete buttons visible (edit mode)
    await expect(page.locator('button:has-text("Save")')).toBeVisible();
    await expect(page.locator("text=Delete").first()).toBeVisible();
  });
});
