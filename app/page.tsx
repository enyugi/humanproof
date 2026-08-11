"use client";

import { useEffect, useState } from "react";
import { REQUESTED_DATA_CATEGORIES, CATEGORY_LABELS, CLAIM_LABELS, type RequestedDataCategory, type Claim } from "@/lib/claims";

const DEMO_TEXT =
  "We operate an 18+ community. We currently ask users for their full name, exact date of birth, home address and ID photo to confirm eligibility.";
const DEMO_SELECTED: RequestedDataCategory[] = ["full_name", "exact_birth_date", "address", "id_photo"];

type Source = "MOCK" | "ORCAROUTER";

interface AnalyzeResponse {
  analysis: {
    stated_purposes: { id: string; label: string; rationale: string }[];
    detected_requested_data: RequestedDataCategory[];
    required_claims: Claim[];
    optional_claims: Claim[];
    potentially_unnecessary_data: { item: RequestedDataCategory; reason_for_flag: string }[];
    unsupported_needs: string[];
    assumptions: string[];
    clarification_questions: string[];
    summary: string;
    data_count: number;
    proof_count: number;
  };
  audit: {
    source: Source;
    model: string | null;
    response_model: string | null;
    latency_ms: number;
    request_id: string | null;
    cost_usd: number | null;
    note?: string;
    zero_pii: {
      policy: string;
      input_pii_findings: number;
      egress_payload_scanned: boolean;
      detected_personal_identity_attribute_values_in_egress: number;
      raw_identity_documents_sent_to_ai: number;
      requested_data_invalid_dropped: number;
      requested_data_deduplicated: number;
      basis: string;
    };
  };
}

function OrNotProvided({ value }: { value: string | number | null }) {
  if (value === null || value === undefined) return <span className="note">Not provided</span>;
  return <code>{value}</code>;
}

