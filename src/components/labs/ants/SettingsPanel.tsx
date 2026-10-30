"use client";

import { useEffect, useRef, useState } from "react";
import { Locked, useAccess } from "@/components/access/AccessProvider";
import { ANT_COLORS, parseRule, type AntSpec, type Setup } from "./engine";
import { PRESETS, RULE_CHIPS } from "./presets";

type Hit = { dx: number; dy: number; d: number; period: number };

type Props = {
  setup: Setup;
  onChange: (s: Setup) => void;
  onPlace: (ant: number) => void;
  onJump: (step: number) => void;
  onShare: () => void;
  onClose: () => void;
};

const ARROWS = ["↑", "→", "↓", "←"];
const fmt = (n: number) => n.toLocaleString("en-US");
const box = "rounded-xl bg-navy-950/55 ring-1 ring-edge/25";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-mist">{title}</h3>
      {children}
    </section>
  );
}

export default function SettingsPanel({ setup, onChange, onPlace, onJump, onShare, onClose }: Props) {
  const { unlocked, upsell } = useAccess();
  const [tab, setTab] = useState<"presets" | "ants" | "lab">("presets");
  const [sel, setSel] = useState(0);
  const [draft, setDraft] = useState<{ key: string; value: string } | null>(null);
  const [searching, setSearching] = useState(false);
  const [jump, setJump] = useState("84876");
  const [radius, setRadius] = useState(8);
  const [max, setMax] = useState(300000);
  const [hits, setHits] = useState<Hit[]>([]);
  const [prog, setProg] = useState<{ done: number; total: number } | null>(null);
  const worker = useRef<Worker | null>(null);

  const ant = setup.ants[Math.min(sel, setup.ants.length - 1)];
  const ruleKey = `${sel}:${ant?.rule}`;
  const rule = draft && draft.key === ruleKey ? draft.value : (ant?.rule ?? "RL");

  useEffect(() => () => worker.current?.terminate(), []);

  const patch = (p: Partial<AntSpec>) => {
    const ants = setup.ants.map((a, i) => (i === sel ? { ...a, ...p } : a));
    onChange({ ...setup, ants });
  };

  const addAnt = () => {
    if (setup.ants.length >= 6) return;
    const used = new Set(setup.ants.map((a) => a.color));
    const color = [0, 1, 2, 3, 4, 5].find((c) => !used.has(c)) ?? setup.ants.length;
    const last = setup.ants[setup.ants.length - 1];
    onChange({ ...setup, ants: [...setup.ants, { x: last.x + 6, y: last.y + 3, d: (last.d + 1) & 3, rule: last.rule, color }] });
    setSel(setup.ants.length);
  };

  const removeAnt = () => {
    if (setup.ants.length <= 1) return;
    onChange({ ...setup, ants: setup.ants.filter((_, i) => i !== sel) });
    setSel(0);
  };

  const runSearch = () => {
    worker.current?.terminate();
    setHits([]);
    setSearching(true);
    setProg({ done: 0, total: (2 * radius + 1) ** 2 * 4 });
    const w = new Worker(new URL("./search.worker.ts", import.meta.url), { type: "module" });
    worker.current = w;
    w.onmessage = (e: MessageEvent<{ type: string; hit?: Hit; done?: number; total?: number }>) => {
      const m = e.data;
      if (m.type === "hit" && m.hit) setHits((h) => [...h, m.hit as Hit].sort((a, b) => a.period - b.period).slice(0, 80));
      if (m.type === "progress" || m.type === "done") setProg({ done: m.done ?? 0, total: m.total ?? 1 });
      if (m.type === "done") {
        w.terminate();
        worker.current = null;
        setSearching(false);
      }
    };
    w.postMessage({ base: setup, radius, max });
  };

  const stopSearch = () => {
    worker.current?.terminate();
    worker.current = null;
    setSearching(false);
    setProg((p) => (p ? { ...p, total: p.done } : p));
  };

  const loadHit = (h: Hit) => {
    const fixed = setup.ants.length > 1 ? setup.ants.slice(0, -1) : setup.ants;
    const mover = setup.ants.length > 1 ? setup.ants[setup.ants.length - 1] : { x: 0, y: 0, d: 0, rule: "RL", color: 1 };
    onChange({ ...setup, ants: [...fixed, { ...mover, x: fixed[0].x + h.dx, y: fixed[0].y + h.dy, d: h.d }] });
    onClose();
  };

  return (
    <div className="text-sm">
      {!unlocked && (
        <button type="button" onClick={() => upsell("Changing the ants")} className="mb-4 flex w-full items-center gap-3 rounded-2xl bg-gold/10 p-3 text-left ring-1 ring-gold/35">
          <span className="text-2xl">🐜</span>
          <span className="flex-1">
            <span className="block font-bold text-gold">You&apos;re playing the video&apos;s setup</span>
            <span className="block text-xs text-mist">Unlock the full lab to change anything here.</span>
          </span>
          <span className="rounded-full bg-gold px-3 py-1.5 text-xs font-black text-navy-950">$3</span>
        </button>
      )}

      <div className={`mb-4 grid grid-cols-3 gap-1 p-1 ${box}`} role="tablist">
        {(["presets", "ants", "lab"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`rounded-lg py-2 text-xs font-bold capitalize transition ${tab === t ? "bg-ink text-navy-950" : "text-mist hover:text-ink"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "presets" && (
        <div className="grid gap-2">
          {PRESETS.map((p) => {
            const card = (
              <button
                type="button"
                onClick={() => {
                  onChange(p.setup);
                  onClose();
                }}
                className={`flex w-full items-center gap-3 p-3 text-left transition hover:ring-gold/50 ${box}`}
              >
                <span className="flex -space-x-1">
                  {p.setup.ants.map((a, i) => (
                    <span key={i} className="h-3.5 w-3.5 rounded-full ring-2 ring-navy-900" style={{ background: ANT_COLORS[a.color] }} />
                  ))}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">
                    {p.name} {p.free && <span className="ml-1 rounded bg-mint/15 px-1.5 py-0.5 text-[10px] font-black uppercase text-mint">Free</span>}
                  </span>
                  <span className="block truncate text-xs text-mist">{p.line}</span>
                </span>
              </button>
            );
            return p.free ? <div key={p.id}>{card}</div> : <Locked key={p.id} label={`The "${p.name}" preset`}>{card}</Locked>;
          })}
        </div>
      )}

      {tab === "ants" && (
        <Locked label="The ant editor">
          <Section title={`Ants · ${setup.ants.length} of 6`}>
            <div className="flex flex-wrap gap-2">
              {setup.ants.map((a, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSel(i)}
                  className={`flex h-10 items-center gap-2 rounded-full px-3 font-bold transition ${i === sel ? "bg-ink text-navy-950" : "bg-navy-950/55 ring-1 ring-edge/25"}`}
                >
                  <span className="h-3 w-3 rounded-full" style={{ background: ANT_COLORS[a.color] }} />
                  {i + 1}
                </button>
              ))}
              {setup.ants.length < 6 && (
                <button type="button" onClick={addAnt} className="h-10 rounded-full px-3 font-bold text-gold ring-1 ring-gold/40">
                  + Ant
                </button>
              )}
            </div>
          </Section>

          {ant && (
            <>
              <Section title="Rule">
                <input
                  value={rule}
                  onChange={(e) => {
                    const v = e.target.value.toUpperCase().replace(/[^LRNU]/g, "").slice(0, 16);
                    setDraft({ key: ruleKey, value: v });
                    if (parseRule(v)) patch({ rule: v });
                  }}
                  className={`num w-full px-3 py-2.5 font-mono text-base tracking-[0.2em] outline-none focus:ring-gold/60 ${box} ${parseRule(rule) ? "" : "ring-coral/60"}`}
                  aria-label="Rule"
                  inputMode="text"
                  autoCapitalize="characters"
                  spellCheck={false}
                />
                <p className="mt-1.5 text-xs text-mist">One letter per colour of square: R right, L left, N straight, U turn back.</p>
                <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto">
                  {RULE_CHIPS.map((r) => (
                    <button key={r} type="button" onClick={() => { setDraft(null); patch({ rule: r }); }} className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-xs ${ant.rule === r ? "bg-gold text-navy-950" : "bg-navy-950/55 ring-1 ring-edge/25"}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </Section>

              <Section title="Facing">
                <div className="grid grid-cols-4 gap-2">
                  {ARROWS.map((a, d) => (
                    <button key={a} type="button" onClick={() => patch({ d })} className={`h-11 rounded-xl text-lg font-black transition ${ant.d === d ? "bg-ink text-navy-950" : box}`} aria-label={`Face ${["up", "right", "down", "left"][d]}`}>
                      {a}
                    </button>
                  ))}
                </div>
              </Section>

              <Section title={sel === 0 ? "Start square" : "Start square, from ant 1"}>
                <div className="grid grid-cols-2 gap-2">
                  {(["x", "y"] as const).map((k) => {
                    const rel = sel === 0 ? ant[k] : ant[k] - setup.ants[0][k];
                    return (
                      <div key={k} className={`flex items-center justify-between p-1 ${box}`}>
                        <button type="button" onClick={() => patch({ [k]: ant[k] - 1 })} className="h-9 w-9 rounded-lg text-lg font-black hover:bg-ink/5" aria-label={`${k} minus one`}>−</button>
                        <span className="num font-bold">
                          {k === "x" ? (rel < 0 ? `${-rel} left` : rel > 0 ? `${rel} right` : "0") : rel < 0 ? `${-rel} up` : rel > 0 ? `${rel} down` : "0"}
                        </span>
                        <button type="button" onClick={() => patch({ [k]: ant[k] + 1 })} className="h-9 w-9 rounded-lg text-lg font-black hover:bg-ink/5" aria-label={`${k} plus one`}>+</button>
                      </div>
                    );
                  })}
                </div>
                <button type="button" onClick={() => { onPlace(sel); onClose(); }} className="mt-2 h-11 w-full rounded-xl font-bold text-cyan ring-1 ring-cyan/40">
                  Tap the grid to place ant {sel + 1}
                </button>
              </Section>

              <Section title="Colour">
                <div className="flex gap-2">
                  {ANT_COLORS.map((c, i) => (
                    <button key={c} type="button" onClick={() => patch({ color: i })} className={`h-9 w-9 rounded-full transition ${ant.color === i ? "ring-2 ring-ink ring-offset-2 ring-offset-navy-900" : ""}`} style={{ background: c }} aria-label={`Colour ${i + 1}`} />
                  ))}
                </div>
              </Section>

              {setup.ants.length > 1 && (
                <button type="button" onClick={removeAnt} className="h-11 w-full rounded-xl font-bold text-coral ring-1 ring-coral/40">
                  Remove ant {sel + 1}
                </button>
              )}
            </>
          )}
        </Locked>
      )}

      {tab === "lab" && (
        <Locked label="The lab tools">
          <Section title="Edges">
            <button type="button" onClick={() => onChange({ ...setup, wrap: !setup.wrap })} className={`flex h-11 w-full items-center justify-between px-3 ${box}`}>
              <span>Wrap around (the grid is a donut)</span>
              <span className={`h-6 w-11 rounded-full p-0.5 transition ${setup.wrap ? "bg-mint" : "bg-line"}`}>
                <span className={`block h-5 w-5 rounded-full bg-ink transition ${setup.wrap ? "translate-x-5" : ""}`} />
              </span>
            </button>
          </Section>

          <Section title="Jump to a step">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const n = Math.min(5_000_000, Math.max(0, Math.floor(Number(jump.replace(/\D/g, "")) || 0)));
                onJump(n);
                onClose();
              }}
            >
              <input value={jump} onChange={(e) => setJump(e.target.value)} inputMode="numeric" className={`num min-w-0 flex-1 px-3 py-2.5 outline-none ${box}`} aria-label="Step" />
              <button type="submit" className="rounded-xl bg-ink px-4 font-black text-navy-950">Go</button>
            </form>
          </Section>

          <Section title="Find setups that come home">
            <p className="mb-2 text-xs text-mist">
              Keeps ant 1 still and tries the last ant on every square nearby, facing every way. A setup comes home when the grid is empty and every ant is back where it started.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <label className={`flex items-center justify-between px-3 py-2 ${box}`}>
                <span className="text-mist">Range</span>
                <select value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="bg-transparent font-bold outline-none">
                  {[3, 5, 8, 10, 15].map((r) => (
                    <option key={r} value={r} className="bg-navy-900">±{r}</option>
                  ))}
                </select>
              </label>
              <label className={`flex items-center justify-between px-3 py-2 ${box}`}>
                <span className="text-mist">Steps</span>
                <select value={max} onChange={(e) => setMax(Number(e.target.value))} className="bg-transparent font-bold outline-none">
                  {[50000, 100000, 300000, 1000000].map((m) => (
                    <option key={m} value={m} className="bg-navy-900">{m >= 1e6 ? "1M" : `${m / 1000}K`}</option>
                  ))}
                </select>
              </label>
            </div>
            <button type="button" onClick={searching ? stopSearch : runSearch} className={`mt-2 h-11 w-full rounded-xl font-black ${searching ? "text-coral ring-1 ring-coral/40" : "bg-gold text-navy-950"}`}>
              {searching ? "Stop" : `Try ${fmt((2 * radius + 1) ** 2 * 4)} setups`}
            </button>
            {prog && (
              <div className="mt-3">
                <div className="h-2 overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full bg-gradient-to-r from-gold to-mint transition-[width]" style={{ width: `${(100 * prog.done) / Math.max(1, prog.total)}%` }} />
                </div>
                <p className="num mt-1.5 text-xs text-mist">
                  {fmt(prog.done)} tried · <span className="font-bold text-mint">{fmt(hits.length)} come home</span>
                </p>
              </div>
            )}
            {hits.length > 0 && (
              <ul className="mt-2 grid max-h-64 gap-1.5 overflow-y-auto pr-1">
                {hits.map((h) => (
                  <li key={`${h.dx},${h.dy},${h.d}`}>
                    <button type="button" onClick={() => loadHit(h)} className={`flex w-full items-center justify-between px-3 py-2 text-left ${box} hover:ring-mint/50`}>
                      <span className="num">
                        {h.dx >= 0 ? `${h.dx} right` : `${-h.dx} left`}, {h.dy >= 0 ? `${h.dy} down` : `${-h.dy} up`} {ARROWS[h.d]}
                      </span>
                      <span className="num font-bold text-mint">{fmt(h.period)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Share">
            <button type="button" onClick={onShare} className={`h-11 w-full font-bold ${box}`}>
              Copy a link to this setup
            </button>
          </Section>
        </Locked>
      )}
    </div>
  );
}
