import { createFileRoute } from "@tanstack/react-router";
import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useApi } from "@/lib/use-api";
import { api, type User, type Role } from "@/lib/api";
import { PageHeader } from "@/components/ui-shared";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Dropdown } from "@/components/ui/dropdown";
import { toast } from "sonner";

export const Route = createFileRoute("/app/users")({
  component: UserManagementPage,
});

// --- Security & Audit Logging Hook ---
function useAuditLog() {
  const logAction = (action: string, details: Record<string, any>) => {
    // In a real application, send this to the backend API
    console.log(`[AUDIT LOG] ${action}`, { ...details, timestamp: new Date().toISOString() });
  };
  return { logAction };
}

function UserManagementPage() {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const { data: allUsers } = useApi(() => api.getUsers(), [refreshKey]);
  const { logAction } = useAuditLog();

  if (user?.role !== "admin") {
    return (
      <div>
        <PageHeader title="User Management" />
        <div className="p-6">
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <h2 className="text-xl font-bold text-destructive">Forbidden</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You do not have permission to access user management.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleRoleChange = async (userId: string, newRole: Role) => {
    try {
      await api.updateUserRole(userId, newRole);
      logAction("ROLE_UPDATE", { targetId: userId, newRole });
      toast.success("User role updated successfully!");
      setRefreshKey((prev) => prev + 1);
    } catch (err: any) {
      toast.error(err.message || "Failed to update user role");
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {row.original.avatar}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{row.original.name}</span>
            <span className="text-xs text-muted-foreground">{row.original.email}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <Badge
          variant={row.original.role === "admin" ? "default" : "outline"}
          className="capitalize"
        >
          {row.original.role}
        </Badge>
      ),
    },
    {
      accessorKey: "title",
      header: "Title",
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.original.phone || "—"}</span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <Dropdown>
            <Dropdown.Trigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                <span className="sr-only">Open menu</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-more-horizontal"
                >
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="19" cy="12" r="1" />
                  <circle cx="5" cy="12" r="1" />
                </svg>
              </Button>
            </Dropdown.Trigger>
            <Dropdown.Content align="end">
              <Dropdown.Label>Actions</Dropdown.Label>
              <Dropdown.Item
                className="cursor-pointer"
                onClick={() => handleRoleChange(row.original.id, "admin")}
              >
                Make Admin
              </Dropdown.Item>
              <Dropdown.Item
                className="cursor-pointer"
                onClick={() => handleRoleChange(row.original.id, "lawyer")}
              >
                Make Lawyer
              </Dropdown.Item>
              <Dropdown.Item
                className="cursor-pointer"
                onClick={() => handleRoleChange(row.original.id, "paralegal")}
              >
                Make Paralegal
              </Dropdown.Item>
              <Dropdown.Item
                className="cursor-pointer"
                onClick={() => handleRoleChange(row.original.id, "client")}
              >
                Make Client
              </Dropdown.Item>
              <Dropdown.Separator />
              <Dropdown.Item className="text-destructive cursor-pointer">
                Revoke Access
              </Dropdown.Item>
            </Dropdown.Content>
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div className="pb-10">
      <PageHeader
        title="User Management"
        description="Manage roles and access for the firm's staff and registered clients."
      />
      <div className="p-6">
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Firm Directory</h2>
              <p className="text-sm text-muted-foreground">
                Audit permissions and manage team member account types.
              </p>
            </div>
            <Button>Invite member</Button>
          </div>

          {allUsers && <DataTable columns={columns} data={allUsers} searchKey="name" />}
        </div>
      </div>
    </div>
  );
}
