# Plantimanía: forma de trabajar

- Cada cambio se hace en una rama, nunca directamente en `main`.
- Antes de fusionar, se generan capturas borrador (escritorio y móvil) del cambio y se envían para revisión. Solo se fusiona en `main` cuando se aprueban.
- `main` se publica sola en GitHub Pages, así que lo que entra en `main` queda visible.
- El motor (`src/engine/`) viene del generador de vegetación CAD original: los cambios de dibujo se hacen ahí y se comprueban con `npm test`.
- La zona de ajustes (panel lateral y sus tarjetas de cristal) usa siempre el verde, nunca el lila: con el fondo verde, su acento es un verde claro. Se controla con `--stamp`, `--glass-tint` y `--panel-green` de `.drawer` en `src/style.css`.
- La web tiene tres temas que se eligen con las bolitas de abajo a la derecha: verde (por defecto: papel `src/assets/papel-verde.jpg`, texto beige, títulos lila), lila (`src/assets/papel-lila.jpg`, texto verde, detalles beige) y beige (el papel de algodón del principio). Los colores van en variables de `:root` y `:root[data-theme=…]` en `src/style.css`; no se escriben colores sueltos en los componentes. En pantalla el dibujo usa `--draw-ink`, `--draw-fill` y `--draw-shadow`; la exportación DXF/SVG mantiene sus colores propios.
