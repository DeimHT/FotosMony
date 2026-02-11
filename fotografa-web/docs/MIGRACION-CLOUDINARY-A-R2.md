# Migrar de Cloudinary a Cloudflare R2

Este documento describe cómo pasar **fotos de eventos** (tabla `fotos`) y **imágenes de servicios** (tabla `services`) de Cloudinary a Cloudflare R2 y dejar de usar Cloudinary.

## Requisitos

- Variables de entorno en `.env.local`:
  - **Supabase**: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
  - **Cloudinary** (solo lectura para este script): `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` o `CLOUDINARY_CLOUD_NAME`
  - **Cloudflare R2**: `CLOUDFLARE_R2_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_R2_BUCKET_NAME`

## Pasos

El script migra **fotos** y **servicios** en una sola ejecución. Para migrar solo uno: `ONLY=fotos` o `ONLY=services`.

### 1. Por qué la DB no se actualizó en una ejecución anterior

Si ejecutaste el script y en Supabase siguen apareciendo `storage_provider = cloudinary`:

- Asegúrate de ejecutar **desde la raíz del proyecto** (`c:\...\fotografa-web`) para que se cargue `.env.local` correctamente.
- El script ahora **sobrescribe** las variables de entorno con las de `.env.local` (Supabase, R2, Cloudinary), así se evita usar otro proyecto por variables del sistema.
- Al inicio verás `Supabase: xxxxx...`; comprueba que sea el mismo proyecto que en el dashboard de Supabase.
- Vuelve a ejecutar sin `DRY_RUN`; solo se procesarán las filas que sigan con `storage_provider` = `cloudinary` o `null`.

### 2. Prueba en modo simulación (opcional)

No sube nada a R2 ni modifica la base de datos; solo lista y simula:

```bash
DRY_RUN=1 npx tsx scripts/migrate-cloudinary-to-r2.ts
```

En Windows PowerShell:

```powershell
$env:DRY_RUN="1"; npx tsx scripts/migrate-cloudinary-to-r2.ts
```

### 3. Ejecutar la migración

Desde la raíz del proyecto:

```bash
npx tsx scripts/migrate-cloudinary-to-r2.ts
```

El script:

- Lista todas las filas de `fotos` con `storage_provider` = `cloudinary` o `null`
- Para cada una: descarga la imagen desde Cloudinary, la sube a R2 en `eventos/{evento_id|sub_evento_id}/{uuid}.{ext}`, actualiza la fila (`public_id` = nueva ruta, `storage_provider` = `cloudflare`)
- Si la foto es portada de un evento (`eventos.cover_public_id`), actualiza también `eventos.cover_public_id` y `eventos.cover_storage_provider`
- **Servicios**: descarga cada imagen desde Cloudinary, la sube a R2 en `services/{id}/{uuid}.{ext}`, y actualiza `services.image_url` y `services.image_public_id`.

### 4. Después de migrar

- Las galerías (eventos, subeventos, carrito, watermark) seguirán funcionando: el código ya usa `storage_provider` para elegir Cloudinary o R2.
- **Eliminar una foto** en el admin borra el archivo en R2 (o en Cloudinary si aún hubiera alguna con `storage_provider` = `cloudinary`).
- Puedes dejar de usar Cloudinary **solo para la galería de fotos**. Si quieres seguir usándolo para **portafolio**, **servicios** o **marca de agua** (upload), mantén las variables de Cloudinary en `.env.local`. Si no usas esas funciones, puedes quitarlas.

## Notas

- **Portafolio (carpetas)**: las nuevas carpetas y fotos se suben a R2. La migración incluye fotos con `carpeta_id` (ruta en R2: `carpetas/{carpeta_id}/{uuid}.{ext}`). Añade `NEXT_PUBLIC_R2_PUBLIC_URL` en `.env.local` (mismo valor que `CLOUDFLARE_R2_PUBLIC_URL`) para que el cliente pueda mostrar imágenes de R2 en portafolio y admin.
- Si algo falla a mitad del script, puedes volver a ejecutarlo: las filas ya migradas tienen `storage_provider` = `cloudflare` y el script solo procesa `cloudinary` o `null`.
- No se borran las imágenes en Cloudinary; si quieres liberar espacio, bórralas manualmente desde el dashboard de Cloudinary después de comprobar que todo funciona en R2.
