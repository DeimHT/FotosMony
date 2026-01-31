import { NextResponse } from "next/server";
import { supabaseAdmin } from "FotosMony/lib/supabaseAdmin";
import { requireAdmin } from "FotosMony/lib/requireAdmin";

export async function GET(req: Request) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  try {
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    });

    if (authErr) {
      return NextResponse.json({ error: authErr.message }, { status: 500 });
    }

    const users = authData?.users ?? [];
    if (users.length === 0) {
      return NextResponse.json({ clientes: [] });
    }

    const ids = users.map((u) => u.id);
    const { data: profiles, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("id, role")
      .in("id", ids);

    if (profErr) {
      return NextResponse.json({ error: profErr.message }, { status: 500 });
    }

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.role as string]));

    const clientes = users.map((u) => ({
      id: u.id,
      email: u.email ?? "",
      full_name: (u.user_metadata?.full_name as string) ?? "",
      role: profileMap.get(u.id) ?? null,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
    }));

    return NextResponse.json({ clientes });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error listando clientes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
