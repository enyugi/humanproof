export type ProductIconName = "account" | "issuer" | "store" | "share" | "valid" | "revoke" | "ai";

export default function ProductIcon({ name, size = 64 }: { name: ProductIconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 64 64",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true,
  } as const;

  if (name === "account") return (
    <svg {...common}>
      <circle cx="25" cy="20" r="9" fill="var(--icon-fill)" stroke="currentColor" strokeWidth="2.5" />
      <path d="M10 50c1.6-10 7-15 15-15s13.4 5 15 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M43 17l9 3v9c0 7-4.2 12-9 14-4.8-2-9-7-9-14v-9l9-3Z" fill="var(--icon-soft)" stroke="currentColor" strokeWidth="2.5" />
      <path d="m39 29 3 3 6-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  if (name === "issuer") return (
    <svg {...common}>
      <path d="M10 23 32 11l22 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 26h34v24H15z" fill="var(--icon-soft)" stroke="currentColor" strokeWidth="2.5" />
      <path d="M22 32v12M32 32v12M42 32v12M10 51h44" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="48" cy="18" r="8" fill="var(--icon-fill)" stroke="currentColor" strokeWidth="2" />
      <path d="m44.5 18 2.2 2.2 4.3-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  if (name === "store") return (
    <svg {...common}>
      <path d="M11 26h42l-4-12H15l-4 12Z" fill="var(--icon-fill)" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M14 26v25h36V26M23 51V37h18v14" fill="var(--icon-soft)" stroke="currentColor" strokeWidth="2.5" />
      <path d="M11 26c0 4 3 7 7 7s7-3 7-7c0 4 3 7 7 7s7-3 7-7c0 4 3 7 7 7s7-3 7-7" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );

  if (name === "share") return (
    <svg {...common}>
      <rect x="7" y="15" width="23" height="34" rx="5" fill="var(--icon-soft)" stroke="currentColor" strokeWidth="2.5" />
      <path d="M13 25h11M13 32h8M13 39h11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M32 31h18m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="42" y="40" width="15" height="12" rx="3" fill="var(--icon-fill)" stroke="currentColor" strokeWidth="2.5" />
      <path d="m46 46 2.2 2.2 4.3-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  if (name === "valid") return (
    <svg {...common}>
      <path d="M32 8 48 14v15c0 12-7.8 21-16 26-8.2-5-16-14-16-26V14l16-6Z" fill="var(--icon-soft)" stroke="currentColor" strokeWidth="2.7" />
      <path d="m23 31 6 6 13-15" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  if (name === "revoke") return (
    <svg {...common}>
      <path d="M32 8 48 14v15c0 12-7.8 21-16 26-8.2-5-16-14-16-26V14l16-6Z" fill="var(--icon-soft)" stroke="currentColor" strokeWidth="2.7" />
      <path d="m23 23 18 18M41 23 23 41" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );

  return (
    <svg {...common}>
      <path d="M18 20c0-7 5.8-12 14-12s14 5 14 12c0 4-2 7-5 9 3 2 5 5 5 9 0 7-5.8 12-14 12s-14-5-14-12c0-4 2-7 5-9-3-2-5-5-5-9Z" fill="var(--icon-soft)" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="27" cy="21" r="3" fill="var(--icon-fill)" stroke="currentColor" strokeWidth="2" />
      <circle cx="38" cy="29" r="3" fill="var(--icon-fill)" stroke="currentColor" strokeWidth="2" />
      <circle cx="27" cy="39" r="3" fill="var(--icon-fill)" stroke="currentColor" strokeWidth="2" />
      <path d="m29 23 6 4m0 5-6 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M50 17h7M53.5 13.5v7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
