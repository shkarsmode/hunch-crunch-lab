import type { Metadata } from "next";
import LabShell from "@/components/LabShell";
import CoinLab from "@/components/labs/coin/CoinLab";
import { SITE_NAME } from "@/lib/site";

const title = "Real coin or fake?";
const description = "Tap H or T to type coin flips that look real. Then 10,000 simulated real coins try to spot your fake. Play the simulation from the Hunch Crunch video.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/lab/coin" },
  openGraph: { title: `${title} · ${SITE_NAME}`, description, siteName: SITE_NAME, type: "website", url: "/lab/coin" },
};

export default function CoinPage() {
  return (
    <LabShell title={title} tag="E005 · LIVE" video="ohw7yj6AZ_E" grid={false}>
      <CoinLab />
    </LabShell>
  );
}
