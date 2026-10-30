"use client";

import { useEffect, useRef, useState } from "react";
import { Locked, useAccess } from "@/components/access/AccessProvider";
import { Icon } from "@/components/ui/icons";
import { AntsThumb } from "@/components/ui/thumbs";
import { btn } from "@/components/ui/kit";
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

const DIRS = ["up", "right", "down", "left"];
const TABS = ["presets", "ants", "lab"] as const;
const fmt = (n: number) => n.toLocaleString("en-US");
const box = "rounded-xl border border-hair bg-white/[0.025]";
const same = (a: Setup, b: Setup) => JSON.stringify(a) === JSON.stringify(b);

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ink/40">{title}</h3>
      {children}
    </section>
  );
}

function Arrow({ d }: { d: number }) {
  return <Icon.Arrow size={18} style={{ transform: `rotate(${d * 90 - 90}deg)` }} />;
}

export default function SettingsPanel({ setup, onChange, onPlace, onJump, onShare, onClose }: Props) {
  const { unlocked, upsell } = useAccess();
  const [tab, setTab] = useState<(typeof TABS)[number]>("presets");
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
    <div className="text-[14px]">
      {!unlocked && (
        <button
          type="button"
          onClick={() => upsell("Changing the ants")}
          className="mb-4 flex w-full items-center gap-3 rounded-xl border border-gold/30 bg-gold/[0.05] p-3 text-left transition active:scale-[0.99]"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-hair bg-navy-950">
            <AntsThumb className="h-7 w-7" cell={1.1} />
          </span>
          <span className="flex-1">
            <span className="block font-semibold text-gold">You&apos;re playing the video&apos;s setup</span>
            <span className="block text-[12px] text-ink/50">Unlock the full lab to change anything here.</span>
          </span>
          <span className="rounded-lg bg-gold px-2.5 py-1.5 font-mono text-[11px] text-[#0B0D12]">$3</span>
        </button>
      )}

      <div className="relative mb-4 grid grid-cols-3 rounded-xl border border-hair bg-white/[0.03] p-1" role="tablist">
        <div
          className="absolute inset-y-1 left-1 rounded-lg bg-white/[0.12] transition-transform duration-200 ease-out"
          style={{ width: "calc((100% - 8px) / 3)", transform: `translateX(${TABS.indexOf(tab) * 100}%)` }}
        />
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`relative py-2 font-mono text-[11px] uppercase tracking-[0.08em] transition ${tab === t ? "text-ink" : "text-ink/45 hover:text-ink/80"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "presets" && (
        <div className="grid gap-1.5">
          {PRESETS.map((p) => {
            const current = same(p.setup, setup);
            const card = (
              <button
                type="button"
                onClick={() => {
                  onChange(p.setup);
                  onClose();
                }}
                className={`flex w-full items-center gap-3 p-3 text-left transition ${box} ${current ? "border-gold/45 bg-gold/[0.04]" : "hover:border-hair-strong"}`}
              >
                <span className="flex w-9 shrink-0 -space-x-1">
                  {p.setup.ants.map((a, i) => (
                    <span key={i} className="h-3.5 w-3.5 rounded-full ring-2 ring-navy-850" style={{ background: ANT_COLORS[a.color] }} />
                  ))}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 font-semibold">
                    {p.name}
                    {p.free && <span className="font-mono text-[9px] tracking-[0.1em] text-mint">FREE</span>}
                  </span>
                  <span className="block truncate text-[12px] text-ink/45">{p.line}</span>
                </span>
                {current && <Icon.Check size={16} className="shrink-0 text-gold" />}
              </button>
            );
            return p.free ? <div key={p.id}>{card}</div> : <Locked key={p.id} label={`The "${p.name}" preset`}>{card}</Locked>;
          })}
        </div>
      )}

      {tab === "ants" && (
        <Locked label="The ant editor">
          <Section title={`Ants · ${setup.ants.length} of 6`}>
            <div className="flex flex-wrap gap-1.5">
              {setup.ants.map((a, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSel(i)}
                  className={`flex h-10 items-center gap-2 rounded-lg px-3 font-mono text-[12px] transition ${i === sel ? "bg-ink text-[#0B0D12]" : `${box} text-ink/70`}`}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: ANT_COLORS[a.color], boxShadow: i === sel ? "none" : `0 0 8px ${ANT_COLORS[a.color]}` }} />
                  ANT {i + 1}
                </button>
              ))}
              {setup.ants.length < 6 && (
                <button type="button" onClick={addAnt} className="flex h-10 items-center gap-1.5 rounded-lg border border-dashed border-gold/40 px-3 font-mono text-[12px] text-gold transition active:scale-95">
                  <Icon.Plus size={14} /> ANT
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
                  className={`w-full px-3 py-2.5 font-mono text-[17px] tracking-[0.3em] outline-none transition focus:border-gold/60 ${box} ${parseRule(rule) ? "" : "border-coral/60"}`}
                  aria-label="Rule"
                  inputMode="text"
                  autoCapitalize="characters"
                  spellCheck={false}
                />
                <p className="mt-1.5 text-[12px] leading-snug text-ink/45">One letter per colour of square: R right, L left, N straight, U turn back.</p>
                <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto">
                  {RULE_CHIPS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setDraft(null);
                        patch({ rule: r });
                      }}
                      className={`h-8 shrink-0 rounded-lg px-2.5 font-mono text-[12px] transition ${ant.rule === r ? "bg-gold text-[#0B0D12]" : `${box} text-ink/70`}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </Section>

              <Section title="Facing">
                <div className="grid grid-cols-4 gap-1.5">
                  {DIRS.map((name, d) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => patch({ d })}
                      className={`grid h-11 place-items-center rounded-xl transition ${ant.d === d ? "bg-ink text-[#0B0D12]" : `${box} text-ink/70`}`}
                      aria-label={`Face ${name}`}
                    >
                      <Arrow d={d} />
                    </button>
                  ))}
                </div>
              </Section>

              <Section title={sel === 0 ? "Start square" : "Start square, from ant 1"}>
                <div className="grid grid-cols-2 gap-1.5">
                  {(["x", "y"] as const).map((k) => {
                    const rel = sel === 0 ? ant[k] : ant[k] - setup.ants[0][k];
                    return (
                      <div key={k} className={`flex items-center justify-between p-1 ${box}`}>
                        <button type="button" onClick={() => patch({ [k]: ant[k] - 1 })} className="grid h-9 w-9 place-items-center rounded-lg text-ink/70 hover:bg-white/5" aria-label={`${k} minus one`}>
                          <Icon.Minus size={16} />
                        </button>
                        <span className="font-mono text-[12px]">
                          {k === "x" ? (rel < 0 ? `${-rel} LEFT` : rel > 0 ? `${rel} RIGHT` : "0") : rel < 0 ? `${-rel} UP` : rel > 0 ? `${rel} DOWN` : "0"}
                        </span>
                        <button type="button" onClick={() => patch({ [k]: ant[k] + 1 })} className="grid h-9 w-9 place-items-center rounded-lg text-ink/70 hover:bg-white/5" aria-label={`${k} plus one`}>
                          <Icon.Plus size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onPlace(sel);
                    onClose();
                  }}
                  className={btn("ghost", "md", "mt-1.5 w-full")}
                >
                  <Icon.Target size={16} /> Tap the grid to place ant {sel + 1}
                </button>
              </Section>

              <Section title="Colour">
                <div className="flex gap-2">
                  {ANT_COLORS.map((c, i) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => patch({ color: i })}
                      className={`h-9 w-9 rounded-full transition ${ant.color === i ? "ring-2 ring-ink ring-offset-2 ring-offset-navy-850" : "opacity-80 hover:opacity-100"}`}
                      style={{ background: c, boxShadow: `0 0 12px ${c}55` }}
                      aria-label={`Colour ${i + 1}`}
                    />
                  ))}
                </div>
              </Section>

              {setup.ants.length > 1 && (
                <button type="button" onClick={removeAnt} className={btn("ghost", "md", "w-full border-coral/30 text-coral hover:border-coral/60 hover:text-coral")}>
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
            <button type="button" onClick={() => onChange({ ...setup, wrap: !setup.wrap })} className={`flex h-12 w-full items-center justify-between px-3 ${box}`} role="switch" aria-checked={setup.wrap}>
              <span>Wrap around (the grid is a donut)</span>
              <span className={`h-6 w-10 rounded-full p-0.5 transition ${setup.wrap ? "bg-gold" : "bg-white/10"}`}>
                <span className={`block h-5 w-5 rounded-full bg-white transition ${setup.wrap ? "translate-x-4" : ""}`} />
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
              <input value={jump} onChange={(e) => setJump(e.target.value)} inputMode="numeric" className={`min-w-0 flex-1 px-3 py-2.5 font-mono outline-none focus:border-gold/60 ${box}`} aria-label="Step" />
              <button type="submit" className={btn("primary", "md")}>
                Go
              </button>
            </form>
          </Section>

          <Section title="Find setups that come home">
            <p className="mb-2 text-[12px] leading-snug text-ink/45">
              Keeps ant 1 still and tries the last ant on every square nearby, facing every way. A setup comes home when the grid is empty and every ant is back where it started.
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <label className={`flex items-center justify-between px-3 py-2 ${box}`}>
                <span className="font-mono text-[10px] tracking-[0.1em] text-ink/45">RANGE</span>
                <select value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="bg-transparent font-mono outline-none">
                  {[3, 5, 8, 10, 15].map((r) => (
                    <option key={r} value={r} className="bg-navy-900">
                      ±{r}
                    </option>
                  ))}
                </select>
              </label>
              <label className={`flex items-center justify-between px-3 py-2 ${box}`}>
                <span className="font-mono text-[10px] tracking-[0.1em] text-ink/45">STEPS</span>
                <select value={max} onChange={(e) => setMax(Number(e.target.value))} className="bg-transparent font-mono outline-none">
                  {[50000, 100000, 300000, 1000000].map((m) => (
                    <option key={m} value={m} className="bg-navy-900">
                      {m >= 1e6 ? "1M" : `${m / 1000}K`}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button type="button" onClick={searching ? stopSearch : runSearch} className={searching ? btn("ghost", "md", "mt-1.5 w-full text-coral") : btn("primary", "md", "mt-1.5 w-full")}>
              {searching ? "Stop" : `Try ${fmt((2 * radius + 1) ** 2 * 4)} setups`}
            </button>
            {prog && (
              <div className="mt-3">
                <div className="h-1 overflow-hidden rounded-full bg-white/[0.07]">
                  <div className="h-full rounded-full bg-gold transition-[width]" style={{ width: `${(100 * prog.done) / Math.max(1, prog.total)}%` }} />
                </div>
                <p className="mt-1.5 font-mono text-[11px] text-ink/45">
                  {fmt(prog.done)} TRIED · <span className="text-mint">{fmt(hits.length)} COME HOME</span>
                </p>
              </div>
            )}
            {hits.length > 0 && (
              <ul className="mt-2 grid max-h-64 gap-1 overflow-y-auto pr-1">
                {hits.map((h) => (
                  <li key={`${h.dx},${h.dy},${h.d}`}>
                    <button type="button" onClick={() => loadHit(h)} className={`flex w-full items-center justify-between px-3 py-2 text-left transition hover:border-mint/40 ${box}`}>
                      <span className="flex items-center gap-2 font-mono text-[12px] text-ink/70">
                        {h.dx >= 0 ? `${h.dx} RIGHT` : `${-h.dx} LEFT`}, {h.dy >= 0 ? `${h.dy} DOWN` : `${-h.dy} UP`} <Arrow d={h.d} />
                      </span>
                      <span className="font-mono text-[12px] text-mint">{fmt(h.period)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Share">
            <button type="button" onClick={onShare} className={btn("ghost", "md", "w-full")}>
              <Icon.Share size={16} /> Copy a link to this setup
            </button>
          </Section>
        </Locked>
      )}
    </div>
  );
}
