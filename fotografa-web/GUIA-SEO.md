# Guía SEO - FotosMony (fotosmony.cl)

## ✅ Lo que ya está implementado

### Metadata principal
- **Título**: "FotosMony | Fotografía Profesional Región de los Lagos, Chile"
- **Descripción**: Incluye "fotos mony", fotografía, Región de los Lagos, sesiones, bodas
- **Palabras clave**: fotos mony, FotosMony, fotografía región de los lagos, fotógrafo Chile, etc.
- **Open Graph** y **Twitter** para redes sociales

### Páginas con metadata específica
- Inicio, Eventos, Servicios, Portafolio, Contacto

### Datos estructurados (JSON-LD)
- Schema "Photographer" en la página principal para que Google entienda el negocio

### robots.txt
- Permite a Google indexar todo excepto /admin/, /api/, /login, etc.
- Enlace al sitemap

### sitemap.xml
- Se genera automáticamente con todas las páginas públicas
- Incluye eventos y carpetas del portafolio de forma dinámica

## 📋 Próximos pasos para aparecer en Google

### 1. Configurar la URL en producción
En Vercel (o tu hosting), asegúrate de tener:
```
NEXT_PUBLIC_APP_URL=https://fotosmony.cl
```
Usa **https** para producción.

### 2. Google Search Console
1. Ve a [search.google.com/search-console](https://search.google.com/search-console)
2. Agrega la propiedad `https://fotosmony.cl`
3. Verifica el dominio (DNS o archivo HTML)
4. Envía el sitemap: `https://fotosmony.cl/sitemap.xml`

### 3. Tiempo de indexación
- Google puede tardar **días o semanas** en indexar un sitio nuevo
- Pedir indexación manual en Search Console acelera el proceso
- En "Inspección de URLs" pega tu URL y haz clic en "Solicitar indexación"

### 4. Consejos adicionales
- **Enlaces externos**: Que otros sitios enlacen a fotosmony.cl
- **Contenido**: Mantén las galerías actualizadas (el sitemap se regenera)
- **Velocidad**: Tu sitio ya está optimizado (imágenes, lazy loading)
- **Móvil**: Next.js genera HTML responsive por defecto
