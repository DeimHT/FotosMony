/**
 * Helpers para URLs de Cloudinary (cliente).
 * Usa NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME.
 */

import { IMAGE_CONFIG } from './imageConfig';

export function cldUrl(
  publicId: string, 
  w = IMAGE_CONFIG.MAIN_WIDTH, 
  quality = IMAGE_CONFIG.MAIN_QUALITY
): string {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  // f_auto: formato automático (webp cuando sea posible)
  // q_auto:X: calidad optimizada
  // w_: ancho máximo
  return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_${quality},w_${w}/${publicId}`;
}

/**
 * URL de imagen con marca de agua (para galería de eventos).
 * Una sola marca centrada, diagonal 45°, más grande y menos opacidad.
 */
export function cldUrlWithWatermark(
  publicId: string, 
  w = IMAGE_CONFIG.WATERMARK_WIDTH, 
  quality = IMAGE_CONFIG.WATERMARK_QUALITY
): string {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const watermarkId = process.env.NEXT_PUBLIC_CLOUDINARY_WATERMARK_PUBLIC_ID;

  if (watermarkId) {
    // Logo centrado, rotado 45°, ancho 520px, opacidad ~32%
    const overlay = `l_${watermarkId},a_45,w_520,o_32,g_center/fl_layer_apply`;
    return `https://res.cloudinary.com/${cloud}/image/upload/w_${w},f_auto,q_${quality}/${overlay}/${publicId}`;
  }

  // Fallback: texto "FotosMony" centrado, rotado, grande
  const text = encodeURIComponent("FotosMony");
  const overlay = `l_text:Arial_96_bold:${text},a_45,g_center,co_white,o_32/fl_layer_apply`;
  return `https://res.cloudinary.com/${cloud}/image/upload/w_${w},f_auto,q_${quality}/${overlay}/${publicId}`;
}

/**
 * URL de thumbnail pequeño para previsualizaciones (ahorra mucho ancho de banda)
 */
export function cldUrlThumbnail(
  publicId: string, 
  w = IMAGE_CONFIG.THUMBNAIL_WIDTH
): string {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_${IMAGE_CONFIG.THUMBNAIL_QUALITY},w_${w}/${publicId}`;
}
