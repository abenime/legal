import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useRef, useEffect } from "react";
import { Send, Search, PlusCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useApi } from "@/lib/use-api";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui-shared";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/app/messages")({
  component: MessagesPage,
});

function MessagesPage() {
  const { user } = useAuth();
  const { data: messages } = useApi(() => api.getMessages(user!), [user?.id]);
  const [activeCase, setActiveCase] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [localMessages, setLocalMessages] = useState<NonNullable<typeof messages>>([]);

  const threads = useMemo(() => {
    const map = new Map<string, NonNullable<typeof messages>>();
    const allMessages = [...(messages ?? []), ...localMessages];

    allMessages.forEach((m) => {
      const arr = map.get(m.caseId) ?? [];
      arr.push(m);
      map.set(m.caseId, arr);
    });

    // Sort messages in each thread by date
    map.forEach((arr) => arr.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()));

    return Array.from(map.entries());
  }, [messages, localMessages]);

  const selected = activeCase ?? threads[0]?.[0] ?? null;
  const thread = threads.find(([k]) => k === selected)?.[1] ?? [];
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thread]);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <PageHeader
        title="Messages"
        description="Secure communication between your legal team and clients."
        actions={
          <Dialog open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Message
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>New Message</DialogTitle>
                <DialogDescription>
                  Start a new conversation with your legal team.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Input placeholder="Subject / Case Number" />
                <Input placeholder="Type your message..." className="h-20" />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewMessageOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsNewMessageOpen(false)}>Send Message</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="flex flex-1 overflow-hidden">
        {/* Threads list */}
        <div className="hidden w-72 shrink-0 flex-col border-r border-border bg-card md:flex">
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search threads…" className="h-9 pl-9" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {threads.map(([caseId, msgs]) => {
              const last = msgs![msgs!.length - 1];
              const isActive = selected === caseId;
              const unreadCount = msgs!.filter((m) => !m.read && m.from !== user?.id).length;

              return (
                <button
                  key={caseId}
                  onClick={() => setActiveCase(caseId)}
                  className={`flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors relative ${
                    isActive ? "bg-secondary" : "hover:bg-secondary/50"
                  }`}
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                      {last.fromName
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-center">
                      <p
                        className={`truncate text-sm font-medium ${unreadCount > 0 ? "text-foreground font-bold" : "text-foreground"}`}
                      >
                        Case {caseId}
                      </p>
                      {unreadCount > 0 && (
                        <Badge
                          variant="default"
                          className="h-5 w-5 rounded-full flex items-center justify-center p-0 text-[10px]"
                        >
                          {unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p
                      className={`truncate text-xs ${unreadCount > 0 ? "text-foreground font-semibold" : "text-muted-foreground"}`}
                    >
                      {last.body}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Conversation */}
        <div className="flex flex-1 flex-col bg-background">
          <div className="border-b border-border bg-card px-6 py-4">
            <p className="text-sm font-semibold text-foreground">Conversation · Case {selected}</p>
            <p className="text-xs text-muted-foreground">End-to-end encrypted</p>
          </div>
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-6 flex flex-col">
            {thread.map((m) => {
              const mine = m.from === user!.id;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className="flex flex-col gap-1 max-w-[70%]">
                    {!mine && (
                      <span className="text-xs font-semibold text-muted-foreground ml-1">
                        {m.fromName}
                      </span>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                        mine
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "border border-border bg-card text-foreground rounded-tl-sm"
                      }`}
                    >
                      <p>{m.body}</p>
                    </div>
                    <div
                      className={`flex items-center gap-1 mt-0.5 mx-1 ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(m.at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="border-t border-border bg-card p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!draft.trim() || !selected) return;

                const newMessage = {
                  id: `local-${Date.now()}`,
                  body: draft,
                  caseId: selected,
                  from: user!.id,
                  fromName: user!.name,
                  to: "u2", // Simulating send to lead attorney
                  at: new Date().toISOString(),
                  read: true,
                };

                setLocalMessages((prev) => [...prev, newMessage]);
                setDraft("");
              }}
              className="flex gap-2"
            >
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message…"
                className="flex-1"
              />
              <Button type="submit" disabled={!draft.trim() || !selected}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
