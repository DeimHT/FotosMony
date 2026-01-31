"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";

type SearchResult = {
  eventos: { id: string; nombre: string; slug: string; url: string }[];
  subeventos: { id: string; nombre: string; slug: string; url: string }[];
  servicios: { id: string; title: string; url: string }[];
  portafolio: { id: string; nombre: string; url: string }[];
};

function BuscarContent() {
  const searchParams = useSearchParams();
  const q = (searchParams.get("q") ?? "").trim();

  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (q.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          setResults(null);
        } else {
          setResults(data);
        }
      })
      .catch(() => {
        setError("Error al buscar");
        setResults(null);
      })
      .finally(() => setLoading(false));
  }, [q]);

  const total =
    results
      ? results.eventos.length +
        results.subeventos.length +
        results.servicios.length +
        results.portafolio.length
      : 0;

  if (q.length < 2) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-semibold text-slate-900">Buscar</h1>
        <p className="mt-2 text-slate-600">
          Escribe al menos 2 caracteres en el buscador del encabezado y pulsa Enter o la lupa para ver resultados.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold text-slate-900">Resultados de búsqueda</h1>
      <p className="mt-1 text-slate-600">
        {loading ? "Buscando…" : total === 0 ? `Sin resultados para "${q}"` : `${total} resultado${total !== 1 ? "s" : ""} para "${q}"`}
      </p>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading && (
        <div className="mt-8 flex justify-center">
          <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
        </div>
      )}

      {!loading && results && total > 0 && (
        <div className="mt-8 space-y-8">
          {results.eventos.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Eventos</h2>
              <ul className="mt-3 space-y-2">
                {results.eventos.map((e) => (
                  <li key={e.id}>
                    <Link
                      href={e.url}
                      className="block rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                    >
                      <span className="font-medium">{e.nombre}</span>
                      <span className="ml-2 text-sm text-slate-500">→ Ver evento</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {results.subeventos.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Subeventos</h2>
              <ul className="mt-3 space-y-2">
                {results.subeventos.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={s.url}
                      className="block rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                    >
                      <span className="font-medium">{s.nombre}</span>
                      <span className="ml-2 text-sm text-slate-500">→ Ver subevento</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {results.servicios.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Servicios</h2>
              <ul className="mt-3 space-y-2">
                {results.servicios.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={s.url}
                      className="block rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                    >
                      <span className="font-medium">{s.title}</span>
                      <span className="ml-2 text-sm text-slate-500">→ Ver servicios</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {results.portafolio.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Portafolio</h2>
              <ul className="mt-3 space-y-2">
                {results.portafolio.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={p.url}
                      className="block rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                    >
                      <span className="font-medium">{p.nombre}</span>
                      <span className="ml-2 text-sm text-slate-500">→ Ver carpeta</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </main>
  );
}

export default function BuscarPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-3xl px-4 py-12">
          <h1 className="text-2xl font-semibold text-slate-900">Buscar</h1>
          <p className="mt-2 text-slate-600">Cargando…</p>
        </main>
      }
    >
      <BuscarContent />
    </Suspense>
  );
}
