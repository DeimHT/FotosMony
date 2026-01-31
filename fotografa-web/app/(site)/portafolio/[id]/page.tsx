"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "FotosMony/lib/supabaseClient";

type Foto = { id: string; public_id: string };
type Carpeta = { id: string; nombre: string; descripcion?: string | null; fotos?: Foto[] };

function cldUrl(publicId: string, w = 800) {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_${w}/${publicId}`;
}

export default function PortafolioCarpetaPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [carpeta, setCarpeta] = useState<Carpeta | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!id) return;

      setLoading(true);
      setErrorMsg(null);

      const { data, error } = await supabase
        .from("carpetas")
        .select("id, nombre, descripcion, fotos ( id, public_id )")
        .eq("id", id)
        .single();

      if (!mounted) return;

      if (error || !data) {
        setErrorMsg("Carpeta no encontrada");
        setCarpeta(null);
      } else {
        setCarpeta(data as Carpeta);
      }

      setLoading(false);
    };

    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-slate-900">Cargando…</h1>
      </main>
    );
  }

  if (errorMsg || !carpeta) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-slate-900">Portafolio</h1>
        <p className="mt-2 text-sm text-red-600">{errorMsg ?? "Carpeta no encontrada"}</p>
        <Link
          href="/portafolio"
          className="mt-4 inline-block text-sm font-medium text-slate-700 underline hover:text-slate-900"
        >
          Volver al portafolio
        </Link>
      </main>
    );
  }

  const fotos = carpeta.fotos ?? [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <nav className="mb-2 text-sm text-slate-600">
          <Link href="/portafolio" className="hover:underline">
            Portafolio
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900">{carpeta.nombre}</span>
        </nav>
        <h1 className="text-2xl font-semibold text-slate-900">{carpeta.nombre}</h1>
        {carpeta.descripcion && (
          <p className="mt-1 text-slate-600">{carpeta.descripcion}</p>
        )}
      </div>

      {fotos.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
          Esta carpeta aún no tiene fotos.
        </div>
      ) : (
        <div className="columns-2 gap-4 md:columns-3 lg:columns-4">
          {fotos.map((foto) => (
            <div
              key={foto.id}
              className="mb-4 break-inside-avoid overflow-hidden rounded-xl shadow-md shadow-black/10"
            >
              <img
                src={cldUrl(foto.public_id, 800)}
                alt=""
                className="block w-full h-auto"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}

      <div className="mt-8">
        <Link
          href="/portafolio"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          ← Volver al portafolio
        </Link>
      </div>
    </main>
  );
}
