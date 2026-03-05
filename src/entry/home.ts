import { initHomeSystem } from "../lib/homeField";

let cleanup: undefined | (() => void);

const boot = () => {
  cleanup = initHomeSystem();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}

window.addEventListener("pagehide", () => {
  if (typeof cleanup === "function") cleanup();
}, { once: true });
