import Image from "next/image";
import Link from "next/link";
import { MOCK_EVENTOS } from "FotosMony/lib/mock-data";

export default function EventosPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Eventos</h1>
        <p className="mt-1 text-sm text-slate-600">
          Selecciona un evento para ver la galería y comprar fotos.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {MOCK_EVENTOS.map((evento) => {
          const tieneSubEventos = (evento.subEventos?.length ?? 0) > 0;

          console.log("LINK EVENTO =>", `/eventos/${evento.slug}`);

          const totalFotos = tieneSubEventos
            ? evento.subEventos!.reduce((acc, s) => acc + s.fotos.length, 0) // total del torneo
            : (evento.fotos?.length ?? 0); // total del evento normal

          const coverUrl = `https://picsum.photos/seed/${evento.slug}/1200/800`; // placeholder

          return (
            <article
              key={evento.slug}
              className="overflow-hidden rounded-2xl border bg-white shadow-sm"
            >
              {/* Imagen superior */}
              <div className="relative aspect-[16/10] w-full">
                <Image
                  src={coverUrl}
                  alt={`Portada ${evento.nombre}`}
                  fill
                  className="object-cover"
                  priority={false}
                />
              </div>

              {/* Contenido */}
              <div className="p-5">
                <h2 className="text-lg font-semibold text-slate-900">
                  {evento.nombre}
                </h2>

                {/* Si después agregas fecha/lugar al mock, lo pones aquí */}
                <p className="mt-1 text-sm text-slate-600">
                  {tieneSubEventos
                    ? `${evento.subEventos!.length} subeventos`
                    : "Evento único"}
                </p>

                <ul className="mt-4 space-y-2 text-sm text-slate-700">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />
                    {totalFotos} fotos disponibles (con marca de agua)
                  </li>

                  {tieneSubEventos && (
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />
                      Cada subevento tiene su propia galería
                    </li>
                  )}

                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />
                    Compra por foto (promos ocasionales)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />
                    Entrega por correo sin marca de agua
                  </li>
                </ul>

                <div className="mt-5">
                  <Link
                    href={`/eventos/${evento.slug}`}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition"
                  >
                    {tieneSubEventos ? "Ver subeventos" : "Ver galería"}
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
