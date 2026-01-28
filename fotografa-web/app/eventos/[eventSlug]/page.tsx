"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "FotosMony/lib/supabaseClient";
import { formatPartidoTitle } from "FotosMony/lib/formatters";

type Foto = {
  id: string;
  public_id: string;
  precio: number;
};

type SubEvento = {
  id: string;
  nombre: string;
  slug: string;
  fotos?: Foto[];
};

type Evento = {
  id: string;
  nombre: string;
  slug: string;
  fotos?: Foto[];
  sub_eventos?: SubEvento[];
};

function cldUrl(publicId: string, w = 800) {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_${w}/${publicId}`;
}

export default function EventoPage() {
  const params = useParams<{ eventSlug: string }>();
  const eventSlug = params?.eventSlug;

  const [loading, setLoading] = useState(true);
  const [evento, setEvento] = useState<Evento | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cargar evento por slug desde DB
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!eventSlug) return;

      setLoading(true);
      setErrorMsg(null);

      const { data, error } = await supabase
        .from("eventos")
        .select(
          `
          id,
          nombre,
          slug,
          fotos ( id, public_id, precio ),
          sub_eventos (
            id,
            nombre,
            slug,
            fotos ( id, public_id, precio )
          )
        `
        )
        .eq("slug", eventSlug)
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        setErrorMsg(error.message);
        setEvento(null);
      } else {
        setEvento((data as Evento) ?? null);
      }

      setLoading(false);
    };

    load();

    return () => {
      mounted = false;
    };
  }, [eventSlug]);

  const tieneSubEventos = useMemo(
    () => (evento?.sub_eventos?.length ?? 0) > 0,
    [evento]
  );

  console.log("eventSlug params =>", eventSlug);

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-slate-900">Cargando…</h1>
      </main>
    );
  }

  if (errorMsg) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-slate-900">Error</h1>
        <p className="mt-2 text-sm text-red-600">{errorMsg}</p>
      </main>
    );
  }

  // Si no existe
  if (!evento) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-slate-900">
          Evento no encontrado
        </h1>
      </main>
    );
  }

  // ✅ Caso 1: Evento con subeventos => listado de subeventos
  if (tieneSubEventos) {
    const subs = evento.sub_eventos ?? [];

    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">{evento.nombre}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Selecciona un subevento para ver la galería.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {subs.map((s) => {
            const countFotos = s.fotos?.length ?? 0;
            return (
              <Link
                key={s.id}
                href={`/eventos/${evento.slug}/${s.slug}`}
                className="group rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {s.nombre}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {countFotos} fotos disponibles (con marca de agua)
                    </p>
                  </div>

                  <span className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
                    Ver galería
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    );
  }

  // ✅ Caso 2: Evento sin subeventos => galería
  const fotos = evento.fotos ?? [];

  const [selected, setSelected] = useState<string[]>([]);
  const togglePhoto = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const total = fotos.length;
  const count = selected.length;

  const handleAddToCart = () => {
    console.log("Agregar al carrito:", selected);
    // Luego: guardar en carrito (localStorage o tabla cart_items)
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">{evento.nombre}</h1>
        <p className="mt-1 text-sm text-slate-600">
          Selecciona las fotos que quieras comprar.
        </p>
      </div>

      {fotos.length === 0 ? (
        <div className="rounded-2xl border bg-white p-6 text-sm text-slate-700">
          Aún no hay fotos cargadas para este evento.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {fotos.map((foto) => (
            <div
              key={foto.id}
              onClick={() => togglePhoto(foto.id)}
              className={`relative cursor-pointer overflow-hidden rounded-xl border-4 shadow-md shadow-black/10 transition hover:shadow-xl ${
                selected.includes(foto.id) ? "border-blue-500" : "border-transparent"
              }`}
            >
              <img
                src={cldUrl(foto.public_id, 800)}
                alt="Preview"
                className="h-auto w-full object-cover"
                loading="lazy"
              />

              {selected.includes(foto.id) && (
                <div className="absolute right-2 top-2 rounded-full bg-blue-500 px-2 py-1 text-xs font-semibold text-white">
                  ✓
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="fixed bottom-6 right-6 z-50">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={count === 0}
          className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold shadow-lg transition ${
            count === 0
              ? "cursor-not-allowed bg-slate-300 text-slate-600"
              : "bg-slate-900 text-white hover:bg-slate-800"
          }`}
        >
          <span className="rounded-xl bg-white/10 px-2 py-1 text-xs font-bold">
            {count}/{total}
          </span>

          <span>Agregar al carrito</span>

          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 7h15l-2 8H8L6 7z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M6 7 5 4H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M9 20a1 1 0 100-2 1 1 0 000 2zm9 0a1 1 0 100-2 1 1 0 000 2z" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
      </div>
    </main>
  );
}
