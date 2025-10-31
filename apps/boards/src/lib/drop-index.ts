export interface DragBounds {
  top: number | null;
  bottom: number | null;
  center: number | null;
}

export interface TicketLayoutSnapshot {
  id: string;
  top: number;
  bottom: number;
  height: number;
}

const safeEscapeCss = (value: string) => {
  const css = (globalThis as { CSS?: { escape?: (input: string) => string } }).CSS;
  if (css?.escape) {
    return css.escape(value);
  }
  return value.replace(/[^a-zA-Z0-9_-]/g, (char) => `\\${char}`);
};

export function collectColumnLayout(columnId: string, activeTicketId: string): TicketLayoutSnapshot[] {
  if (typeof document === "undefined") {
    return [];
  }

  const escapedId = safeEscapeCss(columnId);
  return Array.from(
    document.querySelectorAll<HTMLElement>(`[data-column-id="${escapedId}"] [data-ticket-id]`),
  )
    .map((node) => {
      const id = node.dataset.ticketId;
      if (!id || id === activeTicketId) {
        return null;
      }
      const rect = node.getBoundingClientRect();
      return {
        id,
        top: rect.top,
        bottom: rect.bottom,
        height: rect.height,
      };
    })
    .filter((snapshot): snapshot is TicketLayoutSnapshot => snapshot !== null);
}

export function calculateDropIndex(layout: TicketLayoutSnapshot[], bounds: DragBounds): number {
  if (layout.length === 0) {
    return 0;
  }

  const sorted = [...layout].sort((a, b) => a.top - b.top);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const topThreshold = first.top + first.height * 0.6;
  const bottomThreshold = last.bottom - last.height * 0.6;

  if (bounds.top !== null && bounds.top <= topThreshold) {
    return 0;
  }
  if (bounds.center !== null && bounds.center <= topThreshold) {
    return 0;
  }

  if (bounds.bottom !== null && bounds.bottom >= bottomThreshold) {
    return sorted.length;
  }
  if (bounds.center !== null && bounds.center >= bottomThreshold) {
    return sorted.length;
  }

  for (let index = 0; index < sorted.length; index += 1) {
    const current = sorted[index];
    const halfway = current.top + current.height / 2;
    const generousTop = current.top + current.height * 0.6;

    if (bounds.center !== null && bounds.center < halfway) {
      return index;
    }
    if (bounds.top !== null && bounds.top < generousTop) {
      return index;
    }
  }

  return sorted.length;
}
