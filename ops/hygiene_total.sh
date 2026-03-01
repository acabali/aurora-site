#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
DATE="$(date +%F)"
ARCHIVE_DIR="$ROOT/_ARCHIVE/$DATE"
DRYRUN="${DRYRUN:-1}"

echo "== AURORA-SITE HYGIENE TOTAL =="
echo "ROOT: $ROOT"
echo "ARCHIVE: $ARCHIVE_DIR"
echo "DRYRUN: $DRYRUN"
echo

# baseline limpio o aborta
if [[ -n "$(git status --porcelain=v1)" ]]; then
  echo "ABORT: repo sucio. Corré: git status -sb"
  exit 1
fi
echo "OK: repo limpio"
echo

# strings prohibidos
echo "== Guardrails: strings prohibidos =="
if rg -n "calibrar|Evaluación generada|Tiempo, costo, riesgo, coordinación y ejecución" src ; then
  echo "ABORT: encontrado string prohibido"
  exit 1
else
  echo "OK: sin strings prohibidos"
fi
echo

# patrones SaaS/legacy prohibidos
echo "== Guardrails: patrones prohibidos =="
if rg -n "card|panel|accordion|grid-product|legacy|vomega|omega" src ; then
  echo "ABORT: encontrado patrón prohibido"
  exit 1
else
  echo "OK: sin patrones prohibidos"
fi
echo

# inventario imports
echo "== Inventario de imports =="
mkdir -p /tmp/aurora_hygiene
rg -n "from\s+['\"]|^\s*import\s" src -S > /tmp/aurora_hygiene/imports.txt || true
echo "OK: imports -> /tmp/aurora_hygiene/imports.txt"
echo

# detectar capas muertas (blocks + lib)
echo "== Detectar capas muertas (blocks + lib) =="
mkdir -p "$ARCHIVE_DIR"

### mapfile_removed ###

dead_list=()
for f in "${CANDIDATES[@]}"; do
  base="$(basename "$f")"
  if ! rg -q "$base" /tmp/aurora_hygiene/imports.txt; then
    dead_list+=("$f")
  fi
done

echo "Candidatos muertos: ${#dead_list[@]}"
printf "%s\n" "${dead_list[@]}" > /tmp/aurora_hygiene/dead_candidates.txt
echo "Lista -> /tmp/aurora_hygiene/dead_candidates.txt"
echo

if [[ "${#dead_list[@]}" -eq 0 ]]; then
  echo "OK: no hay capas muertas obvias en blocks/lib"
else
  echo "Acción: mover a $ARCHIVE_DIR (fuera del build)"
  if [[ "$DRYRUN" == "1" ]]; then
    echo "DRYRUN=1: no muevo nada. Para ejecutar: DRYRUN=0 bash ops/hygiene_total.sh"
  else
    for f in "${dead_list[@]}"; do
      rel="${f#"$ROOT"/}"
      mkdir -p "$ARCHIVE_DIR/$(dirname "$rel")"
      git mv "$f" "$ARCHIVE_DIR/$rel"
    done
    echo "OK: movidos a ARCHIVE via git mv"
  fi
fi
echo

# limpiar outputs
echo "== Limpieza outputs =="
rm -rf dist .astro .vercel/output .vercel/cache 2>/dev/null || true
echo "OK: outputs limpios"
echo

# build baseline
echo "== Build baseline =="
pnpm build
echo "OK: pnpm build exit 0"
echo

# deps check
echo "== Deps check =="
git diff --exit-code -- package.json pnpm-lock.yaml || { echo "ABORT: deps cambiadas"; exit 1; }
echo "OK: deps intactas"
echo

# reporte
echo "== Reporte final =="
git status -sb
echo
echo "FIN. Si DRYRUN=1 y querés ejecutar archive: DRYRUN=0 bash ops/hygiene_total.sh"
