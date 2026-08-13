"use client";

import Link from "next/link";
import { useState } from "react";
import ProductIcon, { type ProductIconName } from "../components/ProductIcon";

type Phase = "account" | "identity" | "signup" | "consent" | "processing" | "complete" | "revoked";
type Proof = { issuer: string; subject: string; audience: string; claims: string[]; expires_at: number; jti: string };
type Verify = { status: string; checks: Record<string, boolean> };

const audience = "nightscreen-purchase";
const claims = ["over_18", "human_verified"];
const withheld = ["氏名", "正確な生年月日", "住所", "身分証画像"];
const journey: { label: string; icon: ProductIconName }[] = [
  { label: "アカウント", icon: "account" },
  { label: "本人確認", icon: "issuer" },
  { label: "ECで選ぶ", icon: "store" },
  { label: "2つ共有", icon: "share" },
  { label: "結果", icon: "valid" },
];

async function post(path: string, body: unknown) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : `${path} failed`);
  return data;
}

export default function GuidedDemoPage() {
  const [phase, setPhase] = useState<Phase>("account");
  const [error, setError] = useState<string | null>(null);
  const [proof, setProof] = useState<Proof | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [revocationCode, setRevocationCode] = useState<string | null>(null);
  const [verify, setVerify] = useState<Verify | null>(null);

  async function issueAndVerify() {
    setError(null);
    setPhase("processing");
    try {
      const quote = await post("/api/proof/quote", { audience, claims });
      const issued = await post("/api/proof/issue", { quote: quote.quote, consent: true });
      const checked = await post("/api/proof/verify", { token: issued.token, expectedAudience: audience });
      if (checked.status !== "VALID") throw new Error(`証明を確認できませんでした（${checked.status ?? "UNKNOWN"}）`);
      setProof(issued.proof as Proof);
      setToken(issued.token as string);
      setRevocationCode(issued.revocationCode as string);
      setVerify(checked as Verify);
      setPhase("complete");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "処理に失敗しました";
      setError(`${message} 少し待ってもう一度共有するか、ページを再読み込みしてください。`);
      setPhase("consent");
    }
  }

  async function revoke() {
    if (!token || !revocationCode) return;
    setError(null);
    try {
      await post("/api/proof/revoke", { revocationCode });
      const checked = await post("/api/proof/verify", { token, expectedAudience: audience });
      if (checked.status !== "REVOKED") throw new Error(`失効を確認できませんでした（${checked.status ?? "UNKNOWN"}）`);
      setVerify(checked as Verify);
      setPhase("revoked");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "失効処理に失敗しました";
      setError(`${message} 少し待ってもう一度試すか、ページを再読み込みしてください。`);
    }
  }

  const journeyStep = phase === "account" ? 1 : phase === "identity" ? 2 : phase === "signup" ? 3 : phase === "consent" || phase === "processing" ? 4 : 5;

  return (
    <main className="ns-page">
      <header className="ns-hero iam-shell">
        <div>
          <p className="iam-kicker">HUMANPROOF / GUIDED DEMO</p>
          <h1><span>IAMmeで確認して、</span><span>ECでは証明だけ使う。</span></h1>
        </div>
        <p><strong>例：18歳以上向け映像作品を扱う架空のECサイト。</strong> IAMmeのデモアカウント作成から、購入、Proofの失効までを約90秒で試します。</p>
      </header>

      <ol className="ns-journey" aria-label={`デモのステップ ${journeyStep}/5`}>
        {journey.map((item, index) => {
          const number = index + 1;
          const active = number === journeyStep;
          const completed = number < journeyStep;
          return (
            <li key={item.label} className={active ? "active" : completed ? "completed" : ""} aria-current={active ? "step" : undefined}>
              <span className="ns-journey-icon"><ProductIcon name={item.icon} size={30} /></span>
              <span><small>{completed ? "完了" : active ? "いまここ" : `STEP ${number}`}</small><b>{item.label}</b></span>
            </li>
          );
        })}
      </ol>

      <div className="ns-demo-shell iam-shell" aria-live="polite">
        {phase !== "account" && phase !== "identity" && (
          <div className="ns-proof-passport">
            <ProductIcon name="account" size={40} />
            <span><small>IAMme / 確認済みProof</small><b>18歳以上 ・ 実在する人</b></span>
            <em>DEMO</em>
          </div>
        )}

        {phase === "account" && (
          <section className="ns-scene">
            <div className="ns-scene-art account"><ProductIcon name="account" size={132} /><span>IAMme</span></div>
            <div className="ns-scene-copy">
              <p className="ns-step-label">STEP 1 / IAMme</p>
              <h2>まず、デモアカウントを作ります。</h2>
              <p>ここから実際に操作します。氏名や身分証は入力しません。PoC用の空のIAMmeアカウントを用意し、次の画面で本人確認を行います。</p>
              <button className="ns-primary" onClick={() => setPhase("identity")}>デモアカウントを作る <span>→</span></button>
              <small className="ns-footnote">デモ用の一時アカウントです。画面を閉じると消えます。</small>
            </div>
          </section>
        )}

        {phase === "identity" && (
          <section className="ns-scene">
            <div className="ns-scene-art issuer"><ProductIcon name="issuer" size={132} /><span>DEMO ISSUER</span></div>
            <div className="ns-scene-copy">
              <p className="ns-step-label">STEP 2 / 本人確認</p>
              <h2>IAMmeで、本人確認を行います。</h2>
              <p>Demo Trusted Issuerが、次の2つを確認した想定でProofをIAMmeへ追加します。</p>
              <ul className="ns-facts"><li>18歳以上である</li><li>実在する人である</li></ul>
              <div className="ns-simulation-note"><b>この元確認は模擬です</b><span>実eKYC・公的IDとの接続は未実装。後段の署名・検証・失効は実APIで動きます。</span></div>
              <button className="ns-primary" onClick={() => setPhase("signup")}>本人確認を完了する（模擬） <span>→</span></button>
            </div>
          </section>
        )}

        {phase === "signup" && (
          <section className="ns-scene ns-service-scene">
            <div className="ns-scene-art store"><ProductIcon name="store" size={132} /><span>NIGHT SCREEN</span></div>
            <div className="ns-scene-copy">
              <p className="ns-step-label">STEP 3 / 架空のECサイト</p>
              <h2>購入前に、年齢確認が必要です。</h2>
              <p>NIGHT SCREENは18歳以上向け作品を扱う架空のECサイトです。確認方法を選びます。</p>
              <div className="ns-choices">
                <article className="ns-choice preferred">
                  <ProductIcon name="share" size={46} />
                  <span><small>おすすめ</small><b>IAMmeで証明する</b><em>2つのProofだけ共有</em></span>
                  <button onClick={() => setPhase("consent")}>この方法を選ぶ</button>
                </article>
                <article className="ns-choice conventional">
                  <ProductIcon name="issuer" size={46} />
                  <span><small>従来の確認例</small><b>身分証をアップロード</b><em>氏名・生年月日・住所・画像</em></span>
                  <i>比較表示のみ</i>
                </article>
              </div>
              <div className="ns-ai-line"><ProductIcon name="ai" size={38} /><p><b>AIは導入時に働きます。</b> NIGHT SCREENの要件を「4つの本人情報」から「2つのProof」へ整理した保存済みPolicyを、この購入で使います。</p><Link href="/studio">分析を見る</Link></div>
            </div>
          </section>
        )}

        {(phase === "consent" || phase === "processing") && (
          <section className="ns-scene">
            <div className="ns-scene-art share"><ProductIcon name="share" size={132} /><span>SHARE REVIEW</span></div>
            <div className="ns-scene-copy">
              <p className="ns-step-label">STEP 4 / 共有内容の確認</p>
              <h2>NIGHT SCREENへ渡すのは、この2つだけ。</h2>
              <div className="ns-share-lines">
                <div><small>共有する</small><strong>18歳以上である</strong><strong>実在する人である</strong></div>
                <div><small>共有しない</small>{withheld.map((item) => <s key={item}>{item}</s>)}</div>
              </div>
              <p className="ns-policy-note"><ProductIcon name="ai" size={30} /><span><b>AI設計済みPolicy：</b> <code>over_18 + human_verified</code><br />購入時に本人情報をLLMへ送りません。</span></p>
              {error && <p className="ns-error" role="alert">{error}</p>}
              <button className="ns-primary" onClick={issueAndVerify} disabled={phase === "processing"}>
                {phase === "processing" ? "署名・発行・検証中…" : "この2つだけ共有する"}
              </button>
              <button className="ns-back" onClick={() => setPhase("signup")} disabled={phase === "processing"}>戻る</button>
            </div>
          </section>
        )}

        {phase === "complete" && proof && verify && (
          <section className="ns-scene">
            <div className="ns-scene-art valid"><ProductIcon name="valid" size={132} /><span>VALID</span></div>
            <div className="ns-scene-copy">
              <p className="ns-step-label">STEP 5 / 実APIの結果</p>
              <h2>購入できました。</h2>
              <p>身分証画像をNIGHT SCREENへ提出せず、購入した作品を視聴できます。</p>
              <div className="ns-verdict"><span>検証結果</span><strong>{verify.status}</strong><small>実API</small></div>
              <dl className="ns-result-grid"><div><dt>共有</dt><dd>2 Proof</dd></div><div><dt>渡さなかったもの</dt><dd>4項目</dd></div><div><dt>有効期限</dt><dd>{new Date(proof.expires_at * 1000).toLocaleTimeString("ja-JP")}</dd></div></dl>
              <p className="ns-caveat">Proofも個人に関する属性です。匿名化や「個人情報ゼロ」を意味しません。</p>
              <div className="ns-result-actions"><Link href="/studio"><ProductIcon name="ai" size={32} /> AIによるPolicy設計を見る</Link><button onClick={revoke}><ProductIcon name="revoke" size={32} /> このProofを失効する</button></div>
              {error && <p className="ns-error" role="alert">{error}</p>}
            </div>
          </section>
        )}

        {phase === "revoked" && verify && (
          <section className="ns-scene">
            <div className="ns-scene-art revoked"><ProductIcon name="revoke" size={132} /><span>REVOKED</span></div>
            <div className="ns-scene-copy">
              <p className="ns-step-label">RESULT / 再検証</p>
              <h2>このProofは、もう使えません。</h2>
              <div className="ns-verdict revoked"><span>再検証結果</span><strong>{verify.status}</strong><small>実API</small></div>
              <p>同じProofをもう一度検証すると、失効済みと判定されました。利用を続けるには年齢確認をやり直します。</p>
              <button className="ns-primary" onClick={() => window.location.reload()}>最初から試す <span>↻</span></button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
