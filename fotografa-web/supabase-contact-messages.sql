-- Tabla para mensajes del formulario de contacto
-- Ejecutar en Supabase → SQL Editor

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  asunto TEXT,
  mensaje TEXT NOT NULL,
  leido BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: solo el backend (service role) puede insertar/leer; anon no accede directo
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Política: nadie puede leer/insertar desde el cliente (anon).
-- La API usa service role y no está afectada por RLS.
-- Si quieres que el admin vea mensajes desde el cliente, añade una política
-- que permita SELECT/UPDATE solo para usuarios con role = 'admin'.

COMMENT ON TABLE public.contact_messages IS 'Mensajes enviados desde el formulario de contacto';
