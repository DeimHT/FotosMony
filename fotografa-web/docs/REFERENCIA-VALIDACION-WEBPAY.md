# Referencia para validación SDK/API Webpay (Transbank Developers)

Este documento resume cómo está integrado Webpay Plus en **fotografa-web** para que puedas usarlo como referencia durante la validación de conocimientos en Transbank Developers.

---

## Stack del proyecto

- **Lenguaje / entorno:** Node.js (Next.js 16, TypeScript)
- **Tipo de integración:** **REST API** de Webpay Plus (no SDK; llamadas HTTP directas).
- **API usada:** `rswebpaytransaction/api/webpay/v1.2`

---

## Flujo implementado (Webpay Plus)

1. **Crear transacción (inicio de pago)**  
   - El usuario hace clic en "Pagar con Webpay" en el carrito.  
   - El backend crea la orden en BD, luego llama a la API de Transbank para crear la transacción.  
   - Transbank devuelve `token` y `url`.  
   - El frontend redirige al usuario a esa `url` (formulario de pago de Transbank).

2. **Usuario paga en Transbank**  
   - El usuario ingresa tarjeta y completa el pago en la página de Webpay.

3. **Retorno (return_url)**  
   - Transbank redirige al comercio a la `return_url` con el parámetro `token_ws`.  
   - En este proyecto: `return_url` = `{APP_URL}/api/checkout/return`.  
   - **Casos según documentación Webpay:**  
     - **Pago completado:** llega `token_ws` → se confirma (commit).  
     - **Usuario canceló / error en formulario + "reintentar":** pueden llegar `token_ws`, `TBK_TOKEN`, `TBK_ID_SESION`, `TBK_ORDEN_COMRA`; si llega `TBK_TOKEN` (o solo sesión/orden) no se hace commit y se muestra mensaje amigable.  
     - **Timeout (5 min sin actividad en formulario):** llegan solo `TBK_ID_SESION` y `TBK_ORDEN_COMRA`, **no llega token**; en el proyecto se trata igual que cancelación y se redirige a mensaje amigable.

4. **Confirmar transacción (commit)**  
   - El backend debe llamar a la API de Transbank para **confirmar** la transacción usando el `token_ws`.  
   - Solo después de este paso se sabe si el pago fue aprobado o rechazado.  
   - Según la respuesta, se marca la orden como pagada o fallida y se envía el email con las fotos si aplica.

---

## Endpoints REST usados en el proyecto

| Paso | Método | Endpoint (base: integración) |
|------|--------|------------------------------|
| Crear transacción | **POST** | `https://webpay3gint.transbank.cl/rswebpaytransaction/api/webpay/v1.2/transactions` |
| Confirmar transacción | **PUT** | `https://webpay3gint.transbank.cl/rswebpaytransaction/api/webpay/v1.2/transactions/{token}` |

- **Producción:** base `https://webpay3g.transbank.cl`.
- **Autenticación:** headers `Tbk-Api-Key-Id` y `Tbk-Api-Key-Secret` (código de comercio y llave secreta).

---

## Crear transacción (POST)

**Payload enviado (ejemplo):**

```json
{
  "buy_order": "ORD123...",
  "session_id": "uuid-orden",
  "amount": 15000,
  "return_url": "https://tudominio.com/api/checkout/return"
}
```

- **buy_order:** identificador único de la compra (máx. 26 caracteres).  
- **session_id:** identificador de sesión/comercio (aquí usamos el ID de la orden).  
- **amount:** monto en pesos chilenos (entero).  
- **return_url:** URL a la que Transbank redirige después del pago (con `token_ws`).

**Respuesta:**

```json
{
  "token": "token-retornado-por-transbank",
  "url": "https://webpay3gint.transbank.cl/webpayserver/initTransaction"
}
```

- El usuario debe ser enviado a esa `url` (normalmente con un formulario POST que envía `token_ws` = ese `token`).

---

## Confirmar transacción (PUT)

- **URL:** `.../transactions/{token}` donde `token` es el `token_ws` recibido en la `return_url`.
- **Cuerpo:** no se envía body en el PUT en la API actual; solo el token en la URL y los headers de autenticación.

**Respuesta relevante:**

- **status:** `"AUTHORIZED"` = pago aprobado.  
- **response_code:** `0` = aprobado.  
- **buy_order:** debe coincidir con la orden guardada para marcar la orden correcta como pagada.

