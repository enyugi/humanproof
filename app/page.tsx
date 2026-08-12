"use client";

import { useEffect, useState } from "react";
import { REQUESTED_DATA_CATEGORIES, CATEGORY_LABELS, CLAIM_LABELS, type RequestedDataCategory, type Claim } from "@/lib/claims";
import { DEMO_USER_WITHHELD_PII } from "@/lib/proof/demoUser";

interface ProofSummary {
  issuer: string;
  subject: string;
  audience: string;
  claims: Claim[];
  issued_at: number;
  expires_at: number;
  jti: string;
}
interface VerifyResult {
  status: string;
  checks: { signature: boolean; issuer: boolean; audience: boolean; expiry: boolean; revocation: boolean };
  claims?: Claim[];
  subject?: string;
  expires_at?: number;
}
interface Quote {
  quote: string;
  audience: string;
  claims: Claim[];
  excluded: Claim[];
  withheld_pii: RequestedDataCategory[];
  expires_at: number;
}

const DEMO_TEXT =
  "We operate an 18+ online community and must confirm that each member is a real human being who is over 18, to keep out bots and underage signups. We currently ask users for their full name, exact date of birth, home address and ID photo to confirm this.";
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
  const [analysisTimeout, setAnalysisTimeout] = useState(false);
  const [blockedTypes, setBlockedTypes] = useState<string[] | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  // Proof lifecycle state
  const [consentClaims, setConsentClaims] = useState<Set<Claim>>(new Set());
  const [quote, setQuote] = useState<Quote | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [proof, setProof] = useState<ProofSummary | null>(null);
  const [proofToken, setProofToken] = useState<string | null>(null);
  const [revocationCode, setRevocationCode] = useState<string | null>(null);
  const [verify, setVerify] = useState<VerifyResult | null>(null);
  const [proofError, setProofError] = useState<string | null>(null);

  // Any change to audience or the selected claims invalidates a prior quote: the user must review
  // and explicitly consent to the exact set again before issuance (Problem 1/2).
  useEffect(() => {
    setQuote(null);
    setConsentGiven(false);
    setProof(null);
    setProofToken(null);
    setRevocationCode(null);
    setVerify(null);
  }, [audience, consentClaims]);

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
    setAnalysisTimeout(false);
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
      if (data.timeout) {
        // upstream connection delay — distinct from an input error; user can simply retry
        setAnalysisTimeout(true);
        setError(data.error ?? "Temporary connection delay. Please wait a moment and try again.");
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      const parsed = data as AnalyzeResponse;
      setResult(parsed);
      // seed the proof flow with the recommended minimum proof
      setConsentClaims(new Set(parsed.analysis.required_claims));
      setConsentGiven(false);
      setProof(null);
      setProofToken(null);
      setVerify(null);
      setProofError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  function toggleConsentClaim(c: Claim) {
    setConsentClaims((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  }

  async function reviewQuote() {
    setProofError(null);
    setProof(null);
    setProofToken(null);
    setRevocationCode(null);
    setVerify(null);
    setConsentGiven(false);
    try {
      const res = await fetch("/api/proof/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audience, claims: Array.from(consentClaims) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Quote failed");
      setQuote(data as Quote);
    } catch (e) {
      setProofError(e instanceof Error ? e.message : "Quote failed");
    }
  }

  async function issueProof() {
    if (!quote || !consentGiven) return;
    setProofError(null);
    setVerify(null);
    try {
      const res = await fetch("/api/proof/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quote: quote.quote, consent: consentGiven }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Issue failed");
      setProof(data.proof as ProofSummary);
      setProofToken(data.token as string);
      setRevocationCode(data.revocationCode as string);
    } catch (e) {
      setProofError(e instanceof Error ? e.message : "Issue failed");
    }
  }

  async function verifyProofNow() {
    if (!proofToken) return;
    setProofError(null);
    try {
      const res = await fetch("/api/proof/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: proofToken, expectedAudience: audience }),
      });
      setVerify((await res.json()) as VerifyResult);
    } catch (e) {
      setProofError(e instanceof Error ? e.message : "Verify failed");
    }
  }

  async function revokeProof() {
    if (!revocationCode) return;
    setProofError(null);
    try {
      const res = await fetch("/api/proof/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revocationCode }), // holder's secret code, NOT the proof token
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Revoke failed (HTTP ${res.status})`);
      }
      await verifyProofNow(); // re-verify -> should now show REVOKED
    } catch (e) {
      setProofError(e instanceof Error ? e.message : "Revoke failed");
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

  // Progress along the single demo path (orientation for a first-time viewer).
  const done = {
    analyze: !!result,
    request: !!quote,
    consent: !!quote && consentGiven,
    issue: !!proof,
    verify: !!verify && (verify.status === "VALID" || verify.status === "REVOKED"),
    revoke: verify?.status === "REVOKED",
  };
  const steps: { key: keyof typeof done; label: string }[] = [
    { key: "analyze", label: "Analyze" },
    { key: "request", label: "Proof request" },
    { key: "consent", label: "Consent" },
    { key: "issue", label: "Issue" },
    { key: "verify", label: "Verify" },
    { key: "revoke", label: "Revoke" },
  ];
  const activeIndex = steps.findIndex((s) => !done[s.key]);

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

      {/* One-path progress rail */}
      <ol className="stepper" aria-label="demo steps">
        {steps.map((s, i) => (
          <li key={s.key} className={`step ${done[s.key] ? "done" : i === activeIndex ? "active" : ""}`}>
            <span className="n">{done[s.key] ? "✓" : i + 1}</span>
            {s.label}
          </li>
        ))}
      </ol>

      <div className="grid">
        {/* INPUT */}
        <section className="card">
          <h2>1 · Service requirement</h2>
          <p className="note" style={{ marginTop: 0 }}>
            A service says what it wants. HumanProof&apos;s AI proposes the smallest proof that still satisfies the purpose.
          </p>
          <label htmlFor="svc">Service name</label>
          <input id="svc" type="text" value={serviceName} onChange={(e) => setServiceName(e.target.value)} />

          <label htmlFor="aud">Audience / slug</label>
          <input id="aud" type="text" value={audience} onChange={(e) => setAudience(e.target.value)} />

          <label htmlFor="purpose">Purpose and current process (required)</label>
          <textarea id="purpose" value={purposeText} onChange={(e) => setPurposeText(e.target.value)} />
          <p className="note">
            Use data-type names only. If a real name, address, date, or ID number is detected, the request is blocked before any AI call.
          </p>

          <button className="primary block" onClick={analyze} disabled={loading}>
            {buttonLabel}
          </button>

          <details className="tech">
            <summary>Currently requested data — {selected.size} selected (edit)</summary>
            <div className="checks">
              {REQUESTED_DATA_CATEGORIES.map((cat) => (
                <label key={cat} className="check">
                  <input type="checkbox" checked={selected.has(cat)} onChange={() => toggle(cat)} />
                  {CATEGORY_LABELS[cat]}
                </label>
              ))}
            </div>
          </details>
        </section>

        {/* RESULT */}
        <section className="card">
          <h2>2 · Minimum proof</h2>

          {error && (
            <div className="error">
              {error}
              <div className="note">{analysisTimeout ? "Next: wait a few seconds, then click Analyze again." : "Next: check the purpose text and try Analyze again."}</div>
            </div>
          )}
          {blockedTypes && (
            <div className="error">
              <strong>Blocked before sending to AI.</strong> Real personal values were detected in the purpose text
              ({blockedTypes.join(", ")}).
              <div className="note">Next: replace real values with data-type names (e.g. &quot;full name&quot;) and Analyze again. Nothing was sent to the AI.</div>
            </div>
          )}
          {!result && !error && !blockedTypes && <p className="note">Click <strong>Analyze</strong> on the left to see the minimum proof.</p>}

          {result && a && (
            <>
              {/* Before / After headline */}
              <div className="headline">
                <span className="num">{a.data_count}</span> pieces of personal data →{" "}
                <span className="num">{a.proof_count}</span> proofs
              </div>
              <p className="note" style={{ textAlign: "center", marginTop: 0 }}>
                The service can confirm what it needs without collecting {a.data_count} personal data item(s).
              </p>

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

              {/* Trust evidence — concise, always visible */}
              <div className="evidence">
                <span className={result.audit.source === "MOCK" ? "pill mock" : "pill real"}>AI: {result.audit.source}</span>
                <span className="pill real">Identity-value findings in AI-bound payload (heuristic): {result.audit.zero_pii.detected_personal_identity_attribute_values_in_egress}</span>
                <span className="pill real">Latency: {result.audit.latency_ms} ms</span>
              </div>

              {/* Audit (full technical detail, one click away) */}
              <details className="tech">
                <summary>Technical details &amp; audit — Zero-PII evidence, OrcaRouter metadata</summary>
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
              </details>
            </>
          )}
        </section>
      </div>

      {result && a && (
        <>
          {/* STEP 3 — Proof request + explicit consent */}
          <section className="stepcard">
            <span className="steptag">Step 3 · Proof request &amp; consent</span>
            <h3>Choose what to share, then consent</h3>
            <p className="note" style={{ marginTop: 0 }}>
              Pick what to share (default = the minimum proof). The <strong>Demo Trusted Issuer (simulated — not real
              identity verification)</strong> confirms the exact set; you then explicitly consent. The proof can never
              contain more than you consented to.
            </p>
            <div className="checks">
              {a.required_claims.concat(a.optional_claims).map((c) => (
                <label key={c} className="check">
                  <input type="checkbox" checked={consentClaims.has(c)} onChange={() => toggleConsentClaim(c)} />
                  Share: {CLAIM_LABELS[c]}
                </label>
              ))}
            </div>
            <p className="note" style={{ marginTop: 10 }}>
              Not included in this proof: {DEMO_USER_WITHHELD_PII.map((p) => CATEGORY_LABELS[p]).join(", ")}
            </p>
            <button className="primary" onClick={reviewQuote} disabled={consentClaims.size === 0}>
              Create Proof Request
            </button>

            {proofError && (
              <div className="error" style={{ marginTop: 12 }}>
                {proofError}
                <div className="note">Next: adjust your selection and create the Proof Request again.</div>
              </div>
            )}

            {quote && (
              <div className="banner ok-banner" style={{ marginTop: 14 }}>
                <strong>Proof Request — exactly what will be issued</strong>
                <div style={{ marginTop: 6 }}>Shared with: <code>{quote.audience}</code></div>
                <div>Proofs: {quote.claims.map((c) => CLAIM_LABELS[c]).join(", ") || "none"}</div>
                {quote.excluded.length > 0 && <div>Not available: {quote.excluded.join(", ")}</div>}
                <div>Not included in this proof: {quote.withheld_pii.map((p) => CATEGORY_LABELS[p]).join(", ")}</div>
                <label className="check" style={{ marginTop: 10 }}>
                  <input type="checkbox" checked={consentGiven} onChange={(e) => setConsentGiven(e.target.checked)} />
                  I consent to share exactly this
                </label>
                <div>
                  <button className="primary" onClick={issueProof} disabled={!consentGiven || quote.claims.length === 0}>
                    Issue Signed Proof
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* STEP 4 — Issued proof */}
          {proof && (
            <section className="stepcard">
              <span className="steptag">Step 4 · Signed Proof issued</span>
              <h3>A signed, short-lived proof — only the selected claims</h3>
              <p className="note" style={{ marginTop: 0 }}>
                Shares <strong>{proof.claims.map((c) => CLAIM_LABELS[c]).join(", ")}</strong> with <code>{proof.audience}</code>,
                signed by the Demo Issuer and valid until {new Date(proof.expires_at * 1000).toLocaleTimeString()}.
              </p>
              {revocationCode && (
                <div className="banner">
                  <strong>Your revocation code (demo — shown so you can revoke):</strong> <code className="mono">{revocationCode}</code>
                  <div className="note">Only the holder of this code can revoke. A service shown the proof cannot.</div>
                </div>
              )}
              <details className="tech">
                <summary>Proof internals (issuer, pairwise subject, id, expiry)</summary>
                <div className="audit">
                  <div className="row"><span>Issuer</span><span><code>{proof.issuer}</code></span></div>
                  <div className="row"><span>Subject (pairwise, per-audience)</span><span><code className="mono">{proof.subject.slice(0, 24)}…</code></span></div>
                  <div className="row"><span>Claims</span><span>{proof.claims.map((c) => CLAIM_LABELS[c]).join(", ")}</span></div>
                  <div className="row"><span>Expires at</span><span><code>{new Date(proof.expires_at * 1000).toISOString()}</code></span></div>
                  <div className="row"><span>Proof id (jti)</span><span><code className="mono">{proof.jti}</code></span></div>
                </div>
              </details>
              <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="primary" onClick={verifyProofNow}>Verify as the service</button>
                <button className="primary" onClick={revokeProof} disabled={!revocationCode} style={{ background: "var(--danger)" }}>
                  Revoke (you hold the code)
                </button>
              </div>
            </section>
          )}

          {/* STEP 5/6 — Verification result */}
          {verify && (
            <section className="stepcard">
              <span className="steptag">{verify.status === "REVOKED" ? "Step 6 · After revocation" : "Step 5 · Verification"}</span>
              <h3>{verify.status === "VALID" ? "The service confirms the proof" : verify.status === "REVOKED" ? "The same proof no longer works" : "The proof could not be confirmed"}</h3>
              <div className={`verdict ${verify.status === "VALID" ? "ok" : "bad"}`}>{verify.status}</div>
              <p className="note" style={{ textAlign: "center" }}>
                {verify.status === "VALID"
                  ? "Signature, issuer, audience, expiry and revocation all checked independently. Now try Revoke, then Verify again."
                  : verify.status === "REVOKED"
                    ? "Revocation is checked at verify time — the proof is now rejected."
                    : "Fail-closed: validity could not be established, so the proof is not accepted."}
              </p>
              <details className="tech">
                <summary>Independent checks</summary>
                <div className="audit">
                  {(["signature", "issuer", "audience", "expiry", "revocation"] as const).map((k) => (
                    <div className="row" key={k}>
                      <span>{k}</span>
                      <span className={verify.checks[k] ? "pill real" : "pill mock"}>{verify.checks[k] ? "pass" : "fail"}</span>
                    </div>
                  ))}
                </div>
              </details>
            </section>
          )}
        </>
      )}
    </div>
  );
}
