import { describe, it, expect } from "vitest";
import {
  runAnalysis,
  classifyAnalyzeError,
  OrcaTimeoutError,
  ClientAbortError,
  PiiBlockedError,
  AnalyzeError,
} from "@/lib/analyze";
import { OrcaRouterProvider } from "@/lib/orcaRouter/orcaRouterProvider";
import type { OrcaInput, OrcaProvider, OrcaResult } from "@/lib/orcaRouter/types";

const META = { source: "ORCAROUTER" as const, model: null, response_model: null, latency_ms: 1, request_id: null, cost_usd: null };
const VALID_RAW = {
  version: "2",
  stated_purposes: [],
  detected_requested_data: [],
  required_claims: ["over_18"],
  optional_claims: [],
  potentially_unnecessary_data: [],
  unsupported_needs: [],
  assumptions: [],
  clarification_questions: [],
  summary: "ok",
};
const INPUT = { purposeText: "We allow real humans aged 18+ only.", requestedData: [] as string[] };

// Provider that never resolves but honors AbortSignal (rejects with the signal's reason).
class HangingProvider implements OrcaProvider {
  calls = 0;
  analyze(input: OrcaInput): Promise<OrcaResult> {
    this.calls++;
    return new Promise((_res, rej) => {
      const s = input.signal;
      if (!s) return;
      if (s.aborted) return rej(s.reason);
      s.addEventListener("abort", () => rej(s.reason));
    });
  }
}

// Provider that plays a scripted sequence: {raw} resolves; "hang" never resolves (honors abort).
class ScriptedProvider implements OrcaProvider {
  calls = 0;
  constructor(private seq: (Record<string, unknown> | "hang")[]) {}
  analyze(input: OrcaInput): Promise<OrcaResult> {
    const item = this.seq[this.calls++];
    if (item === "hang") {
      return new Promise((_r, rej) => {
        const s = input.signal;
        if (s?.aborted) return rej(s.reason);
        s?.addEventListener("abort", () => rej(s!.reason));
      });
    }
    return Promise.resolve({ raw: item, meta: META });
  }
}

describe("upstream timeout & deadline", () => {
  it("never-resolving upstream -> OrcaTimeoutError, exactly 1 upstream call (no retry)", async () => {
    const p = new HangingProvider();
    await expect(runAnalysis(INPUT, p, { perCallMs: 40, overallMs: 300 })).rejects.toBeInstanceOf(OrcaTimeoutError);
    expect(p.calls).toBe(1);
  });

  it("client disconnect -> ClientAbortError (distinct from timeout), exactly 1 call", async () => {
    const p = new HangingProvider();
    const ac = new AbortController();
    const promise = runAnalysis(INPUT, p, { perCallMs: 1000, overallMs: 2000, signal: ac.signal });
    setTimeout(() => ac.abort(), 20);
    await expect(promise).rejects.toBeInstanceOf(ClientAbortError);
    expect(p.calls).toBe(1);
  });

  it("schema-invalid then valid -> success with exactly 2 calls (one retry, within deadline)", async () => {
    const p = new ScriptedProvider([{}, VALID_RAW]);
    const r = await runAnalysis(INPUT, p, { perCallMs: 2000, overallMs: 4000 });
    expect(r.analysis.required_claims).toEqual(["over_18"]);
    expect(p.calls).toBe(2);
  });

  it("schema-invalid then retry times out -> OrcaTimeoutError, exactly 2 calls", async () => {
    const p = new ScriptedProvider([{}, "hang"]);
    await expect(runAnalysis(INPUT, p, { perCallMs: 50, overallMs: 500 })).rejects.toBeInstanceOf(OrcaTimeoutError);
    expect(p.calls).toBe(2);
  });

  it("schema-invalid twice -> AnalyzeError after at most one retry (2 calls)", async () => {
    const p = new ScriptedProvider([{}, {}]);
    await expect(runAnalysis(INPUT, p, { perCallMs: 2000, overallMs: 4000 })).rejects.toBeInstanceOf(AnalyzeError);
    expect(p.calls).toBe(2);
  });
});

describe("classifyAnalyzeError -> HTTP mapping", () => {
  it("upstream timeout -> 504 retriable", () => {
    const c = classifyAnalyzeError(new OrcaTimeoutError());
    expect(c.status).toBe(504);
    expect(c.body.timeout).toBe(true);
    expect(c.body.retriable).toBe(true);
  });
  it("client abort -> 499 (not confused with timeout)", () => {
    expect(classifyAnalyzeError(new ClientAbortError()).status).toBe(499);
  });
  it("PII blocked -> 422 blocked", () => {
    const c = classifyAnalyzeError(new PiiBlockedError(["email"]));
    expect(c.status).toBe(422);
    expect(c.body.blocked).toBe(true);
  });
  it("schema/analysis error -> 422", () => {
    expect(classifyAnalyzeError(new AnalyzeError("bad")).status).toBe(422);
  });
  it("unknown error -> 500", () => {
    expect(classifyAnalyzeError(new Error("boom")).status).toBe(500);
  });
});

describe("provider passes signal and never leaks body/prompt/auth", () => {
  it("forwards the AbortSignal to fetch and omits the response body on non-OK", async () => {
    let seenSignal: AbortSignal | undefined | null = null;
    const SECRET_BODY = "SENSITIVE-UPSTREAM-BODY-should-not-leak";
    const fakeFetch = async (_url: string, init: RequestInit) => {
      seenSignal = init.signal as AbortSignal | null | undefined;
      return new Response(SECRET_BODY, { status: 500 });
    };
    const provider = new OrcaRouterProvider("test-key", undefined, undefined, fakeFetch);
    const input: OrcaInput = { system: "s", sanitizedServiceText: "x", requestedDataCategories: [], allowlist: [], signal: AbortSignal.timeout(1000) };
    let msg = "";
    try {
      await provider.analyze(input);
    } catch (e) {
      msg = e instanceof Error ? e.message : String(e);
    }
    expect(seenSignal).toBeDefined();
    expect(msg).toMatch(/OrcaRouter HTTP 500/);
    expect(msg).not.toContain(SECRET_BODY);
    expect(msg).not.toContain("test-key");
    expect(msg.toLowerCase()).not.toContain("bearer");
  });
});
