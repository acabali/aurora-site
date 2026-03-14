# Aurora Claude Code — Skills & Agents

Documentación operativa interna.
Este sistema amplía Claude Code con skills y subagents especializados para revisar, mejorar y aprobar la web y demo de Aurora.

Repo objetivo: `/Users/adriano.main/aurora-os`
Archivos web primarios: `aurora-site/` (externo) — pero los skills apuntan al contexto de la web Aurora en general.
Archivos demo primarios: `src/pages/demo.astro`, `src/lib/movementEngine.ts`, `api/lead.ts`

---

## 1. Skills — Qué hace cada una

| Skill | Propósito |
|---|---|
| `web-architecture-review` | Audita jerarquía de secciones, orden narrativo, foco por pantalla y coherencia de la home como argumento |
| `demo-flow-review` | Evalúa flujo de 4 fases de la demo, credibilidad de cada momento, fricción en el lead gate |
| `hero-copy-optimizer` | Audita headline y subheadline contra el estándar de claridad en 3 segundos, autoridad institucional, y cero drift SaaS |
| `design-system-guardian` | Revisa tokens CSS, escala tipográfica, ritmo de espaciado, uso de color, coherencia entre homepage y demo |
| `conversion-qa` | Audita CTAs, microfricción, puntos de fuga, señales de confianza y orden de información |
| `performance-audit` | Evalúa peso de assets, payload JS, costo de render, animaciones GPU-safe, y recursos blocking |
| `motion-and-transition-review` | Revisa sistema de reveal, timing, curvas de easing, carga cognitiva del motion y transiciones del demo |
| `analytics-and-events-review` | Audita eventos críticos, cobertura de funnel, naming, payload del lead y gaps de instrumentación |
| `accessibility-review` | Audita jerarquía de headings, contraste, navegación por teclado, foco, ARIA y semántica HTML |
| `release-readiness-review` | Agrega todas las dimensiones y emite un veredicto binario: SHIP / HOLD / SHIP CON CONDICIONES |

---

## 2. Subagents — Qué hace cada uno

| Subagent | Especialización | Skills que usa |
|---|---|---|
| `web-critic` | Homepage como sistema de comunicación — estructura, narrativa, motion | web-architecture-review, hero-copy-optimizer, motion-and-transition-review |
| `demo-conversion-analyst` | Demo como sistema de prueba y conversión — flujo, lead gate, eventos | demo-flow-review, conversion-qa, analytics-and-events-review |
| `design-system-enforcer` | Consistencia visual — tokens, tipografía, spacing, coherencia entre páginas | design-system-guardian |
| `performance-and-a11y-auditor` | Corrección técnica — velocidad, accesibilidad WCAG AA, recursos | performance-audit, accessibility-review |
| `release-gate-reviewer` | Decisión de shipping — agrega todo, da veredicto binario | release-readiness-review, conversion-qa, performance-audit, accessibility-review |

---

## 3. Cuándo usar cada skill vs subagent

**Usa una skill cuando:**
- Querés un checklist específico sobre una dimensión concreta
- Estás revisando un componente o sección aislada
- Querés instrucciones paso a paso para un tipo de revisión
- Es una sesión exploratoria o de diagnóstico

**Usa un subagent cuando:**
- Querés delegarle la revisión completa a un rol especializado
- Tenés cambios grandes que abarcan múltiples archivos
- Necesitás un criterio de decisión (ship/hold, keep/cut, coherente/drift)
- Estás preparando un release y necesitás cobertura de múltiples dimensiones

---

## 4. Cómo invocarlos

### Skills
Claude Code descubre las skills automáticamente desde `.claude/skills/`. Se activan cuando el contexto de la tarea coincide con su `description`.

Para invocar explícitamente:
```
Usa la skill web-architecture-review para revisar el orden de secciones de la home.
```
```
Aplica demo-flow-review a src/pages/demo.astro.
```

### Subagents
Los subagents están disponibles como agentes especializados en `.claude/agents/`.

Para invocar explícitamente:
```
Delega a web-critic la revisión del hero y las transiciones.
```
```
Usa demo-conversion-analyst para identificar por qué el lead gate tiene baja conversión.
```
```
Pide a release-gate-reviewer que emita un veredicto de shipping.
```

---

## 5. Flujo recomendado para revisar la web

**Revisión completa antes de un cambio mayor:**
1. `web-architecture-review` → ¿el orden de secciones es correcto?
2. `hero-copy-optimizer` → ¿el hero pasa el test de 3 segundos?
3. `design-system-guardian` → ¿hay tokens hardcodeados o drift visual?
4. `motion-and-transition-review` → ¿el motion suma o resta?
5. `accessibility-review` → ¿hay fallas WCAG AA?

**Revisión rápida pre-commit:**
```
Delega a web-critic los cambios en AuroraLanding.astro.
```

**Gate de release:**
```
Usa release-gate-reviewer para emitir un veredicto de shipping.
```

---

## 6. Flujo recomendado para revisar la demo

