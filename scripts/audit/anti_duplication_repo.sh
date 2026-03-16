#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-$PWD}"
cd "$ROOT"

echo "======================================"
echo "AURORA ANTI-DUPLICATION AUDIT"
echo "ROOT: $ROOT"
echo "======================================"

TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

echo
echo "1) ASSETS PESADOS Y POSIBLES DUPLICADOS"
echo "--------------------------------------"

find public src docs -type f \( \
  -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.webp" -o -iname "*.svg" -o -iname "*.gif" \
\) 2>/dev/null | sort > "$TMPDIR/assets.txt"

if [[ -s "$TMPDIR/assets.txt" ]]; then
  while IFS= read -r f; do
    shasum "$f"
  done < "$TMPDIR/assets.txt" | sort > "$TMPDIR/assets_hashes.txt"

  echo
  echo "Assets más pesados:"
  while IFS= read -r f; do
    du -h "$f"
  done < "$TMPDIR/assets.txt" | sort -hr | head -30

  echo
  echo "Duplicados exactos por hash:"
  awk '{print $1}' "$TMPDIR/assets_hashes.txt" | uniq -d > "$TMPDIR/dup_hashes.txt" || true
  if [[ -s "$TMPDIR/dup_hashes.txt" ]]; then
    while IFS= read -r hash; do
      echo
      echo "HASH DUPLICADO: $hash"
      grep "^$hash " "$TMPDIR/assets_hashes.txt"
    done < "$TMPDIR/dup_hashes.txt"
  else
    echo "No se detectaron duplicados exactos por hash."
  fi

  echo
  echo "Mismos nombres en rutas distintas:"
  awk '{print $2}' "$TMPDIR/assets_hashes.txt" | xargs -n1 basename | sort | uniq -d > "$TMPDIR/dup_basenames.txt" || true
  if [[ -s "$TMPDIR/dup_basenames.txt" ]]; then
    while IFS= read -r name; do
      echo
      echo "NOMBRE REPETIDO: $name"
      grep "/$name$" "$TMPDIR/assets.txt" || true
    done < "$TMPDIR/dup_basenames.txt"
  else
    echo "No se detectaron nombres de asset repetidos."
  fi
else
  echo "No se encontraron assets en public/src/docs."
fi

echo
echo "2) NOMBRES REDUNDANTES EN EL REPO"
echo "---------------------------------"

find src public docs scripts -type f 2>/dev/null | sed 's#^\./##' | sort > "$TMPDIR/all_files.txt"

echo
echo "Mismos nombres de archivo en carpetas distintas:"
awk -F/ '{print $NF}' "$TMPDIR/all_files.txt" | sort | uniq -d > "$TMPDIR/repeated_filenames.txt" || true
if [[ -s "$TMPDIR/repeated_filenames.txt" ]]; then
  while IFS= read -r name; do
    echo
    echo "ARCHIVO REPETIDO: $name"
    grep "/$name$" "$TMPDIR/all_files.txt" || true
  done < "$TMPDIR/repeated_filenames.txt"
else
  echo "No se detectaron nombres de archivo repetidos."
fi

echo
echo "3) RUTAS LOCALES Y LINKS INCONSISTENTES"
echo "---------------------------------------"

find src/pages -type f \( -iname "*.astro" -o -iname "*.md" -o -iname "*.mdx" \) 2>/dev/null | sort > "$TMPDIR/pages.txt"

python3 <<'PY' > "$TMPDIR/routes.txt"
import os, sys
pages = []
for root, _, files in os.walk("src/pages"):
    for f in files:
        if not (f.endswith(".astro") or f.endswith(".md") or f.endswith(".mdx")):
            continue
        p = os.path.join(root, f).replace("src/pages", "")
        p = p.replace("\\", "/")
        if p.endswith("/index.astro") or p.endswith("/index.md") or p.endswith("/index.mdx"):
            p = p.rsplit("/index.",1)[0] or "/"
        else:
            p = "/" + p.split("/",1)[1] if p.startswith("/") else p
            p = p.rsplit(".",1)[0]
        if p == "":
            p = "/"
        pages.append(p)
for r in sorted(set(pages)):
    print(r)
PY

echo
echo "Rutas existentes:"
cat "$TMPDIR/routes.txt"

echo
echo "Links internos usados (href='/...'):"
rg -No 'href="/[^"#?]+' src/components src/pages src/layouts 2>/dev/null | sed 's/.*href="//' | sort -u > "$TMPDIR/hrefs.txt" || true
cat "$TMPDIR/hrefs.txt" 2>/dev/null || true

echo
echo "Links internos sin ruta correspondiente:"
if [[ -s "$TMPDIR/hrefs.txt" ]]; then
  while IFS= read -r href; do
    if ! grep -Fxq "$href" "$TMPDIR/routes.txt"; then
      echo "RUTA SOSPECHOSA: $href"
    fi
  done < "$TMPDIR/hrefs.txt"
else
  echo "No se detectaron href internos."
fi

echo
echo "4) COMPONENTES HUÉRFANOS"
echo "------------------------"

find src/components -type f -iname "*.astro" 2>/dev/null | sort > "$TMPDIR/components.txt"

while IFS= read -r component; do
  base="$(basename "$component" .astro)"
  # Busca imports o usos JSX/Astro del componente en pages/layouts/components
  if ! rg -n "(import .*${base}.*from|<${base}[\s>])" src/pages src/layouts src/components 2>/dev/null | grep -v "$component" >/dev/null; then
    echo "POTENCIAL HUÉRFANO: $component"
  fi
done < "$TMPDIR/components.txt"

echo
echo "5) DIRECTORIOS VACÍOS O SOSPECHOSOS"
echo "-----------------------------------"
find . -type d -empty \
  ! -path "./.git/*" \
  ! -path "./node_modules/*" \
  ! -path "./.pnpm-store/*" 2>/dev/null | sort || true

echo
echo "6) RESUMEN RÁPIDO DE PESO"
echo "-------------------------"
du -sh . .git node_modules public src scripts 2>/dev/null || true

echo
echo "======================================"
echo "ANTI-DUPLICATION AUDIT COMPLETE"
echo "======================================"
