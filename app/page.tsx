import Image from "next/image";
import Link from "next/link";
import ProductIcon from "./components/ProductIcon";

const withheld = ["氏名", "正確な生年月日", "住所", "身分証画像"];

export default function HomePage() {
  return (
    <main className="iam-page">
      <section className="iam-hero iam-shell">
        <div className="iam-poster">
          <Image
            src="/brand/humanproof-poc-poster.png"
            alt="HumanProof。身分証を渡さず、必要なことだけ証明する。"
            width={792}
            height={402}
            priority
          />
          <span className="iam-caption">IAMme / NOW 01</span>
        </div>
        <div className="iam-hero-copy">
          <div className="iam-product-lockup" aria-label="サービス名 IAMme">
            <span>IAMme</span>
            <small>IDENTITY TRUST LAYER</small>
          </div>
          <p className="iam-kicker">HUMANPROOF — IAMme NOW 01</p>
          <h1><span>身分証を渡さず、</span><span>必要なことだけ</span><span>証明する。</span></h1>
          <p className="iam-lead">
            <strong>IAMmeは、全体構想のサービス名です。</strong>
            本人情報そのものではなく、目的に必要な証明だけを相手へ渡せるネットを目指します。
            HumanProofは、その最初の動くプロダクトです。
          </p>
          <Link className="iam-button" href="/demo">デモを試す <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      <section className="iam-section iam-shell" aria-labelledby="mechanism-title">
        <div className="iam-section-head">
          <p className="iam-index">01 / MECHANISM</p>
          <h2 id="mechanism-title"><span>サービスへ渡すものを、</span><span>証明まで絞る。</span></h2>
          <p>サービスが受け取るのは、氏名や身分証ではありません。必要な2つの事実だけです。</p>
        </div>
        <div className="iam-mechanism" role="img" aria-label="4つの本人情報要求をHumanProofが2つの証明に絞る仕組み">
          <div className="iam-mech-panel iam-requested">
            <span className="iam-label">サービスの現在要求</span>
            <ul>{withheld.map((item) => <li key={item}><span>{item}</span><i aria-hidden="true" /></li>)}</ul>
            <strong>4 DATA</strong>
          </div>
          <div className="iam-engine">
            <span>HUMANPROOF</span>
            <b>目的に必要な<br />証明だけに絞る</b>
            <small>本人情報の実値をAIへ送らない</small>
          </div>
          <div className="iam-mech-out">
          <span className="iam-label">例：18歳以上向けECが受け取る</span>
            <div className="iam-stamp">18歳以上</div>
            <div className="iam-stamp">実在する人</div>
            <strong>2 PROOFS</strong>
          </div>
        </div>
        <div className="iam-kept">
          <span>本人情報はNIGHT SCREENへ渡さない</span>
          <p>{withheld.join(" ／ ")}</p>
        </div>
      </section>

      <section className="iam-section iam-shell iam-ai" aria-labelledby="ai-title">
        <p className="iam-index">02 / THE ROLE OF AI</p>
        <h2 id="ai-title"><span>AIが読むのは、</span><span>本人ではなく、</span><span>サービスの要件。</span></h2>
        <div className="iam-ai-copy">
          <p>定型の18歳確認ひとつなら、ルールで足ります。</p>
          <p>AIを使うのは導入時です。複数の目的や曖昧な規約文を読み、許可済みClaim Catalogに制約されたPolicy案へ変換します。購入時は保存済みPolicyを使います。</p>
          <Link href="/studio">AI Policy Studioを見る →</Link>
        </div>
      </section>

      <section className="iam-boundary iam-shell" aria-labelledby="boundary-title">
        <div className="iam-section-title"><p className="iam-index">03 / BOUNDARY</p><h2 id="boundary-title"><span>動くところと、</span><span>まだ構想のところ。</span></h2></div>
        <ol className="iam-boundary-list">
          <li><ProductIcon name="valid" size={54} /><div><span className="iam-status implemented">実装済み</span><b>Proofのライフサイクル</b><p>Policy分析、明示同意、署名、宛先・期限・失効の検証</p></div></li>
          <li><ProductIcon name="issuer" size={54} /><div><span className="iam-status simulated">模擬</span><b>属性の元確認と利用サービス</b><p>NIGHT SCREENとDemo Trusted Issuer。デモ内で操作できます。</p></div></li>
          <li><ProductIcon name="ai" size={54} /><div><span className="iam-status future">構想・未実装</span><b>本番接続と将来機能</b><p><span className="iam-nowrap">実eKYC</span>、複数Issuer、同意の永続管理、<span className="iam-nowrap">AI Agent Trust</span></p></div></li>
        </ol>
      </section>

      <section className="iam-future iam-shell" aria-labelledby="future-title">
        <div className="iam-section-title"><p className="iam-index">04 / IAMme</p><h2 id="future-title"><span>証明の行き先は、</span><span>人からAIへ。</span></h2></div>
        <ol>
          <li><ProductIcon name="account" size={58} /><span>NOW</span><b>HumanProof</b><p>本人情報の要求を、必要最小限の証明へ。</p></li>
          <li><ProductIcon name="issuer" size={58} /><span>NEXT / 構想</span><b>Trusted Issuer ecosystem</b><p>複数Issuerと<span className="iam-nowrap">実eKYC</span>へ接続する。</p></li>
          <li><ProductIcon name="ai" size={58} /><span>FUTURE / 構想</span><b>Human + AI Agent Trust</b><p>誰が許可し、どの権限を、誰のために、いつまで持つかを証明する。</p></li>
        </ol>
      </section>

      <section className="iam-final iam-shell">
        <p>LIVE PROOF-OF-CONCEPT</p>
        <h2>説明を読むより、<br />90秒で確かめる。</h2>
        <Link className="iam-button" href="/demo">HumanProof PoCを試す →</Link>
      </section>
    </main>
  );
}
