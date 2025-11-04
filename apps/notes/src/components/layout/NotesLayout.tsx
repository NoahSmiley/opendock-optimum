import { ReactNode } from 'react';
import { ThemeToggle } from '../common/ThemeToggle';

interface NotesLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export function NotesLayout({ sidebar, children }: NotesLayoutProps) {
  return (
    <div className="flex h-screen bg-white dark:bg-neutral-950">
      {/* Header */}
      <header className="fixed left-0 right-0 top-0 z-50 hidden items-center justify-between bg-white/95 px-10 py-10 text-sm text-neutral-500 shadow-sm backdrop-blur dark:bg-neutral-950/80 dark:text-neutral-300 lg:flex xl:px-12">
        <div className="flex items-center gap-10 -ml-1.5">
          <div className="flex items-center gap-2 font-semibold text-neutral-700 dark:text-neutral-200">
            <span>OpenDock</span>
            <span className="text-neutral-300 dark:text-neutral-600">/</span>
            <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs font-semibold text-white dark:bg-neutral-200 dark:text-neutral-900">
              Notebook
            </span>
          </div>
        </div>
        <ThemeToggle />
      </header>

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-[240px] flex-shrink-0 flex-col bg-white dark:bg-neutral-950 lg:flex">
        <div className="flex h-full min-h-0 flex-col gap-4 overflow-auto overflow-x-hidden px-10 pb-8 pt-32 no-scrollbar">
          {sidebar}
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-[240px] flex flex-1 flex-col pt-32">
        {children}
      </main>
    </div>
  );
}
