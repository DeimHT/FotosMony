-- Origen de cada foto: cloudinary (histórico), supabase (Storage) o cloudflare (R2).
-- Ejecuta en Supabase (SQL Editor).

-- 1) Origen del archivo: 'cloudinary' (por defecto), 'supabase' o 'cloudflare'
ALTER TABLE fotos
  ADD COLUMN IF NOT EXISTS storage_provider text DEFAULT 'cloudinary';

COMMENT ON COLUMN fotos.storage_provider IS 'cloudinary = Cloudinary (public_id). supabase = Supabase Storage (public_id = ruta en bucket). cloudflare = Cloudflare R2 (public_id = ruta en bucket).';

-- 2) Para la portada del evento: guardar también el origen (opcional)
ALTER TABLE eventos
  ADD COLUMN IF NOT EXISTS cover_storage_provider text;

COMMENT ON COLUMN eventos.cover_storage_provider IS 'Mismo que storage_provider de la foto usada como portada: cloudinary, supabase o cloudflare.';

-- 3) Opcional: bucket en Supabase Storage (si usas storage_provider = supabase):
--    Nombre: fotos, Public: sí.
-- 4) Nuevas fotos se suben a Cloudflare R2; configurar CLOUDFLARE_R2_* y CLOUDFLARE_R2_PUBLIC_URL en .env.
