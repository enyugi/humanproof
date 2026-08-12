import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HumanProof — 本人情報の要求を必要最小限の証明に",
  description:
    "AI HACK 2026 MVP。サービスの目的と要求する個人情報を比較し、必要最小限の証明を提案する Trust Layer。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
