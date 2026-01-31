"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useCart } from "FotosMony/components/context/CartContext";
import { supabase } from "FotosMony/lib/supabaseClient";
import type { CartItem } from "FotosMony/lib/cart";

function cldUrl(publicId: string, w = 400) {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_${w}/${publicId}`;
}

// Número solo dígitos (ej. 56912345678). Si no está configurado, el enlace puede fallar en wa.me
const whatsappDigits = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");
const WHATSAPP_BASE =
  whatsappDigits.length >= 9 ? `https://wa.me/${whatsappDigits}` : "https://wa.me/56900000000";

const WEBPAY_ENABLED = process.env.NEXT_PUBLIC_WEBPAY_ENABLED === "true";
const money = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

function CartRow({
  item,
  onRemove,
}: {
  item: CartItem;
  onRemove: (fotoId: string) => void;
}) {
  return (
    <div className="flex gap-4 rounded-xl border bg-white p-4">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border bg-slate-100">
        <img
          src={cldUrl(item.publicId, 200)}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900">
          {item.subEventoNombre
            ? `${item.eventoNombre} · ${item.subEventoNombre}`
            : item.eventoNombre}
        </p>
        <p className="mt-0.5 text-sm text-slate-600">
          Foto digital sin marca de agua
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-900">
          {money.format(item.precio)}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onRemove(item.fotoId)}
        className="self-start rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
        aria-label="Quitar del carrito"
      >
        Quitar
      </button>
    </div>
  );
}

export default function CarritoPage() {
  const { items, totalCount, totalPrice, removeItem, clearCart } = useCart();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [webpayPending, setWebpayPending] = useState<{ url: string; token: string } | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setIsLoggedIn(!!session?.user);
      setLoadingAuth(false);
    });
  }, []);

  useEffect(() => {
    if (!webpayPending || !formRef.current) return;
    formRef.current.submit();
  }, [webpayPending]);

  const handlePagarWebpay = async () => {
    if (items.length === 0) return;
    if (!isLoggedIn && (!guestName.trim() || !guestEmail.trim())) {
      setCheckoutError("Indica tu nombre y correo para continuar.");
      return;
    }
    setCheckoutError(null);
    setCheckoutLoading(true);

    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      const session = (await supabase.auth.getSession()).data.session;
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers,
        body: JSON.stringify({
          items,
          ...(isLoggedIn ? {} : { guestName: guestName.trim(), guestEmail: guestEmail.trim() }),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCheckoutError(data?.error ?? "No se pudo iniciar el pago");
        setCheckoutLoading(false);
        return;
      }

      setWebpayPending({ url: data.webpayUrl, token: data.webpayToken });
    } catch (e) {
      setCheckoutError("Error de conexión. Intenta de nuevo.");
      setCheckoutLoading(false);
    }
  };

  const whatsappLines = [
    `Hola FotosMony, quiero comprar ${totalCount} foto(s) del carrito. Total: ${money.format(totalPrice)}. Por favor confirmar disponibilidad y forma de pago.`,
    "",
    "Detalle:",
    ...items.map((item) => {
      const evento = item.eventoNombre;
      const subevento = item.subEventoNombre ? ` · ${item.subEventoNombre}` : "";
      const nombreFoto =
        item.nombreArchivo ||
        (item.publicId.includes("/") ? item.publicId.split("/").pop() : item.publicId);
      return `• Evento: ${evento}${subevento}. Foto: ${nombreFoto} (${money.format(item.precio)})`;
    }),
  ];
  const whatsappText = encodeURIComponent(whatsappLines.join("\n"));
  const whatsappUrl = `${WHATSAPP_BASE}?text=${whatsappText}`;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Carrito</h1>
        <p className="mt-1 text-sm text-slate-600">
          Fotos seleccionadas para comprar (entrega digital sin marca de agua).
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border bg-white p-8 text-center">
          <p className="text-slate-600">No hay fotos en el carrito.</p>
          <Link
            href="/eventos"
            className="mt-4 inline-block rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Ver eventos
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {items.map((item) => (
              <CartRow key={item.fotoId} item={item} onRemove={removeItem} />
            ))}
          </div>

          <div className="mt-8 rounded-2xl border bg-white p-6">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">
                {totalCount} foto{totalCount !== 1 ? "s" : ""}
              </span>
              <span className="text-xl font-semibold text-slate-900">
                {money.format(totalPrice)}
              </span>
            </div>

            {!loadingAuth && !isLoggedIn && (
              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <p className="text-sm font-semibold text-slate-900">Comprar como invitado</p>
                <p className="mt-1 text-xs text-slate-600">
                  Indica tu nombre y correo para recibir las fotos después del pago.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="guest-name" className="sr-only">Nombre</label>
                    <input
                      id="guest-name"
                      type="text"
                      placeholder="Nombre"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="guest-email" className="sr-only">Correo</label>
                    <input
                      id="guest-email"
                      type="email"
                      placeholder="Correo electrónico"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {checkoutError && (
              <p className="mt-4 text-sm font-medium text-red-600">{checkoutError}</p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              {WEBPAY_ENABLED ? (
                <button
                  type="button"
                  onClick={handlePagarWebpay}
                  disabled={checkoutLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {checkoutLoading ? "Redirigiendo a Webpay…" : "Pagar con Webpay"}
                </button>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm text-slate-500">
                  Pago con Webpay temporalmente no disponible
                </span>
              )}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-600 bg-green-50 px-5 py-3 text-sm font-semibold text-green-700 hover:bg-green-100"
              >
                Solicitar por WhatsApp
              </a>
              <button
                type="button"
                onClick={clearCart}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Vaciar carrito
              </button>
            </div>
          </div>

          {webpayPending && (
            <form
              ref={formRef}
              method="POST"
              action={webpayPending.url}
              className="hidden"
            >
              <input type="hidden" name="token_ws" value={webpayPending.token} />
            </form>
          )}
        </>
      )}
    </main>
  );
}
