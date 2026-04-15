import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://psicolobia.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/portal/", "/api/", "/redefinir-senha/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
