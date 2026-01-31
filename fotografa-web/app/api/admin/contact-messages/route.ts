import { NextResponse } from "next/server";
import { supabaseAdmin } from "FotosMony/lib/supabaseAdmin";
import { requireAdmin } from "FotosMony/lib/requireAdmin";

export async function GET(req: Request) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { data, error } = await supabaseAdmin
    .from("contact_messages")
    .select("id, nombre, email, asunto, mensaje, leido, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ mensajes: data ?? [] });
}
