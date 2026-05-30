import { createFileRoute } from "@tanstack/react-router";
import {
  Upload,
  FileText,
  FileSignature,
  Download,
  Folder,
  Grid,
  List,
  MoreVertical,
  Pencil,
  Trash2,
  X,
  Eye,
  Check,
  FileCheck,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useApi } from "@/lib/use-api";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui-shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

export const Route = createFileRoute("/app/documents")({
  component: DocumentsPage,
});

type DocumentItem = {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  signed?: boolean;
  caseId?: string;
};

function DocumentsPage() {
  const { user, isClient } = useAuth();
  const { data: documents, loading } = useApi(() => api.getDocuments(user!), [user?.id]);

  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [renameDoc, setRenameDoc] = useState<DocumentItem | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<DocumentItem | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [signedDocIds, setSignedDocIds] = useState<string[]>([]);

  const handleSignDocument = (docId: string) => {
    setSignedDocIds((prev) => [...prev, docId]);
    toast.success("Document signed successfully!");
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

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      toast.success(`${acceptedFiles.length} file(s) uploaded successfully.`);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  // Group documents by caseId for folders
  const folders = Array.from(new Set((documents ?? []).map((d: DocumentItem) => d.caseId))).filter(
    Boolean,
  );

  const displayedDocs = currentFolder
    ? (documents ?? []).filter((d: DocumentItem) => d.caseId === currentFolder)
    : (documents ?? []);

  const handleRename = () => {
    toast.success(`Document renamed to ${renameValue}`);
    setRenameDoc(null);
  };

  const handleDelete = () => {
    toast.success(`Document deleted`);
    setDeleteDoc(null);
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={isClient ? "Document vault" : "Documents"}
        description={
          isClient
            ? "Securely upload, download, and sign documents."
            : "Templates, evidence, and case files."
        }
        actions={
          <div className="flex items-center gap-2">
            {!isClient && <Button variant="outline">Templates</Button>}
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(v) => v && setViewMode(v as "list" | "grid")}
            >
              <ToggleGroupItem value="list" aria-label="Toggle list view">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="grid" aria-label="Toggle grid view">
                <Grid className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
            <div {...getRootProps()}>
              <input {...getInputProps()} />
              <Button>
                <Upload className="mr-2 h-4 w-4" /> Upload
              </Button>
            </div>
          </div>
        }
      />
      <div className="flex-1 p-6 flex flex-col gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              {currentFolder ? (
                <BreadcrumbLink onClick={() => setCurrentFolder(null)} className="cursor-pointer">
                  All Documents
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>All Documents</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {currentFolder && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{currentFolder}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>

        <div
          {...getRootProps()}
          className={`flex-1 rounded-lg border-2 border-dashed p-4 transition-colors ${isDragActive ? "border-primary bg-primary/5" : "border-border bg-card"}`}
        >
          <input {...getInputProps()} />

          {!currentFolder && folders.length > 0 && (
            <div className="mb-8">
              <h3 className="mb-4 text-sm font-medium text-muted-foreground">Folders</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {folders.map((folderId) => (
                  <div
                    key={folderId as string}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentFolder(folderId as string);
                    }}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card p-4 hover:border-primary hover:shadow-sm"
                  >
                    <Folder className="h-8 w-8 fill-blue-500/20 text-blue-500" />
                    <div>
                      <div className="font-medium">{folderId as string}</div>
                      <div className="text-xs text-muted-foreground">
                        {
                          (documents ?? []).filter((d: DocumentItem) => d.caseId === folderId)
                            .length
                        }{" "}
                        files
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="mb-4 text-sm font-medium text-muted-foreground">Files</h3>

            {loading ? (
              <div className="py-10 text-center text-muted-foreground">Loading…</div>
            ) : displayedDocs.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                <FileText className="mx-auto h-8 w-8 mb-2 opacity-20" />
                No files found
              </div>
            ) : viewMode === "list" ? (
              <div className="overflow-hidden rounded-lg border border-border bg-card">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 text-left font-medium">Name</th>
                      <th className="px-5 py-3 text-left font-medium">Type</th>
                      <th className="px-5 py-3 text-left font-medium">Size</th>
                      <th className="px-5 py-3 text-left font-medium">Uploaded by</th>
                      <th className="px-5 py-3 text-left font-medium">Date</th>
                      <th className="px-5 py-3 text-left font-medium">Status</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {displayedDocs.map((d: DocumentItem) => (
                      <tr key={d.id} className="transition-colors hover:bg-secondary/40">
                        <td className="px-5 py-3.5">
                          <div
                            className="flex items-center gap-3 cursor-pointer hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewDoc(d);
                            }}
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-primary">
                              <FileText className="h-4 w-4" />
                            </div>
                            <span className="font-medium text-foreground">{d.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge variant="outline" className="capitalize">
                            {d.type}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground">{d.size}</td>
                        <td className="px-5 py-3.5 text-muted-foreground">{d.uploadedBy}</td>
                        <td className="px-5 py-3.5 text-muted-foreground">{d.uploadedAt}</td>
                        <td className="px-5 py-3.5">
                          {d.signed || signedDocIds.includes(d.id) ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                              <FileSignature className="h-3.5 w-3.5" /> Signed
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Awaiting signature
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewDoc(d);
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" /> Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open("#", "_blank");
                                }}
                              >
                                <Download className="mr-2 h-4 w-4" /> Download
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRenameDoc(d);
                                  setRenameValue(d.name);
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" /> Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:bg-destructive/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteDoc(d);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {displayedDocs.map((d: DocumentItem) => (
                  <div
                    key={d.id}
                    className="group relative rounded-lg border border-border bg-card p-4 hover:border-primary"
                  >
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="secondary" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewDoc(d);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" /> Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open("#", "_blank");
                            }}
                          >
                            <Download className="mr-2 h-4 w-4" /> Download
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenameDoc(d);
                              setRenameValue(d.name);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" /> Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteDoc(d);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div
                      className="flex cursor-pointer flex-col items-center gap-3 text-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewDoc(d);
                      }}
                    >
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-secondary/50 text-primary">
                        <FileText className="h-8 w-8" />
                      </div>
                      <div>
                        <div className="line-clamp-2 text-sm font-medium" title={d.name}>
                          {d.name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{d.size}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={(o) => !o && setPreviewDoc(null)}>
        {previewDoc && (
          <DialogContent className="sm:max-w-[620px]">
            <DialogHeader>
              <div className="flex items-center justify-between pr-4">
                <Badge
                  variant="outline"
                  className="text-[9px] font-bold uppercase tracking-wider py-0.5 px-2 bg-secondary text-secondary-foreground"
                >
                  {previewDoc.type.toUpperCase()}
                </Badge>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  Size: {previewDoc.size}
                </span>
              </div>
              <DialogTitle className="text-base font-bold text-foreground mt-1">
                {previewDoc.name}
              </DialogTitle>
              <DialogDescription>
                Uploaded by {previewDoc.uploadedBy} on {previewDoc.uploadedAt}
              </DialogDescription>
            </DialogHeader>

            {/* Mock legal text document container - A4 paper type */}
            <div className="space-y-3 pt-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                File Content Preview (A4 Page)
              </p>
              <div className="rounded-lg bg-slate-200/70 dark:bg-slate-900 border border-border max-h-[480px] overflow-y-auto p-6 flex flex-col items-center gap-6 shadow-inner">
                {getMockDocumentPages(previewDoc.name, previewDoc).map((pageText, index, arr) => {
                  const isPleading =
                    previewDoc.name.toLowerCase().includes("complaint") ||
                    previewDoc.type?.toLowerCase() === "pleading";
                  const isTrust =
                    previewDoc.name.toLowerCase().includes("trust") ||
                    previewDoc.name.toLowerCase().includes("agreement");
                  const isPatent = previewDoc.name.toLowerCase().includes("patent");

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
                        <span className="truncate max-w-[180px]">{previewDoc.name}</span>
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
              {/* E-sign Button */}
              {!(previewDoc.signed || signedDocIds.includes(previewDoc.id)) ? (
                <Button
                  type="button"
                  onClick={() => handleSignDocument(previewDoc.id)}
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
                onClick={() => setPreviewDoc(null)}
                className="text-xs h-8 px-4 bg-primary text-primary-foreground hover:bg-primary/95"
              >
                Close Preview
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={!!renameDoc} onOpenChange={(o) => !o && setRenameDoc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Document</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="name">Document Name</Label>
            <Input
              id="name"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDoc(null)}>
              Cancel
            </Button>
            <Button onClick={handleRename}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteDoc} onOpenChange={(o) => !o && setDeleteDoc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteDoc?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDoc(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
