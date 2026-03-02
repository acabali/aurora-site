# Fullscreen Overlay QA (2 minutes)

## Goal
Prove one of two outcomes with reproducible evidence:

- A) Overlay is gone under controlled conditions.
- B) Overlay is external to site code (not DOM/HTML/repo APIs).

## 1) Automated checks
Run:

```bash
bash ops/qa_fullscreen_overlay.sh
```

Or against a preview:

```bash
bash ops/qa_fullscreen_overlay.sh "https://your-preview-url.vercel.app"
```

PASS criteria:
- No `requestFullscreen` / `requestPointerLock` API usage in `src/`.
- No `"To exit full screen"` text in served HTML.
- No fullscreen/pointer-lock markers in served HTML.

## 2) Browser console checks (manual)
Open target URL in browser DevTools console and run:

```js
(() => {
  const result = {
    hasOverlayTextInDom: document.body.innerText.includes("To exit full screen"),
    matchingNodes: [...document.querySelectorAll("*")].filter(el =>
      el.innerText?.includes("exit full screen")
    ).length,
    iframeCount: document.querySelectorAll("iframe").length,
    fullscreenElement: document.fullscreenElement,
    webkitFullscreenElement: document.webkitFullscreenElement,
    displayModeFullscreen: window.matchMedia("(display-mode: fullscreen)").matches,
    pointerLockElement: document.pointerLockElement,
    outerEqualsScreen: window.outerHeight === screen.height,
  };
  console.table(result);
  return result;
})();
```

PASS criteria:
- `hasOverlayTextInDom === false`
- `matchingNodes === 0`
- `fullscreenElement === null`
- `webkitFullscreenElement === null`
- `displayModeFullscreen === false`
- `pointerLockElement === null`

## 3) Cross-check external origin
Run same console block in `about:blank` and in site URL while toggling browser fullscreen.

Interpretation:
- If overlay appears regardless of page content and DOM checks stay false/null, it is browser/OS UI.
- If overlay only appears with a specific app state and fullscreen APIs activate, it is site-triggered.

## 4) Evidence log template
Copy this into incident notes:

- URL tested:
- Browser + version:
- Overlay visible (yes/no):
- DOM contains overlay text (true/false):
- Fullscreen API active (value):
- Pointer lock active (value):
- Served HTML contains overlay/fullscreen markers (yes/no):
- Conclusion:
