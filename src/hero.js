// Vegetación decorativa a puntillismo para la cabecera: ramas de sauce y brotes
// dibujados en gris en un canvas oculto y traducidos a puntos de tinta oliva.
// Se pinta en dos capas (detrás y delante del título) para que las hojas lo crucen.
import {mulberry, U} from "./engine/random.js";

function stippleScene(cv, build, opts) {
  const dpr = Math.min(2, window.devicePixelRatio || 1), W = cv.clientWidth, H = cv.clientHeight;
  if (!W || !H) return;
  cv.width = W * dpr; cv.height = H * dpr;
  const g = cv.getContext("2d");
  g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
  const off = document.createElement("canvas"); off.width = W; off.height = H;
  const o = off.getContext("2d"); o.fillStyle = "#fff"; o.fillRect(0, 0, W, H);
  build(o, W, H);
  const px = o.getImageData(0, 0, W, H).data, R = mulberry(opts.seed || 7), n = Math.round(W * H * (opts.density || 0.55));
  for (let k = 0; k < n; k++) {
    const x = R() * W, y = R() * H, i = ((y | 0) * W + (x | 0)) * 4, dk = 1 - px[i] / 255;
    if (dk < 0.05 || R() > dk * 1.15) continue;
    g.fillStyle = dk > 0.62 ? opts.dark : opts.mid;
    const r = (opts.r || 0.62) * (0.7 + dk * 0.55) * (0.8 + R() * 0.4);
    g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill();
  }
}

function leafShape(o, x, y, ang, L, w, curv) {
  const ca = Math.cos(ang), sa = Math.sin(ang), P = (u, v) => [x + ca * u - sa * v, y + sa * u + ca * v];
  // cuerpo con degradado (un lado en sombra)
  const a = P(0, 0), b = P(L, curv * L), gL = o.createLinearGradient(...P(L * .5, -w), ...P(L * .5, w));
  gL.addColorStop(0, "rgb(95,95,95)"); gL.addColorStop(.42, "rgb(150,150,150)"); gL.addColorStop(.55, "rgb(70,70,70)"); gL.addColorStop(1, "rgb(25,25,25)");
  o.beginPath(); o.moveTo(...a);
  o.bezierCurveTo(...P(L * .25, -w), ...P(L * .7, -w * .8 + curv * L * .5), ...b);
  o.bezierCurveTo(...P(L * .7, w * .8 + curv * L * .5), ...P(L * .25, w), ...a);
  o.fillStyle = gL; o.fill(); o.lineWidth = 1.3; o.strokeStyle = "rgb(25,25,25)"; o.stroke();
  o.beginPath(); o.moveTo(...a); o.quadraticCurveTo(...P(L * .5, curv * L * .35), ...b); o.lineWidth = 1; o.strokeStyle = "rgb(40,40,40)"; o.stroke();
  for (let t = .18; t < .9; t += .11) {
    const q = P(L * t, curv * L * t * t);
    for (const sg of [-1, 1]) {
      const e = P(L * (t + .09), curv * L * t * t + sg * w * .7 * (1 - t * .6));
      o.beginPath(); o.moveTo(...q); o.lineTo(...e); o.lineWidth = .6; o.strokeStyle = "rgb(90,90,90)"; o.stroke();
    }
  }
}

function willow(o, x0, y0, len, ang, R, filter) {
  const pts = [];
  for (let i = 0; i <= 40; i++) { const t = i / 40; pts.push([x0 + Math.cos(ang) * len * t + Math.sin(t * 3) * len * .06, y0 + Math.sin(ang) * len * t + t * t * len * .12]); }
  if (filter(-1)) { o.beginPath(); pts.forEach((p, i) => i ? o.lineTo(...p) : o.moveTo(...p)); o.lineWidth = 2.4; o.strokeStyle = "rgb(40,40,40)"; o.stroke(); }
  for (let i = 3; i < 40; i += 1.5) {
    const p = pts[Math.floor(i)];
    if (!filter(Math.floor(i * 2))) continue;
    const side = i % 4 ? 1 : -1, L = len * U(R, .2, .3) * (1 - i / 90), a = ang + side * U(R, .35, .85) + .35;
    leafShape(o, p[0], p[1], a, L, L * .16, U(R, -.12, .12));
  }
}

function sprig(o, x0, y0, len, ang, R, filter) {
  const pts = [];
  for (let i = 0; i <= 24; i++) { const t = i / 24; pts.push([x0 + Math.cos(ang) * len * t, y0 + Math.sin(ang) * len * t + Math.sin(t * 2.4) * len * .05]); }
  if (filter(-1)) { o.beginPath(); pts.forEach((p, i) => i ? o.lineTo(...p) : o.moveTo(...p)); o.lineWidth = 1.8; o.strokeStyle = "rgb(40,40,40)"; o.stroke(); }
  for (let i = 2; i < 24; i++) {
    if (!filter(i)) continue;
    const p = pts[i], L = len * .11 * (1 - i / 34);
    for (const sg of [-1, 1]) leafShape(o, p[0], p[1], ang + sg * .75, L, L * .32, sg * .08);
  }
}

export function heroScene(back, front) {
  const draw = (cv, layer) => stippleScene(cv, (o, W, H) => {
    const R = mulberry(41);
    const F = i => { if (i < 0) return layer === "back"; const h = mulberry(i * 97 + 5)(); return layer === "front" ? h < .38 : h >= .38; };
    willow(o, W * .58, -H * .2, H * 1.35, 1.05, R, F);
    willow(o, W * .6, -H * .1, H * 1.0, 1.55, mulberry(77), F);
    sprig(o, W * .2, H * 1.08, H * .95, -1.25, mulberry(12), F);
    sprig(o, W * .8, H * 1.12, H * .8, -1.9, mulberry(19), F);
  }, {seed: layer === "front" ? 3 : 9, density: .26, mid: "rgba(150,154,98,.38)", dark: "rgba(112,118,64,.5)", r: 1.0});
  draw(back, "back"); draw(front, "front");
}
