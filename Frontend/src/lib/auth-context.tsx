import React, { createContext, useContext, useEffect, useReducer, type ReactNode } from "react";
import { api, type User } from "@/lib/api";

type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  user: User | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  error: string | null;
}

type AuthAction =
  | { type: "LOGIN_REQUEST" }
  | { type: "LOGIN_SUCCESS"; payload: User }
  | { type: "LOGIN_FAILURE"; payload: string }
  | { type: "LOGOUT" }
  | { type: "RESTORE_SESSION"; payload: User };

const initialState: AuthState = {
  user: null,
  status: "idle",
  isAuthenticated: false,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "LOGIN_REQUEST":
      return { ...state, status: "loading", error: null };
    case "LOGIN_SUCCESS":
    case "RESTORE_SESSION":
      return {
        ...state,
        status: "authenticated",
        isAuthenticated: true,
        user: action.payload,
        error: null,
      };
    case "LOGIN_FAILURE":
      return {
        ...state,
        status: "unauthenticated",
        isAuthenticated: false,
        user: null,
        error: action.payload,
      };
    case "LOGOUT":
      return {
        ...state,
        status: "unauthenticated",
        isAuthenticated: false,
        user: null,
        error: null,
      };
    default:
      return state;
  }
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => void;
  hasRole: (allowedRoles: string[]) => boolean;
  isFirm: boolean;
  isClient: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const STORAGE_KEY = "lawfirm.auth.user";
// Adding a sync key to broadcast logout across tabs
const SYNC_LOGOUT_KEY = "lawfirm.auth.logout_sync";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize session and set up multi-tab sync
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        const parsedUser = JSON.parse(raw);
        // Basic longevity check: Ensure role exists. In a real app, verify JWT expiry here.
        if (parsedUser && parsedUser.role) {
          dispatch({ type: "RESTORE_SESSION", payload: parsedUser });
        } else {
          dispatch({ type: "LOGOUT" });
        }
      } else {
        dispatch({ type: "LOGOUT" });
      }
    } catch {
      dispatch({ type: "LOGOUT" });
    }

    // Secure local session sync across browser tabs using a storage event listener.
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SYNC_LOGOUT_KEY) {
        dispatch({ type: "LOGOUT" });
        localStorage.removeItem(STORAGE_KEY);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = async (email: string, password: string) => {
    dispatch({ type: "LOGIN_REQUEST" });
    try {
      const found = await api.login(email, password);
      if (found) {
        dispatch({ type: "LOGIN_SUCCESS", payload: found });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(found));
        return found;
      } else {
        dispatch({ type: "LOGIN_FAILURE", payload: "Invalid email or password" });
        return null;
      }
    } catch (err: any) {
      dispatch({ type: "LOGIN_FAILURE", payload: err.message || "Login failed" });
      return null;
    }
  };

  const logout = () => {
    dispatch({ type: "LOGOUT" });
    localStorage.removeItem(STORAGE_KEY);
    // Broadcast logout to other tabs
    localStorage.setItem(SYNC_LOGOUT_KEY, Date.now().toString());
  };

  const hasRole = (allowedRoles: string[]) => {
    if (!state.isAuthenticated || !state.user) return false;
    return allowedRoles.includes(state.user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        hasRole,
        isFirm: !!state.user && state.user.role !== "client",
        isClient: state.user?.role === "client",
        loading: state.status === "idle" || state.status === "loading",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
