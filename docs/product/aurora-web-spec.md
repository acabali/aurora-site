# AURORA WEB PRODUCT SPEC

This document defines the complete product structure
for the Aurora web surface and demo.

Claude Code and Cursor must follow this specification.

--------------------------------------------------

## PRODUCT POSITION

Aurora is decision infrastructure.

Aurora evaluates real strategic moves before execution.

Aurora does not provide dashboards.

Aurora exposes structural pressure inside a decision
before resources are committed.

--------------------------------------------------

## NARRATIVE SOURCE

HERO

La mente humana tiene un límite.
La realidad no.

El mercado ya no compite con personas.
Compite con sistemas.

El cálculo reemplaza la interpretación.

Aurora introduce esa capacidad.

No es digitalización.

Es cálculo sobre los movimientos.

→ Poner un movimiento bajo cálculo

--------------------------------------------------

QUÉ CAMBIÓ

La forma de operar cambió.

Hoy es posible ver la estructura de un movimiento antes de actuar.

No es optimización.

Es condición de entrada.

La precisión define quién compite.

--------------------------------------------------

DESAJUSTE

El mercado ya no opera a velocidad humana.

Opera sobre movimientos.

Movimientos que comprometen capital,
activan operaciones
y generan consecuencias.

Añadir interpretación no aumenta capacidad.

Aumenta retraso.

La ventaja ya no es crecer.

Es ver la estructura antes de entrar en ella.

--------------------------------------------------

RUPTURA

Antes:

El error se absorbía.
El ajuste era posterior.

Hoy:

El cálculo reemplaza la interpretación.

El mercado ejecuta sobre cálculo continuo.

No es transformación digital.

Es cambio de estándar.

--------------------------------------------------

AURORA

Aurora introduce cálculo sobre los movimientos.

Registra el movimiento.
Deriva su estructura.
Localiza el punto de presión.

La interpretación humana ya no alcanza.

Aurora no mejora el juicio.

Lo reemplaza.

--------------------------------------------------

DEMO

Pon tu próximo movimiento
bajo cálculo.

Aurora no opina.

Calcula.

Detecta la interacción dominante.
Expone la vulnerabilidad central.

Una señal.
Un movimiento correcto.

--------------------------------------------------

## SITE STRUCTURE

Aurora Web must follow this structure.

Home

Hero
Qué cambió
Desajuste
Ruptura
Aurora
System Architecture
Demo Entry

--------------------------------------------------

## COMPONENT MAP

Hero
→ AuroraLanding.astro

System interface
→ SystemInterface.astro

System architecture
→ SystemArchitecture.astro

Header
→ SiteHeader.astro

Decision demo
→ demo.astro

--------------------------------------------------

## UI RULES

Language

Spanish only.

English version will be implemented later
as a separate version.

--------------------------------------------------

Tone

Aurora must read as system infrastructure.

Forbidden language:

SaaS
marketing optimization
growth hacking
dashboards
analytics platform

Allowed concepts:

structure
pressure
movement
system
calculation
exposure

--------------------------------------------------

## HEADER

Header must contain:

Aurora logo
Inicio
Demo

Logo always top-left.

Navigation minimal.

--------------------------------------------------

## DEMO PRINCIPLE

The demo represents submission of a movement
to structural calculation.

Flow:

movement
↓
calculation
↓
system readout

The demo must never appear as a dashboard
or analytics tool.

--------------------------------------------------

## PRODUCT LAYERS

Aurora system layers:

Aurora Core
Aurora Signal
Aurora Scenario
Aurora Risk
Aurora Ledger
Outcome Intelligence

These must appear as system layers
not SaaS features.

--------------------------------------------------

## PROTECTED COMPONENTS

The following files must never be modified
without explicit instruction.

src/components/AuroraField.astro

src/pages/demo.astro

src/styles/layout.css

These files contain the motion engine
and core demo logic.