En el proyecto se considera pago exitoso cuando:  
`status === "AUTHORIZED"` y `response_code === 0`.

---

## Archivos del proyecto relacionados

| Archivo | Qué hace |
|---------|----------|
| `lib/webpay.ts` | Funciones `webpayCreateTransaction` y `webpayCommitTransaction` (llamadas a la REST API). |
| `app/api/checkout/create-order/route.ts` | Crea la orden en BD y la transacción en Webpay; devuelve `webpayUrl` y `webpayToken`. |
| `app/api/checkout/return/route.ts` | Recibe la redirección de Webpay con `token_ws` y redirige a la página de confirmación. |
| `app/api/checkout/confirm/route.ts` | Recibe el `token_ws`, llama a `webpayCommitTransaction`, actualiza la orden y envía el email. |
| `app/(site)/carrito/page.tsx` | Botón "Pagar con Webpay" y envío del usuario a la URL de Transbank. |
| `app/(site)/carrito/confirmar/page.tsx` | Página de "Confirmando pago" que llama a `/api/checkout/confirm`. |

---

## Variables de entorno (Webpay)

- **WEBPAY_API_KEY_ID** — Código de comercio.  
- **WEBPAY_API_KEY_SECRET** — Llave secreta.  
- **WEBPAY_BASE_URL** — Opcional; por defecto integración `https://webpay3gint.transbank.cl`.  
- **NEXT_PUBLIC_WEBPAY_ENABLED** — `"true"` para mostrar el botón de pago con Webpay.

---

## Conceptos útiles para la validación

- **token_ws:** Token que Transbank envía al comercio en la `return_url`; **debe usarse una sola vez** para confirmar (PUT) la transacción.
- **buy_order:** Debe ser único por transacción y permitir al comercio identificar la orden al confirmar.
- **return_url:** Debe ser HTTPS en producción; Transbank redirige ahí (GET o POST) con `token_ws`.
- **Commit obligatorio:** Hasta que no se llame al PUT de confirmación, el pago no está confirmado; no se debe dar por pagado solo por haber llegado a la return_url.
- **REST API vs SDK:** Este proyecto usa solo REST API (HTTP); los SDK de Transbank encapsulan estas mismas llamadas para distintos lenguajes.

Si durante la validación te preguntan por flujo, endpoints o significado de `token_ws` / `buy_order` / `return_url` / commit, puedes apoyarte en este flujo y en los archivos listados arriba.

---

## Correcciones según feedback oficial (validación SDK/API)

Respuestas correctas según los modales de FEEDBACK de Transbank Developers:

| Pregunta | Respuesta correcta (según feedback) |
|----------|-------------------------------------|
| **Transacciones que permiten anulación vía Webservice** | Arrastrar: **TARJETA DÉBITO**, **TARJETA CRÉDITO DÓLAR**, **TRANSACCIÓN NO BANCARIA**, **TARJETA PREPAGO**. **No** arrastrar **TARJETA CRÉDITO**: "La única transacción vía Webservice que no es posible anular son aquellas realizadas a través de tarjeta de crédito." |
| **Modalidad de pago con dólar – Webpay transacción normal** | **PAGO SIN CUOTAS**. "Webpay Transacción normal en su modalidad pago dólar solo permite la modalidad sin cuotas." |
| **Método al que corresponden los parámetros** (AuthorizationCode, authorizedAmount, buyOrder, commerceld, nullifyAmount) | Revisar en TBK.DEVELOPERS el proceso de instalación vía SDK y sus métodos; puede ser **getTransactionResult** (esos parámetros son típicos de la respuesta de resultado de transacción). |
| **Excepción con amount '0'** | El objeto Amount debe ser **numérico**, **máximo 2 decimales**, separador decimal **punto (.) y no coma**. Si aparece esta excepción, revisar el objeto monto. La alternativa correcta suele ser la que indica **formato inválido** (p. ej. "El formato del monto es inválido" o la que combine formato inválido con no enviar valor). |
| **Cantidad de tiendas Webpay Mall** | El feedback indica que hay un límite por seguridad; el número exacto hay que confirmarlo en la documentación de TBK.DEVELOPERS. |
| **Prueba con tarjeta y URL** | Seguir el proceso de instalación vía SDK en TBK.DEVELOPERS para el detalle completo. |
