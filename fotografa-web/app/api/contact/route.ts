import { NextResponse } from "next/server";
import { supabaseAdmin } from "FotosMony/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const nombre = (body.nombre as string)?.trim();
    const email = (body.email as string)?.trim();
    const asunto = (body.asunto as string)?.trim() || null;
    const mensaje = (body.mensaje as string)?.trim();

    if (!nombre || !email || !mensaje) {
      return NextResponse.json(
        { error: "Nombre, email y mensaje son obligatorios" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Email no válido" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("contact_messages")
      .insert([{ nombre, email, asunto, mensaje }])
      .select("id, created_at")
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Mensaje enviado correctamente", id: data?.id },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Error al enviar el mensaje" },
      { status: 500 }
    );
  }
}
