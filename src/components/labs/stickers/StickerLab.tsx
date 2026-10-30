"use client";

import { useMemo, useState } from "react";
import LabShell from "@/components/LabShell";
import Sheet from "@/components/Sheet";
import { useAccess } from "@/components/access/AccessProvider";
import { Icon } from "@/components/ui/icons";
import { FREE_CONFIG, VIDEO_ID, tap, type Config } from "./config";
import SetupPanel from "./SetupPanel";
import SimPanel from "./SimPanel";
import Table from "./Table";

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

  const toggleSetup = () => {
    tap();
    if (setupOpen) {
      setSetupOpen(false);
      return;
    }
    setSetupKey((k) => k + 1);
    setSimOpen(false);
    setSetupOpen(true);
  };

  const toggleSim = () => {
    if (!unlocked) {
      upsell("The 10,000-album simulator");
      return;
    }
    tap();
    if (simOpen) {
      setSimOpen(false);
      return;
    }
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
    <button
      type="button"
      onClick={toggleSetup}
      data-sheet-trigger
      aria-expanded={setupOpen}
      className="grid h-10 w-10 place-items-center rounded-xl border border-hair-strong text-ink/70 transition hover:text-ink active:scale-95"
      aria-label="Album setup"
      title="Album setup"
    >
      <Icon.Sliders size={19} />
    </button>
  );

  return (
    <>
      <LabShell title="Fill the sticker album" shortTitle="Sticker album" tag="E003 · LIVE" video={VIDEO_ID} right={right} grid={false}>
        <Table
          key={tableKey}
          config={config}
          setupOpen={setupOpen}
          simOpen={simOpen}
          onFinished={(packs) => setFinished({ round, packs })}
          onAgain={again}
          onSim={toggleSim}
          onSetup={toggleSetup}
        />
      </LabShell>
      <Sheet open={setupOpen} onClose={() => setSetupOpen(false)} title="New album">
        <SetupPanel key={setupKey} config={config} simOpen={simOpen} onApply={apply} onSim={toggleSim} />
      </Sheet>
      <Sheet open={simOpen} onClose={() => setSimOpen(false)} title="10,000 collectors">
        <SimPanel key={simKey} config={config} yourPacks={yourPacks} active={simOpen} />
      </Sheet>
    </>
  );
}
