// actions/notes.ts
// API service functions for notes management

const getAuthHeaders = (): Record<string, string> => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth:token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchNotes = async (): Promise<any[]> => {
  const response = await fetch("/api/notes", {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch notes");
  return await response.json();
};

export const createNote = async (data: {
  title: string;
  content?: any;
}): Promise<any> => {
  const response = await fetch("/api/notes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to create note");
  }
  return await response.json();
};

export const updateNote = async (
  id: string,
  data: { title: string; content?: any }
): Promise<any> => {
  const response = await fetch(`/api/notes/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to update note");
  }
  return await response.json();
};

export const deleteNote = async (id: string): Promise<void> => {
  const response = await fetch(`/api/notes/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to delete note");
  }
};

export const upgradeTenant = async (slug: string): Promise<any> => {
  const response = await fetch(`/api/tenants/${slug}/upgrade`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Upgrade failed");
  }
  return await response.json();
};

export const inviteUser = async (data: {
  email: string;
  role: "admin" | "member";
}): Promise<any> => {
  const response = await fetch("/api/auth/invite", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to invite user");
  }
  return result;
};

export const getTenantInfo = async (): Promise<any> => {
  const response = await fetch("/api/tenant", {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch tenant info");
  return await response.json();
};

export const getNoteById = async (id: string): Promise<any> => {
  const response = await fetch(`/api/notes/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch note");
  return await response.json();
};
