"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "FotosMony/lib/supabaseClient";
import { GalleryPagination } from "FotosMony/components/ui/GalleryPagination";

type Foto = { id: string; public_id: string; storage_provider?: string | null };

const PAGE_SIZE = 24;
type Carpeta = { id: string; nombre: string; descripcion?: string | null; fotos?: Foto[] };

const R2_BASE = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "").replace(/\/$/, "");
function fotoUrl(foto: Foto, w = 600): string {
  if (foto.storage_provider === "cloudflare" && R2_BASE) {
    return `${R2_BASE}/${foto.public_id}`;
  }
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto:eco,w_${w}/${foto.public_id}`;
}

export default function PortafolioCarpetaPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [carpeta, setCarpeta] = useState<Carpeta | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!id) return;

      setLoading(true);
      setErrorMsg(null);

      const { data, error } = await supabase
        .from("carpetas")
        .select("id, nombre, descripcion, fotos ( id, public_id, storage_provider )")
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

  useEffect(() => {
    setPage(1);
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
  const totalPages = Math.max(1, Math.ceil(fotos.length / PAGE_SIZE));
  const paginatedFotos = fotos.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
        <>
        <div className="columns-2 gap-4 md:columns-3 lg:columns-4">
          {paginatedFotos.map((foto) => (
            <div
              key={foto.id}
              className="mb-4 break-inside-avoid overflow-hidden rounded-xl shadow-md shadow-black/10"
            >
              <img
                src={fotoUrl(foto, 600)}
                alt=""
                className="block w-full h-auto"
                loading="lazy"
              />
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
            <GalleryPagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={fotos.length}
              pageSize={PAGE_SIZE}
              onPageChange={(p) => {
                setPage(p);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </div>
        )}
        </>
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
