import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";

const CACHE_MAX_AGE = 60 * 60; // 1 hora (cambios en marcas de agua se ven antes)
const BLACK_THRESHOLD = 25; // píxeles más oscuros que esto → transparentes (quita fondo negro del PNG)
const WATERMARK_OPACITY = 0.5; // 0 = invisible, 1 = opaco (marca más suave)

const FOTOS_BUCKET = "fotos";

export async function GET(request: NextRequest) {
  const publicId = request.nextUrl.searchParams.get("public_id");
  const storageParam = request.nextUrl.searchParams.get("storage");
  const wParam = request.nextUrl.searchParams.get("w");
  const width = wParam ? Math.min(2000, Math.max(200, parseInt(wParam, 10))) : 600;
  const fromSupabase = storageParam === "supabase";
  const fromCloudflare = storageParam === "cloudflare";

  if (!publicId || publicId.length > 500) {
    return NextResponse.json({ error: "public_id inválido" }, { status: 400 });
  }

  let sourceUrl: string;
  if (fromCloudflare) {
    const r2PublicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;
    if (!r2PublicUrl) {
      return NextResponse.json({ error: "Cloudflare R2 no configurado (CLOUDFLARE_R2_PUBLIC_URL)" }, { status: 500 });
    }
    sourceUrl = `${r2PublicUrl.replace(/\/$/, "")}/${publicId}`;
  } else if (fromSupabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      return NextResponse.json({ error: "Supabase no configurado" }, { status: 500 });
    }
    sourceUrl = `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${FOTOS_BUCKET}/${publicId}`;
  } else {
    const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (!cloud) {
      return NextResponse.json({ error: "Cloudinary no configurado" }, { status: 500 });
    }
    sourceUrl = `https://res.cloudinary.com/${cloud}/image/upload/${publicId}`;
  }

  try {
    const imageRes = await fetch(sourceUrl, { cache: "force-cache" });
    if (!imageRes.ok) {
      return NextResponse.json(
        { error: "No se pudo cargar la imagen" },
        { status: 502 }
      );
    }
    const imageBuffer = Buffer.from(await imageRes.arrayBuffer());

    // Aplicar orientación EXIF primero; luego leer dimensiones del buffer ya rotado
    const rotatedBuffer = await sharp(imageBuffer).rotate().toBuffer();
    const image = sharp(rotatedBuffer);
    const meta = await image.metadata();
    const baseWidth = meta.width ?? 1200;
    const baseHeight = meta.height ?? 800;
    const targetWidth = Math.min(width, baseWidth);
    const targetHeight = Math.round((targetWidth / baseWidth) * baseHeight);
    const isVertical = targetHeight >= targetWidth;

    // Marca de agua según orientación: vertical → watermarkVertical.png, horizontal → watermarkHorizontal.png
    const watermarkFileName = isVertical ? "watermarkVertical.png" : "watermarkHorizontal.png";
    const watermarkPath = path.resolve(process.cwd(), "public", watermarkFileName);
    let watermarkBuffer: Buffer;
    try {
      watermarkBuffer = await fs.readFile(watermarkPath);
    } catch {
      return NextResponse.json(
        { error: `Marca de agua no encontrada (public/${watermarkFileName})` },
        { status: 500 }
      );
    }

    // Quitar fondo negro del PNG: píxeles oscuros → transparentes; solo se ve el logo/texto claro
    const wmRaw = await sharp(watermarkBuffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const { data: wmData, info: wmInfo } = wmRaw;
    for (let i = 0; i < wmInfo.width * wmInfo.height; i++) {
      const r = wmData[i * 4];
      const g = wmData[i * 4 + 1];
      const b = wmData[i * 4 + 2];
      if (r <= BLACK_THRESHOLD && g <= BLACK_THRESHOLD && b <= BLACK_THRESHOLD) {
        wmData[i * 4 + 3] = 0;
      }
    }
    const watermarkSinFondo = await sharp(wmData, {
      raw: { width: wmInfo.width, height: wmInfo.height, channels: 4 },
    })
      .png()
      .toBuffer();

    const wmAspect = wmInfo.width / wmInfo.height;

    // Verticales: misma altura que la imagen. Horizontales: mismo ancho que la imagen.
    // Se limita el otro lado para no superar la imagen (composite exige overlay ≤ base).
    let wmW: number;
    let wmH: number;
    if (isVertical) {
      wmH = targetHeight;
      wmW = Math.min(Math.round(wmH * wmAspect), targetWidth);
    } else {
      wmW = targetWidth;
      wmH = Math.min(Math.round(wmW / wmAspect), targetHeight);
    }

    const watermarkResized = await sharp(watermarkSinFondo)
      .resize(wmW, wmH)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { data: wmResizedData, info: wmResizedInfo } = watermarkResized;
    for (let i = 0; i < wmResizedInfo.width * wmResizedInfo.height; i++) {
      wmResizedData[i * 4 + 3] = Math.round(wmResizedData[i * 4 + 3] * WATERMARK_OPACITY);
    }
    const watermarkProcessed = await sharp(wmResizedData, {
      raw: { width: wmResizedInfo.width, height: wmResizedInfo.height, channels: 4 },
    })
      .png()
      .toBuffer();

    const left = Math.round((targetWidth - wmW) / 2);
    const top = Math.round((targetHeight - wmH) / 2);

    const result = await image
      .resize(targetWidth)
      .webp({ quality: 82 })
      .composite([
        {
          input: watermarkProcessed,
          left,
          top,
          blend: "over",
        },
      ])
      .toBuffer();

    return new NextResponse(new Uint8Array(result), {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": `public, max-age=${CACHE_MAX_AGE}, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=86400`,
      },
    });
  } catch (err) {
    console.error("[watermark]", err);
    return NextResponse.json(
      { error: "Error al generar la imagen con marca de agua" },
      { status: 500 }
    );
  }
}
