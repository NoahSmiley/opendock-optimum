export interface Note {
  id: string;
  title: string;
  content: string;
  contentType?: "markdown" | "richtext";
  folderId?: string | null;
  tags: string[];
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  coverPattern?: "solid" | "grid" | "dots" | "lines" | "leather";
  userId: string;
  createdAt: string;
  updatedAt: string;
  noteCount?: number;
}

export interface Folder {
  id: string;
  name: string;
  color?: string | null;
  icon?: string | null;
  parentId?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteInput {
  title: string;
  content?: string;
  contentType?: "markdown" | "richtext";
  folderId?: string;
  tags?: string[];
  isPinned?: boolean;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  contentType?: "markdown" | "richtext";
  folderId?: string | null;
  tags?: string[];
  isPinned?: boolean;
  isArchived?: boolean;
}

export interface CreateCollectionInput {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  coverPattern?: string;
}

export interface UpdateCollectionInput {
  name?: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  coverPattern?: string | null;
}

export interface NotesState {
  notes: Note[];
  collections: Collection[];
  folders: Folder[];
  selectedNote: Note | null;
  activeCollection: Collection | null;
  isLoading: boolean;
  error: string | null;
  fetchNotes: () => Promise<void>;
  fetchCollections: () => Promise<void>;
  selectNote: (note: Note | null) => void;
  selectCollection: (collection: Collection | null) => void;
}
