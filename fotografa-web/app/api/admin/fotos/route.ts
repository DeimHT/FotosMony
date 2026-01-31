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
 * GET /api/admin/fotos?evento_id=... | sub_evento_id=...
 * Lista fotos del evento o del subevento seleccionado.
 */
export async function GET(req: Request) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { searchParams } = new URL(req.url);
  const evento_id = searchParams.get("evento_id")?.trim() || null;
  const sub_evento_id = searchParams.get("sub_evento_id")?.trim() || null;

  if (!evento_id && !sub_evento_id) {
    return NextResponse.json(
      { error: "Indica evento_id o sub_evento_id" },
      { status: 400 }
    );
  }

  let query = supabaseAdmin
    .from("fotos")
    .select("id, public_id, precio, nombre_archivo, evento_id, sub_evento_id")
    .order("id", { ascending: false });

  if (sub_evento_id) {
    query = query.eq("sub_evento_id", sub_evento_id);
  } else if (evento_id) {
    query = query.eq("evento_id", evento_id);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ fotos: data ?? [] });
}
