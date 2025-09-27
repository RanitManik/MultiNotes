"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { Badge } from "@workspace/ui/components/badge";
import { ThemeToggle } from "@workspace/ui/components/theme-toggle";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
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
import {
  Plus,
  LogOut,
  Trash2,
  Edit,
  User,
  Calendar,
  Loader2,
  FileText,
  Crown,
  AlertTriangle,
  UserPlus,
} from "lucide-react";
import { useOptimisticNotes } from "@/hooks/useOptimisticNotes";
import { toast } from "sonner";
interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  author: { email: string };
  isOptimistic?: boolean;
}

interface User {
  role: "admin" | "member";
  tenantSlug: string;
  tenantPlan: "free" | "pro";
}

export default function NotesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [error, setError] = useState("");
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const router = useRouter();

  const { notes, addNote, removeNote, updateNote, updateNotes } =
    useOptimisticNotes();

  const fetchNotes = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch("/api/notes", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        updateNotes(data);
      } else if (response.status === 401) {
        localStorage.removeItem("token");
        router.push("/");
      }
    } catch {
      console.error("Failed to fetch notes");
    } finally {
      setLoading(false);
    }
  }, [router, updateNotes]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }

    // Decode token to get user info (simplified)
    try {
      const parts = token.split(".");
      if (parts.length !== 3 || !parts[1]) throw new Error("Invalid token");
      const payload = JSON.parse(atob(parts[1]));
      setUser({
        role: payload.role,
        tenantSlug: payload.tenantSlug,
        tenantPlan: payload.tenantPlan,
      });
    } catch {
      localStorage.removeItem("token");
      router.push("/");
      return;
    }

    fetchNotes();
  }, [router, fetchNotes]);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    const noteData = { title: newTitle, content: newContent };

    // Close dialog and clear form immediately for optimistic UX
    setShowCreateForm(false);
    setNewTitle("");
    setNewContent("");
    setError("");

    const createNoteAPI = async (data: { title: string; content: string }) => {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create note");
      }

      return await response.json();
    };

    try {
      await addNote(noteData, createNoteAPI);
    } catch {
      // Error is already handled by the hook
      console.error("Create note failed");
    }
  };

  const handleDeleteNote = (id: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const deleteNoteAPI = async (noteId: string) => {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete note");
      }
    };

    // Don't await - let the dialog close immediately
    removeNote(id, deleteNoteAPI).catch(() => {
      // Error is already handled by the hook
      console.error("Delete note failed");
    });
  };

  const handleUpgrade = async () => {
    if (!user) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const upgradeAPI = async () => {
      const response = await fetch(`/api/tenants/${user.tenantSlug}/upgrade`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upgrade failed");
      }

      return response;
    };

    try {
      const toastResult = await toast.promise(upgradeAPI(), {
        loading: "Upgrading to Pro plan...",
        success: "Successfully upgraded to Pro plan!",
        error: err => err.message || "Upgrade failed",
      });

      const response = await toastResult.unwrap();

      // Get the updated tenant info from the response
      const data = await response.json();

      // Update token with new one containing updated tenant plan
      localStorage.setItem("token", data.token);

      // Decode the new token to update user state (same as in useEffect)
      const parts = data.token.split(".");
      if (parts.length === 3 && parts[1]) {
        const payload = JSON.parse(atob(parts[1]));
        setUser({
          role: payload.role,
          tenantSlug: payload.tenantSlug,
          tenantPlan: payload.tenantPlan,
        });
      }

      // Refresh notes to potentially allow more
      fetchNotes();
      setError("");
    } catch (err) {
      // Error is already handled by toast.promise
      console.error("Upgrade failed:", err);
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setShowEditForm(true);
  };

  const handleUpdateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const noteData = { title: editTitle, content: editContent };

    // Close dialog and clear form immediately for optimistic UX
    setShowEditForm(false);
    setEditingNote(null);
    setEditTitle("");
    setEditContent("");
    setError("");

    const updateNoteAPI = async (
      id: string,
      data: { title: string; content: string }
    ) => {
      const response = await fetch(`/api/notes/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update note");
      }

      return await response.json();
    };

    try {
      await updateNote(editingNote.id, noteData, updateNoteAPI);
    } catch {
      // Error is already handled by the hook
      console.error("Update note failed");
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch("/api/auth/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`User ${inviteEmail} invited successfully!`);
        setShowInviteForm(false);
        setInviteEmail("");
        setInviteRole("member");
      } else {
        setError(data.error || "Failed to invite user");
      }
    } catch (err) {
      console.error(err);
      setError("Network error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  if (loading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="text-primary mx-auto mb-4 h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading your notes...</p>
        </div>
      </div>
    );
  }

  const canUpgrade =
    user?.role === "admin" && user?.tenantPlan === "free" && notes.length >= 3;

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="bg-card border-b shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="text-primary h-8 w-8" />
              <div>
                <h1 className="text-foreground text-xl font-semibold">
                  MultiNotes
                </h1>
                <p className="text-muted-foreground text-sm">
                  Tenant: {user?.tenantSlug}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant={user?.role === "admin" ? "default" : "secondary"}>
                {user?.role === "admin" ? "Admin" : "Member"}
              </Badge>
              <Badge
                variant={user?.tenantPlan === "pro" ? "default" : "outline"}
              >
                {user?.tenantPlan === "pro" ? "Pro Plan" : "Free Plan"}
              </Badge>
              <ThemeToggle />
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Error Alert */}
        {error && (
          <Alert className="mb-6" variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row">
          <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
            <DialogTrigger asChild>
              <Button className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Create Note
              </Button>
            </DialogTrigger>
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
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Write your note content here..."
                    value={newContent}
                    onChange={e => setNewContent(e.target.value)}
                    rows={6}
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

          <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Note</DialogTitle>
                <DialogDescription>Update your note details.</DialogDescription>
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
                <div className="space-y-2">
                  <Label htmlFor="editContent">Content</Label>
                  <Textarea
                    id="editContent"
                    placeholder="Write your note content here..."
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    rows={6}
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

          {user?.role === "admin" && (
            <Dialog open={showInviteForm} onOpenChange={setShowInviteForm}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite User
                </Button>
              </DialogTrigger>
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
                  <div className="space-y-2">
                    <Label htmlFor="inviteRole">Role</Label>
                    <select
                      id="inviteRole"
                      value={inviteRole}
                      onChange={e =>
                        setInviteRole(e.target.value as "admin" | "member")
                      }
                      className="border-input bg-background focus:border-ring focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
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

          {canUpgrade && (
            <Button
              onClick={handleUpgrade}
              variant="secondary"
              className="flex items-center"
            >
              <Crown className="mr-2 h-4 w-4" />
              Upgrade to Pro
            </Button>
          )}
        </div>

        {/* Notes Grid */}
        {notes.length === 0 ? (
          <Card className="py-12 text-center">
            <CardContent>
              <FileText className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <h3 className="text-foreground mb-2 text-lg font-medium">
                No notes yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Get started by creating your first note.
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Note
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {notes.map(note => (
              <Card
                key={note.id}
                className={`group border-l-4 transition-all duration-200 hover:shadow-lg ${
                  note.isOptimistic
                    ? "border-l-primary bg-primary/5 animate-pulse"
                    : "border-l-border hover:border-l-primary"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="line-clamp-2 flex items-center gap-2 text-lg">
                        {note.title}
                        {note.isOptimistic && (
                          <div className="text-primary flex items-center gap-1 text-xs font-normal">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Creating...
                          </div>
                        )}
                      </CardTitle>
                    </div>
                    {!note.isOptimistic && (
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:bg-primary/10 hover:text-primary opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={() => handleEditNote(note)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive opacity-0 transition-opacity group-hover:opacity-100"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Note</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete &quot;
                                {note.title}&quot;? This action cannot be
                                undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteNote(note.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p
                    className={`mb-4 line-clamp-3 ${note.isOptimistic ? "text-muted-foreground" : "text-foreground"}`}
                  >
                    {note.content}
                  </p>
                  <div className="text-muted-foreground flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3" />
                      <span className={note.isOptimistic ? "text-primary" : ""}>
                        {note.author.email}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {note.isOptimistic
                          ? "Just now"
                          : new Date(note.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Free Plan Warning */}
        {notes.length >= 3 &&
          user?.role === "member" &&
          user?.tenantPlan === "free" && (
            <Alert className="mt-8">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You&apos;ve reached the free plan limit of 3 notes. Ask an admin
                to upgrade to Pro for unlimited notes.
              </AlertDescription>
            </Alert>
          )}
      </main>
    </div>
  );
}
