import { describe, it, expect } from "vitest";
import { OrcaRouterProvider, ORCAROUTER_BASE_URL, ORCAROUTER_DEFAULT_MODEL } from "@/lib/orcaRouter/orcaRouterProvider";
import type { OrcaInput } from "@/lib/orcaRouter/types";

const input: OrcaInput = {
  system: "sys",
  sanitizedServiceText: "18+ only",
  requestedDataCategories: ["full_name"],
  allowlist: ["human_verified", "over_18", "unique_person"],
};

function jsonResponse(body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json", ...headers } });
}

describe("Item 1. OrcaRouter contract", () => {
  it("posts to the OrcaRouter base URL with a Bearer key and the default model", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fakeFetch = async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return jsonResponse(
        { id: "orca-req-123", model: "orcarouter/auto", choices: [{ message: { content: "{}" } }], usage: { total_cost: 0.0004 } },
        { "X-Orca-Resolved-Model": "orcarouter/auto:resolved-model-x" },
      );
    };

    const provider = new OrcaRouterProvider("test-key", undefined, undefined, fakeFetch);
    const result = await provider.analyze(input);

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(`${ORCAROUTER_BASE_URL}/chat/completions`);
    expect(calls[0].url).toBe("https://api.orcarouter.ai/v1/chat/completions");
    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer test-key");
    const sentBody = JSON.parse(calls[0].init.body as string);
    expect(sentBody.model).toBe(ORCAROUTER_DEFAULT_MODEL);
    expect(ORCAROUTER_DEFAULT_MODEL).toBe("orcarouter/auto");

    // resolved model comes from the X-Orca-Resolved-Model header, source labelled ORCAROUTER
    expect(result.meta.source).toBe("ORCAROUTER");
    expect(result.meta.model).toBe("orcarouter/auto:resolved-model-x");
    expect(result.meta.request_id).toBe("orca-req-123");
    expect(result.meta.cost_usd).toBe(0.0004);
  });

  it("reports null (not 'unknown') when model / request id / cost are not provided", async () => {
    const fakeFetch = async () => jsonResponse({ choices: [{ message: { content: "{}" } }] });
    const provider = new OrcaRouterProvider("test-key", undefined, undefined, fakeFetch);
    const result = await provider.analyze(input);

    expect(result.meta.model).toBeNull();
    expect(result.meta.request_id).toBeNull();
    expect(result.meta.cost_usd).toBeNull();
    expect(result.meta.note).toMatch(/See OrcaRouter request log/);
  });
});
