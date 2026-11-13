---
name: Plantimanía
description: Hoja de delineación viva sobre papel vegetal, con un único acento cobalto y el cajetín de planos como lector de estado.
colors:
  desk: "#dfe4e1"
  sheet: "#f7f8f5"
  sheet-2: "#eceeea"
  ink: "#131a25"
  ink-2: "#384355"
  muted: "#5a6579"
  cobalt: "#2344ee"
  cobalt-ink: "#ffffff"
  error: "#b3261e"
  night-desk: "#0b0f15"
  night-sheet: "#121923"
  night-sheet-2: "#0e141d"
  night-ink: "#e6ecf5"
  night-ink-2: "#b6c0d0"
  night-muted: "#8f9cb1"
  night-cobalt: "#8fa3ff"
  night-cobalt-ink: "#0b1030"
  night-error: "#ff9a8f"
typography:
  display:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "clamp(48px, 7.4vw, 96px)"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 650
    lineHeight: 1.2
  body:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.02em"
  cajetin-label:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.06em"
  data:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.3
rounded:
  sheet: "4px"
  field: "8px"
  control: "10px"
  panel: "12px"
  dialog: "14px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  gutter: "28px"
components:
  button:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "40px"
    padding: "0 14px"
  button-primary:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.cobalt-ink}"
    rounded: "{rounded.control}"
    height: "40px"
    padding: "0 14px"
  button-big:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.cobalt-ink}"
    rounded: "{rounded.panel}"
    height: "54px"
    padding: "0 24px"
  tab-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.sheet}"
    rounded: "9px"
    height: "34px"
    padding: "0 15px"
  select-field:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "0 12px"
  panel:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "20px"
  cajetin-cell:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    padding: "6px 10px 7px"
---

# Design System: Plantimanía

## Overview

**Creative North Star: "La hoja de delineación viva"**

Plantimanía es una lámina de dibujo que responde. La planta se dibuja sobre papel vegetal, con marco de lámina y cruces de registro, y el cajetín de planos (especie, lámina, vista, medidas, escala, autor, fecha) hace de lector de estado del producto. Un único acento cobalto se reserva para lo que en un plano son cotas: foco, acción principal y datos vivos. Todo lo demás es tinta azul-negra sobre papel frío casi blanco.

El sistema es sobrio y técnico, con un gesto de juego: la planta se sacude al tocarla y, al cambiar de vista, la hoja anterior queda como un fantasma translúcido que se desplaza. Los controles son componentes estándar, sin cristal ni sombras difusas grandes; la personalidad vive en la hoja, no en los botones.

Hay dos temas conmutados con `data-theme` en `:root`: **claro** (papel vegetal sobre mesa gris verdosa) y **oscuro** (mesa de luz: azul noche, tinta clara, cobalto claro). Los colores viven solo en variables de `:root` y `:root[data-theme="oscuro"]`; los componentes nunca escriben colores sueltos.

**Key Characteristics:**
- Papel frío casi blanco con grano sutil y un brillo superior casi invisible.
- Filetes de 1 px (`--line` y `--line-2`) en lugar de sombras para separar.
- Un solo acento, cobalto; sin segundo matiz de marca.
- Bricolage Grotesque condensada para marca y títulos; JetBrains Mono para datos del cajetín.
- Esquinas rectas en la hoja (4 px), 8 a 14 px en controles y paneles.
- Movimiento de pantalla con resorte corto; se anula con `prefers-reduced-motion`.

## Colors

Paleta de una sola tinta y un acento: neutros fríos teñidos de azul y cobalto como única voz de color. El tema oscuro redefine los mismos roles; no añade colores nuevos.

