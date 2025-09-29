"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { NoteEditor, Toolbar } from "./note-editor";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import History from "@tiptap/extension-history";
import Placeholder from "@tiptap/extension-placeholder";
import Heading from "@tiptap/extension-heading";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { toast } from "sonner";
import type { Note } from "@/lib/api";
import { useNote, useUpdateNote } from "@/lib/api";

interface NoteEditorContainerProps {
  noteId: string;
  onNoteUpdate: (noteId: string, updates: Partial<Note>) => void;
  isDirty: boolean;
  onDirtyChange: (isDirty: boolean) => void;
  registerSaveFn?: (fn: () => Promise<void>) => void;
}

// --- Note Editor Component ---
// This component fetches and displays the content of the selected note.
export const NoteEditorContainer = React.memo(function NoteEditorContainer({
  noteId,
  onNoteUpdate,
  isDirty,
  onDirtyChange,
  registerSaveFn,
}: NoteEditorContainerProps) {
  const { data: noteData, isLoading, error } = useNote(noteId);
  const updateNoteMutation = useUpdateNote();

  const note = noteData;
  const [currentTitle, setCurrentTitle] = useState(note?.title || "");
  const [saving, setSaving] = useState(false);
  // Editor is considered ready once programmatic setContent is done
  const [editorReady, setEditorReady] = useState(false);
  // Flag to prevent setting dirty during programmatic content changes
  const isProgrammaticChange = useRef(false);

  const handleEditorUpdate = useCallback(() => {
    if (isProgrammaticChange.current) return;
    onDirtyChange(true);
  }, [onDirtyChange]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        history: false, // Disable default history
      }),
      History.configure({ depth: 100 }), // Add History extension explicitly
      Heading.configure({ levels: [1, 2, 3] }),
      TaskList,
      TaskItem,
      Link.configure({
        autolink: true,
        openOnClick: true,
        HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
      }),
      Placeholder.configure({
        placeholder: "Start typing...",
        emptyEditorClass: "is-editor-empty text-muted-foreground",
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      Underline,
      Subscript,
      Superscript,
    ],
    editorProps: {
      attributes: {
        class: "tiptap max-w-none py-6 px-4 md:px-6 text-foreground",
      },
    },
    onUpdate: handleEditorUpdate,
  });

  // Update local state and reset dirty status when note data changes
  useEffect(() => {
    if (note && editor) {
      setCurrentTitle(note.title);
      onDirtyChange(false);
      setEditorReady(false);

      isProgrammaticChange.current = true;
      const { state, view } = editor;
      const tr = state.tr.replaceWith(
        0,
        state.doc.content.size,
        note.content?.content
          ? state.schema.nodeFromJSON(note.content)
          : state.schema.node("doc")
      );
      tr.setMeta("addToHistory", false);
      view.dispatch(tr);

      if (editor.storage.history) {
        editor.storage.history.done = [];
        editor.storage.history.undone = [];
      }
      setEditorReady(true);
      // Reset the flag after a short delay to ensure no onUpdate fires
      setTimeout(() => {
        isProgrammaticChange.current = false;
      }, 0);
    }
  }, [note, editor, onDirtyChange]);

  // Save to API
  const saveToAPI = useCallback(
    async (data: { title?: string; content?: any }) => {
      if (!editor) return;

      const titleToSave = data.title?.trim();
      if (!titleToSave) {
        toast.error("Please enter a title for your note");
        return;
      }

      const contentToSave = data.content || editor.getJSON();
      setSaving(true);
      editor.setEditable(false);

      try {
        await toast.promise(
          updateNoteMutation.mutateAsync({
            id: noteId,
            data: { ...data, title: titleToSave, content: contentToSave },
          }),
          {
            loading: "Saving note...",
            success: () => {
              onNoteUpdate(noteId, {
                title: titleToSave,
                updated_at: new Date().toISOString(),
              });
              onDirtyChange(false);
              setSaving(false);
              editor.setEditable(true);
              editor.commands.focus();
              return "Note saved!";
            },
            error: () => {
              setSaving(false);
              editor.setEditable(true);
              return "Failed to save note.";
            },
          }
        );

        // To ensure the undo/redo buttons update, manually clear the history stacks
        // and then dispatch an empty transaction to force a state update.
        if (editor.storage.history) {
          editor.storage.history.done = [];
          editor.storage.history.undone = [];
        }
        // This forces the editor to re-evaluate its state, including `can().undo()`
        editor.view.dispatch(editor.state.tr);
      } catch (err) {
        // Error is handled by toast.promise
      }
    },
    [noteId, onNoteUpdate, updateNoteMutation, editor, onDirtyChange]
  );

  // Register save function with parent
  useEffect(() => {
    if (typeof registerSaveFn === "function") {
      registerSaveFn(() => saveToAPI({ title: currentTitle }));
    }
  }, [registerSaveFn, saveToAPI, currentTitle]);

  // Handler for title changes.
  const onTitleChange = (newTitle: string) => {
    setCurrentTitle(newTitle);
    onDirtyChange(true);
  };

  // Manual save handler
  const handleManualSave = async () => {
    await saveToAPI({ title: currentTitle });
  };

  // Prevent closing window with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    if (isDirty) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    } else {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    }

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Keyboard shortcut for save (Ctrl+S / Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (isDirty && !saving) {
          handleManualSave();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDirty, saving, handleManualSave]);

  if (isLoading || !editorReady) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 px-4 pb-2 pt-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-8 w-16" />
        </div>
        <div className="flex-1 space-y-4 px-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }
  if (error)
    return <p className="text-destructive p-4 text-sm">Failed to load note.</p>;
  if (!note) return null;

  return (
    <div className="flex h-full flex-col">
      <Toolbar
        editor={editor}
        onSave={handleManualSave}
        disabled={!isDirty || saving}
        saving={saving}
      />
      <ScrollArea
        type="always"
        className="h-[calc(100vh-120px)] md:h-[calc(100vh-60px)]"
      >
        <div className="mx-auto mt-6 w-full max-w-4xl px-4 md:px-6">
          <input
            className="text-foreground w-full resize-none border-none bg-transparent text-4xl font-bold focus:outline-none"
            value={currentTitle}
            onChange={e => onTitleChange(e.target.value)}
            placeholder="Untitled"
          />
        </div>
        <NoteEditor editor={editor} />
      </ScrollArea>
    </div>
  );
});
