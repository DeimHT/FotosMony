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

  const r2 = getR2Client();
  if (!r2 || !R2_BUCKET) {
    return NextResponse.json({ error: "Configuración de Cloudflare R2 faltante" }, { status: 500 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = getExt(file.name || "image.jpg");
  const key = `carpetas/${carpetaId}/${randomUUID()}.${ext}`;
  const contentType = file.type || (ext === "png" ? "image/png" : "image/jpeg");

  try {
    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );
  } catch (e) {
    console.error("R2 upload carpetas fotos", e);
    return NextResponse.json({ error: "Error subiendo imagen a R2" }, { status: 500 });
  }

  const { data: foto, error: fotoErr } = await supabaseAdmin
    .from("fotos")
    .insert([{ public_id: key, carpeta_id: carpetaId, precio: 0, storage_provider: "cloudflare" }])
    .select("id, public_id")
    .single();

  if (fotoErr) {
    return NextResponse.json({ error: fotoErr.message }, { status: 500 });
  }

  const r2PublicUrl = (process.env.CLOUDFLARE_R2_PUBLIC_URL ?? "").replace(/\/$/, "");
  const secure_url = r2PublicUrl ? `${r2PublicUrl}/${key}` : "";
  return NextResponse.json({ foto, secure_url }, { status: 201 });
}
