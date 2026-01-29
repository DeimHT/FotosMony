import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { createClient } from "@supabase/supabase-js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

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

  const form = await req.formData();
  const file = form.get("file");
  const oldPublicId = form.get("old_public_id")?.toString() || "";

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Archivo no encontrado (field: file)" }, { status: 400 });
  }

  // convertir File -> Buffer
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // subir a cloudinary
  const uploaded = await new Promise<any>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "services",
        resource_type: "image",
      },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });

  // si viene old_public_id, borrar anterior (reemplazo)
  if (oldPublicId) {
    try {
      await cloudinary.uploader.destroy(oldPublicId, { resource_type: "image" });
    } catch {
      // no bloqueamos el flujo si falla el destroy
    }
  }

  return NextResponse.json({
    image_url: uploaded.secure_url,
    image_public_id: uploaded.public_id,
  });
}
