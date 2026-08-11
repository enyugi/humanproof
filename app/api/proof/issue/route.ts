import { NextResponse } from "next/server";
import { issueConsentedProof } from "@/lib/proof/proof";
import { verifyConsentReceipt } from "@/lib/proof/consent";
import { DEMO_USER_ID } from "@/lib/proof/demoUser";

export const runtime = "nodejs";

// Step 2 of issuance: issue a proof for EXACTLY the audience + claims fixed in the signed consent
// receipt. The client cannot change audience/claims/TTL here (Problems 1 & 2).
export async function POST(req: Request) {
  let body: { consentReceipt?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof body.consentReceipt !== "string" || body.consentReceipt.trim() === "") {
    return NextResponse.json({ error: "A signed consent receipt is required." }, { status: 422 });
  }

  const consent = verifyConsentReceipt(body.consentReceipt.trim());
  if (!consent) {
    return NextResponse.json({ error: "Consent receipt is invalid or expired. Please review and consent again." }, { status: 422 });
  }

  // audience + claims come ONLY from the verified receipt.
  const result = issueConsentedProof({
    userId: DEMO_USER_ID,
    audience: consent.audience,
    consentedClaims: consent.claims,
  });

  return NextResponse.json({
    token: result.token,
    proof: {
      issuer: result.payload.iss,
      subject: result.payload.sub,
      audience: result.payload.aud,
      claims: result.payload.claims,
      issued_at: result.payload.iat,
      expires_at: result.payload.exp,
      jti: result.payload.jti,
    },
    excluded_claims: result.excluded_claims,
  });
}
