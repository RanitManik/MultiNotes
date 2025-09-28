"use client";

import { useEffect, useMemo } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Heading from "@tiptap/extension-heading";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import Blockquote from "@tiptap/extension-blockquote";
import CodeBlock from "@tiptap/extension-code-block";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@workspace/ui/components/tooltip";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Undo,
  Redo,
} from "lucide-react";
// @ts-ignore
import "./note-styles.css";

// Debounce helper
const createDebounced = <T extends (...args: any[]) => void>(
  fn: T,
  delay: number
) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
};

export function NoteEditor({
  initialContent,
  onUpdateJSON,
}: {
  initialContent: any;
  onUpdateJSON: (content: any) => void;
}) {
  const editor = useEditor({
    content: initialContent ?? defaultDoc,
    extensions: [
      StarterKit.configure({
        heading: false, // use custom Heading extension to control levels
      }),
      Heading.configure({ levels: [1, 2, 3] }),
      BulletList,
      OrderedList,
      Blockquote,
      CodeBlock,
      Placeholder.configure({
        placeholder: 'Start typing...',
        emptyEditorClass: "is-editor-empty text-muted-foreground",
      }),
    ],
    editorProps: {
      attributes: {
        class:
          "prose prose-sm md:prose-base max-w-none py-6 px-4 md:px-6 text-foreground",
      },
    },
  });

  const debouncedOnUpdate = useMemo(
    () => createDebounced((json: any) => onUpdateJSON(json), 800),
    [onUpdateJSON]
  );

  useEffect(() => {
    if (!editor) return;
    const handler = () => {
      const json = editor.getJSON();
      debouncedOnUpdate(json);
    };
    editor.on("update", handler);
    return () => {
      editor.off("update", handler);
    };
  }, [editor, debouncedOnUpdate]);

  if (!editor) return null;

  return (
    <div className="flex h-full flex-col">
      <Toolbar editor={editor} />
      <Separator />
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="mx-auto max-w-4xl">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}

function Toolbar({ editor }: { editor: any }) {
  if (!editor) return null;
  const itemCls = (active: boolean) =>
    // Use tokens, avoid direct colors
    "h-8 px-2 text-xs border rounded-md " +
    (active ? "bg-accent" : "bg-card hover:bg-accent/60");

  return (
    <div className="relative flex w-full items-center gap-1 overflow-x-auto px-3 py-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className={itemCls(false)}
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            aria-label="Undo"
          >
            <Undo className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Undo</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className={itemCls(false)}
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            aria-label="Redo"
          >
            <Redo className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Redo</TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="mx-2 h-6" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className={itemCls(editor.isActive("bold"))}
            onClick={() => editor.chain().focus().toggleBold().run()}
            aria-label="Bold"
          >
            <Bold className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Bold</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className={itemCls(editor.isActive("italic"))}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            aria-label="Italic"
          >
            <Italic className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Italic</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className={itemCls(editor.isActive("strike"))}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            aria-label="Strikethrough"
          >
            <Strikethrough className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Strikethrough</TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="mx-2 h-6" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className={itemCls(editor.isActive("heading", { level: 1 }))}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            aria-label="Heading 1"
          >
            H1
          </Button>
        </TooltipTrigger>
        <TooltipContent>Heading 1</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className={itemCls(editor.isActive("heading", { level: 2 }))}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            aria-label="Heading 2"
          >
            H2
          </Button>
        </TooltipTrigger>
        <TooltipContent>Heading 2</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className={itemCls(editor.isActive("heading", { level: 3 }))}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            aria-label="Heading 3"
          >
            H3
          </Button>
        </TooltipTrigger>
        <TooltipContent>Heading 3</TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="mx-2 h-6" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className={itemCls(editor.isActive("bulletList"))}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            aria-label="Bullet list"
          >
            <List className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Bullet list</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className={itemCls(editor.isActive("orderedList"))}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            aria-label="Ordered list"
          >
            <ListOrdered className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Ordered list</TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="mx-2 h-6" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className={itemCls(editor.isActive("blockquote"))}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            aria-label="Quote"
          >
            <Quote className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Quote</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className={itemCls(editor.isActive("codeBlock"))}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            aria-label="Code block"
          >
            <Code className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Code block</TooltipContent>
      </Tooltip>
    </div>
  );
}

const defaultDoc = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 1 },
      content: [{ type: "text", text: "Welcome 👋" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Start capturing your ideas here. Use H1/H2/H3, lists, quotes, and code blocks.",
        },
      ],
    },
  ],
};
