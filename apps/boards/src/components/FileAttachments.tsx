import { useState, useRef, useCallback } from "react";
import { Upload, Image as ImageIcon, Download, Trash2, X, FileText, File, Paperclip } from "lucide-react";
import type { KanbanAttachment } from "@opendock/shared/types";
import { boardsApi } from "@/lib/api";
import { ConfirmDialog } from "./ConfirmDialog";

interface FileAttachmentsProps {
  ticketId: string;
  attachments?: KanbanAttachment[];
  onAttachmentsUpdate?: () => void;
  showHeader?: boolean;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith("image/")) return ImageIcon;
  if (mimeType.includes("pdf")) return FileText;
  if (mimeType.includes("text")) return FileText;
  return File;
};

const isImageFile = (mimeType: string) => mimeType.startsWith("image/");

export function FileAttachments({ ticketId, attachments = [], onAttachmentsUpdate, showHeader = true }: FileAttachmentsProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      setUploading(true);
      try {
        const formData = new FormData();
        Array.from(files).forEach((file) => {
          formData.append("files", file);
        });

        await boardsApi.uploadAttachments(ticketId, formData);
        onAttachmentsUpdate?.();
      } catch (error) {
        console.error("Failed to upload files:", error);
        alert("Failed to upload files. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [ticketId, onAttachmentsUpdate],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDelete = async (attachmentId: string) => {
    try {
      await boardsApi.deleteAttachment(attachmentId);
      onAttachmentsUpdate?.();
      setDeleteId(null);
    } catch (error) {
      console.error("Failed to delete attachment:", error);
      alert("Failed to delete attachment. Please try again.");
    }
  };

  const handleDownload = (attachment: KanbanAttachment) => {
    const link = document.createElement("a");
    link.href = attachment.url;
    link.download = attachment.originalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-3">
      {/* Section Header */}
      {showHeader && (
        <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-neutral-500 dark:text-neutral-400">
          <Paperclip className="h-3.5 w-3.5" />
          Attachments ({attachments.length})
        </h3>
      )}

      {/* Upload Area */}
      <div
        className={`relative rounded-xl border-2 border-dashed p-4 text-center transition ${
          dragOver
            ? "border-blue-500 bg-blue-50/80 shadow-sm dark:bg-blue-900/25"
            : "border-neutral-200/70 bg-white/85 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:border-neutral-700/60 dark:bg-neutral-900/60"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={uploading}
        />

        {uploading ? (
          <div className="flex items-center justify-center gap-2 py-1">
            <Upload className="h-4 w-4 animate-pulse text-blue-500" />
            <p className="text-xs text-neutral-600 dark:text-neutral-300">Uploading...</p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 py-1 text-neutral-600 transition hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
          >
            <Upload className="h-4 w-4" />
            <span className="text-xs">
              <span className="font-semibold">Click to upload</span> or drag files here
            </span>
          </button>
        )}
      </div>

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-1.5">
          {attachments.map((attachment) => {
            const FileIconComponent = getFileIcon(attachment.mimeType);
            const isImage = isImageFile(attachment.mimeType);

            return (
              <div
                key={attachment.id}
                className="flex items-center gap-3 rounded-xl border border-neutral-200/70 bg-white/85 p-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:border-neutral-700/60 dark:bg-neutral-900/60"
              >
                {isImage ? (
                  <button
                    type="button"
                    onClick={() => setPreviewImage(attachment.url)}
                    className="group relative h-10 w-10 flex-shrink-0 overflow-hidden rounded border border-neutral-200 transition hover:opacity-80 dark:border-neutral-700"
                  >
                    <img src={attachment.url} alt={attachment.originalFilename} className="h-full w-full object-cover" />
                  </button>
                ) : (
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded bg-neutral-100 dark:bg-neutral-700">
                    <FileIconComponent className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-neutral-900 dark:text-white">{attachment.originalFilename}</p>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400">{formatFileSize(attachment.size)}</p>
                </div>

                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => handleDownload(attachment)}
                    className="rounded p-1.5 text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white"
                    title="Download"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteId(attachment.id)}
                    className="rounded p-1.5 text-neutral-600 transition hover:bg-rose-50 hover:text-rose-600 dark:text-neutral-300 dark:hover:bg-rose-900/20 dark:hover:text-rose-300"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setPreviewImage(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>
          <img src={previewImage} alt="Preview" className="max-h-[90vh] max-w-[90vw] object-contain" />
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        title="Delete Attachment"
        message="Are you sure you want to delete this attachment? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
