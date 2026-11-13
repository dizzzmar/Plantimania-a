# Plantimanía: forma de trabajar

- Cada cambio se hace en una rama, nunca directamente en `main`.
- Antes de fusionar, se generan capturas borrador (escritorio y móvil) del cambio y se envían para revisión. Solo se fusiona en `main` cuando se aprueban.
- `main` se publica sola en GitHub Pages, así que lo que entra en `main` queda visible.
- El motor (`src/engine/`) viene del generador de vegetación CAD original: los cambios de dibujo se hacen ahí y se comprueban con `npm test`.
- La zona de ajustes (panel lateral y sus tarjetas de cristal) usa siempre el verde, nunca el lila: con el fondo verde, su acento es un verde claro. Se controla con `--stamp`, `--glass-tint` y `--panel-green` de `.drawer` en `src/style.css`.
- Toda la web va sobre papel verde afieltrado (`src/assets/papel-verde.jpg`) con el texto en beige y los títulos en lila. En pantalla el dibujo usa `--draw-ink`, `--draw-fill` y `--draw-shadow`; la exportación DXF/SVG mantiene sus colores propios.
