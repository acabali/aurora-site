# Repo Boundary

Purpose: keep `aurora-site` aligned with Aurora OS without reintroducing local system logic.

## `aurora-site` owns
- homepage narrative
- demo presentation
- design system
- rendering and interaction
- payload adaptation from public inputs into canonical Aurora OS contracts

## `aurora-site` does not own
- decision protocol execution
- decision identity generation
- decision hashing
- structural risk classification
- scenario simulation
- counterfactual generation
- ledger, trace, telemetry, or validation logic

## Demo rule
- the demo may collect minimal public inputs
- the demo may transform those inputs into a canonical Aurora OS payload
- the demo must render Aurora OS output as received
- if the Aurora OS endpoint is protected, browser code must not bypass that policy by recreating the logic locally

## Terminology rule
- the web must present Aurora as decision infrastructure
- the web must avoid SaaS dashboard framing
- modules and solutions shown publicly must map back to Aurora OS canon
