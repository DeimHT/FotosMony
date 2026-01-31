import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type SearchResult = {
  eventos: { id: string; nombre: string; slug: string; url: string; type: "evento" }[];
  subeventos: { id: string; nombre: string; slug: string; eventSlug: string; url: string; type: "subevento" }[];
  servicios: { id: string; title: string; url: string; type: "servicio" }[];
  portafolio: { id: string; nombre: string; url: string; type: "portafolio" }[];
};

/**
 * GET /api/search?q=...
 * Búsqueda pública en eventos, subeventos, servicios y portafolio (carpetas).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();

  if (q.length < 2) {
    return NextResponse.json({
      eventos: [],
      subeventos: [],
      servicios: [],
      portafolio: [],
    } satisfies SearchResult);
  }

  const pattern = `%${q}%`;

  try {
    const [eventosRes, subeventosRes, serviciosRes, carpetasRes] = await Promise.all([
      supabase
        .from("eventos")
        .select("id, nombre, slug")
        .or(`nombre.ilike.${pattern},slug.ilike.${pattern}`)
        .limit(5),
      supabase
        .from("sub_eventos")
        .select("id, nombre, slug, eventos!inner(slug)")
        .or(`nombre.ilike.${pattern},slug.ilike.${pattern}`)
        .limit(5),
      supabase
        .from("services")
        .select("id, title")
        .eq("active", true)
        .or(`title.ilike.${pattern},description.ilike.${pattern}`)
        .limit(5),
      supabase
        .from("carpetas")
        .select("id, nombre")
        .or(`nombre.ilike.${pattern},descripcion.ilike.${pattern}`)
        .limit(5),
    ]);

    const eventos = (eventosRes.data ?? []).map((e: { id: string; nombre: string; slug: string }) => ({
      id: e.id,
      nombre: e.nombre,
      slug: e.slug,
      url: `/eventos/${e.slug}`,
      type: "evento" as const,
    }));

    const subeventos = (subeventosRes.data ?? []).map((s: { id: string; nombre: string; slug: string; eventos: { slug: string } | { slug: string }[] }) => {
      const eventSlug = Array.isArray(s.eventos) ? s.eventos[0]?.slug : (s.eventos as { slug: string })?.slug;
      return {
        id: s.id,
        nombre: s.nombre,
        slug: s.slug,
        eventSlug: eventSlug ?? "",
        url: eventSlug ? `/eventos/${eventSlug}/${s.slug}` : `/eventos`,
        type: "subevento" as const,
      };
    });

    const servicios = (serviciosRes.data ?? []).map((s: { id: string; title: string }) => ({
      id: s.id,
      title: s.title,
      url: "/servicios",
      type: "servicio" as const,
    }));

    const portafolio = (carpetasRes.data ?? []).map((c: { id: string; nombre: string }) => ({
      id: c.id,
      nombre: c.nombre,
      url: `/portafolio/${c.id}`,
      type: "portafolio" as const,
    }));

    return NextResponse.json({
      eventos,
      subeventos,
      servicios,
      portafolio,
    } satisfies SearchResult);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error en búsqueda";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
