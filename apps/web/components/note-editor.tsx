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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@workspace/ui/components/dropdown-menu";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Code2,
  Undo,
  Redo,
  Save,
  ListChecks,
  Link,
  MoreHorizontal,
  Heading,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  Underline,
  Superscript,
  Subscript,
  ChevronDown,
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
  const [isHighlightPopoverOpen, setIsHighlightPopoverOpen] = useState(false);

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
      <div className="mx-auto">
        <div className="flex items-center justify-center gap-1.5">
          {/* Essential buttons always visible */}
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

          <div className="bg-border mx-1 h-5 w-px" />

          {/* Headings dropdown */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={itemCls(editor.isActive("heading"))}
                    aria-label="Headings"
                    style={{ width: "36px", gap: "1px" }}
                  >
                    {editor.isActive("heading", { level: 1 }) ? (
                      <span
                        className={`text-xs font-bold ${editor.isActive("heading") ? "text-primary" : ""}`}
                      >
                        H1
                      </span>
                    ) : editor.isActive("heading", { level: 2 }) ? (
                      <span
                        className={`text-xs font-bold ${editor.isActive("heading") ? "text-primary" : ""}`}
                      >
                        H2
                      </span>
                    ) : editor.isActive("heading", { level: 3 }) ? (
                      <span
                        className={`text-xs font-bold ${editor.isActive("heading") ? "text-primary" : ""}`}
                      >
                        H3
                      </span>
                    ) : (
                      <Heading
                        className={`size-4 ${editor.isActive("heading") ? "text-primary" : ""}`}
                      />
                    )}
                    <ChevronDown className="ml-0 size-2 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Headings</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 1 }).run()
                }
              >
                Heading 1
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
              >
                Heading 2
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 3 }).run()
                }
              >
                Heading 3
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* List Dropdown */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={itemCls(
                      editor.isActive("bulletList") ||
                        editor.isActive("orderedList") ||
                        editor.isActive("taskList")
                    )}
                    aria-label="Lists"
                    style={{ width: "36px", gap: "1px" }}
                  >
                    {editor.isActive("bulletList") ? (
                      <List
                        className={`size-4 ${editor.isActive("bulletList") ? "text-primary" : ""}`}
                      />
                    ) : editor.isActive("orderedList") ? (
                      <ListOrdered
                        className={`size-4 ${editor.isActive("orderedList") ? "text-primary" : ""}`}
                      />
                    ) : editor.isActive("taskList") ? (
                      <ListChecks
                        className={`size-4 ${editor.isActive("taskList") ? "text-primary" : ""}`}
                      />
                    ) : (
                      <List
                        className={`size-4 ${editor.isActive("bulletList") || editor.isActive("orderedList") || editor.isActive("taskList") ? "text-primary" : ""}`}
                      />
                    )}
                    <ChevronDown className="ml-0 size-2 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Lists</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={() => editor.chain().focus().toggleBulletList().run()}
              >
                <List className="mr-2 size-4" />
                Bullet List
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
              >
                <ListOrdered className="mr-2 size-4" />
                Numbered List
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().toggleTaskList().run()}
              >
                <ListChecks className="mr-2 size-4" />
                Task List
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Blockquote */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className={itemCls(editor.isActive("blockquote"))}
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                aria-label="Quote"
              >
                <Quote
                  className={`size-4 ${editor.isActive("blockquote") ? "text-primary" : ""}`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Quote</TooltipContent>
          </Tooltip>

          {/* Code Block */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className={itemCls(editor.isActive("codeBlock"))}
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                aria-label="Code Block"
              >
                <Code2
                  className={`size-4 ${editor.isActive("codeBlock") ? "text-primary" : ""}`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Code Block</TooltipContent>
          </Tooltip>

          <div className="bg-border mx-1 h-5 w-px" />

          {/* Bold */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className={itemCls(editor.isActive("bold"))}
                onClick={() => editor.chain().focus().toggleBold().run()}
                aria-label="Bold"
              >
                <Bold
                  className={`size-4 ${editor.isActive("bold") ? "text-primary" : ""}`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bold</TooltipContent>
          </Tooltip>

          {/* Italic */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className={itemCls(editor.isActive("italic"))}
                onClick={() => editor.chain().focus().toggleItalic().run()}
                aria-label="Italic"
              >
                <Italic
                  className={`size-4 ${editor.isActive("italic") ? "text-primary" : ""}`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Italic</TooltipContent>
          </Tooltip>

          {/* Strikethrough */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className={itemCls(editor.isActive("strike"))}
                onClick={() => editor.chain().focus().toggleStrike().run()}
                aria-label="Strikethrough"
              >
                <Strikethrough
                  className={`size-4 ${editor.isActive("strike") ? "text-primary" : ""}`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Strikethrough</TooltipContent>
          </Tooltip>

          {/* Inline Code */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className={itemCls(editor.isActive("code"))}
                onClick={() => editor.chain().focus().toggleCode().run()}
                aria-label="Inline Code"
              >
                <Code
                  className={`size-4 ${editor.isActive("code") ? "text-primary" : ""}`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Inline Code</TooltipContent>
          </Tooltip>

          {/* Underline */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className={itemCls(editor.isActive("underline"))}
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                aria-label="Underline"
              >
                <Underline
                  className={`size-4 ${editor.isActive("underline") ? "text-primary" : ""}`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Underline</TooltipContent>
          </Tooltip>

          {/* Highlight with color picker */}
          <Popover
            open={isHighlightPopoverOpen}
            onOpenChange={setIsHighlightPopoverOpen}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={itemCls(editor.isActive("highlight"))}
                    aria-label="Highlight"
                  >
                    <Highlighter
                      className={`size-4 ${editor.isActive("highlight") ? "text-primary" : ""}`}
                    />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>Highlight</TooltipContent>
            </Tooltip>
            <PopoverContent className="w-64">
              <div className="space-y-4">
                <Label>Highlight Color</Label>
                <div className="grid grid-cols-6 gap-2">
                  {[
                    "#fef3c7", // light yellow
                    "#fde68a", // yellow
                    "#fcd34d", // amber
                    "#f87171", // red
                    "#fb7185", // pink
                    "#a78bfa", // purple
                    "#60a5fa", // blue
                    "#34d399", // emerald
                    "#6b7280", // gray
                    "#000000", // black
                  ].map(color => (
                    <button
                      key={color}
                      className="hover:border-ring h-8 w-8 rounded border-2 border-transparent transition-colors"
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        editor.chain().focus().toggleHighlight({ color }).run();
                        setIsHighlightPopoverOpen(false);
                      }}
                    />
                  ))}
                </div>
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      editor.chain().focus().unsetHighlight().run();
                      setIsHighlightPopoverOpen(false);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Link */}
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
                    <Link
                      className={`size-4 ${editor.isActive("link") ? "text-primary" : ""}`}
                    />
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

          <div className="bg-border mx-1 h-5 w-px" />

          {/* Superscript/Subscript */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className={itemCls(editor.isActive("superscript"))}
                onClick={() => {
                  if (editor.can().toggleSuperscript?.()) {
                    editor.chain().focus().toggleSuperscript().run();
                  }
                }}
                aria-label="Superscript"
              >
                <Superscript
                  className={`size-4 ${editor.isActive("superscript") ? "text-primary" : ""}`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Superscript</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className={itemCls(editor.isActive("subscript"))}
                onClick={() => {
                  if (editor.can().toggleSubscript?.()) {
                    editor.chain().focus().toggleSubscript().run();
                  }
                }}
                aria-label="Subscript"
              >
                <Subscript
                  className={`size-4 ${editor.isActive("subscript") ? "text-primary" : ""}`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Subscript</TooltipContent>
          </Tooltip>

          <div className="bg-border mx-0.5 h-5 w-px" />

          {/* Alignment buttons */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className={itemCls(editor.isActive({ textAlign: "left" }))}
                onClick={() =>
                  editor.chain().focus().setTextAlign("left").run()
                }
                aria-label="Align Left"
              >
                <AlignLeft
                  className={`size-4 ${editor.isActive({ textAlign: "left" }) ? "text-primary" : ""}`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Align Left</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className={itemCls(editor.isActive({ textAlign: "center" }))}
                onClick={() =>
                  editor.chain().focus().setTextAlign("center").run()
                }
                aria-label="Align Center"
              >
                <AlignCenter
                  className={`size-4 ${editor.isActive({ textAlign: "center" }) ? "text-primary" : ""}`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Align Center</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className={itemCls(editor.isActive({ textAlign: "right" }))}
                onClick={() =>
                  editor.chain().focus().setTextAlign("right").run()
                }
                aria-label="Align Right"
              >
                <AlignRight
                  className={`size-4 ${editor.isActive({ textAlign: "right" }) ? "text-primary" : ""}`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Align Right</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className={itemCls(editor.isActive({ textAlign: "justify" }))}
                onClick={() =>
                  editor.chain().focus().setTextAlign("justify").run()
                }
                aria-label="Justify"
              >
                <AlignJustify
                  className={`size-4 ${editor.isActive({ textAlign: "justify" }) ? "text-primary" : ""}`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Justify</TooltipContent>
          </Tooltip>

          {/* Mobile dropdown menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="ml-2 md:hidden"
                aria-label="More formatting options"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem
                onClick={() => editor.chain().focus().toggleStrike().run()}
              >
                <Strikethrough className="mr-2 size-4" />
                Strikethrough
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().toggleUnderline().run()}
              >
                <Underline className="mr-2 size-4" />
                Underline
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().toggleHighlight().run()}
              >
                <Highlighter className="mr-2 size-4" />
                Highlight
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 1 }).run()
                }
              >
                H1
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
              >
                H2
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 3 }).run()
                }
              >
                H3
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => editor.chain().focus().toggleBulletList().run()}
              >
                <List className="mr-2 size-4" />
                Bullet List
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
              >
                <ListOrdered className="mr-2 size-4" />
                Numbered List
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().toggleTaskList().run()}
              >
                <ListChecks className="mr-2 size-4" />
                Task List
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().setTextAlign("left").run()
                }
              >
                <AlignLeft className="mr-2 size-4" />
                Align Left
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().setTextAlign("center").run()
                }
              >
                <AlignCenter className="mr-2 size-4" />
                Align Center
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().setTextAlign("right").run()
                }
              >
                <AlignRight className="mr-2 size-4" />
                Align Right
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().setTextAlign("justify").run()
                }
              >
                <AlignJustify className="mr-2 size-4" />
                Justify
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
              >
                <Quote className="mr-2 size-4" />
                Quote
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().toggleCode().run()}
              >
                <Code className="mr-2 size-4" />
                Inline Code
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              >
                <Code2 className="mr-2 size-4" />
                Code Block
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const attrs = editor.getAttributes("link");
                  setLinkUrl(attrs.href || "");
                  setIsPopoverOpen(true);
                }}
              >
                <Link className="mr-2 size-4" />
                Link
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
