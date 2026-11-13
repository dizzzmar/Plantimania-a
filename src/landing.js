// Página de inicio: plantas hechas de una nube de puntos que se forma y se entrelaza con el título.
//
// Las plantas (sauces que cuelgan y brotes que suben) se dibujan en gris en un canvas
// oculto; de ahí se muestrean miles de puntos según lo oscuro de cada zona. Cada punto
// sale de una nube dispersa y vuela hasta su sitio. Una parte se pinta detrás del título
// y otra delante, para que las plantas lo crucen. Ya formadas, se mecen con el viento
// y el cursor las mueve como si fueran agua: arrastra los puntos a su paso y deja
// ondas que se abren y se apagan.
import {mulberry, U, N} from "./engine/random.js";
import {willow, sprig} from "./hero.js";

const FORM = 2.6;          // segundos que tarda la nube en formar las plantas
const FRONT = 0.34;        // parte de los puntos que pasa por delante del título

function plants(o, W, H) {
  const all = () => true, R = mulberry(2024);
  // sauces que cuelgan desde arriba
  for (let i = 0; i < 9; i++) {
    const x = (i + 0.5) / 9 * W + U(R, -0.03, 0.03) * W;
    willow(o, x, -H * U(R, 0.02, 0.08), H * U(R, 0.32, 0.56), U(R, 1.1, 1.95), mulberry(100 + i), all);
  }
  // brotes que suben desde abajo
  for (let i = 0; i < 10; i++) {
    const x = (i + 0.5) / 10 * W + U(R, -0.03, 0.03) * W;
    sprig(o, x, H * U(R, 1.0, 1.06), H * U(R, 0.26, 0.52), -U(R, 1.2, 1.95), mulberry(200 + i), all);
  }
  // dos ramas que entran por los lados y cruzan la franja del título
  willow(o, -W * 0.02, H * 0.3, W * 0.36, 0.32, mulberry(300), all);
  willow(o, W * 1.02, H * 0.34, W * 0.34, 2.85, mulberry(301), all);
}

function sample(W, H) {
  const off = document.createElement("canvas"); off.width = W; off.height = H;
  const o = off.getContext("2d");
  o.fillStyle = "#fff"; o.fillRect(0, 0, W, H);
  plants(o, W, H);
  const px = o.getImageData(0, 0, W, H).data, R = mulberry(9);
  const want = Math.min(26000, Math.max(11000, Math.round(W * H * 0.02))), pts = [];
  for (let k = 0; k < want * 6 && pts.length < want; k++) {
    const x = R() * W, y = R() * H, dk = 1 - px[((y | 0) * W + (x | 0)) * 4] / 255;
    if (dk < 0.05 || R() > dk * 1.15) continue;
    pts.push({
      tx: x, ty: y, dark: dk > 0.62,
      r: 0.8 * (0.7 + dk * 0.55) * (0.8 + R() * 0.4),
      front: R() < FRONT,
      // salida: una nube borrosa alrededor de su planta (y algún punto suelto más lejos)
      ...(R() < 0.18
        ? {sx: U(R, -0.1, 1.1) * W, sy: U(R, -0.1, 1.1) * H}
        : {sx: x + N(R) * Math.min(W, H) * 0.09, sy: y + N(R) * Math.min(W, H) * 0.09}),
      delay: R() * 0.9, ph: R() * 6.283,
      ox: 0, oy: 0, vx: 0, vy: 0,
    });
  }
  return pts;
}

const ease = t => 1 - Math.pow(1 - t, 3);

