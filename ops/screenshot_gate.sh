#!/usr/bin/env bash
set -euo pipefail

BEFORE="${1:-output/playwright/before.png}"
AFTER="${2:-output/playwright/after.png}"
THRESHOLD="${3:-0.08}"

if [[ ! -f "$BEFORE" || ! -f "$AFTER" ]]; then
  echo "screenshot_gate: missing screenshot file(s)"
  exit 1
fi

python3 - "$BEFORE" "$AFTER" "$THRESHOLD" <<'PY'
import sys
from pathlib import Path

before = Path(sys.argv[1])
after = Path(sys.argv[2])
threshold = float(sys.argv[3])

try:
    from PIL import Image, ImageChops, ImageStat
except Exception:
    import hashlib
    b_hash = hashlib.sha256(before.read_bytes()).hexdigest()
    a_hash = hashlib.sha256(after.read_bytes()).hexdigest()
    if b_hash == a_hash:
        print("screenshot_gate: FAIL (identical files)")
        raise SystemExit(1)
    print("screenshot_gate: PASS (fallback hash mismatch)")
    raise SystemExit(0)

img_a = Image.open(before).convert("RGB")
img_b = Image.open(after).convert("RGB")

if img_a.size != img_b.size:
    img_b = img_b.resize(img_a.size)

diff = ImageChops.difference(img_a, img_b)
stat = ImageStat.Stat(diff)
mean = sum(stat.mean) / (len(stat.mean) * 255)

print(f"screenshot_gate: diff_ratio={mean:.6f}")
if mean < threshold:
    print("screenshot_gate: FAIL (images too similar)")
    raise SystemExit(1)

print("screenshot_gate: PASS")
PY
