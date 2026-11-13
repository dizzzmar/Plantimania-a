import {SPECIES, GROVE} from "./engine/species.js";
import {DEFAULT_SETTINGS, speciesDefaults, buildParams} from "./params.js";
import {Motion} from "./motion.js";
import {readColors, layoutScene, fit, pick, drawScene} from "./render.js";
import {heroScene} from "./hero.js";

const $ = id => document.getElementById(id);
const fmtNum = (v, d = 1) => Number(v).toLocaleString("es-ES", {minimumFractionDigits: d, maximumFractionDigits: d});

/* ---------- estado ---------- */
const state = {
  species: "olivo",
  seed: 128,
  view: "alzado",
  values: {...DEFAULT_SETTINGS, ...speciesDefaults("olivo")},
};
const motion = new Motion();
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

/* ---------- worker ---------- */
const worker = new Worker(new URL("./worker.js", import.meta.url), {type: "module"});
let reqId = 0, pending = new Map(), scene = null;

function ask(msg) {
  const id = ++reqId;
  return new Promise((resolve, reject) => { pending.set(id, {resolve, reject}); worker.postMessage({...msg, id}); });
}
worker.onmessage = e => {
  const {id, type} = e.data, job = pending.get(id);
  if (!job) return;
  pending.delete(id);
  type === "error" ? job.reject(new Error(e.data.message)) : job.resolve(e.data);
};

const params = () => buildParams(state.species, state.values, state.seed);
const viewList = () => state.view === "tres" ? ["alzado", "planta", "iso"] : [state.view];

/* ---------- dibujo ---------- */
let drawTimer = 0, latest = 0;
function requestDraw(delay = 0) {
  clearTimeout(drawTimer);
  drawTimer = setTimeout(async () => {
    const id = ++latest, p = params(), list = viewList();
    $("busy").hidden = false;
    try {
      const res = await ask({type: "draw", params: p, views: list});
      if (id !== latest) return;
      setScene(p, list, res.views, res.name);
      showSimplification(p, res.stats);
    } catch (err) {
      console.error(err);
    } finally {
      if (id === latest) $("busy").hidden = true;
    }
  }, delay);
}

function setScene(p, list, views, name) {
  scene = {p, views, layout: layoutScene(views, list)};
  motion.frames = {};
  for (const v of list) { motion.setFrame(v, views[v].bb); motion.setCrown(v, views[v].crown); }
  motion.leaves = motion.leaves.filter(l => views[l.view]);
  const S = SPECIES[p.species];
  motion.stiff = S.mode === "roca" ? 0.08 : S.mode === "hiedra" ? 0.45 : 1;
  motion.leafRate = S.mode === "roca" ? 0 : S.caduca
    ? {primavera: 4, verano: 4, otono: 14, invierno: 0}[p.estacion]
    : (S.mode === "graminea" || S.mode === "palmera") ? 2 : 3;
  const total = list.reduce((s, v) => s + views[v].count, 0);
  $("meta").textContent = name + " · " + total.toLocaleString("es-ES") + " polilíneas";
  resize();
}

/* ---------- canvas y bucle ---------- */
const cv = $("cv"), ctx = cv.getContext("2d");
let colors = readColors(document.documentElement), cssW = 0, cssH = 0, dpr = 1;

function dockInset() {
  const dock = document.querySelector(".dock"), stage = $("stage");
  const r = dock.getBoundingClientRect(), s = stage.getBoundingClientRect();
  const drawer = $("ajustes"), wide = innerWidth > 860;
  const right = wide && drawer.classList.contains("open") ? Math.max(0, s.right - (innerWidth - 12 - drawer.offsetWidth) + 16) : 0;
  return {bottom: Math.max(0, s.bottom - r.top), right};
}

function resize() {
  dpr = Math.min(2, window.devicePixelRatio || 1);
  cssW = cv.clientWidth; cssH = cv.clientHeight;
  cv.width = Math.round(cssW * dpr); cv.height = Math.round(cssH * dpr);
  if (scene) scene.fitted = fit(scene.layout, cssW, cssH, dockInset());
  paint();
}

function paint() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  if (!scene || !scene.fitted) return;
  const inset = dockInset();
  drawScene(ctx, scene, motion, colors, {scaleX: Math.max(24, cssW * 0.04), scaleY: cssH - inset.bottom - 22});
}

