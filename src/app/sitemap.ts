import type { MetadataRoute } from "next";
import { EXPERIMENTS } from "@/lib/experiments";

const base = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const labs = EXPERIMENTS.filter((e) => e.status === "live").map((e) => `/lab/${e.slug}`);
  return ["/", ...labs, "/support", "/ideas", "/privacy", "/terms"].map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly", priority: p === "/" ? 1 : 0.7 }));
}