export default function Page() {
  const [providerMode, setProviderMode] = useState<Source | null>(null);
  const [serviceName, setServiceName] = useState("Demo 18+ Community");
  const [audience, setAudience] = useState("demo-18plus");
  const [purposeText, setPurposeText] = useState(DEMO_TEXT);
  const [selected, setSelected] = useState<Set<RequestedDataCategory>>(new Set(DEMO_SELECTED));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockedTypes, setBlockedTypes] = useState<string[] | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  useEffect(() => {
    fetch("/api/provider")
      .then((r) => r.json())
      .then((d) => setProviderMode(d.source as Source))
      .catch(() => setProviderMode(null));
  }, []);

  function toggle(cat: RequestedDataCategory) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  async function analyze() {
    setLoading(true);
    setError(null);
    setBlockedTypes(null);
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceName, audience, purposeText, requestedData: Array.from(selected) }),
      });
      const data = await res.json();
      if (res.status === 422 && data.blocked) {
        setBlockedTypes(data.pii_finding_types ?? []);
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      setResult(data as AnalyzeResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  const a = result?.analysis;
  const isMock = providerMode === "MOCK";
  const buttonLabel = loading
    ? "Analyzing…"
    : providerMode === null
      ? "Analyze"
      : isMock
        ? "Analyze (MOCK provider)"
        : "Analyze with OrcaRouter";

  return (
    <div className="wrap">
      <header className="hp">
        <h1>
          HumanProof <span className="tag">— Turn identity requests into minimum proof</span>
        </h1>
        <p className="sub">AI HACK 2026 MVP · analysis slice · Demo Trusted Issuer is simulated · AI does not verify identity or make legal determinations.</p>
      </header>

      {providerMode && (
        <div className={isMock ? "banner" : "banner ok-banner"}>
          {isMock ? (
            <>
              <strong>MOCK provider active.</strong> A deterministic rule-based analyzer — not a real model call. Audit
              metadata below is labelled <span className="pill mock">MOCK</span>. Set <code>ORCAROUTER_API_KEY</code> for real OrcaRouter analysis.
            </>
          ) : (
            <>
              <strong>OrcaRouter provider active.</strong> Real gateway call; audit shows actual metadata only.
            </>
          )}
        </div>
      )}

      <div className="grid">
        {/* INPUT */}
        <section className="card">
          <h2>Service requirement</h2>
          <label htmlFor="svc">Service name</label>
          <input id="svc" type="text" value={serviceName} onChange={(e) => setServiceName(e.target.value)} />

          <label htmlFor="aud">Audience / slug</label>
          <input id="aud" type="text" value={audience} onChange={(e) => setAudience(e.target.value)} />

          <label htmlFor="purpose">Purpose and current process (required)</label>
          <textarea id="purpose" value={purposeText} onChange={(e) => setPurposeText(e.target.value)} />
          <p className="note">
            Describe the purpose using data-type names only. Do not enter real people&apos;s names, addresses, dates of
            birth, or ID numbers — if detected, the request is <strong>blocked</strong> (not sent to the AI) so you can remove them.
          </p>

          <label>Currently requested data (categories only)</label>
          <div className="checks">
            {REQUESTED_DATA_CATEGORIES.map((cat) => (
              <label key={cat} className="check">
                <input type="checkbox" checked={selected.has(cat)} onChange={() => toggle(cat)} />
                {CATEGORY_LABELS[cat]}
              </label>
            ))}
          </div>

          <button className="primary" onClick={analyze} disabled={loading}>
            {buttonLabel}
          </button>
        </section>

        {/* RESULT */}
        <section className="card">
          <h2>HumanProof recommendation</h2>

          {error && <div className="error">{error}</div>}
          {blockedTypes && (
            <div className="error">
              <strong>Blocked before sending to AI.</strong> Real personal values were detected in the purpose text
              ({blockedTypes.join(", ")}). Remove them (use data-type names instead) and analyze again. Nothing was sent to the gateway.
            </div>
          )}
          {!result && !error && !blockedTypes && <p className="note">Enter a service purpose and click Analyze.</p>}

          {result && a && (
            <>
              {/* Before / After headline */}
              <div className="headline">
                <span className="num">{a.data_count}</span> pieces of personal data →{" "}
                <span className="num">{a.proof_count}</span> proofs
              </div>

              {/* 1. Stated purpose */}
              <h2>Stated purpose</h2>
              <ul className="list">
                {a.stated_purposes.length === 0 && <li className="note">No clear purpose detected.</li>}
                {a.stated_purposes.map((p) => (
                  <li key={p.id} className="ok">
                    {p.label} <span className="note">— {p.rationale}</span>
                  </li>
                ))}
              </ul>

              {/* 2. Currently requested */}
              <h2>Currently requested</h2>
              <ul className="list">
                {a.detected_requested_data.length === 0 && <li className="note">None.</li>}
                {a.detected_requested_data.map((d) => (
                  <li key={d}>{CATEGORY_LABELS[d]}</li>
                ))}
              </ul>

              {/* 3. Minimum proof */}
              <h2>Minimum proof</h2>
              <ul className="list">
                {a.required_claims.map((c) => (
                  <li key={c} className="ok">
                    {CLAIM_LABELS[c]}
                  </li>
                ))}
                {a.optional_claims.map((c) => (
                  <li key={c} className="note">
                    {CLAIM_LABELS[c]} (optional — add only if the purpose requires it)
                  </li>
                ))}
              </ul>

              {/* 4. Potentially unnecessary */}
              <h2>Potentially unnecessary for the stated purpose</h2>
              <p className="note">
                We could not confirm why these items are needed from the purpose you described. Additional legal,
                fraud-prevention, delivery, or operational purposes may change this recommendation.
              </p>
              <ul className="list">
                {a.potentially_unnecessary_data.length === 0 && <li className="note">None flagged.</li>}
                {a.potentially_unnecessary_data.map((p) => (
                  <li key={p.item} className="flag">
                    {CATEGORY_LABELS[p.item]}
                  </li>
                ))}
              </ul>

              {/* 5. Assumptions / clarifications */}
              {(a.assumptions.length > 0 || a.clarification_questions.length > 0 || a.unsupported_needs.length > 0) && (
                <>
                  <h2>Assumptions / clarifications</h2>
                  <ul className="list">
                    {a.assumptions.map((s, i) => (
                      <li key={`as-${i}`} className="note">
                        Assumption: {s}
                      </li>
                    ))}
                    {a.clarification_questions.map((s, i) => (
                      <li key={`cq-${i}`} className="note">
                        Question: {s}
                      </li>
                    ))}
                    {a.unsupported_needs.map((s, i) => (
                      <li key={`un-${i}`} className="note">
                        Unsupported need: {s}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {/* 6. Disclaimer */}
              <p className="disclaimer">
                AI recommendation only. HumanProof does not verify identity and does not provide legal or compliance
                determinations. Final decisions remain with the service and the user.
              </p>

              {/* Audit */}
              <h2>OrcaRouter audit</h2>
              <div className="audit">
                <div className="row">
                  <span>Source</span>
                  <span className={result.audit.source === "MOCK" ? "pill mock" : "pill real"}>{result.audit.source}</span>
                </div>
                <div className="row">
                  <span>Resolved model (X-Orca-Resolved-Model)</span>
                  <span><OrNotProvided value={result.audit.model} /></span>
                </div>
                <div className="row">
                  <span>Response model (body)</span>
                  <span><OrNotProvided value={result.audit.response_model} /></span>
                </div>
                <div className="row">
                  <span>Latency</span>
                  <span><code>{result.audit.latency_ms} ms</code></span>
                </div>
                <div className="row">
                  <span>Request ID</span>
                  <span><OrNotProvided value={result.audit.request_id} /></span>
                </div>
                <div className="row">
                  <span>Cost</span>
                  <span>{result.audit.cost_usd !== null ? <code>${result.audit.cost_usd}</code> : <span className="note">See OrcaRouter request log</span>}</span>
                </div>
                <div className="row">
                  <span>Detected personal identity attribute values in egress (heuristic)</span>
                  <span className="pill real">{result.audit.zero_pii.detected_personal_identity_attribute_values_in_egress}</span>
                </div>
                <div className="row">
                  <span>Raw identity documents sent to AI</span>
                  <span className="pill real">{result.audit.zero_pii.raw_identity_documents_sent_to_ai}</span>
                </div>
                <div className="row">
                  <span>Invalid (non-category) inputs dropped before egress</span>
                  <span><code>{result.audit.zero_pii.requested_data_invalid_dropped}</code></span>
                </div>
                <div className="row">
                  <span>Duplicate categories collapsed before egress</span>
                  <span><code>{result.audit.zero_pii.requested_data_deduplicated}</code></span>
                </div>
                <p className="note">{result.audit.zero_pii.basis}</p>
                {result.audit.note && <p className="note">{result.audit.note}</p>}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
