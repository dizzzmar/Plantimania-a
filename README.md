# Plantimanía

Generador de vegetación para planos de arquitectura y paisajismo. Dibuja árboles, arbustos, palmeras, trepadoras y rocas en **alzado, planta e isométrica**, con contorno grueso y detalle fino, y los exporta a **DXF** (AutoCAD, Revit) y **SVG** (Illustrator).

Además de generar, se puede jugar con la planta: un clic la sacude y le hace soltar hojas, al arrastrar se dobla una rama, y el viento la mueve en brisa o temporal.

## Uso

Versión publicada: https://fdegam.github.io/plantimania-a/

Cada cambio en `main` se publica solo en GitHub Pages (`.github/workflows/pages.yml`).

```bash
npm install
npm run dev      # servidor de desarrollo
npm run build    # versión estática en dist/
npm test         # pruebas del motor (todas las especies, vistas y exportaciones)
```

En la barra inferior se eligen la especie, la estación, el viento y la variante (tecla `R` para otra). En **Ajustes** están las dimensiones, el grafismo, la sombra proyectada, las raíces y los grosores de línea. **Exportar** descarga el bloque a la escala elegida.

## Qué exporta

- **DXF** en metros (AC1009), un bloque por vista con las capas `VEG_PERIMETRO`, `VEG_CONTORNO`, `VEG_DETALLE`, `VEG_RAICES`, `VEG_RELLENO` (sólido blanco) y `VEG_SOMBRA`. El perímetro es siempre una polilínea cerrada, lista para sombrear.
- **SVG** con las capas como grupos y los grosores en milímetros a la escala de salida.

La animación es solo de pantalla: lo que se exporta es siempre la planta en reposo.

## Estructura

```
src/
  engine/       motor de dibujo (sin dependencias)
    species.js    catálogo de especies y sus valores por defecto
    model.js      modelo 3D: masas de follaje, ramas, hojas, rocas, raíces y estaciones
    draw.js       proyección, ocultación de líneas, perímetro, relleno y sombra
    export.js     DXF y SVG
  worker.js     calcula las vistas en segundo plano para que la interfaz no se bloquee
  motion.js     viento, sacudidas, arrastre y hojas que caen (deformación 2D anclada al suelo)
  render.js     dibujo en canvas, escala gráfica y cota de altura
  main.js       interfaz
tests/          pruebas del motor con Vitest
```
