import clsx from 'clsx';

interface NotebookCoverProps {
  name: string;
  icon?: string | null;
  color?: string | null;
  coverPattern?: 'solid' | 'grid' | 'dots' | 'lines' | 'leather';
  noteCount?: number;
  className?: string;
  onClick?: () => void;
}

export function NotebookCover({
  name,
  icon: _icon = 'BookOpen',
  color = '#3b82f6',
  coverPattern = 'solid',
  noteCount = 0,
  className,
  onClick,
}: NotebookCoverProps) {
  const getPatternClasses = () => {
    switch (coverPattern) {
      case 'grid':
        return 'bg-grid-pattern';
      case 'dots':
        return 'bg-dots-pattern';
      case 'lines':
        return 'bg-lines-pattern';
      case 'leather':
        return 'bg-leather-pattern';
      default:
        return '';
    }
  };

  return (
    <div className={clsx('flex flex-shrink-0 flex-col gap-3 p-2', className)}>
      <button
        type="button"
        onClick={onClick}
        className="group relative flex h-64 w-48 flex-col overflow-hidden rounded-xl shadow-lg transition-all hover:scale-105 hover:shadow-2xl"
        style={{ backgroundColor: color || '#3b82f6' }}
      >
        {/* Pattern Overlay */}
        <div className={clsx('absolute inset-0 opacity-10', getPatternClasses())} />

        {/* Moleskine Elastic Band */}
        <div
          className="absolute right-4 top-0 bottom-0 w-1.5 rounded-full shadow-sm"
          style={{
            backgroundColor: `color-mix(in srgb, ${color || '#3b82f6'} 40%, black)`,
            opacity: 0.7
          }}
        />

        {/* Subtle Gradient Overlay for Depth */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/20" />

        {/* Bottom Edge Shadow */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Right Edge Shadow (for depth) */}
        <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-l from-black/20 to-transparent" />
      </button>

      {/* Title and Note Count Below Cover */}
      <div className="flex flex-col gap-1 px-1">
        <h3 className="line-clamp-2 text-sm font-semibold text-neutral-900 dark:text-white">
          {name}
        </h3>
        {noteCount > 0 && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {noteCount} {noteCount === 1 ? 'note' : 'notes'}
          </p>
        )}
      </div>
    </div>
  );
}
