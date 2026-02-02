import { createHash, randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const CLOUDFLARE_R2_ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const CLOUDFLARE_R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const CLOUDFLARE_R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const CLOUDFLARE_R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME;

const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    : null;

function getR2Client(): S3Client | null {
  if (!CLOUDFLARE_R2_ACCOUNT_ID || !CLOUDFLARE_R2_ACCESS_KEY_ID || !CLOUDFLARE_R2_SECRET_ACCESS_KEY) {
    return null;
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: CLOUDFLARE_R2_ACCESS_KEY_ID,
      secretAccessKey: CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
  });
}

async function requireAdmin(req: Request) {
  if (!supabaseAdmin) {
    return { ok: false as const, status: 500, error: "Configuración de Supabase faltante en el servidor" };
  }
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

function toInt(v: FormDataEntryValue | null) {
  if (!v) return NaN;
  const n = Number(String(v));
  return n;
}

function getExt(name: string): string {
  const m = name.match(/\.(jpe?g|png|webp|gif)$/i);
  return m ? m[1].toLowerCase().replace("jpeg", "jpg") : "jpg";
}

export async function POST(req: Request) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Configuración de Supabase faltante en el servidor" }, { status: 500 });
  }

  const r2Client = getR2Client();
  if (!r2Client || !CLOUDFLARE_R2_BUCKET_NAME) {
    return NextResponse.json(
      { error: "Configuración de Cloudflare R2 faltante (CLOUDFLARE_R2_ACCOUNT_ID, ACCESS_KEY, SECRET, BUCKET_NAME)" },
      { status: 500 }
    );
  }

  const db = supabaseAdmin;

  const formData = await req.formData();

  const file = formData.get("file");
  const precio = toInt(formData.get("precio"));
  const evento_id = (formData.get("evento_id") as string | null)?.trim() || null;
  const sub_evento_id = (formData.get("sub_evento_id") as string | null)?.trim() || null;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Archivo inválido" }, { status: 400 });
  }

  if (!Number.isFinite(precio) || precio <= 0) {
    return NextResponse.json({ error: "Precio inválido" }, { status: 400 });
  }

  if (!evento_id && !sub_evento_id) {
    return NextResponse.json(
      { error: "Debes enviar evento_id o sub_evento_id" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const nombreArchivo = (file.name || "").trim() || null;
  const contentHash = createHash("sha256").update(buffer).digest("hex");
  const ext = getExt(file.name || "image.jpg");
  const pathSegment = sub_evento_id ?? evento_id!;
  const storagePath = `eventos/${pathSegment}/${randomUUID()}.${ext}`;

  try {
    let duplicateQuery = db
      .from("fotos")
      .select("id")
      .eq("content_hash", contentHash)
      .limit(1);

    if (sub_evento_id) {
      duplicateQuery = duplicateQuery.eq("sub_evento_id", sub_evento_id);
    } else {
      duplicateQuery = duplicateQuery.eq("evento_id", evento_id).is("sub_evento_id", null);
    }

    const { data: existing } = await duplicateQuery;

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: "Esta foto ya está subida en este evento o subevento." },
        { status: 400 }
      );
    }

    const contentType = file.type || (ext === "png" ? "image/png" : "image/jpeg");
    await r2Client.send(
      new PutObjectCommand({
        Bucket: CLOUDFLARE_R2_BUCKET_NAME,
        Key: storagePath,
        Body: buffer,
        ContentType: contentType,
      })
    );

    const row = {
      public_id: storagePath,
      storage_provider: "cloudflare",
      precio,
      evento_id,
      sub_evento_id,
      nombre_archivo: nombreArchivo,
      content_hash: contentHash,
    };

    const { data: inserted, error: dbErr } = await db
      .from("fotos")
      .insert(row)
      .select("id, public_id, storage_provider, precio, evento_id, sub_evento_id")
      .single();

    if (dbErr) {
      return NextResponse.json({ error: dbErr.message }, { status: 500 });
    }

    const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;
    const secure_url = publicUrl
      ? `${publicUrl.replace(/\/$/, "")}/${storagePath}`
      : `https://${CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${CLOUDFLARE_R2_BUCKET_NAME}/${storagePath}`;

    return NextResponse.json({
      ok: true,
      foto: inserted,
      secure_url,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error subiendo imagen";
    console.error("[admin/fotos/upload]", e);
    const safeMsg =
      msg.includes("Payload") || msg.includes("entity too large") || msg.includes("413")
        ? "El archivo es demasiado grande (máx. ~4 MB en producción). Comprime la imagen o usa una más pequeña."
        : msg;
    return NextResponse.json({ error: safeMsg }, { status: 500 });
  }
}
