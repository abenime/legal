# Engineering Implementation and Testing Plan: Legal Tech Frontend Architecture

## Part 1: Comprehensive Implementation Plan

### 1. App Shell & Navigation (with RBAC)
**File Paths:** **`src/routes/app.tsx`**, **`src/routes/__root.tsx`**

**Layout Structure:**
*   **Architecture:** Use a highly responsive CSS Grid/Flexbox layout within **`src/routes/app.tsx`**. The layout will consist of a fixed, collapsible `<Sidebar />` on the left, a sticky `<TopNav />` containing user profile/notification controls, and an `<Outlet />` (TanStack Router) for the main content area.
*   **Accessibility:** Ensure landmark roles are present (`<nav>`, `<main>`, `<header>`).

**RBAC Matrix:**
*   **Admin:** Full access to all modules, including Settings and full User Management.
*   **Lawyer:** Access to Cases, Clients, Documents, Calendar, Messages, and Billing.
*   **Paralegal:** Access to Cases, Documents, Calendar, and Messages. (No Billing or Settings).
*   **Client:** Restricted access to Client Dashboard, specific shared Documents, and direct Messages.

**Route Guarding:**
*   **DOM Unmounting:** Do not just hide elements via CSS. Use a custom hook **`useRoleAuth()`** to completely unmount unauthorized UI components from the DOM:
    ```tsx
    const { hasRole } = useRoleAuth();
    if (!hasRole(['Admin'])) return null;
    ```
*   **Navigation Guarding:** Implement a `<ProtectedRoute allowedRoles={['Admin', 'Lawyer']} />` wrapper around sensitive TanStack Router routes. If a user attempts to access an unauthorized route, perform an immediate redirect to an **`/unauthorized`** route or **`/login`** using the router's lifecycle hooks (`beforeLoad` in TanStack Router).

### 2. Authentication & State
**File Path:** **`src/lib/auth-context.tsx`**

**State Machine:**
*   Use standard React Context combined with `useReducer` (or a Zustand store for better performance if re-renders become an issue) to manage the authentication state.
*   **State Object:** 
    ```typescript
    { 
      isAuthenticated: boolean; 
      user: User | null; // Includes role, firmId, metadata
      status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated'; 
      error: string | null; 
    }
    ```

**Flows:**
*   **`login(credentials)`:** Authenticates, sets `status` to `loading`, updates `user` and `isAuthenticated` on success, or sets `error` on failure.
*   **`logout()`:** Immediately nullifies the `user` object, sets `isAuthenticated` to false, and triggers a hard redirect to **`/login`**.
*   **`refreshSession()`:** Automatically attempts to fetch a fresh token on mount if a valid session exists.

**Security:**
*   **XSS & CSRF Prevention:** The frontend should never store JWTs in `localStorage` due to XSS vulnerability. Advocate for the backend to use **`HttpOnly`**, **`Secure`** cookies. The Auth Context should rely on an `/api/auth/me` endpoint to hydrate the state on page load.
*   **Mock Fallback:** While using mock data, temporarily utilize `sessionStorage` to simulate session boundaries without persistent tracking.

### 3. Shared Design System
**Directory Path:** **`src/components/ui/`**

**Modals (`dialog.tsx`):**
*   **Implementation:** Built on top of Radix UI (`@radix-ui/react-dialog`) to guarantee WAI-ARIA compliance.
*   **Accessibility:** Native focus trapping inside the modal. The `Esc` key will close it. Requires `aria-modal="true"`, `aria-labelledby`, and `aria-describedby`.
*   **API Design:** Compound component pattern: `<Dialog>`, `<DialogTrigger>`, `<DialogContent>`, `<DialogHeader>`, `<DialogFooter>`.

**Data Tables (`table.tsx`):**
*   **Implementation:** Use **`@tanstack/react-table`** for headless, robust table logic combined with Tailwind CSS for styling.
*   **Features:** Integrated sorting, client/server-side pagination, and column filtering.
*   **API Design:** Provide a reusable `<DataTable columns={columns} data={data} />` wrapper that accepts strongly typed data definitions.

**Dropdowns (`dropdown-menu.tsx`):**
*   **Implementation:** Built on Radix UI (`@radix-ui/react-dropdown-menu`).
*   **Accessibility:** Full keyboard navigation support (Arrow keys, Enter, Escape) and screen reader support.
*   **API Design:** Compound components for clear composition: `<DropdownMenu>`, `<DropdownMenuTrigger>`, `<DropdownMenuContent>`, `<DropdownMenuItem>`.

