#!/bin/bash
# Validate that required section components exist

REQUIRED_SECTIONS=(
  "Hero.astro"
  "SystemExplainer.astro"
  "DecisionEngine.astro"
  "ProofBlock.astro"
  "DemoBlock.astro"
  "ProductsBlock.astro"
  "SolutionsBlock.astro"
  "AuthorityBlock.astro"
  "CTASection.astro"
)

SECTION_DIR="src/components/sections"

for section in "${REQUIRED_SECTIONS[@]}"; do
  if [ ! -f "$SECTION_DIR/$section" ]; then
    echo "Error: Section component $section is missing."
    exit 1
  fi
done

echo "Sections validation passed."
exit 0
