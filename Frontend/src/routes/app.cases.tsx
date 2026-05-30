import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  ArrowUpDown,
  CalendarDays,
  CheckCircle2,
  Filter,
  FileText,
  ListTodo,
  Plus,
  Search,
  SlidersHorizontal,
  Users,
  Clock3,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useApi } from "@/lib/use-api";
import { api, type Case } from "@/lib/api";
import { PageHeader, StatCard, statusColor } from "@/components/ui-shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/app/cases")({
  component: CasesPage,
});

type SortKey = "deadline" | "openedAt" | "priority" | "status" | "billable";
type TaskStatus = "todo" | "in_progress" | "review" | "done" | string;
type CaseStatusFilter = "all" | "active" | "pending" | "closed";

interface CaseTask {
  id: string;
  caseId: string;
  title: string;
  assignee: string;
  due: string;
  status: TaskStatus;
  priority: "low" | "medium" | "high";
  notes?: string;
}

interface CaseTimelineItem {
  label: string;
  value: string;
}

interface CaseDocument {
  id: string;
  caseId: string;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  signed: boolean;
}

interface NewCaseForm {
  number: string;
  title: string;
  client: string;
  practice: string;
  stage: string;
  lead: string;
  court: string;
  judge: string;
  hearingDate: string;
  priority: "low" | "medium" | "high";
  nextDeadline: string;
}

const SORT_LABELS: Record<SortKey, string> = {
  deadline: "Deadline",
  openedAt: "Opened",
  priority: "Priority",
  status: "Status",
  billable: "Billable",
};

const STATUS_FILTER_LABELS: Record<CaseStatusFilter, string> = {
  all: "All statuses",
  active: "Active",
  pending: "Pending",
  closed: "Closed",
};

const CASE_STATUS_ORDER: Record<string, number> = {
  active: 0,
  pending: 1,
  closed: 2,
  archived: 2,
};

const CASE_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  pending: "Pending",
  closed: "Closed",
  archived: "Closed",
};

