"use client";

import { useMemo, useState } from "react";
import LabShell from "@/components/LabShell";
import Sheet from "@/components/Sheet";
import { useAccess } from "@/components/access/AccessProvider";
import { FREE_CONFIG, VIDEO_ID, tap, type Config } from "./config";
import SetupPanel from "./SetupPanel";
import SimPanel from "./SimPanel";
import Table from "./Table";

const iconBtn = "grid h-11 w-11 shrink-0 place-items-center rounded-full text-mist ring-1 ring-edge/25 transition hover:text-ink active:scale-95";

function SlidersIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2.2" fill="currentColor" fillOpacity="0.2" />
      <circle cx="9" cy="17" r="2.2" fill="currentColor" fillOpacity="0.2" />
    </svg>
  );
}

export default function StickerLab() {
  const { unlocked, upsell } = useAccess();
  const [wanted, setWanted] = useState<Config>(FREE_CONFIG);
  const [round, setRound] = useState(0);
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupKey, setSetupKey] = useState(0);
  const [simOpen, setSimOpen] = useState(false);
  const [simKey, setSimKey] = useState(0);
  const [finished, setFinished] = useState<{ round: number; packs: number } | null>(null);

  const config = useMemo<Config>(() => (unlocked ? wanted : FREE_CONFIG), [unlocked, wanted]);
  const tableKey = `${round}:${config.n}:${config.k}:${config.rareEvery}:${config.friends}`;
  const yourPacks = finished && finished.round === round ? finished.packs : null;

  const openSetup = () => {
    tap();
    setSetupKey((k) => k + 1);
    setSimOpen(false);
    setSetupOpen(true);
  };

  const openSim = () => {
    if (!unlocked) {
      upsell("The 10,000-album simulator");
      return;
    }
    tap();
    setSimKey((k) => k + 1);
    setSetupOpen(false);
    setSimOpen(true);
  };

  const apply = (c: Config) => {
    setWanted(c);
    setRound((r) => r + 1);
    setFinished(null);
    setSetupOpen(false);
  };

  const again = () => {
    setRound((r) => r + 1);
    setFinished(null);
  };

  const right = (
    <button type="button" onClick={openSetup} className={iconBtn} aria-label="Album setup">
      <SlidersIcon />
    </button>
  );

  return (
    <>
      <LabShell title="Fill the sticker album" shortTitle="Sticker album" emoji="📒" video={VIDEO_ID} right={right}>
        <Table key={tableKey} config={config} onFinished={(packs) => setFinished({ round, packs })} onAgain={again} onSim={openSim} />
      </LabShell>
      <Sheet open={setupOpen} onClose={() => setSetupOpen(false)} title="New album">
        <div inert={!setupOpen}>
          <SetupPanel key={setupKey} config={config} onApply={apply} onSim={openSim} />
        </div>
      </Sheet>
      <Sheet open={simOpen} onClose={() => setSimOpen(false)} title="10,000 collectors">
        <div inert={!simOpen}>
          <SimPanel key={simKey} config={config} yourPacks={yourPacks} active={simOpen} />
        </div>
      </Sheet>
    </>
  );
}
