import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { EventosRecientes } from "FotosMony/components/ui/EventosRecientes";
import { CTAFinal } from "FotosMony/components/ui/CTAFinal";
import { EditableHomeSections } from "FotosMony/components/ui/EditableHomeSections";
import {
  mergeHero,
  mergeAbout,
  heroImageUrl,
  aboutImageUrl,
} from "FotosMony/lib/homeContent";

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL?.startsWith("http") === true
    ? process.env.NEXT_PUBLIC_APP_URL
    : `https://${process.env.NEXT_PUBLIC_APP_URL ?? "fotosmony.cl"}`;

export const metadata = {
  title: "Inicio",
  description:
    "Fotos Mony: fotografía profesional en la Región de los Lagos, Chile. Sesiones fotográficas, bodas, retratos. Compra tus fotos digitales sin marca de agua.",
  openGraph: {
    title: "FotosMony | Fotografía Región de los Lagos, Chile",
    description: "Capturamos tus momentos más especiales. Fotografía profesional, sesiones y venta de fotos digitales.",
  },
};

const IMG_LAGOS_LANDSCAPE =
  "https://images.unsplash.com/photo-1493724798364-c4ca5e3f5fd3?w=1200&h=800&fit=crop&q=80";
const PLACEHOLDER_SERVICIO = IMG_LAGOS_LANDSCAPE;
const R2_PUBLIC = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "").replace(/\/$/, "");

export const revalidate = 60;

export default async function HomePage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: homeRows } = await supabase
    .from("home_sections")
    .select("id, content")
    .in("id", ["hero", "about"]);
  const homeById = new Map(
    ((homeRows ?? []) as { id: string; content: unknown }[]).map((r) => [r.id, r.content])
  );
  const heroContent = mergeHero(homeById.get("hero"));
  const aboutContent = mergeAbout(homeById.get("about"));
  const heroImgSrc = heroImageUrl(heroContent, R2_PUBLIC || undefined);
  const aboutImgSrc = aboutImageUrl(aboutContent, R2_PUBLIC || undefined);

  const { data: serviciosDestacados = [] } = await supabase
    .from("services")
    .select("id, title, description, image_url")
    .eq("active", true)
    .eq("destacado", true)
    .order("sort_order", { ascending: true })
    .limit(3);

  const { data: eventosRaw = [] } = await supabase
    .from("eventos")
    .select(`
      id, nombre, slug, cover_public_id, cover_storage_provider,
      fotos ( id, public_id, precio, storage_provider ),
      sub_eventos ( id, nombre, slug, fotos ( id, public_id, precio, storage_provider ) )
    `)
    .order("created_at", { ascending: false })
    .limit(3);

  type EventoRow = {
    id: string;
    nombre: string;
    slug: string;
    cover_public_id?: string | null;
    cover_storage_provider?: string | null;
    fotos?: { id: string; public_id: string; precio: number; storage_provider?: string | null }[];
    sub_eventos?: { id: string; nombre: string; slug: string; fotos?: { id: string; public_id: string; precio: number; storage_provider?: string | null }[] }[];
  };

  const eventosRecientes = (eventosRaw as EventoRow[]).map((ev) => {
    const tieneSubEventos = (ev.sub_eventos?.length ?? 0) > 0;
    const totalFotos = tieneSubEventos
      ? (ev.sub_eventos ?? []).reduce((acc, s) => acc + (s.fotos?.length ?? 0), 0)
      : (ev.fotos?.length ?? 0);
    const portadaPublicId =
      ev.cover_public_id ??
      (tieneSubEventos ? ev.sub_eventos?.[0]?.fotos?.[0]?.public_id : ev.fotos?.[0]?.public_id) ??
      null;
    const portadaStorage =
      ev.cover_storage_provider ??
      (tieneSubEventos ? ev.sub_eventos?.[0]?.fotos?.[0]?.storage_provider : ev.fotos?.[0]?.storage_provider) ??
      null;
    const coverUrl = portadaPublicId
      ? `/api/watermark?public_id=${encodeURIComponent(portadaPublicId)}&w=800&v=2${portadaStorage === "cloudflare" ? "&storage=cloudflare" : portadaStorage === "supabase" ? "&storage=supabase" : ""}`
      : IMG_LAGOS_LANDSCAPE;
    return { nombre: ev.nombre, slug: ev.slug, coverUrl, totalFotos };
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Photographer",
    name: "FotosMony",
    alternateName: "Fotos Mony",
    url: baseUrl,
    description:
      "Fotografía profesional en la Región de los Lagos, Chile. Sesiones fotográficas, bodas, retratos y venta de fotos digitales.",
    areaServed: {
      "@type": "AdministrativeArea",
      name: "Región de los Lagos",
      addressCountry: "CL",
    },
    serviceType: ["Fotografía profesional", "Sesiones fotográficas", "Fotografía de bodas", "Retratos"],
  };

  return (
    <main className="bg-[var(--background)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <EditableHomeSections
        initialHero={heroContent}
        initialAbout={aboutContent}
        heroImgSrc={heroImgSrc}
        aboutImgSrc={aboutImgSrc}
        r2PublicUrl={R2_PUBLIC}
      />

      {/* SERVICIOS DESTACADOS */}
      {serviciosDestacados && serviciosDestacados.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-16">
          <div className="text-center">
            <h2 className="text-3xl font-semibold text-slate-900">Servicios Destacados</h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-600">
              Una selección de nuestros servicios más solicitados para capturar y entregar tus mejores recuerdos.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {serviciosDestacados.map((s) => (
              <article
                key={s.id}
                className="overflow-hidden rounded-2xl border bg-white shadow-sm"
              >
                <div className="relative aspect-[16/10] w-full">
                  <img
                    src={s.image_url || PLACEHOLDER_SERVICIO}
                    alt={s.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl">
                      📷
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">{s.title}</h3>
                  </div>
                  {s.description && (
                    <p className="mt-4 text-sm leading-6 text-slate-600">{s.description}</p>
                  )}
                  <div className="mt-6">
                    <Link
                      href="/servicios"
                      className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition"
                    >
                      Ver detalles
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Eventos Recientes */}
      <EventosRecientes eventos={eventosRecientes} />
      
      {/* CTA Final */}
      <CTAFinal />
    </main>
  );
}
