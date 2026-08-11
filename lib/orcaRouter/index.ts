// Provider factory: real OrcaRouter when a key is configured, otherwise the labelled MOCK.
import type { OrcaProvider } from "./types";
import { MockProvider } from "./mockProvider";
import { OpenRouterProvider } from "./openRouterProvider";

export function getProvider(): OrcaProvider {
  const key = process.env.ORCAROUTER_API_KEY;
  if (key && key.trim().length > 0) {
    return new OpenRouterProvider(key.trim());
  }
  return new MockProvider();
}

export type { OrcaProvider, OrcaResult, OrcaMeta, OrcaInput } from "./types";
