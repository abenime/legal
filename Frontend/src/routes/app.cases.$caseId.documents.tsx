import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useApi } from "@/lib/use-api";
import { api } from "@/lib/api";
import { FileText, Upload, Download, Trash2, FileCheck, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/app/cases/$caseId/documents")({
  component: CaseDocumentsPage,
});

function CaseDocumentsPage() {
  const { caseId } = Route.useParams();
  const { user } = useAuth();
  const {
    data: documents,
    refresh,
    loading,
  } = useApi(() => api.getDocuments(user!, caseId), [caseId]);
  const [search, setSearch] = useState("");

  const filteredDocs = (documents || []).filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleFakeUpload = async () => {
    try {
      await api.createDocument({
        id: `doc-${Date.now()}`,
        caseId,
        name: `New Document ${Date.now()}.pdf`,
        type: "PDF",
        size: "1.2 MB",
        uploadedBy: user?.name || "System",
        uploadedAt: new Date().toISOString().split("T")[0],
        signed: false,
      });
      refresh();
      toast.success("Document uploaded successfully (Simulated)");
    } catch (error) {
      toast.error("Failed to upload document");
    }
  };

  if (loading)
    return <div className="py-8 text-center text-muted-foreground">Loading documents...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter documents..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> Download All
          </Button>
          <Button size="sm" onClick={handleFakeUpload}>
            <Upload className="mr-2 h-4 w-4" /> Upload
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-muted/30 border-b border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <div className="col-span-6">Name</div>
          <div className="col-span-2">Size</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        <div className="divide-y divide-border">
          {filteredDocs.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
              <FileText className="h-10 w-10 mb-2 opacity-20" />
              <p className="text-sm">No documents found for this case.</p>
            </div>
          ) : (
            filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-muted/10 transition-colors"
              >
                <div className="col-span-6 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Uploaded {doc.uploadedAt} by {doc.uploadedBy}
                    </p>
                  </div>
                </div>
                <div className="col-span-2 text-xs text-muted-foreground">{doc.size}</div>
                <div className="col-span-2">
                  {doc.signed ? (
                    <Badge
                      variant="outline"
                      className="bg-success/10 text-success border-success/20 gap-1"
                    >
                      <FileCheck className="h-3 w-3" /> Signed
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Pending
                    </Badge>
                  )}
                </div>
                <div className="col-span-2 flex justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
