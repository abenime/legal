import { createFileRoute } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useApi } from "@/lib/use-api";
import { api, type User, type Role } from "@/lib/api";
import { PageHeader } from "@/components/ui-shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Dropdown } from "@/components/ui/dropdown";
import { toast } from "sonner";

// --- Form State Persistence & Recovery Hook ---
function useFormDraft<T>(key: string, defaultValues: T) {
  const [draft, setDraft] = useState<T | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setDraft(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }
  }, [key]);

  const saveDraft = (data: T) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const clearDraft = () => {
    localStorage.removeItem(key);
    setDraft(null);
  };

  return { draft, saveDraft, clearDraft };
}

// --- Security & Audit Logging Hook ---
function useAuditLog() {
  const logAction = (action: string, details: Record<string, any>) => {
    // In a real application, send this to the backend API
    console.log(`[AUDIT LOG] ${action}`, { ...details, timestamp: new Date().toISOString() });
  };
  return { logAction };
}

// --- Firm Details Schema ---
const firmDetailsSchema = z.object({
  firmName: z.string().min(2, "Firm name must be at least 2 characters"),
  domain: z.string().url("Must be a valid URL"),
  primaryColor: z.string().regex(/^#([0-9a-f]{3}){1,2}$/i, "Invalid hex color"),
  accentColor: z.string().regex(/^#([0-9a-f]{3}){1,2}$/i, "Invalid hex color"),
});
type FirmDetailsFormValues = z.infer<typeof firmDetailsSchema>;

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();

  if (user?.role !== "admin") {
    return (
      <div>
        <PageHeader title="Settings" />
        <div className="p-6">
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <h2 className="text-xl font-bold text-destructive">Forbidden</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You do not have permission to access the admin settings.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-10">
      <PageHeader title="Settings" description="Firm profile, team, and configuration." />
      <div className="p-6">
        <Tabs defaultValue="firm" className="w-full">
          <TabsList className="mb-6 grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="firm">Firm Details</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="permissions">Permissions Matrix</TabsTrigger>
          </TabsList>

          <TabsContent value="firm">
            <FirmDetailsTab />
          </TabsContent>

          <TabsContent value="users">
            <UserManagementTab />
          </TabsContent>

          <TabsContent value="permissions">
            <PermissionsMatrixTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function FirmDetailsTab() {
  const defaultValues = {
    firmName: "Vance & Hale LLP",
    domain: "https://clients.vancehale.law",
    primaryColor: "#1f2a4d",
    accentColor: "#c89a3c",
  };

  const { draft, saveDraft, clearDraft } = useFormDraft<FirmDetailsFormValues>(
    "firm-settings-draft",
    defaultValues,
  );

  const form = useForm<FirmDetailsFormValues>({
    resolver: zodResolver(firmDetailsSchema),
    defaultValues,
  });

  // Restore draft if available
  useEffect(() => {
    if (draft) {
      if (window.confirm("A draft was found from your last session. Restore it?")) {
        form.reset(draft);
      } else {
        clearDraft();
      }
    }
  }, [draft, form, clearDraft]);

  const onSubmit = (data: FirmDetailsFormValues) => {
    console.log("Saving firm details:", data);
    clearDraft();
    alert("Firm details saved successfully.");
  };

  return (
    <div className="rounded-lg border border-border bg-card p-6 max-w-2xl">
      <h2 className="text-lg font-semibold text-foreground">Firm Configuration</h2>
      <p className="mt-1 text-sm text-muted-foreground mb-6">
        Branding visible to clients in the portal.
      </p>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        onChange={() => saveDraft(form.getValues())}
        className="space-y-6"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firmName">Firm name</Label>
            <Input id="firmName" {...form.register("firmName")} />
            {form.formState.errors.firmName && (
              <p className="text-xs text-destructive">{form.formState.errors.firmName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="domain">Custom domain</Label>
            <Input id="domain" {...form.register("domain")} />
            {form.formState.errors.domain && (
              <p className="text-xs text-destructive">{form.formState.errors.domain.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Primary color</Label>
            <Input
              id="primaryColor"
              type="color"
              {...form.register("primaryColor")}
              className="h-10 px-2"
            />
            {form.formState.errors.primaryColor && (
              <p className="text-xs text-destructive">
                {form.formState.errors.primaryColor.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="accentColor">Accent color</Label>
            <Input
              id="accentColor"
              type="color"
              {...form.register("accentColor")}
              className="h-10 px-2"
            />
            {form.formState.errors.accentColor && (
              <p className="text-xs text-destructive">
                {form.formState.errors.accentColor.message}
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-border pt-6 mt-6">
          <h3 className="text-sm font-semibold mb-4">System Preferences</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Require 2FA</p>
                <p className="text-xs text-muted-foreground">
                  Force all staff members to use Two-Factor Authentication
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Data Retention Policy</p>
                <p className="text-xs text-muted-foreground">
                  Automatically archive cases inactive for 7 years
                </p>
              </div>
              <Switch />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit">Save changes</Button>
        </div>
      </form>
    </div>
  );
}

function UserManagementTab() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { data: allUsers } = useApi(() => api.getUsers(), [refreshKey]);
  const { logAction } = useAuditLog();

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
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">User Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage roles and access for the firm's staff and registered clients.
          </p>
        </div>
        <Button>Invite member</Button>
      </div>

      {allUsers && <DataTable columns={columns} data={allUsers} searchKey="name" />}
    </div>
  );
}

function PermissionsMatrixTab() {
  const roles = ["Admin", "Lawyer", "Paralegal", "Client"];
  const features = [
    "Manage Firm Settings",
    "Invite New Users",
    "Delete Cases",
    "Create New Cases",
    "View Billing Info",
    "Message Clients",
    "Upload Documents",
  ];

  const defaultMatrix: Record<string, boolean[]> = {
    "Manage Firm Settings": [true, false, false, false],
    "Invite New Users": [true, false, false, false],
    "Delete Cases": [true, true, false, false],
    "Create New Cases": [true, true, true, false],
    "View Billing Info": [true, true, false, true],
    "Message Clients": [true, true, true, true],
    "Upload Documents": [true, true, true, true],
  };

  return (
    <div className="rounded-lg border border-border bg-card p-6 overflow-x-auto">
      <h2 className="text-lg font-semibold text-foreground mb-1">Roles & Permissions Matrix</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Audit and adjust granular permissions across the system roles.
      </p>

      <table className="w-full text-sm text-left">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium rounded-tl-md">Feature / Capability</th>
            {roles.map((role, i) => (
              <th
                key={role}
                className={`px-4 py-3 font-medium text-center ${i === roles.length - 1 ? "rounded-tr-md" : ""}`}
              >
                {role}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {features.map((feature) => (
            <tr key={feature} className="hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3 font-medium">{feature}</td>
              {roles.map((role, index) => (
                <td key={`${feature}-${role}`} className="px-4 py-3 text-center">
                  <Checkbox
                    defaultChecked={defaultMatrix[feature][index]}
                    disabled={role === "Admin"}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
