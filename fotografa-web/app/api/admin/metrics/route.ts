import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // SOLO server
);

async function requireAdmin(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return { ok: false as const, status: 401, error: "No autorizado" };

  const token = auth.replace("Bearer ", "").trim();

  // valida token → obtiene user
  const { data: userRes, error: userErr } = await supabaseAdmin.auth.getUser(token);
  const user = userRes?.user;

  if (userErr || !user) return { ok: false as const, status: 401, error: "Token inválido" };

  // check admin
  const { data: profile, error: profErr } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profErr) return { ok: false as const, status: 500, error: profErr.message };
  if (profile?.role !== "admin") return { ok: false as const, status: 403, error: "Prohibido" };

  return { ok: true as const, userId: user.id };
}

export async function GET(req: Request) {
  const gate = await requireAdmin(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  // Ajusta aquí si tus campos/tablas cambian:
  // orders: status ('paid'/'pending'), amount (int), created_at
  const { data: orders, error } = await supabaseAdmin
    .from("orders")
    .select("status, amount");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const totalOrders = orders?.length ?? 0;
  const paidOrders = orders?.filter((o) => o.status === "paid").length ?? 0;
  const pendingOrders = orders?.filter((o) => o.status === "pending").length ?? 0;
  const totalRevenue =
    orders?.reduce((acc, o) => (o.status === "paid" ? acc + (o.amount ?? 0) : acc), 0) ?? 0;

  return NextResponse.json({
    totalRevenue,
    paidOrders,
    pendingOrders,
    totalOrders,
  });
}
