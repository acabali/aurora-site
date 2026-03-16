# Aurora Repository Map

## Critical components (PROTECTED)

`src/components/AuroraField.astro`
→ motion engine / field simulation
→ must never be modified

`src/pages/demo.astro`
→ decision calculation interface

`src/styles/layout.css`
→ global layout behavior

## Surface components (MODIFIABLE)

`src/components/AuroraLanding.astro`
`src/components/SystemInterface.astro`
`src/components/SystemArchitecture.astro`
`src/components/site/SiteHeader.astro`

## Narrative source of truth

`docs/narrative/aurora-narrative-es.md`

All visible narrative must derive from this file.
