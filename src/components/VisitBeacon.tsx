"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function VisitBeacon() {
  const path = usePathname();
  useEffect(() => {
    if (path.startsWith("/admin")) return;
    if (navigator.doNotTrack === "1") return;
    const body = JSON.stringify({ path, ref: document.referrer.slice(0, 300), w: window.innerWidth });
    try {
      if (!navigator.sendBeacon?.("/api/visit", new Blob([body], { type: "application/json" }))) {
        fetch("/api/visit", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } });
      }
    } catch {}
  }, [path]);
  return null;
}
