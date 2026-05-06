# Aurora Elite Agents — Design Candidate

**Branch:** `claude/add-critique-layer-z5ADs`
**Status:** EXPLORATORY — FROZEN — DO NOT MERGE
**Date:** 2026-05-06

---

## Estado

Este branch es una exploración conceptual. No es una implementación lista para producción.

**No debe mergearse** a main de `aurora-site` ni a ninguna rama de `aurora-os`.

---

## Qué contiene este branch

| Archivo | Rol | Estado |
|---|---|---|
| `core/agents/critique/strategic_critic_agent.ts` | Diseño candidato de StrategicCriticAgent | Conceptual |
| `core/agents/executive/executive_clarity_agent.ts` | Diseño candidato de ExecutiveClarityAgent | Conceptual |
| `core/orchestrator/aurora_orchestrator_v2.ts` | Orchestrator paralelo hipotético | NO usar en producción |
| `core/agents/qa/agent_elite_validator.ts` | QA gate de validación de scores | Conceptual |
| `core/types.ts` | Contratos de tipos propuestos | Sin validar contra aurora-os |
| `core/global.d.ts` | Ambient declarations para Node.js | Auxiliar |
| `artifacts/agent_system_v2/elite_agents/*.json` | Scaffolds de artefactos | Vacíos |

---

## Qué falta para integración real

1. **Auditoría de `aurora-os`** — el core real no fue accesible desde esta sesión.
   La integración requiere una sesión Claude abierta directamente en `~/aurora-os`.

2. **Contratos verificados** — `core/types.ts` propone interfaces nuevas sin confirmar
   compatibilidad con los tipos existentes en `aurora-os`.

3. **Punto de inserción real** — el pipeline de `aurora_orchestrator_v2.ts` aquí es
   hipotético. El orchestrator de producción vive en `aurora-os` y tiene su propia
   secuencia de etapas, contratos y mecanismos de registro de agentes.

4. **Sin garantía de compatibilidad** con el runtime real de Aurora.
   `StrategicCriticAgent` y `ExecutiveClarityAgent` pueden requerir refactoring
   significativo una vez mapeado el core existente.

---

## Decisiones tomadas

- **No mergear** este branch.
- **No limpiar** este branch — queda como referencia de diseño.
- **No crear más core paralelo** en `aurora-site`.
- La integración real se ejecuta únicamente desde una sesión en `~/aurora-os`,
  con mapa completo del orchestrator y tipos existentes.

---

## Próximo paso

Desde `~/aurora-os`:
```bash
ls core/
ls core/orchestrator/
ls core/agents/
cat core/types.ts
```

Con ese output se puede diseñar el plan de integración quirúrgico y determinar
exactamente dónde insertar `StrategicCriticAgent` y `ExecutiveClarityAgent`
dentro de la arquitectura real, sin duplicar tipos ni crear runtimes paralelos.
