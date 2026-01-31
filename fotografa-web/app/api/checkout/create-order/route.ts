import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { webpayCreateTransaction } from "FotosMony/lib/webpay";
import type { CartItem } from "FotosMony/lib/cart";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getBearerToken(req: Request): string | null {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1] ?? null;
}

function generateBuyOrder(): string {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 6);
  return `ORD${t}${r}`.slice(0, 26);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const items = body.items as unknown;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "El carrito está vacío o no es válido" },
        { status: 400 }
      );
    }

    const cartItems = items as CartItem[];
    const valid = cartItems.every(
      (x) =>
        typeof x?.fotoId === "string" &&
        typeof x?.publicId === "string" &&
        typeof x?.precio === "number" &&
        x.precio >= 0 &&
        typeof x?.eventoNombre === "string" &&
        typeof x?.eventSlug === "string"
    );
    if (!valid) {
      return NextResponse.json(
        { error: "Uno o más ítems del carrito no son válidos" },
        { status: 400 }
      );
    }

    const totalClp = cartItems.reduce((s, i) => s + i.precio, 0);
    if (totalClp <= 0) {
      return NextResponse.json(
        { error: "El total debe ser mayor a 0" },
        { status: 400 }
      );
    }

    let userId: string | null = null;
    let customerEmail: string;
    let customerName: string;
    const guestEmail = typeof body.guestEmail === "string" ? body.guestEmail.trim() : "";
    const guestName = typeof body.guestName === "string" ? body.guestName.trim() : "";

    const token = getBearerToken(req);
    if (token) {
      const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON);
      const { data: u } = await supabaseAuth.auth.getUser(token);
      if (u.user) {
        userId = u.user.id;
        customerEmail = u.user.email ?? "";
        const { data: profile } = await createClient(SUPABASE_URL, SUPABASE_SERVICE)
          .from("profiles")
          .select("full_name")
          .eq("id", u.user.id)
          .maybeSingle();
        customerName = (profile?.full_name as string) || u.user.user_metadata?.full_name || customerEmail || "Cliente";
      } else {
        if (!guestEmail || !guestName) {
          return NextResponse.json(
            { error: "Como invitado debes indicar nombre y correo" },
            { status: 400 }
          );
        }
        customerEmail = guestEmail;
        customerName = guestName;
      }
    } else {
      if (!guestEmail || !guestName) {
        return NextResponse.json(
          { error: "Indica tu nombre y correo para continuar (o inicia sesión)" },
          { status: 400 }
        );
      }
      customerEmail = guestEmail;
      customerName = guestName;
    }

    const buyOrder = generateBuyOrder();
    const base = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL ?? "http://localhost:3000";
    const baseUrl = base.startsWith("http") ? base : `https://${base}`;
    const returnUrl = `${baseUrl}/api/checkout/return`;

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE);

    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId,
        guest_email: userId ? null : customerEmail,
        guest_name: userId ? null : customerName,
        total_clp: totalClp,
        status: "pending",
        buy_order: buyOrder,
      })
      .select("id")
      .single();

    if (orderErr || !order) {
      console.error("create order", orderErr);
      return NextResponse.json(
        { error: orderErr?.message ?? "No se pudo crear la orden" },
        { status: 500 }
      );
    }

    const orderItems = cartItems.map((i) => ({
      order_id: order.id,
      foto_id: i.fotoId,
      public_id: i.publicId,
      precio: i.precio,
      evento_nombre: i.eventoNombre,
      subevento_nombre: i.subEventoNombre ?? null,
    }));

    const { error: itemsErr } = await supabaseAdmin.from("order_items").insert(orderItems);
    if (itemsErr) {
      console.error("create order_items", itemsErr);
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      return NextResponse.json(
        { error: "No se pudieron guardar los ítems" },
        { status: 500 }
      );
    }

    const webpay = await webpayCreateTransaction({
      buy_order: buyOrder,
      session_id: order.id,
      amount: totalClp,
      return_url: returnUrl,
    });

    await supabaseAdmin
      .from("orders")
      .update({ webpay_token: webpay.token })
      .eq("id", order.id);

    return NextResponse.json({
      orderId: order.id,
      webpayUrl: webpay.url,
      webpayToken: webpay.token,
    });
  } catch (e) {
    console.error("checkout create-order", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al crear la orden" },
      { status: 500 }
    );
  }
}
