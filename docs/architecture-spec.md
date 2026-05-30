# Architecture Specification: Legal Tech Frontend

## 1. Component Core Mechanics
*   **State Management:** 
    *   Authentication is managed via React Context (`AuthContext`) paired with a `useReducer` or robust `useState` implementation to handle `idle`, `loading`, `authenticated`, and `unauthenticated` transitions.
    *   Form states (like Firm Settings) use `react-hook-form` coupled with `zod` for rigorous validation.
    *   Heavy lists (e.g., `users.json`) use `@tanstack/react-table` with `useMemo` for columns and data to prevent unnecessary re-renders during search/filtering.
*   **Prop Interfaces:** All components use strict TypeScript interfaces. Compound components expose child components explicitly (e.g., `DropdownMenu.Item`).

## 2. Missing Architectural Layers (Added for System Robustness)
*   **Global Error Boundaries:**
    *   A top-level `<ErrorBoundary>` wraps the TanStack Router `<Outlet>` in `app.tsx`. It catches rendering errors, logs them to an external service (mocked via `error-capture.ts`), and displays a localized fallback UI without tearing down the entire App Shell (navigation remains intact).
*   **Form State Persistence & Recovery:**
    *   The Firm Details form utilizes a custom hook `useFormDraft<T>` which debounces form changes and syncs them to `localStorage`. On mount, if a draft exists and the pristine data hasn't been modified externally, it prompts the user to restore the draft.
*   **Security & Audit Logging Hooks:**
    *   A high-order function/hook `useAuditLog()` intercepts administrative actions. For example, modifying a user role triggers `auditLog({ action: 'ROLE_UPDATE', targetId: userId, newRole: 'Lawyer', timestamp: Date.now() })`.

## 3. WAI-ARIA Accessibility Maps
*   **Modals (`Dialog`):**
    *   Role: `dialog`
    *   Attributes: `aria-modal="true"`, `aria-labelledby="dialog-title"`, `aria-describedby="dialog-description"`.
    *   Keyboard: Focus is trapped inside the active modal. `Escape` closes the modal and returns focus to the trigger element.
*   **Dropdowns (`DropdownMenu`):**
    *   Role: `menu`
    *   Attributes: `aria-expanded` on the trigger, `role="menuitem"` on items.
    *   Keyboard: `ArrowDown`/`ArrowUp` navigates items. `Enter` or `Space` selects. `Escape` closes and returns focus.
*   **Data Tables:**
    *   Role: `table`, `rowgroup`, `row`, `columnheader`, `cell`.
    *   Attributes: `aria-sort` on sortable headers. Live regions (`aria-live="polite"`) for pagination updates (e.g., "Showing 11 to 20 of 50 users").
