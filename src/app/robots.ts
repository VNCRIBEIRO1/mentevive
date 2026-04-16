import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://mentevive.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/registro"],
        disallow: ["/admin", "/portal", "/super", "/api"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
