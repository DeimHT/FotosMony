import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getBearerToken(req: Request) {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1];
}

async function requireAdmin(req: Request) {
  const token = getBearerToken(req);
  if (!token) return { ok: false as const, status: 401, error: "No autorizado" };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // 1) validar token (con anon)
  const supabaseAuth = createClient(url, anon);
  const { data: u } = await supabaseAuth.auth.getUser(token);
  const user = u.user;
  if (!user) return { ok: false as const, status: 401, error: "Sesión inválida" };

  // 2) chequear rol (con service role)
  const supabaseAdmin = createClient(url, serviceKey);
  const { data: profile, error: perr } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (perr) return { ok: false as const, status: 400, error: perr.message };
  if (profile?.role !== "admin") return { ok: false as const, status: 403, error: "Prohibido" };

  return { ok: true as const, supabaseAdmin };
}

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data, error } = await auth.supabaseAdmin
    .from("services")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const payload = {
    title: String(body.title ?? "").trim(),
    description: body.description ? String(body.description) : null,
    price_clp: Number(body.price_clp ?? 0),
    active: Boolean(body.active ?? true),
    sort_order: Number(body.sort_order ?? 0),
    image_url: body.image_url ? String(body.image_url) : null,
    image_public_id: body.image_public_id ? String(body.image_public_id) : null,
  };

  if (!payload.title) return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });
  if (!Number.isFinite(payload.price_clp) || payload.price_clp < 0) {
    return NextResponse.json({ error: "Precio inválido" }, { status: 400 });
  }

  const { data, error } = await auth.supabaseAdmin
    .from("services")
    .insert(payload)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
