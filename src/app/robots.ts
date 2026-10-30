import type { MetadataRoute } from "next";

const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/admin", "/auth/", "/design"] }],
    sitemap: host ? `https://${host}/sitemap.xml` : undefined,
  };
}
