import { NextResponse } from "next/server";
import { authenticProofRef } from "@/lib/proof/proof";
import { revoke } from "@/lib/proof/revocation";

export const runtime = "nodejs";

// Revocation requires the authentic proof token itself (possession = authority for this demo).
// Arbitrary identifiers are rejected, so no one can revoke unrelated proofs or bloat memory
// with junk jtis (Problem 3).
export async function POST(req: Request) {
  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof body.token !== "string" || body.token.trim() === "") {
    return NextResponse.json({ error: "The proof token is required to revoke it." }, { status: 400 });
  }

  const ref = authenticProofRef(body.token.trim());
  if (!ref) {
    return NextResponse.json({ error: "Not an authentic, well-formed proof from a trusted issuer." }, { status: 422 });
  }

  const ok = revoke(ref.jti, ref.exp);
  if (!ok) {
    return NextResponse.json({ error: "Revocation store is at capacity." }, { status: 503 });
  }
  return NextResponse.json({ revoked: true, jti: ref.jti });
}
