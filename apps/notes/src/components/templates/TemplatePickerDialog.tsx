import { X, Search, FileText, Users, Target, BookOpen, Lightbulb, File } from 'lucide-react';
import { useState, useMemo } from 'react';
import type { NoteTemplate } from '../../lib/templates';
import { noteTemplates, getTemplateCategories } from '../../lib/templates';

interface TemplatePickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: NoteTemplate) => void;
}

const categoryIcons: Record<string, typeof FileText> = {
  general: File,
  meeting: Users,
  project: Target,
  personal: BookOpen,
  academic: BookOpen,
  creative: Lightbulb,
};

const categoryLabels: Record<string, string> = {
  general: 'General',
  meeting: 'Meeting',
  project: 'Project',
  personal: 'Personal',
  academic: 'Academic',
  creative: 'Creative',
};

export function TemplatePickerDialog({ isOpen, onClose, onSelect }: TemplatePickerDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = getTemplateCategories();

  const filteredTemplates = useMemo(() => {
    let templates = noteTemplates;

    if (selectedCategory) {
      templates = templates.filter(t => t.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      templates = templates.filter(
        t =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query)
      );
    }

    return templates;
  }, [searchQuery, selectedCategory]);

  const handleSelectTemplate = (template: NoteTemplate) => {
    onSelect(template);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex h-[600px] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-neutral-200 p-6 dark:border-neutral-800">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Choose a Template</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:focus:border-indigo-400"
              autoFocus
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 border-b border-neutral-200 px-6 py-3 dark:border-neutral-800">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              selectedCategory === null
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
            }`}
          >
            All
          </button>
          {categories.map((category) => {
            const Icon = categoryIcons[category];
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                    : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                {categoryLabels[category]}
              </button>
            );
          })}
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredTemplates.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <FileText className="mb-4 h-12 w-12 text-neutral-300 dark:text-neutral-700" />
              <p className="text-sm text-neutral-500 dark:text-neutral-400">No templates found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((template) => {
                const Icon = categoryIcons[template.category];
                return (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className="group relative flex flex-col items-start gap-3 rounded-lg border border-neutral-200 bg-white p-4 text-left transition-all hover:border-indigo-500 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-800/50 dark:hover:border-indigo-400"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{template.icon}</span>
                      <Icon className="h-4 w-4 text-neutral-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900 dark:text-white">{template.name}</h3>
                      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{template.description}</p>
                    </div>
                    <span className="mt-auto text-xs font-medium text-neutral-400 dark:text-neutral-500">
                      {categoryLabels[template.category]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-200 p-4 dark:border-neutral-800">
          <p className="text-center text-xs text-neutral-500 dark:text-neutral-400">
            Select a template to get started, or press <kbd className="rounded bg-neutral-100 px-2 py-1 font-mono text-xs dark:bg-neutral-800">Esc</kbd> to cancel
          </p>
        </div>
      </div>
    </div>
  );
}
