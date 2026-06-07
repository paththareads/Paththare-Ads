// app/api/example/route.ts
import { NextResponse, NextRequest } from "next/server";

export async function GET(_request: NextRequest) {
  return NextResponse.json({ ok: true });
}

export async function POST(_request: NextRequest) {
  return NextResponse.json({ ok: true });
}
