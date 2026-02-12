import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { webpayCreateTransaction } from "FotosMony/lib/webpay";
import { requireAdmin } from "FotosMony/lib/requireAdmin";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function generateBuyOrder(): string {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 6);
  return `TST${t}${r}`.slice(0, 26);
}

/**
 * POST /api/admin/test-webpay
 * Crea una orden de prueba de 50 CLP y devuelve URL + token para ir a Webpay.
 * Solo admin. Sirve para probar el flujo con tarjeta real sin usar el carrito.
 */
export async function POST(req: Request) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  if (process.env.NEXT_PUBLIC_WEBPAY_ENABLED !== "true") {
    return NextResponse.json(
      { error: "Webpay no está habilitado (NEXT_PUBLIC_WEBPAY_ENABLED)." },
      { status: 503 }
    );
  }

  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE);
    const buyOrder = generateBuyOrder();
    const amount = 50;

    const base = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL ?? "http://localhost:3000";
    const baseUrl = base.startsWith("http") ? base : `https://${base}`;
    const returnUrl = `${baseUrl}/api/checkout/return`;

    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: gate.userId,
        guest_email: null,
        guest_name: null,
        total_clp: amount,
        status: "pending",
        buy_order: buyOrder,
      })
      .select("id")
      .single();

    if (orderErr || !order) {
      console.error("test-webpay create order", orderErr);
      return NextResponse.json(
        { error: orderErr?.message ?? "No se pudo crear la orden de prueba" },
        { status: 500 }
      );
    }

    const webpay = await webpayCreateTransaction({
      buy_order: buyOrder,
      session_id: order.id,
      amount,
      return_url: returnUrl,
    });

    await supabaseAdmin
      .from("orders")
      .update({ webpay_token: webpay.token })
      .eq("id", order.id);

    if (process.env.NODE_ENV === "development") {
      console.log("[Webpay prueba] Token (formulario prueba Transbank):", webpay.token);
    }

    return NextResponse.json({
      orderId: order.id,
      webpayUrl: webpay.url,
      webpayToken: webpay.token,
    });
  } catch (e) {
    console.error("admin test-webpay", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al crear transacción Webpay" },
      { status: 500 }
    );
  }
}
