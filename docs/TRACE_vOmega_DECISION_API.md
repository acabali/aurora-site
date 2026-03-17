# AURORA TRACE — DECISION API vΩ

## Estado
- API: /api/decision → OK
- Método: POST
- Contrato: válido
- Engine: movementEngine determinístico
- Hash: SHA-256 (crypto.subtle, browser-safe)

## Commit
- Branch: fix/aurora-home-v1-clean
- Commit: 0a99838
- Fecha: 2026-03-17

## Input esperado
{
  "capital": number >= 0,
  "absorption": "yes | restricted | no",
  "reversibility": "full | partial | none",
  "protocol": "vΩ"
}

## Output
{
  "risk_level": "BAJO | CONTROLADO | CRITICO",
  "insight": string,
  "counterfactual": string,
  "decision_id": "AUR-XXXX",
  "decision_hash": "8 hex"
}

## Test validado
curl POST /api/decision → OK

## Cambios clave
- eliminación node:crypto
- implementación crypto.subtle
- creación hash.ts
- fix endpoint vacío
- conexión engine → API

## Estado final
END-TO-END operativo
