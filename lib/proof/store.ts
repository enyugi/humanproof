// Persistent state for the proof system: the issuer seed, the revocation set, and revocation
// authority records. Backed by a local gitignored JSON file so that (a) the signing key is a
// per-install random secret NOT present in source (Problem 1) and (b) revocation survives a
// restart (Problem 4). This is a local single-process demo store, not a durable/replicated DB.

import fs from "node:fs";
import { randomBytes } from "node:crypto";

const PERSIST = (process.env.PROOF_PERSIST ?? "on") !== "off";
const DIR = process.env.PROOF_STATE_DIR?.trim() || ".humanproof";
const FILE = `${DIR}/state.json`;
const MAX_ENTRIES = 10_000;

interface State {
  seedHex: string;
  revoked: Record<string, number>; // jti -> exp (unix seconds)
  revAuth: Record<string, { jti: string; exp: number }>; // sha256(revocationCode) -> jti/exp
}

let cache: State | null = null;
let persistentOk = PERSIST;

function fresh(): State {
  return { seedHex: "", revoked: {}, revAuth: {} };
}

function load(): State {
  if (cache) return cache;
  if (PERSIST) {
    try {
      if (fs.existsSync(FILE)) cache = JSON.parse(fs.readFileSync(FILE, "utf8")) as State;
    } catch {
      /* corrupt/unreadable -> start fresh */
    }
  }
  if (!cache) cache = fresh();
  cache.revoked ??= {};
  cache.revAuth ??= {};
  cache.seedHex ??= "";
  return cache;
}

function save(): void {
  if (!PERSIST) return;
  try {
    fs.mkdirSync(DIR, { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(load()));
    persistentOk = true;
  } catch {
    persistentOk = false;
  }
}

export function isPersistent(): boolean {
  return PERSIST && persistentOk;
}

// --- issuer seed ---------------------------------------------------------
export function getOrCreateSeedHex(): { hex: string; source: "env" | "persisted" | "ephemeral" } {
  const env = process.env.PROOF_ISSUER_SEED?.trim();
  if (env && /^[0-9a-fA-F]{64}$/.test(env)) return { hex: env, source: "env" };
  const s = load();
  if (s.seedHex && /^[0-9a-fA-F]{64}$/.test(s.seedHex)) return { hex: s.seedHex, source: "persisted" };
  const hex = randomBytes(32).toString("hex"); // per-install random secret, never from source
  s.seedHex = hex;
  save();
  return { hex, source: isPersistent() ? "persisted" : "ephemeral" };
}

// --- pruning -------------------------------------------------------------
function prune(nowSec: number): void {
  const s = load();
  let changed = false;
  for (const [k, exp] of Object.entries(s.revoked)) if (exp <= nowSec) (delete s.revoked[k], (changed = true));
  for (const [k, v] of Object.entries(s.revAuth)) if (v.exp <= nowSec) (delete s.revAuth[k], (changed = true));
  if (changed) save();
}

// --- revocation set ------------------------------------------------------
export function addRevoked(jti: string, exp: number, nowMs = Date.now()): boolean {
  const nowSec = Math.floor(nowMs / 1000);
  prune(nowSec);
  if (exp <= nowSec) return true; // already expired -> no need to store
  const s = load();
  if (!(jti in s.revoked) && Object.keys(s.revoked).length >= MAX_ENTRIES) return false;
  s.revoked[jti] = exp;
  save();
  return true;
}

export function isRevoked(jti: string, nowMs = Date.now()): boolean {
  prune(Math.floor(nowMs / 1000));
  return jti in load().revoked;
}

// --- revocation authority (only the holder of the code can revoke) -------
export function putRevAuth(codeHash: string, jti: string, exp: number, nowMs = Date.now()): boolean {
  prune(Math.floor(nowMs / 1000));
  const s = load();
  if (!(codeHash in s.revAuth) && Object.keys(s.revAuth).length >= MAX_ENTRIES) return false;
  s.revAuth[codeHash] = { jti, exp };
  save();
  return true;
}

export function lookupRevAuth(codeHash: string, nowMs = Date.now()): { jti: string; exp: number } | null {
  prune(Math.floor(nowMs / 1000));
  return load().revAuth[codeHash] ?? null;
}

// --- test helpers --------------------------------------------------------
export function reloadFromDisk(): void {
  cache = null;
  load();
}
export function _reset(): void {
  cache = fresh();
  if (PERSIST) {
    try {
      fs.rmSync(FILE, { force: true });
    } catch {
      /* ignore */
    }
  }
}
export function _revokedSize(): number {
  return Object.keys(load().revoked).length;
}
