import { useHotkeys } from 'react-hotkeys-hook';
import { useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  description: string;
  action: () => void;
  enabled?: boolean;
}

export interface UseKeyboardShortcutsOptions {
  onNewNote?: () => void;
  onNewCollection?: () => void;
  onSearch?: () => void;
  onToggleSidebar?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onArchive?: () => void;
  onExport?: () => void;
  onCommandPalette?: () => void;
}

/**
 * Hook to manage keyboard shortcuts across the Notes app
 * Provides consistent keyboard navigation and actions
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const {
    onNewNote,
    onNewCollection,
    onSearch,
    onToggleSidebar,
    onSave,
    onDelete,
    onDuplicate,
    onArchive,
    onExport,
    onCommandPalette,
  } = options;

  // Global shortcuts
  useHotkeys(
    'mod+n',
    (e) => {
      e.preventDefault();
      onNewNote?.();
    },
    { enabled: !!onNewNote },
    [onNewNote]
  );

  useHotkeys(
    'mod+shift+n',
    (e) => {
      e.preventDefault();
      onNewCollection?.();
    },
    { enabled: !!onNewCollection },
    [onNewCollection]
  );

  useHotkeys(
    'mod+k',
    (e) => {
      e.preventDefault();
      onCommandPalette?.();
    },
    { enabled: !!onCommandPalette },
    [onCommandPalette]
  );

  useHotkeys(
    'mod+f',
    (e) => {
      e.preventDefault();
      onSearch?.();
    },
    { enabled: !!onSearch },
    [onSearch]
  );

  useHotkeys(
    'mod+/',
    (e) => {
      e.preventDefault();
      onToggleSidebar?.();
    },
    { enabled: !!onToggleSidebar },
    [onToggleSidebar]
  );

  useHotkeys(
    'mod+s',
    (e) => {
      e.preventDefault();
      onSave?.();
    },
    { enabled: !!onSave },
    [onSave]
  );

  useHotkeys(
    'mod+d',
    (e) => {
      e.preventDefault();
      onDuplicate?.();
    },
    { enabled: !!onDuplicate },
    [onDuplicate]
  );

  useHotkeys(
    'mod+shift+backspace',
    (e) => {
      e.preventDefault();
      onDelete?.();
    },
    { enabled: !!onDelete },
    [onDelete]
  );

  useHotkeys(
    'mod+shift+a',
    (e) => {
      e.preventDefault();
      onArchive?.();
    },
    { enabled: !!onArchive },
    [onArchive]
  );

  useHotkeys(
    'mod+e',
    (e) => {
      e.preventDefault();
      onExport?.();
    },
    { enabled: !!onExport },
    [onExport]
  );

  // Return a list of active shortcuts for documentation
  const getActiveShortcuts = useCallback((): KeyboardShortcut[] => {
    const shortcuts: KeyboardShortcut[] = [];

    if (onNewNote) {
      shortcuts.push({
        key: 'Cmd/Ctrl + N',
        description: 'Create new note',
        action: onNewNote,
      });
    }

    if (onNewCollection) {
      shortcuts.push({
        key: 'Cmd/Ctrl + Shift + N',
        description: 'Create new collection',
        action: onNewCollection,
      });
    }

    if (onCommandPalette) {
      shortcuts.push({
        key: 'Cmd/Ctrl + K',
        description: 'Open command palette',
        action: onCommandPalette,
      });
    }

    if (onSearch) {
      shortcuts.push({
        key: 'Cmd/Ctrl + F',
        description: 'Search notes',
        action: onSearch,
      });
    }

    if (onToggleSidebar) {
      shortcuts.push({
        key: 'Cmd/Ctrl + /',
        description: 'Toggle sidebar',
        action: onToggleSidebar,
      });
    }

    if (onSave) {
      shortcuts.push({
        key: 'Cmd/Ctrl + S',
        description: 'Save note',
        action: onSave,
      });
    }

    if (onDuplicate) {
      shortcuts.push({
        key: 'Cmd/Ctrl + D',
        description: 'Duplicate note',
        action: onDuplicate,
      });
    }

    if (onDelete) {
      shortcuts.push({
        key: 'Cmd/Ctrl + Shift + Backspace',
        description: 'Delete note',
        action: onDelete,
      });
    }

    if (onArchive) {
      shortcuts.push({
        key: 'Cmd/Ctrl + Shift + A',
        description: 'Archive note',
        action: onArchive,
      });
    }

    if (onExport) {
      shortcuts.push({
        key: 'Cmd/Ctrl + E',
        description: 'Export note',
        action: onExport,
      });
    }

    return shortcuts;
  }, [
    onNewNote,
    onNewCollection,
    onCommandPalette,
    onSearch,
    onToggleSidebar,
    onSave,
    onDuplicate,
    onDelete,
    onArchive,
    onExport,
  ]);

  return {
    shortcuts: getActiveShortcuts(),
  };
}
