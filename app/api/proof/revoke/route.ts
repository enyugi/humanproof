import { NextResponse } from "next/server";
import { revoke } from "@/lib/proof/revocation";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { jti?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof body.jti !== "string" || body.jti.trim() === "") {
    return NextResponse.json({ error: "jti is required" }, { status: 400 });
  }
  revoke(body.jti.trim());
  return NextResponse.json({ revoked: true, jti: body.jti.trim() });
}
