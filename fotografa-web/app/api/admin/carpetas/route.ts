import { supabaseAdmin } from "FotosMony/lib/supabaseAdmin";
import { requireAdmin } from "FotosMony/app/api/admin/route";
import { NextResponse } from "next/server";
import cloudinary from "FotosMony/lib/cloudinary";
import type { UploadApiResponse } from "cloudinary";

export async function POST(req: Request) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const contentType = req.headers.get("content-type") ?? "";

  // FormData: nombre + descripcion + múltiples archivos → subir a Cloudinary uno a uno y crear carpeta
  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const nombre = (formData.get("nombre") as string | null)?.trim();
    const descripcion = (formData.get("descripcion") as string | null)?.trim() || null;
    const files = formData.getAll("files").filter((f): f is File => f instanceof File);

    if (!nombre) {
      return NextResponse.json({ error: "El nombre de la carpeta es obligatorio" }, { status: 400 });
    }
    if (files.length === 0) {
      return NextResponse.json({ error: "Sube al menos una foto" }, { status: 400 });
    }

    const publicIds: string[] = [];

    try {
      // Subir a Cloudinary de una en una
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const buffer = Buffer.from(await file.arrayBuffer());
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
        publicIds.push(result.public_id);
      }

      // Crear carpeta en BD
      const { data: carpeta, error: carpetaError } = await supabaseAdmin
        .from("carpetas")
        .insert([{ nombre, descripcion }])
        .select("id, nombre, descripcion")
        .single();

      if (carpetaError) {
        return NextResponse.json({ error: carpetaError.message }, { status: 500 });
      }

      // Insertar fotos en BD (carpeta_id + public_id; precio 0 para portafolio)
      for (const publicId of publicIds) {
        const { error: fotoErr } = await supabaseAdmin
          .from("fotos")
          .insert([{ public_id: publicId, carpeta_id: carpeta.id, precio: 0 }]);
        if (fotoErr) {
          return NextResponse.json({ error: fotoErr.message }, { status: 500 });
        }
      }

      return NextResponse.json({ carpeta, message: "Carpeta y fotos creadas correctamente" }, { status: 201 });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error subiendo fotos";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  // JSON: nombre, descripcion, fotos (array de public_id) — flujo alternativo
  const body = await req.json();
  const { nombre, descripcion, fotos } = body;

  if (!nombre || !fotos || !Array.isArray(fotos) || fotos.length === 0) {
    return NextResponse.json(
      { error: "Se necesitan nombre y al menos un public_id en fotos" },
      { status: 400 }
    );
  }

  const { data: carpeta, error: carpetaError } = await supabaseAdmin
    .from("carpetas")
    .insert([{ nombre, descripcion }])
    .select("id")
    .single();

  if (carpetaError) {
    return NextResponse.json({ error: carpetaError.message }, { status: 500 });
  }

  for (const publicId of fotos as string[]) {
    const { error } = await supabaseAdmin
      .from("fotos")
      .insert([{ public_id: publicId, carpeta_id: carpeta.id, precio: 0 }]);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ carpeta, message: "Carpeta creada correctamente" }, { status: 201 });
}

export async function GET(req: Request) {
  try {
    const gate = await requireAdmin(req);
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const { data: carpetas, error } = await supabaseAdmin
      .from("carpetas")
      .select("id, nombre, descripcion")
      .order("id", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 500 }
      );
    }

    return NextResponse.json({ carpetas: carpetas ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno del servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
