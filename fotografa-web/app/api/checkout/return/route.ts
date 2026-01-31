import { NextRequest, NextResponse } from "next/server";

/**
 * Webpay redirige aquí (GET o POST) con token_ws.
 * Redirigimos al usuario a /carrito/confirmar?token_ws=xxx para que la página
 * cliente lea el token y llame a /api/checkout/confirm.
 */
export async function GET(req: NextRequest) {
  const tokenWs = req.nextUrl.searchParams.get("token_ws");
  const base = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL ?? "http://localhost:3000";
  const baseUrl = base.startsWith("http") ? base : `https://${base}`;
  const redirect = tokenWs
    ? `${baseUrl}/carrito/confirmar?token_ws=${encodeURIComponent(tokenWs)}`
    : `${baseUrl}/carrito/confirmar`;
  return NextResponse.redirect(redirect, 302);
}

export async function POST(req: NextRequest) {
  let tokenWs: string | null = null;
  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      tokenWs = typeof body.token_ws === "string" ? body.token_ws.trim() : null;
    } else {
      const form = await req.formData();
      tokenWs = form.get("token_ws")?.toString()?.trim() ?? null;
    }
  } catch {
    // ignore
  }
  const base = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL ?? "http://localhost:3000";
  const baseUrl = base.startsWith("http") ? base : `https://${base}`;
  const redirect = tokenWs
    ? `${baseUrl}/carrito/confirmar?token_ws=${encodeURIComponent(tokenWs)}`
    : `${baseUrl}/carrito/confirmar`;
  return NextResponse.redirect(redirect, 302);
}