### 4. Settings Module
**File Path:** **`src/routes/app.settings.tsx`**

**Architecture:**
*   Implement a vertical or horizontal tabbed layout using the **`Tabs`** component (`src/components/ui/tabs.tsx`) to separate concerns.

**Components:**
*   **Firm Details Form:** Built using **`react-hook-form`** integrated with **`zod`** for rigorous, type-safe schema validation (e.g., checking standard email formats, phone numbers).
*   **User Management Table:** Utilize the shared `<DataTable />`. Fetch data from **`src/data/users.json`**. Include an Actions column containing a `<DropdownMenu />` to "Edit Role", "Reset Password", or "Revoke Access".
*   **System Preferences:** Utilize the **`Switch`** component (`src/components/ui/switch.tsx`) for immediate visual feedback on boolean preferences (e.g., "Require 2FA", "Email Notifications").
*   **Roles & Permissions Matrix:** A dedicated, visually distinct table mapping detailed permissions (rows) to Roles (columns) utilizing `<Checkbox />` components for Admin adjustments.

---

## Part 2: Rigorous Testing Strategy

### 1. Unit Testing (Vitest / Jest)

*   **Auth Context Transitions:**
    *   *Assertion:* Call `login()` with mock credentials. Assert that the state transitions from `loading` $\rightarrow$ `authenticated`, and the **`user`** object precisely matches the mocked backend response.
    *   *Assertion:* Call `logout()`. Assert that **`isAuthenticated`** becomes `false` and the **`user`** object is strictly `null`.
*   **Form Validation Logic:**
    *   *Assertion:* Pass malformed data (e.g., invalid email string, empty firm name) to the **`zod`** firm details schema. Assert that the schema throws the exact predefined error messages.
*   **Utility & Edge Cases:**
    *   *Assertion:* Feed a malformed user object missing a `role` property into the RBAC utility. Assert that it falls back safely to the lowest privilege (or throws an explicit access error).

### 2. Integration Testing (React Testing Library)

*   **RBAC Assertions:**
    *   *Setup:* Wrap the **`<Sidebar />`** component in an AuthProvider simulating a **`Client`** role.
    *   *Assertion:* `expect(screen.queryByText('Settings')).not.toBeInTheDocument()`. (Ensure it is unmounted, not just hidden).
*   **Design System Accessibility (Dropdowns & Modals):**
    *   *Setup:* Render the **`<DropdownMenu />`**.
    *   *Assertion:* `await userEvent.click(screen.getByRole('button', { name: /Options/i }))`. 
    *   *Assertion:* `await userEvent.keyboard('{ArrowDown}')`. Expect `document.activeElement` to equal the first `<DropdownMenuItem>`.
    *   *Assertion:* Pressing `{Escape}` completely unmounts the dropdown content from the DOM.
*   **Settings CRUD Operations:**
    *   *Setup:* Render the User Management Table within the Settings module.
    *   *Assertion:* Click "Edit Role", select "Lawyer" from the `<Select />` component, and click "Save". Assert that the local React state updates optimistically, showing "Lawyer" in the table row before the mock network request concludes.

### 3. End-to-End (E2E) Testing (Playwright / Cypress)

*   **Critical User Journey: Full Auth Lifecycle:**
    *   *Action:* `page.goto('/login')`
    *   *Action:* Fill in valid credentials and `page.click('button[type="submit"]')`.
    *   *Assertion:* `expect(page).toHaveURL('/app/dashboard')`.
    *   *Action:* Click the Avatar dropdown in the TopNav and click "Logout".
    *   *Assertion:* `expect(page).toHaveURL('/login')`.
    *   *Assertion:* Attempting to use the browser back button redirects immediately back to `/login`.
*   **Critical User Journey: Unauthorized Deep Linking:**
    *   *Setup:* Intercept network requests to seed a session with the **`Paralegal`** role.
    *   *Action:* `page.goto('/app/settings')`.
    *   *Assertion:* The routing guard intercepts the load. `expect(page).toHaveURL('/unauthorized')` (or `/app`). The user is strictly prevented from viewing the Settings DOM tree.