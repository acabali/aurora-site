from pathlib import Path

p = Path("src/layouts/PageLayout.astro")
s = p.read_text(encoding="utf-8")

MARK = "AURORA CRITICAL CSS (nuclear)"
if MARK in s:
    print("OK: critical css already present")
    raise SystemExit(0)

needle = "</head>"
i = s.find(needle)
if i == -1:
    raise SystemExit("ABORT: </head> not found in PageLayout.astro")

css = f"""
<style is:global>
/* {MARK} */
:root{{color-scheme:dark;}}
html,body{{height:100%;}}
body{{margin:0;background:#060607;color:#e9e9ea;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;letter-spacing:.2px;}}
a{{color:inherit;text-decoration:none}}
a:hover{{text-decoration:underline}}
.site-header{{position:fixed;top:0;left:0;right:0;z-index:50;height:56px;display:flex;align-items:center;justify-content:space-between;padding:0 18px;background:rgba(6,6,7,.72);backdrop-filter:blur(10px);border-bottom:1px solid rgba(255,255,255,.06)}}
.site-shell{{min-height:100vh;padding-top:56px}}
.site-nav{{display:flex;gap:10px}}
.header-link{{display:inline-flex;align-items:center;justify-content:center;height:30px;padding:0 12px;border:1px solid rgba(255,255,255,.12);border-radius:6px;font-size:12px;letter-spacing:.14em;text-transform:uppercase}}
.header-link:hover{{border-color:rgba(255,255,255,.28)}}
.brand{{display:flex;align-items:center;gap:10px}}
.brand-name{{font-size:12px;letter-spacing:.18em}}
.sys-status{{font-size:12px;letter-spacing:.12em;color:#7CFFB2}}
.home-system-shell{{position:relative}}
.aurora-field{{position:fixed;inset:0;z-index:0;pointer-events:none;opacity:.9}}
.home-content{{position:relative;z-index:1;max-width:620px;padding:54px 18px}}
.system-rail{{position:fixed;left:18px;top:96px;z-index:2}}
</style>
"""

out = s[:i] + css + "\n" + s[i:]
p.write_text(out, encoding="utf-8")
print("OK: injected critical css")
