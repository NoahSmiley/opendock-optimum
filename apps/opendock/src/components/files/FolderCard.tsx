import { Folder, Trash2 } from "lucide-react";
import type { FileFolder } from "@/stores/files/types";

interface FolderCardProps {
  folder: FileFolder;
  onClick: (folderId: string) => void;
  onDelete: (folderId: string) => void;
  variant: "grid" | "list";
}

export function FolderCard({ folder, onClick, onDelete, variant }: FolderCardProps) {
  if (variant === "list") {
    return (
      <div onClick={() => onClick(folder.id)}
        className="group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-neutral-800/50">
        <Folder className="h-4 w-4 shrink-0 text-amber-400/70" />
        <span className="flex-1 truncate text-sm font-medium text-white">{folder.name}</span>
        <span className="shrink-0 text-xs text-neutral-600">{formatDate(folder.createdAt)}</span>
        <button onClick={(e) => { e.stopPropagation(); onDelete(folder.id); }}
          className="shrink-0 rounded-md p-1 text-neutral-600 opacity-0 transition-all hover:bg-red-900/20 hover:text-red-400 group-hover:opacity-100">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div onClick={() => onClick(folder.id)}
      className="group flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-neutral-800/50 bg-neutral-900/30 p-4 transition-colors hover:border-neutral-700 hover:bg-neutral-800/30">
      <div className="flex h-20 w-full items-center justify-center rounded-lg bg-neutral-800/50">
        <Folder className="h-10 w-10 text-amber-400/70" />
      </div>
      <div className="flex w-full items-center gap-2">
        <p className="min-w-0 flex-1 truncate text-xs font-medium text-white">{folder.name}</p>
        <button onClick={(e) => { e.stopPropagation(); onDelete(folder.id); }}
          className="shrink-0 rounded-md p-1 text-neutral-600 opacity-0 transition-all hover:bg-red-900/20 hover:text-red-400 group-hover:opacity-100">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
