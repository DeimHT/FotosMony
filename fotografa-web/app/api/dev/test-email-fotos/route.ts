/**
 * SOLO DESARROLLO: Endpoint para probar el envío de email con fotos
 * sin pasar por Webpay.
 *
 * POST /api/dev/test-email-fotos
 * Body: { email, name, items: [{ public_id, evento_nombre, subevento_nombre }], total_clp }
 *
 * Solo funciona cuando NODE_ENV === 'development'
 */

import { NextResponse } from "next/server";
import { sendOrderPhotosEmail } from "FotosMony/lib/email";

type Item = {
  public_id: string;
  evento_nombre: string;
  subevento_nombre?: string | null;
};

export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Solo disponible en desarrollo" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "Cliente prueba";
    const totalClp = typeof body.total_clp === "number" ? body.total_clp : 2000;
    const items = Array.isArray(body.items) ? (body.items as Item[]) : [];

    if (!email) {
      return NextResponse.json({ error: "Falta 'email' en el body" }, { status: 400 });
    }

    const validItems = items.filter(
      (i) =>
        i &&
        typeof i.public_id === "string" &&
        typeof i.evento_nombre === "string"
    ).map((i) => ({
      public_id: i.public_id,
      evento_nombre: i.evento_nombre,
      subevento_nombre: i.subevento_nombre ?? null,
    }));

    if (validItems.length === 0) {
      return NextResponse.json(
        { error: "Faltan items válidos. Cada item necesita public_id y evento_nombre" },
        { status: 400 }
      );
    }

    await sendOrderPhotosEmail(email, name, validItems, totalClp);

    return NextResponse.json({
      ok: true,
      message: `Email enviado a ${email} con ${validItems.length} foto(s). Revisa tu bandeja (y spam).`,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error enviando email";
    console.error("[dev/test-email-fotos]", e);
    return NextResponse.json(
      { error: msg, detail: e instanceof Error ? e.stack : String(e) },
      { status: 500 }
    );
  }
}
