import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useApi } from "@/lib/use-api";
import { api } from "@/lib/api";
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
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/app/cases/$caseId")({
  component: CaseDetailsLayout,
});

function CaseDetailsLayout() {
  const { caseId } = Route.useParams();
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: caseData, loading } = useApi(() => api.getCase(caseId), [caseId]);

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

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border bg-card px-6 py-4 flex items-center gap-4">
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
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="events">Calendar</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                  <div className="bg-card border border-border rounded-xl p-6">
                    <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Case Information
                    </h2>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
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

            <TabsContent value="documents">
              <Outlet />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
