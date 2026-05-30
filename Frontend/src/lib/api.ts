// Backend API connection
export type Role = "admin" | "lawyer" | "paralegal" | "client";

export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  role: Role;
  title: string;
  avatar: string;
  caseIds?: string[];
  phone?: string;
}

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
  clientId: string;
  caseId: string;
  amount: number;
  status: string;
  date: string;
  dueDate: string;
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
  const response = await fetch(`/api${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!response.ok) {
    if (response.status === 401) return null as T;
    throw new Error(`API error: ${response.statusText}`);
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

  // Clients
  getClients: () => fetchApi<Client[]>("/clients"),

  // Tasks
  async getTasks(user: User) {
    const all = await fetchApi<Task[]>("/tasks");
    if (user.role === "client") {
      const allowed = user.caseIds ?? [];
      return all.filter((t) => allowed.includes(t.caseId));
    }
    return all;
  },

  // Events
  async getEvents(user: User) {
    const all = await fetchApi<Event[]>("/events");
    if (user.role === "client") {
      const allowed = user.caseIds ?? [];
      return all.filter((e) => allowed.includes(e.caseId));
    }
    return all;
  },

  // Documents
  async getDocuments(user: User) {
    const all = await fetchApi<Document[]>("/documents");
    if (user.role === "client") {
      const allowed = user.caseIds ?? [];
      return all.filter((d) => allowed.includes(d.caseId));
    }
    return all;
  },

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

  // Analytics — firm only
  getAnalytics: () => fetchApi<Analytics>("/analytics"),
};
