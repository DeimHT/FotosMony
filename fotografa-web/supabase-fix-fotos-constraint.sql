-- Corregir el check constraint de fotos para permitir fotos de portafolio (carpeta_id)
-- Ejecutar en Supabase → SQL Editor

-- 1. Quitar el constraint antiguo (solo evento o subevento)
ALTER TABLE public.fotos
  DROP CONSTRAINT IF EXISTS foto_evento_o_subevento;

-- 2. Añadir constraint que permita: evento, subevento O carpeta (portafolio)
ALTER TABLE public.fotos
  ADD CONSTRAINT foto_evento_subevento_o_carpeta CHECK (
    (evento_id IS NOT NULL OR sub_evento_id IS NOT NULL OR carpeta_id IS NOT NULL)
  );
