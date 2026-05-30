import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-border bg-card px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: { value: string; positive?: boolean };
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {Icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-primary">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <div className="mt-1 flex items-center gap-2">
        {trend && (
          <span
            className="text-xs font-medium"
            style={{
              color: trend.positive
                ? "color-mix(in oklab, var(--success) 100%, transparent)"
                : "color-mix(in oklab, var(--destructive) 100%, transparent)",
            }}
          >
            {trend.value}
          </span>
        )}
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    active: "bg-success/10 text-success border-success/20",
    pending: "bg-warning/15 text-warning border-warning/30",
    closed: "bg-muted text-muted-foreground border-border",
    archived: "bg-muted text-muted-foreground border-border",
    todo: "bg-secondary text-secondary-foreground border-border",
    in_progress: "bg-chart-3/10 text-chart-3 border-chart-3/20",
    review: "bg-accent/10 text-accent border-accent/20",
    done: "bg-success/10 text-success border-success/20",
    paid: "bg-success/10 text-success border-success/20",
    sent: "bg-chart-3/10 text-chart-3 border-chart-3/20",
    overdue: "bg-destructive/10 text-destructive border-destructive/20",
    high: "bg-destructive/10 text-destructive border-destructive/20",
    medium: "bg-warning/15 text-warning border-warning/30",
    low: "bg-muted text-muted-foreground border-border",
  };
  return map[status] ?? "bg-secondary text-secondary-foreground border-border";
}
