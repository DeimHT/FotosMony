"use client";

import { useEffect, useState } from "react";
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
  storage_provider?: string | null;
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

import { watermarkUrl } from "FotosMony/lib/cloudinaryUrl";
import { GalleryPagination } from "FotosMony/components/ui/GalleryPagination";
import { GalleryLightbox } from "FotosMony/components/ui/GalleryLightbox";

const PAGE_SIZE = 24;

export default function SubEventoPage() {
  const params = useParams<{ eventSlug: string; subEventSlug: string }>();
  const router = useRouter();
  const eventSlug = params?.eventSlug;
  const subEventSlug = params?.subEventSlug;
  const { addItems } = useCart();

  const [loading, setLoading] = useState(true);
  const [evento, setEvento] = useState<Evento | null>(null);
  const [subEvento, setSubEvento] = useState<SubEvento | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

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
          fotos ( id, public_id, precio, nombre_archivo, storage_provider )
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

  useEffect(() => {
    setPage(1);
  }, [subEvento?.id]);

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
  const totalPages = Math.max(1, Math.ceil(fotos.length / PAGE_SIZE));
  const paginatedFotos = fotos.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
        subEventoNombre: subEvento.nombre,
        subEventSlug: subEvento.slug,
        nombreArchivo: f.nombre_archivo ?? undefined,
        storageProvider: f.storage_provider === "cloudflare" ? "cloudflare" : f.storage_provider === "supabase" ? "supabase" : "cloudinary",
      }));
    addItems(toAdd);
    setSelected([]);
    router.push("/carrito");
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
        <>
        <div className="columns-2 gap-4 md:columns-4">
          {paginatedFotos.map((foto) => {
            const storage = foto.storage_provider === "cloudflare" || foto.storage_provider === "supabase" ? foto.storage_provider : "cloudinary";
            return (
            <div
              key={foto.id}
              onClick={() => togglePhoto(foto.id)}
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              className={`group select-none relative mb-4 break-inside-avoid cursor-pointer overflow-hidden rounded-xl border-4 shadow-md shadow-black/10 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-black/20 ${
                selected.includes(foto.id)
                  ? "border-blue-500"
                  : "border-transparent"
              }`}
            >
              <img
                src={watermarkUrl(foto.public_id, 600, storage)}
                alt="Preview"
                className="block w-full h-auto pointer-events-none"
                loading="lazy"
                draggable={false}
              />

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxSrc(watermarkUrl(foto.public_id, 1200, storage));
                }}
                className="absolute right-2 bottom-2 rounded-full bg-white/95 p-1.5 text-slate-700 shadow-md opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:bg-white hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-1 focus:ring-offset-slate-200"
                title="Ver más grande"
                aria-label="Ver más grande"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                  <path d="M11 8v6" />
                  <path d="M8 11h6" />
                </svg>
              </button>

              {selected.includes(foto.id) && (
                <div className="absolute right-2 top-2 rounded-full bg-blue-500 px-2 py-1 text-xs font-semibold text-white">
                  ✓
                </div>
              )}
            </div>
          );
          })}
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

      {lightboxSrc && (
        <GalleryLightbox
          src={lightboxSrc}
          alt="Vista ampliada"
          onClose={() => setLightboxSrc(null)}
        />
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
              : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 ring-2 ring-blue-400/30"
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
