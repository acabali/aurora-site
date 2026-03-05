import { initHomeSystem } from "../lib/homeField";

const boot = () => initHomeSystem();

if (document.readyState !== "loading") boot();
else document.addEventListener("DOMContentLoaded", boot, { once: true });
