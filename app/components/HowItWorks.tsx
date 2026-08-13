// 「HumanProof の仕組み」図（ユーザー承認済みの concept 図を、レスポンシブ HTML/CSS+inline-SVG で再現）。
// 表示専用・自己完結（内部に ja/en ラベル）。モバイルでは縦積みし、文字は CSS 可変で可読を保つ。
import type { Lang } from "@/lib/i18n";

const L = {
  ja: {
    title: "HumanProof の仕組み",
    problem1: "サービスは本人情報を取りすぎる。しかも渡した先が、その情報を適切に管理してくれるかは分からない——それが不安。",
    problem2: "HumanProof は“あなたの代わりに”、目的に必要な証明だけを渡す。",
    you: "🙋 あなた", service: "🏢 サービス", ai: "🤖 HumanProof AI",
    step1: "① 🏢 サービスが求める（例：18歳以上のSNS）",
    fName: "氏名", fBirth: "生年月日", fAddr: "住所",
    docsLabel: "身分証の画像も要求：", license: "運転免許証", mynumber: "マイナンバーカード",
    overAsk: "4種の情報・書類を要求（過剰）",
    step2: "② 🤖 AI が最小化", shieldA: "目的に必要な", shieldB: "証明だけに絞る", shieldSub: "生データは渡さない",
    step3: "③ 🏢 サービスが受け取るのはこれだけ", proofA: "18歳以上", proofB: "実在する人間",
    keepTitle: "🔒 あなたに残る（渡さない）", keepItems: ["氏名", "住所", "生年月日", "運転免許証", "マイナンバー"],
    keepSub: "サービスには渡らない・漏洩の心配も減る",
    bannerTitle: "あなたのデータは、あなたのもの。",
    bannerBody: "氏名も住所も身分証も渡さず「18歳以上の実在の人」であることだけを証明。渡しすぎも、渡した先の管理リスクも最小限に。いつでも自分で失効できる。",
  },
  en: {
    title: "How HumanProof works",
    problem1: "Services collect too much personal data — and you can't be sure the service will look after it. That's the worry.",
    problem2: "HumanProof hands over, on your behalf, only the proof the purpose needs.",
    you: "🙋 You", service: "🏢 Service", ai: "🤖 HumanProof AI",
    step1: "① 🏢 A service asks (e.g. an 18+ social app)",
    fName: "Full name", fBirth: "Date of birth", fAddr: "Address",
    docsLabel: "…and photos of your ID:", license: "Driver's license", mynumber: "My Number card",
    overAsk: "4 kinds of data / documents (over-asking)",
    step2: "② 🤖 AI minimizes", shieldA: "Keep only the proof", shieldB: "the purpose needs", shieldSub: "raw data never sent",
    step3: "③ 🏢 The service receives only this", proofA: "Over 18", proofB: "A real person",
    keepTitle: "🔒 Stays with you (never shared)", keepItems: ["Full name", "Address", "Date of birth", "Driver's license", "My Number"],
    keepSub: "Never reaches the service — far less to leak",
    bannerTitle: "Your data stays yours.",
    bannerBody: "Without handing over your name, address or ID, you prove only that you're a real person over 18. Over-collection and the risk of mishandling are kept to a minimum — and you can revoke anytime.",
  },
} as const;

function IdCard({ label }: { label: string }) {
  return (
    <div className="hiw-doc">
      <svg viewBox="0 0 120 74" className="hiw-doc-svg" aria-hidden="true">
        <rect x="1" y="1" width="118" height="72" rx="7" fill="#f3f5fb" stroke="#c4ccdb" />
        <rect x="10" y="14" width="30" height="40" rx="4" fill="#dbe1ec" />
        <circle cx="25" cy="28" r="8" fill="#b8c1cf" />
        <rect x="16" y="38" width="18" height="12" rx="4" fill="#b8c1cf" />
        <rect x="48" y="16" width="60" height="6" rx="3" fill="#cfd6e0" />
        <rect x="48" y="30" width="60" height="6" rx="3" fill="#cfd6e0" />
        <rect x="48" y="44" width="42" height="6" rx="3" fill="#cfd6e0" />
      </svg>
      <span className="hiw-doc-label">{label}</span>
    </div>
  );
}

export default function HowItWorks({ lang }: { lang: Lang }) {
  const t = L[lang];
  return (
    <section className="hiw">
      <h2 className="hiw-title">{t.title}</h2>
      <p className="hiw-problem">{t.problem1}</p>
      <p className="hiw-problem hiw-problem-strong">{t.problem2}</p>

      <div className="hiw-legend">
        <span className="hiw-chip hiw-chip-you">{t.you}</span>
        <span className="hiw-chip">{t.service}</span>
        <span className="hiw-chip hiw-chip-ai">{t.ai}</span>
      </div>

      <div className="hiw-flow">
        {/* STEP 1 */}
        <div className="hiw-col">
          <p className="hiw-step">{t.step1}</p>
          <div className="hiw-card">
            <div className="hiw-field"><span>{t.fName}</span><i /></div>
            <div className="hiw-field"><span>{t.fBirth}</span><i /></div>
            <div className="hiw-field"><span>{t.fAddr}</span><i /></div>
            <p className="hiw-docs-label">{t.docsLabel}</p>
            <div className="hiw-docs">
              <IdCard label={t.license} />
              <IdCard label={t.mynumber} />
            </div>
            <p className="hiw-overask">{t.overAsk}</p>
          </div>
        </div>

        <div className="hiw-arrow" aria-hidden="true">→</div>

        {/* STEP 2 */}
        <div className="hiw-col hiw-col-narrow">
          <p className="hiw-step">{t.step2}</p>
          <div className="hiw-card hiw-card-ai">
            <svg viewBox="0 0 96 108" className="hiw-shield" aria-hidden="true">
              <path d="M48 6 L90 21 V58 C90 90 70 104 48 114 C26 104 6 90 6 58 V21 Z" fill="#0e9b6b" />
              <path d="M30 60 l12 13 l24 -28" fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="hiw-shield-a">{t.shieldA}<br />{t.shieldB}</p>
            <p className="hiw-shield-sub">{t.shieldSub}</p>
          </div>
        </div>

        <div className="hiw-arrow hiw-arrow-green" aria-hidden="true">→</div>

        {/* STEP 3 */}
        <div className="hiw-col">
          <p className="hiw-step">{t.step3}</p>
          <div className="hiw-card hiw-card-proof">
            <div className="hiw-proof"><span className="hiw-tick">✓</span>{t.proofA}</div>
            <div className="hiw-proof"><span className="hiw-tick">✓</span>{t.proofB}</div>
          </div>
          <p className="hiw-step hiw-keep-title">{t.keepTitle}</p>
          <div className="hiw-card hiw-card-keep">
            <div className="hiw-keep-items">
              {t.keepItems.map((k) => (
                <span key={k} className="hiw-strike">{k}</span>
              ))}
            </div>
            <p className="hiw-keep-sub">{t.keepSub}</p>
          </div>
        </div>
      </div>

      <div className="hiw-banner">
        <span className="hiw-banner-emoji" aria-hidden="true">🙋</span>
        <div>
          <p className="hiw-banner-title">{t.bannerTitle}</p>
          <p className="hiw-banner-body">{t.bannerBody}</p>
        </div>
      </div>
    </section>
  );
}
