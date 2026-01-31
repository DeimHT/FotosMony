import { NextResponse } from "next/server";
import { supabaseAdmin } from "FotosMony/lib/supabaseAdmin";
import { requireAdmin } from "FotosMony/lib/requireAdmin";
import cloudinary from "FotosMony/lib/cloudinary";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(req: Request, { params }: RouteContext) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { id } = await params;

  const { data: foto, error: fetchErr } = await supabaseAdmin
    .from("fotos")
    .select("id, public_id")
    .eq("id", id)
    .single();

  if (fetchErr || !foto) {
    return NextResponse.json({ error: "Foto no encontrada" }, { status: 404 });
  }

  // order_items tiene FK a fotos: borrar referencias antes de borrar la foto
  const { error: orderItemsErr } = await supabaseAdmin
    .from("order_items")
    .delete()
    .eq("foto_id", id);
  if (orderItemsErr) {
    return NextResponse.json(
      { error: `Error al desvincular ítems de pedidos: ${orderItemsErr.message}` },
      { status: 500 }
    );
  }

  const { error: deleteErr } = await supabaseAdmin.from("fotos").delete().eq("id", id);
  if (deleteErr) {
    return NextResponse.json({ error: deleteErr.message }, { status: 500 });
  }

  try {
    await cloudinary.uploader.destroy(foto.public_id);
  } catch {
    // Si falla Cloudinary (ej. ya borrada), la BD ya está actualizada
  }

  return NextResponse.json({ message: "Foto eliminada" });
}
