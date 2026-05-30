import { createFileRoute, Outlet, useNavigate, Link, useRouterState } from "@tanstack/react-router";
import React, { useEffect, type ReactNode } from "react";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Calendar,
  FileText,
  MessagesSquare,
  Receipt,
  BarChart3,
  Sparkles,
  Settings,
  Scale,
  LogOut,
  Bell,
  Search,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function RBACGuard({
  allowedRoles,
  children,
  fallback = null,
}: {
  allowedRoles: string[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { hasRole, status } = useAuth();
  if (status === "loading") return null;
  if (!hasRole(allowedRoles)) return <>{fallback}</>;
  return <>{children}</>;
}

class AppErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("AppErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center h-full">
          <div className="text-destructive mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-4 max-w-md">
            An unexpected error occurred in this module. The rest of the application should still be
            functioning.
          </p>
          <Button onClick={() => this.setState({ hasError: false, error: null })}>Try again</Button>
        </div>
      );
    }
    return this.props.children;
  }
}

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

type NavItem = {
  to: string;
  label: string;
  icon: typeof Briefcase;
  roles: string[];
  group: string;
};

const NAV: NavItem[] = [
  {
    to: "/app",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "lawyer", "paralegal", "client"],
    group: "Overview",
  },
  {
    to: "/app/cases",
    label: "Cases",
    icon: Briefcase,
    roles: ["admin", "lawyer", "paralegal", "client"],
    group: "Overview",
  },
  {
    to: "/app/clients",
    label: "Clients",
    icon: Users,
    roles: ["admin", "lawyer", "paralegal"],
    group: "Overview",
  },
  {
    to: "/app/calendar",
    label: "Calendar",
    icon: Calendar,
    roles: ["admin", "lawyer", "paralegal", "client"],
    group: "Overview",
  },
  {
    to: "/app/documents",
    label: "Documents",
    icon: FileText,
    roles: ["admin", "lawyer", "paralegal", "client"],
    group: "Practice",
  },
  {
    to: "/app/messages",
    label: "Messages",
    icon: MessagesSquare,
    roles: ["admin", "lawyer", "paralegal", "client"],
    group: "Practice",
  },
  {
    to: "/app/billing",
    label: "Billing",
    icon: Receipt,
    roles: ["admin", "lawyer", "client"],
    group: "Practice",
  },
  {
    to: "/app/analytics",
    label: "Analytics",
    icon: BarChart3,
    roles: ["admin", "lawyer"],
    group: "Practice",
  },
  {
    to: "/app/ai",
    label: "AI Assistant",
    icon: Sparkles,
    roles: ["admin", "lawyer", "paralegal"],
    group: "System",
  },
  { to: "/app/settings", label: "Settings", icon: Settings, roles: ["admin"], group: "System" },
];

function AppLayout() {
  const { user, status, logout, isClient } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (status === "unauthenticated" || (status !== "loading" && !user)) {
      navigate({ to: "/login" });
    }
  }, [user, status, navigate]);

  if (status === "loading" || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const items = NAV.filter((i) => i.roles.includes(user.role));

  const groupedItems = items.reduce(
    (acc, item) => {
      if (!acc[item.group]) acc[item.group] = [];
      acc[item.group].push(item);
      return acc;
    },
    {} as Record<string, typeof items>,
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm lg:flex">
        <div className="flex h-16 items-center gap-3 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground shadow-sm">
            <Scale className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-sidebar-foreground">
              Vance & Hale
            </span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-sidebar-foreground/50">
              {isClient ? "Client Portal" : "Legal Workspace"}
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-6 px-4 py-6">
          {Object.entries(groupedItems).map(([group, groupItems]) => (
            <div key={group} className="space-y-1">
              <h4 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                {group}
              </h4>
              {groupItems.map((item) => {
                const Icon = item.icon;
                const active =
                  item.to === "/app" ? pathname === "/app" : pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={[
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <Avatar className="h-10 w-10 border border-sidebar-border shadow-sm">
              <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
                {user.avatar}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">{user.name}</p>
              <p className="truncate text-xs text-sidebar-foreground/60">{user.title}</p>
            </div>
            <button
              onClick={() => {
                logout();
                navigate({ to: "/login" });
              }}
              className="rounded-md p-2 text-sidebar-foreground/60 transition-colors hover:bg-destructive hover:text-destructive-foreground"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-4 border-b border-border bg-card px-6">
          <div className="relative hidden max-w-md flex-1 md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={
                isClient ? "Search your cases & documents…" : "Search cases, clients, documents…"
              }
              className="h-9 pl-9"
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Badge variant="secondary" className="hidden capitalize sm:inline-flex">
              {user.role}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-accent" />
                    <p className="text-sm font-medium">New message from Marcus Hale</p>
                  </div>
                  <p className="text-xs text-muted-foreground ml-4">
                    "James — the status conference is confirmed..."
                  </p>
                  <p className="text-[10px] text-muted-foreground ml-4 mt-1">2 hours ago</p>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-transparent border border-muted-foreground" />
                    <p className="text-sm font-medium">Document requested</p>
                  </div>
                  <p className="text-xs text-muted-foreground ml-4">
                    Please upload your W-2 for Case C2.
                  </p>
                  <p className="text-[10px] text-muted-foreground ml-4 mt-1">Yesterday</p>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="justify-center text-accent cursor-pointer">
                  View all notifications
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Avatar className="h-8 w-8 lg:hidden">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {user.avatar}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <AppErrorBoundary>
            <Outlet />
          </AppErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-border bg-card px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
