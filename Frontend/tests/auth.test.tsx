import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { RBACGuard } from "@/routes/app.tsx";
import React from "react";

// Mock API
vi.mock("@/lib/api", () => ({
  api: {
    login: vi.fn((email) => {
      if (email === "client@test.com") {
        return Promise.resolve({ id: "1", name: "Client User", role: "client", email });
      }
      return Promise.reject(new Error("Invalid login"));
    }),
  },
}));

// Test Component using Auth
const TestComponent = () => {
  const { login, logout, user, isAuthenticated } = useAuth();
  return (
    <div>
      <div data-testid="status">{isAuthenticated ? "Logged In" : "Logged Out"}</div>
      <div data-testid="role">{user?.role || "None"}</div>
      <button onClick={() => login("client@test.com", "password")}>Login</button>
      <button onClick={logout}>Logout</button>

      <RBACGuard allowedRoles={["admin"]} fallback={<div data-testid="forbidden">Forbidden</div>}>
        <div data-testid="admin-content">Admin Content</div>
      </RBACGuard>
    </div>
  );
};

describe("AuthContext and RBAC", () => {
  it("transitions state correctly and guards routes based on roles", async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    // Initial State
    expect(screen.getByTestId("status").textContent).toBe("Logged Out");

    // Login Flow
    await userEvent.click(screen.getByText("Login"));

    // Await State Transition
    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("Logged In");
    });
    expect(screen.getByTestId("role").textContent).toBe("client");

    // RBAC Boundary Verification
    // Since user is 'client' and allowedRoles is ['admin'], it should render fallback
    expect(screen.getByTestId("forbidden")).toBeInTheDocument();
    expect(screen.queryByTestId("admin-content")).not.toBeInTheDocument();

    // Logout Flow
    await userEvent.click(screen.getByText("Logout"));
    expect(screen.getByTestId("status").textContent).toBe("Logged Out");
  });
});
