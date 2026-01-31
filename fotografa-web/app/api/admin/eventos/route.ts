import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import cloudinary from "FotosMony/lib/cloudinary";

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

export async function GET(req: Request) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { data, error } = await supabaseAdmin
    .from("eventos")
    .select("id, nombre, slug, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ eventos: data ?? [] });
}

export async function POST(req: Request) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const body = await req.json().catch(() => null);
  const nombre = (body?.nombre ?? "").trim();
  const slug = (body?.slug ?? "").trim();

  if (!nombre || !slug) {
    return NextResponse.json({ error: "Nombre y slug son obligatorios" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("eventos")
    .insert({ nombre, slug })
    .select("id, nombre, slug")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ evento: data });
}

export async function PUT(req: Request) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const body = await req.json().catch(() => null);

  const id = (body?.id ?? "").trim();
  const nombre = (body?.nombre ?? "").trim();
  const slug = (body?.slug ?? "").trim();

  if (!id || !nombre || !slug) {
    return NextResponse.json({ error: "id, nombre y slug son obligatorios" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("eventos")
    .update({ nombre, slug })
    .eq("id", id)
    .select("id, nombre, slug")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ evento: data });
}

export async function DELETE(req: Request) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id")?.trim();

  if (!id) {
    return NextResponse.json({ error: "id es obligatorio" }, { status: 400 });
  }

  const { data: subeventos, error: subErr } = await supabaseAdmin
    .from("sub_eventos")
    .select("id")
    .eq("evento_id", id);

  if (subErr) return NextResponse.json({ error: subErr.message }, { status: 500 });

  const subIds = (subeventos ?? []).map((s) => s.id);

  const { data: fotosEvento } = await supabaseAdmin
    .from("fotos")
    .select("id, public_id")
    .eq("evento_id", id);
  const { data: fotosSub } =
    subIds.length > 0
      ? await supabaseAdmin.from("fotos").select("id, public_id").in("sub_evento_id", subIds)
      : { data: [] as { id: string; public_id: string }[] };

  const allFotos = [...(fotosEvento ?? []), ...(fotosSub ?? [])];
  const allFotoIds = allFotos.map((f) => f.id);
  const allPublicIds = allFotos.map((f) => f.public_id);

  // order_items tiene FK a fotos: hay que borrar esas filas antes de borrar fotos
  if (allFotoIds.length > 0) {
    const { error: orderItemsErr } = await supabaseAdmin
      .from("order_items")
      .delete()
      .in("foto_id", allFotoIds);
    if (orderItemsErr) {
      return NextResponse.json(
        { error: `Error al desvincular ítems de pedidos: ${orderItemsErr.message}` },
        { status: 500 }
      );
    }
  }

  await supabaseAdmin.from("fotos").delete().eq("evento_id", id);
  if (subIds.length > 0) {
    await supabaseAdmin.from("fotos").delete().in("sub_evento_id", subIds);
  }
  await supabaseAdmin.from("sub_eventos").delete().eq("evento_id", id);

  const { error: delErr } = await supabaseAdmin.from("eventos").delete().eq("id", id);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  if (allPublicIds.length > 0 && typeof cloudinary?.uploader?.destroy === "function") {
    Promise.all(
      allPublicIds.map((publicId) => cloudinary.uploader.destroy(publicId).catch(() => {}))
    ).catch(() => {});
  }

  return NextResponse.json({ message: "Evento eliminado" });
}

