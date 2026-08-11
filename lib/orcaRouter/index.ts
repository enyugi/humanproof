// Provider factory: real OrcaRouter when a key is configured, otherwise the labelled MOCK.
import type { OrcaProvider, OrcaSource } from "./types";
import { MockProvider } from "./mockProvider";
import { OrcaRouterProvider } from "./orcaRouterProvider";

function hasKey(): boolean {
  const key = process.env.ORCAROUTER_API_KEY;
  return !!key && key.trim().length > 0;
}

/** Which provider will be used, known before any analysis runs (for pre-analysis UI). */
export function getProviderMode(): OrcaSource {
  return hasKey() ? "ORCAROUTER" : "MOCK";
}

export function getProvider(): OrcaProvider {
  if (hasKey()) return new OrcaRouterProvider(process.env.ORCAROUTER_API_KEY!.trim());
  return new MockProvider();
}

export type { OrcaProvider, OrcaResult, OrcaMeta, OrcaInput, OrcaSource } from "./types";
