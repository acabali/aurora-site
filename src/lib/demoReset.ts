export function demoResetIfRequested() {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const shouldReset = params.has("reset") || params.has("fresh") || params.has("r");
  if (!shouldReset) return;

  // keys conocidas (mantener lista acotada y explícita)
  const keys = [
    "evaluation_done",
    "evaluation_registered",
    "aurora_evaluation_done",
    "aurora_demo_lock",
    "aurora_demo_lock_v1_2026_03",
    "aurora_demo_executed",
    "aurora_demo_fingerprint",
    "aurora_demo_session",
  ];

  for (const k of keys) {
    try { localStorage.removeItem(k); } catch {}
    try { sessionStorage.removeItem(k); } catch {}
    try { document.cookie = `${k}=; Max-Age=0; path=/`; } catch {}
  }

  // limpia query para evitar loop
  window.history.replaceState({}, "", "/demo");
  window.location.reload();
}
