import { useState, useCallback, useRef } from "react";
import { Upload } from "lucide-react";
import clsx from "clsx";

interface UploadZoneProps {
  onUpload: (files: File[]) => void;
}

export function UploadZone({ onUpload }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) onUpload(files);
  }, [onUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) onUpload(files);
    e.target.value = "";
  }, [onUpload]);

  return (
    <div onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={() => setDragging(false)}
      onClick={() => inputRef.current?.click()}
      className={clsx(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 transition-colors",
        dragging ? "border-indigo-500 bg-indigo-500/5" : "border-neutral-800 hover:border-neutral-600",
      )}>
      <Upload className={clsx("h-8 w-8", dragging ? "text-indigo-400" : "text-neutral-600")} />
      <p className="text-sm text-neutral-400">
        {dragging ? "Drop files here" : "Drag & drop files, or click to browse"}
      </p>
      <input ref={inputRef} type="file" multiple onChange={handleChange} className="hidden" />
    </div>
  );
}
