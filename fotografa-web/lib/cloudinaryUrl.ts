/**
 * Helpers para URLs de Cloudinary (cliente).
 * Usa NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME.
 */

import { IMAGE_CONFIG } from './imageConfig';

export function cldUrl(
  publicId: string, 
  w: number = IMAGE_CONFIG.MAIN_WIDTH, 
  quality: string = IMAGE_CONFIG.MAIN_QUALITY
): string {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  // f_auto: formato automático (webp cuando sea posible)
  // q_auto:X: calidad optimizada
  // w_: ancho máximo
  return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_${quality},w_${w}/${publicId}`;
}

/** Versión de la API de marca de agua; al subir cambia la URL y se invalida caché antigua */
const WATERMARK_API_VERSION = "2";

/**
 * URL de imagen con marca de agua generada por nuestro servidor (Sharp).
 * storage: "cloudflare" = R2; "supabase" = Supabase Storage; si no, Cloudinary.
 */
export function watermarkUrl(
  publicId: string,
  w: number = IMAGE_CONFIG.WATERMARK_WIDTH,
  storage?: "cloudinary" | "supabase" | "cloudflare" | null
): string {
  const params = new URLSearchParams({
    public_id: publicId,
    w: String(w),
    v: WATERMARK_API_VERSION,
  });
  if (storage === "supabase") params.set("storage", "supabase");
  else if (storage === "cloudflare") params.set("storage", "cloudflare");
  return `/api/watermark?${params.toString()}`;
}

/**
 * @deprecated Usar watermarkUrl() para evitar créditos de Cloudinary.
 * URL de imagen con marca de agua vía Cloudinary (consume transformaciones).
 */
export function cldUrlWithWatermark(
  publicId: string,
  w: number = IMAGE_CONFIG.WATERMARK_WIDTH,
  quality: string = IMAGE_CONFIG.WATERMARK_QUALITY
): string {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const watermarkId = process.env.NEXT_PUBLIC_CLOUDINARY_WATERMARK_PUBLIC_ID;

  if (watermarkId) {
    const overlay = `l_${watermarkId},a_45,w_520,o_32,g_center/fl_layer_apply`;
    return `https://res.cloudinary.com/${cloud}/image/upload/w_${w},f_auto,q_${quality}/${overlay}/${publicId}`;
  }

  const text = encodeURIComponent("FotosMony");
  const overlay = `l_text:Arial_96_bold:${text},a_45,g_center,co_white,o_32/fl_layer_apply`;
  return `https://res.cloudinary.com/${cloud}/image/upload/w_${w},f_auto,q_${quality}/${overlay}/${publicId}`;
}

/**
 * URL de thumbnail pequeño para previsualizaciones (ahorra mucho ancho de banda)
 */
export function cldUrlThumbnail(
  publicId: string, 
  w: number = IMAGE_CONFIG.THUMBNAIL_WIDTH
): string {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_${IMAGE_CONFIG.THUMBNAIL_QUALITY},w_${w}/${publicId}`;
}
