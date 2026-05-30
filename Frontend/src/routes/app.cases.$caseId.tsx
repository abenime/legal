import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useApi } from "@/lib/use-api";
import { api, Case } from "@/lib/api";
import { PageHeader } from "@/components/ui-shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  CheckCircle2,
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  Settings,
  User as UserIcon,
  Plus,
  Trash2,
  Save,
  Pencil,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/app/cases/$caseId")({
  component: CaseDetailsLayout,
});

function CaseDetailsLayout() {
  const { caseId } = Route.useParams();
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: caseData, loading, refresh } = useApi(() => api.getCase(caseId), [caseId]);

  const [isEditing, setIsEditing] = useState(false);
  const [editedCase, setEditedCase] = useState<Partial<Case>>({});
  const [newDetailKey, setNewDetailKey] = useState("");
  const [newDetailValue, setNewDetailValue] = useState("");

  const activeTab = pathname.endsWith("/documents")
    ? "documents"
    : pathname.endsWith("/tasks")
      ? "tasks"
      : pathname.endsWith("/events")
        ? "events"
        : "overview";

  if (loading)
    return <div className="p-8 text-center text-muted-foreground">Loading case details...</div>;
  if (!caseData) return <div className="p-8 text-center text-destructive">Case not found.</div>;

  const handleEdit = () => {
    setEditedCase({ ...caseData });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await api.updateCase(caseId, editedCase);
      toast.success("Case updated successfully");
      setIsEditing(false);
      refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to update case");
    }
  };

  const addDetail = () => {
    if (!newDetailKey.trim() || !newDetailValue.trim()) return;
    const currentDetails = editedCase.details || {};
    setEditedCase({
      ...editedCase,
      details: { ...currentDetails, [newDetailKey.trim()]: newDetailValue.trim() },
    });
    setNewDetailKey("");
    setNewDetailValue("");
  };

  const removeDetail = (key: string) => {
    const currentDetails = { ...editedCase.details };
    delete currentDetails[key];
    setEditedCase({ ...editedCase, details: currentDetails });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link to="/app/cases">
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Link>
          </Button>
          <div className="h-4 w-px bg-border mx-1" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold">{caseData.title}</h1>
              <Badge variant="outline" className="text-[10px] uppercase">
                {caseData.number}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {caseData.client} • {caseData.practice}
            </p>
          </div>
        </div>

        {user?.role !== "client" && (
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={handleEdit}>
                <Pencil className="h-4 w-4 mr-2" /> Edit Details
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Case Details</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Case Title</Label>
                    <Input
                      id="title"
                      value={editedCase.title || ""}
                      onChange={(e) => setEditedCase({ ...editedCase, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="practice">Practice Area</Label>
                    <Input
                      id="practice"
                      value={editedCase.practice || ""}
                      onChange={(e) => setEditedCase({ ...editedCase, practice: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="court">Court</Label>
                    <Input
                      id="court"
                      value={editedCase.court || ""}
                      onChange={(e) => setEditedCase({ ...editedCase, court: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="judge">Judge</Label>
                    <Input
                      id="judge"
                      value={editedCase.judge || ""}
                      onChange={(e) => setEditedCase({ ...editedCase, judge: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={editedCase.description || ""}
                    onChange={(e) => setEditedCase({ ...editedCase, description: e.target.value })}
                    placeholder="General overview of the case..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-4 border-t pt-4">
                  <Label className="text-base">Custom Details</Label>
                  <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                    <div className="space-y-1">
                      <Label htmlFor="key" className="text-[10px] uppercase text-muted-foreground">
                        Label
                      </Label>
                      <Input
                        id="key"
                        value={newDetailKey}
                        onChange={(e) => setNewDetailKey(e.target.value)}
                        placeholder="e.g. Opposing Counsel"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor="value"
                        className="text-[10px] uppercase text-muted-foreground"
                      >
                        Value
                      </Label>
                      <Input
                        id="value"
                        value={newDetailValue}
                        onChange={(e) => setNewDetailValue(e.target.value)}
                        placeholder="e.g. John Doe, Esq."
                      />
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      onClick={addDetail}
                      disabled={!newDetailKey || !newDetailValue}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {Object.entries(editedCase.details || {}).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-2 rounded-md bg-muted/50 border border-border"
                      >
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground leading-none mb-1">
                            {key}
                          </span>
                          <span className="text-sm">{value}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDetail(key)}
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} className="bg-success hover:bg-success/90">
                  <Save className="h-4 w-4 mr-2" /> Save Changes
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex-1 overflow-auto bg-muted/5">
        <div className="max-w-6xl mx-auto p-6">
          <Tabs value={activeTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview" asChild>
                <Link to="/app/cases/$caseId" params={{ caseId }}>
                  Overview
                </Link>
              </TabsTrigger>
              <TabsTrigger value="documents" asChild>
                <Link to="/app/cases/$caseId/documents" params={{ caseId }}>
                  Documents
                </Link>
              </TabsTrigger>
              <TabsTrigger value="tasks" asChild>
                <Link to="/app/cases/$caseId/tasks" params={{ caseId }}>
                  Tasks
                </Link>
              </TabsTrigger>
              <TabsTrigger value="events" asChild>
                <Link to="/app/cases/$caseId/events" params={{ caseId }}>
                  Calendar
                </Link>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 outline-none">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                  <div className="bg-card border border-border rounded-xl p-6">
                    <h2 className="text-sm font-semibold mb-4 flex items-center gap-2 border-b pb-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Case Information
                    </h2>

                    {caseData.description && (
                      <div className="mb-6">
                        <p className="text-muted-foreground mb-2 text-xs uppercase tracking-wider font-bold">
                          Description
                        </p>
                        <p className="text-sm leading-relaxed">{caseData.description}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-y-6 gap-x-8 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wider font-bold">
                          Court
                        </p>
                        <p className="font-medium">{caseData.court || "Not specified"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wider font-bold">
                          Judge
                        </p>
                        <p className="font-medium">{caseData.judge || "Not specified"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wider font-bold">
                          Stage
                        </p>
                        <p className="font-medium">{caseData.stage}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wider font-bold">
                          Priority
                        </p>
                        <p className="font-medium capitalize">{caseData.priority}</p>
                      </div>

                      {Object.entries(caseData.details || {}).map(([key, value]) => (
                        <div key={key}>
                          <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wider font-bold">
                            {key}
                          </p>
                          <p className="font-medium">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-xl p-6">
                    <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      Next Steps
                    </h2>
                    <div className="flex items-center justify-center h-24 border-2 border-dashed border-border rounded-lg bg-muted/20">
                      <p className="text-xs text-muted-foreground">
                        Detailed status tracking coming soon.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-card border border-border rounded-xl p-6">
                    <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-accent" />
                      Client & Lead
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wider font-bold">
                          Client
                        </p>
                        <p className="font-medium">{caseData.client}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wider font-bold">
                          Lead Attorney
                        </p>
                        <p className="font-medium">{caseData.lead}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-xl p-6">
                    <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-warning" />
                      Important Dates
                    </h2>
                    <div className="space-y-4 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Opened At</span>
                        <span className="font-medium">{caseData.openedAt}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Next Deadline</span>
                        <span className="font-medium text-destructive">
                          {caseData.nextDeadline || "—"}
                        </span>
                      </div>
                      {caseData.hearingDate && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Hearing Date</span>
                          <span className="font-medium">{caseData.hearingDate}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="documents" className="outline-none">
              <Outlet />
            </TabsContent>
            <TabsContent value="tasks" className="outline-none">
              <Outlet />
            </TabsContent>
            <TabsContent value="events" className="outline-none">
              <Outlet />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
