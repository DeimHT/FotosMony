import { NextResponse } from "next/server";
import { supabaseAdmin } from "FotosMony/lib/supabaseAdmin";
import { requireAdmin } from "FotosMony/app/api/admin/route";
import cloudinary from "FotosMony/lib/cloudinary";
import type { UploadApiResponse } from "cloudinary";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: RouteContext) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { id: carpetaId } = await params;

  const { data: carpeta, error: carpetaErr } = await supabaseAdmin
    .from("carpetas")
    .select("id")
    .eq("id", carpetaId)
    .single();

  if (carpetaErr || !carpeta) {
    return NextResponse.json({ error: "Carpeta no encontrada" }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Archivo inválido" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: "portafolio", resource_type: "image" },
          (err, res) => {
            if (err) return reject(err);
            if (!res) return reject(new Error("Cloudinary: sin resultado"));
            resolve(res);
          }
        )
        .end(buffer);
    });

    const { data: foto, error: fotoErr } = await supabaseAdmin
      .from("fotos")
      .insert([{ public_id: result.public_id, carpeta_id: carpetaId, precio: 0 }])
      .select("id, public_id")
      .single();

    if (fotoErr) {
      return NextResponse.json({ error: fotoErr.message }, { status: 500 });
    }

    return NextResponse.json(
      { foto, secure_url: result.secure_url },
      { status: 201 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error subiendo foto";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
