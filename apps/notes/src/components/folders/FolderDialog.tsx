import { useState, useEffect } from 'react';
import { X, Folder as FolderIcon } from 'lucide-react';
import type { Folder, CreateFolderInput, UpdateFolderInput } from '@opendock/shared/types';

interface FolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateFolderInput | UpdateFolderInput) => Promise<void>;
  onDelete?: (folderId: string) => Promise<void>;
  folder?: Folder | null;
  mode: 'create' | 'edit';
  folders: Folder[]; // For parent selection
}

const FOLDER_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Gray', value: '#6B7280' },
];

export function FolderDialog({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  folder,
  mode,
  folders,
}: FolderDialogProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState<string | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen && folder) {
      setName(folder.name);
      setColor(folder.color || null);
      setParentId(folder.parentId || null);
    } else if (isOpen && !folder) {
      setName('');
      setColor(null);
      setParentId(null);
    }
  }, [isOpen, folder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const data: CreateFolderInput | UpdateFolderInput = {
        name: name.trim(),
        color: color || undefined,
        parentId: parentId || undefined,
      };
      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error('Failed to submit folder:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!folder || !onDelete) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${folder.name}"? All sub-folders and notes will be moved to the root.`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await onDelete(folder.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete folder:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const availableParents = folders.filter(
    f => f.id !== folder?.id && f.parentId !== folder?.id
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-neutral-900">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
            {mode === 'create' ? 'New Folder' : 'Edit Folder'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-500 transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Work Notes"
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500"
              autoFocus
              required
            />
          </div>

          {/* Parent Folder */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Parent Folder (Optional)
            </label>
            <select
              value={parentId || ''}
              onChange={(e) => setParentId(e.target.value || null)}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            >
              <option value="">None (Root Level)</option>
              {availableParents.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Color */}
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Color (Optional)
            </label>
            <div className="grid grid-cols-8 gap-2">
              {FOLDER_COLORS.map(colorOption => (
                <button
                  key={colorOption.value}
                  type="button"
                  onClick={() => setColor(color === colorOption.value ? null : colorOption.value)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                    color === colorOption.value
                      ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-neutral-900'
                      : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: colorOption.value }}
                  title={colorOption.name}
                >
                  {color === colorOption.value && (
                    <FolderIcon className="h-4 w-4 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-4">
            <div>
              {mode === 'edit' && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || isSubmitting}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
