import { useState, useEffect, useCallback } from 'react';
import { notesApi } from '../lib/api';

export interface UseTagsReturn {
  tags: string[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getTagCount: (tag: string) => number;
  tagCounts: Map<string, number>;
}

export function useTags(notes?: Array<{ tags: string[] }>): UseTagsReturn {
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagCounts, setTagCounts] = useState<Map<string, number>>(new Map());

  const loadTags = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await notesApi.listTags();
      setTags(response.tags || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tags');
      console.error('Failed to load tags:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await loadTags();
  }, [loadTags]);

  // Calculate tag counts from notes if provided
  useEffect(() => {
    if (!notes) return;

    const counts = new Map<string, number>();
    notes.forEach(note => {
      note.tags.forEach(tag => {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      });
    });

    setTagCounts(counts);
  }, [notes]);

  const getTagCount = useCallback((tag: string): number => {
    return tagCounts.get(tag) || 0;
  }, [tagCounts]);

  // Load initial data
  useEffect(() => {
    loadTags();
  }, [loadTags]);

  return {
    tags,
    isLoading,
    error,
    refresh,
    getTagCount,
    tagCounts,
  };
}
