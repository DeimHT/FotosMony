# Transbank Developers – Cómo empezar (resumen)

Resumen de la documentación oficial de instalación e integración de Transbank, útil para la validación y para el proyecto fotografa-web.

---

## Flujo de integración

1. **Hazte cliente** – Formulario de afiliación en [publico.transbank.cl](https://publico.transbank.cl), firma digital, código de comercio por correo.
2. **Integra** – Integración del medio de pago (Transbank Developers, Slack).
3. **Valida** – Transbank Developers: completar formulario de validación; consultas a soporte@transbank.cl.
4. **Vende** – Tras validación: se asigna llave privada (Tbk-Api-Key-Secret), configurar en app y listo.

---

## Opciones de integración

### A) Plugin oficial
- Webpay Plus: revisar documentación del plugin.
- No requiere escribir código; instalación y configuración del plugin.

### B) SDK
- Un único Transbank SDK por lenguaje (backend).
- **Java:** Maven – `com.github.transbankdevelopers` / `transbank-sdk-java`.
- **PHP:** Composer – `composer require transbank/transbank-sdk:^5.0`.
- **.NET:** `Install-Package TransbankSDK`.
- **Ruby:** `gem install transbank-sdk`.
- **Python:** `pip install transbank-sdk`.
- **Node.js:** `npm install transbank-sdk`.

### C) API REST directa
- Sin SDK: consumir la API REST directamente.
- Revisar Referencia del API REST (tab "http"): endpoints, parámetros de entrada y respuesta.
- **fotografa-web** usa esta opción (REST directo en `lib/webpay.ts`).

---

## Ambientes

| Ambiente   | HOST                              | Uso |
|-----------|------------------------------------|-----|
| Integración | `https://webpay3gint.transbank.cl` | Pruebas e integración |
| Producción  | `https://webpay3g.transbank.cl`    | Tarjetas y transacciones reales |

---

## Ambiente de integración

- Códigos de comercio preconfigurados para todos los productos y modalidades (CLP/USD).
- Usar el código de comercio de integración que coincida con el producto contratado.

### Tarjetas de prueba

| Tipo        | Número / detalle                    | Resultado   |
|------------|-------------------------------------|-------------|
| VISA       | 4051 8856 0044 6623, CVV 123       | Aprobada    |
| AMEX       | 3700 0000 0002 032, CVV 1234       | Aprobada    |
| MASTERCARD | 5186 0595 5959 0568, CVV 123       | Rechazada   |
| Redcompra  | 4051 8842 3993 7763 / 4511 3466 6003 7060 | Aprobada |
| Redcompra  | 5186 0085 4123 3829                 | Rechazada   |
| Prepago VISA    | 4051 8860 0005 6590, CVV 123  | Aprobada    |
| Prepago MASTERCARD | 5186 1741 1062 9480, CVV 123 | Rechazada   |

- Autenticación (RUT/clave): **RUT 11.111.111-1**, clave **123**.

### Códigos de comercio (integración)

- **Api Key Secret** (común para integración):  
  `579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C`

| Producto | Código de comercio |
|----------|--------------------|
| Webpay Plus | 597055555532 |
| Webpay Plus Captura Diferida | 597055555540 |
| Webpay Plus Mall | 597055555535 (Mall), 597055555536 (Tienda 1), 597055555537 (Tienda 2) |
| Oneclick Mall | 597055555541 (Mall), 597055555542, 597055555543 |
| Transacción Completa | 597055555530 |
| Patpass Comercio | 28299257 (código), cxxXQgGD9vrVe4M41FIt (Api Key Secret) |

*(En la doc oficial está la tabla completa; aquí solo los más usados.)*

---

## Validación

- Requisito para pasar a producción; sin validación no se puede usar Webpay en producción.
- Transbank solo valida comercios con **código de comercio productivo**.
- **Plugins / Webpay Plus (SDK o API):** formulario online desde Transbank Developers (“Comenzar formulario de integración”).
- **Otros (PatPass, Transacción Completa):** enviar evidencias a soporte@transbank.cl con el formulario del producto.
- Logo tienda: GIF o PNG **130x59 px**.
- Soporte verifica que las pruebas coincidan con los registros en Webpay; si todo está bien, se notifica y se dan instrucciones para producción.
- En el paso a producción se exige **al menos una transacción de prueba real**.

---

## Puesta en producción

- Transbank envía por correo el resultado de la validación.
- Si es aprobada: se indica la **llave secreta (API Key Secret)** de producción.
- Cambiar la configuración del e-commerce a **producción** (host, código de comercio y Api Key Secret de producción).
- Realizar una **compra de $50** para validar funcionamiento.
- Después de eso se está operando en producción.

### Credenciales Webpay

- **Código de comercio** = Api-Key-Id  
- **Llave secreta** = Api-Key-Secret (se obtiene tras la validación; no compartirla).

---

## Requerimientos de página de resultado (Webpay Plus REST)

- Ya no hay voucher de Transbank; el usuario llega al sitio del comercio.
- El comercio debe mostrar una **página de resultado** (éxito o fallo) con al menos:
  - Número de orden de pedido
  - Nombre del comercio
  - Monto y moneda
  - Código de autorización
  - Fecha de la transacción
  - Tipo de pago (Débito/Crédito)
  - Cuotas (si aplica)
  - Últimos 4 dígitos de la tarjeta
  - Descripción de bienes/servicios

Si la transacción no fue autorizada, informar al usuario (ej. “Orden de Compra XXXXXXX rechazada” y causas posibles).

---

## Seguridad y buenas prácticas

- TLS 1.2; REST: API Keys + mensajes firmados.
- **Recomendaciones:** escaneos de vulnerabilidad, componentes actualizados, HTTPS, WAF/IPS, buenas prácticas OWASP, control de accesos, contraseñas robustas, respaldos, monitoreo, auditoría externa anual.

---

## Validación de montos y órdenes de compra

- El comercio debe **verificar** al completar la transacción que los valores devueltos por Transbank (monto, `buy_order`, etc.) **coinciden** con los enviados al iniciar el flujo.

---

## Uso de HTTPS

- En integración y producción el comercio debe usar **HTTPS** en los endpoints (usuario y callbacks a Transbank). Sin HTTPS pueden fallar redirecciones en navegadores modernos.

---

*Documentación oficial: [Transbank Developers – Cómo empezar](https://www.transbankdevelopers.cl/documentacion/como_empezar).*