export function createLanding(back, front) {
  let W = 0, H = 0, dpr = 1, pts = [], t0 = 0, raf = 0, running = false;
  let mouse = null, ripples = [];
  const RIPPLE = {speed: 280, band: 60, life: 1.9, every: 0.06};  // px/s, px, s, s
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // ?t=segundos congela la animación en ese instante (para capturas de revisión)
  const frozen = new URLSearchParams(location.search).get("t");
  const colors = {};
  const readColors = () => { const css = getComputedStyle(back.closest(".landing")); colors.dark = css.getPropertyValue("--dot-dark").trim(); colors.light = css.getPropertyValue("--dot-light").trim(); };
  readColors();

  function resize() {
    dpr = Math.min(2, devicePixelRatio || 1);
    W = back.clientWidth; H = back.clientHeight;
    if (!W || !H) return;
    for (const c of [back, front]) { c.width = W * dpr; c.height = H * dpr; c.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0); }
    pts = sample(W, H);
  }

  const rip = [0, 0];
  function draw(t) {
    const formed = reduce ? 1 : null, now = performance.now();
    ripples = ripples.filter(r => (now - r.t) / 1000 < RIPPLE.life);
    for (const [cv, isFront] of [[back, false], [front, true]]) {
      const g = cv.getContext("2d");
      g.clearRect(0, 0, W, H);
      const dots = {dark: [], light: []};
      for (const p of pts) {
        if (p.front !== isFront) continue;
        // k = 0: el punto está en la nube dispersa; k = 1: en su sitio en la planta
        const k = formed ?? ease(Math.min(1, Math.max(0, (t - p.delay) / (FORM - 0.9))));
        // viento: se mecen más cuanto más lejos del punto de anclaje (arriba o abajo)
        const anchor = p.ty < H * 0.55 ? p.ty / H : (H - p.ty) / H;
        const sway = reduce ? 0 : Math.sin(t * 0.9 + p.ty * 0.012 + p.ph * 0.15) * 2.4 * anchor * k;
        let x = p.sx + (p.tx - p.sx) * k + sway + p.ox, y = p.sy + (p.ty - p.sy) * k + p.oy;
        if (ripples.length) { rippleOffset(x, y, now, rip); x += rip[0]; y += rip[1]; }
        (p.dark ? dots.dark : dots.light).push(x, y, p.r * (0.85 + 0.15 * k) * 2);
      }
      for (const tone of ["light", "dark"]) {
        g.fillStyle = colors[tone];
        const a = dots[tone];
        for (let i = 0; i < a.length; i += 3) g.fillRect(a[i] - a[i + 2] / 2, a[i + 1] - a[i + 2] / 2, a[i + 2], a[i + 2]);
      }
    }
  }

  // los puntos se apartan del cursor y vuelven a su sitio como un muelle
  function physics(dt) {
    for (const p of pts) {
      let fx = -p.ox * 60 - p.vx * 9, fy = -p.oy * 60 - p.vy * 9;
      if (mouse && (mouse.vx || mouse.vy)) {
        // el cursor arrastra el agua: empuja en su dirección y un poco hacia fuera
        const dx = p.tx + p.ox - mouse.x, dy = p.ty + p.oy - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 16900) {
          const d = Math.sqrt(d2) || 1, w = 1 - d / 130;
          fx += (mouse.vx * 9 + dx / d * 700) * w; fy += (mouse.vy * 9 + dy / d * 700) * w;
        }
      }
      p.vx += fx * dt; p.vy += fy * dt; p.ox += p.vx * dt; p.oy += p.vy * dt;
    }
    if (mouse) { mouse.vx *= Math.exp(-dt * 10); mouse.vy *= Math.exp(-dt * 10); }
  }

  // Ondas: anillos que salen del rastro del cursor; desplazan cada punto en dirección radial.
  function rippleOffset(x, y, now, out) {
    out[0] = 0; out[1] = 0;
    for (const r of ripples) {
      const age = (now - r.t) / 1000, front = age * RIPPLE.speed;
      const dx = x - r.x, dy = y - r.y;
      if (Math.abs(dx) > front + RIPPLE.band || Math.abs(dy) > front + RIPPLE.band) continue;
      const d = Math.sqrt(dx * dx + dy * dy) || 1, off = d - front;
      if (off > RIPPLE.band || off < -RIPPLE.band) continue;
      const a = r.amp * (1 - Math.abs(off) / RIPPLE.band) * Math.exp(-age * 2.4) * Math.sin(off * 0.16);
      out[0] += dx / d * a; out[1] += dy / d * a;
    }
  }

  let last = 0;
  function loop(now) {
    if (!running) return;
    const t = (now - t0) / 1000, dt = Math.min(0.05, last ? (now - last) / 1000 : 0);
    last = now;
    if (!reduce) physics(dt);
    draw(t);
    raf = requestAnimationFrame(loop);
  }

  addEventListener("pointermove", e => {
    if (!running || reduce) return;
    const r = back.getBoundingClientRect(), now = performance.now();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (mouse) {
      const dt = Math.max(0.008, (now - mouse.t) / 1000);
      mouse.vx = (x - mouse.x) / dt; mouse.vy = (y - mouse.y) / dt;
      const speed = Math.hypot(mouse.vx, mouse.vy);
      // cada poco, una onda nueva; más fuerte cuanto más rápido pasa el cursor
      if (speed > 60 && now - (ripples.at(-1)?.t ?? 0) > RIPPLE.every * 1000) {
        ripples.push({x, y, t: now, amp: Math.min(22, 6 + speed * 0.012)});
        if (ripples.length > 14) ripples.shift();
      }
      Object.assign(mouse, {x, y, t: now});
    } else mouse = {x, y, t: now, vx: 0, vy: 0};
  });
  document.documentElement.addEventListener("pointerleave", () => { mouse = null; });
  new ResizeObserver(() => { resize(); if (!running) draw(frozen ? +frozen : FORM + 1); }).observe(back);

  return {
    start() {
      resize();
      if (frozen !== null) { draw(+frozen); return; }
      running = true; t0 = performance.now(); last = 0; raf = requestAnimationFrame(loop);
    },
    stop() { running = false; cancelAnimationFrame(raf); },
    refresh() { readColors(); if (!running) draw(frozen ? +frozen : FORM + 1); },
  };
}
