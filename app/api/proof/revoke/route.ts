import { NextResponse } from "next/server";
import { revokeByCode } from "@/lib/proof/proof";

export const runtime = "nodejs";

// Revocation requires the secret revocation code returned to the holder at issue time — NOT the
// proof token (Problem 3). Fail-closed: if the revocation cannot be safely persisted, do not
// return success (invariant 4).
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

  const result = revokeByCode(body.revocationCode.trim());
  if (result === "revoked") return NextResponse.json({ revoked: true });
  if (result === "unknown-code") return NextResponse.json({ error: "Unknown or expired revocation code." }, { status: 422 });
  return NextResponse.json({ error: "Proof state is unavailable; revocation not recorded." }, { status: 503 });
}
