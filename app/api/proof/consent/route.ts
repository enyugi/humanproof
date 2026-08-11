import { NextResponse } from "next/server";
import { issueConsentReceipt } from "@/lib/proof/consent";
import { isClaim, type Claim } from "@/lib/claims";
import { DEMO_USER_WITHHELD_PII } from "@/lib/proof/demoUser";

export const runtime = "nodejs";

// Step 1 of issuance: the user reviews EXACTLY what will be issued and gets a signed consent receipt.
export async function POST(req: Request) {
  let body: { audience?: string; claims?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof body.audience !== "string" || body.audience.trim() === "") {
    return NextResponse.json({ error: "audience is required" }, { status: 400 });
  }
  const requested: Claim[] = Array.isArray(body.claims) ? body.claims.filter(isClaim) : [];
  if (requested.length === 0) {
    return NextResponse.json({ error: "At least one claim is required." }, { status: 422 });
  }

  const receipt = issueConsentReceipt(body.audience.trim(), requested);
  return NextResponse.json({
    receipt: receipt.token,
    audience: receipt.audience,
    claims: receipt.claims, // exactly what will be issued
    excluded: receipt.excluded,
    withheld_pii: DEMO_USER_WITHHELD_PII,
    expires_at: receipt.expires_at,
  });
}
