import { NextResponse } from "next/server";
import { supabaseAdmin } from "FotosMony/lib/supabaseAdmin";
import { requireAdmin } from "FotosMony/lib/requireAdmin";
import cloudinary from "FotosMony/lib/cloudinary";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: RouteContext) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { id } = await params;

  const { data: carpeta, error: carpetaErr } = await supabaseAdmin
    .from("carpetas")
    .select("id, nombre, descripcion")
    .eq("id", id)
    .single();

  if (carpetaErr || !carpeta) {
    return NextResponse.json({ error: "Carpeta no encontrada" }, { status: 404 });
  }

  const { data: fotos, error: fotosErr } = await supabaseAdmin
    .from("fotos")
    .select("id, public_id")
    .eq("carpeta_id", id)
    .order("id", { ascending: true });

  if (fotosErr) {
    return NextResponse.json({ error: fotosErr.message }, { status: 500 });
  }

  return NextResponse.json({ carpeta, fotos: fotos ?? [] });
}

export async function PUT(req: Request, { params }: RouteContext) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { id } = await params;
  const body = await req.json();
  const { nombre, descripcion } = body;

  const { data, error } = await supabaseAdmin
    .from("carpetas")
    .update({ nombre, descripcion })
    .eq("id", id)
    .select("id, nombre, descripcion")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ carpeta: data });
}

export async function DELETE(req: Request, { params }: RouteContext) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { id } = await params;

  try {
    const { data: fotos, error: fotosErr } = await supabaseAdmin
      .from("fotos")
      .select("id, public_id")
      .eq("carpeta_id", id);

    if (fotosErr) {
      return NextResponse.json({ error: fotosErr.message }, { status: 500 });
    }

    const fotosList = fotos ?? [];
    const fotoIds = fotosList.map((f: { id: string }) => f.id);
    const publicIds = fotosList.map((f: { public_id: string }) => f.public_id);

    // order_items tiene FK a fotos: borrar referencias antes de borrar fotos
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

    // Borrar fotos y luego carpeta
    const { error: delFotosErr } = await supabaseAdmin.from("fotos").delete().eq("carpeta_id", id);
    if (delFotosErr) {
      return NextResponse.json({ error: `Error al eliminar fotos: ${delFotosErr.message}` }, { status: 500 });
    }

    const { error: carpetaError } = await supabaseAdmin
      .from("carpetas")
      .delete()
      .eq("id", id);

    if (carpetaError) {
      return NextResponse.json({ error: carpetaError.message }, { status: 500 });
    }

    // Cloudinary en segundo plano (no bloquea la respuesta)
    if (publicIds.length > 0 && typeof cloudinary?.uploader?.destroy === "function") {
      Promise.all(
        publicIds.map((publicId: string) => cloudinary.uploader.destroy(publicId).catch(() => {}))
      ).catch(() => {});
    }

    return NextResponse.json({ message: "Carpeta y fotos eliminadas correctamente" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error eliminando fotos o carpeta" },
      { status: 500 }
    );
  }
}
