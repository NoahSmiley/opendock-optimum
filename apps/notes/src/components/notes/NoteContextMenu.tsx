import { Trash2, Pin } from 'lucide-react';
import type { Note } from '@opendock/shared/types';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '../ui/context-menu';

interface NoteContextMenuProps {
  note: Note;
  onDelete: (noteId: string) => void;
  onTogglePin?: (noteId: string) => void;
  children: React.ReactNode;
}

export function NoteContextMenu({ note, onDelete, onTogglePin, children }: NoteContextMenuProps) {
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      onDelete(note.id);
    }
  };

  const handleTogglePin = () => {
    if (onTogglePin) {
      onTogglePin(note.id);
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {onTogglePin && (
          <>
            <ContextMenuItem onClick={handleTogglePin}>
              <Pin className="h-4 w-4" />
              {note.isPinned ? 'Unpin Note' : 'Pin Note'}
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}
        <ContextMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400">
          <Trash2 className="h-4 w-4" />
          Delete Note
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
