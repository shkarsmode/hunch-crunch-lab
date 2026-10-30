"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Crunchy from "@/components/Crunchy";
import { useAccess } from "@/components/access/AccessProvider";
import { FLAG_LABELS } from "@/lib/flags";

type Visit = { day: string; path: string; country: string; device: string; source: string; n: number };
type User = { id: string; email: string | null; name: string | null; role: string; supporter_until: string | null; supporter_months: number; supporter_comp: boolean; founder_no: number | null; last_seen_at: string | null; created_at: string };
type Idea = { id: string; title: string; details: string | null; by_name: string; status: string; video_id: string | null; hidden: boolean; created_at: string };
type Data = { visits: Visit[]; users: User[]; ideas: Idea[]; flags: Record<string, boolean>; me: string; at: number };

const fmt = (n: number) => n.toLocaleString("en-US");
const ago = (iso: string | null) => {
  if (!iso) return "never";
  const s = (Date.now() - Date.parse(iso)) / 1000;
  if (s < 90) return "just now";
  if (s < 5400) return `${Math.round(s / 60)} min ago`;
  if (s < 129600) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} d ago`;
};
const active = (u: User) => Boolean(u.supporter_until && Date.parse(u.supporter_until) > Date.now());

function sum(rows: Visit[], key: keyof Visit) {
  const m = new Map<string, number>();
  for (const r of rows) m.set(String(r[key]), (m.get(String(r[key])) ?? 0) + r.n);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function Bars({ rows }: { rows: [string, number][] }) {
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return (
    <ul className="space-y-1.5">
      {rows.slice(0, 8).map(([k, v]) => (
        <li key={k} className="grid grid-cols-[6rem_1fr_3rem] items-center gap-2 text-sm">
          <span className="truncate text-mist">{k}</span>
          <span className="h-2 rounded-full bg-line">
            <span className="block h-2 rounded-full bg-gradient-to-r from-cyan to-mint" style={{ width: `${(100 * v) / max}%` }} />
          </span>
          <span className="num text-right font-bold">{fmt(v)}</span>
        </li>
      ))}
    </ul>
  );
}

export default function AdminClient() {
  const { isAdmin, loading, configured, user, signIn } = useAccess();
  const [data, setData] = useState<Data | null>(null);
  const [tab, setTab] = useState<"visits" | "users" | "ideas" | "switches">("visits");
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(
    () =>
      fetch("/api/admin/overview", { cache: "no-store" })
        .then(async (r) => {
          if (r.ok) setData({ ...(await r.json()), at: Date.now() });
          else setErr((await r.json().catch(() => ({ error: "error" }))).error);
        })
        .catch(() => setErr("network error")),
    [],
  );

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  const act = async (body: Record<string, unknown>) => {
    const r = await fetch("/api/admin/action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) setErr((await r.json().catch(() => ({ error: "error" }))).error);
    else setErr(null);
    load();
  };

  const days = useMemo(() => {
    if (!data) return [];
    const out: [string, number][] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(data.at - i * 86_400_000).toISOString().slice(0, 10);
      out.push([d, data.visits.filter((v) => v.day === d).reduce((a, v) => a + v.n, 0)]);
    }
    return out;
  }, [data]);

  if (loading) return <div className="mx-auto max-w-5xl px-4 pt-16 text-mist">Loading…</div>;
  if (!configured)
    return (
      <div className="mx-auto max-w-xl px-4 pt-16 text-center">
        <Crunchy size={72} mood="squint" className="mx-auto" />
        <p className="display mt-3 text-2xl font-black">The database isn&apos;t connected yet</p>
        <p className="mt-2 text-mist">Follow SETUP.md to connect Supabase, then come back.</p>
      </div>
    );
  if (!isAdmin)
    return (
      <div className="mx-auto max-w-xl px-4 pt-16 text-center">
        <Crunchy size={72} mood="frown" className="mx-auto" />
        <p className="display mt-3 text-2xl font-black">Admins only</p>
        {!user && (
          <button type="button" onClick={signIn} className="mt-4 rounded-2xl bg-ink px-5 py-3 font-black text-navy-950">
            Sign in with Google
          </button>
        )}
      </div>
    );

  const total = days.reduce((a, d) => a + d[1], 0);
  const maxDay = Math.max(1, ...days.map((d) => d[1]));
  const supporters = data?.users.filter(active).length ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8">
      <div className="flex flex-wrap items-end gap-3">
        <h1 className="display flex-1 text-4xl font-black">Admin</h1>
        <div className="glass flex gap-1 rounded-2xl p-1 text-sm font-bold">
          {(["visits", "users", "ideas", "switches"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} className={`rounded-xl px-3 py-2 capitalize ${tab === t ? "bg-ink text-navy-950" : "text-mist"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>
      {err && <p className="mt-4 rounded-xl bg-coral/10 px-4 py-2 text-sm font-bold text-coral ring-1 ring-coral/40">{err}</p>}
      {!data ? (
        <p className="mt-8 text-mist">Loading…</p>
      ) : tab === "visits" ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="glass rounded-3xl p-5 lg:col-span-3">
            <div className="flex flex-wrap gap-8">
              <p><span className="display num block text-3xl font-black">{fmt(total)}</span><span className="text-sm text-mist">page views, 30 days</span></p>
              <p><span className="display num block text-3xl font-black">{fmt(data.users.length)}</span><span className="text-sm text-mist">signed-in players</span></p>
              <p><span className="display num block text-3xl font-black text-gold">{fmt(supporters)}</span><span className="text-sm text-mist">active supporters</span></p>
            </div>
            <div className="mt-5 flex h-32 items-end gap-1">
              {days.map(([d, n]) => (
                <div key={d} className="group relative flex-1">
                  <div className="rounded-t bg-gradient-to-t from-cyan/40 to-cyan" style={{ height: `${Math.max(2, (100 * n) / maxDay)}%`, minHeight: 2 }} />
                  <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-1.5 py-0.5 text-[10px] font-bold text-navy-950 group-hover:block">{d.slice(5)}: {n}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="glass rounded-3xl p-5"><h2 className="mb-3 font-black">Pages</h2><Bars rows={sum(data.visits, "path")} /></div>
          <div className="glass rounded-3xl p-5"><h2 className="mb-3 font-black">Countries</h2><Bars rows={sum(data.visits, "country")} /></div>
          <div className="glass rounded-3xl p-5"><h2 className="mb-3 font-black">From · device</h2><Bars rows={[...sum(data.visits, "source"), ...sum(data.visits, "device")]} /></div>
        </div>
      ) : tab === "users" ? (
        <div className="glass mt-6 overflow-x-auto rounded-3xl">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-mist">
              <tr><th className="p-3">Player</th><th className="p-3">Seen</th><th className="p-3">Supporter</th><th className="p-3">Role</th><th className="p-3">Actions</th></tr>
            </thead>
            <tbody>
              {data.users.map((u) => (
                <tr key={u.id} className="border-t border-edge/15">
                  <td className="p-3"><p className="font-bold">{u.name}</p><p className="text-xs text-mist">{u.email}</p></td>
                  <td className="p-3 text-mist">{ago(u.last_seen_at)}</td>
                  <td className="p-3">{active(u) ? <span className="font-bold text-gold">{u.supporter_months} mo{u.founder_no ? ` · #${u.founder_no}` : ""}{u.supporter_comp ? " · gift" : ""}</span> : <span className="text-mist">no</span>}</td>
                  <td className="p-3">{u.role === "admin" ? <span className="font-bold text-cyan">admin</span> : "player"}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1.5">
                      {u.id !== data.me && (
                        <button type="button" onClick={() => act({ type: "role", userId: u.id, role: u.role === "admin" ? "user" : "admin" })} className="rounded-lg px-2 py-1 text-xs font-bold ring-1 ring-edge/40">
                          {u.role === "admin" ? "Remove admin" : "Make admin"}
                        </button>
                      )}
                      <button type="button" onClick={() => act({ type: "comp", userId: u.id, days: 30 })} className="rounded-lg px-2 py-1 text-xs font-bold text-gold ring-1 ring-gold/40">Gift 30 d</button>
                      {active(u) && u.supporter_comp && (
                        <button type="button" onClick={() => act({ type: "comp", userId: u.id, days: 0 })} className="rounded-lg px-2 py-1 text-xs font-bold text-coral ring-1 ring-coral/40">End gift</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : tab === "ideas" ? (
        <div className="mt-6 grid gap-3">
          {data.ideas.length === 0 && <p className="text-mist">No ideas yet.</p>}
          {data.ideas.map((i) => (
            <div key={i.id} className={`glass rounded-2xl p-4 ${i.hidden ? "opacity-50" : ""}`}>
              <p className="font-bold">{i.title}</p>
              {i.details && <p className="mt-1 text-sm text-mist">{i.details}</p>}
              <p className="mt-1 text-xs text-mist">{i.by_name} · {ago(i.created_at)}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <select value={i.status} onChange={(e) => act({ type: "idea", id: i.id, status: e.target.value })} className="rounded-lg bg-navy-950/60 px-2 py-1.5 ring-1 ring-edge/30">
                  {["heard", "crunching", "rendering", "live"].map((s) => <option key={s} value={s} className="bg-navy-900">{s}</option>)}
                </select>
                <input
                  defaultValue={i.video_id ?? ""}
                  placeholder="YouTube id"
                  onBlur={(e) => e.target.value !== (i.video_id ?? "") && act({ type: "idea", id: i.id, video: e.target.value.trim() || null })}
                  className="w-36 rounded-lg bg-navy-950/60 px-2 py-1.5 font-mono text-xs ring-1 ring-edge/30"
                  aria-label="Video id"
                />
                <button type="button" onClick={() => act({ type: "idea", id: i.id, hidden: !i.hidden })} className="rounded-lg px-2 py-1.5 text-xs font-bold ring-1 ring-edge/40">{i.hidden ? "Show" : "Hide"}</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass mt-6 divide-y divide-edge/15 rounded-3xl">
          {Object.entries(FLAG_LABELS).map(([k, label]) => {
            const on = data.flags[k] ?? false;
            return (
              <button key={k} type="button" onClick={() => act({ type: "flag", key: k, enabled: !on })} className="flex w-full items-center justify-between gap-4 p-4 text-left">
                <span><span className="block font-bold">{label}</span><span className="font-mono text-xs text-mist">{k}</span></span>
                <span className={`h-7 w-12 shrink-0 rounded-full p-0.5 transition ${on ? "bg-mint" : "bg-line"}`}><span className={`block h-6 w-6 rounded-full bg-ink transition ${on ? "translate-x-5" : ""}`} /></span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
