-- Contenido editable del home (hero + sobre nosotros).
-- Ejecutar en el SQL Editor de Supabase para que la edición desde /admin/inicio funcione.
-- Si la tabla no existe, la página de inicio usa los textos e imágenes por defecto definidos en código.

create table if not exists home_sections (
  id text primary key check (id in ('hero', 'about')),
  content jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- Permitir lectura pública para la página de inicio
alter table home_sections enable row level security;

create policy "home_sections_select_public"
  on home_sections for select
  using (true);

-- Inserts/updates se hacen desde la API admin con service role (bypasea RLS).
-- No hace falta policy de escritura para anon/authenticated.

-- Opcional: insertar valores por defecto (si prefieres que la primera carga ya tenga algo)
-- insert into home_sections (id, content) values
--   ('hero', '{"title":"Capturamos tus\nmomentos más\nespeciales","subtitle":"En FotosMony ofrecemos...","cta_primary_text":"Ver Nuestros Servicios","cta_secondary_text":"Contactar Ahora","badge_title":"+500 Sesiones","badge_subtitle":"Realizadas con éxito"}'::jsonb),
--   ('about', '{"section_title":"Sobre FotosMony",...}'::jsonb)
-- on conflict (id) do nothing;
