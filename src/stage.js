// Una hoja de dibujo: un canvas con su escena, su movimiento y sus gestos
// (clic para sacudir, arrastrar para doblar una rama). La usan el tablero y la portada.
import {SPECIES} from "./engine/species.js";
import {Motion} from "./motion.js";
import {readColors, layoutScene, fit, pick, drawScene} from "./render.js";

export function createStage(cv, {inset = () => ({bottom: 0, right: 0}), onTouch = () => {}} = {}) {
  const ctx = cv.getContext("2d"), motion = new Motion();
  let scene = null, colors = readColors(document.documentElement);
  let cssW = 0, cssH = 0, dpr = 1, last = 0, running = false, press = null, room = {bottom: 0, right: 0};

  function setScene(p, list, views) {
    scene = {p, views, layout: layoutScene(views, list)};
    motion.frames = {};
    for (const v of list) { motion.setFrame(v, views[v].bb); motion.setCrown(v, views[v].crown); }
    motion.leaves = motion.leaves.filter(l => views[l.view]);
    const S = SPECIES[p.species];
    motion.stiff = S.mode === "roca" ? 0.08 : S.mode === "hiedra" ? 0.45 : 1;
    motion.leafRate = S.mode === "roca" ? 0 : S.caduca
      ? {primavera: 4, verano: 4, otono: 14, invierno: 0}[p.estacion]
      : (S.mode === "graminea" || S.mode === "palmera") ? 2 : 3;
    resize();
  }

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cssW = cv.clientWidth; cssH = cv.clientHeight;
    if (!cssW || !cssH) return;
    cv.width = Math.round(cssW * dpr); cv.height = Math.round(cssH * dpr);
    room = inset();
    if (scene) scene.fitted = fit(scene.layout, cssW, cssH, room);
    paint();
  }

  function paint() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    if (!scene || !scene.fitted) return;
    // con una hoja estrecha el cajetín tapa la esquina: la escala se apoya encima de él
    const scaleX = Math.max(40, cssW * 0.04), above = room.bottom > 0 && room.left - scaleX < 260;
    drawScene(ctx, scene, motion, colors, {scaleX, scaleY: above ? cssH - room.bottom - 16 : cssH - 34});
  }

  function loop(t) {
    const dt = last ? (t - last) / 1000 : 0;
    last = t;
    motion.step(Math.min(dt, 0.05));
    paint();
    if (motion.active()) requestAnimationFrame(loop);
    else { running = false; last = 0; paint(); }
  }
  function wake() { if (!running) { running = true; last = 0; requestAnimationFrame(loop); } }

  /* gestos */
  const local = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  cv.addEventListener("pointerdown", e => {
    if (!scene) return;
    const [sx, sy] = local(e), hit = pick(scene, sx, sy);
    if (!hit) return;
    press = {sx, sy, hit, dragging: false};
    cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener("pointermove", e => {
    if (!scene) return;
    const [sx, sy] = local(e);
    if (!press) { cv.style.cursor = pick(scene, sx, sy) ? "grab" : "default"; return; }
    if (!press.dragging && Math.hypot(sx - press.sx, sy - press.sy) > 6) {
      press.dragging = motion.grab(press.hit.v, press.hit.x, press.hit.y);
      cv.style.cursor = "grabbing";
      onTouch();
    }
    if (press.dragging) {
      const {sc, ox, oy} = scene.fitted, it = scene.layout.items.find(i => i.v === press.hit.v);
      motion.pull((sx - ox) / sc - it.dx, (oy - sy) / sc - it.dy);
      wake();
    }
  });
  cv.addEventListener("pointerup", () => {
    if (!press) return;
    if (press.dragging) motion.release();
    else motion.shake(press.hit.v, press.hit.x, press.hit.y);
    press = null; cv.style.cursor = "grab";
    onTouch(); wake();
  });
  cv.addEventListener("pointercancel", () => { if (press && press.dragging) motion.release(); press = null; wake(); });
  cv.addEventListener("keydown", e => {
    if ((e.key === "Enter" || e.key === " ") && scene) {
      e.preventDefault();
      const it = scene.layout.items[0], b = scene.views[it.v].bb;
      motion.shake(it.v, (b[0] + b[2]) / 2, b[1] + (b[3] - b[1]) * 0.7);
      onTouch(); wake();
    }
  });

  return {
    motion, setScene, resize, paint, wake,
    get scene() { return scene; },
    refreshColors() { colors = readColors(document.documentElement); paint(); },
  };
}