let last = 0, running = false;
function loop(t) {
  const dt = last ? (t - last) / 1000 : 0;
  last = t;
  motion.step(dt);
  paint();
  if (motion.active()) requestAnimationFrame(loop);
  else { running = false; last = 0; paint(); }
}
function wake() { if (!running) { running = true; last = 0; requestAnimationFrame(loop); } }

/* ---------- interacción con la planta ---------- */
let press = null;
const local = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };

cv.addEventListener("pointerdown", e => {
  if (!scene) return;
  const [sx, sy] = local(e), hit = pick(scene, sx, sy);
  if (!hit) return;
  press = {sx, sy, hit, dragging: false, id: e.pointerId};
  cv.setPointerCapture(e.pointerId);
});
cv.addEventListener("pointermove", e => {
  if (!scene) return;
  const [sx, sy] = local(e);
  if (!press) { cv.style.cursor = pick(scene, sx, sy) ? "grab" : "default"; return; }
  if (!press.dragging && Math.hypot(sx - press.sx, sy - press.sy) > 6) {
    press.dragging = motion.grab(press.hit.v, press.hit.x, press.hit.y);
    cv.style.cursor = "grabbing";
    dismissHint();
  }
  if (press.dragging) {
    const {sc, ox, oy} = scene.fitted, it = scene.layout.items.find(i => i.v === press.hit.v);
    motion.pull((sx - ox) / sc - it.dx, (oy - sy) / sc - it.dy);
    wake();
  }
});
const endPress = () => {
  if (!press) return;
  if (press.dragging) motion.release();
  else motion.shake(press.hit.v, press.hit.x, press.hit.y);
  press = null; cv.style.cursor = "grab";
  dismissHint(); wake();
};
cv.addEventListener("pointerup", endPress);
cv.addEventListener("pointercancel", () => { if (press && press.dragging) motion.release(); press = null; wake(); });
cv.addEventListener("keydown", e => {
  if ((e.key === "Enter" || e.key === " ") && scene) {
    e.preventDefault();
    const it = scene.layout.items[0], b = scene.views[it.v].bb;
    motion.shake(it.v, (b[0] + b[2]) / 2, b[1] + (b[3] - b[1]) * 0.7);
    dismissHint(); wake();
  }
});
function dismissHint() { $("hint").classList.add("gone"); }

/* ---------- controles ---------- */
const FORMAT = {
  H: v => fmtNum(v) + " m", W: v => fmtNum(v) + " m", tr: v => Math.round(v * 100) + " %",
  dens: v => "× " + fmtNum(v, 2), jag: v => fmtNum(v, 2), huecos: v => fmtNum(v, 2), real: v => Math.round(v * 100) + " %",
  sombra: v => fmtNum(v, 2), cs: v => "× " + fmtNum(v, 2), ramas: v => String(v), tallos: v => String(v),
  sdir: v => v + "° " + ["→", "↗", "↑", "↖", "←", "↙", "↓", "↘"][Math.round(v / 45) % 8], salt: v => v + "°", sdist: v => fmtNum(v) + " m",
  rg: v => "× " + fmtNum(v, 2), rp: v => "× " + fmtNum(v, 2),
  simp: v => v > 0 ? Math.round(v * 100) + " %" : "Nada",
  gp: v => fmtNum(v, 2) + " mm", gc: v => fmtNum(v, 2) + " mm", gr: v => fmtNum(v, 2) + " mm", gd: v => fmtNum(v, 2) + " mm",
};

const inputs = [...document.querySelectorAll("[data-key]")];

function syncInputs() {
  for (const el of inputs) {
    const v = state.values[el.dataset.key];
    if (el.type === "checkbox") el.checked = !!v; else el.value = v;
  }
  for (const o of document.querySelectorAll("output[data-for]")) o.textContent = FORMAT[o.dataset.for](state.values[o.dataset.for]);
  const revit = state.values.simp > 0;
  document.querySelectorAll("#destSeg button").forEach(b => b.setAttribute("aria-checked", String((+b.dataset.simp > 0) === revit)));
  $("b_dxf").textContent = revit ? "Descargar DXF para Revit" : "Descargar DXF para AutoCAD";
  $("gp").disabled = !state.values.perim;
  $("gp").closest(".range").classList.toggle("off", !state.values.perim);
  updateFicha();
}

