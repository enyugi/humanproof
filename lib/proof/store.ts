// Persistent state for the proof system: issuer seed, revocation set, revocation authority, and
// one-time quote consumption. Backed by a local gitignored JSON file.
//
// FAIL-CLOSED: in persist mode, if the state cannot be read/written, is corrupt, oversized, or has
// an unexpected shape, the store is "unavailable" and callers must NOT proceed as if state were an
// empty, trustworthy baseline. Writes are atomic (temp file + fsync + rename) with 0600 perms so a
// crash mid-write cannot leave a half-written file that later reads as "empty".
//
// PROOF_PERSIST=off selects an explicit ephemeral in-memory mode (tests) — that is a deliberate
// non-persistent choice, distinct from a persist-mode failure.

import fs from "node:fs";
import { randomBytes } from "node:crypto";
import { z } from "zod";

const PERSIST = (process.env.PROOF_PERSIST ?? "on") !== "off";
const DIR = process.env.PROOF_STATE_DIR?.trim() || ".humanproof";
const FILE = `${DIR}/state.json`;
const MAX_FILE_BYTES = 1_000_000;
const MAX_ENTRIES = 10_000;

const StateSchema = z
  .object({
    v: z.literal(1),
    seedHex: z.union([z.string().regex(/^[0-9a-f]{64}$/i), z.literal("")]),
    revoked: z.record(z.string(), z.number()),
    revAuth: z.record(z.string(), z.object({ jti: z.string(), exp: z.number() }).strict()),
    usedQuotes: z.record(z.string(), z.number()),
  })
  .strict();
type State = z.infer<typeof StateSchema>;

// Legacy on-disk shape written by earlier code: no `v`, no `usedQuotes`, often mode 0644.
// `.strict()` makes it disjoint from the current shape so detection is unambiguous.
const LegacySchema = z
  .object({
    seedHex: z.union([z.string().regex(/^[0-9a-f]{64}$/i), z.literal("")]),
    revoked: z.record(z.string(), z.number()),
    revAuth: z.record(z.string(), z.object({ jti: z.string(), exp: z.number() }).strict()),
  })
  .strict();

function fresh(): State {
  return { v: 1, seedHex: "", revoked: {}, revAuth: {}, usedQuotes: {} };
}

function ensurePerms(): void {
  try {
    if ((fs.statSync(FILE).mode & 0o777) !== 0o600) fs.chmodSync(FILE, 0o600);
  } catch {
    /* best-effort */
  }
}

let mem: State = fresh();
let health: "ok" | "unavailable" = "ok";
let loaded = false;

export class InvalidSeedError extends Error {}
export class StateUnavailableError extends Error {}

function atomicWrite(): boolean {
  try {
    fs.mkdirSync(DIR, { recursive: true, mode: 0o700 });
    const tmp = `${FILE}.${process.pid}.${randomBytes(4).toString("hex")}.tmp`;
    const fd = fs.openSync(tmp, "w", 0o600);
    try {
      fs.writeFileSync(fd, JSON.stringify(mem));
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }
    fs.renameSync(tmp, FILE); // atomic replace
    try {
      fs.chmodSync(FILE, 0o600);
    } catch {
      /* best-effort perms */
    }
    return true;
  } catch {
    return false;
  }
}

function ensureLoaded(): void {
  if (loaded) return;
  loaded = true;
  if (!PERSIST) {
    health = "ok";
    return;
  }
  try {
    if (fs.existsSync(FILE)) {
      const st = fs.statSync(FILE);
      if (st.size > MAX_FILE_BYTES) {
        health = "unavailable"; // refuse to parse an oversized/untrusted file
        return;
      }
      const obj: unknown = JSON.parse(fs.readFileSync(FILE, "utf8"));

      const current = StateSchema.safeParse(obj);
      if (current.success) {
        mem = current.data;
        ensurePerms(); // upgrade a current-format-but-0644 file to 0600
        health = "ok";
        return;
      }

      // Safe migration of a valid legacy file: preserve seed + revocations + revocation authority.
      const legacy = LegacySchema.safeParse(obj);
      if (legacy.success) {
        mem = { v: 1, seedHex: legacy.data.seedHex, revoked: legacy.data.revoked, revAuth: legacy.data.revAuth, usedQuotes: {} };
        // Atomic write (temp + fsync + rename, 0600). On failure the original legacy file is left
        // intact and we fail closed — never fake success, never delete the old state.
        health = atomicWrite() ? "ok" : "unavailable";
        return;
      }

      health = "unavailable"; // corrupt / unknown shape -> NOT treated as empty-normal
    } else {
      // fresh install: we must be able to create the file to be trustworthy
      health = atomicWrite() ? "ok" : "unavailable";
    }
  } catch {
    health = "unavailable";
  }
}

