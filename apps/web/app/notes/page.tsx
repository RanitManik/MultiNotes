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
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
import { Label } from "@workspace/ui/components/label";
import { Badge } from "@workspace/ui/components/badge";
import { ThemeToggle } from "@workspace/ui/components/theme-toggle";
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
import { NoteEditor } from "../../components/note-editor";
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
import { cn } from "@workspace/ui/lib/utils";
import { toast } from "sonner";
import Confetti from "react-confetti";
import {
  fetchNotes,
  createNote,
  updateNote,
  deleteNote,
  upgradeTenant,
  inviteUser,
  getTenantInfo,
  getNoteById,
} from "../actions/notes";
import { useTheme } from "next-themes";

// --- Type Definitions ---
// Defines the structure for a note item in the list.
type Note = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  content?: string;
  author?: { email: string };
  isOptimistic?: boolean;
};

// Defines the structure for the user's account/tenant information.
type TenantInfo = {
  slug: string;
  plan: "FREE" | "PRO";
  noteCount: number;
  limit: number | null; // null means unlimited notes for PRO plan.
  email?: string | null; // optional user email to display in UI
};

// User type for authentication
type User = {
  role: "admin" | "member";
  tenantSlug: string;
  tenantPlan: "free" | "pro";
};

// Defines the structure for a single note including its content,
// primarily used for local storage.
type LocalNote = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  content: any; // Content can be any JSON structure from the editor.
};

