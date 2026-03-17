# Aurora Site — Architecture

## Objetivo
Sitio web activo de Aurora para narrativa, producto, demo y presencia institucional.

## Áreas principales
- `src/pages` o equivalente: rutas y páginas
- `src/components`: componentes reutilizables
- `public`: assets estáticos
- estilos globales: tokens, layout, tipografía, helpers visuales

## Principios
- una sola fuente de verdad por componente
- evitar duplicación visual y lógica
- mantener jerarquía clara entre contenido, layout y styling
- separar contenido editable de estructura cuando sea posible

## Límites
Este repo no define el runtime completo de Aurora ni su infraestructura interna.
Si algo parece de backend, ops o automatización, no asumir que vive aquí.

## Ownership estricto
- `aurora-site` captura input, adapta payloads, consume contratos/API de Aurora OS y renderiza resultados
- `aurora-site` no genera `decision_id`, `decision_hash`, `run_signature` ni ejecuta protocolo de decisión local
- `aurora-site` no calcula riesgo estructural, no simula escenarios, no ejecuta counterfactuals y no mantiene ledger local
- design system, narrativa pública y continuidad home -> demo viven aquí
- contratos, identidad, telemetry, validation y surfaces canónicas viven en `aurora-os`

