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
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

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
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
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
        <PageHeader title="Firm Profile" />
        <div className="p-6">
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <h2 className="text-xl font-bold text-destructive">Forbidden</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You do not have permission to access firm settings.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-10">
      <PageHeader title="Firm Profile" description="Manage your company public information and identity." />
      <div className="p-6">
        <FirmDetailsTab />
      </div>
    </div>
  );
}

function FirmDetailsTab() {
  const { data: settings, refresh } = useApi(() => api.getSettings(), []);
  const [isUploading, setIsUploading] = useState(false);
  
  const defaultValues = {
    firmName: "Vance & Hale LLP",
    address: "123 Legal Plaza, Suite 500, New York, NY 10001",
    phone: "+1 (555) 123-4567",
    email: "contact@vancehale.law",
    website: "https://vancehale.law",
  };

  const form = useForm<FirmDetailsFormValues>({
    resolver: zodResolver(firmDetailsSchema),
    defaultValues,
  });

  // Restore from backend if available
  useEffect(() => {
    if (settings) {
      form.reset({
        firmName: settings.firmName || defaultValues.firmName,
        address: settings.address || defaultValues.address,
        phone: settings.phone || defaultValues.phone,
        email: settings.email || defaultValues.email,
        website: settings.website || defaultValues.website,
      });
    }
  }, [settings, form]);

  const onSubmit = async (data: FirmDetailsFormValues) => {
    try {
      await api.updateSettings(data);
      refresh();
      toast.success("Firm profile updated successfully.");
    } catch (error) {
      toast.error("Failed to save firm details.");
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await api.uploadLogo(file);
      refresh();
      toast.success("Logo uploaded successfully.");
    } catch (error) {
      toast.error("Failed to upload logo.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-6 max-w-2xl">
      <h2 className="text-lg font-semibold text-foreground">Company Information</h2>
      <p className="mt-1 text-sm text-muted-foreground mb-6">
        This information appears on invoices, documents, and the client portal.
      </p>

      <div className="mb-8 flex flex-col gap-4">
        <Label>Company Logo</Label>
        <div className="flex items-center gap-6">
          <div className="h-24 w-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/30">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt="Logo" className="h-full w-full object-contain" />
            ) : (
              <span className="text-[10px] text-muted-foreground text-center px-2">No logo uploaded</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              className="relative cursor-pointer"
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Change Logo"}
              <input
                type="file"
                className="absolute inset-0 opacity-0 cursor-pointer"
                accept="image/*"
                onChange={handleLogoUpload}
              />
            </Button>
            <p className="text-[10px] text-muted-foreground">
              Recommended: 400x400px. PNG, JPG or SVG.
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <div className="grid gap-6">
          <div className="space-y-2">
            <Label htmlFor="firmName">Firm name</Label>
            <Input id="firmName" {...form.register("firmName")} />
            {form.formState.errors.firmName && (
              <p className="text-xs text-destructive">{form.formState.errors.firmName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Business Address</Label>
            <Input id="address" {...form.register("address")} placeholder="Full street address, city, state, zip" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" {...form.register("phone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Public Email</Label>
              <Input id="email" {...form.register("email")} />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Company Website</Label>
            <Input id="website" {...form.register("website")} placeholder="https://example.com" />
            {form.formState.errors.website && (
              <p className="text-xs text-destructive">{form.formState.errors.website.message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit">Save profile</Button>
        </div>
      </form>
    </div>
  );
}
