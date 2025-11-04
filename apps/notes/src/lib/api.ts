import type {
  Note,
  Folder,
  Collection,
  NotesResponse,
  CreateNoteInput,
  UpdateNoteInput,
  CreateFolderInput,
  UpdateFolderInput,
  CreateCollectionInput,
  UpdateCollectionInput,
  NoteSearchParams,
  NoteSearchResult,
  LinkNoteToBoardInput,
  LinkNoteToCardInput,
} from "@opendock/shared/types";
import { request } from "@opendock/shared/api";
import { resolveCsrfHeaders } from "./auth-client";

export const notesApi = {
  // Notes CRUD
  listNotes: (params?: { folderId?: string; tags?: string[]; isPinned?: boolean; isArchived?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.folderId) searchParams.set('folderId', params.folderId);
    if (params?.tags?.length) searchParams.set('tags', params.tags.join(','));
    if (params?.isPinned !== undefined) searchParams.set('isPinned', params.isPinned.toString());
    if (params?.isArchived !== undefined) searchParams.set('isArchived', params.isArchived.toString());

    const query = searchParams.toString();
    return request<NotesResponse>({
      path: `/api/notes${query ? '?' + query : ''}`
    });
  },

  getNote: (noteId: string) =>
    request<{ note: Note }>({ path: `/api/notes/${noteId}` }),

  createNote: async (payload: CreateNoteInput) => {
    const headers = await resolveCsrfHeaders();
    return request<{ note: Note }>({
      path: "/api/notes",
      method: "POST",
      body: JSON.stringify(payload),
      headers,
    });
  },

  updateNote: async (noteId: string, payload: UpdateNoteInput) => {
    const headers = await resolveCsrfHeaders();
    return request<{ note: Note }>({
      path: `/api/notes/${noteId}`,
      method: "PATCH",
      body: JSON.stringify(payload),
      headers,
    });
  },

  deleteNote: async (noteId: string) => {
    const headers = await resolveCsrfHeaders();
    return request<{ success: boolean }>({
      path: `/api/notes/${noteId}`,
      method: "DELETE",
      headers,
    });
  },

  // Search
  searchNotes: (params: NoteSearchParams) => {
    const searchParams = new URLSearchParams();
    if (params.query) searchParams.set('q', params.query);
    if (params.tags?.length) searchParams.set('tags', params.tags.join(','));
    if (params.folderId) searchParams.set('folderId', params.folderId);
    if (params.isPinned !== undefined) searchParams.set('isPinned', params.isPinned.toString());
    if (params.isArchived !== undefined) searchParams.set('isArchived', params.isArchived.toString());
    if (params.boardId) searchParams.set('boardId', params.boardId);
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.offset) searchParams.set('offset', params.offset.toString());

    return request<NoteSearchResult>({
      path: `/api/notes/search?${searchParams.toString()}`,
    });
  },

  // Folders CRUD
  listFolders: () =>
    request<{ folders: Folder[] }>({ path: "/api/folders" }),

  getFolder: (folderId: string) =>
    request<{ folder: Folder }>({ path: `/api/folders/${folderId}` }),

  createFolder: async (payload: CreateFolderInput) => {
    const headers = await resolveCsrfHeaders();
    return request<{ folder: Folder }>({
      path: "/api/folders",
      method: "POST",
      body: JSON.stringify(payload),
      headers,
    });
  },

  updateFolder: async (folderId: string, payload: UpdateFolderInput) => {
    const headers = await resolveCsrfHeaders();
    return request<{ folder: Folder }>({
      path: `/api/folders/${folderId}`,
      method: "PATCH",
      body: JSON.stringify(payload),
      headers,
    });
  },

  deleteFolder: async (folderId: string) => {
    const headers = await resolveCsrfHeaders();
    return request<{ success: boolean }>({
      path: `/api/folders/${folderId}`,
      method: "DELETE",
      headers,
    });
  },

  // Tags
  listTags: () =>
    request<{ tags: string[] }>({ path: "/api/notes/tags" }),

  addTag: async (noteId: string, tag: string) => {
    const headers = await resolveCsrfHeaders();
    return request<{ note: Note }>({
      path: `/api/notes/${noteId}/tags`,
      method: "POST",
      body: JSON.stringify({ tag }),
      headers,
    });
  },

  removeTag: async (noteId: string, tag: string) => {
    const headers = await resolveCsrfHeaders();
    return request<{ note: Note }>({
      path: `/api/notes/${noteId}/tags/${encodeURIComponent(tag)}`,
      method: "DELETE",
      headers,
    });
  },

  // Board linking
  linkToBoard: async (payload: LinkNoteToBoardInput) => {
    const headers = await resolveCsrfHeaders();
    return request<{ success: boolean }>({
      path: `/api/notes/${payload.noteId}/link-board`,
      method: "POST",
      body: JSON.stringify({ boardId: payload.boardId }),
      headers,
    });
  },

  unlinkFromBoard: async (noteId: string, boardId: string) => {
    const headers = await resolveCsrfHeaders();
    return request<{ success: boolean }>({
      path: `/api/notes/${noteId}/unlink-board/${boardId}`,
      method: "DELETE",
      headers,
    });
  },

  getLinkedBoards: (noteId: string) =>
    request<{ boards: any[] }>({ path: `/api/notes/${noteId}/boards` }),

  // Card linking
  linkToCard: async (payload: LinkNoteToCardInput) => {
    const headers = await resolveCsrfHeaders();
    return request<{ success: boolean }>({
      path: `/api/notes/${payload.noteId}/link-card`,
      method: "POST",
      body: JSON.stringify({ cardId: payload.cardId }),
      headers,
    });
  },

  unlinkFromCard: async (noteId: string, cardId: string) => {
    const headers = await resolveCsrfHeaders();
    return request<{ success: boolean }>({
      path: `/api/notes/${noteId}/unlink-card/${cardId}`,
      method: "DELETE",
      headers,
    });
  },

  // Collections for a note
  getNoteCollections: (noteId: string) =>
    request<{ collections: Collection[] }>({ path: `/api/notes/${noteId}/collections` }),
};

