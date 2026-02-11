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

  const { searchParams } = new URL(req.url);
  const evento_id = searchParams.get("evento_id");

  if (!evento_id) {
    return NextResponse.json({ error: "evento_id es obligatorio" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("sub_eventos")
    .select("id, evento_id, nombre, slug, created_at")
    .eq("evento_id", evento_id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ subeventos: data ?? [] });
}

export async function POST(req: Request) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const body = await req.json().catch(() => null);
  const evento_id = (body?.evento_id ?? "").trim();
  const nombre = (body?.nombre ?? "").trim();
  const slug = (body?.slug ?? "").trim();

  if (!evento_id || !nombre || !slug) {
    return NextResponse.json({ error: "evento_id, nombre y slug son obligatorios" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("sub_eventos")
    .insert({ evento_id, nombre, slug })
    .select("id, evento_id, nombre, slug")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ subevento: data });
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
    .from("sub_eventos")
    .update({ nombre, slug })
    .eq("id", id)
    .select("id, evento_id, nombre, slug")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ subevento: data });
}

export async function DELETE(req: Request) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id")?.trim();

  if (!id) {
    return NextResponse.json({ error: "id es obligatorio" }, { status: 400 });
  }

  try {
    const { data: fotos, error: fotosErr } = await supabaseAdmin
      .from("fotos")
      .select("id, public_id, storage_provider")
      .eq("sub_evento_id", id);

    if (fotosErr) {
      return NextResponse.json({ error: `Error al listar fotos: ${fotosErr.message}` }, { status: 500 });
    }

    const fotosList = fotos ?? [];
    const fotoIds = fotosList.map((f) => f.id);
    const cloudinaryPublicIds = fotosList
      .filter((f) => (f.storage_provider ?? "cloudinary") === "cloudinary")
      .map((f) => f.public_id);

    // Si hay order_items que referencian estas fotos, la FK impide borrar. Eliminamos esas filas primero.
    if (fotoIds.length > 0) {
      const { error: orderItemsErr } = await supabaseAdmin
        .from("order_items")
        .delete()
        .in("foto_id", fotoIds);
      if (orderItemsErr) {
        return NextResponse.json(
          { error: `Error al desvincular ítems de pedidos: ${orderItemsErr.message}` },
          { status: 500 }
        );
      }
    }

    // Borrar fotos y luego subevento
    const { error: delFotosErr } = await supabaseAdmin.from("fotos").delete().eq("sub_evento_id", id);
    if (delFotosErr) {
      return NextResponse.json({ error: `Error al eliminar fotos: ${delFotosErr.message}` }, { status: 500 });
    }

    const { error: delErr } = await supabaseAdmin.from("sub_eventos").delete().eq("id", id);
    if (delErr) {
      return NextResponse.json({ error: `Error al eliminar subevento: ${delErr.message}` }, { status: 500 });
    }

    // Borrar en Cloudinary solo si las fotos estaban ahí (las de R2 se quedan en el bucket)
    if (cloudinaryPublicIds.length > 0 && typeof cloudinary?.uploader?.destroy === "function") {
      Promise.all(
        cloudinaryPublicIds.map((publicId) =>
          cloudinary.uploader.destroy(publicId).catch(() => {})
        )
      ).catch(() => {});
    }

    return NextResponse.json({ message: "Subevento eliminado" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error inesperado al eliminar";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

