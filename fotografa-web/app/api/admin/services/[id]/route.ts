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

  const supabaseAuth = createClient(url, anon);
  const { data: u } = await supabaseAuth.auth.getUser(token);
  const user = u.user;
  if (!user) return { ok: false as const, status: 401, error: "Sesión inválida" };

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

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // valida id
  if (!id || id === "undefined") {
    return NextResponse.json({ error: "ID inválido en la ruta" }, { status: 400 });
  }

  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  type ServicePatch = {
    title?: string;
    description?: string | null;
    price_clp?: number;
    active?: boolean;
    sort_order?: number;
    image_url?: string | null;
    image_public_id?: string | null;
    destacado?: boolean;
  };

  const patch: ServicePatch = {};


  if (body.title !== undefined) patch.title = String(body.title).trim();
  if (body.description !== undefined) patch.description = body.description ? String(body.description) : null;
  if (body.price_clp !== undefined) patch.price_clp = Number(body.price_clp);
  if (body.active !== undefined) patch.active = Boolean(body.active);
  if (body.sort_order !== undefined) patch.sort_order = Number(body.sort_order);
  if (body.image_url !== undefined) patch.image_url = body.image_url ? String(body.image_url) : null;
  if (body.image_public_id !== undefined) patch.image_public_id = body.image_public_id ? String(body.image_public_id) : null;
  if (body.destacado !== undefined) patch.destacado = Boolean(body.destacado);


  if (patch.title !== undefined && !patch.title) {
    return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });
  }
  if (patch.price_clp !== undefined && (!Number.isFinite(patch.price_clp) || patch.price_clp < 0)) {
    return NextResponse.json({ error: "Precio inválido" }, { status: 400 });
  }

   const { data, error } = await auth.supabaseAdmin
    .from("services")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message, details: error.details, hint: error.hint, code: error.code },
      { status: 400 }
    );
  }

  return NextResponse.json(data);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || id === "undefined") {
    return NextResponse.json({ error: "ID inválido en la ruta" }, { status: 400 });
  }

  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { error } = await auth.supabaseAdmin.from("services").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}

