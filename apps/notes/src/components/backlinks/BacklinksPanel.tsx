import { Link2, FileText, Calendar } from 'lucide-react';
import type { Backlink } from '../../lib/backlinks';

interface BacklinksPanelProps {
  backlinks: Backlink[];
  onNavigate: (noteId: string) => void;
}

export function BacklinksPanel({ backlinks, onNavigate }: BacklinksPanelProps) {
  if (backlinks.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-800 dark:bg-neutral-900/50">
        <div className="flex flex-col items-center text-center">
          <Link2 className="mb-3 h-8 w-8 text-neutral-300 dark:text-neutral-700" />
          <h3 className="mb-1 font-semibold text-neutral-700 dark:text-neutral-300">No Backlinks</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            No other notes link to this one yet. Create links using [[note title]] syntax.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Link2 className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          Backlinks ({backlinks.length})
        </h3>
      </div>

      <div className="space-y-2">
        {backlinks.map((backlink, index) => (
          <button
            key={`${backlink.sourceNoteId}-${index}`}
            onClick={() => onNavigate(backlink.sourceNoteId)}
            className="group w-full rounded-lg border border-neutral-200 bg-white p-3 text-left transition-all hover:border-indigo-300 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900/50 dark:hover:border-indigo-700"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-neutral-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                <h4 className="font-medium text-neutral-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                  {backlink.sourceNoteTitle}
                </h4>
              </div>
              <div className="flex items-center gap-1 text-xs text-neutral-400">
                <Calendar className="h-3 w-3" />
                <span>{new Date(backlink.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {backlink.context && (
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {backlink.context}
              </p>
            )}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3 dark:border-indigo-900/50 dark:bg-indigo-900/20">
        <p className="text-xs text-indigo-700 dark:text-indigo-300">
          <strong>Tip:</strong> Click a backlink to navigate to the note that references this one.
        </p>
      </div>
    </div>
  );
}
