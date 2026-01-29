"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "FotosMony/lib/supabaseClient";

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
};

function cldUrl(publicId: string, w = 800) {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_${w}/${publicId}`;
}

export default function SubEventoPage() {
  const params = useParams<{ eventSlug: string; subEventSlug: string }>();
  const eventSlug = params?.eventSlug;
  const subEventSlug = params?.subEventSlug;

  const [loading, setLoading] = useState(true);
  const [evento, setEvento] = useState<Evento | null>(null);
  const [subEvento, setSubEvento] = useState<SubEvento | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  // cargar evento + subevento desde DB
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!eventSlug || !subEventSlug) return;

      setLoading(true);
      setErrorMsg(null);

      // 1️⃣ buscar evento por slug
      const { data: ev, error: evErr } = await supabase
        .from("eventos")
        .select("id, nombre, slug")
        .eq("slug", eventSlug)
        .maybeSingle();

      if (evErr || !ev) {
        if (mounted) {
          setErrorMsg("Evento no encontrado");
          setLoading(false);
        }
        return;
      }

      // 2️⃣ buscar subevento asociado a ese evento
      const { data: sub, error: subErr } = await supabase
        .from("sub_eventos")
        .select(
          `
          id,
          nombre,
          slug,
          fotos ( id, public_id, precio )
        `
        )
        .eq("slug", subEventSlug)
        .eq("evento_id", ev.id)
        .maybeSingle();

      if (!mounted) return;

      if (subErr || !sub) {
        setErrorMsg("Subevento no encontrado");
        setEvento(ev);
        setSubEvento(null);
      } else {
        setEvento(ev);
        setSubEvento(sub as SubEvento);
      }

      setLoading(false);
    };

    load();

    return () => {
      mounted = false;
    };
  }, [eventSlug, subEventSlug]);

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

  if (!evento || !subEvento) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-slate-900">
          Subevento no encontrado
        </h1>
      </main>
    );
  }

  const fotos = subEvento.fotos ?? [];

  
  const togglePhoto = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const total = fotos.length;
  const count = selected.length;

  const handleAddToCart = () => {
    console.log("Agregar al carrito:", selected);
    // siguiente paso: carrito real
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className="mb-2 text-sm text-slate-600">
          <Link className="hover:underline" href="/eventos">
            Eventos
          </Link>
          <span> / </span>
          <Link className="hover:underline" href={`/eventos/${evento.slug}`}>
            {evento.nombre}
          </Link>
          <span> / </span>
          <span className="text-slate-900">{subEvento.nombre}</span>
        </div>

        <h1 className="text-2xl font-semibold text-slate-900">
          {subEvento.nombre}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Selecciona las fotos que quieras comprar.
        </p>
      </div>

      {fotos.length === 0 ? (
        <div className="rounded-2xl border bg-white p-6 text-sm text-slate-700">
          Aún no hay fotos cargadas para este subevento.
        </div>
      ) : (
        <div className="columns-2 gap-4 md:columns-4">
          {fotos.map((foto) => (
            <div
              key={foto.id}
              onClick={() => togglePhoto(foto.id)}
              className={`mb-4 break-inside-avoid cursor-pointer overflow-hidden rounded-xl border-4 shadow-md shadow-black/10 transition hover:shadow-xl ${
                selected.includes(foto.id)
                  ? "border-blue-500"
                  : "border-transparent"
              }`}
            >
              <img
                src={cldUrl(foto.public_id, 800)}
                alt="Preview"
                className="block w-full h-auto"
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

      {/* Botón carrito */}
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
        </button>
      </div>
    </main>
  );
}
