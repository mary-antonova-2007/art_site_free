import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/auth/", "/settings", "/media"]
      }
    ],
    sitemap: `${siteUrl}/sitemap.xml`
  };
}
