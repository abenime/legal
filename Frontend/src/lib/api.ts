// Backend API connection
export type Role = "admin" | "lawyer" | "paralegal" | "client";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  title: string;
  avatar: string;
  caseIds?: string[];
  phone?: string;
}

type ApiErrorPayload = {
  message?: string;
  error?: string;
  errors?: Record<string, string[] | string>;
};

export interface Case {
  id: string;
  number: string;
  title: string;
  client: string;
  clientId: string | null;
  practice: string;
  stage: string;
  status: "active" | "pending" | "closed" | "archived";
  lead: string;
  court?: string;
  judge?: string;
  hearingDate?: string | null;
  openedAt: string;
  nextDeadline: string | null;
  billable: number;
  priority: "low" | "medium" | "high";
  description?: string;
  details?: Record<string, string>;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  since?: string;
  activeCases: number;
  outstanding: number;
  retainerBalance: number;
  address?: string;
  notes?: any;
}

export interface Task {
  id: string;
  caseId: string;
  title: string;
  assignee: string;
  due: string;
  status: string;
  priority: string;
  notes?: string;
}

export interface Event {
  id: string;
  caseId: string;
  title: string;
  date: string;
  time?: string;
  type: string;
  location?: string;
  reminder?: string;
  notes?: string;
}

export interface Document {
  id: string;
  caseId: string;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  signed: boolean;
}

export interface Invoice {
  id: string;
  number: string;
  clientId: string | null;
  client: string;
  caseId: string;
  amount: number;
  status: string;
  issued: string;
  due: string;
}

export interface Message {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: string;
  read: boolean;
}

export interface Analytics {
  [key: string]: unknown;
}

const fetchApi = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const isFormData = options?.body instanceof FormData;
  const headers: HeadersInit = {
    ...options?.headers,
  };

  if (!isFormData && !headers["Content-Type" as keyof HeadersInit]) {
    (headers as any)["Content-Type"] = "application/json";
  }

  const response = await fetch(`/api${url}`, {
    ...options,
    headers,
  });
  if (!response.ok) {
    if (response.status === 401) return null as T;

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      try {
        const payload = (await response.json()) as ApiErrorPayload;
        const firstValidationError = payload.errors
          ? Object.values(payload.errors)
              .flat()
              .find((message) => Boolean(message))
          : undefined;

        throw new Error(firstValidationError ?? payload.message ?? payload.error ?? response.statusText);
      } catch {
        throw new Error(`API error: ${response.statusText}`);
      }
    }

    const text = await response.text();
    throw new Error(text.trim() || `API error: ${response.statusText}`);
  }
  return response.json();
};

export const api = {
  // Auth
  async login(email: string, password: string): Promise<User | null> {
    return fetchApi<User | null>("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  async signUp(name: string, email: string, password: string, phone?: string): Promise<User> {
    return fetchApi<User>("/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password, phone }),
    });
  },

  async updateUserRole(userId: string, newRole: Role): Promise<User> {
    const updatedUser = await fetchApi<User>(`/users/${userId}/role`, {
      method: "PUT",
      body: JSON.stringify({ role: newRole }),
    });

    // Sync session if updating current logged in user
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("lawfirm.auth.user");
      if (stored) {
        try {
          const currentSession = JSON.parse(stored) as User;
          if (currentSession.id === userId) {
            localStorage.setItem("lawfirm.auth.user", JSON.stringify(updatedUser));
          }
        } catch {
          // Ignore
        }
      }
    }

    return updatedUser;
  },

  // Users
  getUsers: () => fetchApi<User[]>("/users"),
  getStaff: async () => {
    const users = await fetchApi<User[]>("/users");
    return users.filter((u) => u.role !== "client");
  },

  // Cases — scoped by role
  async getCases(user: User) {
    const all = await fetchApi<Case[]>("/cases");
    if (user.role === "client") {
      return all.filter((c) => user.caseIds?.includes(c.id));
    }
    return all;
  },
  getCase: (id: string) => fetchApi<Case | null>(`/cases/${id}`),
  createCase: (data: Partial<Case>) =>
    fetchApi<Case>("/cases", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateCase: (id: string, data: Partial<Case>) =>
    fetchApi<Case>(`/cases/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Clients
  getClients: () => fetchApi<Client[]>("/clients"),
  createClient: (data: Partial<Client>) =>
    fetchApi<Client>("/clients", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateClient: (id: string, data: Partial<Client>) =>
    fetchApi<Client>(`/clients/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Tasks
  async getTasks(user: User, caseId?: string) {
    const url = caseId ? `/tasks?caseId=${caseId}` : "/tasks";
    const all = await fetchApi<Task[]>(url);
    if (user.role === "client") {
      const allowed = user.caseIds ?? [];
      return all.filter((t) => allowed.includes(t.caseId));
    }
    return all;
  },
  createTask: (data: Partial<Task>) =>
    fetchApi<Task>("/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Events
  async getEvents(user: User, caseId?: string) {
    const url = caseId ? `/events?caseId=${caseId}` : "/events";
    const all = await fetchApi<Event[]>(url);
    if (user.role === "client") {
      const allowed = user.caseIds ?? [];
      return all.filter((e) => allowed.includes(e.caseId));
    }
    return all;
  },
  createEvent: (data: Partial<Event>) =>
    fetchApi<Event>("/events", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Documents
  async getDocuments(user: User, caseId?: string) {
    const url = caseId ? `/documents?caseId=${caseId}` : "/documents";
    const all = await fetchApi<Document[]>(url);
    if (user.role === "client") {
      const allowed = user.caseIds ?? [];
      return all.filter((d) => allowed.includes(d.caseId));
    }
    return all;
  },
  createDocument: (data: FormData | Partial<Document>) =>
    fetchApi<Document>("/documents", {
      method: "POST",
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),

  // Invoices
  async getInvoices(user: User) {
    const all = await fetchApi<Invoice[]>("/invoices");
    if (user.role === "client") {
      return all.filter((i) => i.clientId === user.id);
    }
    return all;
  },

  // Messages
  async getMessages(user: User) {
    const all = await fetchApi<Message[]>("/messages");
    if (user.role === "client") {
      return all.filter((m) => m.from === user.id || m.to === user.id);
    }
    return all;
  },
  createMessage: (data: Partial<Message>) =>
    fetchApi<Message>("/messages", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Settings
  getSettings: () => fetchApi<Record<string, any>>("/settings"),
  updateSettings: (data: Record<string, any>) =>
    fetchApi<Record<string, any>>("/settings", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  uploadLogo: (file: File) => {
    const formData = new FormData();
    formData.append("logo", file);
    return fetchApi<{ logo_path: string; logo_url: string }>("/settings/logo", {
      method: "POST",
      body: formData,
      // fetchApi probably handles the headers but we should be careful about Content-Type
      // usually for FormData, we want the browser to set it with the boundary.
    });
  },

  // AI
  askAI: (prompt: string, userId?: string) =>
    fetchApi<{ text: string }>("/ai-chat", {
      method: "POST",
      body: JSON.stringify({ prompt, userId }),
    }),

  getAIHistory: (userId: string) => fetchApi<any[]>(`/ai-history/${userId}`),

  // Analytics — firm only
  getAnalytics: () => fetchApi<Analytics>("/analytics"),
};
