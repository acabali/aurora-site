#!/bin/bash
# Validate directory structure

REQUIRED_DIRS=(
  "src/components/sections"
  "src/components/layout"
  "src/components/system"
  "src/system/design"
  "src/pages"
)

for dir in "${REQUIRED_DIRS[@]}"; do
  if [ ! -d "$dir" ]; then
    echo "Error: Directory $dir is missing."
    exit 1
  fi
done

echo "Structure validation passed."
exit 0
