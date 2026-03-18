import { useState, useEffect } from 'react';
import { X, Trash2, FolderOpen, Briefcase, BookOpen, Star, Heart, Zap, Target, TrendingUp, Lightbulb, Coffee, Rocket, Palette, Code, Music } from 'lucide-react';
import type { Collection, CreateCollectionInput, UpdateCollectionInput } from '@opendock/shared/types';

const ICON_OPTIONS = [
  { name: 'FolderOpen', icon: FolderOpen },
  { name: 'Briefcase', icon: Briefcase },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'Star', icon: Star },
  { name: 'Heart', icon: Heart },
  { name: 'Zap', icon: Zap },
  { name: 'Target', icon: Target },
  { name: 'TrendingUp', icon: TrendingUp },
  { name: 'Lightbulb', icon: Lightbulb },
  { name: 'Coffee', icon: Coffee },
  { name: 'Rocket', icon: Rocket },
  { name: 'Palette', icon: Palette },
  { name: 'Code', icon: Code },
  { name: 'Music', icon: Music },
];

interface CollectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCollectionInput | UpdateCollectionInput) => Promise<void>;
  onDelete?: (collectionId: string) => void;
  collection?: Collection | null;
  mode: 'create' | 'edit';
}

const PRESET_COLORS = [
  '#2c2c2c', // Black
  '#3d3d3d', // Charcoal
  '#5a5a5a', // Dark Gray
  '#8b7355', // Brown/Tan
  '#a0826d', // Light Brown
  '#c9b8a8', // Beige
  '#4a5568', // Slate Gray
  '#5f7a8a', // Blue Gray
  '#6b8e9e', // Steel Blue
  '#7d9ab8', // Light Blue
  '#1e3a5f', // Navy Blue
  '#2d4a3e', // Forest Green
  '#8b4513', // Saddle Brown
  '#6b4423', // Dark Brown
  '#9c8b7a', // Taupe
  '#556b2f', // Olive
];

const COVER_PATTERNS = [
  { name: 'solid', label: 'Solid' },
  { name: 'grid', label: 'Grid' },
  { name: 'dots', label: 'Dots' },
  { name: 'lines', label: 'Lines' },
  { name: 'leather', label: 'Leather' },
] as const;

export function CollectionDialog({ isOpen, onClose, onSubmit, onDelete, collection, mode }: CollectionDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#2c2c2c');
  const [icon, setIcon] = useState('FolderOpen');
  const [coverPattern, setCoverPattern] = useState<'solid' | 'grid' | 'dots' | 'lines' | 'leather'>('solid');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && collection && mode === 'edit') {
      setName(collection.name);
      setDescription(collection.description || '');
      setColor(collection.color || '#3b82f6');
      setIcon(collection.icon || 'FolderOpen');
      setCoverPattern((collection as any).coverPattern || 'solid');
    } else if (isOpen && mode === 'create') {
      setName('');
      setDescription('');
      setColor('#3b82f6');
      setIcon('FolderOpen');
      setCoverPattern('solid');
    }
  }, [isOpen, collection, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        icon,
        coverPattern,
      } as any);
      onClose();
    } catch (error) {
      console.error('Failed to save collection:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (collection && onDelete) {
      if (window.confirm(`Are you sure you want to delete "${collection.name}"? This will not delete the notes inside.`)) {
        onDelete(collection.id);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-neutral-900">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="mb-4 text-xl font-semibold text-neutral-900 dark:text-white">
          {mode === 'create' ? 'Create Notebook' : 'Edit Notebook'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="collection-name" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Name
            </label>
            <input
              id="collection-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Notebook"
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500"
              autoFocus
              required
            />
          </div>

          <div>
            <label htmlFor="collection-description" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Description (optional)
            </label>
            <textarea
              id="collection-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              rows={3}
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Icon
            </label>
            <div className="grid grid-cols-7 gap-2">
              {ICON_OPTIONS.map((iconOption) => {
                const IconComponent = iconOption.icon;
                return (
                  <button
                    key={iconOption.name}
                    type="button"
                    onClick={() => setIcon(iconOption.name)}
                    className="flex h-10 w-10 items-center justify-center rounded-md border-2 transition-all hover:scale-105 focus:outline-none"
                    style={{
                      borderColor: icon === iconOption.name ? color : 'transparent',
                      backgroundColor: icon === iconOption.name ? `${color}20` : 'transparent',
                    }}
                    title={iconOption.name}
                  >
                    <IconComponent
                      className="h-5 w-5"
                      style={{ color: icon === iconOption.name ? color : 'currentColor' }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Color
            </label>
            <div className="grid grid-cols-8 gap-2">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  onClick={() => setColor(presetColor)}
                  className="h-8 w-8 rounded-md transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
                  style={{
                    backgroundColor: presetColor,
                    border: color === presetColor ? '2px solid white' : 'none',
                    boxShadow: color === presetColor ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : 'none',
                  }}
                  title={presetColor}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Cover Pattern
            </label>
            <div className="grid grid-cols-5 gap-2">
              {COVER_PATTERNS.map((pattern) => (
                <button
                  key={pattern.name}
                  type="button"
                  onClick={() => setCoverPattern(pattern.name)}
                  className="flex h-12 items-center justify-center rounded-md border-2 text-xs font-medium transition-all hover:scale-105"
                  style={{
                    borderColor: coverPattern === pattern.name ? color : '#e5e7eb',
                    backgroundColor: coverPattern === pattern.name ? `${color}20` : '#f9fafb',
                    color: coverPattern === pattern.name ? color : '#6b7280',
                  }}
                >
                  {pattern.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between gap-2 pt-2">
            {mode === 'edit' && onDelete && collection ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-md px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