export const foldersApi = {
  list: () => notesApi.listFolders(),
  get: (id: string) => notesApi.getFolder(id),
  create: (payload: CreateFolderInput) => notesApi.createFolder(payload),
  update: (id: string, payload: UpdateFolderInput) => notesApi.updateFolder(id, payload),
  delete: (id: string) => notesApi.deleteFolder(id),
};

export const collectionsApi = {
  // Collections CRUD
  list: () =>
    request<{ collections: Collection[] }>({ path: "/api/notes/collections" }),

  get: (collectionId: string) =>
    request<{ collection: Collection }>({ path: `/api/notes/collections/${collectionId}` }),

  create: async (payload: CreateCollectionInput) => {
    const headers = await resolveCsrfHeaders();
    return request<{ collection: Collection }>({
      path: "/api/notes/collections",
      method: "POST",
      body: JSON.stringify(payload),
      headers,
    });
  },

  update: async (collectionId: string, payload: UpdateCollectionInput) => {
    const headers = await resolveCsrfHeaders();
    return request<{ collection: Collection }>({
      path: `/api/notes/collections/${collectionId}`,
      method: "PATCH",
      body: JSON.stringify(payload),
      headers,
    });
  },

  delete: async (collectionId: string) => {
    const headers = await resolveCsrfHeaders();
    return request<{ success: boolean }>({
      path: `/api/notes/collections/${collectionId}`,
      method: "DELETE",
      headers,
    });
  },

  // Collection-Note operations
  addNote: async (collectionId: string, noteId: string) => {
    const headers = await resolveCsrfHeaders();
    return request<{ success: boolean }>({
      path: `/api/notes/collections/${collectionId}/notes/${noteId}`,
      method: "POST",
      headers,
    });
  },

  removeNote: async (collectionId: string, noteId: string) => {
    const headers = await resolveCsrfHeaders();
    return request<{ success: boolean }>({
      path: `/api/notes/collections/${collectionId}/notes/${noteId}`,
      method: "DELETE",
      headers,
    });
  },

  getNotes: (collectionId: string) =>
    request<{ notes: Note[] }>({ path: `/api/notes/collections/${collectionId}/notes` }),
};
