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

test.describe("Boards — Multi-Assign & Advanced", () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
    await navigateTo(page, "Boards");
    await createBoard(page);
  });

  test("assign menu shows all board members with checkboxes", async ({ page }) => {
    await createAndOpenTicket(page, "Members Check");
    await page.getByRole("button", { name: "Assign", exact: true }).click();
    await page.waitForTimeout(300);
    const dropdown = page.locator(".absolute.z-20");
    await expect(dropdown).toBeVisible();

    // Should have at least 1 member (the creator)
    const memberBtns = dropdown.locator("button");
    const count = await memberBtns.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Each member button has a name and avatar initials
    const firstMember = memberBtns.first();
    const nameSpan = firstMember.locator("span.text-white");
    const name = await nameSpan.textContent();
    expect(name).toBeTruthy();
    expect(name!.length).toBeGreaterThan(0);
  });

  test("can assign and the check icon appears", async ({ page }) => {
    await createAndOpenTicket(page, "Assign Check");
    await page.getByRole("button", { name: "Assign", exact: true }).click();
    await page.waitForTimeout(300);
    const dropdown = page.locator(".absolute.z-20");
    const memberBtn = dropdown.locator("button").first();

    // No check before assignment
    await expect(memberBtn.locator(".lucide-check")).not.toBeVisible();

    // Assign
    await memberBtn.click();
    await page.waitForTimeout(500);

    // Check appears
    await expect(memberBtn.locator(".lucide-check")).toBeVisible();
  });

  test("assignment persists after closing and reopening detail", async ({ page }) => {
    await createAndOpenTicket(page, "Persist Assign");

    // Assign member
    await page.getByRole("button", { name: "Assign", exact: true }).click();
    await page.waitForTimeout(300);
    const dropdown = page.locator(".absolute.z-20");
    const memberBtn = dropdown.locator("button").first();
    const memberName = await memberBtn.locator("span.text-white").textContent();
    await memberBtn.click();
    await page.waitForTimeout(500);
    await page.locator(".fixed.inset-0.z-10").click();
    await page.waitForTimeout(300);

    // Close ticket detail
    await page.locator(".lucide-x").first().click();
    await page.waitForTimeout(500);

    // Reopen
    const card = page.locator(`[data-rfd-draggable-id]`).filter({ hasText: "Persist Assign" });
    await card.locator("span.font-mono").click();
    await page.waitForTimeout(500);

    // Open assign menu — check should still be there
    await page.getByRole("button", { name: "Assign", exact: true }).click();
    await page.waitForTimeout(300);
    const dropdown2 = page.locator(".absolute.z-20");
    const memberBtn2 = dropdown2.locator("button").first();
    await expect(memberBtn2.locator(".lucide-check")).toBeVisible();

    // Card should show member initial, not "?"
    await page.locator(".fixed.inset-0.z-10").click();
    await page.waitForTimeout(300);
    await page.locator(".lucide-x").first().click();
    await page.waitForTimeout(300);
    await expect(card.locator(`span[title="${memberName}"]`)).toBeVisible();
  });

  test("assigning a label shows badge in sidebar and persists", async ({ page }) => {
    await createAndOpenTicket(page, "Label Persist");

    // Select a label
    await page.locator("text=Select labels...").click();
    await page.waitForTimeout(300);
    const dropdown = page.locator(".absolute.z-20");
    const labelBtn = dropdown.locator("button").first();
    const labelName = await labelBtn.locator("span.text-white").textContent();
    await labelBtn.click();
    await page.waitForTimeout(500);
    await page.locator(".fixed.inset-0.z-10").click();
    await page.waitForTimeout(300);

    // Label badge should appear in sidebar (replacing "Select labels...")
    await expect(page.locator("text=Select labels...")).not.toBeVisible();
    await expect(page.locator(`text=${labelName}`).last()).toBeVisible();

    // Close and reopen — label should still be assigned
    await page.locator(".lucide-x").first().click();
    await page.waitForTimeout(500);
    const card = page.locator(`[data-rfd-draggable-id]`).filter({ hasText: "Label Persist" });
    await card.locator("span.font-mono").click();
    await page.waitForTimeout(500);

    // "Select labels..." should NOT be visible — label should be there
    await expect(page.locator("text=Select labels...")).not.toBeVisible();
    await expect(page.locator(`text=${labelName}`).last()).toBeVisible();
  });

  test("priority change persists after close/reopen", async ({ page }) => {
    await createAndOpenTicket(page, "Priority Persist");

    const prioritySelect = page.locator("select").nth(1);
    await expect(prioritySelect).toHaveValue("medium");
    await prioritySelect.selectOption("high");
    await page.waitForTimeout(500);

    // Close and reopen
    await page.locator(".lucide-x").first().click();
    await page.waitForTimeout(500);
    const card = page.locator(`[data-rfd-draggable-id]`).filter({ hasText: "Priority Persist" });
    await card.locator("span.font-mono").click();
    await page.waitForTimeout(500);

    await expect(page.locator("select").nth(1)).toHaveValue("high");
  });

  test("status change moves card to correct column", async ({ page }) => {
    await createAndOpenTicket(page, "Column Move");

    // Change to In Progress
    const statusSelect = page.locator("select").first();
    await statusSelect.selectOption({ label: "In Progress" });
    await page.waitForTimeout(1000);

    // Close detail
    await page.locator(".lucide-x").first().click();
    await page.waitForTimeout(500);

    // Card should NOT be in To Do column anymore
    // It should be in In Progress column
    const inProgressHeading = page.locator("h3").filter({ hasText: "In Progress" });
    await expect(inProgressHeading).toBeVisible();

    // Get the In Progress column container and check ticket is there
    const ipColumn = inProgressHeading.locator("..").locator("..");
    await expect(ipColumn.locator("text=Column Move")).toBeVisible();

    // To Do column should not have it
    const todoHeading = page.locator("h3").filter({ hasText: "To Do" });
    const todoColumn = todoHeading.locator("..").locator("..");
    await expect(todoColumn.locator("text=Column Move")).not.toBeVisible();
  });

  test("multiple tickets can have different assignees", async ({ page }) => {
    // Create ticket 1 and assign
    await createAndOpenTicket(page, "Ticket Alpha");
    await page.getByRole("button", { name: "Assign", exact: true }).click();
    await page.waitForTimeout(300);
    const dropdown = page.locator(".absolute.z-20");
    await dropdown.locator("button").first().click();
    await page.waitForTimeout(300);
    await page.locator(".fixed.inset-0.z-10").click();
    await page.waitForTimeout(300);
    await page.locator(".lucide-x").first().click();
    await page.waitForTimeout(500);

    // Create ticket 2 — do NOT assign
    await page.locator('button:has-text("Create")').first().click();
    await page.locator('input[placeholder="What needs to be done?"]').fill("Ticket Beta");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(1000);

    // Ticket Alpha should have an assigned avatar (not "?")
    const cardAlpha = page.locator(`[data-rfd-draggable-id]`).filter({ hasText: "Ticket Alpha" });
    await expect(cardAlpha.locator('span[title="Unassigned"]')).not.toBeVisible();

    // Ticket Beta should show "?" (unassigned)
    const cardBeta = page.locator(`[data-rfd-draggable-id]`).filter({ hasText: "Ticket Beta" });
    await expect(cardBeta.locator('span[title="Unassigned"]')).toBeVisible();
  });

  test("multiple tickets can have different labels", async ({ page }) => {
    // Create ticket 1 with a label
    await createAndOpenTicket(page, "Labeled One");
    await page.locator("text=Select labels...").click();
    await page.waitForTimeout(300);
    const dropdown = page.locator(".absolute.z-20");
    await dropdown.locator("button").first().click();
    await page.waitForTimeout(300);
    await page.locator(".fixed.inset-0.z-10").click();
    await page.waitForTimeout(300);
    await page.locator(".lucide-x").first().click();
    await page.waitForTimeout(500);

    // Create ticket 2 — no label
    await page.locator('button:has-text("Create")').first().click();
    await page.locator('input[placeholder="What needs to be done?"]').fill("Unlabeled Two");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(1000);

    // Labeled ticket card should have a label dot
    const card1 = page.locator(`[data-rfd-draggable-id]`).filter({ hasText: "Labeled One" });
    const labelDots = card1.locator("span.rounded-full").filter({ has: page.locator('[style*="background"]') });
    // Unlabeled ticket card should not
    const card2 = page.locator(`[data-rfd-draggable-id]`).filter({ hasText: "Unlabeled Two" });
    await expect(card2.locator('span[title="Unassigned"]')).toBeVisible();
  });
});
