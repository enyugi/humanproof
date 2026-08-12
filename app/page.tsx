"use client";

import { useEffect, useState } from "react";
import { REQUESTED_DATA_CATEGORIES, type RequestedDataCategory, type Claim } from "@/lib/claims";
import { DEMO_USER_WITHHELD_PII } from "@/lib/proof/demoUser";
import { DICT, LANG_SWITCH_LABEL, OTHER_LANG, catLabel, claimLabel, type Lang } from "@/lib/i18n";

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

function OrNotProvided({ value, fallback }: { value: string | number | null; fallback: string }) {
  if (value === null || value === undefined) return <span className="note">{fallback}</span>;
  return <code>{value}</code>;
}

export default function Page() {
  const [lang, setLang] = useState<Lang>("ja");
  const t = DICT[lang];

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
        setError(t.nextTimeout);
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
    ? t.analyzing
    : providerMode === null
      ? t.analyzeGeneric
      : isMock
        ? t.analyzeMock
        : t.analyzeReal;

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
    { key: "analyze", label: t.steps[0] },
    { key: "request", label: t.steps[1] },
    { key: "consent", label: t.steps[2] },
    { key: "issue", label: t.steps[3] },
    { key: "verify", label: t.steps[4] },
    { key: "revoke", label: t.steps[5] },
  ];
  const activeIndex = steps.findIndex((s) => !done[s.key]);

  return (
    <div className="wrap">
      <div className="topbar">
        <div className="brandmark">
          <span className="logo">{t.brand}</span>
          <span className="tag">{t.tagline}</span>
        </div>
        <button className="langtoggle" onClick={() => setLang(OTHER_LANG[lang])} aria-label="switch language">
          {LANG_SWITCH_LABEL[lang]}
        </button>
      </div>

      <header className="hero">
        <h1>
          {lang === "ja" ? (
            <>本人情報の要求を、<span className="accent">必要最小限の証明</span>に。</>
          ) : (
            <>Turn identity requests into <span className="accent">minimum proof</span>.</>
          )}
        </h1>
        <p className="lead">{t.heroLead}</p>
        <p className="fineprint">{t.disclaimerTop}</p>
      </header>

      {providerMode && (
        <div className={isMock ? "banner" : "banner ok-banner"}>
          {isMock ? (
            <>
              <strong>{t.providerMockLead}</strong> <code>MOCK</code>
              {t.providerMockTail}
            </>
          ) : (
            <>
              <strong>{t.providerReal}</strong>
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
          <h2>{t.reqTitle}</h2>
          <p className="note" style={{ marginTop: 0 }}>{t.reqIntro}</p>

          <label className="field" htmlFor="svc">{t.serviceName}</label>
          <input id="svc" type="text" value={serviceName} onChange={(e) => setServiceName(e.target.value)} />

          <label className="field" htmlFor="aud">{t.audienceSlug}</label>
          <input id="aud" type="text" value={audience} onChange={(e) => setAudience(e.target.value)} />

          <label className="field" htmlFor="purpose">{t.purposeLabel}</label>
          <textarea id="purpose" value={purposeText} onChange={(e) => setPurposeText(e.target.value)} />
          <p className="note">{t.purposeHint}</p>

          <button className="primary block" onClick={analyze} disabled={loading}>
            {buttonLabel}
          </button>

          <details className="tech">
            <summary>{t.requestedToggle(selected.size)}</summary>
            <div className="checks">
              {REQUESTED_DATA_CATEGORIES.map((cat) => (
                <label key={cat} className="check">
                  <input type="checkbox" checked={selected.has(cat)} onChange={() => toggle(cat)} />
                  {catLabel(lang, cat)}
                </label>
              ))}
            </div>
          </details>
        </section>

        {/* RESULT */}
        <section className="card">
          <h2>{t.resultTitle}</h2>

          {error && (
            <div className="error">
              {error}
              <div className="note">{analysisTimeout ? t.nextTimeout : t.nextInput}</div>
            </div>
          )}
          {blockedTypes && (
            <div className="error">
              <strong>{t.blockedLead}</strong> {t.blockedTail(blockedTypes.join(", "))}
              <div className="note">{t.blockedNext}</div>
            </div>
          )}
          {!result && !error && !blockedTypes && <p className="note">{t.emptyResult}</p>}

          {result && a && (
            <>
              {/* SIGNATURE — redacted personal data -> minimal proof */}
              <div className="transform">
                <div>
                  <p className="col-h">{t.currentlyRequested}</p>
                  <ul className="redact-list">
                    {a.detected_requested_data.map((d) => (
                      <li key={d} className="redact-item">
                        <span className="lbl">{catLabel(lang, d)}</span>
                        <span className="bar" aria-hidden="true" />
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="arrow">
                  <span className="count">
                    <span className="from">{a.data_count}</span>
                    <span className="sep">→</span>
                    <span className="to">{a.proof_count}</span>
                  </span>
                  <span className="glyph" aria-hidden="true">➜</span>
                  <span className="cap">{lang === "ja" ? "最小化" : "minimized"}</span>
                </div>
                <div>
                  <p className="col-h">{t.minimumProof}</p>
                  <ul className="proof-list">
                    {a.required_claims.map((c) => (
                      <li key={c} className="proof-badge">
                        <span className="tick" aria-hidden="true">✓</span>
                        {claimLabel(lang, c)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="subhead">{t.headlineSub(a.data_count)}</p>

              {/* Stated purpose */}
              <h3 className="section-h">{t.statedPurpose}</h3>
              <ul className="list">
                {a.stated_purposes.length === 0 && <li className="note">{t.noPurpose}</li>}
                {a.stated_purposes.map((p) => (
                  <li key={p.id} className="ok">
                    {p.label} <span className="note">— {p.rationale}</span>
                  </li>
                ))}
              </ul>

              {/* Optional claims (if any) */}
              {a.optional_claims.length > 0 && (
                <>
                  <h3 className="section-h">{t.minimumProof}</h3>
                  <ul className="list">
                    {a.optional_claims.map((c) => (
                      <li key={c} className="note">
                        {claimLabel(lang, c)} {t.optionalSuffix}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {/* Potentially unnecessary */}
              <h3 className="section-h">{t.potentiallyUnnecessary}</h3>
              <p className="note">{t.potentiallyUnnecessaryNote}</p>
              <ul className="list">
                {a.potentially_unnecessary_data.length === 0 && <li className="note">{t.noneFlagged}</li>}
                {a.potentially_unnecessary_data.map((p) => (
                  <li key={p.item} className="flag">
                    {catLabel(lang, p.item)} {p.reason_for_flag && <span className="note">— {p.reason_for_flag}</span>}
                  </li>
                ))}
              </ul>

              {/* Assumptions / clarifications */}
              {(a.assumptions.length > 0 || a.clarification_questions.length > 0 || a.unsupported_needs.length > 0) && (
                <>
                  <h3 className="section-h">{t.assumptionsTitle}</h3>
                  <ul className="list">
                    {a.assumptions.map((s, i) => (
                      <li key={`as-${i}`} className="note">{t.assumptionPrefix}{s}</li>
                    ))}
                    {a.clarification_questions.map((s, i) => (
                      <li key={`cq-${i}`} className="note">{t.questionPrefix}{s}</li>
                    ))}
                    {a.unsupported_needs.map((s, i) => (
                      <li key={`un-${i}`} className="note">{t.unsupportedPrefix}{s}</li>
                    ))}
                  </ul>
                </>
              )}

              <p className="disclaimer">{t.disclaimerFull}</p>

              {/* Trust evidence — concise, always visible */}
              <div className="evidence">
                <span className={result.audit.source === "MOCK" ? "pill mock" : "pill real"}>{t.evAi}{result.audit.source}</span>
                <span className="pill real">{t.evPii}{result.audit.zero_pii.detected_personal_identity_attribute_values_in_egress}</span>
                <span className="pill real">{t.evLatency}{result.audit.latency_ms} ms</span>
              </div>

              {/* Audit (full technical detail, one click away) */}
              <details className="tech">
                <summary>{t.auditToggle}</summary>
                <div className="audit">
                  <div className="row"><span>{t.auditSource}</span><span className={result.audit.source === "MOCK" ? "pill mock" : "pill real"}>{result.audit.source}</span></div>
                  <div className="row"><span>{t.auditResolvedModel}</span><span><OrNotProvided value={result.audit.model} fallback={t.notProvided} /></span></div>
                  <div className="row"><span>{t.auditResponseModel}</span><span><OrNotProvided value={result.audit.response_model} fallback={t.notProvided} /></span></div>
                  <div className="row"><span>{t.auditLatency}</span><span><code>{result.audit.latency_ms} ms</code></span></div>
                  <div className="row"><span>{t.auditRequestId}</span><span><OrNotProvided value={result.audit.request_id} fallback={t.notProvided} /></span></div>
                  <div className="row"><span>{t.auditCost}</span><span>{result.audit.cost_usd !== null ? <code>${result.audit.cost_usd}</code> : <span className="note">{t.auditCostFallback}</span>}</span></div>
                  <div className="row"><span>{t.auditPiiEgress}</span><span className="pill real">{result.audit.zero_pii.detected_personal_identity_attribute_values_in_egress}</span></div>
                  <div className="row"><span>{t.auditRawDocs}</span><span className="pill real">{result.audit.zero_pii.raw_identity_documents_sent_to_ai}</span></div>
                  <div className="row"><span>{t.auditInvalidDropped}</span><span><code>{result.audit.zero_pii.requested_data_invalid_dropped}</code></span></div>
                  <div className="row"><span>{t.auditDupCollapsed}</span><span><code>{result.audit.zero_pii.requested_data_deduplicated}</code></span></div>
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
            <span className="steptag">{t.step3tag}</span>
            <h3>{t.step3title}</h3>
            <p className="note" style={{ marginTop: 0 }}>{t.step3intro}</p>
            <div className="checks">
              {a.required_claims.concat(a.optional_claims).map((c) => (
                <label key={c} className="check">
                  <input type="checkbox" checked={consentClaims.has(c)} onChange={() => toggleConsentClaim(c)} />
                  {t.sharePrefix}{claimLabel(lang, c)}
                </label>
              ))}
            </div>
            <p className="note" style={{ marginTop: 10 }}>
              {t.notIncluded(DEMO_USER_WITHHELD_PII.map((p) => catLabel(lang, p)).join(", "))}
            </p>
            <button className="primary" onClick={reviewQuote} disabled={consentClaims.size === 0}>
              {t.createRequest}
            </button>

            {proofError && (
              <div className="error" style={{ marginTop: 12 }}>
                {proofError}
                <div className="note">{t.proofErrNext}</div>
              </div>
            )}

            {quote && (
              <div className="banner ok-banner" style={{ marginTop: 14 }}>
                <strong>{t.proofRequestTitle}</strong>
                <div style={{ marginTop: 6 }}>{t.sharedWith}<code>{quote.audience}</code></div>
                <div>{t.proofsLabel}{quote.claims.map((c) => claimLabel(lang, c)).join(", ") || t.none}</div>
                {quote.excluded.length > 0 && <div>{t.notAvailable}{quote.excluded.map((c) => claimLabel(lang, c)).join(", ")}</div>}
                <div>{t.notIncluded(quote.withheld_pii.map((p) => catLabel(lang, p)).join(", "))}</div>
                <label className="check" style={{ marginTop: 10 }}>
                  <input type="checkbox" checked={consentGiven} onChange={(e) => setConsentGiven(e.target.checked)} />
                  {t.consentCheck}
                </label>
                <div>
                  <button className="primary" onClick={issueProof} disabled={!consentGiven || quote.claims.length === 0}>
                    {t.issueProof}
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* STEP 4 — Issued proof */}
          {proof && (
            <section className="stepcard">
              <span className="steptag">{t.step4tag}</span>
              <h3>{t.step4title}</h3>
              <p className="note" style={{ marginTop: 0 }}>
                {t.step4intro(
                  proof.claims.map((c) => claimLabel(lang, c)).join(", "),
                  proof.audience,
                  new Date(proof.expires_at * 1000).toLocaleTimeString(),
                )}
              </p>
              {revocationCode && (
                <div className="banner">
                  <strong>{t.revocationLead}</strong> <code className="mono">{revocationCode}</code>
                  <div className="note">{t.revocationNote}</div>
                </div>
              )}
              <details className="tech">
                <summary>{t.proofInternals}</summary>
                <div className="audit">
                  <div className="row"><span>{t.internalIssuer}</span><span><code>{proof.issuer}</code></span></div>
                  <div className="row"><span>{t.internalSubject}</span><span><code className="mono">{proof.subject.slice(0, 24)}…</code></span></div>
                  <div className="row"><span>{t.internalClaims}</span><span>{proof.claims.map((c) => claimLabel(lang, c)).join(", ")}</span></div>
                  <div className="row"><span>{t.internalExpires}</span><span><code>{new Date(proof.expires_at * 1000).toISOString()}</code></span></div>
                  <div className="row"><span>{t.internalJti}</span><span><code className="mono">{proof.jti}</code></span></div>
                </div>
              </details>
              <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="primary" onClick={verifyProofNow}>{t.verifyAsService}</button>
                <button className="primary ghost-danger" onClick={revokeProof} disabled={!revocationCode}>
                  {t.revokeBtn}
                </button>
              </div>
            </section>
          )}

          {/* STEP 5/6 — Verification result */}
          {verify && (
            <section className="stepcard">
              <span className="steptag">{verify.status === "REVOKED" ? t.step6tag : t.step5tag}</span>
              <h3>{verify.status === "VALID" ? t.verifyTitleValid : verify.status === "REVOKED" ? t.verifyTitleRevoked : t.verifyTitleFail}</h3>
              <div className={`verdict ${verify.status === "VALID" ? "ok" : "bad"}`}>{verify.status}</div>
              <p className="note" style={{ textAlign: "center" }}>
                {verify.status === "VALID" ? t.verifyNoteValid : verify.status === "REVOKED" ? t.verifyNoteRevoked : t.verifyNoteFail}
              </p>
              <details className="tech">
                <summary>{t.independentChecks}</summary>
                <div className="audit">
                  {(["signature", "issuer", "audience", "expiry", "revocation"] as const).map((k) => (
                    <div className="row" key={k}>
                      <span>{t.checkNames[k]}</span>
                      <span className={verify.checks[k] ? "pill real" : "pill mock"}>{verify.checks[k] ? t.pass : t.fail}</span>
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
