import { describe, expect, it } from "vitest";
import type { DragBounds, TicketLayoutSnapshot } from "./drop-index";
import { calculateDropIndex } from "./drop-index";

const buildLayout = (tops: number[], height = 100): TicketLayoutSnapshot[] =>
  tops.map((top, index) => ({
    id: `ticket-${index}`,
    top,
    bottom: top + height,
    height,
  }));

const buildBounds = (values: Partial<DragBounds>): DragBounds => ({
  top: null,
  bottom: null,
  center: null,
  ...values,
});

describe("calculateDropIndex", () => {
  it("returns 0 when there is no existing layout", () => {
    expect(calculateDropIndex([], buildBounds({}))).toBe(0);
  });

  it("returns 0 when the dragged ticket is above the first ticket", () => {
    const layout = buildLayout([0, 120, 240]);
    const bounds = buildBounds({ top: -10, center: 30 });
    expect(calculateDropIndex(layout, bounds)).toBe(0);
  });

  it("returns 0 when the dragged ticket overlaps the first ticket", () => {
    const layout = buildLayout([0, 120, 240]);
    const bounds = buildBounds({ top: 20, center: 70, bottom: 140 });
    expect(calculateDropIndex(layout, bounds)).toBe(0);
  });

  it("returns the layout length when the dragged ticket is below the final ticket", () => {
    const layout = buildLayout([0, 120, 240]);
    const bounds = buildBounds({ bottom: 360, center: 350 });
    expect(calculateDropIndex(layout, bounds)).toBe(layout.length);
  });

  it("returns the index where the center crosses a ticket midpoint", () => {
    const layout = buildLayout([0, 120, 240]);
    const bounds = buildBounds({ center: 210 }); // between ticket-1 and ticket-2 midpoints
    expect(calculateDropIndex(layout, bounds)).toBe(2);
  });

  it("returns the index when the top edge crosses an item buffer", () => {
    const layout = buildLayout([0, 120, 240]);
    const bounds = buildBounds({ top: 125 }); // just into second ticket
    expect(calculateDropIndex(layout, bounds)).toBe(1);
  });

  it("returns the intermediate index when hovering between first and second tickets", () => {
    const layout = buildLayout([0, 120, 240]);
    const bounds = buildBounds({ top: 90, center: 135, bottom: 190 });
    expect(calculateDropIndex(layout, bounds)).toBe(1);
  });

  it("handles non-sequential layout gaps", () => {
    const layout = buildLayout([0, 400, 900], 150);
    const bounds = buildBounds({ center: 845 }); // between second and third
    expect(calculateDropIndex(layout, bounds)).toBe(2);
  });
});
