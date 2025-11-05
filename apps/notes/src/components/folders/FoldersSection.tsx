import { useState } from 'react';
import { Folder, FolderPlus, ChevronRight, ChevronDown, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import type { Folder as FolderType } from '@opendock/shared/types';
import clsx from 'clsx';

interface FoldersSectionProps {
  folders: FolderType[];
  selectedFolderId: string | null;
  onSelectFolder: (folder: FolderType) => void;
  onCreateFolder: () => void;
  onEditFolder: (folder: FolderType) => void;
  onDeleteFolder: (folderId: string) => void;
  onClearFolderFilter: () => void;
}

export function FoldersSection({
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  onClearFolderFilter,
}: FoldersSectionProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [contextMenuFolder, setContextMenuFolder] = useState<string | null>(null);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const renderFolder = (folder: FolderType, level = 0) => {
    const hasChildren = folder.children && folder.children.length > 0;
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const isMenuOpen = contextMenuFolder === folder.id;

    return (
      <div key={folder.id}>
        <div
          className={clsx(
            'group relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
            isSelected
              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
              : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
          )}
          style={{ paddingLeft: `${12 + level * 16}px` }}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder.id);
              }}
              className="flex-shrink-0 p-0.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
          )}

          <button
            onClick={() => onSelectFolder(folder)}
            className="flex flex-1 items-center gap-2 min-w-0"
          >
            <Folder
              className="h-4 w-4 flex-shrink-0"
              style={{ color: folder.color || undefined }}
            />
            <span className="flex-1 truncate text-left">{folder.name}</span>
          </button>

          {/* Context Menu */}
          <div className="relative flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setContextMenuFolder(isMenuOpen ? null : folder.id);
              }}
              className={clsx(
                'p-1 rounded transition-opacity',
                isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                'hover:bg-neutral-200 dark:hover:bg-neutral-700'
              )}
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>

            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setContextMenuFolder(null)}
                />
                <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
                  <button
                    onClick={() => {
                      onEditFolder(folder);
                      setContextMenuFolder(null);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      onDeleteFolder(folder.id);
                      setContextMenuFolder(null);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div>
            {folder.children!.map(child => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-3 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          Folders
        </h3>
        <button
          onClick={onCreateFolder}
          className="rounded p-1 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          title="New folder"
        >
          <FolderPlus className="h-4 w-4" />
        </button>
      </div>

      {folders.length === 0 ? (
        <div className="px-3 py-4 text-center">
          <p className="text-xs text-neutral-400 dark:text-neutral-500">No folders yet</p>
          <button
            onClick={onCreateFolder}
            className="mt-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Create your first folder
          </button>
        </div>
      ) : (
        <div className="space-y-0.5">
          {folders.map(folder => renderFolder(folder))}
        </div>
      )}

      {selectedFolderId && (
        <button
          onClick={onClearFolderFilter}
          className="mx-3 mt-2 w-[calc(100%-1.5rem)] rounded-lg border border-neutral-200 px-3 py-2 text-xs text-neutral-600 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
        >
          Clear folder filter
        </button>
      )}
    </div>
  );
}
