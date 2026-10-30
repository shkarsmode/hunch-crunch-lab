"use client";

import { useCallback, useEffect, useState } from "react";
import Crunchy from "@/components/Crunchy";
import { Locked, useAccess } from "@/components/access/AccessProvider";
import { SEED_IDEAS, STATUS, type Idea, type IdeaStatus } from "@/data/ideas";
import { shortUrl } from "@/lib/site";

const ORDER: IdeaStatus[] = ["heard", "crunching", "rendering", "live"];

export default function IdeasClient() {
  const { flag, user } = useAccess();
  const [ideas, setIdeas] = useState<Idea[]>(SEED_IDEAS);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [msg, setMsg] = useState<{ text: string; good?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    () =>
      fetch("/api/ideas")
        .then((r) => (r.ok ? r.json() : null))
        .then((j: { ideas: Idea[] } | null) => j && setIdeas([...j.ideas, ...SEED_IDEAS]))
        .catch(() => {}),
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/ideas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, details }) });
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      if (r.ok) {
        setTitle("");
        setDetails("");
        setMsg({ text: "Heard! Crunchy wrote it down. 👂", good: true });
        load();
      } else setMsg({ text: j.error ?? "Could not send it" });
    } catch {
      setMsg({ text: "Could not send it" });
    }
    setBusy(false);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 pt-8 sm:pt-14">
      <div className="flex items-end gap-4">
        <div className="flex-1 animate-rise">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-mint">You ask, we crunch</p>
          <h1 className="display mt-2 text-5xl font-black leading-[0.95] sm:text-6xl">Ideas board</h1>
          <p className="mt-3 max-w-lg text-mist">Real ideas from real viewers, and where each one is right now. The good ones become videos, with your name on them.</p>
        </div>
        <Crunchy size={88} mood="squint" className="hidden animate-float sm:block" />
      </div>

      <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto">
        {ORDER.map((s, i) => (
          <span key={s} className="flex shrink-0 items-center gap-1.5 rounded-full bg-navy-950/50 px-3 py-1.5 text-xs font-bold ring-1 ring-edge/25">
            {STATUS[s].emoji} <span style={{ color: STATUS[s].color }}>{STATUS[s].label}</span>
            {i < ORDER.length - 1 && <span className="ml-1 text-mist">→</span>}
          </span>
        ))}
      </div>

      <div className="mt-6 grid gap-3">
        {ideas.map((idea) => {
          const s = STATUS[idea.status] ?? STATUS.heard;
          return (
            <article key={idea.id} className="glass flex items-start gap-3 rounded-2xl p-4 animate-rise">
              <span className="text-2xl" aria-hidden>{s.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="font-bold">{idea.title}</p>
                <p className="mt-0.5 text-sm text-mist">
                  {idea.by} · <span className="font-bold" style={{ color: s.color }}>{s.label}</span>
                  {idea.video && (
                    <>
                      {" · "}
                      <a href={shortUrl(idea.video)} target="_blank" rel="noreferrer" className="font-bold text-coral hover:underline">Watch</a>
                    </>
                  )}
                </p>
                {idea.note && <p className="mt-1 text-sm text-mist">{idea.note}</p>}
              </div>
            </article>
          );
        })}
      </div>

      {flag("ideas.submit") && (
        <section className="pt-14">
          <h2 className="display text-2xl font-black">Send an idea</h2>
          <p className="mt-1 text-sm text-mist">Supporters can send up to three ideas a day. We read every one.</p>
          <Locked label="Sending ideas" className="mt-4">
            <form onSubmit={send} className="glass grid gap-3 rounded-3xl p-5">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 120))}
                placeholder="Your question, like “How many…?” or “Which one wins?”"
                className="rounded-xl bg-navy-950/55 px-4 py-3 outline-none ring-1 ring-edge/25 focus:ring-mint/60"
                aria-label="Idea"
                required
                minLength={6}
              />
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value.slice(0, 600))}
                placeholder="Anything else? (optional)"
                rows={3}
                className="resize-none rounded-xl bg-navy-950/55 px-4 py-3 outline-none ring-1 ring-edge/25 focus:ring-mint/60"
                aria-label="Details"
              />
              <div className="flex items-center gap-3">
                <button type="submit" disabled={busy || !user} className="rounded-xl bg-mint px-5 py-3 font-black text-navy-950 transition active:scale-95 disabled:opacity-50">
                  {busy ? "Sending…" : "Send it"}
                </button>
                {msg && <p className={`text-sm font-bold ${msg.good ? "text-mint" : "text-coral"}`}>{msg.text}</p>}
              </div>
            </form>
          </Locked>
        </section>
      )}
    </div>
  );
}
