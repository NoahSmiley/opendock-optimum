import { BookOpen } from "lucide-react";

interface NotebookCoverProps {
  name: string;
  icon?: string | null;
  color?: string | null;
  coverPattern?: "solid" | "grid" | "dots" | "lines" | "leather";
  noteCount?: number;
  onClick?: () => void;
}

const PATTERN_SVG: Record<string, string> = {
  grid: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h20v20H0z' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E\")",
  dots: "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)",
  lines: "repeating-linear-gradient(0deg, transparent, transparent 9px, rgba(255,255,255,0.06) 9px, rgba(255,255,255,0.06) 10px)",
};

export function NotebookCover({ name, color, coverPattern = "solid", noteCount, onClick }: NotebookCoverProps) {
  const bg = color ?? "#6366f1";

  return (
    <div className="flex flex-col gap-2.5">
      <button onClick={onClick}
        className="group relative flex h-52 w-full flex-col overflow-hidden rounded-xl transition-all duration-200 hover:scale-[1.03] hover:shadow-xl"
        style={{ backgroundColor: bg }}>
        {coverPattern !== "solid" && PATTERN_SVG[coverPattern] && (
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: PATTERN_SVG[coverPattern], backgroundSize: coverPattern === "dots" ? "12px 12px" : undefined }} />
        )}
        <div className="absolute right-3 top-0 bottom-0 w-1 rounded-full bg-white/8" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/20" />
        <div className="mt-auto p-4">
          <BookOpen className="h-5 w-5 text-white/60" />
        </div>
      </button>
      <div className="flex flex-col gap-0.5 px-0.5">
        <span className="line-clamp-2 text-sm font-medium text-neutral-200">{name}</span>
        {noteCount !== undefined && (
          <span className="text-[11px] text-neutral-600">{noteCount} page{noteCount !== 1 ? "s" : ""}</span>
        )}
      </div>
    </div>
  );
}
