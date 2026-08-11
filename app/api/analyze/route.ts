import { NextResponse } from "next/server";
import { runAnalysis, AnalyzeError, PiiBlockedError, type AnalyzeInput } from "@/lib/analyze";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: Partial<AnalyzeInput>;
  try {
    body = (await req.json()) as Partial<AnalyzeInput>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.purposeText !== "string" || body.purposeText.trim() === "") {
    return NextResponse.json({ error: "purposeText is required" }, { status: 400 });
  }

  try {
    const result = await runAnalysis({
      serviceName: typeof body.serviceName === "string" ? body.serviceName : undefined,
      audience: typeof body.audience === "string" ? body.audience : undefined,
      purposeText: body.purposeText,
      requestedData: Array.isArray(body.requestedData) ? body.requestedData.filter((x) => typeof x === "string") : [],
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof PiiBlockedError) {
      // 422 — the request is blocked, nothing was sent to the gateway.
      return NextResponse.json({ error: err.message, blocked: true, pii_finding_types: err.findingTypes }, { status: 422 });
    }
    if (err instanceof AnalyzeError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 500 });
  }
}
