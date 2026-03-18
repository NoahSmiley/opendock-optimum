import { Keyboard, X } from 'lucide-react';
import { useEffect } from 'react';
import type { KeyboardShortcut } from '../../hooks/useKeyboardShortcuts';

interface KeyboardShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
}

export function KeyboardShortcutsDialog({ isOpen, onClose, shortcuts }: KeyboardShortcutsDialogProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Group shortcuts by category
  const groupedShortcuts = {
    'General': shortcuts.filter(s => ['Create new note', 'Create new collection', 'Search notes', 'Toggle sidebar', 'Open command palette'].includes(s.description)),
    'Note Actions': shortcuts.filter(s => ['Save note', 'Duplicate note', 'Delete note', 'Archive note', 'Export note'].includes(s.description)),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-100 p-2 dark:bg-indigo-900/30">
              <Keyboard className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="space-y-6">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => {
            if (categoryShortcuts.length === 0) return null;

            return (
              <div key={category}>
                <h3 className="mb-3 text-sm font-semibold text-neutral-500 dark:text-neutral-400">{category}</h3>
                <div className="space-y-2">
                  {categoryShortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-800/50"
                    >
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">{shortcut.description}</span>
                      <kbd className="flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:text-white dark:ring-neutral-700">
                        {shortcut.key.split(' + ').map((key, i) => (
                          <span key={i}>
                            {i > 0 && <span className="text-neutral-400">+</span>}
                            <span className="mx-0.5">{key}</span>
                          </span>
                        ))}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/50">
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            <strong>Tip:</strong> Press <kbd className="rounded bg-white px-1.5 py-0.5 text-xs font-semibold shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-700">?</kbd> to toggle this dialog
          </p>
        </div>
      </div>
    </div>
  );
}
