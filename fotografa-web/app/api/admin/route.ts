import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { message: "Use specific admin endpoints (e.g. /api/admin/metrics, /api/admin/eventos)" },
    { status: 400 }
  );
}
