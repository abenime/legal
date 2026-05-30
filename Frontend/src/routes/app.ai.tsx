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
  Download,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PageHeader } from "@/components/ui-shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useRef } from "react";
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
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";

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

  // Chat state
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load history
  useEffect(() => {
    if (user?.id) {
      api.getAIHistory(user.id).then((history) => {
        const formatted = history.map((m: any) => ({
          role: m.from === user.id ? "user" : "ai",
          text: m.body,
        }));
        setMessages(formatted);
      });
    }
  }, [user?.id]);

  // Drafting state
  const [draftTemplate, setDraftTemplate] = useState("");
  const [draftCase, setDraftCase] = useState("");
  const [draftInstructions, setDraftInstructions] = useState("");

  const [summaryCase, setSummaryCase] = useState("");
  const [summaryFocus, setSummaryFocus] = useState("");

  const [reviewFile, setReviewFile] = useState<File | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stripMarkdown = (text: string) => {
    return text
      .replace(/^#+\s+/gm, "") // Remove headers
      .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold
      .replace(/\*(.*?)\*/g, "$1") // Remove italic
      .replace(/__(.*?)__/g, "$1") // Remove bold underscore
      .replace(/_(.*?)_/g, "$1") // Remove italic underscore
      .replace(/`(.*?)`/g, "$1") // Remove inline code
      .replace(/\[(.*?)\]\(.*?\)/g, "$1") // Remove links
      .replace(/^\s*[-+*]\s+/gm, "• ") // Standardize bullets
      .replace(/```[\s\S]*?```/g, (match) => match.replace(/```/g, "")) // Remove code blocks backticks
      .trim();
  };

  const exportToPDF = (text: string) => {
    try {
      const cleanText = stripMarkdown(text);
      const doc = new jsPDF();
      const margin = 15;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const splitText = doc.splitTextToSize(cleanText, pageWidth - margin * 2);
      
      let cursorY = 20;
      const lineHeight = 7;

      splitText.forEach((line: string) => {
        if (cursorY > pageHeight - margin) {
          doc.addPage();
          cursorY = 20;
        }
        doc.text(line, margin, cursorY);
        cursorY += lineHeight;
      });

      doc.save(`Legal_AI_Export_${Date.now()}.pdf`);
      toast.success("PDF exported successfully");
    } catch (error) {
      console.error("PDF Export Error:", error);
      toast.error("Failed to export PDF");
    }
  };

  const exportToWord = async (text: string) => {
    try {
      const cleanText = stripMarkdown(text);
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: cleanText.split("\n").map((line) => {
              return new Paragraph({
                children: [new TextRun(line)],
              });
            }),
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `Legal_AI_Export_${Date.now()}.docx`);
      toast.success("Word document exported successfully");
    } catch (error) {
      console.error("Word Export Error:", error);
      toast.error("Failed to export Word document");
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleAskAI = async () => {
    if (!prompt.trim()) return;

    const userMessage = prompt.trim();
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setPrompt("");
    setIsLoading(true);

    try {
      const response = await api.askAI(userMessage, user?.id);
      setMessages((prev) => [...prev, { role: "ai", text: response.text }]);
    } catch (error: any) {
      toast.error(error.message || "AI request failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrafting = async () => {
    if (!draftCase || !draftTemplate) return;

    const selectedCase = cases?.find((c) => c.id === draftCase);
    const customDetails = Object.entries(selectedCase?.details || {})
      .map(([key, value]) => `- ${key}: ${value}`)
      .join("\n");

    const caseContext = selectedCase
      ? `
Case Details:
- Title: ${selectedCase.title}
- Matter Number: ${selectedCase.number}
- Practice Area: ${selectedCase.practice}
- Stage: ${selectedCase.stage}
- Status: ${selectedCase.status}
- Lead Attorney: ${selectedCase.lead}
- Court: ${selectedCase.court || "N/A"}
- Judge: ${selectedCase.judge || "N/A"}
- Priority: ${selectedCase.priority}
- Description: ${selectedCase.description || "No description provided."}
${customDetails ? `\nAdditional Case Context:\n${customDetails}` : ""}
`
      : "No case context provided.";

    const draftingPrompt = `I need you to draft a ${draftTemplate}.

${caseContext}

Additional instructions from the user: ${draftInstructions || "None provided."}

Please provide the draft in a professional legal format using Markdown for structure.`;

    setMessages((prev) => [
      ...prev,
      { role: "user", text: `Draft a ${draftTemplate} for case ${selectedCase?.title}` },
    ]);
    setActiveTool("chat");
    setIsLoading(true);

    try {
      const response = await api.askAI(draftingPrompt, user?.id);
      setMessages((prev) => [...prev, { role: "ai", text: response.text }]);
    } catch (error: any) {
      toast.error(error.message || "Drafting failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSummary = async () => {
    if (!summaryCase) return;

    const selectedCase = (cases as any)?.find((c: any) => c.id === summaryCase);
    const customDetails = Object.entries(selectedCase?.details || {})
      .map(([key, value]) => `- ${key}: ${value}`)
      .join("\n");

    const caseContext = selectedCase
      ? `
Case Details:
- Title: ${selectedCase.title}
- Matter Number: ${selectedCase.number}
- Practice Area: ${selectedCase.practice}
- Stage: ${selectedCase.stage}
- Status: ${selectedCase.status}
- Lead Attorney: ${selectedCase.lead}
- Court: ${selectedCase.court || "N/A"}
- Judge: ${selectedCase.judge || "N/A"}
- Priority: ${selectedCase.priority}
- Opened At: ${selectedCase.openedAt}
- Next Deadline: ${selectedCase.nextDeadline || "None scheduled"}
- Description: ${selectedCase.description || "No description provided."}
${customDetails ? `\nAdditional Case Context:\n${customDetails}` : ""}
`
      : "No case context provided.";

    const summaryPrompt = `Provide a comprehensive executive summary for the following case.

${caseContext}

Focus area for the summary: ${summaryFocus || "General overview, procedural history, and upcoming deadlines"}.

Use Markdown for a clear, professional presentation.`;

    setMessages((prev) => [
      ...prev,
      { role: "user", text: `Generate summary for case ${selectedCase?.title}` },
    ]);
    setActiveTool("chat");
    setIsLoading(true);

    try {
      const response = await api.askAI(summaryPrompt, user?.id);
      setMessages((prev) => [...prev, { role: "ai", text: response.text }]);
    } catch (error: any) {
      toast.error(error.message || "Summary generation failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async () => {
    if (!reviewFile) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", text: `Please review the contract: ${reviewFile.name}` },
    ]);
    setActiveTool("chat");
    setIsLoading(true);

    try {
      const response = await api.reviewContract(reviewFile, user!.id);
      setMessages((prev) => [...prev, { role: "ai", text: response.text }]);
      setReviewFile(null); // Clear after review
    } catch (error: any) {
      toast.error(error.message || "Review failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReviewFile(e.target.files[0]);
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
              <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pb-4 text-slate-900 dark:text-slate-100">
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <Sparkles className="h-12 w-12 text-accent/20 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground">
                      Start a legal consultation
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Ask questions about cases, law, or draft documents.
                    </p>
                  </div>
                )}
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-sm relative group ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-card border border-border text-foreground rounded-tl-none shadow-sm"
                      }`}
                    >
                      {m.role === "ai" ? (
                        <>
                          <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-p:leading-relaxed prose-pre:bg-muted prose-pre:p-3 prose-pre:rounded-md">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                          </div>
                          <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-border/50">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 text-[10px] uppercase font-bold tracking-tight cursor-pointer"
                              onClick={() => exportToPDF(m.text)}
                            >
                              <FileText className="h-3 w-3 mr-1.5" /> PDF
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 text-[10px] uppercase font-bold tracking-tight cursor-pointer"
                              onClick={() => exportToWord(m.text)}
                            >
                              <Download className="h-3 w-3 mr-1.5" /> Word
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
                      )}
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
                      if (e.key === "Enter" && !e.shiftKey) {
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
                  <Button
                    disabled={!draftCase || !draftTemplate || isLoading}
                    onClick={handleDrafting}
                  >
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
                  className="rounded-lg border-2 border-dashed border-border p-8 text-center flex flex-col items-center justify-center bg-card hover:bg-secondary/20 transition-colors cursor-pointer relative"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".pdf"
                    onChange={handleFileChange}
                    disabled={isLoading}
                  />
                  <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="font-medium">
                    {reviewFile ? reviewFile.name : "Upload Contract (PDF)"}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    {reviewFile
                      ? `${(reviewFile.size / 1024 / 1024).toFixed(2)} MB`
                      : "Drag and drop or click to browse"}
                  </p>
                  <Button
                    variant={reviewFile ? "default" : "outline"}
                    size="sm"
                    disabled={isLoading || !reviewFile}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReview();
                    }}
                    className="relative z-10 cursor-pointer"
                  >
                    {isLoading ? "Processing..." : reviewFile ? "Start AI Review" : "Select File"}
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="rounded-lg border border-border bg-card p-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-warning" /> AI Risk Analysis
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Upload a PDF contract to automatically scan for unfavorable terms, liability
                      issues, and missing clauses.
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" /> Provision Extraction
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Automatically identify governing law, payment terms, and key deadlines from
                      your documents.
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