function updateFicha() {
  const S = SPECIES[state.species], v = state.values;
  $("f_nombre").textContent = $("tipo").selectedOptions[0].textContent.replace(/\s*\(.*\)$/, "");
  $("f_vista").textContent = {alzado: "Alzado", planta: "Planta", iso: "Isométrica", tres: "Las tres vistas"}[state.view];
  const what = S.mode === "roca" ? "de largo" : S.shape === "seto" ? "de largo" : S.mode === "hiedra" ? "de ancho" : "de copa";
  const grove = GROVE.has(state.species) && v.tallos > 1 ? `, ${v.tallos} ejemplares` : "";
  $("f_medidas").textContent = `${fmtNum(v.H)} m de alto, ${fmtNum(v.W)} m ${what}${grove}`;
}

function applySpecies() {
  const S = SPECIES[state.species];
  Object.assign(state.values, speciesDefaults(state.species));
  $("s_hint").textContent = S.hint;
  $("r_hint").textContent = "Tipo: " + S.rtxt;
  const est = S.caduca ? state.values.estacion : "verano";
  document.querySelectorAll("#estSeg button").forEach(b => {
    b.disabled = !S.caduca && b.dataset.s !== "verano";
    b.setAttribute("aria-checked", String(est === b.dataset.s));
  });
  $("estSeg").title = S.caduca ? "" : "Especie de hoja perenne: mantiene las hojas todo el año.";
  const sp = state.species, m = S.mode, masas = ["masas", "olivo", "cipres", "arbusto", "conifera"].includes(m);
  $("lbl_tallos").textContent = GROVE.has(sp) ? "Ejemplares (árboles)" : sp === "olivo" ? "Ramas madre" : sp === "multitallo" ? "Pies (troncos)" : "Tallos";
  const dis = {
    tronco: !(S.tr > 0), ramas: !(masas && S.tr > 0) && m !== "rosetas", tallos: !(masas || m === "multitallo" || m === "hiedra" || GROVE.has(sp)),
    dentado: !(masas || m === "multitallo" || m === "roca"), huecos: !(masas || m === "multitallo"),
    cs: m === "roca", real: !(masas || m === "multitallo"),
  };
  for (const [id, off] of Object.entries(dis)) { $(id).disabled = off; $(id).closest(".range").classList.toggle("off", off); }
  document.querySelector('[data-key="raices"]').disabled = m === "roca";
  syncInputs();
}

for (const el of inputs) {
  el.addEventListener("input", () => {
    const k = el.dataset.key;
    state.values[k] = el.type === "checkbox" ? el.checked : (el.tagName === "SELECT" && !("num" in el.dataset) ? el.value : +el.value);
    syncInputs();
    if (["gp", "gc", "gd", "gr", "perim"].includes(k)) { if (scene) { scene.p = params(); paint(); } return; }
    if (["escala", "tres", "dxfw"].includes(k)) return;
    requestDraw(el.type === "range" ? 90 : 0);
  });
}

// Destino del archivo: CAD conserva todo el perímetro; Revit lo simplifica (y se puede afinar con el deslizador).
document.querySelectorAll("#destSeg button").forEach(b => b.addEventListener("click", () => {
  state.values.simp = +b.dataset.simp;
  syncInputs(); requestDraw();
}));

function showSimplification(p, stats) {
  const all = Object.values(stats || {});
  const before = all.reduce((s, x) => s + x.before, 0), after = all.reduce((s, x) => s + x.after, 0);
  const n = v => v.toLocaleString("es-ES");
  $("simpInfo").textContent = p.simp > 0
    ? `Perímetro exterior: ${n(before)} → ${n(after)} vértices, con una tolerancia de ${fmtNum(Math.max(...all.map(x => x.tol)) * 100)} cm.`
    : `Perímetro exterior con todo el detalle: ${n(before)} vértices. Para Revit, simplifícalo.`;
}

$("tipo").addEventListener("change", e => { state.species = e.target.value; motion.leaves = []; applySpecies(); requestDraw(); });

document.querySelectorAll("#estSeg button").forEach(b => b.addEventListener("click", () => {
  if (b.disabled) return;
  state.values.estacion = b.dataset.s;
  document.querySelectorAll("#estSeg button").forEach(x => x.setAttribute("aria-checked", String(x === b)));
  requestDraw();
}));

