import { NextResponse } from "next/server";
import { runAnalysis, classifyAnalyzeError, type AnalyzeInput } from "@/lib/analyze";

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
    const result = await runAnalysis(
      {
        serviceName: typeof body.serviceName === "string" ? body.serviceName : undefined,
        audience: typeof body.audience === "string" ? body.audience : undefined,
        purposeText: body.purposeText,
        requestedData: Array.isArray(body.requestedData) ? body.requestedData.filter((x) => typeof x === "string") : [],
      },
      undefined,
      { signal: req.signal }, // propagate client disconnect to the upstream call
    );
    return NextResponse.json(result);
  } catch (err) {
    const { status, body: resBody } = classifyAnalyzeError(err);
    return NextResponse.json(resBody, { status });
  }
}
