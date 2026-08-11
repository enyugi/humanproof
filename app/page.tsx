"use client";

import { useState } from "react";
import { REQUESTED_DATA_CATEGORIES, CATEGORY_LABELS, CLAIM_LABELS, type RequestedDataCategory, type Claim } from "@/lib/claims";

const DEMO_TEXT =
  "We operate an 18+ community. We currently ask users for their full name, exact date of birth, home address and ID photo to confirm eligibility.";
const DEMO_SELECTED: RequestedDataCategory[] = ["full_name", "exact_birth_date", "address", "id_photo"];

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
    source: "MOCK" | "OPENROUTER";
    model: string;
    latency_ms: number;
    request_id: string;
    cost_usd: number | null;
    note?: string;
    raw_identity_documents_sent_to_ai: number;
    personal_identity_attributes_sent_to_ai: number;
  };
  pii_findings: { type: string; masked: string }[];
  pii_masked: boolean;
}

export default function Page() {
  const [serviceName, setServiceName] = useState("Demo 18+ Community");
  const [audience, setAudience] = useState("demo-18plus");
  const [purposeText, setPurposeText] = useState(DEMO_TEXT);
  const [selected, setSelected] = useState<Set<RequestedDataCategory>>(new Set(DEMO_SELECTED));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);

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
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceName, audience, purposeText, requestedData: Array.from(selected) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      setResult(data as AnalyzeResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  const a = result?.analysis;

  return (
    <div className="wrap">
      <header className="hp">
        <h1>
          HumanProof <span className="tag">— Turn identity requests into minimum proof</span>
        </h1>
        <p className="sub">AI HACK 2026 MVP · analysis slice · Demo Trusted Issuer is simulated · AI does not verify identity or make legal determinations.</p>
      </header>

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
            Do not enter real people&apos;s names, addresses, dates of birth, or ID numbers. Detected real values are masked
            before anything is sent to the AI. Only data-type names are sent.
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
            {loading ? "Analyzing…" : "Analyze with OrcaRouter"}
          </button>
        </section>

        {/* RESULT */}
        <section className="card">
          <h2>HumanProof recommendation</h2>

          {error && <div className="error">{error}</div>}
          {!result && !error && <p className="note">Enter a service purpose and click Analyze.</p>}

          {result && a && (
            <>
              {result.pii_masked && (
                <div className="banner">
                  {result.pii_findings.length} real value(s) detected and masked before sending to AI:{" "}
                  {result.pii_findings.map((f) => f.masked).join(", ")}
                </div>
              )}

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
                  <span>Model</span>
                  <span><code>{result.audit.model}</code></span>
                </div>
                <div className="row">
                  <span>Latency</span>
                  <span><code>{result.audit.latency_ms} ms</code></span>
                </div>
                <div className="row">
                  <span>Request ID</span>
                  <span><code className="mono">{result.audit.request_id}</code></span>
                </div>
                <div className="row">
                  <span>Cost</span>
                  <span>{result.audit.cost_usd !== null ? <code>${result.audit.cost_usd}</code> : <span className="note">See OrcaRouter request log</span>}</span>
                </div>
                <div className="row">
                  <span>Raw identity documents sent to AI</span>
                  <span className="pill real">{result.audit.raw_identity_documents_sent_to_ai}</span>
                </div>
                <div className="row">
                  <span>Personal identity attributes sent to AI</span>
                  <span className="pill real">{result.audit.personal_identity_attributes_sent_to_ai}</span>
                </div>
                {result.audit.note && <p className="note">{result.audit.note}</p>}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
