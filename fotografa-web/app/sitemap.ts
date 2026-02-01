import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL?.startsWith("http") === true
    ? process.env.NEXT_PUBLIC_APP_URL
    : `https://${process.env.NEXT_PUBLIC_APP_URL ?? "fotosmony.cl"}`;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/eventos`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/servicios`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/portafolio`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/contacto`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/buscar`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
  ];

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: eventos = [] } = await supabase
      .from("eventos")
      .select("slug, created_at")
      .order("created_at", { ascending: false });

    const eventoPages: MetadataRoute.Sitemap = (eventos as { slug: string; created_at?: string }[]).map((e) => ({
      url: `${baseUrl}/eventos/${e.slug}`,
      lastModified: e.created_at ? new Date(e.created_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    const { data: carpetas = [] } = await supabase
      .from("carpetas")
      .select("id");

    const portafolioPages: MetadataRoute.Sitemap = (carpetas as { id: string }[]).map((c) => ({
      url: `${baseUrl}/portafolio/${c.id}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    return [...staticPages, ...eventoPages, ...portafolioPages];
  } catch {
    return staticPages;
  }
}