export function storeHealthy(): boolean {
  ensureLoaded();
  return health === "ok";
}
export function isPersistent(): boolean {
  return PERSIST;
}

function commit(): boolean {
  if (!PERSIST) return true; // ephemeral success
  if (health !== "ok") return false; // fail-closed
  if (atomicWrite()) return true;
  health = "unavailable";
  return false;
}

function prune(nowSec: number): void {
  for (const [k, e] of Object.entries(mem.revoked)) if (e <= nowSec) delete mem.revoked[k];
  for (const [k, v] of Object.entries(mem.revAuth)) if (v.exp <= nowSec) delete mem.revAuth[k];
  for (const [k, e] of Object.entries(mem.usedQuotes)) if (e <= nowSec) delete mem.usedQuotes[k];
}

// --- issuer seed ---------------------------------------------------------
export function getSeed(): { hex: string; source: "env" | "persisted" | "ephemeral" } {
  const env = process.env.PROOF_ISSUER_SEED;
  if (env !== undefined && env.trim() !== "") {
    if (/^[0-9a-fA-F]{64}$/.test(env.trim())) return { hex: env.trim().toLowerCase(), source: "env" };
    throw new InvalidSeedError("PROOF_ISSUER_SEED must be exactly 64 hex characters"); // no silent fallback
  }
  if (!PERSIST) return { hex: randomBytes(32).toString("hex"), source: "ephemeral" };
  ensureLoaded();
  if (health !== "ok") {
    throw new StateUnavailableError("Proof state store is unavailable; refusing to run without persistable keys");
  }
  if (mem.seedHex && /^[0-9a-f]{64}$/.test(mem.seedHex)) return { hex: mem.seedHex, source: "persisted" };
  mem.seedHex = randomBytes(32).toString("hex");
  if (!commit()) throw new StateUnavailableError("Failed to persist a newly generated issuer seed");
  return { hex: mem.seedHex, source: "persisted" };
}

// --- revocation set ------------------------------------------------------
export function addRevoked(jti: string, exp: number, nowMs = Date.now()): boolean {
  if (PERSIST) {
    ensureLoaded();
    if (health !== "ok") return false;
  }
  const nowSec = Math.floor(nowMs / 1000);
  prune(nowSec);
  if (exp <= nowSec) return true;
  if (!(jti in mem.revoked) && Object.keys(mem.revoked).length >= MAX_ENTRIES) return false;
  mem.revoked[jti] = exp;
  return commit();
}

export type RevocationStatus = "revoked" | "not-revoked" | "unknown";
export function revocationStatus(jti: string, nowMs = Date.now()): RevocationStatus {
  if (PERSIST) {
    ensureLoaded();
    if (health !== "ok") return "unknown"; // cannot confirm -> caller must fail closed
  }
  prune(Math.floor(nowMs / 1000));
  return jti in mem.revoked ? "revoked" : "not-revoked";
}

// --- revocation authority (codeHash -> jti/exp) --------------------------
export function putRevAuth(codeHash: string, jti: string, exp: number, nowMs = Date.now()): boolean {
  if (PERSIST) {
    ensureLoaded();
    if (health !== "ok") return false;
  }
  prune(Math.floor(nowMs / 1000));
  if (!(codeHash in mem.revAuth) && Object.keys(mem.revAuth).length >= MAX_ENTRIES) return false;
  mem.revAuth[codeHash] = { jti, exp };
  return commit();
}

export function lookupRevAuth(codeHash: string, nowMs = Date.now()): { jti: string; exp: number } | null {
  if (PERSIST) {
    ensureLoaded();
    if (health !== "ok") return null;
  }
  prune(Math.floor(nowMs / 1000));
  return mem.revAuth[codeHash] ?? null;
}

// --- one-time quote consumption -----------------------------------------
export type QuoteConsumeResult = "consumed" | "already-used" | "unavailable";
export function consumeQuote(jti: string, exp: number, nowMs = Date.now()): QuoteConsumeResult {
  if (PERSIST) {
    ensureLoaded();
    if (health !== "ok") return "unavailable";
  }
  prune(Math.floor(nowMs / 1000));
  if (jti in mem.usedQuotes) return "already-used";
  if (Object.keys(mem.usedQuotes).length >= MAX_ENTRIES) return "unavailable";
  mem.usedQuotes[jti] = exp;
  return commit() ? "consumed" : "unavailable";
}

// --- test helpers --------------------------------------------------------
export function reloadFromDisk(): void {
  loaded = false;
  mem = fresh();
  health = "ok";
  ensureLoaded();
}
export function _reset(): void {
  mem = fresh();
  health = "ok";
  loaded = !PERSIST ? true : false;
  if (PERSIST) {
    try {
      fs.rmSync(FILE, { force: true });
    } catch {
      /* ignore */
    }
  }
}
