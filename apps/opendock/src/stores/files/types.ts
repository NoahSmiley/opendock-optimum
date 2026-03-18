export interface FileItem {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  folderId: string | null;
  url: string;
  thumbnailUrl?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileFolder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
}

export type FilesViewMode = "grid" | "list";
export type FilesSortBy = "name" | "date" | "size";

export interface FilesState {
  files: FileItem[];
  folders: FileFolder[];
  currentFolderId: string | null;
  viewMode: FilesViewMode;
  sortBy: FilesSortBy;
  isLoading: boolean;
  error: string | null;
  setCurrentFolder: (folderId: string | null) => void;
  setViewMode: (mode: FilesViewMode) => void;
  setSortBy: (sort: FilesSortBy) => void;
  fetchFiles: () => Promise<void>;
  fetchFolders: () => Promise<void>;
}
