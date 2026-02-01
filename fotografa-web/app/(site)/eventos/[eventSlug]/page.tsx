"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "FotosMony/components/context/CartContext";
import type { CartItem } from "FotosMony/lib/cart";
import { supabase } from "FotosMony/lib/supabaseClient";

type Foto = {
  id: string;
  public_id: string;
  precio: number;
  nombre_archivo?: string | null;
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

import { cldUrlWithWatermark } from "FotosMony/lib/cloudinaryUrl";

export default function EventoPage() {
  const params = useParams<{ eventSlug: string }>();
  const router = useRouter();
  const eventSlug = params?.eventSlug;
  const { addItems } = useCart();

  const [loading, setLoading] = useState(true);
  const [evento, setEvento] = useState<Evento | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [subeventoFilter, setSubeventoFilter] = useState("");

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
          fotos ( id, public_id, precio, nombre_archivo ),
          sub_eventos (
            id,
            nombre,
            slug,
            fotos ( id, public_id, precio, nombre_archivo )
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

  const subs = evento?.sub_eventos ?? [];
  const filteredSubs = useMemo(() => {
    if (!subeventoFilter.trim()) return subs;
    const q = subeventoFilter.trim().toLowerCase();
    return subs.filter(
      (s) =>
        s.nombre.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q)
    );
  }, [subs, subeventoFilter]);

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
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">{evento.nombre}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Selecciona un subevento para ver la galería.
          </p>
        </div>

        {subs.length > 0 && (
          <div className="mb-6">
            <label htmlFor="subevento-filter-public" className="sr-only">
              Buscar subevento por nombre
            </label>
            <input
              id="subevento-filter-public"
              type="text"
              placeholder="Buscar subevento por nombre…"
              value={subeventoFilter}
              onChange={(e) => setSubeventoFilter(e.target.value)}
              className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredSubs.length === 0 ? (
            <p className="col-span-full rounded-2xl border bg-white p-6 text-sm text-slate-600">
              {subeventoFilter.trim()
                ? `Ningún subevento coincide con "${subeventoFilter.trim()}".`
                : "No hay subeventos."}
            </p>
          ) : (
          filteredSubs.map((s) => {
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
          })
          )}
        </div>
      </main>
    );
  }

  // ✅ Caso 2: Evento sin subeventos => galería
  const fotos = evento.fotos ?? [];

  const togglePhoto = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const total = fotos.length;
  const count = selected.length;

  const handleAddToCart = () => {
    const toAdd: CartItem[] = fotos
      .filter((f) => selected.includes(f.id))
      .map((f) => ({
        fotoId: f.id,
        publicId: f.public_id,
        precio: f.precio,
        eventoNombre: evento.nombre,
        eventSlug: evento.slug,
        nombreArchivo: f.nombre_archivo ?? undefined,
      }));
    addItems(toAdd);
    setSelected([]);
    router.push("/carrito");
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
                src={cldUrlWithWatermark(foto.public_id, 600, 'auto:eco')}
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
              : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 ring-2 ring-blue-400/30"
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
