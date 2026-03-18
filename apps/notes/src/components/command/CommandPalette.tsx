import { Search, FileText, FolderPlus, BookOpen } from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';
import type { Note, Collection } from '@opendock/shared/types';

export interface CommandAction {
  id: string;
  label: string;
  description?: string;
  icon: typeof FileText;
  category: 'note' | 'collection' | 'navigation' | 'action';
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  collections: Collection[];
  onCreateNote: () => void;
  onCreateCollection: () => void;
  onNavigateToNote: (noteId: string) => void;
  onNavigateToCollection: (collectionId: string) => void;
  currentActions?: CommandAction[];
}

export function CommandPalette({
  isOpen,
  onClose,
  notes,
  collections,
  onCreateNote,
  onCreateCollection,
  onNavigateToNote,
  onNavigateToCollection,
  currentActions = [],
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Build all available commands
  const allCommands = useMemo(() => {
    const commands: (CommandAction & { type: 'action' | 'note' | 'collection' })[] = [];

    // Global actions
    commands.push({
      id: 'new-note',
      label: 'Create new note',
      icon: FileText,
      category: 'note',
      action: () => {
        onCreateNote();
        onClose();
      },
      keywords: ['create', 'new', 'note'],
      type: 'action',
    });

    commands.push({
      id: 'new-collection',
      label: 'Create new collection',
      icon: FolderPlus,
      category: 'collection',
      action: () => {
        onCreateCollection();
        onClose();
      },
      keywords: ['create', 'new', 'collection', 'notebook'],
      type: 'action',
    });

    // Current context actions
    currentActions.forEach(action => {
      commands.push({ ...action, type: 'action' });
    });

    // Recent notes (limited to 10)
    notes.slice(0, 10).forEach(note => {
      commands.push({
        id: `note-${note.id}`,
        label: note.title || 'Untitled',
        description: note.tags?.join(', '),
        icon: FileText,
        category: 'navigation',
        action: () => {
          onNavigateToNote(note.id);
          onClose();
        },
        keywords: [note.title, ...(note.tags || [])].filter(Boolean),
        type: 'note',
      });
    });

    // All collections
    collections.forEach(collection => {
      commands.push({
        id: `collection-${collection.id}`,
        label: collection.name,
        description: `${collection.noteCount || 0} notes`,
        icon: BookOpen,
        category: 'navigation',
        action: () => {
          onNavigateToCollection(collection.id);
          onClose();
        },
        keywords: [collection.name, collection.description].filter((k): k is string => Boolean(k)),
        type: 'collection',
      });
    });

    return commands;
  }, [notes, collections, onCreateNote, onCreateCollection, onNavigateToNote, onNavigateToCollection, currentActions, onClose]);

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      return allCommands.slice(0, 8); // Show recent items
    }

    const lowerQuery = query.toLowerCase();
    return allCommands.filter(cmd => {
      const searchText = [
        cmd.label,
        cmd.description,
        ...(cmd.keywords || [])
      ].join(' ').toLowerCase();

      return searchText.includes(lowerQuery);
    }).slice(0, 8);
  }, [query, allCommands]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Reset selected index when filtered commands change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands]);

  if (!isOpen) return null;

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'note': return 'Notes';
      case 'collection': return 'Collections';
      case 'navigation': return 'Navigate';
      case 'action': return 'Actions';
      default: return 'Other';
    }
  };

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, cmd, index) => {
    const category = getCategoryLabel(cmd.category);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push({ ...cmd, originalIndex: index });
    return acc;
  }, {} as Record<string, (CommandAction & { originalIndex: number })[]>);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[20vh] backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-2xl overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 border-b border-neutral-200 p-4 dark:border-neutral-800">
          <Search className="h-5 w-5 text-neutral-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for notes, collections, or actions..."
            className="flex-1 bg-transparent text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-white"
          />
          <kbd className="rounded bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
            Esc
          </kbd>
        </div>

        {/* Commands List */}
        <div className="max-h-[400px] overflow-y-auto p-2">
          {Object.keys(groupedCommands).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="mb-3 h-8 w-8 text-neutral-300 dark:text-neutral-700" />
              <p className="text-sm text-neutral-500 dark:text-neutral-400">No results found</p>
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, commands]) => (
              <div key={category} className="mb-4">
                <div className="mb-2 px-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  {category}
                </div>
                <div className="space-y-1">
                  {commands.map(({ originalIndex, ...cmd }) => {
                    const Icon = cmd.icon;
                    const isSelected = originalIndex === selectedIndex;

                    return (
                      <button
                        key={cmd.id}
                        onClick={() => cmd.action()}
                        onMouseEnter={() => setSelectedIndex(originalIndex)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                          isSelected
                            ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-100'
                            : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-neutral-400'}`} />
                        <div className="flex-1">
                          <div className="font-medium">{cmd.label}</div>
                          {cmd.description && (
                            <div className={`text-xs ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-neutral-500'}`}>
                              {cmd.description}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-2 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono dark:bg-neutral-800">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono dark:bg-neutral-800">↵</kbd>
              Select
            </span>
          </div>
          <span>{filteredCommands.length} results</span>
        </div>
      </div>
    </div>
  );
}
