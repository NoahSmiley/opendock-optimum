import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Clock } from 'lucide-react';
import type { Note, Collection } from '@opendock/shared/types';
import clsx from 'clsx';
import { RichTextEditor } from '../editor/RichTextEditor';
import { notesApi } from '../../lib/api';

// Memoized Page Tools component to prevent re-renders
const PageToolsSection = memo(({
  handleDeletePage,
  disableDelete,
  notebook,
  currentPageIndex,
  totalPages,
  characterCount
}: {
  handleDeletePage: () => void;
  disableDelete: boolean;
  notebook: Collection;
  currentPageIndex: number;
  totalPages: number;
  characterCount: number;
}) => (
  <div>
    <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">Page Tools</h3>

    {/* Quick Actions */}
    <div className="space-y-2">
      <button
        onClick={handleDeletePage}
        disabled={disableDelete}
        className="flex w-full items-center gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-750"
      >
        <Trash2 className="h-4 w-4 text-red-500" />
        <span>Delete Page</span>
      </button>
    </div>

    {/* Page Info */}
    <div className="rounded-lg border border-neutral-200 bg-white p-4 mt-6 dark:border-neutral-700 dark:bg-neutral-800">
      <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-3">Page Information</h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-neutral-600 dark:text-neutral-400">Notebook:</span>
          <span className="font-medium text-neutral-900 dark:text-white">{notebook.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-600 dark:text-neutral-400">Page:</span>
          <span className="font-medium text-neutral-900 dark:text-white">{currentPageIndex + 1} of {totalPages}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-600 dark:text-neutral-400">Characters:</span>
          <span className="font-medium text-neutral-900 dark:text-white">{characterCount}</span>
        </div>
      </div>
    </div>
  </div>
));

interface NotebookViewerProps {
  notebook: Collection;
  pages: Note[];
  onUpdatePage: (pageId: string, updates: Partial<Note>) => Promise<void>;
  onCreatePage: () => Promise<void>;
  onDeletePage: (pageId: string) => Promise<void>;
  onClose: () => void;
  onEditNotebook?: (notebook: Collection) => void;
}

export function NotebookViewer({
  notebook,
  pages,
  onUpdatePage,
  onCreatePage,
  onDeletePage,
  onClose,
}: NotebookViewerProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [, setIsSaving] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next');
  const [characterCount, setCharacterCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [paragraphCount, setParagraphCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [headings, setHeadings] = useState<Array<{ text: string; level: number; id: string }>>([]);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const pageRef = useRef<HTMLDivElement>(null);
  const isEditingRef = useRef(false);
  const lastPageIdRef = useRef<string | null>(null);

  const currentPage = pages[currentPageIndex];

  // Load recent notes on component mount
  useEffect(() => {
    const loadRecentNotes = async () => {
      try {
        const response = await notesApi.listNotes({ isArchived: false });
        // Sort by updatedAt and take the 5 most recent
        const sorted = [...response.notes].sort((a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        setRecentNotes(sorted.slice(0, 5));
      } catch (error) {
        console.error('Failed to load recent notes:', error);
      }
    };

    loadRecentNotes();
  }, []);

  // Load current page data - only when switching pages, not on updates
  useEffect(() => {
    if (currentPage && currentPage.id !== lastPageIdRef.current) {
      // Page changed - load new content
      setTitle(currentPage.title || '');
      setContent(currentPage.content || '');
      lastPageIdRef.current = currentPage.id;
      isEditingRef.current = false;
    }
  }, [currentPage?.id, currentPage]);

  // Auto-save on change - debounced
  useEffect(() => {
    if (!currentPage) return;

    const timeoutId = setTimeout(async () => {
      if (title !== currentPage.title || content !== currentPage.content) {
        setIsSaving(true);
        try {
          await onUpdatePage(currentPage.id, { title, content });
          // Mark as no longer editing after save
          isEditingRef.current = false;
        } catch (error) {
          console.error('Failed to save page:', error);
        } finally {
          // Delay hiding the saving indicator to prevent flashing
          setTimeout(() => setIsSaving(false), 300);
        }
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [title, content, currentPage?.id, currentPage?.title, currentPage?.content, onUpdatePage]);

  const navigateToPage = (targetIndex: number) => {
    if (isFlipping) return;

    const direction = targetIndex > currentPageIndex ? 'next' : 'prev';
    setFlipDirection(direction);
    setIsFlipping(true);

    setTimeout(() => {
      setCurrentPageIndex(targetIndex);
      setIsFlipping(false);
    }, 600);
  };

  const handlePreviousPage = () => {
    if (currentPageIndex > 0) {
      navigateToPage(currentPageIndex - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPageIndex < pages.length - 1) {
      navigateToPage(currentPageIndex + 1);
    }
  };

  const handleNavigateToPage = (index: number) => {
    if (index !== currentPageIndex) {
      navigateToPage(index);
    }
  };

  const handleNewPage = async () => {
    if (!isFlipping) {
      await onCreatePage();
      navigateToPage(pages.length);
    }
  };

  // Content handler for the rich text editor - memoized to prevent re-renders
  const handleContentChange = useCallback((newContent: string) => {
    isEditingRef.current = true;
    setContent(newContent);
  }, []);

  // Update stats with debounce to reduce re-renders
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCharacterCount(content.length);

      // Calculate word count
      const words = content.trim().split(/\s+/).filter(word => word.length > 0);
      setWordCount(words.length);

      // Calculate paragraph count
      const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);
      setParagraphCount(paragraphs.length);

      // Calculate reading time (average 200 words per minute)
      const minutes = Math.ceil(words.length / 200);
      setReadingTime(minutes);

      // Extract headings from Lexical content
      try {
        if (content) {
          const editorState = JSON.parse(content);
          const extractedHeadings: Array<{ text: string; level: number; id: string }> = [];

          const traverseNodes = (node: any) => {
            if (node.type === 'heading') {
              const level = parseInt(node.tag.replace('h', ''));
              const text = node.children?.map((child: any) => child.text || '').join('') || '';
              if (text) {
                extractedHeadings.push({
                  text,
                  level,
                  id: `heading-${extractedHeadings.length}`,
                });
              }
            }

            if (node.children) {
              node.children.forEach((child: any) => traverseNodes(child));
            }
          };

          if (editorState.root && editorState.root.children) {
            editorState.root.children.forEach((child: any) => traverseNodes(child));
          }

          setHeadings(extractedHeadings);
        } else {
          setHeadings([]);
        }
      } catch (error) {
        // If content is not valid JSON, skip heading extraction
        setHeadings([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [content]);

  const handleDeletePage = async () => {
    if (!currentPage) return;

    if (pages.length === 1) {
      alert('Cannot delete the last page in a notebook');
      return;
    }

    if (window.confirm('Delete this page?')) {
      await onDeletePage(currentPage.id);
      if (currentPageIndex >= pages.length - 1) {
        setCurrentPageIndex(Math.max(0, currentPageIndex - 1));
      }
    }
  };

  return (
    <div className="flex h-full flex-col bg-neutral-100 dark:bg-neutral-900">
      {/* Page Curl CSS */}
      <style>{`
        .page-container {
          perspective: 2500px;
          perspective-origin: 50% 50%;
        }

        .page-curl-next {
          animation: curlNext 0.6s cubic-bezier(0.645, 0.045, 0.355, 1.000) forwards;
          transform-origin: right center;
        }

        .page-curl-prev {
          animation: curlPrev 0.6s cubic-bezier(0.645, 0.045, 0.355, 1.000) forwards;
          transform-origin: left center;
        }

        @keyframes curlNext {
          0% {
            transform: translate3d(0, 0, 0) rotateY(0deg);
            filter: brightness(1);
          }
          25% {
            transform: translate3d(-5%, 0, 50px) rotateY(-15deg);
            filter: brightness(0.95);
          }
          50% {
            transform: translate3d(-10%, 0, 100px) rotateY(-90deg);
            filter: brightness(0.7);
          }
          75% {
            transform: translate3d(-5%, 0, 50px) rotateY(-165deg);
            filter: brightness(0.95);
          }
          100% {
            transform: translate3d(0, 0, 0) rotateY(-180deg);
            filter: brightness(1);
          }
        }

        @keyframes curlPrev {
          0% {
            transform: translate3d(0, 0, 0) rotateY(-180deg);
            filter: brightness(1);
          }
          25% {
            transform: translate3d(5%, 0, 50px) rotateY(-165deg);
            filter: brightness(0.95);
          }
          50% {
            transform: translate3d(10%, 0, 100px) rotateY(-90deg);
            filter: brightness(0.7);
          }
          75% {
            transform: translate3d(5%, 0, 50px) rotateY(-15deg);
            filter: brightness(0.95);
          }
          100% {
            transform: translate3d(0, 0, 0) rotateY(0deg);
            filter: brightness(1);
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between bg-white px-4 py-2 dark:bg-neutral-950">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-white"
          >
            <ChevronLeft className="h-3 w-3" />
            Back
          </button>
          <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-700" />
          <div className="flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-600">
            <span>{notebook.name}</span>
            <span>·</span>
            <span>Page {currentPageIndex + 1} of {pages.length}</span>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-1 overflow-hidden bg-white dark:bg-neutral-950 relative">
        {/* Floating Add Page Button */}
        <button
          onClick={handleNewPage}
          disabled={isFlipping}
          className="absolute right-80 top-1/2 -translate-y-1/2 translate-x-1/2 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900 text-white shadow-lg transition-all hover:bg-neutral-800 hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
          title="Add new page"
        >
          <Plus className="h-5 w-5" />
        </button>

        {/* Left Side - Notebook */}
        <div className="flex flex-1 items-center justify-center overflow-hidden px-8 py-1 relative">
          <div className="page-container relative flex h-full w-full max-w-3xl" style={{ aspectRatio: '8.5 / 11' }}>
            {/* Background Pages Stack */}
            <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-sm bg-neutral-300/20 dark:bg-neutral-950/20" />
            <div className="absolute inset-0 translate-x-1 translate-y-1 rounded-sm bg-neutral-300/30 dark:bg-neutral-950/30" />

            {/* Main Page */}
            <div
              ref={pageRef}
              className={clsx(
                'relative flex h-full w-full flex-col overflow-hidden rounded-sm border border-neutral-300 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-800',
                isFlipping && flipDirection === 'next' && 'page-curl-next',
                isFlipping && flipDirection === 'prev' && 'page-curl-prev'
              )}
              style={{
                transformStyle: 'preserve-3d',
              }}
            >
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-hidden pt-8">
                  {!isFlipping && currentPage && (
                    <RichTextEditor
                      key={currentPage.id}
                      initialContent={content}
                      onChange={handleContentChange}
                      placeholder="Start writing..."
                      showToolbar={false}
                      externalToolbar={true}
                    />
                  )}
                </div>
              </div>

              <div className="bg-neutral-50/50 px-8 py-2 text-center dark:bg-neutral-800/50">
                <span className="text-xs text-neutral-400 dark:text-neutral-500">
                  Page {currentPageIndex + 1}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Enhanced Tools Panel */}
        <div className="w-80 border-l border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Formatting Toolbar */}
            {!isFlipping && currentPage && (
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">Formatting</h3>
                <div className="flex justify-center">
                  <div id="external-toolbar-mount"></div>
                </div>
              </div>
            )}

            {/* Outline / Table of Contents */}
            {headings.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">Outline</h3>
                <div className="space-y-1">
                  {headings.map((heading, index) => (
                    <button
                      key={heading.id}
                      onClick={() => {
                        // Scroll to heading in the editor
                        const editorElement = pageRef.current?.querySelector('[contenteditable="true"]');
                        if (editorElement) {
                          // Find all heading elements
                          const headingElements = editorElement.querySelectorAll('h1, h2, h3');
                          if (headingElements[index]) {
                            headingElements[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }
                        }
                      }}
                      className={clsx(
                        'w-full text-left px-3 py-1.5 text-sm rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors',
                        heading.level === 1 && 'font-semibold text-neutral-900 dark:text-white',
                        heading.level === 2 && 'pl-6 font-medium text-neutral-700 dark:text-neutral-300',
                        heading.level === 3 && 'pl-9 text-neutral-600 dark:text-neutral-400'
                      )}
                    >
                      {heading.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Document Stats */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">Document Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600 dark:text-neutral-400">Words:</span>
                  <span className="font-medium text-neutral-900 dark:text-white">{wordCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600 dark:text-neutral-400">Characters:</span>
                  <span className="font-medium text-neutral-900 dark:text-white">{characterCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600 dark:text-neutral-400">Paragraphs:</span>
                  <span className="font-medium text-neutral-900 dark:text-white">{paragraphCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600 dark:text-neutral-400">Reading Time:</span>
                  <span className="font-medium text-neutral-900 dark:text-white">{readingTime} min</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    const template = `# Meeting Notes\n\n**Date:** ${new Date().toLocaleDateString()}\n\n## Attendees\n- \n\n## Agenda\n1. \n\n## Notes\n\n\n## Action Items\n- [ ] `;
                    setContent(content + '\n\n' + template);
                  }}
                  className="w-full text-left px-3 py-2 text-sm rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-750 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled
                  title="Quick actions coming soon"
                >
                  Insert Meeting Template
                </button>
                <button
                  onClick={() => {
                    const template = `## To-Do List\n- [ ] \n- [ ] \n- [ ] `;
                    setContent(content + '\n\n' + template);
                  }}
                  disabled
                  title="Quick actions coming soon"
                  className="w-full text-left px-3 py-2 text-sm rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-750 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Insert To-Do List
                </button>
                <button
                  onClick={() => {
                    const template = `| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n|          |          |          |`;
                    setContent(content + '\n\n' + template);
                  }}
                  disabled
                  title="Quick actions coming soon"
                  className="w-full text-left px-3 py-2 text-sm rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-750 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Insert Table
                </button>
              </div>
            </div>

            {/* Page Tools - Memoized to prevent re-renders */}
            <PageToolsSection
              handleDeletePage={handleDeletePage}
              disableDelete={pages.length === 1}
              notebook={notebook}
              currentPageIndex={currentPageIndex}
              totalPages={pages.length}
              characterCount={characterCount}
            />

            {/* Recent Notes */}
            {recentNotes.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">Recent Notes</h3>
                <div className="space-y-2">
                  {recentNotes.map((note) => (
                    <a
                      key={note.id}
                      href={`/notes/${note.id}`}
                      className="block px-3 py-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-750 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                            {note.title || 'Untitled'}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                            <Clock className="h-3 w-3" />
                            <span>
                              {new Date(note.updatedAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between bg-white px-4 py-2 dark:bg-neutral-950">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreviousPage}
            disabled={currentPageIndex === 0 || isFlipping}
            className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-neutral-900 dark:hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleNextPage}
            disabled={currentPageIndex >= pages.length - 1 || isFlipping}
            className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-neutral-900 dark:hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {pages.map((page, index) => (
            <button
              key={page.id}
              onClick={() => handleNavigateToPage(index)}
              disabled={isFlipping}
              className={clsx(
                'h-1.5 rounded-full transition-all',
                index === currentPageIndex
                  ? 'w-6 bg-neutral-400 dark:bg-neutral-500'
                  : 'w-1.5 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700',
                isFlipping && 'cursor-not-allowed'
              )}
            />
          ))}
        </div>

        <button
          onClick={handleNewPage}
          disabled={isFlipping}
          className="flex items-center gap-2 rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
        >
          <Plus className="h-3.5 w-3.5" />
          New Page
        </button>
      </div>
    </div>
  );
}
