import { NextResponse } from "next/server";
import { issueConsentedProof } from "@/lib/proof/proof";
import { isClaim, type Claim } from "@/lib/claims";
import { DEMO_USER_ID } from "@/lib/proof/demoUser";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { audience?: string; consentedClaims?: unknown; consent?: boolean; ttlSeconds?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.consent !== true) {
    return NextResponse.json({ error: "Explicit user consent is required to issue a proof." }, { status: 422 });
  }
  if (typeof body.audience !== "string" || body.audience.trim() === "") {
    return NextResponse.json({ error: "audience is required" }, { status: 400 });
  }
  const consentedClaims: Claim[] = Array.isArray(body.consentedClaims) ? body.consentedClaims.filter(isClaim) : [];
  if (consentedClaims.length === 0) {
    return NextResponse.json({ error: "At least one consented claim is required." }, { status: 422 });
  }

  const result = issueConsentedProof({
    userId: DEMO_USER_ID,
    audience: body.audience.trim(),
    consentedClaims,
    ttlSeconds: typeof body.ttlSeconds === "number" ? body.ttlSeconds : undefined,
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
