/**
 * Control interno. No mostrar. No exponer.
 * Hash simple: contexto + escenario + señales + timestamp.
 */

const KEY = "aurora_demo_fingerprint";

function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h = (h << 5) - h + c;
    h = h & h;
  }
  return Math.abs(h).toString(36);
}

export function createFingerprint(
  context: {
    country: string;
    industry: string;
    size: string;
    scenario: string;
    signalA: string;
    signalB: string;
  },
  timestamp: number
): string {
  const payload = [
    context.country,
    context.industry,
    context.size,
    context.scenario,
    context.signalA,
    context.signalB,
    String(timestamp),
  ].join(":");
  return simpleHash(payload);
}

export function saveFingerprint(fingerprint: string): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(KEY, fingerprint);
    }
  } catch {
    // no-op
  }
}
