// src/hooks/useVisit.ts
import { useState, useEffect, useCallback } from 'react';
import { getVisit, addVisitNote } from '../lib/visits';
import type { Visit, NoteSource } from '../types';

export function useVisit(visitId: string | undefined) {
  const [visit, setVisit] = useState<Visit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load visit on mount
  useEffect(() => {
    async function loadVisit() {
      if (!visitId) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await getVisit(visitId);
        setVisit(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load visit');
      } finally {
        setIsLoading(false);
      }
    }

    loadVisit();
  }, [visitId]);

  // Add note function
  const addNote = useCallback(async (source: NoteSource, content: string) => {
    if (!visitId) return;

    try {
      const updated = await addVisitNote(visitId, source, content);
      setVisit(updated);
    } catch (err) {
      console.error('Failed to add note:', err);
    }
  }, [visitId]);

  return {
    visit,
    isLoading,
    error,
    addNote,
  };
}
