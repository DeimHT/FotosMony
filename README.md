# FotosMony — Sitio web para fotógrafa

Sitio web profesional para una fotógrafa: portafolio, galerías de eventos por compra, carrito, checkout con Webpay (Transbank) y panel de administración.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Supabase** — auth, base de datos, perfiles
- **Cloudflare R2** — almacenamiento de fotos (nuevas subidas)
- **Resend** — envío de emails (enlaces de descarga tras el pago)
- **Webpay Plus (Transbank)** — pagos con tarjeta
- **Tailwind CSS** — estilos

## Funcionalidades

- **Público:** Inicio editable, eventos y subeventos con galerías, compra de fotos, carrito, checkout con Webpay, envío de enlaces por email (R2 o Cloudinary según la foto), portafolio, servicios, contacto, búsqueda.
- **Admin:** Panel con métricas, gestión de eventos/subeventos, subida de fotos (R2), precios, portafolio, clientes, mensajes de contacto, configuración (marca de agua, secciones del home).

## Requisitos

- Node.js 18+
- Cuenta en Supabase, Cloudinary (opcional si todo está en R2), Cloudflare R2, Resend. Para pagos: comercio en Transbank.

## Instalación

```bash
git clone https://github.com/tu-usuario/fotografa-web.git
cd fotografa-web
npm install
```

Copia las variables de entorno y complétalas:

```bash
cp .env.example .env.local
```

Descripción de cada variable en `.env.example`. Las obligatorias mínimas para desarrollo son: Supabase (URL, anon key, service role), Cloudinary (cloud name y, si usas galerías, API key/secret), R2 (si subes fotos desde el admin) y `NEXT_PUBLIC_APP_URL`.

## Scripts

| Comando        | Descripción                    |
|----------------|--------------------------------|
| `npm run dev`  | Servidor de desarrollo         |
| `npm run build`| Build de producción            |
| `npm run start`| Servidor de producción         |
| `npm run lint` | Ejecutar ESLint                |

## Estructura del proyecto

```
app/
  (site)/          # Rutas públicas: inicio, eventos, carrito, contacto, etc.
  (auth)/          # Login y registro
  api/             # API Routes: checkout, admin, contacto, búsqueda, etc.
components/        # Componentes UI y contexto (carrito)
lib/               # Lógica compartida: Supabase, Cloudinary, email, Webpay, etc.
docs/              # Documentación y scripts SQL (esquemas, migraciones, Webpay)
scripts/           # Scripts de migración (Cloudinary → R2, etc.)
public/            # Assets estáticos
```

La documentación técnica (Webpay, variables de entorno del checkout, optimizaciones, migración a R2) está en la carpeta **`docs/`**.

## Despliegue

El proyecto está pensado para desplegar en **Vercel**. Configura las mismas variables de entorno en el panel del proyecto y, si usas Webpay en producción, define `WEBPAY_BASE_URL` con la URL de producción de Transbank.

---

Proyecto de portfolio. Uso libre bajo tu criterio para referencia o aprendizaje.
