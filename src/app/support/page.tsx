import type { Metadata } from "next";
import SupportClient from "@/components/support/SupportClient";

export const metadata: Metadata = {
  title: "Support the lab",
  description: "$3 a month unlocks every experiment and every setting, and keeps Hunch Crunch going.",
};

export default function Page() {
  return <SupportClient />;
}
