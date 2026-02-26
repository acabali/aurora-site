/**
 * Control interno. No mostrar. No exponer.
 * Hash simple: category + answers + timestamp → localStorage.
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
  category: string,
  answers: [boolean, boolean, boolean],
  timestamp: number
): string {
  const payload = `${category}:${answers.map(Number).join("")}:${timestamp}`;
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
