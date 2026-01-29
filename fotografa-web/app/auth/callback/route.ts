import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Supabase maneja el callback, aquí solo redirigimos al home (o donde quieras)
  const url = new URL(request.url);
  const next = url.searchParams.get("next") ?? "/";
  return NextResponse.redirect(new URL(next, url.origin));
}
