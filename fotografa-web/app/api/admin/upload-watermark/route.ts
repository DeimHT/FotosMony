import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { v2 as cloudinary } from "cloudinary";

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

  const { createClient } = await import("@supabase/supabase-js");
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

const WATERMARK_PUBLIC_ID = "watermark";

/**
 * POST: sube public/watermark.png a Cloudinary con public_id "watermark".
 * Solo admin. Después configura NEXT_PUBLIC_CLOUDINARY_WATERMARK_PUBLIC_ID=watermark en .env.local.
 */
export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const filePath = path.join(process.cwd(), "public", "watermark.png");
  let buffer: Buffer;
  try {
    buffer = await readFile(filePath);
  } catch {
    return NextResponse.json(
      { error: "No se encontró public/watermark.png. Coloca ahí tu logo de marca de agua." },
      { status: 400 }
    );
  }

  try {
    const uploaded = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          public_id: WATERMARK_PUBLIC_ID,
          overwrite: true,
          resource_type: "image",
        },
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
      stream.end(buffer);
    });

    return NextResponse.json({
      public_id: uploaded.public_id,
      message: `Marca de agua subida. En .env.local agrega: NEXT_PUBLIC_CLOUDINARY_WATERMARK_PUBLIC_ID=${WATERMARK_PUBLIC_ID}`,
    });
  } catch (err: unknown) {
    const message =
      err && typeof err === "object" && "message" in err
        ? String((err as { message?: string }).message)
        : "Error desconocido al subir a Cloudinary.";
    const isAuthError =
      message.includes("Invalid Signature") ||
      message.includes("401") ||
      message.includes("Unauthorized");
    const userMessage = isAuthError
      ? "Cloudinary rechazó la petición (firma inválida). Revisa en .env.local que CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET coincidan con tu cuenta (Dashboard → Settings → Security). Sin espacios ni comillas."
      : message;
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
