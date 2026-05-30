import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Briefcase,
  Search,
  Plus,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreVertical,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useApi } from "@/lib/use-api";
import { api, type Case } from "@/lib/api";
import { PageHeader, statusColor } from "@/components/ui-shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export const Route = createFileRoute("/app/cases/")({
  component: CasesPage,
});

function CasesPage() {
  const { user, isClient } = useAuth();
  const {
    data: cases,
    loading,
    refresh: refreshCases,
  } = useApi(() => api.getCases(user!), [user?.id]);

  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    number: "",
    client: "",
    practice: "Civil Litigation",
    priority: "medium" as const,
    deadline: "",
  });

  const filteredCases = useMemo(() => {
    if (!cases) return [];
    return (cases as Case[]).filter(
      (c) =>
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.number.toLowerCase().includes(search.toLowerCase()) ||
        c.client.toLowerCase().includes(search.toLowerCase()),
    );
  }, [cases, search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.number || !form.client) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await api.createCase({
        id: `c-${Date.now()}`,
        number: form.number,
        title: form.title,
        client: form.client,
        clientId: null,
        practice: form.practice,
        stage: "Discovery",
        lead: user?.name || "Unassigned",
        priority: form.priority,
        nextDeadline: form.deadline || null,
        status: "active",
        openedAt: new Date().toISOString(),
        billable: 0,
      });
      refreshCases();
      setIsCreateOpen(false);
      setForm({
        title: "",
        number: "",
        client: "",
        practice: "Civil Litigation",
        priority: "medium",
        deadline: "",
      });
      toast.success("Case created successfully");
    } catch (error) {
      toast.error("Failed to create case");
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <PageHeader
        title="Matters & Cases"
        description="Track active litigation, client matters, and legal proceedings."
        actions={
          !isClient && (
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Case
            </Button>
          )
        }
      />

      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, number, or client..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Badge variant="secondary" className="px-3 py-1.5">
              {filteredCases.length} total cases
            </Badge>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Loading cases...
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-xl bg-muted/20">
            <Briefcase className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground font-medium">
              No cases found matching your search.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCases.map((c) => (
              <div
                key={c.id}
                className="group relative bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all hover:border-primary/20"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {c.number}
                    </p>
                    <h3 className="font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                      {c.title}
                    </h3>
                  </div>
                  <Badge variant="outline" className={statusColor(c.priority)}>
                    {c.priority}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 rounded-full bg-primary/40" />
                    <span className="font-medium text-foreground">{c.client}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">{c.practice}</span>
                  </div>

                  <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{c.nextDeadline ? `Next: ${c.nextDeadline}` : "No deadline set"}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-success/70" />
                      <span>{c.stage}</span>
                    </div>
                  </div>
                </div>

                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to="/app/cases/$caseId" params={{ caseId: c.id }}>
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/app/cases/$caseId/documents" params={{ caseId: c.id }}>
                          Manage Documents
                        </Link>
                      </DropdownMenuItem>
                      {!isClient && (
                        <DropdownMenuItem className="text-destructive">
                          Archive Case
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-120">
          <DialogHeader>
            <DialogTitle>Open New Case</DialogTitle>
            <DialogDescription>
              Create a new matter record to begin tracking documents and tasks.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="number">Case Number</Label>
                <Input
                  id="number"
                  placeholder="e.g. 2026-CV-001"
                  value={form.number}
                  onChange={(e) => setForm({ ...form, number: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(val: any) => setForm({ ...form, priority: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Case Title</Label>
              <Input
                id="title"
                placeholder="e.g. State v. Whitaker"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client">Client Name</Label>
              <Input
                id="client"
                placeholder="e.g. James Whitaker"
                value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="practice">Practice Area</Label>
                <Select
                  value={form.practice}
                  onValueChange={(val) => setForm({ ...form, practice: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Civil Litigation">Civil Litigation</SelectItem>
                    <SelectItem value="Family Law">Family Law</SelectItem>
                    <SelectItem value="Estate Planning">Estate Planning</SelectItem>
                    <SelectItem value="Criminal Defense">Criminal Defense</SelectItem>
                    <SelectItem value="Corporate Law">Corporate Law</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Next Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Case</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