### Primary
- **Cobalto de cotas** (#2344ee claro; #8fa3ff en oscuro): acción principal (`.btn.primary`), foco (`:focus-visible` de 2 px), interruptor activo, miembros de rango, número de lámina, estado de "Entintando", hover de bordes y resumen de tarjetas. Texto sobre cobalto: blanco (#ffffff) en claro, azul noche (#0b1030) en oscuro. Versión suave `--accent-soft` (9 % claro, 13 % oscuro) para hover.

### Neutral
- **Mesa de dibujo** (#dfe4e1 claro; #0b0f15 oscuro): fondo de página y de la aplicación, por detrás de la hoja.
- **Papel vegetal** (#f7f8f5 claro; #121923 oscuro): hoja, paneles, botones, cajetín, popovers y diálogos.
- **Papel de campo** (#eceeea claro; #0e141d oscuro): carril de pestañas y fondo de teclas `kbd`.
- **Tinta** (#131a25 claro; #e6ecf5 oscuro): texto principal, pestaña y opción seleccionadas (fondo de tinta, texto de papel).
- **Tinta secundaria** (#384355 claro; #b6c0d0 oscuro): texto de apoyo, pestañas sin seleccionar, párrafos de introducción.
- **Gris de cota** (#5a6579 claro; #8f9cb1 oscuro): etiquetas, notas y rótulo de medidas.
- **Filete** (`--line` rgba(19,26,37,.14) claro; rgba(230,236,245,.13) oscuro) y **filete fuerte** (`--line-2` .34 claro; .30 oscuro): bordes de 1 px, marco de lámina, divisiones del cajetín, pista de rango.

### Semantic
- **Error** (#b3261e claro; #ff9a8f oscuro): solo en `.status.error`.

### Dibujo en pantalla
El lienzo lee `--draw-ink`, `--draw-fill` y `--draw-shadow` (claro: #131a25, #ffffff, 13 % de tinta; oscuro: #e6ecf5, #0d131b, negro al 38 %). La exportación DXF/SVG mantiene sus propios colores y no entra en este sistema.

### Named Rules
**The One Voice Rule.** El cobalto es el único acento. Si un elemento no es acción principal, foco, dato vivo o estado activo, va en tinta.

**The Tokens-Only Rule.** Ningún componente escribe un color suelto: todo sale de las variables de `:root` o de `:root[data-theme="oscuro"]`, y cada rol existe en ambos temas.

## Typography

**Display Font:** Bricolage Grotesque (con system-ui, sans-serif); eje de anchura 85 a 90 % en marca y títulos
**Body Font:** Bricolage Grotesque (misma familia, anchura normal, `font-optical-sizing: auto`)
**Label/Mono Font:** JetBrains Mono (con ui-monospace) para datos del cajetín, números, rótulos de medida

**Character:** Una grotesca de carácter, comprimida y pesada en titulares, convive con una monoespaciada de plotter para todo lo que es dato. Lo que se lee como dibujo (marca, especie) es proporcional; lo que se lee como medida es mono.

### Hierarchy
- **Display** (800, clamp(48px, 7.4vw, 96px), 0.95, -0.035em, anchura 85 %): marca de la portada.
- **Headline** (700, 22 a 27px, 1.05 a 1.1, -0.02em, anchura 88 a 90 %): especie en el cajetín (27px), títulos de diálogo (22px), del panel de ajustes (20px). Nombre de marca en la barra: 800, 22px, anchura 85 %.
- **Title** (650, 15px, 1.2): resumen de tarjetas del panel de ajustes.
- **Body** (400, 14px, 1.45; lead de portada 16 a 20px, 1.5, máx. 34ch): texto general, introducción, notas (12px, 1.5).
- **Label** (600, 12px, +0.02em): etiquetas de grupo de controles; botones 600 13.5px; segmentados 600 12.5px.
- **Cajetín label** (500, 11px, +0.06em, mayúsculas): solo `dt` de las celdas del cajetín.
- **Data** (500, 13px mono, tabular-nums; 22px 700 en número de lámina): `dd` del cajetín, salidas de rango (12px), número de variante (14px), `kbd` (11px).

### Named Rules
**The Dato en Mono Rule.** Cifras, escalas, medidas, fecha y valores de ajuste van en JetBrains Mono con cifras tabulares; nunca en la grotesca.

**The Cajetín Label Rule.** Las etiquetas en mayúsculas con espaciado pertenecen a las celdas del cajetín, donde son el lenguaje de la lámina; no se usan como sobretítulo de secciones ni de titulares.

## Layout

La aplicación ocupa `100dvh` sin scroll de página: barra superior de tres columnas (marca, pestañas centradas, acciones; mín. 68px), y debajo un espacio de trabajo en dos columnas, controles de 300px (264px por debajo de 1180px) y la hoja flexible, con huecos de 16px. La portada es una cuadrícula de dos columnas (1.05fr y 1fr) con el cajetín a pie, que cruza ambas, con márgenes de 28px.

La hoja posiciona sobre sí misma: pista y etiqueta de medidas arriba (28 a 30px de margen), escala/cajetín abajo a la derecha a 14px del marco (hasta 560px de ancho, cuadrícula de 3 columnas con áreas nombradas). El panel de ajustes, de 372px, entra desde la derecha y desplaza el cajetín y la etiqueta (`right` 382 y 398px) para no tapar la hoja.

El ritmo de espaciado es múltiplo de 4 con preferencia por 8, 12, 14, 16, 20 y 24px; los grupos de controles se separan 24px; los internos 8 a 14px.

**Responsive.** A 860px o menos: la barra pasa a dos filas con pestañas a ancho completo; los botones de acción colapsan a icono (40px); el espacio de trabajo es una columna con la hoja primero (mín. 260px) y los controles debajo en rejilla de dos columnas con altura máxima de 46dvh; el cajetín se reduce a especie, lámina, vista y escala (se ocultan medidas, autor y fecha); el panel de ajustes sube desde abajo (máx. 80dvh) y el popover de exportar se fija a pantalla; la portada apila texto, hoja y cajetín, y el botón grande ocupa el ancho.

### Named Rules
**The Cajetín Anchor Rule.** El cajetín vive siempre abajo a la derecha de la hoja y se aparta, no se tapa, cuando entra un panel.

## Elevation & Depth

Sistema esencialmente plano: la profundidad se expresa con filetes de 1 px, un cambio de papel (hoja frente a mesa) y el marco de lámina con cruces de registro de 13px en las esquinas. Las sombras existen solo en dos funciones, ambas tokenizadas por tema, y nunca como brillo difuso decorativo. La hoja lleva un grano sutil (`--tooth`, ruido fractal a 5,5 % claro y 4 % oscuro) y un brillo superior (`--sheen`: degradado blanco en claro; halo cobalto al 8 % en oscuro).

### Shadow Vocabulary
- **Hoja** (`--shadow-sheet`: `0 1px 0 rgba(255,255,255,.9) inset, 0 6px 12px -9px rgba(19,26,37,.4)` en claro; `0 1px 0 rgba(255,255,255,.05) inset, 0 6px 12px -8px rgba(0,0,0,.7)` en oscuro): asienta la lámina sobre la mesa.
- **Flotante** (`--shadow-pop`: `0 20px 44px -18px rgba(19,26,37,.4), 0 2px 8px rgba(19,26,37,.08)` en claro; `0 20px 44px -16px rgba(0,0,0,.75)` en oscuro): popover de exportar, panel de ajustes y diálogo de sugerencias, solo cuando flotan sobre la hoja.
- **Fantasma** (animación `ghost-away`, .95s): la vista anterior queda al 42 % de opacidad y se va 26px a la izquierda y 14px abajo con -0,5 grados mientras se desvanece.

### Named Rules
**The Filete First Rule.** Se separa con un filete de 1 px antes que con una sombra; la sombra se reserva para lo que flota.

## Shapes

Hoja y papel recto: la hoja tiene 4px de radio, y el marco de lámina es un rectángulo sin redondeo con cruces de registro. Los controles son rectángulos suaves: campos y segmentados 8 a 10px, botones 10px (el botón grande, 12px), paneles 12px, diálogo 14px, píldora de pista y interruptor 999px. El cajetín es una cuadrícula de celdas separadas por filetes de 1 px, sin redondeo. Las casillas son de 5px con marca de verificación enmascarada; el deslizador usa un pulgar circular de 18px con anillo del color del papel.

## Components

### Buttons
- **Shape:** rectángulo suave (10px), 40px de alto; el grande, 54px y 12px de radio; solo icono, 40px cuadrado.
- **Default:** papel con filete fuerte, texto en tinta, 13.5px a 600.
- **Primary:** relleno cobalto y texto de acento (`--accent-ink`); acción principal por pantalla (Empezar a dibujar, Exportar, descargar DXF).
- **Hover / Focus:** el botón normal toma `--accent-soft` y borde cobalto; el primario sube un 8 % de brillo. Foco visible: contorno cobalto de 2px con desfase de 2px. Pulsado: se hunde 1px y escala .97.

### Tabs de vista
Carril de papel de campo con filete y 12px de radio; la pestaña seleccionada se rellena de tinta con texto de papel; la ociosa se tiñe de `--accent-soft` al pasar.

### Segmentados e interruptor
Grupo de 10px con filete fuerte, 3px de relleno; opción seleccionada invertida (tinta sobre papel). El interruptor es 46x26px; activo, cobalto, con pulgar blanco y resorte `cubic-bezier(.34,1.56,.64,1)`.

### Campos
Selector y número: 44px de alto, 10px de radio, filete fuerte, flecha en CSS; hover con borde cobalto. El número va en mono. Campos del buzón: 8px de radio.

### Rango
Pista de 4px en `--line-2`; pulgar cobalto circular con anillo de papel; valor en mono a la derecha.

### Cajetín de planos (componente propio)
Cuadrícula con `gap: 1px` sobre fondo de filete fuerte, con celdas de papel. Cada celda: etiqueta en mayúsculas (11px) y valor en mono (13px). La especie es el único valor en grotesca (27px, 700); el número de lámina va en cobalto. Al cambiar un valor, entra con un `tick` de .32s. En la portada es una banda de cuatro celdas (vistas, salida, autor, fecha).

### Panel de ajustes
Tarjetas `details` separadas por filete superior, con flecha de borde CSS que gira; cabecera fija con título y cierre. 372px, 12px de radio, flotante con `--shadow-pop`.

### Hoja y marco de lámina
Lienzo transparente sobre papel con grano; capa fantasma debajo del marco; cruces de registro en las cuatro esquinas del marco, de 14px hacia dentro.

## Do's and Don'ts

### Do:
- **Do** usar cobalto solo para acción principal, foco, dato vivo y estado activo (una acción primaria por superficie).
- **Do** resolver cada color mediante variable de `:root` y dar un valor equivalente en `:root[data-theme="oscuro"]`.
- **Do** separar con filetes de 1 px (`--line`, `--line-2`) y reservar `--shadow-pop` para lo que flota.
- **Do** poner cifras, escalas, medidas y fechas en JetBrains Mono con cifras tabulares.
- **Do** mantener el cajetín abajo a la derecha de la hoja y la hoja con 4px de radio.
- **Do** anular las animaciones con `prefers-reduced-motion`.

### Don't:
- **Don't** usar cristal, desenfoque de fondo ni sombras difusas grandes como decoración.
- **Don't** introducir un segundo acento ni colores sueltos en componentes.
- **Don't** usar la etiqueta en mayúsculas con espaciado fuera del cajetín.
- **Don't** redondear la hoja ni el cajetín más allá de lo registrado.
- **Don't** dejar que el cajetín quede tapado por el panel de ajustes.
