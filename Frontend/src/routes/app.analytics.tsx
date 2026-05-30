import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useApi } from "@/lib/use-api";
import { api } from "@/lib/api";
import { PageHeader, StatCard } from "@/components/ui-shared";
import { DollarSign, TrendingUp, Briefcase, Clock } from "lucide-react";

export const Route = createFileRoute("/app/analytics")({
  component: AnalyticsPage,
});

const PIE_COLORS = ["#1f2a4d", "#c89a3c", "#3b82a8", "#3f9b6e", "#b85b3a"];

function AnalyticsPage() {
  const { data } = useApi(() => api.getAnalytics(), []);
  if (!data) {
    return (
      <div>
        <PageHeader title="Analytics" />
        <p className="p-6 text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Analytics" description="Revenue, productivity, and case performance." />
      <div className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Revenue YTD"
            value={`$${(data.revenue.ytd / 1000).toFixed(0)}k`}
            icon={DollarSign}
          />
          <StatCard
            label="Growth"
            value={`+${data.revenue.growth}%`}
            icon={TrendingUp}
            hint="vs last month"
          />
          <StatCard label="Active cases" value={String(data.cases.active)} icon={Briefcase} />
          <StatCard label="Avg duration" value={`${data.cases.avgDuration}d`} icon={Clock} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">Monthly revenue</h2>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 255)" />
                  <XAxis dataKey="month" stroke="oklch(0.48 0.02 260)" fontSize={12} />
                  <YAxis
                    stroke="oklch(0.48 0.02 260)"
                    fontSize={12}
                    tickFormatter={(v) => `$${v / 1000}k`}
                  />
                  <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#c89a3c"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">Practice area mix</h2>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.practiceBreakdown}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                  >
                    {data.practiceBreakdown.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">
            Lawyer productivity (billable hrs vs target)
          </h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.lawyerProductivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 255)" />
                <XAxis dataKey="name" stroke="oklch(0.48 0.02 260)" fontSize={12} />
                <YAxis stroke="oklch(0.48 0.02 260)" fontSize={12} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="target" fill="oklch(0.85 0.02 255)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="billable" fill="#1f2a4d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
