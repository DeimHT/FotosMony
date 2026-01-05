"use client";

import { useState } from "react";
import { MOCK_EVENTO } from "FotosMony/lib/mock-data";

export default function EventoPage() {
  const [selected, setSelected] = useState<string[]>([]);

  const togglePhoto = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const getPlaceholderUrl = (id: string) =>
    `https://picsum.photos/seed/${id}/800/1000`;

  const total = MOCK_EVENTO.fotos.length;
  const count = selected.length;

  const handleAddToCart = () => {
    // Aquí después conectas con tu carrito real (context, zustand, etc.)
    console.log("Agregar al carrito:", selected);
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          {MOCK_EVENTO.nombre ?? "Evento"}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Selecciona las fotos que quieras comprar.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {MOCK_EVENTO.fotos.map((foto) => (
          <div
            key={foto.id}
            onClick={() => togglePhoto(foto.id)}
            className={`relative cursor-pointer overflow-hidden rounded-xl border-4 shadow-md shadow-black/10 transition hover:shadow-xl ${
              selected.includes(foto.id) ? "border-blue-500" : "border-transparent"
            }`}
          >
            <img
              src={getPlaceholderUrl(foto.id)}
              alt="Preview"
              className="h-auto w-full object-cover"
            />

            {selected.includes(foto.id) && (
              <div className="absolute right-2 top-2 rounded-full bg-blue-500 px-2 py-1 text-xs font-semibold text-white">
                ✓
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Botón flotante (esquina inferior derecha) */}
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

          {/* icono carrito simple */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M6 7h15l-2 8H8L6 7z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M6 7 5 4H2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M9 20a1 1 0 100-2 1 1 0 000 2zm9 0a1 1 0 100-2 1 1 0 000 2z"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </button>
      </div>
    </main>
  );
}
