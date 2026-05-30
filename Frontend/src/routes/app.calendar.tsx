import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Plus,
  Gavel,
  Users as UsersIcon,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Clock,
  CalendarDays,
  FileText,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useApi } from "@/lib/use-api";
import { api, type Event } from "@/lib/api";
import { PageHeader } from "@/components/ui-shared";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/app/calendar")({
  component: CalendarPage,
});

const TYPE_META: Record<string, { icon: any; cls: string; pillCls: string; label: string }> = {
  court: {
    icon: Gavel,
    cls: "bg-amber-100/80 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/40",
    pillCls: "bg-amber-500 hover:bg-amber-600 text-white dark:bg-amber-600 dark:hover:bg-amber-700",
    label: "Court hearing",
  },
  meeting: {
    icon: UsersIcon,
    cls: "bg-blue-100/80 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/40",
    pillCls: "bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-600 dark:hover:bg-blue-700",
    label: "Client meeting",
  },
  deadline: {
    icon: AlertCircle,
    cls: "bg-red-100/80 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/40",
    pillCls: "bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-700",
    label: "Critical deadline",
  },
};

function CalendarPage() {
  const { user, isClient } = useAuth();
  const { data: initialEvents, loading } = useApi(() => api.getEvents(user!), [user?.id]);
  const { data: initialCases } = useApi(
    () => api.getUsers().then((users) => api.getCases(users[0])),
    [],
  );
  const { data: initialClients } = useApi(() => api.getClients(), []);

  const [events, setEvents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 5, 2)); // Start at June 2, 2026 for rich mock data
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(2026, 5, 1)); // June 2026
  const [currentView, setCurrentView] = useState<"month" | "week" | "day" | "list">("month");

  // Event Filter Checkboxes
  const [filterTypes, setFilterTypes] = useState({
    court: true,
    meeting: true,
    deadline: true,
  });

  // Modal States
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  // New Event Form State
  const [formData, setFormData] = useState({
    title: "",
    type: "meeting",
    date: "2026-06-02",
    time: "10:00",
    caseId: "",
    reminder: "1h",
    notes: "",
  });

  // Sync state with fetched events
  useEffect(() => {
    if (initialEvents) {
      setEvents(initialEvents);
    }
  }, [initialEvents]);

  // Date math helper functions
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getStartWeekdayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const buildMonthGrid = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const startWeekday = getStartWeekdayOfMonth(year, month);

    const grid: { date: Date; isCurrentMonth: boolean }[] = [];

    // Prev Month Outside Days
    const prevYear = month === 0 ? year - 1 : year;
    const prevMonth = month === 0 ? 11 : month - 1;
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
    for (let i = startWeekday - 1; i >= 0; i--) {
      grid.push({
        date: new Date(prevYear, prevMonth, daysInPrevMonth - i),
        isCurrentMonth: false,
      });
    }

    // Current Month Days
    for (let d = 1; d <= daysInMonth; d++) {
      grid.push({
        date: new Date(year, month, d),
        isCurrentMonth: true,
      });
    }

    // Next Month Outside Days
    const totalSlots = grid.length > 35 ? 42 : 35;
    const nextYear = month === 11 ? year + 1 : year;
    const nextMonth = month === 11 ? 0 : month + 1;
    let nextDay = 1;
    while (grid.length < totalSlots) {
      grid.push({
        date: new Date(nextYear, nextMonth, nextDay++),
        isCurrentMonth: false,
      });
    }

    return grid;
  };

  const getDaysInWeek = (date: Date) => {
    const currentDay = date.getDay();
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - currentDay); // start at Sunday

    const weekDays: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      weekDays.push(d);
    }
    return weekDays;
  };

  // Filter events
  const filteredEvents = events.filter((e) => {
    const typeEnabled = filterTypes[e.type as keyof typeof filterTypes] ?? true;
    return typeEnabled;
  });

  // Check if dates match (ignoring time)
  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  // Format date string YYYY-MM-DD
  const formatDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Navigations
  const handlePrev = () => {
    if (currentView === "month") {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    } else if (currentView === "week") {
      const d = new Date(selectedDate);
      d.setDate(selectedDate.getDate() - 7);
      setSelectedDate(d);
      setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    } else {
      const d = new Date(selectedDate);
      d.setDate(selectedDate.getDate() - 1);
      setSelectedDate(d);
      setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  };

  const handleNext = () => {
    if (currentView === "month") {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    } else if (currentView === "week") {
      const d = new Date(selectedDate);
      d.setDate(selectedDate.getDate() + 7);
      setSelectedDate(d);
      setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    } else {
      const d = new Date(selectedDate);
      d.setDate(selectedDate.getDate() + 1);
      setSelectedDate(d);
      setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  };

  const handleToday = () => {
    const today = new Date(2026, 5, 2); // Synced with mock dataset center date
    setSelectedDate(today);
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const handleAddEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Event title is required");
      return;
    }

    const newEvent = {
      id: "e_" + Date.now(),
      title: formData.title.trim(),
      type: formData.type,
      date: formData.date,
      time: formData.time,
      caseId: formData.caseId || null,
      reminder: formData.reminder,
      notes: formData.notes.trim() || "No internal notes provided.",
    };

    setEvents((prev) => [...prev, newEvent]);
    setCreateOpen(false);
    setFormData({
      title: "",
      type: "meeting",
      date: formatDateString(selectedDate),
      time: "10:00",
      caseId: "",
      reminder: "1h",
      notes: "",
    });
    toast.success("Event scheduled successfully");
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    setDetailOpen(false);
    setSelectedEvent(null);
    toast.success("Event canceled successfully");
  };

  // Helper to trigger recommended action addition
  const handleAutoSchedule = (
    title: string,
    type: string,
    dateStr: string,
    timeStr: string,
    caseId: string,
  ) => {
    setFormData({
      title,
      type,
      date: dateStr,
      time: timeStr,
      caseId,
      reminder: "1d",
      notes: "AI Recommended Preparation scheduling.",
    });
    setCreateOpen(true);
  };

  const monthGrid = buildMonthGrid(currentMonth);
  const weekDays = getDaysInWeek(selectedDate);

  // Filter list events chronologically
  const sortedListEvents = [...filteredEvents].sort((a, b) => {
    const dComp = a.date.localeCompare(b.date);
    if (dComp !== 0) return dComp;
    return a.time.localeCompare(b.time);
  });

  return (
    <div className="flex flex-col h-full bg-background">
      <PageHeader
        title={isClient ? "Your Schedule" : "Firm Calendar"}
        description={
          isClient
            ? "Court dates, appointments, and critical deadlines linked to your cases."
            : "Manage firm schedule, track court trials, client hearings, and caseload deadlines."
        }
        actions={
          !isClient && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-medium">
                  <Plus className="mr-2 h-4 w-4" /> New event
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                  <DialogTitle>Schedule New Event</DialogTitle>
                  <DialogDescription>
                    Fill in details to book a hearing, meeting, or filing deadline.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddEventSubmit} className="space-y-4 pt-2">
                  <div className="space-y-1">
                    <Label htmlFor="title">Event Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g. Prep meeting with client"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="type">Event Type</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(val) => setFormData({ ...formData, type: val })}
                      >
                        <SelectTrigger id="type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="court">Court Hearing</SelectItem>
                          <SelectItem value="meeting">Client Meeting</SelectItem>
                          <SelectItem value="deadline">Filing Deadline</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="reminder">Reminder Warning</Label>
                      <Select
                        value={formData.reminder}
                        onValueChange={(val) => setFormData({ ...formData, reminder: val })}
                      >
                        <SelectTrigger id="reminder">
                          <SelectValue placeholder="Select reminder" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No reminder</SelectItem>
                          <SelectItem value="15m">15 minutes before</SelectItem>
                          <SelectItem value="1h">1 hour before</SelectItem>
                          <SelectItem value="1d">1 day before</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="date">Scheduled Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="time">Scheduled Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="caseId">Link Matter / Case</Label>
                    <Select
                      value={formData.caseId}
                      onValueChange={(val) => setFormData({ ...formData, caseId: val })}
                    >
                      <SelectTrigger id="caseId">
                        <SelectValue placeholder="Search or select case" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned (General Event)</SelectItem>
                        {initialCases?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.number} — {c.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="notes">Internal Memo</Label>
                    <Textarea
                      id="notes"
                      placeholder="Enter descriptions or agenda guidelines..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={2.5}
                    />
                  </div>

                  <DialogFooter className="pt-2">
                    <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Save Event
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )
        }
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Side Sidebar - Control Center */}
        <div className="hidden lg:flex flex-col w-[320px] border-r border-border bg-card shrink-0 p-4 space-y-5">
          {/* Mini Calendar Widget */}
          <Card className="shadow-2xs border border-border/80">
            <CardContent className="p-1">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                    setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
                  }
                }}
                className="w-full"
              />
            </CardContent>
          </Card>

          {/* Quick Category Filters */}
          <div className="space-y-2 px-1">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Caseload Categories
            </h4>
            <div className="space-y-1.5 pt-1">
              <button
                onClick={() => setFilterTypes({ ...filterTypes, court: !filterTypes.court })}
                className={`w-full flex items-center justify-between p-2 rounded-lg border text-left text-xs font-medium cursor-pointer transition-all hover:bg-muted/50 ${
                  filterTypes.court
                    ? "border-amber-200 bg-amber-50/40 text-amber-900"
                    : "border-border text-muted-foreground bg-transparent"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Gavel className="h-4 w-4 text-amber-600" /> Court Dates
                </span>
                <span
                  className={`h-2.5 w-2.5 rounded-full ${filterTypes.court ? "bg-amber-500" : "bg-muted"}`}
                />
              </button>

              <button
                onClick={() => setFilterTypes({ ...filterTypes, meeting: !filterTypes.meeting })}
                className={`w-full flex items-center justify-between p-2 rounded-lg border text-left text-xs font-medium cursor-pointer transition-all hover:bg-muted/50 ${
                  filterTypes.meeting
                    ? "border-blue-200 bg-blue-50/40 text-blue-900"
                    : "border-border text-muted-foreground bg-transparent"
                }`}
              >
                <span className="flex items-center gap-2">
                  <UsersIcon className="h-4 w-4 text-blue-600" /> Meetings
                </span>
                <span
                  className={`h-2.5 w-2.5 rounded-full ${filterTypes.meeting ? "bg-blue-500" : "bg-muted"}`}
                />
              </button>

              <button
                onClick={() => setFilterTypes({ ...filterTypes, deadline: !filterTypes.deadline })}
                className={`w-full flex items-center justify-between p-2 rounded-lg border text-left text-xs font-medium cursor-pointer transition-all hover:bg-muted/50 ${
                  filterTypes.deadline
                    ? "border-red-200 bg-red-50/40 text-red-900"
                    : "border-border text-muted-foreground bg-transparent"
                }`}
              >
                <span className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" /> Deadlines
                </span>
                <span
                  className={`h-2.5 w-2.5 rounded-full ${filterTypes.deadline ? "bg-red-500" : "bg-muted"}`}
                />
              </button>
            </div>
          </div>

          {/* AI Recommended Tasks Card */}
          {!isClient && (
            <Card className="border border-primary/20 bg-primary/5 shadow-2xs">
              <CardHeader className="p-3 pb-2 flex flex-row items-center gap-1.5 text-primary">
                <Sparkles className="h-4 w-4 animate-pulse" />
                <CardTitle className="text-xs font-bold uppercase tracking-wider m-0">
                  AI Action Prompts
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-2.5">
                <div className="p-2.5 bg-background rounded border border-primary/10 space-y-2">
                  <p className="text-[10px] leading-relaxed text-foreground/80 font-medium">
                    🔴 <strong>State v. Holloway</strong> trial starts on June 5. Pre-trial
                    preparation meeting is recommended.
                  </p>
                  <Button
                    size="sm"
                    onClick={() =>
                      handleAutoSchedule(
                        "Holloway Pre-trial Prep",
                        "meeting",
                        "2026-06-03",
                        "14:00",
                        "c4",
                      )
                    }
                    className="w-full text-[10px] h-6 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/95"
                  >
                    Schedule Prep Meeting
                  </Button>
                </div>

                <div className="p-2.5 bg-background rounded border border-primary/10 space-y-2">
                  <p className="text-[10px] leading-relaxed text-foreground/80 font-medium">
                    🟡 <strong>Trust amendment v3</strong> deadline is June 8. Client estate draft
                    consultation recommended.
                  </p>
                  <Button
                    size="sm"
                    onClick={() =>
                      handleAutoSchedule(
                        "Estate Planning Consultation",
                        "meeting",
                        "2026-06-06",
                        "10:30",
                        "c2",
                      )
                    }
                    className="w-full text-[10px] h-6 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/95"
                  >
                    Schedule Consultation
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Side Main Calendar Canvas */}
        <div className="flex-1 flex flex-col bg-card min-w-0">
          {/* Calendar Controller Header Toolbar */}
          <div className="px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-card shadow-2xs z-10">
            {/* Nav Arrows */}
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground w-[160px] select-none">
                {currentView === "month" &&
                  currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                {currentView === "week" &&
                  `Week of ${weekDays[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                {currentView === "day" &&
                  selectedDate.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                {currentView === "list" && "Caseload Timeline"}
              </h2>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 cursor-pointer"
                  onClick={handlePrev}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs cursor-pointer"
                  onClick={handleToday}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 cursor-pointer"
                  onClick={handleNext}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* View Selector Tabs */}
            <Tabs
              value={currentView}
              onValueChange={(v) => setCurrentView(v as any)}
              className="w-full sm:w-auto"
            >
              <TabsList className="grid grid-cols-4 bg-muted/40 p-1 border border-border/80 rounded-lg">
                <TabsTrigger value="month" className="text-xs py-1.5 cursor-pointer">
                  Month
                </TabsTrigger>
                <TabsTrigger value="week" className="text-xs py-1.5 cursor-pointer">
                  Week
                </TabsTrigger>
                <TabsTrigger value="day" className="text-xs py-1.5 cursor-pointer">
                  Day
                </TabsTrigger>
                <TabsTrigger value="list" className="text-xs py-1.5 cursor-pointer">
                  List
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Render Active View Container */}
          <div className="flex-1 overflow-hidden min-h-0 bg-muted/5">
            {loading && (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground bg-background">
                Loading schedule canvas...
              </div>
            )}

            {!loading && (
              <>
                {/* MONTH VIEW GRID */}
                {currentView === "month" && (
                  <div className="h-full flex flex-col min-w-[700px] overflow-auto">
                    {/* Month Days of the week headers */}
                    <div className="grid grid-cols-7 border-b border-border bg-muted/20 text-center py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <div>Sun</div>
                      <div>Mon</div>
                      <div>Tue</div>
                      <div>Wed</div>
                      <div>Thu</div>
                      <div>Fri</div>
                      <div>Sat</div>
                    </div>
                    {/* Month Grid Cell Content */}
                    <div className="grid grid-cols-7 grid-rows-6 flex-1 divide-x divide-y divide-border border-b border-border">
                      {monthGrid.map((cell, idx) => {
                        const cellDateStr = formatDateString(cell.date);
                        const dayEvents = filteredEvents.filter((e) => e.date === cellDateStr);
                        const isTodayDate = isSameDay(cell.date, new Date(2026, 5, 2)); // Mock Today June 2, 2026
                        const isSelected = isSameDay(cell.date, selectedDate);

                        return (
                          <div
                            key={idx}
                            onClick={() => setSelectedDate(cell.date)}
                            className={`p-1.5 flex flex-col min-h-[90px] transition-all hover:bg-muted/10 cursor-pointer ${
                              cell.isCurrentMonth
                                ? "bg-card text-foreground"
                                : "bg-muted/20 text-muted-foreground"
                            } ${
                              isSelected ? "ring-2 ring-primary/40 ring-inset bg-primary/2" : ""
                            }`}
                          >
                            {/* Day Number badge */}
                            <div className="flex items-center justify-between mb-1">
                              <span
                                className={`text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center ${
                                  isTodayDate
                                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                                    : "text-foreground/75"
                                }`}
                              >
                                {cell.date.getDate()}
                              </span>
                            </div>

                            {/* Event Badges list */}
                            <ScrollArea className="flex-1">
                              <div className="space-y-1">
                                {dayEvents.slice(0, 3).map((e) => {
                                  const meta = TYPE_META[e.type] ?? TYPE_META.meeting;
                                  return (
                                    <div
                                      key={e.id}
                                      onClick={(ev) => {
                                        ev.stopPropagation(); // Avoid triggering day select
                                        setSelectedEvent(e);
                                        setDetailOpen(true);
                                      }}
                                      className={`text-[9px] px-1.5 py-0.5 rounded-sm border font-medium truncate flex items-center gap-1 shadow-2xs hover:scale-[1.02] active:scale-95 transition-all ${meta.cls}`}
                                    >
                                      <span className="font-semibold tabular-nums shrink-0">
                                        {e.time}
                                      </span>
                                      <span className="truncate">{e.title}</span>
                                    </div>
                                  );
                                })}
                                {dayEvents.length > 3 && (
                                  <div className="text-[8px] font-bold text-primary px-1.5 py-0.5 text-center bg-primary/10 rounded-sm">
                                    + {dayEvents.length - 3} more
                                  </div>
                                )}
                              </div>
                            </ScrollArea>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* WEEK VIEW COLUMNS */}
                {currentView === "week" && (
                  <div className="h-full grid grid-cols-7 divide-x divide-border min-w-[700px] overflow-auto bg-card">
                    {weekDays.map((day, idx) => {
                      const dayStr = formatDateString(day);
                      const dayEvents = filteredEvents.filter((e) => e.date === dayStr);
                      const isTodayDate = isSameDay(day, new Date(2026, 5, 2));

                      return (
                        <div key={idx} className="flex flex-col h-full bg-card min-w-[100px]">
                          {/* Column Header */}
                          <div
                            className={`p-3 text-center border-b border-border space-y-0.5 ${isTodayDate ? "bg-primary/5" : "bg-muted/10"}`}
                          >
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                              {day.toLocaleDateString("en-US", { weekday: "short" })}
                            </p>
                            <p
                              className={`text-sm font-extrabold h-6 w-6 flex items-center justify-center mx-auto rounded-full ${isTodayDate ? "bg-primary text-primary-foreground" : "text-foreground"}`}
                            >
                              {day.getDate()}
                            </p>
                          </div>
                          {/* Column Event Cards Scroll */}
                          <ScrollArea className="flex-1">
                            <div className="p-2 space-y-2">
                              {dayEvents.length === 0 ? (
                                <p className="text-[9px] text-muted-foreground/60 text-center py-6">
                                  No scheduled entries.
                                </p>
                              ) : (
                                dayEvents.map((e) => {
                                  const meta = TYPE_META[e.type] ?? TYPE_META.meeting;
                                  const Icon = meta.icon;
                                  return (
                                    <div
                                      key={e.id}
                                      onClick={() => {
                                        setSelectedEvent(e);
                                        setDetailOpen(true);
                                      }}
                                      className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all hover:shadow-xs hover:scale-[1.01] flex flex-col gap-1.5 ${meta.cls}`}
                                    >
                                      <div className="flex items-center justify-between gap-1">
                                        <span className="text-[9px] font-bold flex items-center gap-1 tabular-nums">
                                          <Clock className="h-3 w-3 shrink-0" /> {e.time}
                                        </span>
                                        <Icon className="h-3 w-3 shrink-0" />
                                      </div>
                                      <p className="text-[10px] font-semibold leading-normal text-foreground truncate-2-lines">
                                        {e.title}
                                      </p>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </ScrollArea>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* DAY VIEW TIMELINE */}
                {currentView === "day" && (
                  <div className="h-full flex overflow-hidden bg-card">
                    {/* Hourly scale column */}
                    <div className="w-16 border-r border-border/80 flex flex-col py-4 select-none shrink-0 bg-muted/10">
                      {Array.from({ length: 11 }).map((_, i) => {
                        const hr = i + 8;
                        const label = hr < 12 ? `${hr} AM` : hr === 12 ? "12 PM" : `${hr - 12} PM`;
                        return (
                          <div
                            key={i}
                            className="h-20 text-[9px] font-bold text-muted-foreground text-center flex items-start justify-center pt-0.5 tabular-nums"
                          >
                            {label}
                          </div>
                        );
                      })}
                    </div>
                    {/* Events slots canvas */}
                    <ScrollArea className="flex-1 h-full relative">
                      <div className="p-4 pr-6 space-y-4">
                        {/* Selected day events list positioned logically */}
                        {filteredEvents.filter((e) => e.date === formatDateString(selectedDate))
                          .length === 0 ? (
                          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground text-sm text-center">
                            <Clock className="h-10 w-10 mb-2 opacity-30 text-muted-foreground" />
                            <p>No entries scheduled for this date.</p>
                          </div>
                        ) : (
                          filteredEvents
                            .filter((e) => e.date === formatDateString(selectedDate))
                            .sort((a, b) => a.time.localeCompare(b.time))
                            .map((e) => {
                              const meta = TYPE_META[e.type] ?? TYPE_META.meeting;
                              const Icon = meta.icon;
                              const linkedCase = initialCases?.find((c) => c.id === e.caseId);

                              return (
                                <div
                                  key={e.id}
                                  onClick={() => {
                                    setSelectedEvent(e);
                                    setDetailOpen(true);
                                  }}
                                  className={`p-4 rounded-xl border flex gap-4 cursor-pointer hover:shadow-sm transition-all hover:scale-[1.005] ${meta.cls}`}
                                >
                                  <div className="h-10 w-10 shrink-0 bg-background/60 rounded-lg flex items-center justify-center border border-border/40">
                                    <Icon className="h-5 w-5" />
                                  </div>
                                  <div className="flex-1 min-w-0 space-y-1">
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        variant="outline"
                                        className="text-[8px] tracking-wide uppercase px-1.5 py-0"
                                      >
                                        {meta.label}
                                      </Badge>
                                      <span className="text-[10px] font-bold tabular-nums text-foreground flex items-center gap-1 ml-auto">
                                        <Clock className="h-3 w-3" /> {e.time}
                                      </span>
                                    </div>
                                    <h3 className="font-bold text-foreground text-sm truncate leading-snug">
                                      {e.title}
                                    </h3>
                                    {linkedCase && (
                                      <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                                        <FileText className="h-3.5 w-3.5" /> Case:{" "}
                                        {linkedCase.number} — {linkedCase.title}
                                      </p>
                                    )}
                                    {e.notes && (
                                      <p className="text-xs text-muted-foreground/90 italic truncate mt-1">
                                        "{e.notes}"
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* LIST CHRONOLOGICAL TIMELINE VIEW */}
                {currentView === "list" && (
                  <ScrollArea className="h-full">
                    <div className="p-6 max-w-4xl mx-auto space-y-6">
                      {sortedListEvents.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground text-sm">
                          <CalendarDays className="h-12 w-12 mb-3 opacity-30 mx-auto" />
                          <p>No calendar events found matching the active filters.</p>
                        </div>
                      ) : (
                        sortedListEvents.map((e) => {
                          const meta = TYPE_META[e.type] ?? TYPE_META.meeting;
                          const Icon = meta.icon;
                          const linkedCase = initialCases?.find((c) => c.id === e.caseId);

                          return (
                            <div
                              key={e.id}
                              onClick={() => {
                                setSelectedEvent(e);
                                setDetailOpen(true);
                              }}
                              className={`p-4 rounded-xl border bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer hover:shadow-xs transition-all hover:bg-muted/30 border-l-4 border-l-primary`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 border ${meta.cls}`}
                                >
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                  <h3 className="text-sm font-bold text-foreground truncate leading-snug">
                                    {e.title}
                                  </h3>
                                  <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground font-semibold">
                                    <span className="text-[10px] tracking-wider uppercase text-primary">
                                      {meta.label}
                                    </span>
                                    {linkedCase && (
                                      <span className="flex items-center gap-1">
                                        <FileText className="h-3.5 w-3.5" /> {linkedCase.number}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="shrink-0 flex items-center gap-2 self-end sm:self-center bg-secondary/80 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold tabular-nums text-foreground">
                                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>
                                  {new Date(e.date).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </span>
                                <span className="text-muted-foreground font-medium">•</span>
                                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>{e.time}</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* EVENT DETAILED DIALOG */}
      {selectedEvent && (
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="sm:max-w-[440px]">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1.5">
                <Badge
                  variant="outline"
                  className={`text-[9px] font-bold uppercase tracking-wider py-0.5 px-2 ${TYPE_META[selectedEvent.type]?.cls}`}
                >
                  {TYPE_META[selectedEvent.type]?.label}
                </Badge>
                {selectedEvent.reminder !== "none" && (
                  <Badge
                    variant="outline"
                    className="text-[9px] font-bold uppercase tracking-wider py-0.5 px-2 bg-success/15 text-success border-success/20"
                  >
                    Reminder Active
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-base font-bold text-foreground leading-snug">
                {selectedEvent.title}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-3 text-sm">
              {/* Date / Time */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/80 bg-muted/20">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4.5 w-4.5 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                      Scheduled Date
                    </p>
                    <p className="font-semibold text-foreground">
                      {new Date(selectedEvent.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="h-8 w-[1px] bg-border" />
                <div className="flex items-center gap-2 pr-4">
                  <Clock className="h-4.5 w-4.5 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                      Scheduled Time
                    </p>
                    <p className="font-semibold text-foreground tabular-nums">
                      {selectedEvent.time}
                    </p>
                  </div>
                </div>
              </div>

              {/* Linked Case */}
              {selectedEvent.caseId && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Linked Case Matter
                  </p>
                  {(() => {
                    const matchedCase = initialCases?.find((c) => c.id === selectedEvent.caseId);
                    return matchedCase ? (
                      <div className="p-3 rounded-lg border border-border/60 flex items-start gap-2.5">
                        <FileText className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-foreground text-xs">{matchedCase.title}</p>
                          <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                            Case Number: {matchedCase.number} • Lead: {matchedCase.lead}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground font-medium italic">
                        Case matter not found in active records.
                      </p>
                    );
                  })()}
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Internal Instructions & Agenda
                </p>
                <div className="p-3 rounded-lg border bg-muted/10 italic text-xs text-foreground/80 leading-relaxed max-h-32 overflow-y-auto">
                  "{selectedEvent.notes || "No additional guidelines or memos were documented."}"
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 flex flex-row items-center justify-between sm:justify-between gap-2 border-t border-border/60">
              {!isClient ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                  className="cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/10 text-xs py-1.5 h-8 shrink-0 font-medium"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Cancel Event
                </Button>
              ) : (
                <div />
              )}
              <Button
                type="button"
                onClick={() => setDetailOpen(false)}
                className="text-xs h-8 px-4 bg-primary text-primary-foreground hover:bg-primary/95"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
