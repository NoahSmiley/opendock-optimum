import { test, expect } from "@playwright/test";
import { loginUser, navigateTo, createBoard } from "./helpers";

async function createAndOpenTicket(page: import("@playwright/test").Page, title: string) {
  await page.locator('button:has-text("Create")').first().click();
  await page.locator('input[placeholder="What needs to be done?"]').fill(title);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1000);
  const card = page.locator(`[data-rfd-draggable-id]`).filter({ hasText: title });
  await card.locator("span.font-mono").click();
  await page.waitForTimeout(500);
}

test.describe("Boards — Assign, Labels & Fields", () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
    await navigateTo(page, "Boards");
    await createBoard(page);
  });

  test("assigning a member shows check icon and updates card avatar", async ({ page }) => {
    await createAndOpenTicket(page, "Assign Test");
    // Card should show "?" (unassigned) initially
    const card = page.locator(`[data-rfd-draggable-id]`).filter({ hasText: "Assign Test" });
    await expect(card.locator('span[title="Unassigned"]')).toBeVisible();

    // Open assign dropdown
    await page.getByRole("button", { name: "Assign", exact: true }).click();
    await page.waitForTimeout(300);
    const dropdown = page.locator(".absolute.z-20");
    await expect(dropdown).toBeVisible();

    // Get the member name before clicking
    const memberBtn = dropdown.locator("button").first();
    const memberName = await memberBtn.locator("span.text-white").textContent();
    expect(memberName).toBeTruthy();

    // No check icon before assignment
    await expect(memberBtn.locator(".lucide-check")).not.toBeVisible();

    // Click to assign
    await memberBtn.click();
    await page.waitForTimeout(500);

    // Check icon should appear on that member
    await expect(memberBtn.locator(".lucide-check")).toBeVisible();

    // Close dropdown by clicking the overlay
    await page.locator(".fixed.inset-0.z-10").click();
    await page.waitForTimeout(500);

    // Card avatar should now show member initial instead of "?"
    const avatar = card.locator(`span[title="${memberName}"]`);
    await expect(avatar).toBeVisible();
    const initial = await avatar.textContent();
    expect(initial).toBe(memberName!.charAt(0).toUpperCase());
  });

  test("can unassign a member by toggling", async ({ page }) => {
    await createAndOpenTicket(page, "Unassign Test");

    // Assign first
    await page.getByRole("button", { name: "Assign", exact: true }).click();
    await page.waitForTimeout(300);
    const dropdown = page.locator(".absolute.z-20");
    const memberBtn = dropdown.locator("button").first();
    await memberBtn.click();
    await page.waitForTimeout(500);
    await expect(memberBtn.locator(".lucide-check")).toBeVisible();

    // Click again to unassign
    await memberBtn.click();
    await page.waitForTimeout(500);
    await expect(memberBtn.locator(".lucide-check")).not.toBeVisible();

    // Close dropdown and verify card shows "?" again
    await page.locator(".fixed.inset-0.z-10").click();
    await page.waitForTimeout(500);
    const card = page.locator(`[data-rfd-draggable-id]`).filter({ hasText: "Unassign Test" });
    await expect(card.locator('span[title="Unassigned"]')).toBeVisible();
  });

  test("selecting a label shows it in the sidebar and on the card", async ({ page }) => {
    await createAndOpenTicket(page, "Label Test");

    // Labels button should show "Select labels..." initially
    await expect(page.locator("text=Select labels...")).toBeVisible();

    // Open label dropdown
    await page.locator("text=Select labels...").click();
    await page.waitForTimeout(300);
    const dropdown = page.locator(".absolute.z-20");
    await expect(dropdown).toBeVisible();

    // Get first label name and click it
    const labelBtn = dropdown.locator("button").first();
    const labelName = await labelBtn.locator("span.text-white").textContent();
    expect(labelName).toBeTruthy();
    await expect(labelBtn.locator(".lucide-check")).not.toBeVisible();
    await labelBtn.click();
    await page.waitForTimeout(500);

    // Check icon appears
    await expect(labelBtn.locator(".lucide-check")).toBeVisible();

    // Close dropdown by clicking outside
    await page.locator(".fixed.inset-0.z-10").click();
    await page.waitForTimeout(300);

    // "Select labels..." should be gone, replaced by the label badge
    await expect(page.locator("text=Select labels...")).not.toBeVisible();
    await expect(page.locator(`text=${labelName}`).last()).toBeVisible();

    // Card should show a colored label dot
    const card = page.locator(`[data-rfd-draggable-id]`).filter({ hasText: "Label Test" });
    const labelDot = card.locator(`span[title="${labelName}"]`);
    await expect(labelDot).toBeVisible();
  });

  test("can select multiple labels", async ({ page }) => {
    await createAndOpenTicket(page, "Multi Label");

    await page.locator("text=Select labels...").click();
    await page.waitForTimeout(300);
    const dropdown = page.locator(".absolute.z-20");
    const labelBtns = dropdown.locator("button");

    // Need at least 2 labels
    const count = await labelBtns.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // Select first two labels
    await labelBtns.nth(0).click();
    await page.waitForTimeout(300);
    await labelBtns.nth(1).click();
    await page.waitForTimeout(300);

    // Both should have check icons
    await expect(labelBtns.nth(0).locator(".lucide-check")).toBeVisible();
    await expect(labelBtns.nth(1).locator(".lucide-check")).toBeVisible();

    // Close and verify two label badges in sidebar
    await page.locator(".fixed.inset-0.z-10").click();
    await page.waitForTimeout(300);
    await expect(page.locator("text=Select labels...")).not.toBeVisible();
  });

  test("can deselect a label", async ({ page }) => {
    await createAndOpenTicket(page, "Deselect Label");

    // Select a label
    await page.locator("text=Select labels...").click();
    await page.waitForTimeout(300);
    const dropdown = page.locator(".absolute.z-20");
    const labelBtn = dropdown.locator("button").first();
    await labelBtn.click();
    await page.waitForTimeout(300);
    await expect(labelBtn.locator(".lucide-check")).toBeVisible();

    // Deselect it
    await labelBtn.click();
    await page.waitForTimeout(300);
    await expect(labelBtn.locator(".lucide-check")).not.toBeVisible();

    // Close and verify "Select labels..." is back
    await page.locator(".fixed.inset-0.z-10").click();
    await page.waitForTimeout(300);
    await expect(page.locator("text=Select labels...")).toBeVisible();
  });

  test("changing priority updates the select and card dot color", async ({ page }) => {
    await createAndOpenTicket(page, "Priority Test");

    const prioritySelect = page.locator("select").nth(1);
    await expect(prioritySelect).toHaveValue("medium");

    // Change to high
    await prioritySelect.selectOption("high");
    await page.waitForTimeout(500);
    await expect(prioritySelect).toHaveValue("high");

    // Card should have a red priority dot
    const card = page.locator(`[data-rfd-draggable-id]`).filter({ hasText: "Priority Test" });
    await expect(card.locator('span[title="Priority: high"]')).toBeVisible();

    // Change to low
    await prioritySelect.selectOption("low");
    await page.waitForTimeout(500);
    await expect(prioritySelect).toHaveValue("low");
    await expect(card.locator('span[title="Priority: low"]')).toBeVisible();
  });

  test("changing status moves ticket to new column", async ({ page }) => {
    await createAndOpenTicket(page, "Move Test");

    // Should be in To Do column
    const statusSelect = page.locator("select").first();
    await statusSelect.selectOption({ label: "In Progress" });
    await page.waitForTimeout(1000);

    // Close detail
    await page.locator(".lucide-x").first().click();
    await page.waitForTimeout(500);

    // Ticket should now be in the "In Progress" column
    const inProgressCol = page.locator("h3:has-text('In Progress')").locator("..");
    const colContainer = inProgressCol.locator("..");
    await expect(colContainer.locator("text=Move Test")).toBeVisible();
  });

  test("setting a due date persists after reopen", async ({ page }) => {
    await createAndOpenTicket(page, "Due Date Test");

    const dateInput = page.locator('input[type="date"]');
    await dateInput.fill("2026-12-25");
    await page.waitForTimeout(500);
    await expect(dateInput).toHaveValue("2026-12-25");

    // Close and reopen ticket detail
    await page.locator(".lucide-x").first().click();
    await page.waitForTimeout(500);
    const card = page.locator(`[data-rfd-draggable-id]`).filter({ hasText: "Due Date Test" });
    await card.locator("span.font-mono").click();
    await page.waitForTimeout(500);

    // Date should still be set
    await expect(page.locator('input[type="date"]')).toHaveValue("2026-12-25");
  });

  test("story points persist after reopen", async ({ page }) => {
    await createAndOpenTicket(page, "SP Persist");

    // Click the "-" to enter edit mode
    const spField = page.locator("text=-").last();
    await spField.click();
    const spInput = page.locator('input[type="number"]');
    await spInput.fill("8");
    await spInput.press("Enter");
    await page.waitForTimeout(1000);

    // Close and reopen
    await page.locator(".lucide-x").first().click();
    await page.waitForTimeout(500);
    const card = page.locator(`[data-rfd-draggable-id]`).filter({ hasText: "SP Persist" });
    await card.locator("span.font-mono").click();
    await page.waitForTimeout(500);

    // Story points should show 8 (not "-")
    await expect(page.locator("text=8").first()).toBeVisible();

    // Card should also show story points badge
    await expect(card.locator("text=8")).toBeVisible();
  });
});
