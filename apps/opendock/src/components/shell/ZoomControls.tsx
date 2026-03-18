import { useEffect, useRef } from "react";

const MIN_ZOOM = 0.75;
const MAX_ZOOM = 1.5;
const ZOOM_STEP = 0.05;
const STORAGE_KEY = "opendock-zoom";

function getStoredZoom(): number {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const value = parseFloat(stored);
    if (!isNaN(value) && value >= MIN_ZOOM && value <= MAX_ZOOM) return value;
  }
  return 1;
}

function applyZoom(level: number) {
  document.documentElement.style.fontSize = `${14 * level}px`;
  localStorage.setItem(STORAGE_KEY, String(level));
}

export function ZoomControls() {
  const zoomRef = useRef(getStoredZoom());

  useEffect(() => {
    applyZoom(zoomRef.current);

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      zoomRef.current = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, zoomRef.current + delta),
      );
      applyZoom(zoomRef.current);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      if (e.key === "=" || e.key === "+") {
        e.preventDefault();
        zoomRef.current = Math.min(MAX_ZOOM, zoomRef.current + ZOOM_STEP);
        applyZoom(zoomRef.current);
      } else if (e.key === "-") {
        e.preventDefault();
        zoomRef.current = Math.max(MIN_ZOOM, zoomRef.current - ZOOM_STEP);
        applyZoom(zoomRef.current);
      } else if (e.key === "0") {
        e.preventDefault();
        zoomRef.current = 1;
        applyZoom(1);
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return null;
}
