/**
 * Configuración centralizada para optimización de imágenes
 * 
 * Ajusta estos valores para controlar el balance entre calidad y ancho de banda:
 * - 'auto:best': Máxima calidad (~100 KB por imagen)
 * - 'auto:good': Buena calidad (~60 KB por imagen) - RECOMENDADO
 * - 'auto:eco': Calidad económica (~30 KB por imagen) - Para ahorrar ancho de banda
 * - 'auto:low': Baja calidad (~15 KB por imagen) - Solo en emergencias
 */

export const IMAGE_CONFIG = {
  // Calidad para galerías de eventos (donde hay muchas imágenes)
  GALLERY_QUALITY: 'auto:eco' as const,
  GALLERY_WIDTH: 600,

  // Calidad para cards/thumbnails (portadas de eventos, servicios)
  THUMBNAIL_QUALITY: 'auto:eco' as const,
  THUMBNAIL_WIDTH: 600,

  // Calidad para imágenes principales (hero, destacados)
  MAIN_QUALITY: 'auto:good' as const,
  MAIN_WIDTH: 800,

  // Calidad para imágenes con marca de agua
  WATERMARK_QUALITY: 'auto:eco' as const,
  WATERMARK_WIDTH: 600,
} as const;

/**
 * Estadísticas aproximadas de tamaño de archivo por calidad:
 * 
 * Para una imagen de 600px de ancho:
 * - auto:best: ~100-120 KB
 * - auto:good: ~60-80 KB
 * - auto:eco: ~30-40 KB
 * - auto:low: ~15-20 KB
 * 
 * Impacto en ancho de banda (100 visitas/día, 10 imágenes/visita):
 * - auto:best: 1,000 imágenes × 100 KB = 100 MB/día = 3 GB/mes
 * - auto:good: 1,000 imágenes × 70 KB = 70 MB/día = 2.1 GB/mes
 * - auto:eco: 1,000 imágenes × 35 KB = 35 MB/día = 1.05 GB/mes ✅
 * - auto:low: 1,000 imágenes × 17 KB = 17 MB/día = 0.5 GB/mes
 */
