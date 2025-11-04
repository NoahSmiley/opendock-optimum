import { useState, useMemo } from 'react';
import { Search, FileText, Calendar, FolderOpen, Tag } from 'lucide-react';
import type { Note, Collection } from '@opendock/shared/types';
import Fuse from 'fuse.js';
import clsx from 'clsx';

interface DashboardProps {
  notes: Note[];
  collections: Collection[];
  onSelectNote: (note: Note) => void;
}

export function Dashboard({ notes, collections, onSelectNote }: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Configure Fuse.js for smart fuzzy search
  const fuse = useMemo(() => {
    return new Fuse(notes, {
      keys: [
        { name: 'title', weight: 2 },
        { name: 'content', weight: 1 },
        { name: 'tags', weight: 1.5 },
      ],
      threshold: 0.4, // More tolerant of typos
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2,
    });
  }, [notes]);

  // Perform smart search
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      // Show recent notes when no search
      return notes
        .slice()
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 20);
    }

    return fuse.search(searchQuery).map(result => result.item);
  }, [searchQuery, fuse, notes]);

  const getCollectionForNote = (note: Note) => {
    // For now, check if note is in any collection (using the noteId)
    // This assumes the backend returns collection info with notes
    return collections.find(c =>
      (c as any).noteCount && notes.some(n => n.id === note.id)
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return date.toLocaleDateString();
  };

  const getTags = (note: Note): string[] => {
    try {
      return JSON.parse(note.tags);
    } catch {
      return [];
    }
  };

  return (
    <div className="flex h-screen flex-col bg-neutral-50 dark:bg-neutral-950">
      {/* Header with Smart Search */}
      <div className="px-8 py-8">
        <div className="mx-auto max-w-5xl">
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">Dashboard</h1>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes by title, content, or tags..."
              className="w-full rounded-xl border border-neutral-200 bg-white py-3.5 pl-12 pr-4 text-base text-neutral-900 placeholder-neutral-400 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
              autoFocus
            />
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
            {searchQuery ? (
              <>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">{searchResults.length}</span>
                <span>result{searchResults.length !== 1 ? 's' : ''} found</span>
              </>
            ) : (
              <>
                <span>Showing recent notes</span>
                <span className="text-neutral-400 dark:text-neutral-600">•</span>
                <span className="text-neutral-400 dark:text-neutral-500">Try fuzzy search</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="mx-auto max-w-5xl">
          {searchResults.length === 0 ? (
            <div className="flex h-[60vh] flex-col items-center justify-center text-neutral-400 dark:text-neutral-500">
              <FileText className="mb-4 h-16 w-16 opacity-50" />
              <p className="text-lg font-medium">No notes found</p>
              <p className="text-sm">Try a different search term</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((note) => {
                const collection = getCollectionForNote(note);
                const tags = getTags(note);
                const preview = note.content.slice(0, 150);

                return (
                  <button
                    key={note.id}
                    onClick={() => onSelectNote(note)}
                    className={clsx(
                      'group relative flex h-64 flex-col rounded-xl border p-5 text-left transition-all hover:shadow-lg hover:-translate-y-0.5',
                      note.isPinned
                        ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-blue-50/50 dark:border-blue-900/50 dark:from-blue-950/30 dark:to-blue-950/10'
                        : 'border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700'
                    )}
                  >
                    {/* Pinned indicator */}
                    {note.isPinned && (
                      <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-blue-500 px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm">
                        <Pin className="h-2.5 w-2.5 fill-current" />
                        Pinned
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="mb-2 line-clamp-2 text-lg font-semibold leading-tight text-neutral-900 dark:text-white">
                      {note.title || 'Untitled'}
                    </h3>

                    {/* Preview */}
                    {preview && (
                      <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                        {preview}
                        {note.content.length > 150 && '...'}
                      </p>
                    )}

                    {/* Metadata */}
                    <div className="mt-auto space-y-2">
                      <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{formatDate(note.updatedAt)}</span>
                        </div>

                        {collection && (
                          <div className="flex items-center gap-1.5">
                            <FolderOpen
                              className="h-3.5 w-3.5"
                              style={{ color: collection.color || undefined }}
                            />
                            <span>{collection.name}</span>
                          </div>
                        )}
                      </div>

                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {tags.slice(0, 3).map((tag, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                            >
                              <Tag className="h-2.5 w-2.5" />
                              {tag}
                            </span>
                          ))}
                          {tags.length > 3 && (
                            <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                              +{tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
