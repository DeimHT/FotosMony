import { NextRequest, NextResponse } from "next/server";

/**
 * Webpay redirige aquí (GET o POST) con token_ws (pago completado) o TBK_TOKEN (usuario canceló).
 * Con token_ws → /carrito/confirmar. Con TBK_TOKEN no se confirma la compra (no commit).
 */
export async function GET(req: NextRequest) {
  const tokenWs = req.nextUrl.searchParams.get("token_ws");
  const tbkToken = req.nextUrl.searchParams.get("TBK_TOKEN");
  const tbkIdSesion = req.nextUrl.searchParams.get("TBK_ID_SESION");
  const tbkOrdenCompra = req.nextUrl.searchParams.get("TBK_ORDEN_COMRA");

  if (tbkToken) {
    console.log("[Webpay] Transacción cancelada por el usuario. TBK_TOKEN:", tbkToken);
    if (tbkIdSesion) console.log("[Webpay] TBK_ID_SESION:", tbkIdSesion);
    if (tbkOrdenCompra) console.log("[Webpay] TBK_ORDEN_COMRA:", tbkOrdenCompra);
  }

  const base = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL ?? "http://localhost:3000";
  const baseUrl = base.startsWith("http") ? base : `https://${base}`;
  const redirect = tokenWs
    ? `${baseUrl}/carrito/confirmar?token_ws=${encodeURIComponent(tokenWs)}`
    : `${baseUrl}/carrito/confirmar`;
  return NextResponse.redirect(redirect, 302);
}

export async function POST(req: NextRequest) {
  let tokenWs: string | null = null;
  let tbkToken: string | null = null;
  let tbkIdSesion: string | null = null;
  let tbkOrdenCompra: string | null = null;
  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      tokenWs = typeof body.token_ws === "string" ? body.token_ws.trim() : null;
      tbkToken = typeof body.TBK_TOKEN === "string" ? body.TBK_TOKEN.trim() : null;
      tbkIdSesion = typeof body.TBK_ID_SESION === "string" ? body.TBK_ID_SESION.trim() : null;
      tbkOrdenCompra = typeof body.TBK_ORDEN_COMRA === "string" ? body.TBK_ORDEN_COMRA.trim() : null;
    } else {
      const form = await req.formData();
      tokenWs = form.get("token_ws")?.toString()?.trim() ?? null;
      tbkToken = form.get("TBK_TOKEN")?.toString()?.trim() ?? null;
      tbkIdSesion = form.get("TBK_ID_SESION")?.toString()?.trim() ?? null;
      tbkOrdenCompra = form.get("TBK_ORDEN_COMRA")?.toString()?.trim() ?? null;
    }
  } catch {
    // ignore
  }

  if (tbkToken) {
    console.log("[Webpay] Transacción cancelada por el usuario. TBK_TOKEN:", tbkToken);
    if (tbkIdSesion) console.log("[Webpay] TBK_ID_SESION:", tbkIdSesion);
    if (tbkOrdenCompra) console.log("[Webpay] TBK_ORDEN_COMRA:", tbkOrdenCompra);
  }

  const base = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL ?? "http://localhost:3000";
  const baseUrl = base.startsWith("http") ? base : `https://${base}`;
  const redirect = tokenWs
    ? `${baseUrl}/carrito/confirmar?token_ws=${encodeURIComponent(tokenWs)}`
    : `${baseUrl}/carrito/confirmar`;
  return NextResponse.redirect(redirect, 302);
}