const PRIORITY_RANK: Record<Case["priority"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const STAGE_STYLES: Record<string, string> = {
  intake: "bg-secondary text-secondary-foreground border-border",
  drafting: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  discovery: "bg-accent/10 text-accent border-accent/20",
  filing: "bg-chart-1/10 text-chart-1 border-chart-1/20",
  trial: "bg-destructive/10 text-destructive border-destructive/20",
  closed: "bg-muted text-muted-foreground border-border",
};

function stageColor(stage: string) {
  return (
    STAGE_STYLES[stage.toLowerCase()] ?? "bg-secondary text-secondary-foreground border-border"
  );
}

function normalizeCaseStatus(status: string) {
  return status === "archived" ? "closed" : status;
}

function caseStatusLabel(status: string) {
  return CASE_STATUS_LABELS[status] ?? status;
}

function caseStatusColor(status: string) {
  return statusColor(normalizeCaseStatus(status));
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return format(new Date(value), "MMM d, yyyy");
}

function initialCaseForm(): NewCaseForm {
  return {
    number: "",
    title: "",
    client: "",
    practice: "",
    stage: "Intake",
    lead: "",
    court: "",
    judge: "",
    hearingDate: "",
    priority: "medium",
    nextDeadline: "",
  };
}

function CasesPage() {
  const { user, isClient } = useAuth();
  const { data: cases, loading } = useApi(() => api.getCases(user!), [user?.id]);
  const { data: fetchedTasks } = useApi(() => api.getTasks(user!), [user?.id]);
  const { data: fetchedDocuments } = useApi(() => api.getDocuments(user!), [user?.id]);
  const { data: staff } = useApi(() => api.getStaff(), []);

  const [search, setSearch] = useState("");
  const [practiceFilter, setPracticeFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [leadFilter, setLeadFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<CaseStatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("deadline");
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [localCases, setLocalCases] = useState<Case[]>([]);
  const [localTasks, setLocalTasks] = useState<CaseTask[]>([]);
  const [form, setForm] = useState<NewCaseForm>(initialCaseForm());
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof NewCaseForm, string>>>({});
  const [taskDraft, setTaskDraft] = useState({
    template: "",
    assignee: "",
    due: "",
    priority: "medium" as CaseTask["priority"],
    notes: "",
  });

  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [selectedCaseForDocs, setSelectedCaseForDocs] = useState<Case | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<CaseDocument | null>(null);

  const initialDocuments = useMemo(
    () => (Array.isArray(fetchedDocuments) ? (fetchedDocuments as CaseDocument[]) : []),
    [fetchedDocuments],
  );

  useEffect(() => {
    setDocuments(initialDocuments);
  }, [initialDocuments]);

  const mergedCases = useMemo(() => {
    const initialCases = Array.isArray(cases) ? (cases as Case[]) : [];
    return [...initialCases, ...localCases];
  }, [cases, localCases]);

  const activeCases = useMemo(() => {
    return mergedCases.filter((c) => normalizeCaseStatus(c.status) === "active").length;
  }, [mergedCases]);

  const dueSoon = useMemo(() => {
    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + 14);

    return mergedCases.filter((c) => {
      if (!c.nextDeadline) return false;
      const deadline = new Date(c.nextDeadline);
      return deadline >= today && deadline <= future && normalizeCaseStatus(c.status) === "active";
    }).length;
  }, [mergedCases]);

  const totalBillable = useMemo(() => {
    return mergedCases.reduce((sum, c) => sum + (c.billable || 0), 0);
  }, [mergedCases]);

  const practiceOptions = useMemo(
    () => Array.from(new Set(mergedCases.map((c) => c.practice))).sort(),
    [mergedCases],
  );
  const stageOptions = useMemo(
    () => Array.from(new Set(mergedCases.map((c) => c.stage))).sort(),
    [mergedCases],
  );
  const leadOptions = useMemo(
    () => Array.from(new Set(mergedCases.map((c) => c.lead))).sort(),
    [mergedCases],
  );

  const filteredCases = useMemo(() => {
    let result = mergedCases;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.client.toLowerCase().includes(q) ||
          c.number.toLowerCase().includes(q),
      );
    }

    if (practiceFilter !== "all") {
      result = result.filter((c) => c.practice === practiceFilter);
    }
    if (stageFilter !== "all") {
      result = result.filter((c) => c.stage === stageFilter);
    }
    if (leadFilter !== "all") {
      result = result.filter((c) => c.lead === leadFilter);
    }
    if (priorityFilter !== "all") {
      result = result.filter((c) => c.priority === priorityFilter);
    }
    if (statusFilter !== "all") {
      result = result.filter((c) => normalizeCaseStatus(c.status) === statusFilter);
    }

    return result.sort((a, b) => {
      if (sortKey === "deadline") {
        const da = a.nextDeadline ? new Date(a.nextDeadline).getTime() : Infinity;
        const db = b.nextDeadline ? new Date(b.nextDeadline).getTime() : Infinity;
        return da - db;
      }
      if (sortKey === "openedAt") {
        const da = a.openedAt ? new Date(a.openedAt).getTime() : 0;
        const db = b.openedAt ? new Date(b.openedAt).getTime() : 0;
        return db - da;
      }
      if (sortKey === "priority") {
        return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      }
      if (sortKey === "status") {
        return (
          (CASE_STATUS_ORDER[normalizeCaseStatus(a.status)] ?? 99) -
          (CASE_STATUS_ORDER[normalizeCaseStatus(b.status)] ?? 99)
        );
      }
      if (sortKey === "billable") {
        return (b.billable || 0) - (a.billable || 0);
      }
      return 0;
    });
  }, [
    mergedCases,
    search,
    practiceFilter,
    stageFilter,
    leadFilter,
    priorityFilter,
    statusFilter,
    sortKey,
  ]);

  const selectedCase = useMemo(() => {
    return mergedCases.find((c) => c.id === selectedCaseId) || null;
  }, [mergedCases, selectedCaseId]);

  const mergedTasks = useMemo(() => {
    const apiTasks = Array.isArray(fetchedTasks) ? (fetchedTasks as CaseTask[]) : [];
    return [...apiTasks, ...localTasks];
  }, [fetchedTasks, localTasks]);

  const selectedTasks = useMemo(() => {
    if (!selectedCase) return [];
    return mergedTasks.filter((t) => t.caseId === selectedCase.id);
  }, [mergedTasks, selectedCase]);

  const taskProgress = useMemo(() => {
    if (selectedTasks.length === 0) return 0;
    const done = selectedTasks.filter((t) => t.status === "done").length;
    return Math.round((done / selectedTasks.length) * 100);
  }, [selectedTasks]);

  const taskTemplates = [
    "Initial client intake",
    "Review opposing counsel documents",
    "Draft responsive pleading",
    "Prepare exhibits",
    "Schedule deposition",
  ];

  const assigneeOptions = useMemo(() => {
    if (Array.isArray(staff)) {
      return staff.map((s: { name: string }) => s.name);
    }
    return ["Alex P.", "Sarah C.", "Michael R."];
  }, [staff]);

  const selectedDocuments = useMemo(() => {
    if (!selectedCase) return [];
    return documents.filter((d) => d.caseId === selectedCase.id);
  }, [documents, selectedCase]);

  const resetFilters = () => {
    setSearch("");
    setPracticeFilter("all");
    setStageFilter("all");
    setLeadFilter("all");
    setPriorityFilter("all");
    setStatusFilter("all");
    setSortKey("deadline");
  };

  const openNewCaseDialog = () => {
    setForm(initialCaseForm());
    setFormErrors({});
    setIsCreateOpen(true);
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    setLocalTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
  };

  const addWorkflowTask = () => {
    if (!selectedCase) return;
    const newTask: CaseTask = {
      id: `local-task-${Date.now()}`,
      caseId: selectedCase.id,
      title: taskDraft.template,
      assignee: taskDraft.assignee,
      due: taskDraft.due,
      status: "todo",
      priority: taskDraft.priority,
      notes: taskDraft.notes,
    };
    setLocalTasks((prev) => [...prev, newTask]);
    setTaskDraft({
      template: "",
      assignee: "",
      due: "",
      priority: "medium",
      notes: "",
    });
    toast.success("Task added to workflow");
  };

  const submitCaseForm = async () => {
    const errors: Partial<Record<keyof NewCaseForm, string>> = {};
    if (!form.number) errors.number = "Required";
    if (!form.title) errors.title = "Required";
    if (!form.client) errors.client = "Required";
    if (!form.practice) errors.practice = "Required";
    if (!form.stage) errors.stage = "Required";
    if (!form.lead) errors.lead = "Required";
    if (!form.nextDeadline) errors.nextDeadline = "Required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const newCase: Case = {
        id: `local-case-${Date.now()}`,
        number: form.number,
        title: form.title,
        client: form.client,
        clientId: null,
        practice: form.practice,
        stage: form.stage,
        lead: form.lead,
        court: form.court || undefined,
        judge: form.judge || undefined,
        hearingDate: form.hearingDate || undefined,
        priority: form.priority,
        nextDeadline: form.nextDeadline,
        status: "active",
        openedAt: new Date().toISOString(),
        billable: 0,
      };

      setLocalCases((prev) => [...prev, newCase]);
      setIsCreateOpen(false);
      toast.success("Case created successfully");
    } catch (error) {
      toast.error("Failed to create case");
    }
  };

  const handleSignDocument = (docId: string) => {
    setDocuments((docs) => docs.map((doc) => (doc.id === docId ? { ...doc, signed: true } : doc)));
    setSelectedDoc((prev: CaseDocument | null) => (prev ? { ...prev, signed: true } : null));
    toast.success("Document signed successfully");
  };

  const getMockDocumentPages = (docName: string, doc: CaseDocument): string[] => {
    return [
      `This is a simulated preview of ${docName}. In a real environment, this would render a PDF, image, or Office document.`,
      `Additional page content for ${docName}. Metadata: Size ${doc.size}, Uploaded by ${doc.uploadedBy} on ${doc.uploadedAt}.`,
    ];
  };

  const currentStatusLabel = STATUS_FILTER_LABELS[statusFilter];

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={isClient ? "Your matters" : "Cases"}
        description={
          isClient
            ? "Every matter your firm is handling for you."
            : "Search, sort, and manage matters, workflows, and deadlines."
        }
        actions={
          !isClient && (
            <>
              <Button variant="outline" onClick={resetFilters}>
                <Filter className="mr-2 h-4 w-4" /> Filter
              </Button>
              <Button onClick={openNewCaseDialog}>
                <Plus className="mr-2 h-4 w-4" /> New case
              </Button>
            </>
          )
        }
      />
      <div className="grid gap-4 px-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total matters"
          value={mergedCases.length.toString()}
          hint="Loaded from mock data"
        />
        <StatCard
          label="Active matters"
          value={activeCases.toString()}
          hint="Currently open files"
        />
        <StatCard
          label="Due in 14 days"
          value={dueSoon.toString()}
          hint="Deadline watchlist"
          icon={Clock3}
        />
        <StatCard
          label="Billable hours"
          value={totalBillable.toFixed(1)}
          hint="Across all visible matters"
          icon={CalendarDays}
        />
      </div>

      <div className="grid gap-6 px-6 pb-6 xl:grid-cols-[1.45fr_0.95fr]">
        <section className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="space-y-4 border-b border-border p-4">
            <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search matters, clients, leads…"
                  className="h-10 pl-9"
                />
              </div>

              <Select value={practiceFilter} onValueChange={setPracticeFilter}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Practice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All practices</SelectItem>
                  {practiceOptions.map((practice) => (
                    <SelectItem key={practice} value={practice}>
                      {practice}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stages</SelectItem>
                  {stageOptions.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {stage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={leadFilter} onValueChange={setLeadFilter}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Assigned attorney" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All attorneys</SelectItem>
                  {leadOptions.map((lead) => (
                    <SelectItem key={lead} value={lead}>
                      {lead}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortKey} onValueChange={(value) => setSortKey(value as SortKey)}>
                <SelectTrigger className="h-10">
                  <ArrowUpDown className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SORT_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(Object.keys(STATUS_FILTER_LABELS) as CaseStatusFilter[]).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {STATUS_FILTER_LABELS[status]}
                </Button>
              ))}
              <Button
                variant={priorityFilter === "all" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setPriorityFilter("all")}
              >
                All priorities
              </Button>
              <Button
                variant={priorityFilter === "high" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setPriorityFilter("high")}
              >
                High
              </Button>
              <Button
                variant={priorityFilter === "medium" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setPriorityFilter("medium")}
              >
                Medium
              </Button>
              <Button
                variant={priorityFilter === "low" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setPriorityFilter("low")}
              >
                Low
              </Button>
              <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                <SlidersHorizontal className="h-4 w-4" />
                {filteredCases.length} matter{filteredCases.length === 1 ? "" : "s"} found
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Case number</th>
                  <th className="px-5 py-3 text-left font-medium">Title</th>
                  {!isClient && <th className="px-5 py-3 text-left font-medium">Client</th>}
                  <th className="px-5 py-3 text-left font-medium">Practice</th>
                  <th className="px-5 py-3 text-left font-medium">Stage</th>
                  <th className="px-5 py-3 text-left font-medium">Lead</th>
                  <th className="px-5 py-3 text-left font-medium">
                    <button
                      className="inline-flex items-center gap-1 hover:text-foreground"
                      onClick={() => setSortKey("deadline")}
                    >
                      Deadline <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-5 py-3 text-left font-medium">
                    <button
                      className="inline-flex items-center gap-1 hover:text-foreground"
                      onClick={() => setSortKey("status")}
                    >
                      Status <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-5 py-3 text-left font-medium">
                    <button
                      className="inline-flex items-center gap-1 hover:text-foreground"
                      onClick={() => setSortKey("priority")}
                    >
                      Priority <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading && (
                  <tr>
                    <td
                      colSpan={isClient ? 8 : 9}
                      className="px-5 py-10 text-center text-muted-foreground"
                    >
                      Loading…
                    </td>
                  </tr>
                )}

                {!loading && filteredCases.length === 0 && (
                  <tr>
                    <td colSpan={isClient ? 8 : 9} className="px-5 py-12 text-center">
                      <div className="mx-auto max-w-sm space-y-2">
                        <p className="font-medium text-foreground">
                          No matters match the current filters.
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Clear the search or filters to return to the full case list.
                        </p>
                        <Button variant="outline" size="sm" onClick={resetFilters}>
                          Clear filters
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}

                {filteredCases.map((item) => {
                  const isSelected = item.id === selectedCase?.id;
                  return (
                    <tr
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedCaseId(item.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedCaseId(item.id);
                        }
                      }}
                      className={`cursor-pointer transition-colors hover:bg-secondary/40 ${
                        isSelected ? "bg-secondary/50" : ""
                      }`}
                    >
                      <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">
                        {item.number}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-foreground">
                        <span className="truncate">{item.title}</span>
                      </td>
                      {!isClient && <td className="px-5 py-3.5 text-foreground">{item.client}</td>}
                      <td className="px-5 py-3.5 text-muted-foreground">{item.practice}</td>
                      <td className="px-5 py-3.5">
                        <Badge variant="outline" className={stageColor(item.stage)}>
                          {item.stage}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">{item.lead}</td>
                      <td className="px-5 py-3.5 text-foreground">
                        {formatDate(item.nextDeadline)}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant="outline" className={caseStatusColor(item.status)}>
                          {caseStatusLabel(item.status)}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant="outline" className={statusColor(item.priority)}>
                          {item.priority}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="overflow-hidden rounded-lg border border-border bg-card">
          {selectedCase ? (
            <div className="flex h-full flex-col">
              <div className="border-b border-border p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs text-muted-foreground">{selectedCase.number}</p>
                    <h2 className="mt-1 truncate text-xl font-semibold tracking-tight text-foreground">
                      {selectedCase.title}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">{selectedCase.client}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline" className={stageColor(selectedCase.stage)}>
                      {selectedCase.stage}
                    </Badge>
                    <Badge variant="outline" className={caseStatusColor(selectedCase.status)}>
                      {caseStatusLabel(selectedCase.status)}
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-lg border border-border bg-secondary/30 p-3">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Lead</p>
                    <p className="mt-1 font-medium text-foreground">{selectedCase.lead}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-secondary/30 p-3">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Deadline
                    </p>
                    <p className="mt-1 font-medium text-foreground">
                      {formatDate(selectedCase.nextDeadline)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-secondary/30 p-3">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Opened</p>
                    <p className="mt-1 font-medium text-foreground">
                      {formatDate(selectedCase.openedAt)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-secondary/30 p-3">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Billable
                    </p>
                    <p className="mt-1 font-medium text-foreground">
                      {selectedCase.billable.toFixed(1)} hrs
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-secondary/30 p-3">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Court</p>
                    <p className="mt-1 font-medium text-foreground">{selectedCase.court ?? "—"}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-secondary/30 p-3">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Judge</p>
                    <p className="mt-1 font-medium text-foreground">{selectedCase.judge ?? "—"}</p>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="overview" className="flex min-h-0 flex-1 flex-col">
                <div className="border-b border-border px-5 pt-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="workflow">Workflow</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="overview" className="m-0 flex-1 overflow-y-auto p-5">
                  <div className="space-y-5">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Users className="h-4 w-4 text-muted-foreground" /> Team members
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                          <div>
                            <p className="text-sm font-medium text-foreground">Lead attorney</p>
                            <p className="text-xs text-muted-foreground">Primary matter owner</p>
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-secondary text-secondary-foreground"
                          >
                            {selectedCase.lead}
                          </Badge>
                        </div>
                        {Array.from(new Set(selectedTasks.map((item) => item.assignee)))
                          .filter((name) => name !== selectedCase.lead)
                          .map((name) => (
                            <div
                              key={name}
                              className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                            >
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  Assigned team member
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Works active tasks on this matter
                                </p>
                              </div>
                              <Badge
                                variant="outline"
                                className="bg-secondary text-secondary-foreground"
                              >
                                {name}
                              </Badge>
                            </div>
                          ))}
                        {selectedTasks.length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            No additional team members are assigned yet.
                          </p>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <ListTodo className="h-4 w-4 text-muted-foreground" /> Timeline
                      </div>
                      <div className="mt-3 space-y-3">
                        {(
                          [
                            { label: "Opened", value: formatDate(selectedCase.openedAt) },
                            {
                              label: "Next deadline",
                              value: formatDate(selectedCase.nextDeadline),
                            },
                            { label: "Hearing date", value: formatDate(selectedCase.hearingDate) },
                            { label: "Current stage", value: selectedCase.stage },
                            { label: "Workflow progress", value: `${taskProgress}% complete` },
                          ] satisfies CaseTimelineItem[]
                        ).map((item) => (
                          <div
                            key={item.label}
                            className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                          >
                            <p className="text-sm text-muted-foreground">{item.label}</p>
                            <p className="text-sm font-medium text-foreground">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <FileText className="h-4 w-4 text-muted-foreground" /> Quick facts
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border border-border p-3">
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">
                            Practice
                          </p>
                          <p className="mt-1 text-sm font-medium text-foreground">
                            {selectedCase.practice}
                          </p>
                        </div>
                        <div className="rounded-lg border border-border p-3">
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">
                            Client
                          </p>
                          <p className="mt-1 text-sm font-medium text-foreground">
                            {selectedCase.client}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="workflow" className="m-0 flex-1 overflow-y-auto p-5">
                  <div className="space-y-5">
                    <div className="rounded-lg border border-border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">Task progress</p>
                          <p className="text-xs text-muted-foreground">
                            {selectedTasks.length} task{selectedTasks.length === 1 ? "" : "s"}{" "}
                            linked to this matter
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-secondary text-secondary-foreground">
                          {taskProgress}% complete
                        </Badge>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${taskProgress}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      {selectedTasks.map((task) => (
                        <div key={task.id} className="rounded-lg border border-border p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-foreground">{task.title}</p>
                              {task.notes && (
                                <p className="mt-1 text-xs text-muted-foreground">{task.notes}</p>
                              )}
                              <p className="mt-1 text-xs text-muted-foreground">
                                Due {formatDate(task.due)} · {task.assignee}
                              </p>
                            </div>
                            <Badge variant="outline" className={statusColor(task.status)}>
                              {task.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <Badge variant="outline" className={statusColor(task.priority)}>
                              {task.priority}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="bg-secondary text-secondary-foreground"
                            >
                              {task.assignee}
                            </Badge>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                              variant={task.status === "todo" ? "secondary" : "outline"}
                              size="sm"
                              onClick={() => updateTaskStatus(task.id, "todo")}
                            >
                              To do
                            </Button>
                            <Button
                              variant={task.status === "in_progress" ? "secondary" : "outline"}
                              size="sm"
                              onClick={() => updateTaskStatus(task.id, "in_progress")}
                            >
                              In progress
                            </Button>
                            <Button
                              variant={task.status === "review" ? "secondary" : "outline"}
                              size="sm"
                              onClick={() => updateTaskStatus(task.id, "review")}
                            >
                              Review
                            </Button>
                            <Button
                              variant={task.status === "done" ? "secondary" : "outline"}
                              size="sm"
                              onClick={() => updateTaskStatus(task.id, "done")}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" /> Done
                            </Button>
                          </div>
                        </div>
                      ))}

                      {!selectedTasks.length && (
                        <div className="rounded-lg border border-dashed border-border p-6 text-center">
                          <p className="text-sm font-medium text-foreground">
                            No tasks are attached to this matter yet.
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Use the form below to add a template task from the firm’s workflow
                            library.
                          </p>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-4 rounded-lg border border-border bg-secondary/20 p-4">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Add workflow task</p>
                        <p className="text-xs text-muted-foreground">
                          Select a task template, assign it, and set a deadline.
                        </p>
                      </div>

                      <div className="grid gap-3">
                        <Select
                          value={taskDraft.template}
                          onValueChange={(value) =>
                            setTaskDraft((current) => ({ ...current, template: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Task template" />
                          </SelectTrigger>
                          <SelectContent>
                            {taskTemplates.map((template) => (
                              <SelectItem key={template} value={template}>
                                {template}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <Select
                            value={taskDraft.assignee}
                            onValueChange={(value) =>
                              setTaskDraft((current) => ({ ...current, assignee: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Assignee" />
                            </SelectTrigger>
                            <SelectContent>
                              {assigneeOptions.map((name) => (
                                <SelectItem key={name} value={name}>
                                  {name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Input
                            type="date"
                            value={taskDraft.due}
                            onChange={(event) =>
                              setTaskDraft((current) => ({ ...current, due: event.target.value }))
                            }
                          />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
                          <Textarea
                            value={taskDraft.notes}
                            onChange={(event) =>
                              setTaskDraft((current) => ({ ...current, notes: event.target.value }))
                            }
                            placeholder="Optional notes or scope"
                            className="min-h-24"
                          />
                          <Select
                            value={taskDraft.priority}
                            onValueChange={(value) =>
                              setTaskDraft((current) => ({
                                ...current,
                                priority: value as CaseTask["priority"],
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <Button
                          onClick={addWorkflowTask}
                          disabled={!taskDraft.template || !taskDraft.assignee || !taskDraft.due}
                        >
                          Add task
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="documents" className="m-0 flex-1 overflow-y-auto p-5">
                  <div className="space-y-3">
                    {selectedDocuments.map((document) => (
                      <div key={document.id} className="rounded-lg border border-border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-foreground">{document.name}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {document.type} · {document.size} · Uploaded{" "}
                              {formatDate(document.uploadedAt)}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              document.signed
                                ? "bg-success/10 text-success border-success/20"
                                : "bg-muted text-muted-foreground border-border"
                            }
                          >
                            {document.signed ? "Signed" : "Unsigned"}
                          </Badge>
                        </div>
                        <p className="mt-3 text-xs text-muted-foreground">
                          Uploaded by {document.uploadedBy}
                        </p>
                      </div>
                    ))}

                    {!selectedDocuments.length && (
                      <div className="rounded-lg border border-dashed border-border p-6 text-center">
                        <p className="text-sm font-medium text-foreground">
                          No documents linked to this matter.
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Once the document management flow is connected, linked files will appear
                          here.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="flex h-full min-h-135 items-center justify-center p-8 text-center">
              <div className="max-w-md">
                <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
                <h3 className="mb-2 text-lg font-semibold text-foreground">No matter selected</h3>
                <p className="text-sm text-muted-foreground">
                  Choose a case from the table to view the matter dashboard, workflow, and linked
                  documents.
                </p>
              </div>
            </div>
          )}
        </aside>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>New case</DialogTitle>
            <DialogDescription>
              Create a matter shell with validation so the team can immediately work from a clean
              record.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Input
                value={form.number}
                onChange={(event) =>
                  setForm((current) => ({ ...current, number: event.target.value }))
                }
                placeholder="Case number"
              />
              {formErrors.number && <p className="text-xs text-destructive">{formErrors.number}</p>}
            </div>

            <div className="space-y-2">
              <Input
                value={form.client}
                onChange={(event) =>
                  setForm((current) => ({ ...current, client: event.target.value }))
                }
                placeholder="Client name"
              />
              {formErrors.client && <p className="text-xs text-destructive">{formErrors.client}</p>}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Input
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="Matter title"
              />
              {formErrors.title && <p className="text-xs text-destructive">{formErrors.title}</p>}
            </div>

            <div className="space-y-2">
              <Select
                value={form.practice}
                onValueChange={(value) => setForm((current) => ({ ...current, practice: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Practice area" />
                </SelectTrigger>
                <SelectContent>
                  {practiceOptions.map((practice) => (
                    <SelectItem key={practice} value={practice}>
                      {practice}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.practice && (
                <p className="text-xs text-destructive">{formErrors.practice}</p>
              )}
            </div>

            <div className="space-y-2">
              <Input
                value={form.stage}
                onChange={(event) =>
                  setForm((current) => ({ ...current, stage: event.target.value }))
                }
                placeholder="Stage"
              />
              {formErrors.stage && <p className="text-xs text-destructive">{formErrors.stage}</p>}
            </div>

            <div className="space-y-2">
              <Input
                value={form.lead}
                onChange={(event) =>
                  setForm((current) => ({ ...current, lead: event.target.value }))
                }
                placeholder="Lead attorney"
              />
              {formErrors.lead && <p className="text-xs text-destructive">{formErrors.lead}</p>}
            </div>

            <div className="space-y-2">
              <Input
                value={form.court}
                onChange={(event) =>
                  setForm((current) => ({ ...current, court: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Input
                value={form.judge}
                onChange={(event) =>
                  setForm((current) => ({ ...current, judge: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Input
                type="date"
                value={form.hearingDate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, hearingDate: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Select
                value={form.priority}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, priority: value as NewCaseForm["priority"] }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Input
                type="date"
                value={form.nextDeadline}
                onChange={(event) =>
                  setForm((current) => ({ ...current, nextDeadline: event.target.value }))
                }
              />
              {formErrors.nextDeadline && (
                <p className="text-xs text-destructive">{formErrors.nextDeadline}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitCaseForm}>Create case</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