// --- API Service Layer ---
// Real API calls to the backend
const getAuthHeaders = (): Record<string, string> => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth:token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

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

  // State for the list of notes
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [notesLoading, setNotesLoading] = useState(true);
  const [notesError, setNotesError] = useState<Error | null>(null);

  // State for user/tenant information
  const [tenant, setTenant] = useState<TenantInfo>({
    slug: "tenant",
    plan: "FREE",
    noteCount: 0,
    limit: 3,
  });
  const [tenantLoading, setTenantLoading] = useState(true);

  // User state
  const [user, setUser] = useState<User | null>(null);

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
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [error, setError] = useState("");

  // A simple counter to trigger a manual refetch of all data
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const refetchAll = () => setRefetchTrigger(t => t + 1);

  // Function to update a note in the local notes array
  const updateNoteInList = (noteId: string, updates: Partial<Note>) => {
    setNotes(notes =>
      notes
        ? notes.map(n => (n.id === noteId ? { ...n, ...updates } : n))
        : null
    );
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
      router.push("/");
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
      router.push("/");
      return;
    }
  }, [router]);

  // Main data fetching effect. Runs when user is set and when `refetchTrigger` changes.
  useEffect(() => {
    if (!user) return;

    const fetchAllData = async () => {
      setNotesLoading(true);
      setTenantLoading(true);
      try {
        const toastResult = await toast.promise(
          Promise.all([fetchNotes(), getTenantInfo()]),
          {
            loading: "Loading your notes...",
            success: "Notes loaded successfully",
            error: "Failed to load your notes.",
          }
        );
        const [notesData, tenantData] = (toastResult as any)?.unwrap
          ? await (toastResult as any).unwrap()
          : toastResult;
        setNotes(notesData);
        setTenant(tenantData);

        // Automatically select the first note if none is selected and there are notes
        if (!selectedId && notesData.length > 0) {
          setSelectedId(notesData[0]!.id);
        }
        setNotesError(null);
      } catch (err) {
        setNotesError(err as Error);
      } finally {
        setNotesLoading(false);
        setTenantLoading(false);
      }
    };
    fetchAllData();
  }, [refetchTrigger, user]);

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
      },
    };

    // Close dialog and clear form immediately for optimistic UX
    setShowCreateForm(false);
    setNewTitle("");
    setError("");

    const toastResult = await toast.promise(createNote(noteData), {
      loading: "Creating note...",
      success: "Note created successfully",
      error: "Failed to create note",
    });
    const newNote = (toastResult as any)?.unwrap
      ? await (toastResult as any).unwrap()
      : toastResult;
    setSelectedId(newNote.id);
    refetchAll(); // Refresh data to update note count.
    setIsSheetOpen(false); // Close mobile sheet after creating.
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

    await toast.promise(updateNote(editingNote.id, noteData), {
      loading: "Updating note...",
      success: () => {
        updateNoteInList(editingNote.id, {
          title: editTitle,
          updatedAt: new Date().toISOString(),
        });
        return "Note updated successfully";
      },
      error: "Failed to update note",
    });
  };

  const handleDeleteNote = async (id: string) => {
    setDeleteNoteId(id);
  };

  const confirmDeleteNote = async () => {
    if (!deleteNoteId) return;
    await toast.promise(deleteNote(deleteNoteId), {
      loading: "Deleting note...",
      success: () => {
        const remaining = (notes || []).filter(n => n.id !== deleteNoteId);
        setSelectedId(remaining[0]?.id || null); // Select the next note or none.
        refetchAll();
        return "Note deleted successfully";
      },
      error: "Failed to delete note",
    });
    setDeleteNoteId(null);
  };

  const handleSelectNote = (id: string) => {
    setSelectedId(id);
    setIsSheetOpen(false); // Close mobile sheet on selection.
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    await toast.promise(inviteUser({ email: inviteEmail, role: inviteRole }), {
      loading: "Inviting user...",
      success: `User ${inviteEmail} invited successfully!`,
      error: err => {
        setError("Failed to invite user");
        return "Failed to invite user";
      },
    });
    setShowInviteForm(false);
    setInviteEmail("");
    setInviteRole("member");
  };

  const handleLogout = () => {
    localStorage.removeItem("auth:token");
    router.push("/");
  };

  // Handler for the upgrade process.
  const upgradingRef = useRef(false);
  const onUpgrade = async () => {
    if (upgradingRef.current) return;
    upgradingRef.current = true;
    const toastResult = await toast.promise(upgradeTenant(tenant.slug), {
      loading: "Upgrading to Pro...",
      success: result => {
        // Update token with new one containing updated tenant plan
        localStorage.setItem("auth:token", result.token);

        // Decode the new token to update user state
        const parts = result.token.split(".");
        if (parts.length === 3 && parts[1]) {
          const payload = JSON.parse(atob(parts[1]));
          setUser({
            role: payload.role,
            tenantSlug: payload.tenantSlug,
            tenantPlan: payload.tenantPlan,
          });
        }

        // 🎊 Show confetti and fade it out smoothly before hiding.
        const DURATION = 5000; // total confetti duration
        const FADE_MS = 700; // fade duration at the end
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
        refetchAll();
        return "Upgraded to Pro successfully!";
      },
      error: "Upgrade failed to process.",
    });
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
            numberOfPieces={300}
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
              >
                Cancel
              </Button>
              <Button type="submit">Create Note</Button>
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
              >
                Cancel
              </Button>
              <Button type="submit">Update Note</Button>
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
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowInviteForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Invite User</Button>
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
        <aside className="bg-card hidden w-72 shrink-0 flex-col gap-4 border-r md:flex">
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
            <SheetContent side="left" className="w-72 p-0">
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
            <p className="truncate text-pretty text-sm font-medium">My Notes</p>
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
      <Separator />
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
      <Separator />

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
              <div className="flex items-center justify-between gap-2">
                <span className="truncate">{note.title || "Untitled"}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground opacity-0 transition-opacity group-hover:opacity-100"
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={onConfirmDelete}
            >
              Delete
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
              {user?.tenantPlan === "pro" ? "Pro" : "Free"}
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
    <header className="bg-card flex w-full items-center gap-4 px-3 py-2 md:hidden md:justify-between">
      {/* Mobile Menu Button - only visible on small screens */}
      <Sheet open={isSheetOpen} onOpenChange={onOpenSheet}>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="md:hidden">
            <Menu className="size-4" />
          </Button>
        </SheetTrigger>
        {children} {/* The SheetContent is passed as a child */}
      </Sheet>

      {/* Note count and plan info for mobile */}
      <div className="text-muted-foreground text-xs md:hidden">
        {tenantLoading ? (
          <Skeleton className="h-3 w-16" />
        ) : tenant.plan === "FREE" && tenant.limit !== null ? (
          `${tenant.noteCount} / ${tenant.limit} Notes`
        ) : (
          `${tenant.noteCount || 0} Notes`
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {tenantLoading ? (
          <>
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-20" />
          </>
        ) : (
          <>
            <Badge variant={user?.tenantPlan === "pro" ? "default" : "outline"}>
              {user?.tenantPlan === "pro" ? "Pro Plan" : "Free Plan"}
            </Badge>
            {canUpgrade && (
              <Button size="sm" onClick={onUpgrade} variant="secondary">
                <Sparkles className="mr-1.5 size-4" />
                Upgrade to Pro
              </Button>
            )}
            <Button onClick={onLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4" />
              Log out
            </Button>
          </>
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
        <Button size="sm" onClick={onUpgrade} variant="secondary">
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
  const [note, setNote] = useState<LocalNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // **Controlled state for the title input to prevent bugs.**
  const [currentTitle, setCurrentTitle] = useState("");

  // State for tracking unsaved changes
  const [dirty, setDirty] = useState(false);
  const [currentContent, setCurrentContent] = useState<any>(null);

  // Loading state for save operation
  const [saving, setSaving] = useState(false);

  // Fetches the full note data when the `noteId` prop changes.
  useEffect(() => {
    const fetchNote = async () => {
      setLoading(true);
      try {
        const data = await getNoteById(noteId);
        setNote(data);
        setCurrentTitle(data.title); // Initialize controlled input state
        setCurrentContent(data.content);
        setDirty(false);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    fetchNote();
  }, [noteId]);

  // Save to API
  const saveToAPI = useCallback(
    async (data: { title?: string; content?: any }) => {
      setSaving(true);
      await toast.promise(
        updateNote(noteId, {
          title: data.title || "",
          content: data.content || "",
        }),
        {
          loading: "Saving note...",
          success: () => {
            const updates: Partial<Note> = {
              updatedAt: new Date().toISOString(),
            };
            if (data.title !== undefined) updates.title = data.title;
            onNoteUpdate(noteId, updates);
            setSaving(false);
            return "Note saved!";
          },
          error: () => {
            setSaving(false);
            return "Failed to save note.";
          },
        }
      );
    },
    [noteId, onNoteUpdate]
  );

  // Handler for title changes. Updates local state and marks as dirty.
  const onTitleChange = (newTitle: string) => {
    setCurrentTitle(newTitle);
    setDirty(true);
  };

  // Handler for content changes. Updates local state and marks as dirty.
  const onContentChange = useCallback((content: any) => {
    setCurrentContent(content);
    setDirty(true);
  }, []);

  // Manual save handler
  const handleManualSave = async () => {
    await saveToAPI({ title: currentTitle, content: currentContent });
    setDirty(false);
  };

  if (loading) {
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
      <div className="flex items-center gap-2 px-4 pb-2 pt-4">
        <Input
          className="h-10 flex-1 border-none text-xl font-bold focus-visible:ring-0 md:text-2xl"
          value={currentTitle} // This is now a controlled component.
          onChange={e => onTitleChange(e.target.value)}
          placeholder="Untitled"
        />
        <Button
          size="sm"
          onClick={handleManualSave}
          disabled={!dirty || saving}
          variant="outline"
        >
          <Save className="mr-1.5 size-4" />
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
      <NoteEditor
        initialContent={note.content}
        onUpdateJSON={onContentChange}
      />
    </div>
  );
}
