import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, SlidersHorizontal, Calendar, Tag, FolderOpen } from 'lucide-react';
import clsx from 'clsx';
import type { Note, Folder } from '@opendock/shared/types';
import Fuse from 'fuse.js';

interface SearchFilters {
  tags?: string[];
  folderId?: string;
  isPinned?: boolean;
  dateRange?: 'today' | 'week' | 'month' | 'all';
}

interface SearchBarProps {
  notes: Note[];
  folders: Folder[];
  allTags: string[];
  onSearchResults: (results: Note[]) => void;
  onClearSearch: () => void;
  className?: string;
}

export function SearchBar({
  notes,
  folders,
  allTags,
  onSearchResults,
  onClearSearch,
  className,
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);

  // Initialize Fuse.js for fuzzy search
  const fuse = useMemo(
    () =>
      new Fuse(notes, {
        keys: [
          { name: 'title', weight: 2 },
          { name: 'content', weight: 1 },
          { name: 'tags', weight: 1.5 },
        ],
        threshold: 0.3,
        includeScore: true,
        minMatchCharLength: 2,
      }),
    [notes]
  );

  // Close filters on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filtersRef.current &&
        !filtersRef.current.contains(event.target as Node)
      ) {
        setShowFilters(false);
      }
    };

    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showFilters]);

  // Perform search with filters
  useEffect(() => {
    if (!searchQuery && Object.keys(filters).length === 0) {
      onClearSearch();
      return;
    }

    let results: Note[] = notes;

    // Apply fuzzy search if query exists
    if (searchQuery) {
      const fuseResults = fuse.search(searchQuery);
      results = fuseResults.map((result) => result.item);
    }

    // Apply filters
    if (filters.tags && filters.tags.length > 0) {
      results = results.filter((note) =>
        filters.tags!.some((tag) => note.tags && note.tags.includes(tag))
      );
    }

    if (filters.folderId) {
      results = results.filter((note) => note.folderId === filters.folderId);
    }

    if (filters.isPinned !== undefined) {
      results = results.filter((note) => note.isPinned === filters.isPinned);
    }

    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (filters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }

      results = results.filter(
        (note) => new Date(note.updatedAt) >= filterDate
      );
    }

    onSearchResults(results);
  }, [searchQuery, filters, notes, fuse, onSearchResults, onClearSearch]);

  const handleClear = () => {
    setSearchQuery('');
    setFilters({});
    onClearSearch();
    inputRef.current?.focus();
  };

  const toggleTag = (tag: string) => {
    setFilters((prev) => {
      const tags = prev.tags || [];
      const newTags = tags.includes(tag)
        ? tags.filter((t) => t !== tag)
        : [...tags, tag];
      return { ...prev, tags: newTags.length > 0 ? newTags : undefined };
    });
  };

  const hasActiveFilters = Object.keys(filters).length > 0;
  const activeFilterCount =
    (filters.tags?.length || 0) +
    (filters.folderId ? 1 : 0) +
    (filters.isPinned !== undefined ? 1 : 0) +
    (filters.dateRange && filters.dateRange !== 'all' ? 1 : 0);

  return (
    <div className={clsx('relative', className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search notes..."
          className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-10 pr-20 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-0 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-neutral-600"
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {/* Filters Button */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={clsx(
              'rounded-md p-1.5 transition-colors',
              hasActiveFilters
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                : 'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300'
            )}
            title="Toggle filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Clear Button */}
          {(searchQuery || hasActiveFilters) && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div
          ref={filtersRef}
          className="absolute left-0 right-0 top-full z-10 mt-2 rounded-lg border border-neutral-200 bg-white p-4 shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
        >
          <div className="space-y-4">
            {/* Tags Filter */}
            {allTags.length > 0 && (
              <div>
                <label className="mb-2 flex items-center gap-2 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  <Tag className="h-3.5 w-3.5" />
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => {
                    const isSelected = filters.tags?.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={clsx(
                          'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                          isSelected
                            ? 'bg-blue-500 text-white'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
                        )}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Folder Filter */}
            {folders.length > 0 && (
              <div>
                <label className="mb-2 flex items-center gap-2 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  <FolderOpen className="h-3.5 w-3.5" />
                  Folder
                </label>
                <select
                  value={filters.folderId || ''}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      folderId: e.target.value || undefined,
                    }))
                  }
                  className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                >
                  <option value="">All folders</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date Range Filter */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                <Calendar className="h-3.5 w-3.5" />
                Updated
              </label>
              <div className="flex gap-2">
                {(['all', 'today', 'week', 'month'] as const).map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        dateRange: range,
                      }))
                    }
                    className={clsx(
                      'flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors',
                      filters.dateRange === range || (!filters.dateRange && range === 'all')
                        ? 'bg-blue-500 text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
                    )}
                  >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Pinned Filter */}
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.isPinned === true}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      isPinned: e.target.checked ? true : undefined,
                    }))
                  }
                  className="h-4 w-4 rounded border-neutral-300 text-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-neutral-600"
                />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  Pinned only
                </span>
              </label>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => setFilters({})}
                className="w-full rounded-md bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
