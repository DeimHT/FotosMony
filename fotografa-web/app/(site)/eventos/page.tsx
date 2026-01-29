"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "FotosMony/lib/supabaseClient";

type Foto = {
  id: string;
  public_id: string;
  precio: number;
};

type SubEventoDB = {
  id: string;
  nombre: string;
  slug: string;
  fotos?: Foto[];
};

type EventoDB = {
  id: string;
  nombre: string;
  slug: string;
  fotos?: Foto[]; // fotos directas si no hay subeventos
  sub_eventos?: SubEventoDB[];
};

// Normalizado para usar tu UI actual (subEventos)
type EventoUI = {
  id: string;
  nombre: string;
  slug: string;
  fotos?: Foto[];
  subEventos?: { id: string; nombre: string; slug: string; fotos: Foto[] }[];
};

function cldUrl(publicId: string, w = 1200) {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_${w}/${publicId}`;
}

export default function EventosPage() {
  const [eventos, setEventos] = useState<EventoUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setErrorMsg(null);

      const { data, error } = await supabase
        .from("eventos")
        .select(`
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
        `)
        .order("created_at", { ascending: false });

      if (!mounted) return;

      if (error) {
        setErrorMsg(error.message);
        setEventos([]);
        setLoading(false);
        return;
      }

      const dbRows = (data as EventoDB[]) ?? [];

      // Normaliza nombres para calzar con tu UI actual
      const uiRows: EventoUI[] = dbRows.map((ev) => ({
        id: ev.id,
        nombre: ev.nombre,
        slug: ev.slug,
        fotos: ev.fotos ?? [],
        subEventos: (ev.sub_eventos ?? []).map((s) => ({
          id: s.id,
          nombre: s.nombre,
          slug: s.slug,
          fotos: s.fotos ?? [],
        })),
      }));

      setEventos(uiRows);
      setLoading(false);
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Eventos</h1>
          <p className="mt-1 text-sm text-slate-600">Cargando…</p>
        </div>
      </main>
    );
  }

  if (errorMsg) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Eventos</h1>
          <p className="mt-1 text-sm text-red-600">{errorMsg}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Eventos</h1>
        <p className="mt-1 text-sm text-slate-600">
          Selecciona un evento para ver la galería y comprar fotos.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {eventos.map((evento) => {
          const tieneSubEventos = (evento.subEventos?.length ?? 0) > 0;

          const totalFotos = tieneSubEventos
            ? evento.subEventos!.reduce((acc, s) => acc + (s.fotos?.length ?? 0), 0)
            : (evento.fotos?.length ?? 0);

          // portada: primera foto disponible (subevento o evento)
          const portadaPublicId =
            (tieneSubEventos
              ? evento.subEventos?.[0]?.fotos?.[0]?.public_id
              : evento.fotos?.[0]?.public_id) ?? null;

          const coverUrl = portadaPublicId
            ? cldUrl(portadaPublicId, 1200)
            : `https://picsum.photos/seed/${evento.slug}/1200/800`;

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
