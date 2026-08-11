import { NextResponse } from "next/server";
import { issueQuote } from "@/lib/proof/quote";
import { isClaim, type Claim } from "@/lib/claims";
import { DEMO_USER_WITHHELD_PII } from "@/lib/proof/demoUser";

export const runtime = "nodejs";

// Step 1: the server confirms EXACTLY what could be issued for a selection and returns a signed
// quote. This is confirmation, NOT consent — the user still has to explicitly consent at issue.
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

  const quote = issueQuote(body.audience.trim(), requested);
  if (!quote) {
    return NextResponse.json({ error: "No issuable claims for this selection." }, { status: 422 });
  }
  return NextResponse.json({
    quote: quote.token,
    audience: quote.audience,
    claims: quote.claims, // exactly what will be issued
    excluded: quote.excluded,
    withheld_pii: DEMO_USER_WITHHELD_PII,
    expires_at: quote.expires_at,
  });
}
