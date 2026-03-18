import { File, FileText, FileImage, FileVideo, FileAudio, Trash2 } from "lucide-react";
import type { FileItem } from "@/stores/files/types";

interface FileCardProps {
  file: FileItem;
  onClick: (file: FileItem) => void;
  onDelete: (fileId: string) => void;
}

export function FileCard({ file, onClick, onDelete }: FileCardProps) {
  const Icon = getFileIcon(file.mimeType);

  return (
    <div onClick={() => onClick(file)}
      className="group flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-neutral-800/50 bg-neutral-900/30 p-4 transition-colors hover:border-neutral-700 hover:bg-neutral-800/30">
      {isImage(file.mimeType) && file.thumbnailUrl ? (
        <img src={file.thumbnailUrl} alt={file.name}
          className="h-20 w-full rounded-lg object-cover" />
      ) : (
        <div className="flex h-20 w-full items-center justify-center rounded-lg bg-neutral-800/50">
          <Icon className="h-8 w-8 text-neutral-500" />
        </div>
      )}
      <div className="flex w-full items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-white">{file.name}</p>
          <p className="text-[10px] text-neutral-500">{formatSize(file.size)}</p>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onDelete(file.id); }}
          className="shrink-0 rounded-md p-1 text-neutral-600 opacity-0 transition-all hover:bg-red-900/20 hover:text-red-400 group-hover:opacity-100">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
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

function isImage(mime: string) { return mime.startsWith("image/"); }

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
