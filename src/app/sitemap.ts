import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://logos.builders";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: {
          ko: baseUrl,
          en: baseUrl,
        },
      },
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
      alternates: {
        languages: {
          ko: `${baseUrl}/pricing`,
          en: `${baseUrl}/pricing`,
        },
      },
    },
    {
      url: `${baseUrl}/tools/seo-check`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
      alternates: {
        languages: {
          ko: `${baseUrl}/tools/seo-check`,
          en: `${baseUrl}/tools/seo-check`,
        },
      },
    },
  ];
}
