// Cristal líquido de verdad: el borde actúa como una lente.
//
// Para cada pieza de cristal (botones, pestañas, lámina, tarjetas) se genera un mapa
// de desplazamiento con su misma forma redondeada: en el centro no desvía nada y cerca
// del borde desvía cada vez más hacia dentro, como el canto curvo de una gota. Ese mapa
// se aplica a lo que hay DETRÁS de la pieza (backdrop-filter con un filtro SVG), y se
// hace tres veces con intensidades algo distintas para rojo, verde y azul: así aparece
// la pequeña franja irisada del borde, como en un cristal real.
//
// Solo los navegadores Chromium (Chrome, Edge, Arc, Brave…) admiten filtros SVG en
// backdrop-filter. En Safari y Firefox queda un cristal esmerilado sin deformación.

const SUPPORTED = (() => {
  const brands = navigator.userAgentData?.brands?.map(b => b.brand).join(" ") || "";
  return /Chromium|Google Chrome|Microsoft Edge/.test(brands) || (/Chrome\//.test(navigator.userAgent) && !/Edg\/|OPR\//.test(navigator.userAgent) && "chrome" in window);
})();

const NS = "http://www.w3.org/2000/svg";
let svg = null, seq = 0;

function ensureSvg() {
  if (svg) return svg;
  svg = document.createElementNS(NS, "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
  document.body.append(svg);
  return svg;
}

// Mapa de desplazamiento (R = x, G = y; 128 = sin desvío) para un rectángulo redondeado.
function displacementMap(W, H, radius, band) {
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d"), img = g.createImageData(W, H), d = img.data;
  const hx = W / 2, hy = H / 2, r = Math.min(radius, hx, hy);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      // distancia con signo al borde del rectángulo redondeado (negativa dentro)
      const px = Math.abs(x + 0.5 - hx), py = Math.abs(y + 0.5 - hy);
      const qx = px - (hx - r), qy = py - (hy - r);
      const ox = Math.max(qx, 0), oy = Math.max(qy, 0);
      const sd = Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - r;
      const inside = -sd;
      let nx = 0, ny = 0;
      if (inside > 0 && inside < band) {
        // normal hacia fuera
        if (qx > 0 && qy > 0) { const l = Math.hypot(qx, qy) || 1; nx = qx / l; ny = qy / l; }
        else if (qx > qy) nx = 1; else ny = 1;
        nx *= Math.sign(x + 0.5 - hx) || 1; ny *= Math.sign(y + 0.5 - hy) || 1;
        // perfil de canto curvo: casi nada lejos del borde, mucho pegado a él
        const t = 1 - inside / band, m = t * t * t;
        nx *= -m; ny *= -m;          // muestrea hacia dentro: el fondo se curva en el canto
      }
      const i = (y * W + x) * 4;
      d[i] = 128 + nx * 127; d[i + 1] = 128 + ny * 127; d[i + 2] = 128; d[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  return c.toDataURL();
}

function buildFilter(id, W, H, map, scale) {
  const f = document.createElementNS(NS, "filter");
  f.id = id;
  for (const [k, v] of Object.entries({x: 0, y: 0, width: W, height: H, filterUnits: "userSpaceOnUse", "color-interpolation-filters": "sRGB"})) f.setAttribute(k, v);
  const ch = [["R", scale, "1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"],
              ["G", scale * 0.93, "0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0"],
              ["B", scale * 0.86, "0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0"]];
  f.innerHTML = `<feImage href="${map}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="none" result="map"/>` +
    ch.map(([c, s, m]) =>
      `<feDisplacementMap in="SourceGraphic" in2="map" scale="${s.toFixed(1)}" xChannelSelector="R" yChannelSelector="G" result="d${c}"/>` +
      `<feColorMatrix in="d${c}" type="matrix" values="${m}" result="c${c}"/>`).join("") +
    `<feBlend in="cR" in2="cG" mode="screen" result="rg"/><feBlend in="rg" in2="cB" mode="screen" result="rgb"/>` +
    `<feGaussianBlur in="rgb" stdDeviation="0.5"/>`;
  return f;
}

function apply(el) {
  const W = Math.round(el.offsetWidth), H = Math.round(el.offsetHeight);
  if (!W || !H) return;
  const key = W + "x" + H;
  if (el.dataset.lgKey === key) return;
  el.dataset.lgKey = key;
  const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
  // canto fino: el interior queda limpio y solo se curva el borde
  const band = Math.max(5, Math.min(Math.min(W, H) * 0.24, 22));
  const scale = band * 1.1;
  const id = el.dataset.lgId || (el.dataset.lgId = "lg-" + (++seq));
  svg.querySelector("#" + id)?.remove();
  svg.append(buildFilter(id, W, H, displacementMap(W, H, radius, band), scale));
  el.style.setProperty("--lg-filter", `url(#${id})`);
}

export function initLiquidGlass(selector = ".lg") {
  document.documentElement.classList.toggle("lg-refract", SUPPORTED);
  if (!SUPPORTED) return;
  ensureSvg();
  const ro = new ResizeObserver(entries => { for (const e of entries) apply(e.target); });
  const scan = () => document.querySelectorAll(selector).forEach(el => { if (!el.dataset.lgWatched) { el.dataset.lgWatched = "1"; ro.observe(el); } apply(el); });
  scan();
  // tarjetas o diálogos que aparecen después
  new MutationObserver(scan).observe(document.body, {subtree: true, childList: true, attributes: true, attributeFilter: ["open", "hidden", "class"]});
}
