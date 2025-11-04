import { useState, useEffect, useRef } from 'react';
import { X, Plus, Check } from 'lucide-react';
import clsx from 'clsx';
import type { CreateNoteInput } from '@opendock/shared/types';

interface QuickNoteProps {
  onCreateNote: (input: CreateNoteInput) => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickNoteModal({ onCreateNote, isOpen, onClose }: QuickNoteProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'n') {
        e.preventDefault();
        if (!isOpen) {
          // Parent component should handle this
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSave = async () => {
    if (!title.trim()) {
      titleInputRef.current?.focus();
      return;
    }

    setIsSaving(true);
    try {
      await onCreateNote({
        title: title.trim(),
        content: content.trim(),
        contentType: 'markdown',
        tags: [],
      });

      // Reset form
      setTitle('');
      setContent('');
      onClose();
    } catch (error) {
      console.error('Failed to create quick note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm dark:bg-black/40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-2xl sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2">
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Quick Note
            </h3>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title..."
              className="mb-3 w-full border-none bg-transparent text-lg font-semibold text-neutral-900 outline-none focus:ring-0 dark:text-white"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              rows={4}
              className="w-full resize-none border-none bg-transparent text-neutral-900 outline-none focus:ring-0 dark:text-white"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <div className="text-xs text-neutral-400 dark:text-neutral-500">
              <kbd className="rounded border border-neutral-300 px-1.5 py-0.5 text-[10px] dark:border-neutral-700">
                Esc
              </kbd>{' '}
              to close
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !title.trim()}
                className={clsx(
                  'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors',
                  isSaving || !title.trim()
                    ? 'cursor-not-allowed bg-neutral-400 dark:bg-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200'
                )}
              >
                {isSaving ? (
                  <>
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-3 w-3" />
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

interface QuickNoteButtonProps {
  onClick: () => void;
}

export function QuickNoteButton({ onClick }: QuickNoteButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-8 right-8 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-900 text-white shadow-lg transition-all hover:scale-110 hover:shadow-xl dark:bg-neutral-100 dark:text-neutral-900"
      title="Quick Note (Cmd/Ctrl+Shift+N)"
    >
      <Plus className="h-6 w-6" />
    </button>
  );
}
