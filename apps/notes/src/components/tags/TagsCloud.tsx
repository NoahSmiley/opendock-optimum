import { Tag, X } from 'lucide-react';
import clsx from 'clsx';

interface TagsCloudProps {
  tags: string[];
  tagCounts: Map<string, number>;
  selectedTag: string | null;
  onSelectTag: (tag: string) => void;
  onClearTag: () => void;
  className?: string;
}

export function TagsCloud({
  tags,
  tagCounts,
  selectedTag,
  onSelectTag,
  onClearTag,
  className,
}: TagsCloudProps) {
  const getTagColor = (tag: string) => {
    // Simple hash function to generate consistent colors
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
      hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50',
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50',
      'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50',
      'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300 hover:bg-pink-200 dark:hover:bg-pink-900/50',
      'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/50',
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50',
    ];
    return colors[Math.abs(hash) % colors.length];
  };

  const sortedTags = [...tags].sort((a, b) => {
    const countA = tagCounts.get(a) || 0;
    const countB = tagCounts.get(b) || 0;
    // Sort by count descending, then alphabetically
    if (countB !== countA) return countB - countA;
    return a.localeCompare(b);
  });

  if (tags.length === 0) {
    return (
      <div className={clsx('text-xs text-neutral-400 dark:text-neutral-500', className)}>
        No tags yet
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Active Filter */}
      {selectedTag && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Filtered by:
          </span>
          <button
            onClick={onClearTag}
            className={clsx(
              'flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-colors',
              getTagColor(selectedTag)
            )}
          >
            {selectedTag}
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Tags Cloud */}
      <div className="flex flex-wrap gap-2">
        {sortedTags.map(tag => {
          const count = tagCounts.get(tag) || 0;
          const isSelected = selectedTag === tag;

          return (
            <button
              key={tag}
              onClick={() => onSelectTag(tag)}
              className={clsx(
                'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all',
                isSelected
                  ? 'ring-2 ring-neutral-400 dark:ring-neutral-500'
                  : '',
                getTagColor(tag)
              )}
              title={`${count} note${count !== 1 ? 's' : ''}`}
            >
              <Tag className="h-3 w-3" />
              <span>{tag}</span>
              <span className="opacity-60">({count})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
