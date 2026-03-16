# Build Guard

Before any change, run:

```bash
pnpm build
```

Then:

```bash
bash scripts/validation/validate_web_expression.sh
bash scripts/validation/validate_demo_expression_claim.sh
```

If validation fails, stop immediately.
