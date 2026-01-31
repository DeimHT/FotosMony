import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import cloudinary from "FotosMony/lib/cloudinary";
import type { UploadApiResponse } from "cloudinary";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    : null;

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

function checkUploadEnv(): string | null {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return "Configuración de Cloudinary faltante en el servidor (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)";
  }
  if (!supabaseAdmin) {
    return "Configuración de Supabase faltante en el servidor";
  }
  return null;
}

export async function POST(req: Request) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const envError = checkUploadEnv();
  if (envError) {
    return NextResponse.json({ error: envError }, { status: 500 });
  }

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

  try {
    // 0) Comprobar si ya existe una foto con el mismo contenido en este evento/subevento
    let duplicateQuery = supabaseAdmin
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

    // 1) subir a Cloudinary
    const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "eventos",
            resource_type: "image",
          },
          (error, result) => {
            if (error) return reject(error);
            if (!result) return reject(new Error("Cloudinary: empty result"));
            resolve(result);
          }
        )
        .end(buffer);
    });

    // 2) insertar en DB (con nombre original del archivo para WhatsApp, etc., y content_hash para evitar duplicados)
    const row = {
      public_id: uploadResult.public_id,
      precio,
      evento_id,
      sub_evento_id,
      nombre_archivo: nombreArchivo,
      content_hash: contentHash,
    };

    const { data: inserted, error: dbErr } = await supabaseAdmin
      .from("fotos")
      .insert(row)
      .select("id, public_id, precio, evento_id, sub_evento_id")
      .single();

    if (dbErr) {
      return NextResponse.json({ error: dbErr.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      foto: inserted,
      secure_url: uploadResult.secure_url, // útil para preview
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
