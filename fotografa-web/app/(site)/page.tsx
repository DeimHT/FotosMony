import Image from "next/image";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { EventosRecientes } from "FotosMony/components/ui/EventosRecientes";
import { CTAFinal } from "FotosMony/components/ui/CTAFinal";

// Imágenes de la Región de los Lagos / Patagonia chilena (Unsplash, uso libre)
const IMG_HERO =
  "https://images.unsplash.com/photo-1718147155878-e2baab858e74?w=900&h=1100&fit=crop&q=80";
const IMG_LAGOS_LANDSCAPE =
  "https://images.unsplash.com/photo-1493724798364-c4ca5e3f5fd3?w=1200&h=800&fit=crop&q=80";
const PLACEHOLDER_SERVICIO = IMG_LAGOS_LANDSCAPE;

export const revalidate = 60;

export default async function HomePage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

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
      id, nombre, slug, cover_public_id,
      fotos ( id, public_id, precio ),
      sub_eventos ( id, nombre, slug, fotos ( id, public_id, precio ) )
    `)
    .order("created_at", { ascending: false })
    .limit(3);

  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
  // Reducir tamaño de imágenes para ahorrar ancho de banda (800px es suficiente para cards)
  const cldUrl = (publicId: string, w = 800) =>
    `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto:good,w_${w}/${publicId}`;

  type EventoRow = {
    id: string;
    nombre: string;
    slug: string;
    cover_public_id?: string | null;
    fotos?: { id: string; public_id: string; precio: number }[];
    sub_eventos?: { id: string; nombre: string; slug: string; fotos?: { id: string; public_id: string; precio: number }[] }[];
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
    const coverUrl = portadaPublicId ? cldUrl(portadaPublicId, 800) : IMG_LAGOS_LANDSCAPE;
    return { nombre: ev.nombre, slug: ev.slug, coverUrl, totalFotos };
  });

  return (
    <main className="bg-[var(--background)]">
      {/* HERO */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          
          {/* Texto */}
          <div>
            <h1 className="text-4xl font-semibold leading-tight text-slate-900 md:text-5xl">
              Capturamos tus
              <br />
              momentos más
              <br />
              especiales
            </h1>

            <p className="mt-6 max-w-xl text-base text-slate-600">
              En FotosMony ofrecemos servicios profesionales de fotografía en la
              hermosa región de los lagos. Desde sesiones fotográficas hasta
              impresión de alta calidad y venta de fotos digitales.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/servicios"
                className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition"
              >
                Ver Nuestros Servicios
              </Link>

              <Link
                href="/contacto"
                className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition"
              >
                Contactar Ahora
              </Link>
            </div>
          </div>

          {/* Imagen */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-3xl shadow-xl">
              <Image
                src={IMG_HERO}
                alt="Paisaje Región de los Lagos, Chile — sesión fotográfica"
                width={900}
                height={1100}
                className="h-full w-full object-cover"
                priority
                loading="eager"
              />
            </div>

            {/* Badge flotante */}
            <div className="absolute -bottom-6 left-6 rounded-2xl bg-white px-5 py-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                  📷
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    +500 Sesiones
                  </p>
                  <p className="text-xs text-slate-600">
                    Realizadas con éxito
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

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

      {/* Sobre Nosotros */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          
          {/* Imagen */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-3xl shadow-xl">
              <img
                src={IMG_LAGOS_LANDSCAPE}
                alt="Paisajes Región de los Lagos, Chile"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Card flotante */}
            <div className="absolute -bottom-6 left-6 max-w-xs rounded-2xl bg-white px-5 py-4 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                  📍
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Ubicación Privilegiada
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Operamos en toda la hermosa región de los lagos, aprovechando paisajes
                    naturales únicos como telón de fondo.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Texto */}
          <div>
            <h2 className="text-3xl font-semibold text-slate-900">
              Sobre FotosMony
            </h2>

            <p className="mt-4 text-slate-600">
              Somos un estudio de fotografía especializado en capturar los momentos
              más importantes de tu vida. Con sede en la región de los lagos,
              aprovechamos los paisajes naturales únicos de nuestra zona para crear
              fotografías verdaderamente memorables.
            </p>

            <ul className="mt-6 space-y-4">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-slate-900" />
                <div>
                  <p className="font-semibold text-slate-900">
                    Calidad Profesional
                  </p>
                  <p className="text-sm text-slate-600">
                    Utilizamos equipos de última generación y técnicas avanzadas de edición.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-slate-900" />
                <div>
                  <p className="font-semibold text-slate-900">
                    Servicio Personalizado
                  </p>
                  <p className="text-sm text-slate-600">
                    Adaptamos cada sesión a tus necesidades y preferencias específicas.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-slate-900" />
                <div>
                  <p className="font-semibold text-slate-900">
                    Entorno Natural
                  </p>
                  <p className="text-sm text-slate-600">
                    Los lagos y paisajes naturales proporcionan el escenario perfecto.
                  </p>
                </div>
              </li>
            </ul>

            {/* Métricas */}
            <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
              <div>
                <p className="text-2xl font-semibold text-slate-900">500+</p>
                <p className="text-sm text-slate-600">Clientes Satisfechos</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">5+</p>
                <p className="text-sm text-slate-600">Años de Experiencia</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">24h</p>
                <p className="text-sm text-slate-600">Entrega Express</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">100%</p>
                <p className="text-sm text-slate-600">Región de los Lagos</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Eventos Recientes */}
      <EventosRecientes eventos={eventosRecientes} />
      
      {/* CTA Final */}
      <CTAFinal />
    </main>
  );
}
