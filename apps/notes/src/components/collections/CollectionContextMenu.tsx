import { Trash2, Edit } from 'lucide-react';
import type { Collection } from '@opendock/shared/types';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '../ui/context-menu';

interface CollectionContextMenuProps {
  collection: Collection;
  onDelete: (collectionId: string) => void;
  onEdit?: (collection: Collection) => void;
  children: React.ReactNode;
}

export function CollectionContextMenu({ collection, onDelete, onEdit, children }: CollectionContextMenuProps) {
  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${collection.name}"? This will not delete the notes inside.`)) {
      onDelete(collection.id);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(collection);
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {onEdit && (
          <>
            <ContextMenuItem onClick={handleEdit}>
              <Edit className="h-4 w-4" />
              Edit Collection
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}
        <ContextMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400">
          <Trash2 className="h-4 w-4" />
          Delete Collection
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
