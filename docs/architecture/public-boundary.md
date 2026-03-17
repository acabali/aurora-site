# Public Boundary

Purpose: keep `aurora-site` as a pure consumer of Aurora OS.

## `aurora-site` owns
- public narrative
- design system
- home and demo interaction
- input capture
- payload adaptation
- API calls
- rendering Aurora OS output

## `aurora-site` does not own
- decision protocol execution
- decision identity generation
- decision hashing
- structural risk classification
- scenario simulation
- counterfactual generation
- ledger, trace, telemetry, or validation logic

## Boundary rule
- browser code must call Aurora OS through a browser-safe endpoint or a controlled relay
- if Aurora OS is unavailable, the site fails closed instead of recreating system logic locally
- unused local decision engines must be removed rather than kept as fallback logic
