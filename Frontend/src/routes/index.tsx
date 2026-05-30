import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Scale, ShieldCheck, MessageSquareCode, CalendarDays, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (user) {
      navigate({ to: "/app" });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-900/10 blur-[120px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="border-b border-slate-900/80 bg-slate-950/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 select-none">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-widest text-slate-100 uppercase">
                Vance &amp; Hale
              </p>
              <p className="text-[10px] text-slate-400 tracking-wider font-semibold uppercase">
                Attorneys at Law
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate({ to: "/login" })}
              className="text-xs font-semibold text-slate-300 hover:text-slate-100 transition-colors"
            >
              Sign In
            </button>
            <Button
              onClick={() => navigate({ to: "/signup" })}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold px-4 h-9"
            >
              Create Account
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 md:py-24 relative z-10 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-500 text-[10px] tracking-widest uppercase font-bold mb-6">
          <ShieldCheck className="h-3.5 w-3.5" /> SECURE LEGAL PORTAL
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-white max-w-4xl leading-[1.15] font-serif">
          State-of-the-Art Advocacy.
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-300">
            Unified Client Practice Management.
          </span>
        </h1>

        <p className="mt-6 text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed">
          Welcome to the Vance &amp; Hale legal platform. Access real-time case analytics, securely
          review and sign legal pleadings on our multi-page reader desk, exchange encrypted
          communications, and manage trust accounts.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Button
            size="lg"
            onClick={() => navigate({ to: "/signup" })}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-bold px-8 h-12 shadow-lg shadow-amber-500/10 cursor-pointer"
          >
            Register Client Portal
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate({ to: "/login" })}
            className="border-slate-800 hover:bg-slate-900 text-slate-300 hover:text-white text-sm font-bold px-8 h-12 cursor-pointer"
          >
            Firm Staff Sign In
          </Button>
        </div>

        {/* Feature Grid */}
        <section className="mt-20 md:mt-32 grid gap-6 sm:grid-cols-3 text-left w-full border-t border-slate-900/60 pt-16">
          <div className="bg-slate-950/40 border border-slate-900 p-6 rounded-xl hover:border-slate-800 transition-colors">
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/10 mb-4">
              <FileCheck className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
              Dynamic Document Vault
            </h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Review pleading briefs on simulated A4 paper sheets, authorize filings with legally
              compliant electronic signatures, and transfer files via our drag-and-drop portal.
            </p>
          </div>

          <div className="bg-slate-950/40 border border-slate-900 p-6 rounded-xl hover:border-slate-800 transition-colors">
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/10 mb-4">
              <MessageSquareCode className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
              Encrypted Channels
            </h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Message your senior associates, paralegals, or clients directly inside secure,
              real-time consultation feeds with full notification delivery and updates.
            </p>
          </div>

          <div className="bg-slate-950/40 border border-slate-900 p-6 rounded-xl hover:border-slate-800 transition-colors">
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 mb-4">
              <CalendarDays className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
              Caseload Calendar
            </h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Track court deadlines, deposition timings, and scheduled mediation events.
              Auto-resolve conflict conflicts utilizing real-time date filters.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900/60 bg-slate-950/80 py-8 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Vance &amp; Hale LLP. All rights reserved.</p>
        <p className="mt-1 text-[10px] text-slate-600 uppercase tracking-wider font-semibold">
          Confidential Enterprise Practice Management Portal
        </p>
      </footer>
    </div>
  );
}
