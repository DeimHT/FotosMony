# 📊 Guía de Monitoreo de Ancho de Banda

## 🎯 Objetivo
Mantener el uso de ancho de banda por debajo de 10 GB/mes en Vercel (plan gratuito).

## 📈 Cómo Monitorear

### 1. Dashboard de Vercel
1. Ve a [vercel.com/dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto
3. Ve a la pestaña "Analytics" o "Usage"
4. Busca "Fast Origin Transfer" o "Bandwidth"
5. Revisa el uso diario y mensual

**Frecuencia recomendada**: Cada 2-3 días durante el primer mes después de las optimizaciones.

### 2. Dashboard de Cloudinary
1. Ve a [cloudinary.com/console](https://cloudinary.com/console)
2. Ve a "Reports" → "Usage"
3. Revisa:
   - Transformations: cuántas imágenes se están procesando
   - Bandwidth: ancho de banda usado (Cloudinary tiene 25 GB gratis/mes)
   - Storage: espacio usado

**Nota**: Cloudinary es tu CDN principal, así que la mayor parte del tráfico debería aparecer aquí, NO en Vercel.

### 3. Google Analytics (Opcional pero recomendado)
Si instalas Google Analytics, podrás ver:
- Páginas más visitadas
- Qué galerías tienen más tráfico
- De dónde vienen los visitantes

## 🚨 Alertas y Umbrales

| Uso Mensual | Estado | Acción |
|-------------|--------|--------|
| 0-5 GB | ✅ Excelente | Continuar monitoreando |
| 5-7 GB | ⚠️ Precaución | Revisar páginas más visitadas |
| 7-9 GB | 🟡 Alerta | Implementar optimizaciones adicionales |
| 9-10 GB | 🔴 Crítico | Reducir calidad de imágenes urgentemente |
| >10 GB | ❌ Límite excedido | Vercel cobrará extra o limitará el servicio |

## 🔧 Cómo Ajustar la Calidad de Imágenes

Si necesitas reducir más el ancho de banda, edita el archivo `lib/imageConfig.ts`:

```typescript
export const IMAGE_CONFIG = {
  // Cambia estos valores según necesites:
  GALLERY_QUALITY: 'auto:eco',    // Opciones: 'auto:best', 'auto:good', 'auto:eco', 'auto:low'
  GALLERY_WIDTH: 600,              // Opciones: 400, 600, 800, 1000

  THUMBNAIL_QUALITY: 'auto:eco',
  THUMBNAIL_WIDTH: 600,

  MAIN_QUALITY: 'auto:good',
  MAIN_WIDTH: 800,

  WATERMARK_QUALITY: 'auto:eco',
  WATERMARK_WIDTH: 600,
};
```

### Escenarios de Ajuste

#### Escenario 1: Estás usando 8-9 GB/mes (cerca del límite)
```typescript
GALLERY_QUALITY: 'auto:low',     // Reduce a calidad baja
GALLERY_WIDTH: 500,              // Reduce el ancho
THUMBNAIL_QUALITY: 'auto:low',
THUMBNAIL_WIDTH: 500,
```
**Impacto**: Reducción de ~50% en ancho de banda, calidad visualmente aceptable en pantallas pequeñas.

#### Escenario 2: Estás usando 5-7 GB/mes (zona segura)
```typescript
GALLERY_QUALITY: 'auto:eco',     // Mantén calidad económica
GALLERY_WIDTH: 600,
THUMBNAIL_QUALITY: 'auto:eco',
THUMBNAIL_WIDTH: 600,
```
**Impacto**: Balance ideal entre calidad y ancho de banda.

#### Escenario 3: Estás usando <3 GB/mes (sobrado)
```typescript
GALLERY_QUALITY: 'auto:good',    // Puedes subir a buena calidad
GALLERY_WIDTH: 800,
THUMBNAIL_QUALITY: 'auto:good',
THUMBNAIL_WIDTH: 800,
```
**Impacto**: Mejor calidad visual, mayor satisfacción del cliente.

## 📊 Calculadora de Ancho de Banda

Usa esta fórmula para estimar tu uso mensual:

```
Visitas/día × Páginas/visita × Imágenes/página × Tamaño/imagen × 30 días = Uso mensual
```

**Ejemplo actual (optimizado):**
```
100 visitas/día × 3 páginas × 5 imágenes × 35 KB × 30 días = 1.575 GB/mes ✅
```

**Ejemplo sin optimizar:**
```
100 visitas/día × 3 páginas × 5 imágenes × 150 KB × 30 días = 6.75 GB/mes ⚠️
```

## 🎯 Optimizaciones Adicionales (Si es necesario)

### 1. Paginación en Galerías Grandes
Si tienes galerías con más de 50 fotos, considera mostrar solo 20-30 por página:

```typescript
// En la página de galería
const ITEMS_PER_PAGE = 20;
const [page, setPage] = useState(1);
const displayedPhotos = photos.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
```

**Impacto**: Reduce carga inicial en 60-80%.

### 2. Lazy Loading Agresivo
Ya implementado, pero puedes hacerlo más agresivo:

```typescript
<img
  src={imageUrl}
  loading="lazy"
  decoding="async"  // Agrega esto
  fetchpriority="low"  // Y esto
/>
```

### 3. Placeholders con Blur
Muestra un placeholder borroso mientras carga la imagen real:

```typescript
// Cloudinary puede generar thumbnails ultra pequeños
const placeholderUrl = `https://res.cloudinary.com/${cloud}/image/upload/w_50,q_auto:low,e_blur:1000/${publicId}`;
```

### 4. Caché del Navegador
Ya está implementado automáticamente por Cloudinary, pero puedes verificarlo:
- Abre DevTools (F12)
- Ve a Network → Img
- Recarga la página
- Las imágenes deberían mostrar "from cache" en la segunda carga

## 📞 Cuándo Considerar el Plan Pro

Solo considera pagar por Vercel Pro ($20/mes) si:

1. ✅ Ya implementaste TODAS las optimizaciones
2. ✅ Estás usando calidad 'auto:low' y aún superas 10 GB/mes
3. ✅ Tienes tráfico consistente >10,000 visitas/mes
4. ✅ Tu negocio genera suficientes ingresos para justificar el gasto

**Alternativa más económica:**
- Cloudinary tiene 25 GB/mes gratis (2.5x más que Vercel)
- Si superas eso, Cloudinary Plus cuesta $99/año (~$8/mes)
- Vercel Pro cuesta $240/año ($20/mes)

## 📝 Checklist de Optimización

- [x] Reducir tamaño de imágenes (1200px → 600px)
- [x] Usar calidad 'auto:eco' en galerías
- [x] Implementar lazy loading
- [x] Usar formato WebP automático (f_auto)
- [ ] Migrar imágenes de Unsplash a Cloudinary (opcional)
- [ ] Implementar paginación en galerías grandes (si es necesario)
- [ ] Instalar Google Analytics para monitoreo (recomendado)
- [ ] Configurar alertas de uso en Vercel (si está disponible)

## 🔍 Herramientas de Diagnóstico

### Verificar tamaño de imágenes
1. Abre tu sitio web
2. F12 → Network → Img
3. Recarga la página
4. Ordena por "Size" (tamaño)
5. Verifica que las imágenes sean <50 KB en galerías

### Verificar formato WebP
1. F12 → Network → Img
2. Click en cualquier imagen
3. Ve a "Headers" → "Response Headers"
4. Busca "Content-Type: image/webp"
5. Si dice "image/jpeg", el navegador no soporta WebP (raro en 2026)

### Verificar lazy loading
1. F12 → Network → Img
2. Recarga la página
3. Solo deberían cargarse las imágenes visibles
4. Haz scroll y verás más imágenes cargándose

## 💡 Tips Finales

1. **Monitorea semanalmente** durante el primer mes
2. **Ajusta la calidad gradualmente** si es necesario
3. **No sacrifiques calidad innecesariamente** - encuentra el balance
4. **Comunica a tus clientes** si reduces calidad de previews (la versión comprada siempre es alta calidad)
5. **Considera CDN adicional** solo si realmente lo necesitas (Cloudinary ya es un CDN)

## 🆘 Soporte

Si después de todo esto sigues teniendo problemas:
1. Revisa los logs de Vercel para ver qué archivos consumen más
2. Usa herramientas como [WebPageTest](https://www.webpagetest.org/) para analizar tu sitio
3. Considera contratar un desarrollador para optimizaciones avanzadas
4. Como último recurso, evalúa el plan Pro de Vercel
