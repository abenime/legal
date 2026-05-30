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

import { toast } from "sonner";

function AIPage() {
  const { user } = useAuth();
  const [activeTool, setActiveTool] = useState<string>("chat");
  const { data: cases } = useApi(() => api.getCases(user!), [user?.id]);

  // Chat state
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Drafting state
  const [draftTemplate, setDraftTemplate] = useState("");
  const [draftCase, setDraftCase] = useState("");
  const [draftInstructions, setDraftInstructions] = useState("");

  const [summaryCase, setSummaryCase] = useState("");
  const [summaryFocus, setSummaryFocus] = useState("");

  const handleAskAI = async () => {
    if (!prompt.trim()) return;

    const userMessage = prompt.trim();
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setPrompt("");
    setIsLoading(true);

    try {
      const response = await api.askAI(userMessage);
      setMessages((prev) => [...prev, { role: "ai", text: response.text }]);
    } catch (error) {
      toast.error("AI request failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrafting = async () => {
    if (!draftCase || !draftTemplate) return;
    
    const selectedCase = cases?.find(c => c.id === draftCase);
    const draftingPrompt = `Draft a ${draftTemplate} for the case "${selectedCase?.title}" (Matter #${selectedCase?.number}). 
    Additional instructions: ${draftInstructions || "None provided."}`;

    setMessages((prev) => [...prev, { role: "user", text: draftingPrompt }]);
    setActiveTool("chat");
    setIsLoading(true);

    try {
      const response = await api.askAI(draftingPrompt);
      setMessages((prev) => [...prev, { role: "ai", text: response.text }]);
    } catch (error) {
      toast.error("Drafting failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSummary = async () => {
    if (!summaryCase) return;

    const selectedCase = (cases as any)?.find((c: any) => c.id === summaryCase);
    const summaryPrompt = `Provide a comprehensive executive summary for the case "${selectedCase?.title}" (Matter #${selectedCase?.number}). 
    Focus area: ${summaryFocus || "General overview, procedural history, and upcoming deadlines"}.`;

    setMessages((prev) => [...prev, { role: "user", text: summaryPrompt }]);
    setActiveTool("chat");
    setIsLoading(true);

    try {
      const response = await api.askAI(summaryPrompt);
      setMessages((prev) => [...prev, { role: "ai", text: response.text }]);
    } catch (error) {
      toast.error("Summary generation failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async () => {
    const reviewPrompt = "Review the provided contract (simulated context) and highlight three major risks and two key provisions regarding governing law and payment terms. Format the response clearly.";

    setMessages((prev) => [...prev, { role: "user", text: "Please review this contract for risks and provisions." }]);
    setActiveTool("chat");
    setIsLoading(true);

    try {
      const response = await api.askAI(reviewPrompt);
      setMessages((prev) => [...prev, { role: "ai", text: response.text }]);
    } catch (error) {
      toast.error("Review failed.");
    } finally {
      setIsLoading(false);
    }
  };

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
            <div className="mx-auto max-w-3xl space-y-6 flex flex-col h-full">
              <div className="flex-1 space-y-4 overflow-y-auto pb-4">
                {messages.length === 0 && (
                   <div className="text-center py-12">
                      <Sparkles className="h-12 w-12 text-accent/20 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground">Start a legal consultation</h3>
                      <p className="text-sm text-muted-foreground">Ask questions about cases, law, or draft documents.</p>
                   </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl p-4 text-sm ${
                      m.role === "user" 
                        ? "bg-primary text-primary-foreground rounded-tr-none" 
                        : "bg-card border border-border text-foreground rounded-tl-none"
                    }`}>
                      <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                   <div className="flex justify-start">
                     <div className="bg-card border border-border text-foreground rounded-2xl rounded-tl-none p-4 text-sm animate-pulse">
                        Thinking...
                     </div>
                   </div>
                )}
              </div>

              <div className="rounded-lg border border-border bg-card p-4 shadow-sm mt-auto">
                <div className="flex gap-2">
                  <Textarea
                    className="min-h-20 bg-muted/20 text-base resize-none border-none focus-visible:ring-0 p-2"
                    placeholder="Type your question or request..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                       if (e.key === 'Enter' && !e.shiftKey) {
                         e.preventDefault();
                         handleAskAI();
                       }
                    }}
                  />
                  <Button 
                    className="self-end h-10 w-10 p-0 rounded-full" 
                    onClick={handleAskAI}
                    disabled={isLoading || !prompt.trim()}
                  >
                    <ArrowRight className="h-5 w-5" />
                  </Button>
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
                        {(cases ?? []).map((c: any) => (
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
                      value={draftInstructions}
                      onChange={(e) => setDraftInstructions(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button disabled={!draftCase || !draftTemplate || isLoading} onClick={handleDrafting}>
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
                <div 
                   className="rounded-lg border-2 border-dashed border-border p-8 text-center flex flex-col items-center justify-center bg-card hover:bg-secondary/20 transition-colors cursor-pointer"
                   onClick={handleReview}
                >
                  <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="font-medium">Upload Document</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Drag and drop or click to browse
                  </p>
                  <Button variant="outline" size="sm" disabled={isLoading}>
                    {isLoading ? "Processing..." : "Select File"}
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
                  <Select value={summaryCase} onValueChange={setSummaryCase}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a case..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(cases ?? []).map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Focus Area (Optional)</Label>
                  <Input 
                    placeholder="e.g. Focus on procedural history and upcoming deadlines" 
                    value={summaryFocus}
                    onChange={(e) => setSummaryFocus(e.target.value)}
                  />
                </div>
                <div className="flex justify-end">
                  <Button disabled={!summaryCase || isLoading} onClick={handleSummary}>
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