document.querySelectorAll(".tabs button").forEach(b => b.addEventListener("click", () => {
  state.view = b.dataset.v;
  document.querySelectorAll(".tabs button").forEach(x => x.setAttribute("aria-selected", String(x === b)));
  updateFicha();
  requestDraw();
}));

const setSeed = s => { state.seed = Math.max(1, Math.min(99999, Math.round(s) || 1)); $("semilla").value = state.seed; requestDraw(); };
$("semilla").addEventListener("change", e => setSeed(+e.target.value));
$("variante").addEventListener("click", () => setSeed(1 + Math.floor(Math.random() * 99998)));
document.addEventListener("keydown", e => {
  if (e.key.toLowerCase() === "r" && !e.metaKey && !e.ctrlKey && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) $("variante").click();
  if (e.key === "Escape") { closeDrawer(); closeExport(); }
});

/* viento */
function setWind(on) {
  motion.wind.on = on;
  $("windOn").setAttribute("aria-checked", String(on));
  document.querySelector(".dock").classList.toggle("windy", on);
  if (on) wake();
}
$("windOn").addEventListener("click", () => setWind(!motion.wind.on));
document.querySelectorAll("#windMode button").forEach(b => b.addEventListener("click", () => {
  motion.wind.mode = b.dataset.m;
  document.querySelectorAll("#windMode button").forEach(x => x.setAttribute("aria-checked", String(x === b)));
  setWind(true);
}));
document.querySelectorAll("#windDir button").forEach(b => b.addEventListener("click", () => {
  motion.wind.dir = +b.dataset.d;
  document.querySelectorAll("#windDir button").forEach(x => x.setAttribute("aria-checked", String(x === b)));
  setWind(true);
}));

/* panel de ajustes */
function openDrawer() {
  $("ajustes").hidden = false;
  requestAnimationFrame(() => { $("ajustes").classList.add("open"); resize(); });
  $("b_ajustes").setAttribute("aria-expanded", "true"); closeExport();
}
function closeDrawer() {
  const d = $("ajustes"); if (d.hidden) return;
  d.classList.remove("open"); $("b_ajustes").setAttribute("aria-expanded", "false"); resize();
  setTimeout(() => { if (!d.classList.contains("open")) d.hidden = true; }, reduceMotion.matches ? 0 : 220);
}
$("b_ajustes").addEventListener("click", () => $("ajustes").hidden ? openDrawer() : closeDrawer());
$("b_cerrar").addEventListener("click", closeDrawer);

/* exportación */
function closeExport() { $("exportar").hidden = true; $("b_export").setAttribute("aria-expanded", "false"); }
$("b_export").addEventListener("click", e => {
  e.stopPropagation();
  const open = $("exportar").hidden;
  $("exportar").hidden = !open; $("b_export").setAttribute("aria-expanded", String(open));
  if (open) $("status").textContent = "";
});
// Cierra el menú al hacer clic fuera (el clic simulado del enlace de descarga no cuenta).
document.addEventListener("click", e => { if (e.isTrusted && !e.target.closest(".export-wrap")) closeExport(); });

async function download(format) {
  const p = params(), list = p.tres || state.view === "tres" ? ["alzado", "planta", "iso"] : [state.view];
  $("status").textContent = "Preparando el archivo…";
  try {
    const {text, filename} = await ask({type: "export", format, params: p, views: list});
    const blob = new Blob([text], {type: format === "dxf" ? "application/dxf" : "image/svg+xml"});
    const a = Object.assign(document.createElement("a"), {href: URL.createObjectURL(blob), download: filename});
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    $("status").textContent = "Descargado: " + filename;
  } catch (err) {
    $("status").textContent = "No se pudo generar el archivo: " + err.message;
  }
}
$("b_dxf").addEventListener("click", () => download("dxf"));
$("b_svg").addEventListener("click", () => download("svg"));

/* ---------- arranque ---------- */
new ResizeObserver(resize).observe($("stage"));
const paintHero = () => heroScene($("heroBack"), $("heroFront"));
let heroTimer = 0;
new ResizeObserver(() => { clearTimeout(heroTimer); heroTimer = setTimeout(paintHero, 200); }).observe(document.querySelector(".hero"));
document.fonts?.ready.then(() => { colors = readColors(document.documentElement); paint(); });
$("tipo").value = state.species;
applySpecies();
requestDraw();
if (!reduceMotion.matches) setTimeout(() => setWind(true), 400);
