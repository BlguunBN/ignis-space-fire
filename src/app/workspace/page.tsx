"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authClient } from "../../lib/auth-client";
import { useAuth } from "../../components/AuthProvider";
import { saveResearcherItem } from "../../lib/researcher-items";

type Item = { id: string; kind: string; title: string; content: unknown; created_at: string };

export default function ResearcherWorkspace() {
  const { session, loading } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [note, setNote] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<Item | null>(null);

  async function load() {
    if (!authClient) return;
    const { data, error } = await authClient.from("researcher_items").select("id,kind,title,content,created_at").order("created_at", { ascending: false });
    if (error) setMessage("Could not load your saved research. The workspace database may not be set up yet.");
    else setItems(data || []);
  }
  useEffect(() => { if (session) { setName(session.user.user_metadata?.full_name || ""); void load(); } else setItems([]); }, [session?.user.id]);

  async function saveNote() {
    if (!note.trim()) return;
    try { await saveResearcherItem("note", note.trim().slice(0, 80), { text: note.trim() }); setNote(""); setMessage("Note saved."); await load(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not save note."); }
  }
  async function importLocalBoard() {
    try {
      const raw = localStorage.getItem("ignis_whiteboard_state");
      if (!raw) { setMessage("No locally saved evidence tree was found on this device."); return; }
      const board = JSON.parse(raw);
      if (!Array.isArray(board.nodes) || !Array.isArray(board.edges)) throw new Error("The locally saved board is not valid.");
      await saveResearcherItem("whiteboard", "Imported local evidence tree", board);
      setMessage("Local evidence tree copied to your account. The original remains on this device.");
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not import the board."); }
  }
  async function updateProfile() {
    const { error } = await authClient!.auth.updateUser({ data: { full_name: name.trim() } });
    setMessage(error ? "Could not update profile." : "Profile updated.");
  }
  async function remove(id: string) {
    if (!window.confirm("Delete this saved item? This cannot be undone.")) return;
    const { error } = await authClient!.from("researcher_items").delete().eq("id", id);
    if (error) setMessage("Could not delete item."); else { setSelected(null); await load(); }
  }
  async function deleteAccount() {
    if (window.prompt("Type DELETE to permanently delete your account, saved research, and pending submissions. Published evidence remains in the shared library.") !== "DELETE") return;
    const { error } = await authClient!.rpc("delete_researcher_account");
    if (error) { setMessage("Could not delete your account. Please try again or contact the administrator."); return; }
    await authClient!.auth.signOut();
    window.location.assign("/");
  }
  if (loading) return <main className="p-8 text-slate-100">Loading account…</main>;
  if (!session) return <main className="min-h-screen bg-[#0e1116] p-8 text-slate-100"><h1 className="text-2xl">Your research workspace</h1><p className="mt-4">Sign in to access your private work.</p><Link href="/auth" className="mt-4 inline-block text-amber-400 underline">Sign in or create an account</Link><p className="mt-4"><Link href="/" className="underline">Explore the public library</Link></p></main>;
  return <main className="min-h-screen bg-[#0e1116] px-4 py-8 text-slate-100"><div className="mx-auto max-w-4xl">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><Link href="/" className="text-sm text-amber-400">← Research library</Link><h1 className="mt-3 text-2xl font-semibold">Your research workspace</h1><p className="text-sm text-slate-400">{session.user.email}</p></div><button onClick={async () => { await authClient?.auth.signOut(); window.location.assign("/"); }} className="rounded-lg border border-slate-600 px-4 py-2">Sign out</button></div>
    <section className="mt-8 rounded-xl border border-slate-700 p-5"><h2 className="font-semibold">Researcher profile</h2><label className="mt-3 block text-sm">Display name<input value={name} onChange={e => setName(e.target.value)} className="ml-2 rounded border border-slate-600 bg-slate-950 px-2 py-1" /></label><button onClick={updateProfile} className="mt-3 text-sm text-amber-400 underline">Save profile</button></section>
    <section className="mt-6 rounded-xl border border-slate-700 p-5"><h2 className="font-semibold">Research note</h2><textarea aria-label="New research note" value={note} onChange={e => setNote(e.target.value)} className="mt-3 w-full rounded border border-slate-600 bg-slate-950 p-3" rows={3} /><button onClick={saveNote} className="rounded bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950">Save note</button></section>
    {message && <p role="status" className="mt-4 text-sm text-amber-200">{message}</p>}
    <section className="mt-6"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Saved research</h2><button onClick={importLocalBoard} className="text-sm text-amber-400 underline">Import a board from this device</button></div>{items.length === 0 ? <p className="mt-3 text-slate-400">No saved items yet. Save a paper, brief, board, or note to see it here.</p> : <ul className="mt-3 space-y-2">{items.map(item => <li key={item.id} className="flex items-center justify-between gap-4 rounded-lg border border-slate-700 p-3"><button className="text-left" onClick={() => setSelected(item)}><span className="text-xs uppercase text-slate-400">{item.kind}</span><span className="block">{item.title}</span></button><button className="text-sm text-slate-400 underline" onClick={() => remove(item.id)}>Delete</button></li>)}</ul>}</section>
    {selected && <section className="mt-5 rounded-xl border border-slate-700 p-4"><div className="flex justify-between"><h2>{selected.title}</h2><button onClick={() => setSelected(null)}>Close</button></div>{selected.kind === "whiteboard" && <button className="mt-3 text-amber-400 underline" onClick={() => { sessionStorage.setItem(`ignis_open_board_${session.user.id}`, selected.id); window.location.assign("/?openBoard=1"); }}>Open in whiteboard</button>}<pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap text-sm text-slate-300">{typeof selected.content === "object" && selected.content && "text" in selected.content ? String(selected.content.text) : JSON.stringify(selected.content, null, 2)}</pre></section>}
    <section className="mt-10 border-t border-slate-700 pt-5"><h2 className="font-semibold">Account deletion</h2><p className="mt-2 text-sm text-slate-400">Permanently delete your account, saved items and pending submissions. Published evidence remains in the shared library.</p><button onClick={deleteAccount} className="mt-3 text-sm text-rose-300 underline">Delete account</button></section>
  </div></main>;
}
