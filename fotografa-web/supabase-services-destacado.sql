-- Añadir columna "destacado" a la tabla services para mostrar hasta 3 en el inicio
-- Ejecutar en Supabase → SQL Editor

ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS destacado BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.services.destacado IS 'Si true, aparece en la sección Servicios Destacados del inicio (máx. 3)';
