import { File, FileText, FileImage, FileVideo, FileAudio, Trash2 } from "lucide-react";
import type { FileItem } from "@/stores/files/types";

interface FileRowProps {
  file: FileItem;
  onClick: (file: FileItem) => void;
  onDelete: (fileId: string) => void;
}

export function FileRow({ file, onClick, onDelete }: FileRowProps) {
  const Icon = getFileIcon(file.mimeType);

  return (
    <div onClick={() => onClick(file)}
      className="group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-neutral-800/50">
      <Icon className="h-4 w-4 shrink-0 text-neutral-500" />
      <span className="flex-1 truncate text-sm text-white">{file.name}</span>
      <span className="shrink-0 text-xs text-neutral-500">{formatSize(file.size)}</span>
      <span className="shrink-0 text-xs text-neutral-600">{formatDate(file.createdAt)}</span>
      <button onClick={(e) => { e.stopPropagation(); onDelete(file.id); }}
        className="shrink-0 rounded-md p-1 text-neutral-600 opacity-0 transition-all hover:bg-red-900/20 hover:text-red-400 group-hover:opacity-100">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function getFileIcon(mime: string) {
  if (mime.startsWith("image/")) return FileImage;
  if (mime.startsWith("video/")) return FileVideo;
  if (mime.startsWith("audio/")) return FileAudio;
  if (mime.includes("pdf") || mime.includes("text") || mime.includes("document")) return FileText;
  return File;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
