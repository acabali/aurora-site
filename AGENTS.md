# Aurora Site — Agent Guide

## Propósito
Este repositorio contiene la web activa de Aurora.
No es el runtime interno ni la infraestructura completa de Aurora.

## Canon
- Repo web activo: `~/aurora-site`
- Infraestructura/runtime: fuera de este repo
- No crear lógica paralela ni duplicar componentes existentes

## Qué sí tocar
- páginas
- componentes UI
- estilos
- contenido/copy
- assets públicos
- config web estrictamente necesaria

## Qué no tocar
- integraciones no pedidas
- estructura global sin necesidad
- dependencias sin justificar
- archivos build/cache
- código fuera del alcance del cambio pedido

## Reglas
- preferir cambios mínimos y reversibles
- reutilizar componentes existentes antes de crear nuevos
- no renombrar archivos o carpetas sin necesidad
- no introducir nuevas librerías si se resuelve con el stack actual
- mantener consistencia visual y narrativa de Aurora
- si un cambio impacta múltiples rutas, explicitarlo antes en el plan

## Flujo de trabajo
1. leer archivos relevantes
2. proponer cambio pequeño
3. editar solo lo necesario
4. validar impacto
5. evitar tocar áreas no relacionadas

## Prioridades
1. claridad
2. consistencia
3. mínimo cambio efectivo
4. performance
5. estética

