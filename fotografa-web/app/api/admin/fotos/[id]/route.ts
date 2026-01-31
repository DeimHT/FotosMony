import { NextResponse } from "next/server";
import { supabaseAdmin } from "FotosMony/lib/supabaseAdmin";
import { requireAdmin } from "FotosMony/app/api/admin/route";
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

  try {
    await cloudinary.uploader.destroy(foto.public_id);
  } catch {
    // Si falla Cloudinary (ej. ya borrada), seguimos y borramos de BD
  }

  const { error: deleteErr } = await supabaseAdmin.from("fotos").delete().eq("id", id);

  if (deleteErr) {
    return NextResponse.json({ error: deleteErr.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Foto eliminada" });
}
