import { NextResponse } from "next/server";
import { revokeByCode } from "@/lib/proof/proof";

export const runtime = "nodejs";

// Revocation requires the secret revocation code returned to the holder at issue time — NOT the
// proof token. A Verifier who is merely shown the proof cannot revoke it (Problem 3). Arbitrary
// identifiers are rejected, so nobody can revoke unrelated proofs or bloat memory (Problem 3/5).
export async function POST(req: Request) {
  let body: { revocationCode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof body.revocationCode !== "string" || body.revocationCode.trim() === "") {
    return NextResponse.json({ error: "A revocation code is required." }, { status: 400 });
  }

  const ok = revokeByCode(body.revocationCode.trim());
  if (!ok) {
    return NextResponse.json({ error: "Unknown or expired revocation code." }, { status: 422 });
  }
  return NextResponse.json({ revoked: true });
}
