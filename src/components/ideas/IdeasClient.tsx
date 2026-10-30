"use client";

import { useCallback, useEffect, useState } from "react";
import Crunchy from "@/components/Crunchy";
import { Locked, useAccess } from "@/components/access/AccessProvider";
import { Icon } from "@/components/ui/icons";
import { SectionLabel, btn } from "@/components/ui/kit";
import { SEED_IDEAS, STATUS, type Idea, type IdeaStatus } from "@/data/ideas";
import { shortUrl } from "@/lib/site";

const ORDER: IdeaStatus[] = ["heard", "crunching", "rendering", "live"];
const FIELD = "w-full rounded-xl border border-hair-strong bg-navy-900 px-4 py-3 text-[15px] outline-none transition placeholder:text-ink/30 focus:border-gold/60";

export default function IdeasClient() {
  const { flag, user } = useAccess();
  const [ideas, setIdeas] = useState<Idea[]>(SEED_IDEAS);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [msg, setMsg] = useState<{ text: string; good?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<IdeaStatus | "all">("all");

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
        setMsg({ text: "Heard! Crunchy wrote it down.", good: true });
        load();
      } else setMsg({ text: j.error ?? "Could not send it" });
    } catch {
      setMsg({ text: "Could not send it" });
    }
    setBusy(false);
  };

  const count = (s: IdeaStatus) => ideas.filter((i) => i.status === s).length;
  const shown = filter === "all" ? ideas : ideas.filter((i) => i.status === filter);

  return (
    <div className="mx-auto max-w-4xl pt-6 lg:px-6 lg:pt-14">
      <div className="enter flex items-end gap-4 px-4 lg:px-0">
        <div className="flex-1">
          <SectionLabel title="You ask, we crunch" />
          <h1 className="headline mt-3 text-[44px] leading-[0.98] sm:text-[56px]">Ideas board</h1>
          <p className="mt-3 max-w-[44ch] text-[15px] leading-relaxed text-ink/55">Real ideas from real viewers, and where each one is right now. The good ones become videos, with your name on them.</p>
        </div>
        <Crunchy size={76} mood="squint" shadow={false} className="hidden sm:block" />
      </div>

      <div className="no-scrollbar mt-6 flex gap-1.5 overflow-x-auto px-4 lg:px-0">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 font-mono text-[11px] tracking-[0.06em] transition ${filter === "all" ? "bg-ink text-[#0B0D12]" : "border border-hair-strong text-ink/55"}`}
        >
          ALL <span className="opacity-50">{ideas.length}</span>
        </button>
        {ORDER.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 font-mono text-[11px] tracking-[0.06em] transition ${filter === s ? "bg-ink text-[#0B0D12]" : "border border-hair-strong text-ink/55"}`}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS[s].color }} />
            {STATUS[s].label.toUpperCase()} <span className="opacity-50">{count(s)}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 divide-y divide-hair border-y border-hair lg:rounded-2xl lg:border">
        {shown.map((idea, i) => {
          const s = STATUS[idea.status] ?? STATUS.heard;
          return (
            <article key={idea.id} className="enter px-4 py-4 lg:px-5" style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}>
              <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.08em]">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
                <span style={{ color: s.color }}>{s.label.toUpperCase()}</span>
                <span className="truncate text-ink/30">{idea.by}</span>
                {idea.video && (
                  <a href={shortUrl(idea.video)} target="_blank" rel="noreferrer" className="ml-auto shrink-0 text-ink/45 transition hover:text-ink">
                    WATCH ↗
                  </a>
                )}
              </div>
              <p className="mt-1.5 text-[16px] font-medium leading-snug">{idea.title}</p>
              {idea.note && <p className="mt-1 text-[14px] text-ink/50">{idea.note}</p>}
            </article>
          );
        })}
        {shown.length === 0 && <p className="px-4 py-6 text-[14px] text-ink/45">Nothing here yet.</p>}
      </div>

      {flag("ideas.submit") && (
        <section className="px-4 pt-14 lg:px-0">
          <SectionLabel n="01" title="Send an idea" right="SUPPORTERS · 3 A DAY" className="pb-3" />
          <Locked label="Sending ideas">
            <form onSubmit={send} className="grid gap-2.5 rounded-2xl border border-hair bg-navy-850 p-4">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 120))}
                placeholder="Your question, like “How many…?” or “Which one wins?”"
                className={FIELD}
                aria-label="Idea"
                required
                minLength={6}
              />
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value.slice(0, 600))}
                placeholder="Anything else? (optional)"
                rows={3}
                className={`${FIELD} resize-none`}
                aria-label="Details"
              />
              <div className="flex items-center gap-3">
                <button type="submit" disabled={busy || !user} className={btn("primary", "md")}>
                  {busy ? "Sending…" : "Send it"} <Icon.Arrow size={16} />
                </button>
                <span className="font-mono text-[10px] tracking-[0.08em] text-ink/35">{title.length}/120</span>
                {msg && <p className={`ml-auto text-[13px] ${msg.good ? "text-mint" : "text-coral"}`}>{msg.text}</p>}
              </div>
            </form>
          </Locked>
        </section>
      )}
    </div>
  );
}
