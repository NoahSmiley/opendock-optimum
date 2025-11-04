import { useState, useEffect, useCallback } from 'react';
import type { Collection, CreateCollectionInput, UpdateCollectionInput, Note } from '@opendock/shared/types';
import { collectionsApi } from '../lib/api';

export interface UseCollectionsReturn {
  collections: Collection[];
  isLoading: boolean;
  error: string | null;

  createCollection: (input: CreateCollectionInput) => Promise<Collection>;
  updateCollection: (collectionId: string, input: UpdateCollectionInput) => Promise<Collection>;
  deleteCollection: (collectionId: string) => Promise<void>;
  addNoteToCollection: (collectionId: string, noteId: string) => Promise<void>;
  removeNoteFromCollection: (collectionId: string, noteId: string) => Promise<void>;
  getCollectionNotes: (collectionId: string) => Promise<Note[]>;
  refresh: () => Promise<void>;
}

export function useCollections(): UseCollectionsReturn {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCollections = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await collectionsApi.list();
      setCollections(response.collections || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load collections');
      console.error('Failed to load collections:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await loadCollections();
  }, [loadCollections]);

  const createCollection = useCallback(async (input: CreateCollectionInput): Promise<Collection> => {
    setError(null);
    try {
      const response = await collectionsApi.create(input);
      const newCollection = response.collection;
      setCollections(prev => [...prev, newCollection]);
      return newCollection;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create collection';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const updateCollection = useCallback(async (collectionId: string, input: UpdateCollectionInput): Promise<Collection> => {
    setError(null);
    try {
      const response = await collectionsApi.update(collectionId, input);
      const updatedCollection = response.collection;
      setCollections(prev =>
        prev.map(collection => (collection.id === collectionId ? updatedCollection : collection))
      );
      return updatedCollection;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update collection';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const deleteCollection = useCallback(async (collectionId: string): Promise<void> => {
    setError(null);
    try {
      await collectionsApi.delete(collectionId);
      setCollections(prev => prev.filter(collection => collection.id !== collectionId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete collection';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const addNoteToCollection = useCallback(async (collectionId: string, noteId: string): Promise<void> => {
    setError(null);
    try {
      await collectionsApi.addNote(collectionId, noteId);
      // Update note count for the collection
      setCollections(prev =>
        prev.map(collection => {
          if (collection.id === collectionId) {
            return {
              ...collection,
              noteCount: (collection.noteCount || 0) + 1,
            };
          }
          return collection;
        })
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add note to collection';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const removeNoteFromCollection = useCallback(async (collectionId: string, noteId: string): Promise<void> => {
    setError(null);
    try {
      await collectionsApi.removeNote(collectionId, noteId);
      // Update note count for the collection
      setCollections(prev =>
        prev.map(collection => {
          if (collection.id === collectionId) {
            return {
              ...collection,
              noteCount: Math.max(0, (collection.noteCount || 0) - 1),
            };
          }
          return collection;
        })
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove note from collection';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const getCollectionNotes = useCallback(async (collectionId: string): Promise<Note[]> => {
    setError(null);
    try {
      const response = await collectionsApi.getNotes(collectionId);
      return response.notes || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get collection notes';
      setError(message);
      throw new Error(message);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  return {
    collections,
    isLoading,
    error,
    createCollection,
    updateCollection,
    deleteCollection,
    addNoteToCollection,
    removeNoteFromCollection,
    getCollectionNotes,
    refresh,
  };
}
