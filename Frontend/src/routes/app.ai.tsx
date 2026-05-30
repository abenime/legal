import { createFileRoute } from "@tanstack/react-router";
import {
  Sparkles,
  FileText,
  Search,
  Calendar,
  Scale,
  MessageSquare,
  ArrowRight,
  Upload,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/ui-shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useApi } from "@/lib/use-api";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/app/ai")({
  component: AIPage,
});

const TOOLS = [
  {
    id: "chat",
    icon: MessageSquare,
    title: "General Assistant",
    desc: "Ask anything about your cases or legal concepts.",
  },
  {
    id: "drafting",
    icon: FileText,
    title: "Document Drafting",
    desc: "Generate contracts, motions, and letters from templates.",
  },
  {
    id: "review",
    icon: Scale,
    title: "Contract Review",
    desc: "Flag risky clauses and missing provisions in seconds.",
  },
  {
    id: "summary",
    icon: Sparkles,
    title: "Case Summaries",
    desc: "Distill long case files into briefable executive summaries.",
  },
];

function AIPage() {
  const { user } = useAuth();
  const [activeTool, setActiveTool] = useState<string>("chat");
  const { data: cases } = useApi(() => api.getCases(user!), [user?.id]);

  // Drafting state
  const [draftTemplate, setDraftTemplate] = useState("");
  const [draftCase, setDraftCase] = useState("");

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="AI Assistant"
        description="Augment your practice with built-in legal AI tools."
      />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-border bg-card p-4 overflow-y-auto">
          <div className="space-y-2">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              AI Tools
            </h3>
            {TOOLS.map((t) => {
              const Icon = t.icon;
              const isActive = activeTool === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTool(t.id)}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-accent/10 text-accent"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-muted/10">
          {activeTool === "chat" && (
            <div className="mx-auto max-w-3xl space-y-6">
              <div className="rounded-lg border border-border bg-linear-to-br from-card to-secondary p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent/20 text-accent">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">
                    How can I help you today?
                  </h2>
                </div>
                <Textarea
                  className="min-h-32 bg-card text-base resize-none"
                  placeholder='e.g. "Summarize the Whitaker v. Northbridge discovery so far and list the open items."'
                />
                <div className="mt-4 flex justify-between items-center">
                  <div className="text-xs text-muted-foreground">
                    AI responses may not always be perfectly accurate. Verify important information.
                  </div>
                  <Button>
                    <Sparkles className="mr-2 h-4 w-4" /> Ask AI
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div
                  className="rounded-lg border border-border bg-card p-4 hover:border-accent cursor-pointer transition-colors"
                  onClick={() => setActiveTool("drafting")}
                >
                  <FileText className="h-5 w-5 text-accent mb-2" />
                  <h3 className="font-medium">Draft a document</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create standard legal documents quickly using your firm's templates.
                  </p>
                </div>
                <div
                  className="rounded-lg border border-border bg-card p-4 hover:border-accent cursor-pointer transition-colors"
                  onClick={() => setActiveTool("review")}
                >
                  <Scale className="h-5 w-5 text-accent mb-2" />
                  <h3 className="font-medium">Review a contract</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload an agreement to highlight unusual clauses and potential risks.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTool === "drafting" && (
            <div className="mx-auto max-w-3xl">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <FileText className="h-6 w-6 text-accent" /> Document Drafting
              </h2>
              <div className="space-y-6 rounded-lg border border-border bg-card p-6 shadow-sm">
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label>Select Case</Label>
                    <Select value={draftCase} onValueChange={setDraftCase}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a case context..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(cases ?? []).map((c: { id: string; title: string }) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Select Template</Label>
                    <Select value={draftTemplate} onValueChange={setDraftTemplate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose template type..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="complaint">Civil Complaint</SelectItem>
                        <SelectItem value="discovery">Discovery Request</SelectItem>
                        <SelectItem value="retainer">Retainer Agreement</SelectItem>
                        <SelectItem value="nda">Non-Disclosure Agreement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Additional Instructions</Label>
                    <Textarea
                      placeholder="e.g. Include a clause about binding arbitration in New York..."
                      className="min-h-24"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button disabled={!draftCase || !draftTemplate}>
                    <Sparkles className="mr-2 h-4 w-4" /> Generate Draft
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTool === "review" && (
            <div className="mx-auto max-w-3xl">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <Scale className="h-6 w-6 text-accent" /> Contract Review
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-lg border-2 border-dashed border-border p-8 text-center flex flex-col items-center justify-center bg-card hover:bg-secondary/20 transition-colors cursor-pointer">
                  <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="font-medium">Upload Document</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Drag and drop or click to browse
                  </p>
                  <Button variant="outline" size="sm">
                    Select File
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="rounded-lg border border-border bg-card p-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-warning" /> Flagged Risks (0)
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Upload a document to scan for unfavorable terms, missing standard clauses, and
                      liability issues.
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" /> Key Provisions (0)
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Automatically extract governing law, term length, and payment schedules.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTool === "summary" && (
            <div className="mx-auto max-w-3xl">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-accent" /> Case Summaries
              </h2>
              <div className="space-y-6 rounded-lg border border-border bg-card p-6 shadow-sm">
                <div className="grid gap-2">
                  <Label>Select Case to Summarize</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a case..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(cases ?? []).map((c: { id: string; title: string }) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Focus Area (Optional)</Label>
                  <Input placeholder="e.g. Focus on procedural history and upcoming deadlines" />
                </div>
                <div className="flex justify-end">
                  <Button>
                    <Sparkles className="mr-2 h-4 w-4" /> Generate Summary
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
