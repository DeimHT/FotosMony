# Checkout Webpay y envío de fotos por email

## Variables de entorno

Añade estas variables en tu `.env.local` (o en el panel de Vercel/hosting):

### Webpay (Transbank)

- **`WEBPAY_API_KEY_ID`** — Código de comercio (Transbank te lo entrega).
- **`WEBPAY_API_KEY_SECRET`** — Llave secreta del comercio.
- **`WEBPAY_BASE_URL`** — Opcional. Por defecto usa integración: `https://webpay3gint.transbank.cl`. En producción: `https://webpay3g.transbank.cl`.

### Email (Resend)

- **`RESEND_API_KEY`** — API key de [Resend](https://resend.com) para enviar los correos con los enlaces de descarga.
- **`RESEND_FROM`** — Remitente del correo, ej: `"FotosMony <ventas@tudominio.com>"`. Si no se define, se usa `onboarding@resend.dev` (solo pruebas).

### App

- **`NEXT_PUBLIC_APP_URL`** — URL pública del sitio (ej: `https://fotosmony.cl`). Se usa para la `return_url` de Webpay y para enlaces en el email.

## Base de datos

Ejecuta el script `supabase-orders.sql` en el SQL Editor de Supabase para crear las tablas `orders` y `order_items`.

## Flujo

1. Usuario agrega fotos al carrito y va a **Carrito**.
2. Si es **invitado**: completa nombre y correo. Si tiene **sesión**: se usan sus datos.
3. Clic en **Pagar con Webpay** → se crea la orden en BD y la transacción en Webpay → redirección al formulario de pago de Transbank.
4. Tras pagar, Webpay redirige a `/api/checkout/return` (GET o POST con `token_ws`).
5. Esa ruta redirige a `/carrito/confirmar?token_ws=...`.
6. La página de confirmación llama a `POST /api/checkout/confirm` con el token. El backend confirma con Webpay; si el pago es aprobado, marca la orden como pagada y envía un correo al comprador con enlaces a las fotos originales (Cloudinary, sin marca de agua).
7. El usuario ve “Pago exitoso” y el carrito se vacía.

## Fotos originales en el email

El correo incluye enlaces directos a Cloudinary en formato original (sin transformación), para que el comprador descargue las fotos sin marca de agua. La URL usada es: `https://res.cloudinary.com/{cloud}/image/upload/{public_id}`.
