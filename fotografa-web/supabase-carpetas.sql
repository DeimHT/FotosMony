-- 1. Tabla carpetas (portafolio) — solo esta tabla se crea nueva
CREATE TABLE IF NOT EXISTS public.carpetas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Añadir columna carpeta_id a la tabla fotos que ya existe (eventos + portafolio)
-- Si la columna ya existe, no hace nada.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'fotos' AND column_name = 'carpeta_id'
  ) THEN
    ALTER TABLE public.fotos
    ADD COLUMN carpeta_id UUID REFERENCES public.carpetas(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3. Índice para consultas por carpeta
CREATE INDEX IF NOT EXISTS idx_fotos_carpeta_id ON public.fotos(carpeta_id);

-- 4. RLS en carpetas
ALTER TABLE public.carpetas ENABLE ROW LEVEL SECURITY;

-- Política: permitir lectura pública (página de portafolio)
DROP POLICY IF EXISTS "Permitir lectura pública de carpetas" ON public.carpetas;
CREATE POLICY "Permitir lectura pública de carpetas"
  ON public.carpetas FOR SELECT
  USING (true);

-- 5. Comentarios
COMMENT ON TABLE public.carpetas IS 'Carpetas del portafolio (galerías)';
