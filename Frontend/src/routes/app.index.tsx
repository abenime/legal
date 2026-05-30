import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Briefcase,
  DollarSign,
  Users,
  Clock,
  TrendingUp,
  CheckCircle2,
  FileText,
  Calendar as CalendarIcon,
  ArrowUpRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useApi } from "@/lib/use-api";
import { api } from "@/lib/api";
import { PageHeader, StatCard, statusColor } from "@/components/ui-shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

function Dashboard() {
  const { user, isClient } = useAuth();
  return isClient ? <ClientDashboard /> : <FirmDashboard user={user!} />;
}

function FirmDashboard({ user }: { user: { name: string } }) {
  const { data: analytics } = useApi(() => api.getAnalytics(), []);
  const { data: cases } = useApi(() => api.getCases(user as any), []);
  const { data: tasks } = useApi(() => api.getTasks(user as any), []);
  const { data: events } = useApi(() => api.getEvents(user as any), []);

  const activeCases = cases?.filter((c) => c.status === "active").length ?? 0;
  const openTasks = tasks?.filter((t) => t.status !== "done").length ?? 0;
  const upcoming = (events ?? []).slice(0, 4);
  const recentCases = (cases ?? []).filter((c) => c.status === "active").slice(0, 5);

  return (
    <div>
      <PageHeader
        title={`Good morning, ${user.name.split(" ")[0]}`}
        description="Here's what's happening across the firm today."
      />
      <div className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Revenue (MTD)"
            value={analytics ? `$${(analytics.revenue.thisMonth / 1000).toFixed(1)}k` : "—"}
            icon={DollarSign}
            trend={{ value: `+${analytics?.revenue.growth ?? 0}%`, positive: true }}
            hint="vs last month"
          />
          <StatCard
            label="Active cases"
            value={String(activeCases)}
            icon={Briefcase}
            hint="across practice areas"
          />
          <StatCard
            label="Open tasks"
            value={String(openTasks)}
            icon={CheckCircle2}
            hint="assigned to team"
          />
          <StatCard
            label="Win rate"
            value={analytics ? `${analytics.cases.winRate}%` : "—"}
            icon={TrendingUp}
            hint={`${analytics?.cases.closedYtd ?? 0} closed YTD`}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Active cases */}
          <div className="rounded-lg border border-border bg-card lg:col-span-2">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold text-foreground">Active cases</h2>
              <Link to="/app/cases" className="text-xs font-medium text-accent hover:underline">
                View all
              </Link>
            </div>
            <div className="divide-y divide-border">
              {recentCases.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-foreground">{c.title}</p>
                      <Badge variant="outline" className={statusColor(c.priority)}>
                        {c.priority}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {c.number} · {c.practice} · Lead: {c.lead}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-muted-foreground">Next deadline</p>
                    <p className="text-sm font-medium text-foreground">{c.nextDeadline ?? "—"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming */}
          <div className="rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold text-foreground">Upcoming</h2>
              <Link to="/app/calendar" className="text-xs font-medium text-accent hover:underline">
                Calendar
              </Link>
            </div>
            <div className="divide-y divide-border">
              {upcoming.map((e) => (
                <div key={e.id} className="flex items-start gap-3 px-5 py-3.5">
                  <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-md bg-secondary text-primary">
                    <CalendarIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{e.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {e.date} · {e.time} · <span className="capitalize">{e.type}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Team productivity */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">
              Team productivity (billable hrs)
            </h2>
            <div className="mt-4 space-y-4">
              {(analytics?.lawyerProductivity ?? []).map((l) => {
                const pct = Math.min(100, (l.billable / l.target) * 100);
                const over = l.billable >= l.target;
                return (
                  <div key={l.name}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{l.name}</span>
                      <span className="text-muted-foreground">
                        {l.billable} / {l.target} hrs
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div
                        className={`h-full rounded-full ${over ? "bg-success" : "bg-accent"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">Practice area mix</h2>
            <div className="mt-4 space-y-2.5">
              {(analytics?.practiceBreakdown ?? []).map((p, i) => {
                const colors = [
                  "bg-chart-1",
                  "bg-accent",
                  "bg-chart-3",
                  "bg-success",
                  "bg-chart-5",
                ];
                return (
                  <div key={p.name} className="flex items-center gap-3">
                    <span className={`h-2.5 w-2.5 rounded-sm ${colors[i % colors.length]}`} />
                    <span className="flex-1 text-sm text-foreground">{p.name}</span>
                    <span className="text-sm font-medium text-muted-foreground">{p.value}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClientDashboard() {
  const { user } = useAuth();
  const { data: cases } = useApi(() => api.getCases(user!), []);
  const { data: events } = useApi(() => api.getEvents(user!), []);
  const { data: invoices } = useApi(() => api.getInvoices(user!), []);
  const { data: documents } = useApi(() => api.getDocuments(user!), []);

  const outstanding = (invoices ?? [])
    .filter((i) => i.status !== "paid")
    .reduce((s, i) => s + i.amount, 0);
  const upcoming = (events ?? []).slice(0, 3);

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user!.name.split(" ")[0]}`}
        description="Track your matters, communicate with your legal team, and manage payments."
        actions={
          <Link to="/app/messages">
            <Button>
              Message your team <ArrowUpRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        }
      />
      <div className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Active matters" value={String(cases?.length ?? 0)} icon={Briefcase} />
          <StatCard label="Documents" value={String(documents?.length ?? 0)} icon={FileText} />
          <StatCard
            label="Upcoming events"
            value={String(events?.length ?? 0)}
            icon={CalendarIcon}
          />
          <StatCard
            label="Outstanding"
            value={`$${(outstanding / 1000).toFixed(1)}k`}
            icon={DollarSign}
            hint="across open invoices"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-card lg:col-span-2">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold text-foreground">Your matters</h2>
            </div>
            <div className="divide-y divide-border">
              {(cases ?? []).map((c) => (
                <div key={c.id} className="px-5 py-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{c.title}</p>
                    <Badge variant="outline" className={statusColor(c.status)}>
                      {c.stage}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {c.number} · Lead: {c.lead}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    Next:{" "}
                    <span className="font-medium text-foreground">{c.nextDeadline ?? "—"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {/* Quick Actions / Self Service */}
            <div className="rounded-lg border border-border bg-card">
              <div className="border-b border-border px-5 py-4">
                <h2 className="text-sm font-semibold text-foreground">Quick Actions</h2>
              </div>
              <div className="p-4 space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Upload Requested Document
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Make a Payment
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Schedule Appointment
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card">
              <div className="border-b border-border px-5 py-4">
                <h2 className="text-sm font-semibold text-foreground">Upcoming with your team</h2>
              </div>
              <div className="divide-y divide-border">
                {upcoming.map((e) => (
                  <div key={e.id} className="flex items-start gap-3 px-5 py-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent/15 text-accent">
                      <CalendarIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{e.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {e.date} · {e.time}
                      </p>
                    </div>
                  </div>
                ))}
                {!upcoming.length && (
                  <p className="px-5 py-6 text-sm text-muted-foreground">No upcoming events.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
