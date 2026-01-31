"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCart } from "FotosMony/components/context/CartContext";

function ConfirmarContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const tokenWs = searchParams.get("token_ws");
    if (!tokenWs) {
      setStatus("error");
      setErrorMsg("No se recibió el token de Webpay.");
      return;
    }

    let mounted = true;

    (async () => {
      try {
        const res = await fetch("/api/checkout/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token_ws: tokenWs }),
        });
        const data = await res.json();

        if (!mounted) return;

        if (data.success) {
          clearCart();
          setStatus("success");
        } else {
          setStatus("error");
          setErrorMsg(data?.error ?? "El pago no pudo ser confirmado.");
        }
      } catch (e) {
        if (!mounted) return;
        setStatus("error");
        setErrorMsg(e instanceof Error ? e.message : "Error al confirmar el pago.");
      }
    })();

    return () => {
      mounted = false;
    };
  }, [searchParams, clearCart]);

  if (status === "loading") {
    return (
      <div className="rounded-2xl border bg-white p-8 text-center">
        <p className="text-slate-600">Confirmando tu pago…</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50/50 p-8 text-center">
        <h2 className="text-xl font-semibold text-green-900">Pago exitoso</h2>
        <p className="mt-2 text-slate-700">
          Te enviamos las fotos originales (sin marca de agua) al correo que indicaste.
          Revisa tu bandeja de entrada y spam.
        </p>
        <Link
          href="/eventos"
          className="mt-6 inline-block rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Ver más eventos
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50/50 p-8 text-center">
      <h2 className="text-xl font-semibold text-red-900">Pago no completado</h2>
      <p className="mt-2 text-slate-700">{errorMsg}</p>
      <Link
        href="/carrito"
        className="mt-6 inline-block rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Volver al carrito
      </Link>
    </div>
  );
}

export default function CarritoConfirmarPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Confirmación de pago</h1>
      <Suspense fallback={<div className="rounded-2xl border bg-white p-8 text-center text-slate-600">Cargando…</div>}>
        <ConfirmarContent />
      </Suspense>
    </main>
  );
}
