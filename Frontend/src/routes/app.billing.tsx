import { createFileRoute } from "@tanstack/react-router";
import { Plus, Download, CreditCard, Clock, FileText, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useApi } from "@/lib/use-api";
import { api } from "@/lib/api";
import { PageHeader, StatCard, statusColor } from "@/components/ui-shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/app/billing")({
  component: BillingPage,
});

type InvoiceItem = {
  id: string;
  number: string;
  caseId: string;
  clientId: string | null;
  client: string;
  amount: number;
  issued: string;
  due: string;
  status: string;
};

// Mock time entries
const MOCK_TIME_ENTRIES = [
  {
    id: "t1",
    date: "2026-05-28",
    lawyer: "Marcus Hale",
    case: "Whitaker v. Northbridge",
    description: "Deposition preparation",
    hours: 3.5,
    rate: 450,
    billable: true,
    status: "unbilled",
  },
  {
    id: "t2",
    date: "2026-05-27",
    lawyer: "Eleanor Vance",
    case: "Martinez Estate Planning",
    description: "Drafting trust documents",
    hours: 2.0,
    rate: 350,
    billable: true,
    status: "billed",
  },
  {
    id: "t3",
    date: "2026-05-27",
    lawyer: "Marcus Hale",
    case: "Whitaker Patent Filing",
    description: "Client meeting",
    hours: 1.5,
    rate: 450,
    billable: true,
    status: "unbilled",
  },
  {
    id: "t4",
    date: "2026-05-26",
    lawyer: "Sofia Reyes",
    case: "Whitaker v. Northbridge",
    description: "Document review",
    hours: 4.0,
    rate: 250,
    billable: true,
    status: "unbilled",
  },
];

// Mock retainers
const MOCK_RETAINERS = [
  {
    id: "r1",
    client: "James Whitaker",
    case: "Whitaker v. Northbridge",
    amount: 25000,
    balance: 14500,
    status: "healthy",
  },
  {
    id: "r2",
    client: "Ana Martinez",
    case: "Martinez Estate Planning",
    amount: 5000,
    balance: 1200,
    status: "low",
  },
  {
    id: "r3",
    client: "TechFlow Inc.",
    case: "General Counsel",
    amount: 50000,
    balance: 42000,
    status: "healthy",
  },
];

