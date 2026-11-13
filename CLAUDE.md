# Plantimanía: forma de trabajar

- Cada cambio se hace en una rama, nunca directamente en `main`.
- Antes de fusionar, se generan capturas borrador (escritorio y móvil) del cambio y se envían para revisión. Solo se fusiona en `main` cuando se aprueban.
- `main` se publica sola en GitHub Pages, así que lo que entra en `main` queda visible.
- El motor (`src/engine/`) viene del generador de vegetación CAD original: los cambios de dibujo se hacen ahí y se comprueban con `npm test`.
