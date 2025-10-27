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
