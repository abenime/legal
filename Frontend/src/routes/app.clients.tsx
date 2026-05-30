import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Plus,
  Mail,
  Phone,
  Search,
  MapPin,
  CalendarDays,
  DollarSign,
  Briefcase,
  FileText,
  ChevronLeft,
  Send,
  Sparkles,
  AlertTriangle,
  UserCheck,
  FolderOpen,
  FileCheck,
  Eye,
  Gavel,
  Check,
} from "lucide-react";
import { useApi } from "@/lib/use-api";
import { api } from "@/lib/api";
import { PageHeader, statusColor } from "@/components/ui-shared";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

export const Route = createFileRoute("/app/clients")({
  component: ClientsPage,
});

function ClientsPage() {
  const { data: initialClients, loading: clientsLoading } = useApi(() => api.getClients(), []);
  const { data: initialCases } = useApi(
    () => api.getUsers().then((users) => api.getCases(users[0])),
    [],
  ); // Fetch cases for matching
  const { data: initialInvoices } = useApi(
    () => api.getUsers().then((users) => api.getInvoices(users[0])),
    [],
  ); // Fetch invoices for matching
  const { data: initialDocuments } = useApi(
    () => api.getUsers().then((users) => api.getDocuments(users[0])),
    [],
  ); // Fetch documents for matching

  const [clients, setClients] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "outstanding" | "active">("all");
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  // New Client Form State
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    retainerBalance: "0",
    address: "",
  });

  // Notes and Dialog Interactive States
  const [newNote, setNewNote] = useState("");
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [caseDialogOpen, setCaseDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [docDialogOpen, setDocDialogOpen] = useState(false);

  // Sync state with fetched clients
  useEffect(() => {
    if (initialClients && initialClients.length > 0) {
      setClients(initialClients);
      setSelectedId(initialClients[0].id);
    }
  }, [initialClients]);

  // Sync state with fetched documents
  useEffect(() => {
    if (initialDocuments) {
      setDocuments(initialDocuments);
    }
  }, [initialDocuments]);

  // Selected client object
  const client = clients.find((c) => c.id === selectedId) || clients[0];

  // Cases linked to the selected client
  const clientCases = initialCases
    ? initialCases.filter(
        (c) => c.clientId === client?.id || c.client?.toLowerCase() === client?.name?.toLowerCase(),
      )
    : [];
  const clientCaseIds = clientCases.map((c) => c.id);

  // Documents linked to the selected client's cases
  const clientDocuments = documents.filter((d) => clientCaseIds.includes(d.caseId));

  // Invoices linked to the selected client
  const clientInvoices = initialInvoices
    ? initialInvoices.filter(
        (i) => i.clientId === client?.id || i.client?.toLowerCase() === client?.name?.toLowerCase(),
      )
    : [];

  // Filtering clients
  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);

    if (!matchesSearch) return false;

    if (filterType === "outstanding") {
      return c.outstanding > 0;
    }
    if (filterType === "active") {
      return c.activeCases > 0;
    }
    return true;
  });

  const handleAddClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Name and Email are required");
      return;
    }

    const newClientObj = {
      id: "cl_" + Date.now(),
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || "N/A",
      company: formData.company.trim() || "Self",
      since: new Date().toISOString().split("T")[0],
      activeCases: 0,
      outstanding: 0,
      retainerBalance: parseFloat(formData.retainerBalance) || 0,
      address: formData.address.trim() || "N/A",
      notes: [],
    };

    setClients((prev) => [...prev, newClientObj]);
    setSelectedId(newClientObj.id);
    setAddClientOpen(false);
    setShowMobileDetail(true);
    setFormData({
      name: "",
      email: "",
      phone: "",
      company: "",
      retainerBalance: "0",
      address: "",
    });
    toast.success("Client added successfully");
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;

    const noteObj = {
      id: "note_" + Date.now(),
      date: new Date().toISOString(),
      author: "Sofia Reyes (Paralegal)",
      text: newNote.trim(),
    };

    setClients((prev) =>
      prev.map((c) => {
        if (c.id === client.id) {
          return {
            ...c,
            notes: [noteObj, ...(c.notes || [])],
          };
        }
        return c;
      }),
    );

    setNewNote("");
    toast.success("Note added successfully");
  };

  const handleSignDocument = (docId: string) => {
    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id === docId) {
          return { ...d, signed: true };
        }
        return d;
      }),
    );
    setSelectedDoc((prev: any) => (prev ? { ...prev, signed: true } : null));
    toast.success("Document signed successfully!");
  };

  const getClientInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const getMockDocumentPages = (docName: string, doc: any): string[] => {
    if (docName.toLowerCase().includes("complaint")) {
      return [
        `IN THE SUPERIOR COURT OF CALIFORNIA\nFOR THE CITY AND COUNTY OF SAN FRANCISCO\n\nJAMES WHITAKER,               )\tCase No. 2026-CIV-0142\n      Plaintiff,              )\t\n                              )\tCOMPLAINT FOR BREACH\nv.                            )\tOF CONTRACT\n                              )\t\nNORTHBRIDGE HOLDINGS,         )\tDEMAND FOR JURY TRIAL\n      Defendant.              )\n______________________________)`,
        `Plaintiff James Whitaker, by and through his counsel Marcus Hale, hereby alleges and complains as follows:\n\n1. PLAINTIFF James Whitaker is an individual residing in San Francisco, California, and at all times mentioned herein was engaged in venture capital operations.\n\n2. DEFENDANT Northbridge Holdings is a corporate entity registered under the laws of the State of Delaware, with its primary corporate offices and principal place of business located at 500 Sansome Street, San Francisco, California.\n\n3. ON OR ABOUT January 10, 2026, Plaintiff and Defendant entered into a written and executed corporate agreement under which Defendant was obligated to deliver specific digital assets and detailed financial portfolios.\n\n4. DEFENDANT failed to deliver the required assets by the contractually mandated deadline, thereby breaching Section 4.2 of said agreement.\n\n5. AS A DIRECT and proximate result of Defendant's breach, Plaintiff suffered substantial financial damages exceeding $150,000, exclusive of interest and legal fees.\n\nWHEREFORE, Plaintiff demands judgment against Defendant for compensatory damages, pre-judgment interest, reasonable attorney fees, and such other relief as the Court deems just and proper.`,
      ];
    }
    if (docName.toLowerCase().includes("trust")) {
      return [
        `THE MARTINEZ REVOCABLE TRUST AGREEMENT\n\nThis Revocable Trust Agreement is entered into and executed this 18th day of May, 2026, by and between the following parties:\n\nGRANTOR:\nAna Martinez, an individual residing in Oakland, California.\n\nTRUSTEE:\nAna Martinez, to serve as the initial primary Trustee of the Trust.\n\nCO-TRUSTEE / SUCCESSOR TRUSTEE:\nEleanor Vance, Managing Partner at Casejoy Practice, appointed to act as Successor Trustee upon the resignation or incapacity of the initial Trustee.\n\nESTABLISHMENT OF TRUST:\nThe Grantor hereby transfers, assigns, and delivers to the Trustee the properties described in Schedule A, to be held, administered, and distributed under the terms of this Trust Agreement.`,
        `I. DECLARATION OF TRUST\nThe Grantor hereby declares that all properties described in Schedule A hereto attached are transferred into this Trust for the sole benefit of the named beneficiaries.\n\nII. DISTRIBUTIONS DURING GRANTOR'S LIFETIME\nThe Trustee shall distribute to the Grantor as much of the net income and principal of the trust estate as the Grantor shall direct in writing.\n\nIII. REVOCABILITY AND AMENDMENT\nThe Grantor reserves the absolute right to amend, alter, or revoke this Trust at any time, in whole or in part, by written instrument signed by the Grantor and delivered to the Trustee.\n\nIV. GOVERNING LAW\nThis Trust Agreement shall be governed by, and construed in accordance with, the laws of the State of California.\n\nIN WITNESS WHEREOF, the parties hereto have executed this Martinez Revocable Trust Agreement on the day and year first above written.`,
      ];
    }
    if (docName.toLowerCase().includes("patent")) {
      return [
        `UNITED STATES PATENT AND TRADEMARK OFFICE\n\nAPPLICANT: James Whitaker (Whitaker Capital)\nTITLE: SYSTEM FOR AUTOMATED LIQUID DEFI ASSET COLLATERAL\nATTORNEY DOCKET NO: 2026-IP-0021-US\n\nTECHNICAL FIELD:\nThis disclosure relates generally to decentralized blockchain networks, and more particularly to methods and cryptographic protocols for establishing multi-party smart contracts utilizing automated asset collateral balances.\n\nBACKGROUND OF THE INVENTION:\nPrior art collateralization mechanisms fail to evaluate leverage ratios in real-time, frequently leading to premature liquidations or contract failure under sudden market swings and high network latency.\n\nSUMMARY OF THE INVENTION:\nThe present invention resolves liquidity slippages by establishing a dynamic liquidity buffer pool that operates continuously and adjusts collateral thresholds dynamically.`,
        `CLAIMS:\n\nWe claim:\n\n1. A computer-implemented blockchain system comprising a hardware processor, a distributed ledger interface, and memory configured to lock collateral tokens under a first cryptographic condition, evaluate an index feed in real-time, and dynamically deploy buffer reserves.\n\n2. The system of Claim 1, wherein the dynamic buffer pool adjusts liquidity dynamically based on gas price fluctuations.\n\n3. The system of Claim 1, wherein a secondary threshold is monitored continuously via automated oracle inputs.`,
      ];
    }
    return [
      `PRIVILEGED LEGAL INSTRUMENT & MEMORANDUM\n\nMatter ID: ${doc?.caseId || "N/A"}\nDocument Type: ${doc?.type?.toUpperCase() || "CONTRACT"}\nUploader: ${doc?.uploadedBy || "Staff Counsel"}\nDate: ${doc?.uploadedAt || "2026-05-30"}\n\nThis privileged internal legal instrument is drafted in accordance with current state regulations and compliance codes.\n\nRECITALS:\nWhereas, the parties hereto wish to formalize their business and legal relations on the terms and conditions set forth in this agreement.`,
      `TERMS & CONDITIONS:\n\n1. Confidentiality: Each party agrees to hold all proprietary information in strict confidence.\n\n2. Jurisdiction: This agreement shall be governed by and construed in accordance with the laws of the State of California.\n\n3. Arbitration: All disputes arising under this agreement shall be resolved via binding arbitration in San Francisco.`,
    ];
  };

  console.log("CLIENT DATA", client, "NOTES TYPE", typeof client?.notes);

  if (!client) return <div>Loading...</div>;

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="CRM & Clients"
        description="Manage client directory, track cases, communications, financials, and internal notes."
        actions={
          <Dialog open={addClientOpen} onOpenChange={setAddClientOpen}>
            <DialogTrigger asChild>
              <Button className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-medium">
                <Plus className="mr-2 h-4 w-4" /> Add client
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Client</DialogTitle>
                <DialogDescription>
                  Enter client contact details and initial retainer balance to onboard a new client.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddClientSubmit} className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g. John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      placeholder="e.g. Acme Corp (or Self)"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="e.g. john@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="e.g. +1 (415) 555-0100"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="retainer">Initial Retainer Balance ($)</Label>
                  <Input
                    id="retainer"
                    type="number"
                    min="0"
                    placeholder="e.g. 2500"
                    value={formData.retainerBalance}
                    onChange={(e) => setFormData({ ...formData, retainerBalance: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="e.g. 123 Main St, San Francisco, CA"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setAddClientOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Save Client
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Master Sidebar (Client List) */}
        <div
          className={`${
            showMobileDetail ? "hidden" : "flex"
          } md:flex flex-col w-full md:w-[360px] lg:w-[400px] border-r border-border bg-card shrink-0`}
        >
          {/* Search and Filters */}
          <div className="p-4 border-b border-border space-y-3 bg-card">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name, company, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {/* Quick Filters */}
            <div className="flex gap-1.5">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                size="sm"
                className="flex-1 text-xs cursor-pointer"
                onClick={() => setFilterType("all")}
              >
                All
              </Button>
              <Button
                variant={filterType === "active" ? "default" : "outline"}
                size="sm"
                className="flex-1 text-xs cursor-pointer"
                onClick={() => setFilterType("active")}
              >
                Active
              </Button>
              <Button
                variant={filterType === "outstanding" ? "default" : "outline"}
                size="sm"
                className="flex-1 text-xs cursor-pointer text-destructive hover:bg-destructive/10"
                onClick={() => setFilterType("outstanding")}
              >
                Balances
              </Button>
            </div>
          </div>

          {/* Client Scrollable Cards List */}
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {clientsLoading && (
                <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
                  Loading directory...
                </div>
              )}
              {!clientsLoading && filteredClients.length === 0 && (
                <div className="flex flex-col items-center justify-center p-8 text-center text-sm text-muted-foreground">
                  <Search className="h-8 w-8 mb-2 opacity-40 text-muted-foreground" />
                  <p>No clients match the criteria.</p>
                </div>
              )}
              {filteredClients.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedId(c.id);
                    setShowMobileDetail(true);
                  }}
                  className={`p-4 rounded-lg border text-left cursor-pointer transition-all hover:bg-muted/50 ${
                    selectedId === c.id
                      ? "border-primary bg-primary/5 hover:bg-primary/5 shadow-xs"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarFallback className="bg-secondary text-secondary-foreground font-semibold text-xs">
                        {getClientInitials(c.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1">
                        <p className="truncate font-semibold text-foreground text-sm">{c.name}</p>
                        <span className="shrink-0 text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-sm">
                          Since {new Date(c.since).getFullYear()}
                        </span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground mt-0.5">{c.company}</p>

                      <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-border/60 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3.5 w-3.5" /> {c.activeCases} Active
                        </span>
                        {c.outstanding > 0 ? (
                          <span className="ml-auto font-medium text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-sm">
                            ${c.outstanding.toLocaleString()} due
                          </span>
                        ) : (
                          <span className="ml-auto font-medium text-success bg-success/15 px-1.5 py-0.5 rounded-sm">
                            Settled
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Detailed Pane */}
        {client ? (
          <div
            className={`${
              showMobileDetail ? "flex" : "hidden"
            } md:flex flex-col flex-1 bg-card min-w-0`}
          >
            {/* Detail Pane Header (with Mobile Back Button) */}
            <div className="px-6 py-4 border-b border-border flex items-center gap-3 bg-card shadow-2xs">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMobileDetail(false)}
                className="md:hidden shrink-0 cursor-pointer"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Avatar className="h-12 w-12 border-2 border-border shadow-xs">
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
                  {getClientInitials(client.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-foreground truncate">{client.name}</h2>
                  <Badge
                    variant={client.activeCases > 0 ? "default" : "secondary"}
                    className="text-[10px] py-0.5 px-2 font-medium"
                  >
                    {client.activeCases > 0 ? "Active Client" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-medium truncate mt-0.5">
                  {client.company !== "Self" ? client.company : "Individual Client"}
                </p>
              </div>

              {/* Quick Action Badges / Buttons */}
              <div className="hidden sm:flex items-center gap-2">
                <Button variant="outline" size="sm" asChild className="cursor-pointer text-xs">
                  <a href={`mailto:${client.email}`}>
                    <Mail className="mr-1.5 h-3.5 w-3.5" /> Email
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild className="cursor-pointer text-xs">
                  <a href={`tel:${client.phone}`}>
                    <Phone className="mr-1.5 h-3.5 w-3.5" /> Call
                  </a>
                </Button>
              </div>
            </div>

            {/* Profile Workspace Content */}
            <ScrollArea className="flex-1 bg-muted/10">
              <div className="p-6 space-y-6 max-w-5xl mx-auto">
                {/* Highlight Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="shadow-2xs">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Active Cases
                        </p>
                        <h3 className="text-2xl font-bold text-foreground mt-2">
                          {client.activeCases}
                        </h3>
                      </div>
                      <div className="h-10 w-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                        <Briefcase className="h-5 w-5" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-2xs">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Retainer Balance
                        </p>
                        <h3 className="text-2xl font-bold text-success mt-2">
                          ${(client.retainerBalance || 0).toLocaleString()}
                        </h3>
                      </div>
                      <div className="h-10 w-10 bg-success/15 text-success rounded-lg flex items-center justify-center">
                        <UserCheck className="h-5 w-5" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-2xs">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Outstanding Due
                        </p>
                        <h3
                          className={`text-2xl font-bold mt-2 ${client.outstanding > 0 ? "text-destructive" : "text-foreground"}`}
                        >
                          ${client.outstanding.toLocaleString()}
                        </h3>
                      </div>
                      <div
                        className={`h-10 w-10 rounded-lg flex items-center justify-center ${client.outstanding > 0 ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"}`}
                      >
                        <DollarSign className="h-5 w-5" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Client Profile Details Section */}
                <Card className="shadow-2xs">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Contact & Identity Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2.5">
                        <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">Email Address</p>
                          <a
                            href={`mailto:${client.email}`}
                            className="text-foreground hover:underline font-medium"
                          >
                            {client.email}
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">Phone Number</p>
                          <a
                            href={`tel:${client.phone}`}
                            className="text-foreground hover:underline font-medium"
                          >
                            {client.phone}
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2.5">
                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">
                            Primary Office Address
                          </p>
                          <p className="text-foreground font-medium">
                            {client.address || "No address on file"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">Client Since</p>
                          <p className="text-foreground font-medium">
                            {new Date(client.since).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Interactive Feature Tabs */}
                <Tabs defaultValue="cases" className="w-full">
                  <TabsList className="grid w-full grid-cols-5 bg-muted/30 p-1 border border-border/60 rounded-lg">
                    <TabsTrigger value="cases" className="text-xs py-2 cursor-pointer">
                      Cases & Matters
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="text-xs py-2 cursor-pointer">
                      Documents ({clientDocuments.length})
                    </TabsTrigger>
                    <TabsTrigger value="notes" className="text-xs py-2 cursor-pointer">
                      Internal Notes ({client.notes?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="finance" className="text-xs py-2 cursor-pointer">
                      Finances
                    </TabsTrigger>
                    <TabsTrigger
                      value="ai"
                      className="text-xs py-2 cursor-pointer flex items-center justify-center gap-1 text-primary"
                    >
                      <Sparkles className="h-3 w-3" /> AI Insights
                    </TabsTrigger>
                  </TabsList>

                  {/* CASES TAB */}
                  <TabsContent value="cases" className="mt-4">
                    <Card className="shadow-2xs">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground" /> Assigned Legal
                          Matters
                        </CardTitle>
                        <CardDescription>
                          All active and closed matters. Click a case row to inspect full court
                          records, lead counsel, and billable logs.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {clientCases.length === 0 ? (
                          <div className="p-8 text-center text-sm text-muted-foreground">
                            No cases linked to this client.
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Case Number</TableHead>
                                  <TableHead>Case Title</TableHead>
                                  <TableHead>Practice Area</TableHead>
                                  <TableHead>Lead Counsel</TableHead>
                                  <TableHead>Stage</TableHead>
                                  <TableHead className="text-right">Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {clientCases.map((c) => (
                                  <TableRow
                                    key={c.id}
                                    onClick={() => {
                                      setSelectedCase(c);
                                      setCaseDialogOpen(true);
                                    }}
                                    className="cursor-pointer hover:bg-muted/60 transition-colors font-medium"
                                  >
                                    <TableCell className="font-semibold text-primary text-xs">
                                      {c.number}
                                    </TableCell>
                                    <TableCell className="text-xs font-semibold text-foreground">
                                      {c.title}
                                    </TableCell>
                                    <TableCell className="text-xs">{c.practice}</TableCell>
                                    <TableCell className="text-xs">{c.lead}</TableCell>
                                    <TableCell className="text-xs font-medium text-muted-foreground">
                                      {c.stage}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Badge
                                        variant="outline"
                                        className={`text-[10px] py-0.5 px-2 ${statusColor(c.status)}`}
                                      >
                                        {c.status.toUpperCase()}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* DOCUMENTS TAB */}
                  <TabsContent value="documents" className="mt-4">
                    <Card className="shadow-2xs">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                          <FolderOpen className="h-4 w-4 text-muted-foreground" /> Document
                          Repository
                        </CardTitle>
                        <CardDescription>
                          Privileged case records, filings, and contracts. Click any document row to
                          view details, inspect mock previews, or verify signing.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {clientDocuments.length === 0 ? (
                          <div className="p-8 text-center text-sm text-muted-foreground">
                            No files or document repositories linked to this client's matters.
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>File Name</TableHead>
                                  <TableHead>Type</TableHead>
                                  <TableHead>Size</TableHead>
                                  <TableHead>Uploaded By</TableHead>
                                  <TableHead>Uploaded Date</TableHead>
                                  <TableHead className="text-right">Signature Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {clientDocuments.map((doc) => (
                                  <TableRow
                                    key={doc.id}
                                    onClick={() => {
                                      setSelectedDoc(doc);
                                      setDocDialogOpen(true);
                                    }}
                                    className="cursor-pointer hover:bg-muted/60 transition-colors font-medium"
                                  >
                                    <TableCell className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                                      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                      <span className="truncate text-primary hover:underline">
                                        {doc.name}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-xs uppercase tracking-wide font-medium text-muted-foreground">
                                      {doc.type}
                                    </TableCell>
                                    <TableCell className="text-xs tabular-nums">
                                      {doc.size}
                                    </TableCell>
                                    <TableCell className="text-xs">{doc.uploadedBy}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                      {new Date(doc.uploadedAt).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {doc.signed ? (
                                        <Badge
                                          variant="outline"
                                          className="text-[10px] py-0.5 px-2 bg-success/15 text-success border-success/25 font-bold"
                                        >
                                          SIGNED
                                        </Badge>
                                      ) : (
                                        <Badge
                                          variant="outline"
                                          className="text-[10px] py-0.5 px-2 bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold"
                                        >
                                          PENDING SIGN
                                        </Badge>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* INTERNAL NOTES TAB */}
                  <TabsContent value="notes" className="mt-4">
                    <Card className="shadow-2xs">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold text-foreground flex items-center justify-between">
                          Internal Practitioner Notes
                        </CardTitle>
                        <CardDescription>
                          Privileged internal documentation for law firm staff. Not visible to
                          clients.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Add Note Editor */}
                        <div className="space-y-2 border-b border-border/80 pb-4">
                          <Label
                            htmlFor="noteEditor"
                            className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                          >
                            New Internal Entry
                          </Label>
                          <div className="flex gap-2">
                            <Textarea
                              id="noteEditor"
                              placeholder="Write case developments, client communications, or prep progress..."
                              value={newNote}
                              onChange={(e) => setNewNote(e.target.value)}
                              rows={2}
                              className="resize-none"
                            />
                            <Button
                              onClick={handleAddNote}
                              className="h-auto shrink-0 bg-primary hover:bg-primary/95 flex flex-col justify-center items-center px-4 cursor-pointer"
                            >
                              <Send className="h-4 w-4 mb-1" />
                              <span className="text-[10px] font-semibold">Post</span>
                            </Button>
                          </div>
                        </div>

                        {/* Notes History */}
                        <div className="space-y-3">
                          {!client.notes || client.notes.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-6">
                              No internal notes posted yet.
                            </p>
                          ) : (
                            client.notes.map((n: any) => (
                              <div
                                key={n.id}
                                className="p-4 rounded-lg bg-muted/30 border border-border/50 text-sm space-y-1.5"
                              >
                                <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                                  <span className="text-foreground font-semibold">{n.author}</span>
                                  <span>
                                    {new Date(n.date).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                                <p className="text-foreground/90 leading-relaxed text-xs">
                                  {n.text}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* FINANCES TAB */}
                  <TabsContent value="finance" className="mt-4">
                    <Card className="shadow-2xs">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold text-foreground">
                          Billing & Invoice Ledger
                        </CardTitle>
                        <CardDescription>
                          Detailed record of invoices, outstanding fees, and payment status.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {clientInvoices.length === 0 ? (
                          <div className="p-8 text-center text-sm text-muted-foreground">
                            No billing history exists for this client.
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Invoice No.</TableHead>
                                  <TableHead>Issued Date</TableHead>
                                  <TableHead>Due Date</TableHead>
                                  <TableHead className="text-right">Total Amount</TableHead>
                                  <TableHead className="text-right">Billing Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {clientInvoices.map((i) => (
                                  <TableRow key={i.id}>
                                    <TableCell className="font-semibold text-foreground text-xs">
                                      {i.number}
                                    </TableCell>
                                    <TableCell className="text-xs">
                                      {new Date(i.issued).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                      {new Date(i.due).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })}
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-foreground text-xs">
                                      ${i.amount.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Badge
                                        variant="outline"
                                        className={`text-[10px] py-0.5 px-2 ${statusColor(i.status)}`}
                                      >
                                        {i.status.toUpperCase()}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* AI INSIGHTS TAB */}
                  <TabsContent value="ai" className="mt-4">
                    <Card className="border border-primary/20 shadow-xs bg-primary/5">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2 text-primary">
                          <Sparkles className="h-5 w-5 animate-pulse" />
                          <CardTitle className="text-base font-semibold">
                            AI Legal Intake & Risk Insights
                          </CardTitle>
                        </div>
                        <CardDescription className="text-primary/70">
                          Automated intelligence reports examining cases, calendars, and accounting
                          metrics.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-2">
                        {/* Outstanding Alert */}
                        {client.outstanding > 0 && (
                          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-xs flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <p className="font-bold text-destructive">
                                Accounting Alert: Unpaid Invoices
                              </p>
                              <p className="text-destructive/90 leading-relaxed">
                                Client has ${client.outstanding.toLocaleString()} outstanding due.
                                The invoice for matter{" "}
                                <strong>{clientCases[0]?.title || "Assigned cases"}</strong> has
                                exceeded its due date. Suggest sending automated billing reminder
                                email or initiating a payment plan discussions.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Retainer Alert */}
                        {client.retainerBalance < 1000 && client.activeCases > 0 && (
                          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <p className="font-bold text-yellow-700">
                                Practice Alert: Retainer Replenishment Necessary
                              </p>
                              <p className="text-yellow-800 leading-relaxed">
                                Active case <strong>{clientCases[0]?.title}</strong> is currently in
                                the active stage, but the client's retainer balance is low ($
                                {client.retainerBalance.toLocaleString()}). It is highly recommended
                                to request a retainer top-up of <strong>$2,500</strong> before next
                                trial or motion drafting milestones.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Suggested Tasks */}
                        <div className="p-4 rounded-lg bg-background border border-border text-xs space-y-3">
                          <p className="font-bold text-foreground uppercase tracking-wider text-[10px]">
                            AI-Generated Next Best Actions
                          </p>
                          <ul className="space-y-2.5">
                            {client.name.includes("Whitaker") && (
                              <>
                                <li className="flex items-start gap-2 text-foreground/80">
                                  <span className="h-1.5 w-1.5 bg-primary rounded-full mt-1.5 shrink-0" />
                                  <span>
                                    <strong>Schedule prep session:</strong> Status conference is
                                    approaching on June 2 for Whitaker v. Northbridge. Coordinate
                                    prep meeting with James Whitaker.
                                  </span>
                                </li>
                                <li className="flex items-start gap-2 text-foreground/80">
                                  <span className="h-1.5 w-1.5 bg-primary rounded-full mt-1.5 shrink-0" />
                                  <span>
                                    <strong>File Patent Application:</strong> Patent deadline for
                                    Series B is June 20. Ensure all engineering specification items
                                    are compiled.
                                  </span>
                                </li>
                              </>
                            )}
                            {client.name.includes("Martinez") && (
                              <li className="flex items-start gap-2 text-foreground/80">
                                <span className="h-1.5 w-1.5 bg-primary rounded-full mt-1.5 shrink-0" />
                                <span>
                                  <strong>Confirm property deeds:</strong> Review trust amendment v3
                                  drafts with Ana Martinez before the June 8 deadline. Ask client
                                  for deeds file uploads.
                                </span>
                              </li>
                            )}
                            {client.name.includes("Holloway") && (
                              <li className="flex items-start gap-2 text-foreground/80">
                                <span className="h-1.5 w-1.5 bg-primary rounded-full mt-1.5 shrink-0" />
                                <span>
                                  <strong>Trial Prep Meeting:</strong> Coordinate Holloway briefing
                                  meetings to review trial day 1 witness statements.
                                </span>
                              </li>
                            )}
                            {!client.name.includes("Whitaker") &&
                              !client.name.includes("Martinez") &&
                              !client.name.includes("Holloway") && (
                                <li className="flex items-start gap-2 text-foreground/80">
                                  <span className="h-1.5 w-1.5 bg-primary rounded-full mt-1.5 shrink-0" />
                                  <span>
                                    No immediate automated recommendations found. Onboarding profile
                                    is in stable state.
                                  </span>
                                </li>
                              )}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-muted/5">
            <UserCheck className="h-12 w-12 mb-3 opacity-30 text-muted-foreground" />
            <p className="font-semibold text-lg">No Client Selected</p>
            <p className="text-sm max-w-xs mt-1">
              Select a client from the directory to review their legal history, finances, and notes.
            </p>
          </div>
        )}
      </div>

      {/* CASE DETAILS DIALOG */}
      {selectedCase && (
        <Dialog open={caseDialogOpen} onOpenChange={setCaseDialogOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <div className="flex items-center justify-between pr-4">
                <Badge
                  variant="outline"
                  className={`text-[9px] font-bold uppercase tracking-wider py-0.5 px-2 ${statusColor(selectedCase.status)}`}
                >
                  {selectedCase.status.toUpperCase()}
                </Badge>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  Opened: {selectedCase.openedAt}
                </span>
              </div>
              <DialogTitle className="text-base font-bold text-foreground mt-1.5">
                {selectedCase.number} — {selectedCase.title}
              </DialogTitle>
              <DialogDescription>Comprehensive case directory profile.</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 border-y border-border py-4 text-xs">
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">
                    Practice Specialty
                  </p>
                  <p className="text-foreground font-bold mt-0.5 text-sm">
                    {selectedCase.practice}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">
                    Matter Client
                  </p>
                  <p className="text-foreground font-medium mt-0.5">{selectedCase.client}</p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">
                    Next Filing Deadline
                  </p>
                  <p className="text-destructive font-semibold mt-0.5 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />{" "}
                    {selectedCase.nextDeadline || "No pending deadlines"}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">
                    Lead Counsel
                  </p>
                  <p className="text-foreground font-medium mt-0.5">{selectedCase.lead}</p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">
                    Milestone Stage
                  </p>
                  <p className="text-foreground font-medium mt-0.5">{selectedCase.stage}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">
                      Billable Hours
                    </p>
                    <p className="text-foreground font-bold mt-0.5 tabular-nums">
                      {selectedCase.billable} hrs
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">
                      Caseload Priority
                    </p>
                    <Badge
                      variant="outline"
                      className={`mt-0.5 text-[9px] py-0 px-2 ${statusColor(selectedCase.priority)}`}
                    >
                      {selectedCase.priority.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-documents linked directly in this case preview */}
            <div className="space-y-2.5 pt-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Matters Files & Documents
              </p>
              {documents.filter((d) => d.caseId === selectedCase.id).length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  No document uploads registered on this case record.
                </p>
              ) : (
                <div className="max-h-28 overflow-y-auto space-y-1.5 pr-2">
                  {documents
                    .filter((d) => d.caseId === selectedCase.id)
                    .map((d) => (
                      <div
                        key={d.id}
                        onClick={() => {
                          setCaseDialogOpen(false);
                          setSelectedDoc(d);
                          setDocDialogOpen(true);
                        }}
                        className="p-2 border border-border/80 rounded-md bg-muted/20 hover:bg-primary/5 transition-colors flex items-center justify-between text-xs cursor-pointer group"
                      >
                        <span className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                          {d.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase">
                          {d.type}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                onClick={() => setCaseDialogOpen(false)}
                className="text-xs bg-primary text-primary-foreground hover:bg-primary/95"
              >
                Close Case Profile
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* DOCUMENT PREVIEW DIALOG */}
      {selectedDoc && (
        <Dialog open={docDialogOpen} onOpenChange={setDocDialogOpen}>
          <DialogContent className="sm:max-w-[620px]">
            <DialogHeader>
              <div className="flex items-center justify-between pr-4">
                <Badge
                  variant="outline"
                  className="text-[9px] font-bold uppercase tracking-wider py-0.5 px-2 bg-secondary text-secondary-foreground"
                >
                  {selectedDoc.type.toUpperCase()}
                </Badge>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  Size: {selectedDoc.size}
                </span>
              </div>
              <DialogTitle className="text-base font-bold text-foreground mt-1">
                {selectedDoc.name}
              </DialogTitle>
              <DialogDescription>
                Uploaded by {selectedDoc.uploadedBy} on {selectedDoc.uploadedAt}
              </DialogDescription>
            </DialogHeader>

            {/* Mock legal text document container - A4 paper type */}
            <div className="space-y-3 pt-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                File Content Preview (A4 Page)
              </p>
              <div className="rounded-lg bg-slate-200/70 dark:bg-slate-900 border border-border max-h-[500px] overflow-y-auto p-6 flex flex-col items-center gap-6 shadow-inner">
                {getMockDocumentPages(selectedDoc.name, selectedDoc).map((pageText, index, arr) => {
                  const isPleading =
                    selectedDoc.name.toLowerCase().includes("complaint") ||
                    selectedDoc.type?.toLowerCase() === "pleading";
                  const isTrust =
                    selectedDoc.name.toLowerCase().includes("trust") ||
                    selectedDoc.name.toLowerCase().includes("agreement");
                  const isPatent = selectedDoc.name.toLowerCase().includes("patent");

                  return (
                    <div
                      key={index}
                      className="w-full max-w-[460px] min-h-[600px] bg-white text-slate-900 shadow-md border border-slate-200/80 relative select-text text-left flex flex-col justify-between overflow-hidden"
                    >
                      {/* Pleading style: numbers 1 to 28 down the left side */}
                      {isPleading && (
                        <div className="absolute left-0 top-0 bottom-0 w-9 border-r-2 border-double border-red-300/80 select-none flex flex-col pt-10 pb-10 font-mono text-[8px] text-red-400/50 text-right pr-2">
                          {Array.from({ length: 28 }, (_, i) => (
                            <div
                              key={i}
                              style={{ height: "18px" }}
                              className="flex items-center justify-end"
                            >
                              {i + 1}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Page Content */}
                      <div
                        className={`flex-1 pt-10 pb-8 ${isPleading ? "pl-12 pr-6 font-serif text-[10px] leading-[18px]" : "px-8 md:px-10 font-serif text-[10px] leading-relaxed"}`}
                      >
                        {/* Letterhead / Header */}
                        {!isPleading && (
                          <div className="border-b border-slate-100 pb-1.5 mb-4 flex justify-between text-[7px] uppercase tracking-widest text-slate-400 font-sans select-none">
                            <span>CaseJoy Practice Group</span>
                            <span>Confidential Legal Doc</span>
                          </div>
                        )}

                        {/* Dynamic Watermark for Patents */}
                        {isPatent && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none rotate-12">
                            <span className="text-3xl font-extrabold tracking-widest text-slate-900 border-4 border-slate-900 p-3">
                              USPTO PATENT
                            </span>
                          </div>
                        )}

                        {/* Text */}
                        <div className="whitespace-pre-wrap">{pageText}</div>
                      </div>

                      {/* Footer */}
                      <div
                        className={`px-8 pb-3 flex justify-between items-center text-[7px] text-slate-400 font-sans border-t border-slate-50 pt-1.5 select-none ${isPleading ? "pl-12" : ""}`}
                      >
                        <span className="truncate max-w-[180px]">{selectedDoc.name}</span>
                        <span>
                          Page {index + 1} of {arr.length}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="pt-4 flex flex-row items-center justify-between sm:justify-between gap-2 border-t border-border/60">
              {/* E-sign interactive button */}
              {!selectedDoc.signed ? (
                <Button
                  type="button"
                  onClick={() => handleSignDocument(selectedDoc.id)}
                  className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500 text-xs py-1.5 h-8 font-semibold flex items-center gap-1"
                >
                  <FileCheck className="h-3.5 w-3.5" /> Sign & Authorize
                </Button>
              ) : (
                <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs select-none">
                  <Check className="h-4 w-4 bg-emerald-100 rounded-full p-0.5" /> Authorized &
                  E-Signed
                </div>
              )}
              <Button
                type="button"
                onClick={() => setDocDialogOpen(false)}
                className="text-xs h-8 px-4 bg-primary text-primary-foreground hover:bg-primary/95"
              >
                Close Preview
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
