import { test, expect } from "@playwright/test";

test.describe("End-to-End System Validation", () => {
  test("Complete login loop, layout propagation, and teardown", async ({ page }) => {
    // Navigate to Login
    await page.goto("/login");

    // Intercept API login call to provide mock data if backend is offline
    await page.route("**/api/auth/login", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "99",
          name: "Admin User",
          role: "admin",
          email: "admin@test.com",
        }),
      });
    });

    // Action: Fill credentials and login
    await page.fill('input[type="email"]', "admin@test.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    // Assertion: Route changed to Dashboard
    await expect(page).toHaveURL(/\/app/);

    // Assertion: App Shell layout propagation is visible (Sidebar & Header present)
    await expect(page.locator("aside", { hasText: "Vance & Hale" })).toBeVisible();

    // Action: Open user menu and Logout
    await page.click("button[aria-label='Sign out']");

    // Assertion: Clean teardown and redirect to login
    await expect(page).toHaveURL(/\/login/);

    // Attempting to go back without session
    await page.goBack();
    await expect(page).toHaveURL(/\/login/);
  });

  test("Direct URL deep-linking navigation interception", async ({ page }) => {
    // Mock user login as a Client
    await page.route("**/api/auth/login", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "2",
          name: "Client User",
          role: "client",
          email: "client@test.com",
        }),
      });
    });

    // Set localStorage directly or login to seed session
    await page.goto("/login");
    await page.fill('input[type="email"]', "client@test.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    // Await redirect to dashboard
    await expect(page).toHaveURL(/\/app/);

    // Deep link directly to settings
    await page.goto("/app/settings");

    // Assertion: The user is instantly blocked/redirected from the settings view
    // Since settings checks `user.role !== 'admin'`, it renders a 'Forbidden' message
    await expect(page.locator("text=Forbidden")).toBeVisible();
    await expect(
      page.locator("text=You do not have permission to access the admin settings"),
    ).toBeVisible();
  });
});
