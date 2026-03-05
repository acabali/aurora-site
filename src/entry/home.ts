import { initHomeSystem } from "../lib/homeField";

if (document.readyState !== "loading") {
  initHomeSystem();
} else {
  document.addEventListener("DOMContentLoaded", () => initHomeSystem());
}
