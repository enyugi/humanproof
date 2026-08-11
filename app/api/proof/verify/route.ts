import { NextResponse } from "next/server";
import { verifyProof } from "@/lib/proof/proof";

export const runtime = "nodejs";

const FAIL_CHECKS = { signature: false, issuer: false, audience: false, expiry: false, revocation: false };

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
  try {
    return NextResponse.json(verifyProof(body.token, body.expectedAudience));
  } catch {
    // Never leak an unhandled exception (e.g. key/state unavailable) as a 500. Fail closed with a
    // structured, non-VALID verdict so callers treat the proof as unverifiable. (invariants 2, 6, 7)
    return NextResponse.json({ status: "REVOCATION_UNAVAILABLE", checks: FAIL_CHECKS });
  }
}
