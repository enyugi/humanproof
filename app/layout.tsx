import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import "./release.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://humanproof.onrender.com"),
  title: "IAMme / HumanProof — 必要なことだけ証明する",
  description:
    "IAMmeが目指すTrust Layerの最初のPoC。身分証をサービスへ渡さず、必要な属性だけを証明するHumanProofの実動デモ。",
  openGraph: {
    title: "IAMme / HumanProof",
    description: "身分証を渡さず、必要なことだけ証明する。",
    images: ["/brand/humanproof-poc-poster.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <header className="iam-nav">
          <Link className="iam-wordmark" href="/">
            <b>IAMme</b>
            <small>TRUST LAYER</small>
          </Link>
          <span>HumanProof / IAMme NOW 01 / AI HACK 2026</span>
          <nav aria-label="主要ナビゲーション"><Link href="/demo">Demo</Link><Link href="/studio">Policy Studio</Link></nav>
        </header>
        {children}
      </body>
    </html>
  );
}
