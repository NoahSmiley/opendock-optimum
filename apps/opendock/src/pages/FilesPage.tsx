import { useEffect, useState, useCallback, useMemo } from "react";
import { useFilesStore } from "@/stores/files/store";
import * as filesApi from "@/lib/api/files";
import { FilesHeader } from "@/components/files/FilesHeader";
import { FileCard } from "@/components/files/FileCard";
import { FileRow } from "@/components/files/FileRow";
import { FolderCard } from "@/components/files/FolderCard";
import { UploadZone } from "@/components/files/UploadZone";
import { FilePreview } from "@/components/files/FilePreview";
import type { FileItem, FileFolder } from "@/stores/files/types";

export function FilesPage() {
  const store = useFilesStore();
  const { files, folders, currentFolderId, viewMode, sortBy, fetchFiles, fetchFolders } = store;
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => { fetchFiles(); fetchFolders(); }, [fetchFiles, fetchFolders]);

  const currentFolder = useMemo(() => folders.find((f) => f.id === currentFolderId) ?? null, [folders, currentFolderId]);
  const breadcrumbs = useMemo(() => buildBreadcrumbs(folders, currentFolderId), [folders, currentFolderId]);
  const visibleFolders = useMemo(() => folders.filter((f) => f.parentId === currentFolderId), [folders, currentFolderId]);
  const visibleFiles = useMemo(() => {
    const filtered = files.filter((f) => f.folderId === currentFolderId);
    return sortFiles(filtered, sortBy);
  }, [files, currentFolderId, sortBy]);

  const handleUpload = useCallback(async (uploadFiles: File[]) => {
    for (const f of uploadFiles) await filesApi.uploadFile(f, currentFolderId);
    fetchFiles();
    setShowUpload(false);
  }, [currentFolderId, fetchFiles]);

  const handleNewFolder = useCallback(async () => {
    const name = prompt("Folder name:");
    if (!name?.trim()) return;
    await filesApi.createFolder(name.trim(), currentFolderId);
    fetchFolders();
  }, [currentFolderId, fetchFolders]);

  const handleDeleteFile = useCallback(async (id: string) => {
    await filesApi.deleteFile(id);
    fetchFiles();
  }, [fetchFiles]);

  const handleDeleteFolder = useCallback(async (id: string) => {
    await filesApi.deleteFolder(id);
    fetchFolders();
  }, [fetchFolders]);

  const isEmpty = visibleFolders.length === 0 && visibleFiles.length === 0;

  return (
    <div className="flex h-full flex-col">
      <FilesHeader currentFolder={currentFolder} breadcrumbs={breadcrumbs} viewMode={viewMode}
        sortBy={sortBy} onViewChange={store.setViewMode} onSortChange={store.setSortBy}
        onNavigate={store.setCurrentFolder} onUpload={() => setShowUpload(true)} onNewFolder={handleNewFolder} />
      <div className="flex-1 overflow-y-auto p-6">
        {showUpload && <div className="mb-6"><UploadZone onUpload={handleUpload} /></div>}
        {isEmpty && !showUpload && <EmptyState onUpload={() => setShowUpload(true)} />}
        <FileGrid folders={visibleFolders} files={visibleFiles} viewMode={viewMode}
          onFolderClick={store.setCurrentFolder} onFileClick={setPreviewFile}
          onDeleteFile={handleDeleteFile} onDeleteFolder={handleDeleteFolder} />
      </div>
      {previewFile && <FilePreview file={previewFile} onClose={() => setPreviewFile(null)} />}
    </div>
  );
}

function FileGrid({ folders, files, viewMode, onFolderClick, onFileClick, onDeleteFile, onDeleteFolder }: {
  folders: FileFolder[]; files: FileItem[]; viewMode: "grid" | "list";
  onFolderClick: (id: string) => void; onFileClick: (f: FileItem) => void;
  onDeleteFile: (id: string) => void; onDeleteFolder: (id: string) => void;
}) {
  if (viewMode === "list") {
    return (
      <div className="flex flex-col">
        {folders.map((f) => <FolderCard key={f.id} folder={f} onClick={onFolderClick} onDelete={onDeleteFolder} variant="list" />)}
        {files.map((f) => <FileRow key={f.id} file={f} onClick={onFileClick} onDelete={onDeleteFile} />)}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {folders.map((f) => <FolderCard key={f.id} folder={f} onClick={onFolderClick} onDelete={onDeleteFolder} variant="grid" />)}
      {files.map((f) => <FileCard key={f.id} file={f} onClick={onFileClick} onDelete={onDeleteFile} />)}
    </div>
  );
}

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-sm text-neutral-400">No files yet.</p>
      <button onClick={onUpload}
        className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500">
        Upload your first file
      </button>
    </div>
  );
}

function buildBreadcrumbs(folders: FileFolder[], targetId: string | null): FileFolder[] {
  if (!targetId) return [];
  const crumbs: FileFolder[] = [];
  let current = folders.find((f) => f.id === targetId);
  while (current?.parentId) {
    const parent = folders.find((f) => f.id === current!.parentId);
    if (parent) crumbs.unshift(parent);
    current = parent;
  }
  return crumbs;
}

function sortFiles(files: FileItem[], sortBy: string): FileItem[] {
  const sorted = [...files];
  if (sortBy === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
  else if (sortBy === "size") sorted.sort((a, b) => b.size - a.size);
  else sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return sorted;
}