function BillingPage() {
  const { user, isClient } = useAuth();
  const { data: invoices, loading } = useApi(() => api.getInvoices(user!), [user?.id]);
  const { data: cases } = useApi(() => api.getCases(user!), [user?.id]);

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);

  const total = ((invoices as InvoiceItem[]) ?? []).reduce(
    (s: number, i: InvoiceItem) => s + i.amount,
    0,
  );
  const paid = ((invoices as InvoiceItem[]) ?? [])
    .filter((i: InvoiceItem) => i.status === "paid")
    .reduce((s: number, i: InvoiceItem) => s + i.amount, 0);
  const outstanding = total - paid;
  const overdue = ((invoices as InvoiceItem[]) ?? [])
    .filter((i: InvoiceItem) => i.status === "overdue")
    .reduce((s: number, i: InvoiceItem) => s + i.amount, 0);

  const handleCreateInvoice = () => {
    toast.success("Draft invoice created successfully.");
    setIsInvoiceModalOpen(false);
  };

  const handleLogTime = () => {
    toast.success("Time entry logged successfully.");
    setIsTimeModalOpen(false);
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={isClient ? "Payments" : "Billing & Finance"}
        description={
          isClient
            ? "Pay invoices and view payment history."
            : "Time, invoices, and revenue tracking."
        }
        actions={
          !isClient ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsTimeModalOpen(true)}>
                <Clock className="mr-2 h-4 w-4" /> Log Time
              </Button>
              <Button onClick={() => setIsInvoiceModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> New invoice
              </Button>
            </div>
          ) : (
            <Button>
              <CreditCard className="mr-2 h-4 w-4" /> Pay outstanding
            </Button>
          )
        }
      />
      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        {!isClient && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total billed (YTD)" value={`$${(total / 1000).toFixed(1)}k`} />
            <StatCard label="Collected (YTD)" value={`$${(paid / 1000).toFixed(1)}k`} />
            <StatCard label="Outstanding" value={`$${(outstanding / 1000).toFixed(1)}k`} />
            <StatCard label="Overdue" value={`$${(overdue / 1000).toFixed(1)}k`} />
          </div>
        )}

        <Tabs defaultValue="invoices" className="w-full">
          {!isClient && (
            <TabsList className="mb-4">
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="time">Time Tracking</TabsTrigger>
              <TabsTrigger value="retainers">Retainer Balances</TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="invoices" className="mt-0">
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">Invoice</th>
                    {!isClient && <th className="px-5 py-3 text-left font-medium">Client</th>}
                    <th className="px-5 py-3 text-left font-medium">Issued</th>
                    <th className="px-5 py-3 text-left font-medium">Due</th>
                    <th className="px-5 py-3 text-right font-medium">Amount</th>
                    <th className="px-5 py-3 text-left font-medium">Status</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading && (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                        Loading…
                      </td>
                    </tr>
                  )}
                  {(invoices ?? []).map((i: InvoiceItem) => (
                    <tr key={i.id} className="transition-colors hover:bg-secondary/40">
                      <td className="px-5 py-3.5 font-mono text-xs text-foreground flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {i.number}
                      </td>
                      {!isClient && <td className="px-5 py-3.5 text-foreground">{i.client}</td>}
                      <td className="px-5 py-3.5 text-muted-foreground">{i.issued}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">{i.due}</td>
                      <td className="px-5 py-3.5 text-right font-semibold tabular-nums text-foreground">
                        ${i.amount.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant="outline" className={`capitalize ${statusColor(i.status)}`}>
                          {i.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {isClient && i.status !== "paid" ? (
                          <Button size="sm">Pay</Button>
                        ) : (
                          <Button variant="ghost" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {!isClient && (
            <>
              <TabsContent value="time" className="mt-0">
                <div className="overflow-hidden rounded-lg border border-border bg-card">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-5 py-3 text-left font-medium">Date</th>
                        <th className="px-5 py-3 text-left font-medium">Lawyer</th>
                        <th className="px-5 py-3 text-left font-medium">Case</th>
                        <th className="px-5 py-3 text-left font-medium">Description</th>
                        <th className="px-5 py-3 text-right font-medium">Hours</th>
                        <th className="px-5 py-3 text-right font-medium">Amount</th>
                        <th className="px-5 py-3 text-left font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {MOCK_TIME_ENTRIES.map((t) => (
                        <tr key={t.id} className="transition-colors hover:bg-secondary/40">
                          <td className="px-5 py-3.5 text-muted-foreground">{t.date}</td>
                          <td className="px-5 py-3.5 font-medium">{t.lawyer}</td>
                          <td className="px-5 py-3.5 text-foreground">{t.case}</td>
                          <td
                            className="max-w-50 truncate px-5 py-3.5 text-muted-foreground"
                            title={t.description}
                          >
                            {t.description}
                          </td>
                          <td className="px-5 py-3.5 text-right font-medium tabular-nums">
                            {t.hours}
                          </td>
                          <td className="px-5 py-3.5 text-right tabular-nums text-muted-foreground">
                            ${(t.hours * t.rate).toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge
                              variant={t.status === "billed" ? "secondary" : "outline"}
                              className="capitalize"
                            >
                              {t.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="retainers" className="mt-0">
                <div className="overflow-hidden rounded-lg border border-border bg-card">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-5 py-3 text-left font-medium">Client</th>
                        <th className="px-5 py-3 text-left font-medium">Case</th>
                        <th className="px-5 py-3 text-right font-medium">Total Amount</th>
                        <th className="px-5 py-3 text-right font-medium">Remaining Balance</th>
                        <th className="px-5 py-3 text-left font-medium">Status</th>
                        <th className="px-5 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {MOCK_RETAINERS.map((r) => (
                        <tr key={r.id} className="transition-colors hover:bg-secondary/40">
                          <td className="px-5 py-3.5 font-medium">{r.client}</td>
                          <td className="px-5 py-3.5 text-foreground">{r.case}</td>
                          <td className="px-5 py-3.5 text-right tabular-nums text-muted-foreground">
                            ${r.amount.toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5 text-right font-semibold tabular-nums text-foreground">
                            ${r.balance.toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5">
                            {r.status === "low" ? (
                              <Badge
                                variant="outline"
                                className="border-destructive/30 text-destructive capitalize"
                              >
                                Low Balance
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="border-success/30 text-success capitalize"
                              >
                                Healthy
                              </Badge>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <Button size="sm" variant="secondary">
                              Request Replenishment
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>

      {/* Log Time Modal */}
      <Dialog open={isTimeModalOpen} onOpenChange={setIsTimeModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Billable Time</DialogTitle>
            <DialogDescription>Record time spent on a case for billing purposes.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Case / Matter</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select a case..." />
                </SelectTrigger>
                <SelectContent>
                  {((cases as { id: string; title: string }[]) ?? []).map(
                    (c: { id: string; title: string }) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.title}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Date</Label>
                <Input type="date" defaultValue={new Date().toISOString().split("T")[0]} />
              </div>
              <div className="grid gap-2">
                <Label>Hours</Label>
                <Input type="number" step="0.1" placeholder="e.g. 1.5" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea placeholder="Detailed description of work performed..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTimeModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleLogTime}>Save Time Entry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Invoice Modal */}
      <Dialog open={isInvoiceModalOpen} onOpenChange={setIsInvoiceModalOpen}>
        <DialogContent className="sm:max-w-125">
          <DialogHeader>
            <DialogTitle>Generate Invoice</DialogTitle>
            <DialogDescription>
              Create a new invoice from unbilled time and expenses.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Client / Case</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select a case..." />
                </SelectTrigger>
                <SelectContent>
                  {((cases as { id: string; title: string }[]) ?? []).map(
                    (c: { id: string; title: string }) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.title}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="mt-2 rounded-md border border-border bg-muted/50 p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Unbilled Time</span>
                <span className="text-sm font-bold">12.5 hrs</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-medium">Unbilled Expenses</span>
                <span className="text-sm font-bold">$450.00</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">Total Draft Amount</span>
                <span className="text-lg font-bold text-primary">$4,825.00</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Issue Date</Label>
                <Input type="date" defaultValue={new Date().toISOString().split("T")[0]} />
              </div>
              <div className="grid gap-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  defaultValue={
                    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInvoiceModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateInvoice}>Generate Draft</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
