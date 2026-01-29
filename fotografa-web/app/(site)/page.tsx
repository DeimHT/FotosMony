import Image from "next/image";
import Link from "next/link";
import { EventosRecientes } from "FotosMony/components/ui/EventosRecientes";
import { CTAFinal } from "FotosMony/components/ui/CTAFinal";


const servicios = [
  {
    titulo: "Sesiones Fotográficas",
    descripcion:
      "Sesiones profesionales para bodas, cumpleaños, familias, retratos y eventos especiales.",
    imagen: "https://picsum.photos/seed/sesion/1200/800",
    icono: "📷",
    bullets: ["Sesiones en estudio", "Fotografía al aire libre", "Edición profesional", "Entrega rápida"],
  },
  {
    titulo: "Impresión de Fotografías",
    descripcion:
      "Servicio de impresión de alta calidad en diferentes formatos y acabados premium.",
    imagen: "https://picsum.photos/seed/impresion/1200/800",
    icono: "🖨️",
    bullets: ["Papel fotográfico premium", "Múltiples tamaños", "Acabados especiales", "Revelado profesional"],
  },
  {
    titulo: "Fotos Digitales",
    descripcion:
      "Venta y entrega de fotografías digitales en alta resolución para uso personal y comercial.",
    imagen: "https://picsum.photos/seed/digital/1200/800",
    icono: "⬇️",
    bullets: ["Alta resolución", "Formatos múltiples", "Descarga segura", "Licencias flexibles"],
  },
];


export default function HomePage() {
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
                src="https://picsum.photos/seed/hero/900/1100"
                alt="Sesión fotográfica profesional"
                width={900}
                height={1100}
                className="h-full w-full object-cover"
                priority
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
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="text-center">
          <h2 className="text-3xl font-semibold text-slate-900">Servicios Destacados</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600">
            Una selección de nuestros servicios más solicitados para capturar y entregar tus mejores recuerdos.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {servicios.map((s) => (
            <article
              key={s.titulo}
              className="overflow-hidden rounded-2xl border bg-white shadow-sm"
            >
              {/* Imagen */}
              <div className="relative aspect-[16/10] w-full">
                {/* Si prefieres <Image />, cambia por next/image y asegúrate de tener el host permitido */}
                <img src={s.imagen} alt={s.titulo} className="h-full w-full object-cover" />
              </div>

              {/* Contenido */}
              <div className="p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl">
                    {s.icono}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{s.titulo}</h3>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-600">{s.descripcion}</p>

                <ul className="mt-5 space-y-2 text-sm text-slate-700">
                  {s.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />
                      {b}
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  <a
                    href="/servicios"
                    className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition"
                  >
                    Ver detalles
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Sobre Nosotros */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          
          {/* Imagen */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-3xl shadow-xl">
              <img
                src="https://picsum.photos/seed/naturaleza/1200/800"
                alt="Paisajes Región de Los Lagos"
                className="h-full w-full object-cover"
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
      <EventosRecientes />
      
      {/* CTA Final */}
      <CTAFinal />
    </main>
  );
}
