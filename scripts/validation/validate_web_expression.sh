#!/bin/bash
# Validate Web Expression Layer compliance

echo "Running Expression Layer Validation..."

# 1. Terminal terms check
TERMS=(
  "decision_id"
  "run_signature"
  "movement registered"
  "movement recorded"
  "structural load"
  "pressure point"
  "compression mechanism"
  "system reading"
)

for term in "${TERMS[@]}"; do
  if ! grep -r "$term" src/components/system/DemoExperience.astro > /dev/null; then
    echo "Error: Required terminal term '$term' is missing in DemoExperience.astro"
    exit 1
  fi
done

# 2. Loader sequence check
LOADERS=(
  "registering movement"
  "mapping structural variables"
  "locating pressure point"
)

for loader in "${LOADERS[@]}"; do
  if ! grep -r "$loader" src/components/system/DemoExperience.astro > /dev/null; then
    echo "Error: Required loader step '$loader' is missing in DemoExperience.astro"
    exit 1
  fi
done

# 3. CTA check
ALLOWED_CTAS=(
  "Explore Aurora"
  "See how Aurora works"
)

# This is a loose check to ensure no forbidden CTAs are used in key files
FORBIDDEN_CTAS=(
  "Start using Aurora"
  "Sign up"
  "Get started"
)

for forbidden in "${FORBIDDEN_CTAS[@]}"; do
  if grep -r "$forbidden" src/pages src/components/sections src/components/AuroraLanding.astro > /dev/null; then
    echo "Error: Forbidden CTA '$forbidden' detected."
    exit 1
  fi
done

echo "Expression Layer validation passed."
exit 0
