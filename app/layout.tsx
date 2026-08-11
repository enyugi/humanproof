import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HumanProof — Turn identity requests into minimum proof",
  description: "AI HACK 2026 MVP. Compare a service's stated purpose with the personal data it requests.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
