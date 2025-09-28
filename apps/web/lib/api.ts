import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Types
export interface Note {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  content?: any;
  author?: { email: string };
  isOptimistic?: boolean;
}

export interface Tenant {
  slug: string;
  plan: "FREE" | "PRO";
  noteCount: number;
  limit: number | null;
  email?: string | null;
}

export interface User {
  role: "admin" | "member";
  tenantSlug: string;
  tenantPlan: "free" | "pro";
}

// API base URL and auth helpers
const getAuthHeaders = (): Record<string, string> => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth:token") : null;
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
};

const handleApiError = (error: any) => {
  if (error.status === 401) {
    localStorage.removeItem("auth:token");
    window.location.href = "/auth/login";
    return;
  }
  throw error;
};

// API functions
export const api = {
  // Notes
  getNotes: async (): Promise<Note[]> => {
    const response = await fetch(`/api/notes`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) handleApiError(response);
    return response.json();
  },

  getNote: async (id: string): Promise<Note> => {
    const response = await fetch(`/api/notes/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) handleApiError(response);
    return response.json();
  },

  createNote: async (data: { title: string; content: any }): Promise<Note> => {
    const response = await fetch(`/api/notes`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) handleApiError(response);
    return response.json();
  },

  updateNote: async (
    id: string,
    data: { title?: string; content?: any }
  ): Promise<Note> => {
    const response = await fetch(`/api/notes/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) handleApiError(response);
    return response.json();
  },

  deleteNote: async (id: string): Promise<void> => {
    const response = await fetch(`/api/notes/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) handleApiError(response);
  },

  // Tenant
  getTenant: async (): Promise<Tenant> => {
    const response = await fetch(`/api/tenant`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) handleApiError(response);
    return response.json();
  },

  upgradeTenant: async (
    slug: string
  ): Promise<{ message: string; tenant: Tenant; token: string }> => {
    const response = await fetch(`/api/tenants/${slug}/upgrade`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!response.ok) handleApiError(response);
    return response.json();
  },

  // Auth
  inviteUser: async (data: {
    email: string;
    role: "admin" | "member";
    password?: string;
  }): Promise<any> => {
    const response = await fetch(`/api/auth/invite`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) handleApiError(response);
    return response.json();
  },
};

// React Query hooks
export const useNotes = () => {
  return useQuery({
    queryKey: ["notes"],
    queryFn: api.getNotes,
  });
};

export const useNote = (id: string) => {
  return useQuery({
    queryKey: ["notes", id],
    queryFn: () => api.getNote(id),
    enabled: !!id,
  });
};

export const useTenant = () => {
  return useQuery({
    queryKey: ["tenant"],
    queryFn: api.getTenant,
  });
};

export const useCreateNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["tenant"] });
    },
  });
};

export const useUpdateNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { title?: string; content?: any };
    }) => api.updateNote(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["notes", id] });
    },
  });
};

export const useDeleteNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["tenant"] });
    },
  });
};

export const useUpgradeTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.upgradeTenant,
    onSuccess: data => {
      // Update the auth token
      if (data.token) {
        localStorage.setItem("auth:token", data.token);
      }
      // Invalidate tenant query to get updated data
      queryClient.invalidateQueries({ queryKey: ["tenant"] });
    },
  });
};

export const useInviteUser = () => {
  return useMutation({
    mutationFn: api.inviteUser,
  });
};
