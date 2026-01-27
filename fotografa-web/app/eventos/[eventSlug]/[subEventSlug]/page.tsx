"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getSubEventoBySlugs } from "FotosMony/lib/mock-data";
import { formatPartidoTitle } from "FotosMony/lib/formatters";

export default function SubEventoPage() {
  const params = useParams<{ eventSlug: string; subEventSlug: string }>();
  const eventSlug = params?.eventSlug;
  const subEventSlug = params?.subEventSlug;

  const { evento, subEvento } = useMemo(
    () => getSubEventoBySlugs(eventSlug, subEventSlug),
    [eventSlug, subEventSlug]
  );

  if (!evento || !subEvento) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-slate-900">Subevento no encontrado</h1>
      </main>
    );
  }

  const fotos = subEvento.fotos;

  const [selected, setSelected] = useState<string[]>([]);
  const togglePhoto = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const getPlaceholderUrl = (id: string) => `https://picsum.photos/seed/${id}/800/1000`;

  const total = fotos.length;
  const count = selected.length;

  const handleAddToCart = () => {
    console.log("Agregar al carrito:", selected);
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <div className="mb-2 text-sm text-slate-600">
          <Link className="hover:underline" href="/eventos">Eventos</Link>
          <span> / </span>
          <Link className="hover:underline" href={`/eventos/${evento.slug}`}>{evento.nombre}</Link>
          <span> / </span>
          <span className="text-slate-900">{formatPartidoTitle(subEvento)}</span>
        </div>

        <h1 className="text-2xl font-semibold text-slate-900">{formatPartidoTitle(subEvento)}</h1>
        <p className="mt-1 text-sm text-slate-600">Selecciona las fotos que quieras comprar.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {fotos.map((foto) => (
          <div
            key={foto.id}
            onClick={() => togglePhoto(foto.id)}
            className={`relative cursor-pointer overflow-hidden rounded-xl border-4 shadow-md shadow-black/10 transition hover:shadow-xl ${
              selected.includes(foto.id) ? "border-blue-500" : "border-transparent"
            }`}
          >
            <img src={getPlaceholderUrl(foto.id)} alt="Preview" className="h-auto w-full object-cover" />

            {selected.includes(foto.id) && (
              <div className="absolute right-2 top-2 rounded-full bg-blue-500 px-2 py-1 text-xs font-semibold text-white">
                ✓
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="fixed bottom-6 right-6 z-50">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={count === 0}
          className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold shadow-lg transition ${
            count === 0 ? "cursor-not-allowed bg-slate-300 text-slate-600" : "bg-slate-900 text-white hover:bg-slate-800"
          }`}
        >
          <span className="rounded-xl bg-white/10 px-2 py-1 text-xs font-bold">
            {count}/{total}
          </span>
          <span>Agregar al carrito</span>
        </button>
      </div>
    </main>
  );
}
