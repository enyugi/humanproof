// Structured output v2 schema + validation (zod).
// Source: ClaudeCode_Delta_Instructions §4, Requirements FR-07.
import { z } from "zod";
import { SUPPORTED_CLAIMS, REQUESTED_DATA_CATEGORIES } from "./claims";

export const ClaimEnum = z.enum(SUPPORTED_CLAIMS);
export const RequestedDataEnum = z.enum(REQUESTED_DATA_CATEGORIES);

export const AnalysisSchema = z.object({
  version: z.literal("2"),
  stated_purposes: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      rationale: z.string(),
    }),
  ),
  detected_requested_data: z.array(RequestedDataEnum),
  required_claims: z.array(ClaimEnum),
  optional_claims: z.array(ClaimEnum),
  potentially_unnecessary_data: z.array(
    z.object({
      item: RequestedDataEnum,
      reason_for_flag: z.string(),
    }),
  ),
  unsupported_needs: z.array(z.string()),
  assumptions: z.array(z.string()),
  clarification_questions: z.array(z.string()),
  summary: z.string(),
});

export type Analysis = z.infer<typeof AnalysisSchema>;

/** Parse unknown model output into a validated Analysis, or return an error. */
export function parseAnalysis(raw: unknown): { ok: true; data: Analysis } | { ok: false; error: string } {
  const result = AnalysisSchema.safeParse(raw);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, error: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
}
