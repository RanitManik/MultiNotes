import { useEffect, useState, useRef, useMemo } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { Button } from "@workspace/ui/components/button";
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
  if (!editor) return null;

  const [linkUrl, setLinkUrl] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isHighlightPopoverOpen, setIsHighlightPopoverOpen] = useState(false);

  // --- Start of responsiveness logic ---
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [visibleItemsCount, setVisibleItemsCount] = useState(20); // Start with a high number

  const [updateCounter, setUpdateCounter] = useState(0);

  useEffect(() => {
    if (isPopoverOpen) {
      const attrs = editor.getAttributes("link");
      setLinkUrl(attrs.href || "");
    }
  }, [isPopoverOpen, editor]);

  useEffect(() => {
    const handleUpdate = () => setUpdateCounter(c => c + 1);
    editor.on("update", handleUpdate);
    editor.on("selectionUpdate", handleUpdate);
    return () => {
      editor.off("update", handleUpdate);
      editor.off("selectionUpdate", handleUpdate);
    };
  }, [editor]);

  // This effect observes the toolbar width and calculates how many items can fit
  useEffect(() => {
    const toolbar = toolbarRef.current;
    if (!toolbar) return;

    const observer = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width;
      if (width) {
        // Estimate average width per tool item. Adjust this value if needed.
        const avgItemWidth = 42;
        const count = Math.floor(width / avgItemWidth);
        setVisibleItemsCount(Math.max(0, count)); // Ensure count is not negative
      }
    });

    observer.observe(toolbar);

    return () => {
      observer.disconnect();
    };
  }, []);
  // --- End of responsiveness logic ---

  const itemCls = (active: boolean) =>
    // Use tokens, avoid direct colors
    "h-8 px-2 text-xs border rounded-md " +
    (active
      ? "bg-primary/10 border-primary text-primary"
      : "bg-card hover:bg-accent/60");

  const allTools = useMemo(
    () => [
      {
        id: "undo",
        jsx: (
          <Tooltip key="undo">
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
        ),
        dropdownJsx: (
          <DropdownMenuItem onClick={() => editor.chain().focus().undo().run()}>
            <Undo className="mr-2 size-4" /> Undo
          </DropdownMenuItem>
        ),
      },
      {
        id: "redo",
        jsx: (
          <Tooltip key="redo">
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
        ),
        dropdownJsx: (
          <DropdownMenuItem onClick={() => editor.chain().focus().redo().run()}>
            <Redo className="mr-2 size-4" /> Redo
          </DropdownMenuItem>
        ),
      },
      {
        id: "divider-1",
        jsx: <div key="divider-1" className="bg-border mx-1 h-5 w-px" />,
        dropdownJsx: <DropdownMenuSeparator key="d-sep-1" />,
      },
      {
        id: "headings",
        jsx: (
          <DropdownMenu key="headings">
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
        ),
        dropdownJsx: (
          <>
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
          </>
        ),
      },
      {
        id: "lists",
        jsx: (
          <DropdownMenu key="lists">
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
        ),
        dropdownJsx: (
          <>
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
          </>
        ),
      },
      {
        id: "blockquote",
        jsx: (
          <Tooltip key="blockquote">
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
        ),
        dropdownJsx: (
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote className="mr-2 size-4" />
            Quote
          </DropdownMenuItem>
        ),
      },
      {
        id: "codeblock",
        jsx: (
          <Tooltip key="codeblock">
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
        ),
        dropdownJsx: (
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            <Code2 className="mr-2 size-4" />
            Code Block
          </DropdownMenuItem>
        ),
      },
      {
        id: "divider-2",
        jsx: <div key="divider-2" className="bg-border mx-1 h-5 w-px" />,
        dropdownJsx: <DropdownMenuSeparator key="d-sep-2" />,
      },
      {
        id: "bold",
        jsx: (
          <Tooltip key="bold">
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
        ),
        dropdownJsx: (
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="mr-2 size-4" />
            Bold
          </DropdownMenuItem>
        ),
      },
      {
        id: "italic",
        jsx: (
          <Tooltip key="italic">
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
        ),
        dropdownJsx: (
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="mr-2 size-4" />
            Italic
          </DropdownMenuItem>
        ),
      },
      {
        id: "strike",
        jsx: (
          <Tooltip key="strike">
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
        ),
        dropdownJsx: (
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="mr-2 size-4" />
            Strikethrough
          </DropdownMenuItem>
        ),
      },
      {
        id: "code",
        jsx: (
          <Tooltip key="code">
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
        ),
        dropdownJsx: (
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleCode().run()}
          >
            <Code className="mr-2 size-4" />
            Inline Code
          </DropdownMenuItem>
        ),
      },
      {
        id: "underline",
        jsx: (
          <Tooltip key="underline">
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
        ),
        dropdownJsx: (
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <Underline className="mr-2 size-4" />
            Underline
          </DropdownMenuItem>
        ),
      },
      {
        id: "highlight",
        jsx: (
          <Popover
            key="highlight"
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
                    "#78350f",
                    "#92400e",
                    "#b45309",
                    "#b91c1c",
                    "#9d174d",
                    "#5b21b6",
                    "#1d4ed8",
                    "#065f46",
                    "#374151",
                    "#064e3b",
                    "#312e81",
                    "#000000",
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
        ),
        dropdownJsx: (
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleHighlight().run()}
          >
            <Highlighter className="mr-2 size-4" />
            Highlight
          </DropdownMenuItem>
        ),
      },
      {
        id: "link",
        jsx: (
          <Popover
            key="link"
            open={isPopoverOpen}
            onOpenChange={setIsPopoverOpen}
          >
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
        ),
        dropdownJsx: (
          <DropdownMenuItem
            onClick={() => {
              setIsPopoverOpen(true);
            }}
          >
            <Link className="mr-2 size-4" />
            Link
          </DropdownMenuItem>
        ),
      },
      {
        id: "divider-3",
        jsx: <div key="divider-3" className="bg-border mx-1 h-5 w-px" />,
        dropdownJsx: <DropdownMenuSeparator key="d-sep-3" />,
      },
      {
        id: "superscript",
        jsx: (
          <Tooltip key="superscript">
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
        ),
        dropdownJsx: (
          <DropdownMenuItem
            onClick={() => {
              if (editor.can().toggleSuperscript?.()) {
                editor.chain().focus().toggleSuperscript().run();
              }
            }}
          >
            <Superscript className="mr-2 size-4" />
            Superscript
          </DropdownMenuItem>
        ),
      },
      {
        id: "subscript",
        jsx: (
          <Tooltip key="subscript">
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
        ),
        dropdownJsx: (
          <DropdownMenuItem
            onClick={() => {
              if (editor.can().toggleSubscript?.()) {
                editor.chain().focus().toggleSubscript().run();
              }
            }}
          >
            <Subscript className="mr-2 size-4" />
            Subscript
          </DropdownMenuItem>
        ),
      },
      {
        id: "divider-4",
        jsx: <div key="divider-4" className="bg-border mx-0.5 h-5 w-px" />,
        dropdownJsx: <DropdownMenuSeparator key="d-sep-4" />,
      },
      {
        id: "align-left",
        jsx: (
          <Tooltip key="align-left">
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
        ),
        dropdownJsx: (
          <DropdownMenuItem
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
          >
            <AlignLeft className="mr-2 size-4" />
            Align Left
          </DropdownMenuItem>
        ),
      },
      {
        id: "align-center",
        jsx: (
          <Tooltip key="align-center">
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
        ),
        dropdownJsx: (
          <DropdownMenuItem
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
          >
            <AlignCenter className="mr-2 size-4" />
            Align Center
          </DropdownMenuItem>
        ),
      },
      {
        id: "align-right",
        jsx: (
          <Tooltip key="align-right">
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
        ),
        dropdownJsx: (
          <DropdownMenuItem
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
          >
            <AlignRight className="mr-2 size-4" />
            Align Right
          </DropdownMenuItem>
        ),
      },
      {
        id: "align-justify",
        jsx: (
          <Tooltip key="align-justify">
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
        ),
        dropdownJsx: (
          <DropdownMenuItem
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          >
            <AlignJustify className="mr-2 size-4" />
            Justify
          </DropdownMenuItem>
        ),
      },
    ],
    [editor, isPopoverOpen, isHighlightPopoverOpen, linkUrl, updateCounter]
  );

  const visibleTools = allTools.slice(0, visibleItemsCount);
  const hiddenTools = allTools.slice(visibleItemsCount);

  return (
    <div className="flex w-full items-center gap-2 border-b px-3 py-2">
      {/* Use the full flex-1 container as the measured area so we can center an auto-width toolbar inside it */}
      <div
        ref={toolbarRef}
        className="flex min-w-0 flex-1 items-center justify-start md:justify-center"
      >
        {/* inner toolbar is auto-width so it can be centered by the parent on md+ screens */}
        <div className="toolbar-inner flex items-center gap-1 overflow-hidden">
          {visibleTools.map(tool => tool.jsx)}
          {hiddenTools.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 px-2">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {hiddenTools.map(tool => tool.dropdownJsx)}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      <Button
        size="sm"
        onClick={onSave}
        disabled={disabled || saving}
        variant="default"
        className="flex-shrink-0"
      >
        <Save className="size-4 md:mr-1.5" />
        <span className="hidden md:inline">
          {saving ? "Saving..." : "Save"}
        </span>
      </Button>
    </div>
  );
}

// ... (NoteEditor and defaultDoc components remain unchanged)
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
