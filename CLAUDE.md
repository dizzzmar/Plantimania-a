# Plantimanía: forma de trabajar

- Cada cambio se hace en una rama, nunca directamente en `main`.
- Antes de fusionar, se generan capturas borrador (escritorio y móvil) del cambio y se envían para revisión. Solo se fusiona en `main` cuando se aprueban.
- `main` se publica sola en GitHub Pages, así que lo que entra en `main` queda visible.
- El motor (`src/engine/`) viene del generador de vegetación CAD original: los cambios de dibujo se hacen ahí y se comprueban con `npm test`.
- La web es una hoja de delineación sobre papel vegetal (ver `PRODUCT.md`, `DESIGN.md` y `.impeccable/surfaces/index-html.md`): marco con cruces de registro, cajetín de planos como lector de estado y un único acento cobalto. Tipos: Bricolage Grotesque (marca y títulos) y JetBrains Mono (datos). Todo el texto va en español.
- Hay dos temas, claro (papel vegetal) y oscuro (mesa de luz), que se eligen con el botón de la barra superior y por defecto siguen al sistema. Los colores van solo en variables de `:root` y `:root[data-theme="oscuro"]` de `src/style.css`; no se escriben colores sueltos en los componentes. En pantalla el dibujo usa `--draw-ink`, `--draw-fill` y `--draw-shadow`; la exportación DXF/SVG mantiene sus colores propios.
