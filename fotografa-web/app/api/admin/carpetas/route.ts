import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "FotosMony/lib/supabaseAdmin";
import { requireAdmin } from "FotosMony/lib/requireAdmin";

const R2_ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const R2_ACCESS_KEY = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const R2_SECRET = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME;

function getR2Client(): S3Client | null {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY || !R2_SECRET) return null;
  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY, secretAccessKey: R2_SECRET },
    forcePathStyle: true,
  });
}

function getExt(name: string): string {
  const m = name.match(/\.(jpe?g|png|webp|gif)$/i);
  return m ? m[1].toLowerCase().replace("jpeg", "jpg") : "jpg";
}

export async function POST(req: Request) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const contentType = req.headers.get("content-type") ?? "";

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

    const r2 = getR2Client();
    if (!r2 || !R2_BUCKET) {
      return NextResponse.json({ error: "Configuración de Cloudflare R2 faltante" }, { status: 500 });
    }

    try {
      const { data: carpeta, error: carpetaError } = await supabaseAdmin
        .from("carpetas")
        .insert([{ nombre, descripcion }])
        .select("id, nombre, descripcion")
        .single();

      if (carpetaError) {
        return NextResponse.json({ error: carpetaError.message }, { status: 500 });
      }

      for (const file of files) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const ext = getExt(file.name || "image.jpg");
        const key = `carpetas/${carpeta.id}/${randomUUID()}.${ext}`;
        const contentTypeImg = file.type || (ext === "png" ? "image/png" : "image/jpeg");
        await r2.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
            Body: buffer,
            ContentType: contentTypeImg,
          })
        );
        const { error: fotoErr } = await supabaseAdmin
          .from("fotos")
          .insert([{ public_id: key, carpeta_id: carpeta.id, precio: 0, storage_provider: "cloudflare" }]);
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
      .insert([
        {
          public_id: publicId,
          carpeta_id: carpeta.id,
          precio: 0,
          storage_provider: String(publicId).startsWith("carpetas/") ? "cloudflare" : "cloudinary",
        },
      ]);
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
