import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useApi } from "@/lib/use-api";
import { api } from "@/lib/api";
import { CalendarDays, Clock, MapPin, Plus, Search, Trash2 } from "lucide-react";
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

export const Route = createFileRoute("/app/cases/$caseId/events")({
  component: CaseEventsPage,
});

function CaseEventsPage() {
  const { caseId } = Route.useParams();
  const { user } = useAuth();
  const {
    data: events,
    refresh,
    loading,
  } = useApi(() => api.getEvents(user!, caseId), [caseId]);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    type: "meeting",
    date: new Date().toISOString().split("T")[0],
    time: "10:00",
    location: "",
  });

  const filteredEvents = (events || []).filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase()),
  );

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createEvent({
        ...formData,
        caseId,
        id: "e-" + Date.now(),
      });
      refresh();
      setIsCreateOpen(false);
      setFormData({
        title: "",
        type: "meeting",
        date: new Date().toISOString().split("T")[0],
        time: "10:00",
        location: "",
      });
      toast.success("Event scheduled successfully");
    } catch (error) {
      toast.error("Failed to schedule event");
    }
  };

  if (loading)
    return <div className="py-8 text-center text-muted-foreground">Loading calendar...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter events..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> New Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule New Event</DialogTitle>
              <DialogDescription>Add a new event to this case calendar.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateEvent} className="space-y-4 pt-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Court Hearing"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) => setFormData({ ...formData, type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="court">Court</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="deadline">Deadline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Room 302"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Schedule Event</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-muted/30 border-b border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <div className="col-span-5">Event</div>
          <div className="col-span-3">Date & Time</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        <div className="divide-y divide-border">
          {filteredEvents.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
              <CalendarDays className="h-10 w-10 mb-2 opacity-20" />
              <p className="text-sm">No events found for this case.</p>
            </div>
          ) : (
            filteredEvents.map((event) => (
              <div
                key={event.id}
                className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-muted/10 transition-colors"
              >
                <div className="col-span-5 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                    <CalendarDays className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                    {event.location && (
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-2.5 w-2.5" /> {event.location}
                      </p>
                    )}
                  </div>
                </div>
                <div className="col-span-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    <CalendarDays className="h-3 w-3" /> {event.date}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Clock className="h-3 w-3" /> {event.time}
                  </div>
                </div>
                <div className="col-span-2">
                  <Badge
                    variant="outline"
                    className={`capitalize ${
                      event.type === "court"
                        ? "text-amber-600 border-amber-200 bg-amber-50"
                        : event.type === "deadline"
                          ? "text-red-600 border-red-200 bg-red-50"
                          : "text-blue-600 border-blue-200 bg-blue-50"
                    }`}
                  >
                    {event.type}
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
