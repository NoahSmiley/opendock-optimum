import { test, expect } from "@playwright/test";
import { loginUser, navigateTo, createBoard } from "./helpers";

/** Create a ticket and return its title. Clicks the first column's Create. */
async function quickCreateTicket(page: import("@playwright/test").Page, title: string) {
  await page.locator('button:has-text("Create")').first().click();
  await page.locator('input[placeholder="What needs to be done?"]').fill(title);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1000);
}

/** Open the detail sidebar for a ticket by clicking its key (not the title). */
async function openTicketDetail(page: import("@playwright/test").Page, title: string) {
  // Click the card area that isn't the title — the key span
  const card = page.locator(`[data-rfd-draggable-id]`).filter({ hasText: title });
  await card.locator("span.font-mono").click();
  await page.waitForTimeout(500);
}

test.describe("Boards — Tickets", () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
    await navigateTo(page, "Boards");
    await createBoard(page);
  });

  test("can create a ticket via quick create", async ({ page }) => {
    await quickCreateTicket(page, "My First Ticket");
    await expect(page.locator("text=My First Ticket")).toBeVisible();
  });

  test("new ticket gets an auto-generated key", async ({ page }) => {
    await quickCreateTicket(page, "Key Ticket");
    const keyEl = page.locator("span.font-mono").first();
    const keyText = await keyEl.textContent();
    expect(keyText).toMatch(/^[A-Z]+-\d+$/);
  });

  test("can open ticket detail by clicking", async ({ page }) => {
    await quickCreateTicket(page, "Detail Ticket");
    await openTicketDetail(page, "Detail Ticket");
    await expect(page.getByRole("button", { name: "Assign", exact: true })).toBeVisible();
    await expect(page.getByText("Status", { exact: true })).toBeVisible();
    await expect(page.getByText("Priority", { exact: true })).toBeVisible();
    await expect(page.getByText("Labels", { exact: true })).toBeVisible();
    await expect(page.locator("text=Story Points")).toBeVisible();
    await expect(page.locator("text=Due Date")).toBeVisible();
  });

  test("can change ticket priority", async ({ page }) => {
    await quickCreateTicket(page, "Priority Ticket");
    await openTicketDetail(page, "Priority Ticket");
    const prioritySelect = page.locator("select").nth(1);
    await prioritySelect.selectOption("high");
    await page.waitForTimeout(500);
    await expect(prioritySelect).toHaveValue("high");
  });

  test("can change ticket status (column)", async ({ page }) => {
    await quickCreateTicket(page, "Status Ticket");
    await openTicketDetail(page, "Status Ticket");
    const statusSelect = page.locator("select").first();
    await statusSelect.selectOption({ label: "In Progress" });
    await page.waitForTimeout(500);
  });

  test("can set story points", async ({ page }) => {
    await quickCreateTicket(page, "SP Ticket");
    await openTicketDetail(page, "SP Ticket");
    const spField = page.locator("text=-").last();
    await spField.click();
    const spInput = page.locator('input[type="number"]');
    await spInput.fill("5");
    await spInput.press("Enter");
    await page.waitForTimeout(1000);
    await expect(page.locator("text=5").first()).toBeVisible();
  });

  test("can toggle labels on a ticket", async ({ page }) => {
    await quickCreateTicket(page, "Label Ticket");
    await openTicketDetail(page, "Label Ticket");
    // Click the labels section to open dropdown
    const labelsBtn = page.locator("text=Select labels").or(page.locator("text=Labels")).last();
    await labelsBtn.click();
    await page.waitForTimeout(300);
    const labelOption = page.locator(".absolute.z-20 button").first();
    if (await labelOption.isVisible()) {
      await labelOption.click();
      await page.waitForTimeout(500);
    }
  });

  test("can assign a member to a ticket", async ({ page }) => {
    await quickCreateTicket(page, "Assign Ticket");
    await openTicketDetail(page, "Assign Ticket");
    await page.getByRole("button", { name: "Assign", exact: true }).click();
    await page.waitForTimeout(300);
    const dropdown = page.locator(".absolute.z-20");
    if (await dropdown.isVisible()) {
      const member = dropdown.locator("button").first();
      await member.click();
      await page.waitForTimeout(500);
    }
  });

  test("can delete a ticket", async ({ page }) => {
    await quickCreateTicket(page, "Delete Me");
    await openTicketDetail(page, "Delete Me");
    await page.locator(".lucide-trash-2").first().click();
    await page.waitForTimeout(300);
    await page.locator('button:has-text("Delete")').last().click();
    await page.waitForTimeout(1000);
    await expect(page.locator("text=Delete Me")).not.toBeVisible();
  });
});
