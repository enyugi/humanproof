import { NextResponse } from "next/server";
import { issueConsentedProof, IssueUnavailableError } from "@/lib/proof/proof";
import { verifyQuote } from "@/lib/proof/quote";
import { consumeQuote } from "@/lib/proof/store";
import { DEMO_USER_ID } from "@/lib/proof/demoUser";

export const runtime = "nodejs";

// Step 2: issue a proof for EXACTLY the audience + claims fixed in the signed quote, and ONLY after
// an explicit consent act. Quotes are single-use. Fail-closed if state cannot be persisted.
export async function POST(req: Request) {
  let body: { quote?: string; consent?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

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

  // Single-use quote: consume it before issuing (invariant: one consent -> one proof).
  const consumed = consumeQuote(q.jti, q.exp);
  if (consumed === "already-used") {
    return NextResponse.json({ error: "This quote was already used. Please review and consent again." }, { status: 422 });
  }
  if (consumed === "unavailable") {
    return NextResponse.json({ error: "Proof state is unavailable; cannot issue safely." }, { status: 503 });
  }

  try {
    const result = issueConsentedProof({ userId: DEMO_USER_ID, audience: q.audience, consentedClaims: q.claims });
    return NextResponse.json({
      token: result.token,
      revocationCode: result.revocationCode,
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
  } catch (err) {
    if (err instanceof IssueUnavailableError) {
      return NextResponse.json({ error: "Proof state is unavailable; proof was not issued." }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to issue proof." }, { status: 500 });
  }
}
