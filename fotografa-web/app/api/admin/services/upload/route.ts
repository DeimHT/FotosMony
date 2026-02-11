import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

const R2_ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const R2_ACCESS_KEY = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const R2_SECRET = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME;
const R2_PUBLIC_URL = (process.env.CLOUDFLARE_R2_PUBLIC_URL ?? "").replace(/\/$/, "");

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

  return { ok: true as const };
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const r2 = getR2Client();
  if (!r2 || !R2_BUCKET) {
    return NextResponse.json(
      { error: "Configuración de Cloudflare R2 faltante" },
      { status: 500 }
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  const oldPublicId = (form.get("old_public_id")?.toString() || "").trim();

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Archivo no encontrado (field: file)" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = getExt(file.name || "image.jpg");
  const key = `services/${randomUUID()}.${ext}`;
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
    console.error("R2 upload services", e);
    return NextResponse.json({ error: "Error subiendo imagen a R2" }, { status: 500 });
  }

  if (oldPublicId && oldPublicId.startsWith("services/")) {
    try {
      await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: oldPublicId }));
    } catch {
      // no bloqueamos si falla el borrado
    }
  }

  const imageUrl = R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${key}` : "";
  return NextResponse.json({
    image_url: imageUrl,
    image_public_id: key,
  });
}
