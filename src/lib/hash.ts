// Aurora Hash — deterministic SHA-256 fingerprint for movement registration
// Seed: capital|absorption|reversibility|pressureDay|protocolVersion
// Same inputs → same hash. Always.

export const PROTOCOL_VERSION = "aurora-v1";

export interface HashSeed {
  capital:         number;
  absorption:      string;
  reversibility:   string;
  pressureDay:     number;
  protocolVersion?: string;
}

/**
 * Compute a deterministic SHA-256 hex digest for a movement.
 * Works in browser (crypto.subtle) and Node.js 18+ (globalThis.crypto.subtle).
 * Returns full 64-char hex string.
 */
export async function computeMovementHash(seed: HashSeed): Promise<string> {
  const version = seed.protocolVersion ?? PROTOCOL_VERSION;
  const raw     = `${seed.capital}|${seed.absorption}|${seed.reversibility}|${seed.pressureDay}|${version}`;
  const encoded = new TextEncoder().encode(raw);
  const buf     = await globalThis.crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Derive a human-readable movement ID from the full hash.
 * Format: AUR-2026-XXXXX (5-digit zero-padded number)
 */
export function movementId(fullHashHex: string): string {
  const n = parseInt(fullHashHex.slice(0, 8), 16) % 99_999;
  return `AUR-2026-${n.toString().padStart(5, "0")}`;
}
