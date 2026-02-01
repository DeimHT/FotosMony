# Guía de pruebas: Webpay + envío de fotos por email

Esta guía te ayuda a comprobar que las fotos se envían correctamente al correo después de un pago con Webpay, **solo en entorno de desarrollo**.

---

## Requisitos previos

1. **Variables de entorno** en `.env.local`:
   - `RESEND_API_KEY` — Obligatorio para enviar emails
   - `RESEND_FROM` — Opcional (por defecto usa `onboarding@resend.dev` en pruebas)
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` — Para los enlaces de las fotos
   - `WEBPAY_API_KEY_ID` y `WEBPAY_API_KEY_SECRET` — Para el flujo completo
   - `NEXT_PUBLIC_APP_URL` — Para el retorno de Webpay (ver sección 2)

2. **Cuenta en Resend**: [resend.com](https://resend.com)  
   - En el plan gratuito solo puedes enviar a tu propio email verificado.

---

## Método 1: Probar el email sin Webpay (recomendado primero)

Con este método verificas que Resend está configurado y que el correo llega bien, sin pasar por Webpay.

### Paso 1: Consigue un `public_id` de una foto real

1. Entra al admin → Fotos
2. Selecciona un evento con fotos
3. Abre el código de una foto en la base de datos, o usa un public_id que tengas (ej: `eventos/xxxxx`)

### Paso 2: Llama al endpoint de prueba

Desde la terminal (o Postman/Insomnia):

```bash
curl -X POST http://localhost:3000/api/dev/test-email-fotos \
  -H "Content-Type: application/json" \
  -d '{
    "email": "TU_EMAIL@ejemplo.com",
    "name": "Cliente prueba",
    "total_clp": 4000,
    "items": [
      {
        "public_id": "eventos/TU_PUBLIC_ID_REAL",
        "evento_nombre": "Boda Test",
        "subevento_nombre": null
      }
    ]
  }'
```

**Importante**: Sustituye `TU_EMAIL@ejemplo.com` por un email que tengas verificado en Resend (en plan gratuito). Sustituye `TU_PUBLIC_ID_REAL` por un public_id real de tu Cloudinary.

### Paso 3: Revisa tu correo

- Revisa la bandeja de entrada y la carpeta de **spam**
- El asunto será algo como: "FotosMony — Tus 1 foto(s) están listas"
- Deberías ver un enlace a la foto en Cloudinary (sin marca de agua)

### Si no llega el email

1. Revisa la consola del servidor: ¿hubo algún error?
2. Entra a [Resend Dashboard](https://resend.com/emails) → Logs: verás si el envío fue exitoso o falló
3. Con `onboarding@resend.dev` solo puedes enviar al email de tu cuenta Resend
4. Si usas tu propio dominio, asegúrate de tenerlo verificado en Resend

---

## Método 2: Probar el flujo completo con Webpay

Para que Webpay pueda redirigir de vuelta a tu app después del pago, **tu localhost debe ser accesible desde internet**. Transbank no puede redirigir a `localhost`.

### Paso 1: Usar ngrok (o similar)

1. Instala [ngrok](https://ngrok.com): `npm install -g ngrok` o descárgalo de su web
2. Inicia tu app: `npm run dev`
3. En otra terminal: `ngrok http 3000`
4. Copia la URL que te da ngrok (ej: `https://abc123.ngrok-free.app`)

### Paso 2: Configurar la URL en desarrollo

En tu `.env.local` agrega o modifica:

```
NEXT_PUBLIC_APP_URL=https://abc123.ngrok-free.app
```

(Usa tu URL de ngrok real)

**Reinicia** el servidor de Next.js para que tome la variable.

### Paso 3: Ejecutar el flujo de pago

1. Abre tu sitio usando la URL de ngrok (no localhost)
2. Agrega fotos al carrito
3. Ve al carrito y completa nombre + **correo** (usa un email que recibas)
4. Haz clic en "Pagar con Webpay"
5. En el formulario de Transbank (ambiente integración):
   - Tarjeta: `4051 8856 0044 6623`
   - CVV: `123`
   - Fecha: cualquiera futura
   - RUT: `11.111.111-1`
   - Clave: `123`
6. Confirma el pago
7. Deberías volver a tu sitio en `/carrito/confirmar` y ver "Pago exitoso"

### Paso 4: Revisar que llegó el email

- Revisa la bandeja del correo que pusiste en el carrito
- Deberías recibir el email con los enlaces a las fotos

### Paso 5: Revisar logs en la terminal

En la terminal donde corre `npm run dev` deberías ver:

```
[checkout/confirm] Email enviado a tu@email.com con X foto(s)
```

Si ves ese mensaje y el email no llega, el problema está en Resend (revisa su dashboard).

---

## Resumen de verificación

| Qué comprobar           | Dónde                              |
|-------------------------|------------------------------------|
| Email recibido          | Bandeja de entrada y spam          |
| Enlaces a fotos         | Clic en cada enlace del email      |
| Fotos sin marca de agua | Las imágenes descargadas           |
| Log de confirmación     | Terminal del servidor (flujo Webpay)|
| Logs de Resend          | [resend.com/emails](https://resend.com/emails) |

---

## Problemas frecuentes

- **"Email no llega"**: Con Resend gratuito solo envía a tu email verificado. Verifica que el correo del carrito sea el de tu cuenta Resend.
- **"Webpay no redirige"**: Debes usar ngrok y `NEXT_PUBLIC_APP_URL` con la URL de ngrok.
- **"Error 404 en /api/dev/test-email-fotos"**: Ese endpoint solo existe cuando `NODE_ENV=development`. No lo uses en producción.
- **Enlaces rotos en el email**: Revisa que `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` esté bien configurado y que el `public_id` sea correcto.
