import type { Metadata } from "next";
import IdeasClient from "@/components/ideas/IdeasClient";

export const metadata: Metadata = {
  title: "Ideas",
  description: "Viewer ideas for the next Hunch Crunch videos, from heard to live.",
};

export default function Page() {
  return <IdeasClient />;
}
