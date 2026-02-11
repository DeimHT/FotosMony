import { NextRequest, NextResponse } from "next/server";

/**
 * Webpay redirige aquí (GET o POST).
 * - token_ws: pago completado → confirmar.
 * - TBK_TOKEN: usuario canceló / error en formulario + reintentar → no commit, mostrar mensaje amigable.
 * - Solo TBK_ID_SESION y/o TBK_ORDEN_COMRA (sin token): timeout 5 min según doc Webpay → mismo mensaje amigable.
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const tokenWs = params.get("token_ws")?.trim() ?? null;
  const tbkToken = params.get("TBK_TOKEN")?.trim() ?? params.get("tbk_token")?.trim() ?? null;
  const tbkIdSesion = params.get("TBK_ID_SESION")?.trim() ?? params.get("tbk_id_sesion")?.trim() ?? null;
  const tbkOrdenCompra = params.get("TBK_ORDEN_COMRA")?.trim() ?? params.get("TBK_ORDEN_COMPRA")?.trim() ?? null;

  if (tbkToken) {
    console.log("[Webpay] Cancelación/error formulario. TBK_TOKEN:", tbkToken);
  } else if (tbkIdSesion || tbkOrdenCompra) {
    console.log("[Webpay] Retorno sin token (timeout 5 min o similar). TBK_ID_SESION:", tbkIdSesion, "TBK_ORDEN_COMRA:", tbkOrdenCompra);
  }

  const base = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL ?? "http://localhost:3000";
  const baseUrl = base.startsWith("http") ? base : `https://${base}`;
  const tieneTokenExito = !!tokenWs;
  const retornoSinCompletar = !!tbkToken || !!tbkIdSesion || !!tbkOrdenCompra;
  let redirect: string;
  if (tieneTokenExito) {
    redirect = `${baseUrl}/carrito/confirmar?token_ws=${encodeURIComponent(tokenWs!)}`;
  } else if (retornoSinCompletar) {
    redirect = `${baseUrl}/carrito/confirmar?cancelado=1`;
  } else {
    redirect = `${baseUrl}/carrito/confirmar`;
  }
  return NextResponse.redirect(redirect, 302);
}

function getStr(val: unknown): string | null {
  return typeof val === "string" && val.trim() ? val.trim() : null;
}
function getForm(form: FormData, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = form.get(k)?.toString()?.trim();
    if (v) return v;
  }
  return null;
}

export async function POST(req: NextRequest) {
  let tokenWs: string | null = null;
  let tbkToken: string | null = null;
  let tbkIdSesion: string | null = null;
  let tbkOrdenCompra: string | null = null;
  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = (await req.json()) as Record<string, unknown>;
      tokenWs = getStr(body.token_ws);
      tbkToken = getStr(body.TBK_TOKEN) ?? getStr(body.tbk_token);
      tbkIdSesion = getStr(body.TBK_ID_SESION) ?? getStr(body.tbk_id_sesion);
      tbkOrdenCompra = getStr(body.TBK_ORDEN_COMRA) ?? getStr(body.TBK_ORDEN_COMPRA);
    } else {
      const form = await req.formData();
      tokenWs = getForm(form, "token_ws");
      tbkToken = getForm(form, "TBK_TOKEN", "tbk_token");
      tbkIdSesion = getForm(form, "TBK_ID_SESION", "tbk_id_sesion");
      tbkOrdenCompra = getForm(form, "TBK_ORDEN_COMRA", "TBK_ORDEN_COMPRA", "tbk_orden_compra");
    }
  } catch {
    // ignore
  }

  if (tbkToken) {
    console.log("[Webpay] Cancelación/error formulario. TBK_TOKEN:", tbkToken);
  } else if (tbkIdSesion || tbkOrdenCompra) {
    console.log("[Webpay] Retorno sin token (timeout 5 min o similar). TBK_ID_SESION:", tbkIdSesion, "TBK_ORDEN_COMRA:", tbkOrdenCompra);
  }

  const base = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL ?? "http://localhost:3000";
  const baseUrl = base.startsWith("http") ? base : `https://${base}`;
  const tieneTokenExito = !!tokenWs;
  const retornoSinCompletar = !!tbkToken || !!tbkIdSesion || !!tbkOrdenCompra;
  let redirect: string;
  if (tieneTokenExito) {
    redirect = `${baseUrl}/carrito/confirmar?token_ws=${encodeURIComponent(tokenWs ?? "")}`;
  } else if (retornoSinCompletar) {
    redirect = `${baseUrl}/carrito/confirmar?cancelado=1`;
  } else {
    redirect = `${baseUrl}/carrito/confirmar`;
  }
  return NextResponse.redirect(redirect, 302);
}
