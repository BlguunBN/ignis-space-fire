"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authClient } from "../../lib/auth-client";
import { useAuth } from "../../components/AuthProvider";
import { saveResearcherItem } from "../../lib/researcher-items";
import {
  Flame,
  ArrowLeft,
  LogOut,
  User,
  StickyNote,
  Network,
  FileText,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Download,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

type Item = { id: string; kind: string; title: string; content: unknown; created_at: string };

export default function ResearcherWorkspace() {
  const { session, loading } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [note, setNote] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"info" | "success" | "error">("info");
  const [selected, setSelected] = useState<Item | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "paper" | "note" | "whiteboard">("all");

  async function load() {
    if (!authClient) return;
    const { data, error } = await authClient
      .from("researcher_items")
      .select("id,kind,title,content,created_at")
      .order("created_at", { ascending: false });
    if (error) {
      setMessage("Could not load your saved research repository.");
      setMessageType("error");
    } else {
      setItems(data || []);
    }
  }

  useEffect(() => {
    if (session) {
      setName(session.user.user_metadata?.full_name || "");
      void load();
    } else {
      setItems([]);
    }
  }, [session?.user.id]);

  async function saveNote() {
    if (!note.trim()) return;
    try {
      await saveResearcherItem("note", note.trim().slice(0, 80), { text: note.trim() });
      setNote("");
      setMessage("Research note saved to your secure dossier.");
      setMessageType("success");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save note.");
      setMessageType("error");
    }
  }

  async function importLocalBoard() {
    try {
      const raw = localStorage.getItem("ignis_whiteboard_state");
      if (!raw) {
        setMessage("No locally cached evidence tree was detected in this browser session.");
        setMessageType("info");
        return;
      }
      const board = JSON.parse(raw);
      if (!Array.isArray(board.nodes) || !Array.isArray(board.edges)) {
        throw new Error("The locally saved evidence graph contains invalid node structure.");
      }
      await saveResearcherItem("whiteboard", "Imported Local Evidence Tree", board);
      setMessage("Local evidence tree successfully synced to your remote researcher account.");
      setMessageType("success");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not import the evidence board.");
      setMessageType("error");
    }
  }

  async function updateProfile() {
    if (!authClient) return;
    const { error } = await authClient.auth.updateUser({
      data: { full_name: name.trim() },
    });
    if (error) {
      setMessage("Could not update profile metadata.");
      setMessageType("error");
    } else {
      setMessage("Researcher profile updated.");
      setMessageType("success");
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Permanently remove this saved research item?")) return;
    const { error } = await authClient!.from("researcher_items").delete().eq("id", id);
    if (error) {
      setMessage("Could not delete item.");
      setMessageType("error");
    } else {
      setSelected(null);
      setMessage("Item removed.");
      setMessageType("info");
      await load();
    }
  }

  async function deleteAccount() {
    if (
      window.prompt(
        "Type DELETE to permanently erase your account, private research notes, and pending submissions. Published evidence remains preserved in the public library."
      ) !== "DELETE"
    ) {
      return;
    }
    const { error } = await authClient!.rpc("delete_researcher_account");
    if (error) {
      setMessage("Could not complete account deletion. Please try again or contact mission control.");
      setMessageType("error");
      return;
    }
    await authClient!.auth.signOut();
    window.location.assign("/");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0e1116] p-8 text-slate-100">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          <span className="text-sm text-slate-400">Loading researcher workspace...</span>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0e1116] p-8 text-slate-100">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
            <Flame className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-white">Researcher Access Required</h1>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to access your personal workspace, saved flight dossiers, and private whiteboard evidence trees.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/auth"
              className="rounded-xl bg-amber-400 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
            >
              Sign In or Create Account
            </Link>
            <Link
              href="/"
              className="text-xs text-slate-400 underline hover:text-slate-200"
            >
              Explore Public Research Library
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const filteredItems = items.filter((item) => activeTab === "all" || item.kind === activeTab);

  return (
    <main className="min-h-screen bg-[#0e1116] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Navigation Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="space-y-1">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400/90 transition hover:text-amber-300 hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Return to Research Library
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Researcher Workspace
                </h1>
                <p className="text-xs text-slate-400">
                  Mission Investigator Dossier & Private Research Archive
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <div className="text-xs font-semibold text-slate-200">
                {name || session.user.email?.split("@")[0]}
              </div>
              <div className="text-[11px] text-slate-400">{session.user.email}</div>
            </div>
            <button
              onClick={async () => {
                await authClient?.auth.signOut();
                window.location.assign("/");
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div
            className={`flex items-center gap-2.5 rounded-xl border p-3.5 text-xs ${
              messageType === "error"
                ? "border-rose-500/20 bg-rose-500/10 text-rose-300"
                : messageType === "success"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                : "border-amber-500/20 bg-amber-500/10 text-amber-300"
            }`}
            role={messageType === "error" ? "alert" : "status"}
          >
            {messageType === "error" ? (
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            )}
            <span>{message}</span>
          </div>
        )}

        {/* Profile Card & Quick Note Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Card */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2 font-semibold text-white">
              <User className="h-4 w-4 text-amber-400" />
              <h2>Investigator Profile</h2>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Personalized metadata attached to your research findings and reviews.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs text-slate-400">Full Display Name</label>
                <div className="mt-1 flex gap-2">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dr. Alex Mercer"
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 placeholder-slate-600 focus:border-amber-400 focus:outline-none"
                  />
                  <button
                    onClick={updateProfile}
                    className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3.5 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-400/20"
                  >
                    Save
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1 text-xs text-slate-400">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Verified Investigator Credentials</span>
              </div>
            </div>
          </section>

          {/* New Research Note */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2 font-semibold text-white">
              <StickyNote className="h-4 w-4 text-amber-400" />
              <h2>Quick Telemetry / Observation Note</h2>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Record physical hypotheses, flight observations, or test anomalies.
            </p>
            <div className="mt-3 space-y-2">
              <textarea
                aria-label="New research note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Observed anomalous soot extinction boundary at 24% O2, 70 kPa..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 placeholder-slate-600 focus:border-amber-400 focus:outline-none"
                rows={3}
              />
              <div className="flex justify-end">
                <button
                  onClick={saveNote}
                  className="rounded-xl bg-amber-400 px-4 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-amber-300"
                >
                  Save to Dossier
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Saved Research Section */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Private Research Repository</h2>
              <p className="text-xs text-slate-400">
                Papers, briefs, notes, and evidence trees synced to your account.
              </p>
            </div>
            <button
              onClick={importLocalBoard}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-medium text-amber-400 transition hover:border-amber-400/40 hover:bg-slate-800"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Import Device Evidence Tree</span>
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="mt-4 flex flex-wrap gap-2">
            {(["all", "paper", "note", "whiteboard"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-3 py-1 text-xs font-medium capitalize transition ${
                  activeTab === tab
                    ? "bg-amber-400 text-slate-950"
                    : "bg-slate-950 text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab === "all" ? `All Items (${items.length})` : `${tab}s (${items.filter((i) => i.kind === tab).length})`}
              </button>
            ))}
          </div>

          {/* Items List */}
          {filteredItems.length === 0 ? (
            <div className="my-8 text-center text-xs text-slate-500">
              No {activeTab !== "all" ? activeTab : "saved"} items in your repository yet.
              Explore the library and click "Save to Account" on any study or board.
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-slate-800/60">
              {filteredItems.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 transition hover:bg-slate-800/20"
                >
                  <button
                    className="flex flex-1 items-start gap-3 text-left"
                    onClick={() => setSelected(item)}
                  >
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-amber-400">
                      {item.kind === "whiteboard" ? (
                        <Network className="h-4 w-4" />
                      ) : item.kind === "note" ? (
                        <StickyNote className="h-4 w-4" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-200 hover:text-white">
                        {item.title}
                      </span>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="uppercase">{item.kind}</span>
                        <span>•</span>
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center gap-2">
                    {item.kind === "whiteboard" && (
                      <button
                        onClick={() => {
                          sessionStorage.setItem(`ignis_open_board_${session.user.id}`, item.id);
                          window.location.assign("/?openBoard=1");
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-400/30 px-2.5 py-1 text-xs text-amber-300 hover:bg-amber-400/10"
                      >
                        <ExternalLink className="h-3 w-3" /> Open in Whiteboard
                      </button>
                    )}
                    <button
                      onClick={() => remove(item.id)}
                      className="rounded-lg p-1 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400"
                      title="Delete item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Item Detail Inspector */}
          {selected && (
            <div className="mt-6 rounded-xl border border-slate-700 bg-slate-950 p-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-sm font-semibold text-white">{selected.title}</h3>
                <button
                  onClick={() => setSelected(null)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Close
                </button>
              </div>
              <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-900 p-3 text-xs text-slate-300 font-mono">
                {typeof selected.content === "object" && selected.content && "text" in selected.content
                  ? String((selected.content as any).text)
                  : JSON.stringify(selected.content, null, 2)}
              </pre>
            </div>
          )}
        </section>

        {/* Danger Zone: Account Deletion */}
        <section className="rounded-2xl border border-rose-950/40 bg-rose-950/10 p-5 text-xs text-slate-400">
          <h2 className="font-semibold text-rose-300">Account Deletion & Data Privacy</h2>
          <p className="mt-1">
            Permanently delete your investigator credentials, private research notes, and pending paper submissions. Published NASA flight experiments remain in the shared database.
          </p>
          <button
            onClick={deleteAccount}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 px-3 py-1.5 font-medium text-rose-300 transition hover:bg-rose-500/20"
          >
            <Trash2 className="h-3.5 w-3.5" /> Permanently Delete Account
          </button>
        </section>
      </div>
    </main>
  );
}
