import { useState, useCallback } from "react";
import { toast } from "sonner";

interface OptimisticNote {
  id: string;
  title: string;
  content: string;
  created_at: string;
  author: { email: string };
  isOptimistic?: boolean;
}

export function useOptimisticNotes(initialNotes: OptimisticNote[] = []) {
  const [notes, setNotes] = useState<OptimisticNote[]>(initialNotes);

  const addNote = useCallback(
    async (
      noteData: { title: string; content: string },
      createFn: (data: {
        title: string;
        content: string;
      }) => Promise<OptimisticNote>
    ) => {
      // Create optimistic note
      const optimisticNote: OptimisticNote = {
        id: `temp-${Date.now()}`,
        title: noteData.title,
        content: noteData.content,
        created_at: new Date().toISOString(),
        author: { email: "You" },
        isOptimistic: true,
      };

      // Add to UI immediately
      setNotes(prev => [optimisticNote, ...prev]);

      try {
        // Use toast.promise correctly
        const toastResult = await toast.promise(createFn(noteData), {
          loading: "Creating note...",
          success: "Note created successfully!",
          error: err => err.message || "Failed to create note",
        });

        // Unwrap the result if it has an unwrap method
        const result = (toastResult as any)?.unwrap
          ? await (toastResult as any).unwrap()
          : toastResult;

        // Replace optimistic note with real data
        setNotes(prev =>
          prev.map(note => (note.id === optimisticNote.id ? result : note))
        );

        return result;
      } catch (error) {
        // Remove optimistic note on error
        setNotes(prev => prev.filter(note => note.id !== optimisticNote.id));
        throw error;
      }
    },
    []
  );

  const removeNote = useCallback(
    async (noteId: string, deleteFn: (id: string) => Promise<void>) => {
      // Find note to potentially restore
      const noteToRemove = notes.find(note => note.id === noteId);
      if (!noteToRemove) return;

      // Remove from UI immediately
      setNotes(prev => prev.filter(note => note.id !== noteId));

      try {
        // Use toast.promise for delete
        const toastResult = await toast.promise(deleteFn(noteId), {
          loading: "Deleting note...",
          success: "Note deleted successfully!",
          error: err => err.message || "Failed to delete note",
        });

        // The delete promise resolves to void/undefined, so we don't need to unwrap
      } catch (error) {
        // Restore note on error
        setNotes(prev => [...prev, noteToRemove]);
        throw error;
      }
    },
    [notes]
  );

  const updateNotes = useCallback((newNotes: OptimisticNote[]) => {
    setNotes(newNotes);
  }, []);

  return {
    notes,
    addNote,
    removeNote,
    updateNotes,
  };
}
