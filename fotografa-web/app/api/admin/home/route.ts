import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { mergeHero as mergeHeroLib, mergeAbout as mergeAboutLib } from "FotosMony/lib/homeContent";

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

  const supabaseAuth = createClient(url, anon);
  const { data: u } = await supabaseAuth.auth.getUser(token);
  if (!u.user) return { ok: false as const, status: 401, error: "Sesión inválida" };

  const supabaseAdmin = createClient(url, serviceKey);
  const { data: profile, error: perr } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", u.user.id)
    .maybeSingle();

  if (perr) return { ok: false as const, status: 400, error: perr.message };
  if (profile?.role !== "admin") return { ok: false as const, status: 403, error: "Prohibido" };

  return { ok: true as const, supabaseAdmin };
}

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let hero: ReturnType<typeof mergeHeroLib>;
  let about: ReturnType<typeof mergeAboutLib>;

  try {
    const { data: rows, error } = await auth.supabaseAdmin
      .from("home_sections")
      .select("id, content")
      .in("id", ["hero", "about"]);

    // Ante cualquier error (tabla no existe, RLS, etc.) devolvemos contenido por defecto para que el admin vea el botón Editar
    if (error) {
      hero = mergeHeroLib(undefined);
      about = mergeAboutLib(undefined);
    } else {
      const safeRows = Array.isArray(rows) ? rows : [];
      const byId = new Map(safeRows.map((r: { id: string; content: unknown }) => [r.id, r.content]));
      hero = mergeHeroLib(byId.get("hero"));
      about = mergeAboutLib(byId.get("about"));
    }
  } catch {
    hero = mergeHeroLib(undefined);
    about = mergeAboutLib(undefined);
  }

  return NextResponse.json({ hero, about });
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: { hero?: unknown; about?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const updates: { id: string; content: unknown }[] = [];
  if (body.hero !== undefined) updates.push({ id: "hero", content: mergeHeroLib(body.hero) });
  if (body.about !== undefined) updates.push({ id: "about", content: mergeAboutLib(body.about) });

  if (updates.length === 0) {
    return NextResponse.json({ error: "Enviar hero y/o about" }, { status: 400 });
  }

  for (const { id, content } of updates) {
    const { error: err } = await auth.supabaseAdmin
      .from("home_sections")
      .upsert({ id, content, updated_at: new Date().toISOString() }, { onConflict: "id" });
    if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
