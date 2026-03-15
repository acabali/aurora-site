#!/bin/bash
# Validate performance-related configurations

# Check font preloading in MainLayout.astro
if ! grep -q "rel=\"preload\"" src/layouts/MainLayout.astro; then
  echo "Error: Font preloading is missing in MainLayout.astro"
  exit 1
fi

echo "Performance validation passed."
exit 0
