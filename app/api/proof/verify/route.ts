import { NextResponse } from "next/server";
import { verifyProof } from "@/lib/proof/proof";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { token?: string; expectedAudience?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof body.token !== "string" || typeof body.expectedAudience !== "string") {
    return NextResponse.json({ error: "token and expectedAudience are required" }, { status: 400 });
  }
  return NextResponse.json(verifyProof(body.token, body.expectedAudience));
}
