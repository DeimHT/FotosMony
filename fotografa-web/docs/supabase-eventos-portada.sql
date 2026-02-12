-- Añade la columna cover_public_id a la tabla eventos para la foto de portada.
-- Ejecuta este script en el SQL Editor de Supabase.

ALTER TABLE eventos
ADD COLUMN IF NOT EXISTS cover_public_id text;

COMMENT ON COLUMN eventos.cover_public_id IS 'public_id de la foto en Cloudinary usada como portada del evento (opcional).';
