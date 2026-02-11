"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "FotosMony/lib/supabaseClient";

type Foto = { id: string; public_id: string; storage_provider?: string | null };
type Carpeta = { id: string; nombre: string; descripcion?: string | null; fotos: Foto[] };

const R2_BASE = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "").replace(/\/$/, "");
function fotoUrl(foto: Foto, w = 600): string {
  if (foto.storage_provider === "cloudflare" && R2_BASE) {
    return `${R2_BASE}/${foto.public_id}`;
  }
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto:eco,w_${w}/${foto.public_id}`;
}

export default function PortafolioPage() {
  const [carpetas, setCarpetas] = useState<Carpeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setErrorMsg(null);

      const { data, error } = await supabase
        .from("carpetas")
        .select("id, nombre, descripcion, fotos ( id, public_id, storage_provider )")
        .order("id", { ascending: false });

      if (!mounted) return;

      if (error) {
        setErrorMsg(error.message);
        setCarpetas([]);
      } else {
        setCarpetas((data as Carpeta[]) ?? []);
      }

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
          <h1 className="text-2xl font-semibold text-slate-900">Portafolio</h1>
          <p className="mt-1 text-sm text-slate-600">Cargando…</p>
        </div>
      </main>
    );
  }

  if (errorMsg) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Portafolio</h1>
          <p className="mt-2 text-sm text-red-600">{errorMsg}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Portafolio</h1>
        <p className="mt-1 text-sm text-slate-600">
          Colección de trabajos realizados. Entra a cada carpeta para ver la galería.
        </p>
      </div>

      {carpetas.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-600">
          Aún no hay carpetas en el portafolio.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {carpetas.map((carpeta) => {
            const totalFotos = carpeta.fotos?.length ?? 0;
            const portadaFoto = carpeta.fotos?.[0];
            const coverUrl = portadaFoto
              ? fotoUrl(portadaFoto, 600)
              : "https://picsum.photos/seed/portafolio/600/400";

            return (
              <article
                key={carpeta.id}
                className="overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="relative aspect-[16/10] w-full">
                  <Link href={`/portafolio/${carpeta.id}`} className="block h-full w-full">
                    <Image
                      src={coverUrl}
                      alt={`Portada ${carpeta.nombre}`}
                      fill
                      className="object-cover"
                      loading="lazy"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </Link>
                </div>

                <div className="p-5">
                  <h2 className="text-lg font-semibold text-slate-900">{carpeta.nombre}</h2>
                  {carpeta.descripcion && (
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                      {carpeta.descripcion}
                    </p>
                  )}
                  <p className="mt-2 text-sm text-slate-500">
                    {totalFotos} {totalFotos === 1 ? "foto" : "fotos"}
                  </p>

                  <div className="mt-5">
                    <Link
                      href={`/portafolio/${carpeta.id}`}
                      className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Ver galería
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
