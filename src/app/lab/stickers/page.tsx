import type { Metadata } from "next";
import StickerLab from "@/components/labs/stickers/StickerLab";

const description =
  "Rip packs, chase the last sticker and see why a 980-sticker album takes about 1,046 packs, not 140. Play the simulation from the Hunch Crunch video.";

export const metadata: Metadata = {
  title: "Fill the sticker album",
  description,
  openGraph: { title: "Fill the sticker album", description },
};

export default function StickersPage() {
  return <StickerLab />;
}
