import type { Metadata } from "next";
import AntsLab from "@/components/labs/ants/AntsLab";

export const metadata: Metadata = {
  title: "Two ants, same 2 rules",
  description: "Two ants, two rules, one empty grid. They make a mess, build highways, then undo every square. Watch step 84,876.",
};

export default function Page() {
  return <AntsLab />;
}
