import Link from "next/link";

const eventosRecientes = [
  {
    nombre: "Licenciatura 2024",
    slug: "licenciatura-2024",
    fecha: "Diciembre 2024",
    lugar: "Puerto Montt",
    coverUrl: "https://picsum.photos/seed/licenciatura-home/1200/800",
    totalFotos: 180,
  },
  {
    nombre: "Boda María & Juan",
    slug: "boda-maria-juan",
    fecha: "Enero 2025",
    lugar: "Puerto Varas",
    coverUrl: "https://picsum.photos/seed/boda-home/1200/800",
    totalFotos: 95,
  },
  {
    nombre: "Sesión Familiar – Verano",
    slug: "sesion-familiar-verano",
    fecha: "Febrero 2025",
    lugar: "Frutillar",
    coverUrl: "https://picsum.photos/seed/familia-home/1200/800",
    totalFotos: 60,
  },
];

export function EventosRecientes() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-3xl font-semibold text-slate-900">
            Eventos recientes
          </h2>
          <p className="mt-2 max-w-2xl text-slate-600">
            Revisa las galerías más recientes. Selecciona tus fotos y compra la
            versión sin marca de agua con entrega por correo.
          </p>
        </div>

        <Link
          href="/eventos"
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition"
        >
          Ver todos los eventos
        </Link>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {eventosRecientes.map((e) => (
          <article
            key={e.slug}
            className="overflow-hidden rounded-2xl border bg-white shadow-sm"
          >
            <div className="relative aspect-[16/10] w-full">
              <img
                src={e.coverUrl}
                alt={`Portada ${e.nombre}`}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900">{e.nombre}</h3>
              <p className="mt-1 text-sm text-slate-600">
                {e.fecha} · {e.lugar}
              </p>

              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />
                  {e.totalFotos} fotos disponibles (marca de agua)
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />
                  Compra por foto (promos ocasionales)
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />
                  Entrega por correo sin marca de agua
                </li>
              </ul>

              <div className="mt-6">
                <Link
                  href={`/eventos/${e.slug}`}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition"
                >
                  Ver galería
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
