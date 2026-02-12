-- Ejecuta este script en Supabase (SQL Editor) para permitir detectar fotos duplicadas al subir.
-- Añade la columna content_hash a la tabla fotos (hash SHA-256 del contenido de la imagen).

ALTER TABLE fotos
ADD COLUMN IF NOT EXISTS content_hash text;

-- Opcional: índice para búsquedas rápidas de duplicados por evento/subevento
CREATE INDEX IF NOT EXISTS idx_fotos_content_hash_evento
ON fotos (evento_id, content_hash)
WHERE evento_id IS NOT NULL AND content_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_fotos_content_hash_subevento
ON fotos (sub_evento_id, content_hash)
WHERE sub_evento_id IS NOT NULL AND content_hash IS NOT NULL;
