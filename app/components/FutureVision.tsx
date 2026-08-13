// 「この先の未来」節。正本 01_PRODUCT/Future_Vision.md・05_FUTURE/*・MASTER §10 準拠。
// NOW(=このPoC・実装済) と NEXT/FUTURE(=構想・未実装) を明確に区別する（MASTER §8: 実装済/将来を分ける）。
import type { Lang } from "@/lib/i18n";

const L = {
  ja: {
    title: "この先の未来",
    lead: "HumanProof が最終的に目指すのは「人と AI エージェントが混在するインターネットのための Trust Layer」。以下の NEXT・FUTURE は構想であり、まだ実装していません。",
    nowBadge: "実装済（このPoC）",
    futureBadge: "構想・未実装",
    nowTitle: "NOW ― 本人情報の最小化",
    nowBody: "人向けに、必要以上の本人情報を渡さず「実在する人」「18歳以上」などの証明だけを提示する（今回のPoC）。",
    nextTitle: "NEXT ― 信頼の輪を広げる",
    nextItems: [
      "複数の Trusted Issuer / 実 eKYC・公的ID との接続",
      "Verified Creator・Organization・Worker・Qualification へ拡張",
      "標準的な Credential / Presentation 方式の評価",
    ],
    futureTitle: "FUTURE ― 人と AI の Trust Layer",
    futureBody: "人・AI エージェント・認可されたアバター・組織が混在するネットで、次を必要最小限だけ証明する：",
    q: ["何者か", "誰が許可したか", "どの権限を", "誰のために", "いつまで", "失効できるか"],
    concepts: [
      "AI Agent Trust ― AIの正体を明かさず「Company X が認可／¥10,000まで購入可／契約署名は不可」等の権限だけ提示",
      "Verified Avatar ― 生顔や本名を出さず「認証済み本人が許可したアバター」として存在",
      "Trusted Issuer ecosystem ― HumanProof を信用の根にせず、Verifier がどの Issuer を信頼するか決める",
    ],
    disclaimer: "※「世界初」「競合なし」等は主張しません。企業ニーズ・効果量・独自性は未検証です。HumanProof は本人確認AIではなく、AI は推薦者であって権限者・法的判断者ではありません。",
  },
  en: {
    title: "Where this goes next",
    lead: "HumanProof's end goal is a trust layer for an internet shared by humans and AI agents. NEXT and FUTURE below are concepts — not yet built.",
    nowBadge: "Built (this PoC)",
    futureBadge: "Concept — not built",
    nowTitle: "NOW — minimizing identity",
    nowBody: "For people: prove only facts like \"a real person\" or \"over 18\" without handing over more identity than needed (this PoC).",
    nextTitle: "NEXT — widen the circle of trust",
    nextItems: [
      "Multiple Trusted Issuers / real eKYC & government ID",
      "Extend to Verified Creator / Organization / Worker / Qualification",
      "Evaluate standard Credential / Presentation formats",
    ],
    futureTitle: "FUTURE — a trust layer for humans & AI",
    futureBody: "On a net of humans, AI agents, authorized avatars and organizations, prove only the minimum:",
    q: ["What are you", "Who authorized you", "What may you do", "For whom", "Until when", "Can it be revoked"],
    concepts: [
      "AI Agent Trust — show only powers (\"authorized by Company X / may buy up to ¥10,000 / may not sign contracts\") without revealing the agent's full identity",
      "Verified Avatar — exist online as \"an avatar an authorized real person permitted\", without your face or legal name",
      "Trusted Issuer ecosystem — HumanProof isn't the root of trust; the Verifier chooses which Issuers to trust",
    ],
    disclaimer: "We don't claim \"world-first\" or \"no competitors\". Enterprise demand, effect size and novelty are unvalidated. HumanProof is not an identity-verification AI; the AI recommends, it does not authorize or make legal calls.",
  },
} as const;

export default function FutureVision({ lang }: { lang: Lang }) {
  const t = L[lang];
  return (
    <section className="fv">
      <h2 className="fv-title">{t.title}</h2>
      <p className="fv-lead">{t.lead}</p>
      <div className="fv-grid">
        <div className="fv-stage fv-now">
          <span className="fv-badge fv-badge-now">{t.nowBadge}</span>
          <h3>{t.nowTitle}</h3>
          <p>{t.nowBody}</p>
        </div>
        <div className="fv-stage">
          <span className="fv-badge fv-badge-future">{t.futureBadge}</span>
          <h3>{t.nextTitle}</h3>
          <ul>
            {t.nextItems.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
        <div className="fv-stage">
          <span className="fv-badge fv-badge-future">{t.futureBadge}</span>
          <h3>{t.futureTitle}</h3>
          <p>{t.futureBody}</p>
          <div className="fv-q">
            {t.q.map((x) => (
              <span key={x}>{x}</span>
            ))}
          </div>
        </div>
      </div>
      <ul className="fv-stage" style={{ marginTop: 16, listStyle: "none", paddingLeft: 0 }}>
        {t.concepts.map((c) => (
          <li key={c} style={{ marginBottom: 6 }}>{c}</li>
        ))}
      </ul>
      <p className="fv-note">{t.disclaimer}</p>
    </section>
  );
}
