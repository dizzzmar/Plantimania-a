# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Arquitectos/as y paisajistas que dibujan planos y necesitan vegetación lista para insertar; estudiantes de arquitectura que preparan láminas y entregas; estudios de interiorismo y urbanismo; y público general curioso que entra a jugar con la planta sin necesidad de exportar.

## Product Purpose

Plantimanía es un generador de vegetación para planos de arquitectura y paisajismo. Dibuja árboles, arbustos, palmeras, trepadoras y rocas en alzado, planta e isométrica, con contorno grueso y detalle fino, y los exporta a DXF (AutoCAD, Revit) y SVG (Illustrator). Además se puede jugar con la planta: un clic la sacude, al arrastrar se dobla una rama y el viento la mueve.

## Positioning

- Genera, no es un catálogo fijo: cada variante es nueva y se ajusta a dimensiones y grafismo a medida.
- Es interactiva y divertida: se sacude, se dobla y suelta hojas.
- Es gratis y no requiere instalación: va en el navegador.

## Capabilities and Constraints

- Todo el texto de la interfaz está en español.
- Exportación DXF en metros (AC1009), un bloque por vista, con capas `VEG_PERIMETRO`, `VEG_CONTORNO`, `VEG_DETALLE`, `VEG_RAICES`, `VEG_RELLENO` y `VEG_SOMBRA`; el perímetro es siempre una polilínea cerrada. SVG con capas como grupos y grosores en milímetros a la escala de salida.
- La animación es solo de pantalla: lo exportado es siempre la planta en reposo.
- Los cambios de dibujo se hacen en `src/engine/` y se comprueban con `npm test`.
- `main` se publica sola en GitHub Pages.

## Evidence on Hand

El README del repositorio y las pruebas del motor (`tests/`). No hay testimonios, clientes, métricas de uso ni cifras de rendimiento que citar; no se deben inventar.
