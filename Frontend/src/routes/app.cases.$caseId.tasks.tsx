import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useApi } from "@/lib/use-api";
import { api } from "@/lib/api";
import { CheckCircle2, Clock, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/app/cases/$caseId/tasks")({
  component: CaseTasksPage,
});

function CaseTasksPage() {
  const { caseId } = Route.useParams();
  const { user } = useAuth();
  const {
    data: tasks,
    refresh,
    loading,
  } = useApi(() => api.getTasks(user!, caseId), [caseId]);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    assignee: user?.name || "",
    due: new Date().toISOString().split("T")[0],
    priority: "medium",
  });

  const filteredTasks = (tasks || []).filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase()),
  );

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTask({
        ...formData,
        caseId,
        status: "pending",
        id: "t-" + Date.now(),
      });
      refresh();
      setIsCreateOpen(false);
      setFormData({
        title: "",
        assignee: user?.name || "",
        due: new Date().toISOString().split("T")[0],
        priority: "medium",
      });
      toast.success("Task created successfully");
    } catch (error) {
      toast.error("Failed to create task");
    }
  };

  if (loading)
    return <div className="py-8 text-center text-muted-foreground">Loading tasks...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter tasks..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>Add a new task to this case matter.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTask} className="space-y-4 pt-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Draft initial response"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="due">Due Date</Label>
                  <Input
                    id="due"
                    type="date"
                    value={formData.due}
                    onChange={(e) => setFormData({ ...formData, due: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(v) => setFormData({ ...formData, priority: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Task</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-muted/30 border-b border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <div className="col-span-6">Task</div>
          <div className="col-span-2">Due Date</div>
          <div className="col-span-2">Priority</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        <div className="divide-y divide-border">
          {filteredTasks.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 mb-2 opacity-20" />
              <p className="text-sm">No tasks found for this case.</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-muted/10 transition-colors"
              >
                <div className="col-span-6 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                    <p className="text-[10px] text-muted-foreground">Assigned to {task.assignee}</p>
                  </div>
                </div>
                <div className="col-span-2 text-xs text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3 w-3" /> {task.due}
                </div>
                <div className="col-span-2">
                  <Badge
                    variant="outline"
                    className={`capitalize ${
                      task.priority === "high"
                        ? "text-destructive border-destructive/20 bg-destructive/5"
                        : task.priority === "medium"
                          ? "text-warning border-warning/20 bg-warning/5"
                          : "text-info border-info/20 bg-info/5"
                    }`}
                  >
                    {task.priority}
                  </Badge>
                </div>
                <div className="col-span-2 flex justify-end gap-1">
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
