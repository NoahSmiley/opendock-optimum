import { Upload, FolderPlus, LayoutGrid, List, ChevronRight, Home } from "lucide-react";
import clsx from "clsx";
import type { FileFolder, FilesViewMode, FilesSortBy } from "@/stores/files/types";

interface FilesHeaderProps {
  currentFolder: FileFolder | null;
  breadcrumbs: FileFolder[];
  viewMode: FilesViewMode;
  sortBy: FilesSortBy;
  onViewChange: (mode: FilesViewMode) => void;
  onSortChange: (sort: FilesSortBy) => void;
  onNavigate: (folderId: string | null) => void;
  onUpload: () => void;
  onNewFolder: () => void;
}

const SORT_OPTIONS: { label: string; value: FilesSortBy }[] = [
  { label: "Date", value: "date" },
  { label: "Name", value: "name" },
  { label: "Size", value: "size" },
];

export function FilesHeader({
  currentFolder, breadcrumbs, viewMode, sortBy,
  onViewChange, onSortChange, onNavigate, onUpload, onNewFolder,
}: FilesHeaderProps) {
  return (
    <header className="flex w-full flex-shrink-0 flex-col gap-3 border-b border-neutral-800/50 px-6 py-4">
      <div className="flex items-center justify-between">
        <Breadcrumbs crumbs={breadcrumbs} current={currentFolder} onNavigate={onNavigate} />
        <div className="flex items-center gap-2">
          <select value={sortBy} onChange={(e) => onSortChange(e.target.value as FilesSortBy)}
            className="rounded-lg border-neutral-800 bg-neutral-900/50 px-2 py-1 text-xs text-neutral-400">
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <div className="flex rounded-lg border border-neutral-800 bg-neutral-900/50 p-0.5">
            <button onClick={() => onViewChange("grid")}
              className={clsx("rounded-md p-1 transition-colors", viewMode === "grid" ? "bg-neutral-800 text-white" : "text-neutral-500")}>
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => onViewChange("list")}
              className={clsx("rounded-md p-1 transition-colors", viewMode === "list" ? "bg-neutral-800 text-white" : "text-neutral-500")}>
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
          <button onClick={onNewFolder}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/50 px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:text-white">
            <FolderPlus className="h-3.5 w-3.5" /> Folder
          </button>
          <button onClick={onUpload}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-500">
            <Upload className="h-3.5 w-3.5" /> Upload
          </button>
        </div>
      </div>
    </header>
  );
}

function Breadcrumbs({ crumbs, current, onNavigate }: {
  crumbs: FileFolder[]; current: FileFolder | null; onNavigate: (id: string | null) => void;
}) {
  return (
    <div className="flex items-center gap-1 text-sm">
      <button onClick={() => onNavigate(null)} className="text-neutral-400 transition-colors hover:text-white">
        <Home className="h-4 w-4" />
      </button>
      {crumbs.map((f) => (
        <span key={f.id} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3 text-neutral-600" />
          <button onClick={() => onNavigate(f.id)} className="text-neutral-400 transition-colors hover:text-white">{f.name}</button>
        </span>
      ))}
      {current && (
        <span className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3 text-neutral-600" />
          <span className="font-medium text-white">{current.name}</span>
        </span>
      )}
    </div>
  );
}
