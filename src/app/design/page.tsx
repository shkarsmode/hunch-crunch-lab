import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import DesignBoard from "@/components/design/DesignBoard";

const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Design directions",
  robots: { index: false, follow: false },
};

export default function DesignPage() {
  return (
    <div className={mono.variable}>
      <DesignBoard />
    </div>
  );
}