**Revisión completa antes de exponer la URL:**
1. `demo-flow-review` → ¿cada fase es creíble y sin fricción?
2. `conversion-qa` → ¿el lead gate está justificado?
3. `analytics-and-events-review` → ¿qué no estamos midiendo?
4. `accessibility-review` → ¿el formulario es accesible?
5. `performance-audit` → ¿el demo carga rápido?

**Gate de release:**
```
Usa release-gate-reviewer para evaluar si la demo está lista para exponer.
```

---

## 7. Cómo evitar colisiones con MCP y runtime

**MCP:**
- Los skills y subagents de esta carpeta operan solo sobre archivos web/demo
- No tienen acceso ni referencias a `mcp/`, `src/` del runtime, `db/`, `scripts/`, ni al orchestrator
- Si Claude Code sugiere modificar algo fuera de `src/components/`, `src/pages/`, `src/lib/`, `src/styles/`, o `api/lead.ts` → rechazarlo

**Runtime Aurora:**
- El runtime vive en `aurora-runtime`, `aurora-scheduler`, `aurora-decision-engine`, etc.
- Ningún skill de esta carpeta debe sugerir cambios ahí
- `movementEngine.ts` es parte de la demo, no del runtime — puede auditarse pero su lógica determinista no debe tocarse

**Agents de runtime (`.claude/agents/` existentes):**
- `architecture-agent`, `docs-agent`, `growth-agent`, `infra-agent`, `qa-agent`, `security-agent` → operan sobre el runtime
- Los nuevos agents web (`web-critic`, `demo-conversion-analyst`, etc.) → operan solo sobre la web/demo
- No mezclar: si una pregunta involucra tanto runtime como web, separar en dos conversaciones

---

## 8. Qué no hacer

- No usar estos skills para revisar código de backend, runtime, o infraestructura
- No invocar `release-gate-reviewer` para gating de deploys del runtime (usar `qa-agent` para eso)
- No usar `web-critic` para proponer nuevas secciones — el mapa de secciones está frozen
- No usar `hero-copy-optimizer` para reescribir la narrativa — solo evaluar
- No agregar dependencias nuevas (GSAP, Three.js, Lenis ya fueron removidos) sin justificación real
- No tocar `settings.json` ni los hooks de Claude Code sin entender el impacto
- No crear skills genéricas — cada skill nueva debe estar aterrizadas a Aurora

---

## 9. Ejemplos de uso reales

**Escenario: Se modificó el hero, ¿está bien?**
```
Aplica hero-copy-optimizer al hero actual de AuroraLanding.astro.
Necesito saber si pasa el test de 3 segundos y si hay drift SaaS.
```

**Escenario: La demo no convierte bien, ¿dónde está el problema?**
```
Usa demo-conversion-analyst para auditar src/pages/demo.astro completo.
Identifica los puntos de abandono más probables.
```

**Escenario: Se va a compartir la URL con inversores mañana.**
```
Pide a release-gate-reviewer un veredicto de shipping.
Inputs: homepage + demo. Output esperado: SHIP / HOLD / SHIP CON CONDICIONES.
```

**Escenario: Se agregó una nueva sección al home.**
```
Usa web-architecture-review para evaluar si la nueva sección encaja
en la secuencia narrativa y no rompe el flujo.
```

**Escenario: Se sospecha que hay tokens CSS hardcodeados en la demo.**
```
Usa design-system-enforcer para auditar src/pages/demo.astro
y encontrar valores no tokenizados.
```

**Escenario: Se necesita saber qué eventos faltan antes de lanzar.**
```
Aplica analytics-and-events-review a demo.astro y api/lead.ts.
Lista los eventos críticos no instrumentados con el naming recomendado.
```

---

## Archivos de este sistema

```
.claude/
├── skills/
│   ├── web-architecture-review/SKILL.md
│   ├── demo-flow-review/SKILL.md
│   ├── hero-copy-optimizer/SKILL.md
│   ├── design-system-guardian/SKILL.md
│   ├── conversion-qa/SKILL.md
│   ├── performance-audit/SKILL.md
│   ├── motion-and-transition-review/SKILL.md
│   ├── analytics-and-events-review/SKILL.md
│   ├── accessibility-review/SKILL.md
│   └── release-readiness-review/SKILL.md
├── agents/
│   ├── web-critic.md
│   ├── demo-conversion-analyst.md
│   ├── design-system-enforcer.md
│   ├── performance-and-a11y-auditor.md
│   └── release-gate-reviewer.md
└── README-AURORA-SKILLS.md  ← este archivo
```

Skills pre-existentes (no tocar, son del runtime):
`architecture-review`, `decision-analysis`, `growth-strategy`, `launch-review`, `memory-maintenance`, `pricing-review`, `repo-audit`, `risk-scan`, `security-scan`, `system-audit`

Agents pre-existentes (no tocar, son del runtime):
`architecture-agent`, `docs-agent`, `growth-agent`, `infra-agent`, `qa-agent`, `security-agent`
