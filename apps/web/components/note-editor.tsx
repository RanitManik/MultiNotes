import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@workspace/ui/components/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
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
  Save,
  ListChecks,
  Link,
} from "lucide-react";
// @ts-ignore
import "./note-styles.css";

export function Toolbar({
  editor,
  onSave,
  disabled,
  saving,
}: {
  editor: any;
  onSave: () => void;
  disabled: boolean;
  saving: boolean;
}) {
  const [linkUrl, setLinkUrl] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  useEffect(() => {
    if (isPopoverOpen) {
      const attrs = editor.getAttributes("link");
      setLinkUrl(attrs.href || "");
    }
  }, [isPopoverOpen, editor]);

  if (!editor) return null;
  const itemCls = (active: boolean) =>
    // Use tokens, avoid direct colors
    "h-8 px-2 text-xs border rounded-md " +
    (active ? "bg-accent" : "bg-card hover:bg-accent/60");

  return (
    <div className="flex w-full items-center justify-between border-b px-3 py-2">
      <div className="relative flex items-center gap-1 overflow-x-auto">
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
        <Separator orientation="vertical" className="mx-2 h-5" />
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
        <Separator orientation="vertical" className="mx-2 h-5" />
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
        <Separator orientation="vertical" className="mx-2 h-5" />
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
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className={itemCls(editor.isActive("taskList"))}
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              aria-label="Task list"
            >
              <ListChecks className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Task list</TooltipContent>
        </Tooltip>
        <Separator orientation="vertical" className="mx-2 h-5" />
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
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className={itemCls(editor.isActive("link"))}
                  aria-label="Link"
                >
                  <Link className="size-4" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>Link</TooltipContent>
          </Tooltip>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="link-url">URL</Label>
                <Input
                  id="link-url"
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    editor.chain().focus().unsetLink().run();
                    setIsPopoverOpen(false);
                  }}
                >
                  Remove
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    if (linkUrl) {
                      editor.chain().focus().setLink({ href: linkUrl }).run();
                    }
                    setIsPopoverOpen(false);
                  }}
                >
                  Set Link
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <Button
        size="sm"
        onClick={onSave}
        disabled={disabled || saving}
        variant="default"
      >
        <Save className="mr-1.5 size-4" />
        {saving ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}

export function NoteEditor({ editor }: { editor: any }) {
  if (!editor) return null;

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <div className="mx-auto max-w-4xl">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

const defaultDoc = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Start writing your note here...",
        },
      ],
    },
  ],
};
