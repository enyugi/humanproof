import { NextResponse } from "next/server";
import { getProviderMode } from "@/lib/orcaRouter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lets the client show, BEFORE any analysis, whether the real gateway or the MOCK will be used.
export async function GET() {
  return NextResponse.json({ source: getProviderMode() });
}
