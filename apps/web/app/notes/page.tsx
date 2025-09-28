"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Separator } from "@workspace/ui/components/separator";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@workspace/ui/components/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { Label } from "@workspace/ui/components/label";
import { Badge } from "@workspace/ui/components/badge";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { NoteEditor, Toolbar } from "../../components/note-editor";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Heading from "@tiptap/extension-heading";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import Blockquote from "@tiptap/extension-blockquote";
import CodeBlock from "@tiptap/extension-code-block";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Link from "@tiptap/extension-link";

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
import {
  Trash2,
  Plus,
  Sparkles,
  Menu,
  Save,
  LogOut,
  Edit,
  User,
  Loader2,
  AlertTriangle,
  UserPlus,
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  Moon,
  Sun,
  MoreHorizontal,
  Copy,
  Eye,
  EyeOff,
  Shuffle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@workspace/ui/components/tooltip";
import { cn } from "@workspace/ui/lib/utils";
import { toast } from "sonner";
import Confetti from "react-confetti";
import { useTheme } from "next-themes";

// TanStack Query imports
import {
  useNotes,
  useTenant,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
  useUpgradeTenant,
  useInviteUser,
  useNote,
  type Note,
  type Tenant,
  type User as UserType,
} from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

// Utility functions
function generateRandomPassword(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

function copyToClipboard(text: string): void {
  navigator.clipboard.writeText(text);
}

// --- Utility Hook ---
// A simple React hook to get the current window dimensions for the confetti effect.
function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const handleResize = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    handleResize(); // Set initial size
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return size;
}

// --- Main Dashboard Component ---
export default function NotesDashboard() {
  const router = useRouter();

  // User state
  const [user, setUser] = useState<UserType | null>(null);

  // TanStack Query hooks
  const {
    data: notesData,
    isLoading: notesLoading,
    error: notesError,
  } = useNotes();
  const { data: tenantData, isLoading: tenantLoading } = useTenant();

  // TanStack Query mutations
  const createNoteMutation = useCreateNote();
  const updateNoteMutation = useUpdateNote();
  const deleteNoteMutation = useDeleteNote();
  const upgradeTenantMutation = useUpgradeTenant();
  const inviteUserMutation = useInviteUser();

  // Get query client for manual invalidation
  const queryClient = useQueryClient();

  // Derived data
  const notes = notesData || [];
  const tenant = tenantData || {
    slug: "tenant",
    plan: "FREE",
    noteCount: 0,
    limit: 3,
  };

  // State for managing the currently selected note
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // State for delete confirmation
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);

  // State for create/edit forms
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [invitePassword, setInvitePassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [error, setError] = useState("");

  // Function to update a note in the local notes array
  const updateNoteInList = (noteId: string, updates: Partial<Note>) => {
    // TanStack Query handles cache invalidation automatically
  };

  // State for the confetti and mobile sheet
  const [showConfetti, setShowConfetti] = useState(false);
  // Controls fade transition for confetti overlay (so it doesn't disappear abruptly)
  const [confettiFading, setConfettiFading] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { width, height } = useWindowSize();
  // Refs to hold confetti timers so we can clear them if needed
  const confettiTimers = useRef<{ fade: number | null; hide: number | null }>({
    fade: null,
    hide: null,
  });

  // Token validation and user setup effect
  useEffect(() => {
    const token = localStorage.getItem("auth:token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    try {
      const parts = token.split(".");
      if (parts.length !== 3 || !parts[1]) throw new Error("Invalid token");
      const payload = JSON.parse(atob(parts[1]));

      // Check if token is expired
      const currentTime = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp <= currentTime) {
        throw new Error("Token expired");
      }

      setUser({
        role: payload.role,
        tenantSlug: payload.tenantSlug,
        tenantPlan: payload.tenantPlan,
      });
    } catch {
      localStorage.removeItem("auth:token");
      router.push("/auth/login");
      return;
    }
  }, [router]);

  // Automatically select the first note if none is selected and there are notes
  useEffect(() => {
    if (!selectedId && notes.length > 0) {
      setSelectedId(notes[0]!.id);
    }
  }, [notes, selectedId]);

  // Derived state to determine if the user has hit their note limit.
  const limitReached = useMemo(() => {
    if (tenantLoading || tenant.plan === "PRO" || tenant.limit === null)
      return false;
    return tenant.noteCount >= tenant.limit;
  }, [tenant, tenantLoading]);

  // Check if user can upgrade (admin and free plan and at limit)
  const canUpgrade = useMemo(() => {
    return (
      user?.role === "admin" && user?.tenantPlan === "free" && limitReached
    );
  }, [user, limitReached]);

  // Handlers for creating, deleting, and selecting notes.
  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (limitReached) {
      toast.error("Upgrade to Pro to create more notes.");
      return;
    }
    const noteData = {
      title: newTitle,
      content: {
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
      },
    };

    // Close dialog and clear form immediately for optimistic UX
    setShowCreateForm(false);
    setNewTitle("");
    setError("");

    try {
      const result = (await toast.promise(
        createNoteMutation.mutateAsync(noteData),
        {
          loading: "Creating note...",
          success: "Note created successfully",
          error: "Failed to create note",
        }
      )) as unknown as Note;
      setSelectedId(result.id);
      setIsSheetOpen(false);
    } catch (err) {
      //
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setEditTitle(note.title);
    setShowEditForm(true);
  };

  const handleUpdateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote) return;
    const noteData = { title: editTitle, content: editingNote.content };

    // Close dialog and clear form immediately for optimistic UX
    setShowEditForm(false);
    setEditingNote(null);
    setEditTitle("");
    setError("");

    try {
      await toast.promise(
        updateNoteMutation.mutateAsync({ id: editingNote.id, data: noteData }),
        {
          loading: "Updating note...",
          success: "Note updated successfully",
          error: "Failed to update note",
        }
      );
      updateNoteInList(editingNote.id, {
        title: editTitle,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      //
    }
  };

  const handleDeleteNote = async (id: string) => {
    setDeleteNoteId(id);
  };

  const confirmDeleteNote = async () => {
    if (!deleteNoteId) return;
    try {
      await toast.promise(deleteNoteMutation.mutateAsync(deleteNoteId), {
        loading: "Deleting note...",
        success: "Note deleted successfully",
        error: "Failed to delete note",
      });
      const remaining = (notes || []).filter((n: any) => n.id !== deleteNoteId);
      setSelectedId(remaining[0]?.id || null);
    } catch (err) {
      //
    }
    setDeleteNoteId(null);
  };

  const handleSelectNote = (id: string) => {
    setSelectedId(id);
    setIsSheetOpen(false); // Close mobile sheet on selection.
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await inviteUserMutation.mutateAsync({
        email: inviteEmail,
        role: inviteRole,
        password: invitePassword || undefined,
      });

      toast.success(`User ${inviteEmail} invited successfully!`);

      // Copy password to clipboard if it was generated or provided
      if (result.password) {
        copyToClipboard(result.password);
        toast.success("Password copied to clipboard!");
      }

      setShowInviteForm(false);
      setInviteEmail("");
      setInviteRole("member");
      setInvitePassword("");
      setShowPassword(false);
    } catch (err: any) {
      toast.error("Failed to invite user");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("auth:token");
    router.push("/auth/login");
  };

  // Handler for the upgrade process.
  const upgradingRef = useRef(false);
  const onUpgrade = async () => {
    if (upgradingRef.current) return;
    upgradingRef.current = true;
    try {
      await toast.promise(upgradeTenantMutation.mutateAsync(tenant.slug), {
        loading: "Upgrading to Pro...",
        success: "Upgraded to Pro successfully!",
        error: "Upgrade failed to process.",
      });
      // Update user state to reflect pro plan
      setUser(prevUser =>
        prevUser ? { ...prevUser, tenantPlan: "pro" } : null
      );
      // Invalidate tenant query to get updated data
      queryClient.invalidateQueries({ queryKey: ["tenant"] });

      // 🎊 Show confetti and fade it out smoothly before hiding.
      const DURATION = 6000; // total confetti duration
      const FADE_MS = 1000; // fade duration at the end
      // Clear any existing timers
      if (confettiTimers.current.fade)
        clearTimeout(confettiTimers.current.fade);
      if (confettiTimers.current.hide)
        clearTimeout(confettiTimers.current.hide);

      setConfettiFading(false);
      setShowConfetti(true);
      // Schedule fade to start shortly before the end
      confettiTimers.current.fade = setTimeout(
        () => setConfettiFading(true),
        DURATION - FADE_MS
      ) as unknown as number;
      // Hide after the full duration
      confettiTimers.current.hide = setTimeout(() => {
        setShowConfetti(false);
        setConfettiFading(false);
      }, DURATION) as unknown as number;
    } catch (err) {
      //
    }
    upgradingRef.current = false;
  };

  // Clean up confetti timers when component unmounts
  useEffect(() => {
    return () => {
      if (confettiTimers.current.fade)
        clearTimeout(confettiTimers.current.fade);
      if (confettiTimers.current.hide)
        clearTimeout(confettiTimers.current.hide);
    };
  }, []);

  return (
    <>
      {/* Confetti overlay with smooth fade-out transition */}
      {showConfetti && (
        <div
          className={`pointer-events-none fixed inset-0 z-40 transition-opacity duration-700 ${
            confettiFading ? "opacity-0" : "opacity-100"
          }`}
        >
          <Confetti
            width={width}
            height={height}
            recycle={false}
            numberOfPieces={400}
            gravity={0.15}
            colors={[
              "#10b981",
              "#3b82f6",
              "#8b5cf6",
              "#f59e0b",
              "#ef4444",
              "#ec4899",
            ]}
            tweenDuration={3000}
          />
        </div>
      )}

      {/* Create Note Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Note</DialogTitle>
            <DialogDescription>
              Add a new note to your collection.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateNote} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter note title"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateForm(false)}
                disabled={createNoteMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createNoteMutation.isPending}>
                {createNoteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Note"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Note Dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
            <DialogDescription>Update your note title.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateNote} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editTitle">Title</Label>
              <Input
                id="editTitle"
                placeholder="Enter note title"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditForm(false)}
                disabled={updateNoteMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateNoteMutation.isPending}>
                {updateNoteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Note"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invite User Dialog */}
      {user?.role === "admin" && (
        <Dialog open={showInviteForm} onOpenChange={setShowInviteForm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
              <DialogDescription>
                Add a new user to your tenant organization.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInviteUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inviteEmail">Email</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  placeholder="Enter user email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              <div className="w-full space-y-2">
                <Label htmlFor="inviteRole">Role</Label>
                <Select
                  value={inviteRole}
                  onValueChange={value =>
                    setInviteRole(value as "admin" | "member")
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="invitePassword">Password (Optional)</Label>
                  <button
                    type="button"
                    className="text-primary h-auto cursor-pointer p-0 text-sm font-bold"
                    onClick={() => setInvitePassword(generateRandomPassword())}
                  >
                    Generate
                  </button>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="invitePassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Leave empty to generate random password"
                      value={invitePassword}
                      onChange={e => setInvitePassword(e.target.value)}
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Toggle password visibility
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!invitePassword}
                        onClick={() => {
                          copyToClipboard(invitePassword);
                          toast.success("Password copied to clipboard!");
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy password</TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-muted-foreground text-xs">
                  If no password is provided, a secure random password will be
                  generated and copied to your clipboard.
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowInviteForm(false);
                    setInviteEmail("");
                    setInviteRole("member");
                    setInvitePassword("");
                    setShowPassword(false);
                  }}
                  disabled={inviteUserMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={inviteUserMutation.isPending}>
                  {inviteUserMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Inviting...
                    </>
                  ) : (
                    "Invite User"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Error Alert */}
      {error && (
        <Alert className="mb-6" variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex min-h-svh w-full">
        {/* Permanent Sidebar for medium screens and up (desktops) */}
        <aside className="bg-card hidden w-72 shrink-0 flex-col border-r md:flex">
          <SidebarContent
            notes={notes}
            notesLoading={notesLoading}
            notesError={notesError}
            tenant={tenant}
            user={user}
            tenantLoading={tenantLoading}
            limitReached={limitReached}
            selectedId={selectedId}
            onSelectNote={handleSelectNote}
            onCreateNote={() => setShowCreateForm(true)}
            onEditNote={handleEditNote}
            onDeleteNote={handleDeleteNote}
            onConfirmDelete={confirmDeleteNote}
            onInviteUser={() => setShowInviteForm(true)}
            onUpgrade={onUpgrade}
            onLogout={handleLogout}
            deleteNoteId={deleteNoteId}
            setDeleteNoteId={setDeleteNoteId}
            deleteNotePending={deleteNoteMutation.isPending}
          />
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <Topbar
            limitReached={limitReached}
            canUpgrade={canUpgrade}
            onUpgrade={onUpgrade}
            tenant={tenant}
            user={user}
            tenantLoading={tenantLoading}
            onOpenSheet={() => setIsSheetOpen(!isSheetOpen)}
            isSheetOpen={isSheetOpen}
            onLogout={handleLogout}
          >
            {/* Mobile Sheet (Drawer) that contains the sidebar content */}
            <SheetContent side="left" className="w-72 gap-0 p-0">
              <SidebarContent
                notes={notes}
                notesLoading={notesLoading}
                notesError={notesError}
                tenant={tenant}
                user={user}
                tenantLoading={tenantLoading}
                limitReached={limitReached}
                selectedId={selectedId}
                onSelectNote={handleSelectNote}
                onCreateNote={() => setShowCreateForm(true)}
                onEditNote={handleEditNote}
                onDeleteNote={handleDeleteNote}
                onConfirmDelete={confirmDeleteNote}
                onInviteUser={() => setShowInviteForm(true)}
                onUpgrade={onUpgrade}
                onLogout={handleLogout}
                deleteNoteId={deleteNoteId}
                setDeleteNoteId={setDeleteNoteId}
                deleteNotePending={deleteNoteMutation.isPending}
              />
            </SheetContent>
          </Topbar>
          <Separator />
          <div className="min-w-0 flex-1">
            {selectedId ? (
              <NoteEditorContainer
                noteId={selectedId}
                onNoteUpdate={updateNoteInList}
              />
            ) : (
              <div className="grid h-full place-items-center">
                <div className="text-center">
                  <p className="text-muted-foreground text-sm">
                    Select or create a note
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

// --- Reusable Sidebar Component ---
// This component contains the entire sidebar UI, so it can be used in both
// the permanent desktop sidebar and the mobile slide-out sheet.
function SidebarContent({
  notes,
  notesLoading,
  notesError,
  tenant,
  user,
  tenantLoading,
  limitReached,
  selectedId,
  onSelectNote,
  onCreateNote,
  onEditNote,
  onDeleteNote,
  onConfirmDelete,
  onInviteUser,
  onUpgrade,
  onLogout,
  deleteNoteId,
  setDeleteNoteId,
  deleteNotePending,
}: any) {
  // Show skeleton loading when either tenant or notes are loading
  const isLoading = tenantLoading || notesLoading;

  if (isLoading) {
    return (
      <>
        <div className="min-w-0 p-3">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>

        <div className="space-y-2 px-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
        <Separator />

        <div className="flex-1 space-y-2 px-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>

        <div className="border-t p-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-full" />
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="min-w-0 p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="truncate text-pretty text-xl font-medium">
                {tenant?.slug}
              </span>
              <Badge
                variant="secondary"
                className="px-1.5 py-0.5 text-xs font-medium"
              >
                {tenant?.plan?.toLowerCase() === "free" ? "Free" : "Pro"}
              </Badge>
            </div>
            <p className="text-muted-foreground truncate text-xs">
              {tenant?.plan === "FREE" && tenant?.limit !== null
                ? `${tenant?.noteCount} / ${tenant?.limit} Notes`
                : `${tenant?.noteCount || 0} Notes`}
            </p>
          </div>
        </div>
      </div>

      {limitReached && user?.role === "admin" && (
        <UpgradeBanner onUpgrade={onUpgrade} />
      )}
      <Separator className="mb-4 mt-1" />
      <div className="flex flex-col gap-2 px-2">
        <Button
          size="sm"
          onClick={onCreateNote}
          disabled={limitReached}
          variant="default"
          className="w-full"
        >
          <Plus className="mr-1.5 size-4" />
          New Note
        </Button>
        {user?.role === "admin" && (
          <Button
            size="sm"
            onClick={onInviteUser}
            variant="outline"
            className="w-full"
          >
            <UserPlus className="mr-1.5 size-4" />
            Invite User
          </Button>
        )}
      </div>
      <Separator className="my-4" />

      <ScrollArea className="flex-1">
        <nav className="space-y-1 px-2 pb-2">
          {notesError && (
            <p className="text-destructive px-2 py-1.5 text-xs">
              Failed to load notes
            </p>
          )}
          {(notes || []).map((note: Note) => (
            <button
              key={note.id}
              className={cn(
                "hover:bg-accent/70 group w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2",
                selectedId === note.id && "bg-accent"
              )}
              onClick={() => onSelectNote(note.id)}
              aria-current={selectedId === note.id ? "page" : undefined}
            >
              <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                <span className="truncate">{note.title || "Untitled"}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground opacity-0 transition-all focus:ring-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                      onClick={e => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={e => {
                        e.stopPropagation();
                        onEditNote(note);
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={e => {
                        e.stopPropagation();
                        onDeleteNote(note.id);
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </button>
          ))}
        </nav>
      </ScrollArea>
      {/* Sidebar footer - upgrade widget shown at the bottom of the sidebar */}
      <div className="border-t p-3">
        <UpgradeFooter
          tenant={tenant}
          onUpgrade={onUpgrade}
          user={user}
          onLogout={onLogout}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteNoteId}
        onOpenChange={() => setDeleteNoteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "
              {notes?.find((n: Note) => n.id === deleteNoteId)?.title ||
                "Untitled"}
              "? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteNotePending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={onConfirmDelete}
              disabled={deleteNotePending}
            >
              {deleteNotePending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// --- User Menu Component ---
function UserMenu({ user, tenant, onLogout, onUpgrade }: any) {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="hover:bg-accent h-auto w-full justify-start p-2"
        >
          <div className="flex w-full items-center gap-2">
            <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-lg">
              <User className="h-4 w-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              {user?.role === "admin" ? "Admin" : "Member"}
              {" • "}
              {tenant?.slug || "Tenant"}
              <span className="truncate text-xs font-medium">
                {tenant?.email || "User"}
              </span>
            </div>
            <ChevronsUpDown className="ml-auto size-4" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-lg">
              <User className="h-4 w-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">
                {tenant?.email || "User"}
              </span>
              <span className="truncate text-xs">
                {user?.role === "admin" ? "Admin" : "Member"} •{" "}
                {user?.tenantPlan === "pro" ? "Pro" : "Free"}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user?.tenantPlan !== "pro" && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={onUpgrade}>
                <Sparkles className="mr-2 h-4 w-4" />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? (
              <Moon className="mr-2 h-4 w-4" />
            ) : (
              <Sun className="mr-2 h-4 w-4" />
            )}
            Switch to {theme === "light" ? "dark" : "light"} theme
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// --- Upgrade Footer Component ---
function UpgradeFooter({ tenant, onUpgrade, user, onLogout }: any) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <UserMenu
          user={user}
          tenant={tenant}
          onLogout={onLogout}
          onUpgrade={onUpgrade}
        />
      </div>
    </div>
  );
}

// --- Topbar Component ---
// The header of the main content area, containing the mobile menu and upgrade button.
function Topbar({
  limitReached,
  canUpgrade,
  onUpgrade,
  tenant,
  user,
  tenantLoading,
  children,
  onOpenSheet,
  isSheetOpen,
  onLogout,
}: any) {
  return (
    <header className="bg-card flex w-full items-center justify-between px-3 py-2 md:hidden">
      {/* Mobile Menu Button */}
      <Sheet open={isSheetOpen} onOpenChange={onOpenSheet}>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline">
            <Menu className="size-4" />
          </Button>
        </SheetTrigger>
        {children} {/* The SheetContent is passed as a child */}
      </Sheet>

      {/* Tenant info */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="truncate text-pretty text-sm font-medium">
            {tenant?.slug}
          </span>
          <Badge
            variant="secondary"
            className="px-1.5 py-0.5 text-xs font-medium"
          >
            {tenant?.plan?.toLowerCase() === "free" ? "Free" : "Pro"}
          </Badge>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {tenantLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          canUpgrade && (
            <Button size="sm" onClick={onUpgrade} variant="secondary">
              <Sparkles className="mr-1.5 size-4" />
              Upgrade
            </Button>
          )
        )}
      </div>
    </header>
  );
}

// --- Upgrade Banner Component ---
// A small banner shown in the sidebar when the user hits their note limit.
function UpgradeBanner({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="bg-muted mx-3 mb-3 rounded-md border p-3">
      <p className="text-xs">
        You’ve reached the Free plan limit. Upgrade to Pro for unlimited notes.
      </p>
      <div className="mt-2">
        <Button size="sm" onClick={onUpgrade} className="w-full">
          <Sparkles className="mr-1.5 size-4" />
          Upgrade to Pro
        </Button>
      </div>
    </div>
  );
}

// --- Note Editor Component ---
// This component fetches and displays the content of the selected note.
function NoteEditorContainer({
  noteId,
  onNoteUpdate,
}: {
  noteId: string;
  onNoteUpdate: (noteId: string, updates: Partial<Note>) => void;
}) {
  const { data: noteData, isLoading, error } = useNote(noteId);
  const updateNoteMutation = useUpdateNote();

  const note = noteData;
  const [currentTitle, setCurrentTitle] = useState(note?.title || "");
  const [currentContent, setCurrentContent] = useState<any>(
    note?.content || null
  );
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleEditorUpdate = useCallback(() => {
    setDirty(true);
  }, []);

  const editor = useEditor({
    content: defaultDoc,
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      Heading.configure({ levels: [1, 2, 3] }),
      BulletList,
      OrderedList,
      Blockquote,
      CodeBlock,
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
    ],
    editorProps: {
      attributes: {
        class:
          "prose prose-sm md:prose-base max-w-none py-6 px-4 md:px-6 text-foreground",
      },
    },
    onUpdate: handleEditorUpdate,
  });

  // Update local state when note data changes
  useEffect(() => {
    if (note) {
      setCurrentTitle(note.title);
      setCurrentContent(note.content);
      setDirty(false);
      if (editor) {
        editor.commands.setContent(note.content, false);
      }
    }
  }, [note, editor]);

  // Save to API
  const saveToAPI = useCallback(
    async (data: { title?: string; content?: any }) => {
      const contentToSave = data.content || editor?.getJSON();
      setSaving(true);
      try {
        await toast.promise(
          updateNoteMutation.mutateAsync({
            id: noteId,
            data: { ...data, content: contentToSave },
          }),
          {
            loading: "Saving note...",
            success: "Note saved!",
            error: "Failed to save note.",
          }
        );
        const updates: Partial<Note> = {
          updated_at: new Date().toISOString(),
        };
        if (data.title !== undefined) updates.title = data.title;
        onNoteUpdate(noteId, updates);
        setDirty(false);
      } catch (err) {
        //
      } finally {
        setSaving(false);
      }
    },
    [noteId, onNoteUpdate, updateNoteMutation, editor]
  );

  // Handler for title changes. Updates local state and marks as dirty.
  const onTitleChange = (newTitle: string) => {
    setCurrentTitle(newTitle);
    setDirty(true);
  };

  // Manual save handler
  const handleManualSave = async () => {
    await saveToAPI({ title: currentTitle });
  };

  // Prevent closing window with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    if (dirty) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    } else {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    }

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  // Keyboard shortcut for save (Ctrl+S / Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (dirty && !saving) {
          handleManualSave();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dirty, saving, handleManualSave]);

  if (isLoading) {
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
        disabled={!dirty}
        saving={saving}
      />
      <ScrollArea className="h-[calc(100vh-100px)] md:h-[calc(100vh-50px)]">
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
}
