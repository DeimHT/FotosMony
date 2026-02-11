/**
 * Migra todas las fotos de Cloudinary a Cloudflare R2.
 * Actualiza fotos.storage_provider y public_id, y eventos.cover_* si aplica.
 *
 * Requisitos: .env.local con Supabase, Cloudinary (solo lectura) y Cloudflare R2.
 *
 * Uso (desde la raíz del proyecto):
 *   npx tsx scripts/migrate-cloudinary-to-r2.ts
 *
 * Opcional:
 *   DRY_RUN=1              → no sube a R2 ni actualiza la DB (solo simula).
 *   ONLY=fotos             → solo migra fotos (tabla fotos).
 *   ONLY=services          → solo migra servicios (tabla services).
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Supabase = SupabaseClient<any>;

// Cargar .env.local (sobrescribe variables para que uses siempre el proyecto correcto)
const ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDFLARE_R2_ACCOUNT_ID",
  "CLOUDFLARE_R2_ACCESS_KEY_ID",
  "CLOUDFLARE_R2_SECRET_ACCESS_KEY",
  "CLOUDFLARE_R2_BUCKET_NAME",
  "CLOUDFLARE_R2_PUBLIC_URL",
];
function loadEnvLocal() {
  try {
    const path = resolve(process.cwd(), ".env.local");
    const content = readFileSync(path, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const eq = trimmed.indexOf("=");
        if (eq > 0) {
          const key = trimmed.slice(0, eq).trim();
          const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
          if (ENV_KEYS.includes(key)) process.env[key] = value;
        }
      }
    }
  } catch {
    console.warn("No se encontró .env.local; usando variables de entorno actuales.");
  }
}
loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? process.env.CLOUDINARY_CLOUD_NAME!;
const R2_ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID!;
const R2_ACCESS_KEY = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!;
const R2_SECRET = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!;
const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME!;
const R2_PUBLIC_URL = (process.env.CLOUDFLARE_R2_PUBLIC_URL ?? "").replace(/\/$/, "");
const DRY_RUN = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";

type FotoRow = {
  id: string;
  public_id: string;
  evento_id: string | null;
  sub_evento_id: string | null;
  carpeta_id: string | null;
  storage_provider: string | null;
};

function getExtFromContentType(ct: string | null): string {
  if (!ct) return "jpg";
  if (ct.includes("png")) return "png";
  if (ct.includes("webp")) return "webp";
  if (ct.includes("gif")) return "gif";
  return "jpg";
}

function getExtFromPublicId(publicId: string): string {
  const m = publicId.match(/\.(jpe?g|png|webp|gif)$/i);
  return m ? m[1].toLowerCase().replace("jpeg", "jpg") : "jpg";
}

async function migrateFotos(supabase: Supabase, r2: S3Client, cloudinaryBase: string) {
  const { data: fotos, error: listErr } = await supabase
    .from("fotos")
    .select("id, public_id, evento_id, sub_evento_id, carpeta_id, storage_provider")
    .or("storage_provider.is.null,storage_provider.eq.cloudinary");

  if (listErr) {
    console.error("Error listando fotos:", listErr.message);
    return;
  }

  const toMigrate = (fotos ?? []) as FotoRow[];
  console.log(`Fotos a migrar (Cloudinary → R2): ${toMigrate.length}`);
  if (toMigrate.length === 0) {
    console.log("Nada que migrar (fotos).");
    return;
  }

  if (DRY_RUN) {
    console.log("Modo DRY_RUN: no se subirá nada ni se actualizará la DB.\n");
  }

  let ok = 0;
  let fail = 0;

  for (let i = 0; i < toMigrate.length; i++) {
    const foto = toMigrate[i];
    const oldPublicId = foto.public_id;
    const pathSegment = foto.sub_evento_id ?? foto.evento_id ?? foto.carpeta_id;
    if (!pathSegment) {
      console.warn(`[${i + 1}/${toMigrate.length}] Foto ${foto.id} sin evento_id, sub_evento_id ni carpeta_id, se omite.`);
      fail++;
      continue;
    }
    const prefix = foto.carpeta_id ? "carpetas" : "eventos";
    const sourceUrl = `${cloudinaryBase}/${oldPublicId}`;
    try {
      const res = await fetch(sourceUrl, { cache: "no-store" });
      if (!res.ok) {
        console.warn(`[${i + 1}/${toMigrate.length}] No se pudo descargar ${oldPublicId}: ${res.status}`);
        fail++;
        continue;
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      const contentType = res.headers.get("content-type");
      const ext = getExtFromContentType(contentType) || getExtFromPublicId(oldPublicId);
      const newKey = `${prefix}/${pathSegment}/${randomUUID()}.${ext}`;

      if (!DRY_RUN) {
        await r2.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: newKey,
            Body: buffer,
            ContentType: contentType || (ext === "png" ? "image/png" : "image/jpeg"),
          })
        );
      }

      if (!DRY_RUN) {
        const { data: updated, error: updFoto } = await supabase
          .from("fotos")
          .update({ public_id: newKey, storage_provider: "cloudflare" })
          .eq("id", foto.id)
          .select("id, storage_provider")
          .single();
        if (updFoto || !updated) {
          console.warn(`[${i + 1}/${toMigrate.length}] Error actualizando foto ${foto.id}:`, updFoto?.message ?? "sin datos");
          fail++;
          continue;
        }
        if (ok === 0) {
          console.log("  (DB verificada: primera fila actualizada, storage_provider =", updated?.storage_provider + ")");
        }

        const { error: updEv } = await supabase
          .from("eventos")
          .update({ cover_public_id: newKey, cover_storage_provider: "cloudflare" })
          .eq("cover_public_id", oldPublicId);
        if (updEv) {
          console.warn(`[${i + 1}/${toMigrate.length}] Error actualizando portadas (cover_public_id):`, updEv.message);
        }
      }

      ok++;
      if ((i + 1) % 10 === 0 || i === toMigrate.length - 1) {
        console.log(`[${i + 1}/${toMigrate.length}] OK: ${oldPublicId} → ${newKey}`);
      }
    } catch (e) {
      console.warn(`[${i + 1}/${toMigrate.length}] Error:`, e);
      fail++;
    }
  }

  console.log("\nResumen fotos:", ok, "migradas,", fail, "fallos.");
  if (DRY_RUN && ok > 0) {
    console.log("Ejecuta sin DRY_RUN=1 para aplicar los cambios.");
  }
}

type ServiceRow = { id: string; image_url: string | null; image_public_id: string | null };

async function migrateServices(
  supabase: Supabase,
  r2: S3Client,
  cloudinaryBase: string,
  r2PublicUrl: string
) {
  const { data: services, error: listErr } = await supabase
    .from("services")
    .select("id, image_url, image_public_id")
    .not("image_public_id", "is", null);

  if (listErr) {
    console.error("Error listando services:", listErr.message);
    return;
  }

  const toMigrate = (services ?? []).filter(
    (s: ServiceRow) => s.image_public_id && !String(s.image_public_id).startsWith("services/")
  );
  console.log("\nServicios a migrar (Cloudinary → R2):", toMigrate.length);
  if (toMigrate.length === 0) return;
  if (!DRY_RUN && !r2PublicUrl) {
    console.warn("CLOUDFLARE_R2_PUBLIC_URL no está definida; image_url quedará vacía para servicios.");
  }
  if (DRY_RUN) console.log("Modo DRY_RUN: no se subirá nada ni se actualizará la DB.\n");

  let ok = 0;
  let fail = 0;
  for (let i = 0; i < toMigrate.length; i++) {
    const svc = toMigrate[i];
    const oldId = svc.image_public_id!;
    const sourceUrl = `${cloudinaryBase}/${oldId}`;
    try {
      const res = await fetch(sourceUrl, { cache: "no-store" });
      if (!res.ok) {
        console.warn(`[${i + 1}/${toMigrate.length}] No se pudo descargar ${oldId}: ${res.status}`);
        fail++;
        continue;
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      const contentType = res.headers.get("content-type");
      const ext = getExtFromContentType(contentType) || getExtFromPublicId(oldId);
      const newKey = `services/${svc.id}/${randomUUID()}.${ext}`;
      const newImageUrl = r2PublicUrl ? `${r2PublicUrl}/${newKey}` : "";

      if (!DRY_RUN) {
        await r2.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: newKey,
            Body: buffer,
            ContentType: contentType || (ext === "png" ? "image/png" : "image/jpeg"),
          })
        );
        const { error: upd } = await supabase
          .from("services")
          .update({ image_url: newImageUrl, image_public_id: newKey })
          .eq("id", svc.id);
        if (upd) {
          console.warn(`[${i + 1}/${toMigrate.length}] Error actualizando service ${svc.id}:`, upd.message);
          fail++;
          continue;
        }
      }
      ok++;
      console.log(`[${i + 1}/${toMigrate.length}] OK service ${svc.id}: ${oldId} → ${newKey}`);
    } catch (e) {
      console.warn(`[${i + 1}/${toMigrate.length}] Error:`, e);
      fail++;
    }
  }
  console.log("Resumen servicios:", ok, "migrados,", fail, "fallos.");
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  if (!CLOUD_NAME) {
    console.error("Falta NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME o CLOUDINARY_CLOUD_NAME");
    process.exit(1);
  }
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY || !R2_SECRET || !R2_BUCKET) {
    console.error("Faltan variables CLOUDFLARE_R2_* (ACCOUNT_ID, ACCESS_KEY_ID, SECRET_ACCESS_KEY, BUCKET_NAME)");
    process.exit(1);
  }

  console.log("Supabase:", SUPABASE_URL ? SUPABASE_URL.replace(/https?:\/\/([^.]+).*/, "$1...") : "NO");
  if (!SUPABASE_URL?.includes("supabase")) {
    console.error("NEXT_PUBLIC_SUPABASE_URL no parece correcta. ¿Estás en la raíz del proyecto y .env.local existe?");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE);
  const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY, secretAccessKey: R2_SECRET },
    forcePathStyle: true,
  });
  const cloudinaryBase = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`;

  const only = process.env.ONLY; // "fotos" | "services" | undefined = ambos
  if (only !== "services") await migrateFotos(supabase, r2, cloudinaryBase);
  if (only !== "fotos") await migrateServices(supabase, r2, cloudinaryBase, R2_PUBLIC_URL);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
