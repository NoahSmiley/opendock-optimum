import { useState, useMemo } from 'react';
import { Search, FileText } from 'lucide-react';
import type { Collection } from '@opendock/shared/types';
import { NotebookCover } from '../collections/NotebookCover';

interface DashboardProps {
  collections: Collection[];
  onSelectCollection: (collection: Collection) => void;
  onCreateNotebook: () => void;
}

export function Dashboard({ collections, onSelectCollection, onCreateNotebook }: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter notebooks by search
  const filteredNotebooks = useMemo(() => {
    if (!searchQuery.trim()) {
      return collections;
    }
    return collections.filter(notebook =>
      notebook.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notebook.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, collections]);

  return (
    <div className="flex h-screen flex-col bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <div className="px-8 py-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">My Notebooks</h1>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notebooks..."
              className="w-full rounded-xl border border-neutral-200 bg-white py-3.5 pl-12 pr-4 text-base text-neutral-900 placeholder-neutral-400 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
            />
          </div>
          {searchQuery && (
            <div className="mt-3 flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
              <span className="font-medium text-neutral-700 dark:text-neutral-300">{filteredNotebooks.length}</span>
              <span>notebook{filteredNotebooks.length !== 1 ? 's' : ''} found</span>
            </div>
          )}
        </div>
      </div>

      {/* Notebooks Grid */}
      <div className="flex-1 overflow-y-auto px-8 pb-8">
        <div className="mx-auto max-w-6xl">
          {filteredNotebooks.length === 0 ? (
            <div className="flex h-[60vh] flex-col items-center justify-center text-neutral-400 dark:text-neutral-500">
              <FileText className="mb-4 h-16 w-16 opacity-50" />
              <p className="text-lg font-medium">
                {searchQuery ? 'No notebooks found' : 'No notebooks yet'}
              </p>
              <p className="text-sm">
                {searchQuery ? 'Try a different search term' : 'Create your first notebook to get started'}
              </p>
              {!searchQuery && (
                <button
                  onClick={onCreateNotebook}
                  className="mt-4 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                >
                  Create Notebook
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap gap-6">
              {filteredNotebooks.map((notebook) => (
                <NotebookCover
                  key={notebook.id}
                  name={notebook.name}
                  icon={notebook.icon}
                  color={notebook.color}
                  coverPattern={(notebook as any).coverPattern || 'solid'}
                  noteCount={notebook.noteCount}
                  onClick={() => onSelectCollection(notebook)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
