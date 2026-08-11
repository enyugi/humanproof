import { NextResponse } from "next/server";
import { issueConsentedProof } from "@/lib/proof/proof";
import { verifyQuote } from "@/lib/proof/quote";
import { DEMO_USER_ID } from "@/lib/proof/demoUser";

export const runtime = "nodejs";

// Step 2: issue a proof for EXACTLY the audience + claims fixed in the signed quote, and ONLY after
// an explicit consent act. The client cannot change audience/claims/TTL here (Problems 1 & 2).
export async function POST(req: Request) {
  let body: { quote?: string; consent?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Explicit consent is REQUIRED and is separate from the server's quote (Problem 2).
  if (body.consent !== true) {
    return NextResponse.json({ error: "Explicit user consent is required to issue a proof." }, { status: 422 });
  }
  if (typeof body.quote !== "string" || body.quote.trim() === "") {
    return NextResponse.json({ error: "A signed quote is required." }, { status: 422 });
  }

  const q = verifyQuote(body.quote.trim());
  if (!q) {
    return NextResponse.json({ error: "Quote is invalid or expired. Please review and consent again." }, { status: 422 });
  }

  const result = issueConsentedProof({ userId: DEMO_USER_ID, audience: q.audience, consentedClaims: q.claims });

  return NextResponse.json({
    token: result.token,
    revocationCode: result.revocationCode, // secret: only the holder can revoke with this
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
