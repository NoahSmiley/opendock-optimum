import { Plus, Pin, Settings2, ChevronRight, LayoutDashboard } from 'lucide-react';
import clsx from 'clsx';
import type { Note, Collection } from '@opendock/shared/types';
import { Breadcrumbs } from './Breadcrumbs';
import { NoteContextMenu } from './NoteContextMenu';
import { CollectionContextMenu } from '../collections/CollectionContextMenu';
import { TagsCloud } from '../tags';
import { SimpleSearchBar } from '../search';

interface NotesSidebarProps {
  notes: Note[];
  selectedNote: Note | null;
  onSelectNote: (note: Note) => void;
  onCreateNote: () => void;
  onDeleteNote?: (noteId: string) => void;
  collections?: Collection[];
  currentCollection?: Collection | null;
  onSelectCollection?: (collection: Collection) => void;
  onCreateCollection?: () => void;
  onEditCollection?: (collection: Collection) => void;
  onDeleteCollection?: (collectionId: string) => void;
  onClearCollectionFilter?: () => void;
  allTags?: string[];
  tagCounts?: Map<string, number>;
  selectedTag?: string | null;
  onSelectTag?: (tag: string) => void;
  onClearTagFilter?: () => void;
  onSearchResults?: (results: Note[]) => void;
  onClearSearch?: () => void;
  isSearching?: boolean;
  isDashboardView?: boolean;
  onDashboardClick?: () => void;
}

export function NotesSidebar({
  notes,
  selectedNote,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  collections = [],
  currentCollection = null,
  onSelectCollection,
  onCreateCollection,
  onEditCollection,
  onDeleteCollection,
  onClearCollectionFilter,
  allTags = [],
  tagCounts = new Map(),
  selectedTag = null,
  onSelectTag,
  onClearTagFilter,
  onSearchResults,
  onClearSearch,
  isDashboardView = false,
  onDashboardClick,
}: NotesSidebarProps) {
  // Sort notes: pinned first, then by updated date
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <>
      {/* Project Section */}
      <div className="flex w-full flex-col gap-1.5">
        <div className="text-xs font-semibold tracking-wide text-neutral-400/90 dark:text-neutral-400/70">
          Projects
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-neutral-900 dark:text-white">
            Beyond Gravity
          </span>
          <button
            type="button"
            className="rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
          >
            <Settings2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {onSearchResults && onClearSearch && (
        <div className="mt-6">
          <SimpleSearchBar
            notes={notes}
            onSearchResults={onSearchResults}
            onClearSearch={onClearSearch}
          />
        </div>
      )}

      {/* Dashboard Item */}
      <div className="mt-6 flex w-full flex-col gap-1">
        <button
          type="button"
          onClick={onDashboardClick}
          className={clsx(
            'group relative flex h-8 items-center gap-2 rounded-md px-2 py-1 text-left text-[0.8rem] font-medium transition-colors',
            isDashboardView
              ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white'
              : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white'
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Notebooks</span>
        </button>
      </div>

      {/* Breadcrumbs */}
      <div className="mt-4">
        <Breadcrumbs
          currentCollection={currentCollection}
          onNavigateToRoot={onClearCollectionFilter || (() => {})}
        />
      </div>

      {/* Main Content Area */}
      <div className="mt-4 flex min-h-0 flex-1 flex-col gap-7">
        {!currentCollection ? (
          /* Show Collections List */
          <>
            <div className="flex w-full flex-col gap-1">
              <div className="flex h-8 items-center justify-between text-xs font-semibold text-neutral-400/90 dark:text-neutral-400/70">
                <span>Notebooks ({collections.length})</span>
                {onCreateCollection && (
                  <button
                    type="button"
                    onClick={onCreateCollection}
                    className="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                    title="Create Notebook"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="flex w-full flex-col gap-0.5">
                {collections.length > 0 ? (
                  collections.map((collection) => (
                    <CollectionContextMenu
                      key={collection.id}
                      collection={collection}
                      onDelete={onDeleteCollection || (() => {})}
                      onEdit={onEditCollection}
                    >
                      <button
                        type="button"
                        onClick={() => onSelectCollection?.(collection)}
                        className="group relative flex h-8 items-center justify-between gap-2 rounded-md px-2 py-1 text-left text-[0.8rem] font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
                      >
                        <span className="flex min-w-0 flex-1 items-center gap-2">
                          <span className="truncate">{collection.name}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          {collection.noteCount !== undefined && collection.noteCount > 0 && (
                            <span className="text-[0.7rem] text-neutral-400 dark:text-neutral-500">
                              {collection.noteCount}
                            </span>
                          )}
                          <ChevronRight className="h-3.5 w-3.5 text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100 dark:text-neutral-500" />
                        </div>
                      </button>
                    </CollectionContextMenu>
                  ))
                ) : (
                  <div className="px-2 py-1 text-xs text-neutral-400 dark:text-neutral-500">
                    No notebooks yet
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            {allTags.length > 0 && onSelectTag && onClearTagFilter && (
              <div className="flex w-full flex-col gap-1">
                <div className="flex h-8 items-center justify-between text-xs font-semibold text-neutral-400/90 dark:text-neutral-400/70">
                  <span>Tags ({allTags.length})</span>
                </div>
                <TagsCloud
                  tags={allTags}
                  tagCounts={tagCounts}
                  selectedTag={selectedTag}
                  onSelectTag={onSelectTag}
                  onClearTag={onClearTagFilter}
                />
              </div>
            )}
          </>
        ) : (
          /* Show Pages in Notebook */
          <div className="flex w-full flex-col gap-1">
            <div className="flex h-8 items-center justify-between text-xs font-semibold text-neutral-400/90 dark:text-neutral-400/70">
              <span>Pages ({notes.length})</span>
              <button
                type="button"
                onClick={onCreateNote}
                className="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                title="Create Page"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex w-full flex-col gap-0.5">
              {sortedNotes.length > 0 ? (
                sortedNotes.map((note) => {
                  const isSelected = selectedNote?.id === note.id;
                  return (
                    <NoteContextMenu
                      key={note.id}
                      note={note}
                      onDelete={onDeleteNote || (() => {})}
                    >
                      <div className="group flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => onSelectNote(note)}
                          className={clsx(
                            'group relative flex h-8 max-w-[80%] flex-1 items-center justify-start overflow-visible rounded-md border border-transparent px-0 text-left text-[0.8rem] font-medium text-neutral-600 transition-colors outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-200 dark:text-neutral-300 dark:focus-visible:ring-neutral-700',
                            isSelected
                              ? 'text-neutral-900 dark:text-neutral-100'
                              : 'hover:text-neutral-900 dark:hover:text-white'
                          )}
                        >
                          <span className="relative -ml-2 inline-flex min-w-0 max-w-full items-center overflow-hidden px-2 py-1">
                            <span
                              className={clsx(
                                'pointer-events-none absolute inset-0 rounded-full transition-colors',
                                isSelected
                                  ? 'bg-neutral-100 dark:bg-neutral-800'
                                  : 'bg-transparent group-hover:bg-neutral-100 dark:group-hover:bg-neutral-800/70'
                              )}
                            />
                            <span className="relative z-10 truncate">{note.title}</span>
                          </span>
                        </button>
                        {note.isPinned && (
                          <Pin className="h-3 w-3 text-neutral-400 dark:text-neutral-500" />
                        )}
                      </div>
                    </NoteContextMenu>
                  );
                })
              ) : (
                <div className="px-2 py-1 text-xs text-neutral-400 dark:text-neutral-500">
                  No pages in this notebook
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
