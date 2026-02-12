import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { webpayCommitTransaction } from "FotosMony/lib/webpay";
import { sendOrderPhotosEmail } from "FotosMony/lib/email";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const tokenWs = typeof body.token_ws === "string" ? body.token_ws.trim() : "";

    if (!tokenWs) {
      return NextResponse.json(
        { error: "Falta token_ws de Webpay" },
        { status: 400 }
      );
    }

    const commit = await webpayCommitTransaction(tokenWs);

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE);

    const isApproved =
      commit.status === "AUTHORIZED" && commit.response_code === 0;

    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("id, user_id, guest_email, guest_name, total_clp")
      .eq("buy_order", commit.buy_order)
      .maybeSingle();

    if (orderErr || !order) {
      return NextResponse.json(
        { error: "Orden no encontrada", success: false },
        { status: 404 }
      );
    }

    if (isApproved) {
      await supabaseAdmin
        .from("orders")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      const { data: items } = await supabaseAdmin
        .from("order_items")
        .select("public_id, evento_nombre, subevento_nombre, foto_id")
        .eq("order_id", order.id);

      let customerEmail: string;
      let customerName: string;

      if (order.guest_email) {
        customerEmail = order.guest_email;
        customerName = order.guest_name || "Cliente";
      } else if (order.user_id) {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("full_name")
          .eq("id", order.user_id)
          .maybeSingle();
        const { data: u } = await supabaseAdmin.auth.admin.getUserById(order.user_id);
        customerEmail = u?.user?.email ?? "";
        customerName = (profile?.full_name as string) || u?.user?.user_metadata?.full_name || "Cliente";
      } else {
        customerEmail = "";
        customerName = "Cliente";
      }

      if (customerEmail && Array.isArray(items) && items.length > 0) {
        const fotoIds = [...new Set((items as { foto_id?: string }[]).map((i) => i.foto_id).filter(Boolean))] as string[];
        const storageByFotoId: Record<string, string | null> = {};
        if (fotoIds.length > 0) {
          const { data: fotos } = await supabaseAdmin
            .from("fotos")
            .select("id, storage_provider")
            .in("id", fotoIds);
          for (const f of fotos ?? []) {
            storageByFotoId[f.id] = f.storage_provider ?? null;
          }
        }
        try {
          await sendOrderPhotosEmail(
            customerEmail,
            customerName,
            (items as { public_id: string; evento_nombre: string; subevento_nombre: string | null; foto_id?: string }[]).map((i) => ({
              public_id: i.public_id,
              evento_nombre: i.evento_nombre,
              subevento_nombre: i.subevento_nombre,
              storage_provider: storageByFotoId[i.foto_id ?? ""] ?? null,
            })),
            order.total_clp
          );
          if (process.env.NODE_ENV === "development") {
            console.log(`[checkout/confirm] Email enviado a ${customerEmail} con ${items.length} foto(s)`);
          }
        } catch (emailErr) {
          console.error("Error enviando email de fotos:", emailErr);
          // No fallar la respuesta: el pago ya está confirmado
        }
      }
    } else {
      await supabaseAdmin
        .from("orders")
        .update({ status: "failed" })
        .eq("id", order.id);
    }

    return NextResponse.json({
      success: isApproved,
      orderId: order.id,
    });
  } catch (e) {
    console.error("checkout confirm", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al confirmar el pago", success: false },
      { status: 500 }
    );
  }
}
