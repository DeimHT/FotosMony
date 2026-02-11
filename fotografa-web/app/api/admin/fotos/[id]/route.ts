import { NextResponse } from "next/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { supabaseAdmin } from "FotosMony/lib/supabaseAdmin";
import { requireAdmin } from "FotosMony/lib/requireAdmin";
import cloudinary from "FotosMony/lib/cloudinary";

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

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(req: Request, { params }: RouteContext) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { id } = await params;

  const { data: foto, error: fetchErr } = await supabaseAdmin
    .from("fotos")
    .select("id, public_id, storage_provider")
    .eq("id", id)
    .single();

  if (fetchErr || !foto) {
    return NextResponse.json({ error: "Foto no encontrada" }, { status: 404 });
  }

  // order_items tiene FK a fotos: borrar referencias antes de borrar la foto
  const { error: orderItemsErr } = await supabaseAdmin
    .from("order_items")
    .delete()
    .eq("foto_id", id);
  if (orderItemsErr) {
    return NextResponse.json(
      { error: `Error al desvincular ítems de pedidos: ${orderItemsErr.message}` },
      { status: 500 }
    );
  }

  const { error: deleteErr } = await supabaseAdmin.from("fotos").delete().eq("id", id);
  if (deleteErr) {
    return NextResponse.json({ error: deleteErr.message }, { status: 500 });
  }

  const provider = foto.storage_provider ?? "cloudinary";
  if (provider === "cloudflare" && R2_BUCKET) {
    const r2 = getR2Client();
    if (r2) {
      try {
        await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: foto.public_id }));
      } catch {
        // Objeto ya borrado o bucket no disponible; la BD ya está actualizada
      }
    }
  } else if (provider === "cloudinary") {
    try {
      await cloudinary.uploader.destroy(foto.public_id);
    } catch {
      // Si falla Cloudinary (ej. ya borrada), la BD ya está actualizada
    }
  }

  return NextResponse.json({ message: "Foto eliminada" });
}
