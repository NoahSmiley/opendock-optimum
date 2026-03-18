import { X, Download } from "lucide-react";
import type { FileItem } from "@/stores/files/types";

interface FilePreviewProps {
  file: FileItem;
  onClose: () => void;
}

export function FilePreview({ file, onClose }: FilePreviewProps) {
  const isImage = file.mimeType.startsWith("image/");
  const isVideo = file.mimeType.startsWith("video/");
  const isAudio = file.mimeType.startsWith("audio/");
  const isPdf = file.mimeType === "application/pdf";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{file.name}</p>
            <p className="text-xs text-neutral-500">{formatSize(file.size)}</p>
          </div>
          <div className="flex items-center gap-1">
            <a href={file.url} download={file.name}
              className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white">
              <Download className="h-4 w-4" />
            </a>
            <button onClick={onClose}
              className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-6">
          {isImage && <img src={file.url} alt={file.name} className="max-h-full max-w-full rounded-lg object-contain" />}
          {isVideo && <video src={file.url} controls className="max-h-full max-w-full rounded-lg" />}
          {isAudio && <audio src={file.url} controls className="w-full" />}
          {isPdf && <iframe src={file.url} title={file.name} className="h-full w-full rounded-lg" />}
          {!isImage && !isVideo && !isAudio && !isPdf && (
            <div className="text-center">
              <p className="text-sm text-neutral-400">Preview not available for this file type.</p>
              <a href={file.url} download={file.name}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
                <Download className="h-4 w-4" /> Download
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
