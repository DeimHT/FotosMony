import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Función para obtener el token de la cabecera de autorización
function getBearerToken(req: Request) {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1];
}

// Función para verificar si el usuario es admin
async function requireAdmin(req: Request) {
  const token = getBearerToken(req);
  if (!token) return { ok: false as const, status: 401, error: "No autorizado" };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // 1) Validar token (con anon)
  const supabaseAuth = createClient(url, anon);
  const { data: u } = await supabaseAuth.auth.getUser(token);
  const user = u.user;
  if (!user) return { ok: false as const, status: 401, error: "Sesión inválida" };

  // 2) Chequear rol (con service role)
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

// GET: Obtener todos los elementos del portafolio
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data, error } = await auth.supabaseAdmin
    .from("portfolio_items")
    .select("*")
    .order("orden", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// POST: Crear un nuevo ítem del portafolio
export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const payload = {
    title: String(body.title ?? "").trim(),
    description: body.description ? String(body.description) : null,
    cover_public_id: body.cover_public_id ? String(body.cover_public_id) : null,
    cover_url: body.cover_url ? String(body.cover_url) : null,
    orden: Number(body.orden ?? 0),
    active: Boolean(body.active ?? true),
  };

  // Validaciones
  if (!payload.title) return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });
  
  const { data, error } = await auth.supabaseAdmin
    .from("portfolio_items")
    .insert(payload)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
