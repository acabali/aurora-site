import { initHomeSystem } from "../lib/homeField";

if (typeof window !== "undefined") {
  if (document.readyState !== "loading") initHomeSystem();
  else document.addEventListener("DOMContentLoaded", () => initHomeSystem(), { once: true });
}
