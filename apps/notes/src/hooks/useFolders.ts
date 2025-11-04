import { useState, useEffect, useCallback } from 'react';
import type { Folder, CreateFolderInput, UpdateFolderInput } from '@opendock/shared/types';
import { foldersApi } from '../lib/api';

export interface UseFoldersReturn {
  folders: Folder[];
  isLoading: boolean;
  error: string | null;

  createFolder: (input: CreateFolderInput) => Promise<Folder>;
  updateFolder: (folderId: string, input: UpdateFolderInput) => Promise<Folder>;
  deleteFolder: (folderId: string) => Promise<void>;
  refresh: () => Promise<void>;

  // Tree helpers
  buildFolderTree: () => Folder[];
}

export function useFolders(): UseFoldersReturn {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFolders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await foldersApi.list();
      setFolders(response.folders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load folders');
      console.error('Failed to load folders:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await loadFolders();
  }, [loadFolders]);

  const createFolder = useCallback(async (input: CreateFolderInput): Promise<Folder> => {
    setError(null);
    try {
      const response = await foldersApi.create(input);
      const newFolder = response.folder;
      setFolders(prev => [...prev, newFolder]);
      return newFolder;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create folder';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const updateFolder = useCallback(async (folderId: string, input: UpdateFolderInput): Promise<Folder> => {
    setError(null);
    try {
      const response = await foldersApi.update(folderId, input);
      const updatedFolder = response.folder;
      setFolders(prev =>
        prev.map(folder => (folder.id === folderId ? updatedFolder : folder))
      );
      return updatedFolder;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update folder';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const deleteFolder = useCallback(async (folderId: string): Promise<void> => {
    setError(null);
    try {
      await foldersApi.delete(folderId);
      setFolders(prev => prev.filter(folder => folder.id !== folderId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete folder';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const buildFolderTree = useCallback((): Folder[] => {
    const folderMap = new Map<string, Folder>();
    const rootFolders: Folder[] = [];

    // First pass: create map and initialize children arrays
    folders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [] });
    });

    // Second pass: build tree structure
    folders.forEach(folder => {
      const folderWithChildren = folderMap.get(folder.id)!;
      if (folder.parentId) {
        const parent = folderMap.get(folder.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(folderWithChildren);
        } else {
          // Parent doesn't exist, treat as root
          rootFolders.push(folderWithChildren);
        }
      } else {
        rootFolders.push(folderWithChildren);
      }
    });

    return rootFolders;
  }, [folders]);

  // Load initial data
  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  return {
    folders,
    isLoading,
    error,
    createFolder,
    updateFolder,
    deleteFolder,
    refresh,
    buildFolderTree,
  };
}
