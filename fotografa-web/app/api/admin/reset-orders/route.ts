import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function requireAdmin(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return { ok: false as const, status: 401, error: "No autorizado" };
  }
  const token = auth.replace("Bearer ", "").trim();
  const { data: userRes, error: userErr } = await supabaseAdmin.auth.getUser(token);
  const user = userRes?.user;
  if (userErr || !user) {
    return { ok: false as const, status: 401, error: "Token inválido" };
  }
  const { data: profile, error: profErr } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profErr) return { ok: false as const, status: 500, error: profErr.message };
  if (profile?.role !== "admin") return { ok: false as const, status: 403, error: "Prohibido" };
  return { ok: true as const, userId: user.id };
}

/**
 * POST /api/admin/reset-orders
 * Elimina todas las órdenes y ítems de pedidos (solo admin).
 * Útil para reiniciar ventas de prueba.
 */
export async function POST(req: Request) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  try {
    const { data: orders, error: listErr } = await supabaseAdmin
      .from("orders")
      .select("id");
    if (listErr) {
      return NextResponse.json(
        { error: `Error al listar órdenes: ${listErr.message}` },
        { status: 500 }
      );
    }
    const orderIds = (orders ?? []).map((o) => o.id);

    if (orderIds.length > 0) {
      const { error: itemsErr } = await supabaseAdmin
        .from("order_items")
        .delete()
        .in("order_id", orderIds);
      if (itemsErr) {
        return NextResponse.json(
          { error: `Error al eliminar ítems: ${itemsErr.message}` },
          { status: 500 }
        );
      }
      const { error: ordersErr } = await supabaseAdmin
        .from("orders")
        .delete()
        .in("id", orderIds);
      if (ordersErr) {
        return NextResponse.json(
          { error: `Error al eliminar órdenes: ${ordersErr.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      message: "Órdenes y ventas de prueba reiniciadas correctamente.",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error inesperado";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
