/**
 * Envío de email con Resend (https://resend.com).
 * Variables: RESEND_API_KEY, RESEND_FROM (ej: "FotosMony <ventas@tudominio.com>").
 */

export type OrderItemForEmail = {
  public_id: string;
  evento_nombre: string;
  subevento_nombre: string | null;
  /** cloudflare = R2; si no o null = Cloudinary */
  storage_provider?: string | null;
};

export async function sendOrderPhotosEmail(
  to: string,
  buyerName: string,
  items: OrderItemForEmail[],
  totalClp: number
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM ?? "FotosMony <onboarding@resend.dev>";

  if (!apiKey) {
    console.error("RESEND_API_KEY no configurado, no se envía email");
    return;
  }

  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
  const r2PublicUrl = (process.env.CLOUDFLARE_R2_PUBLIC_URL ?? "").replace(/\/$/, "");

  const photoUrl = (item: OrderItemForEmail): string => {
    if (item.storage_provider === "cloudflare" && r2PublicUrl) {
      return `${r2PublicUrl}/${item.public_id}`;
    }
    return `https://res.cloudinary.com/${cloud}/image/upload/${item.public_id}`;
  };

  const linksHtml = items
    .map(
      (item) =>
        `<li style="margin-bottom:8px"><a href="${photoUrl(item)}" style="color:#0f172a">${item.evento_nombre}${item.subevento_nombre ? ` · ${item.subevento_nombre}` : ""}</a></li>`
    )
    .join("");

  const money = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(totalClp);

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#334155">
  <h1 style="color:#0f172a;font-size:1.25rem">¡Gracias por tu compra!</h1>
  <p>Hola ${buyerName},</p>
  <p>Tu pago fue confirmado. Aquí tienes los enlaces para descargar tus fotos en alta resolución (sin marca de agua):</p>
  <ul style="list-style:none;padding:0">
    ${linksHtml}
  </ul>
  <p style="margin-top:20px;font-size:0.875rem;color:#64748b">Total pagado: ${money}</p>
  <p style="margin-top:24px;font-size:0.875rem;color:#64748b">Si tienes problemas con algún enlace, responde a este correo.</p>
  <p style="margin-top:16px">— FotosMony</p>
</body>
</html>
  `.trim();

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `FotosMony — Tus ${items.length} foto(s) están listas`,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? `Resend: ${res.status} ${res.statusText}`
    );
  }
}
