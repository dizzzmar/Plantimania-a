import {SPECIES, GROVE} from "./engine/species.js";
import {DEFAULT_SETTINGS, speciesDefaults, buildParams} from "./params.js";
import {createStage} from "./stage.js";
import {SUGGESTIONS} from "./config.js";

const $ = id => document.getElementById(id);
const fmtNum = (v, d = 1) => Number(v).toLocaleString("es-ES", {minimumFractionDigits: d, maximumFractionDigits: d});

/* ---------- estado ---------- */
const state = {
  species: "olivo",
  seed: 128,
  view: "alzado",
  values: {...DEFAULT_SETTINGS, ...speciesDefaults("olivo")},
};
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
// La hoja del tablero: el cajetín ocupa el pie, así que el dibujo se encaja por encima.
function inset() {
  const stage = $("stage"), s = stage.getBoundingClientRect();
  const c = stage.querySelector(".cajetin").getBoundingClientRect();
  const drawer = $("ajustes"), wr = $("workspace").getBoundingClientRect();
  const open = innerWidth > 860 && drawer.classList.contains("open");
  const right = open ? Math.max(0, s.right - (wr.right - 12 - drawer.offsetWidth) + 16) : 0;
  return {bottom: Math.max(0, s.bottom - c.top), right, left: c.left - s.left};
}
const stage = createStage($("cv"), {inset, onTouch: () => $("hint").classList.add("gone")});
const motion = stage.motion;
const resize = () => stage.resize();

// Al cambiar de vista, especie o variante, la hoja anterior se queda un momento
// translúcida encima, como un papel vegetal que se retira.
let wantGhost = false;
function ghostOut() {
  if (reduceMotion.matches || !stage.scene) return;
  const g = $("ghost");
  g.style.backgroundImage = `url(${$("cv").toDataURL("image/png")})`;
  g.classList.remove("go"); void g.offsetWidth; g.classList.add("go");
}

let drawTimer = 0, latest = 0;
function requestDraw(delay = 0, ghost = false) {
  wantGhost = wantGhost || ghost;
  clearTimeout(drawTimer);
  drawTimer = setTimeout(async () => {
    const id = ++latest, p = params(), list = viewList();
    $("busy").hidden = false;
    try {
      const res = await ask({type: "draw", params: p, views: list});
      if (id !== latest) return;
      if (wantGhost) ghostOut();
      wantGhost = false;
      stage.setScene(p, list, res.views);
      drawnBox = res.views[list[0]].bb; showMedidas();
      const total = list.reduce((s, v) => s + res.views[v].count, 0);
      $("meta").textContent = res.name + " · " + total.toLocaleString("es-ES") + " polilíneas";
      showSimplification(p, res.stats);
    } catch (err) {
      console.error(err);
    } finally {
      if (id === latest) $("busy").hidden = true;
    }
  }, delay);
}
const wake = () => stage.wake();
const paint = () => stage.paint();

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

// Cada celda del cajetín "teclea" al cambiar de valor.
function cell(id, text) {
  const el = $(id);
  if (el.textContent === String(text)) return;
  el.textContent = text;
  if (reduceMotion.matches) return;
  el.classList.remove("tick"); void el.offsetWidth; el.classList.add("tick");
}

// Las medidas del cajetín son las del dibujo (la misma altura que marca la cota).
let drawnBox = null;
function showMedidas() {
  if (!drawnBox) return;
  const grove = GROVE.has(state.species) && state.values.tallos > 1 ? `, ${state.values.tallos} ejemplares` : "";
  cell("f_medidas", `${fmtNum(drawnBox[2] - drawnBox[0], 2)} × ${fmtNum(drawnBox[3] - drawnBox[1], 2)} m${grove}`);
}

function updateFicha() {
  const S = SPECIES[state.species], v = state.values;
  cell("f_nombre", $("tipo").selectedOptions[0].textContent.replace(/\s*\(.*\)$/, ""));
  cell("f_vista", {alzado: "Alzado", planta: "Planta", iso: "Isométrica", tres: "Las tres vistas"}[state.view]);
  cell("f_lamina", state.seed);
  cell("f_escala", "1:" + state.values.escala);
    showMedidas();
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
  $("estNota").hidden = !!S.caduca;
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

$("tipo").addEventListener("change", e => { state.species = e.target.value; motion.leaves = []; applySpecies(); requestDraw(0, true); });

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
  requestDraw(0, true);
}));

const setSeed = s => { state.seed = Math.max(1, Math.min(99999, Math.round(s) || 1)); $("semilla").value = state.seed; updateFicha(); requestDraw(0, true); };
$("semilla").addEventListener("change", e => setSeed(+e.target.value));
$("variante").addEventListener("click", e => {
  const b = e.currentTarget; b.classList.remove("rolling"); void b.offsetWidth; b.classList.add("rolling");
  setSeed(1 + Math.floor(Math.random() * 99998));
});
document.addEventListener("keydown", e => {
  if (e.key.toLowerCase() === "r" && !e.metaKey && !e.ctrlKey && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) $("variante").click();
  if (e.key === "Escape") { closeDrawer(); closeExport(); }
});

/* viento */
function setWind(on) {
  motion.wind.on = on;
  $("windOn").setAttribute("aria-checked", String(on));
  document.querySelector(".controls").classList.toggle("windy", on);
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
  $("workspace").classList.add("has-drawer");
  requestAnimationFrame(() => { $("ajustes").classList.add("open"); resize(); });
  $("b_ajustes").setAttribute("aria-expanded", "true"); closeExport();
}
function closeDrawer() {
  const d = $("ajustes"); if (d.hidden) return;
  d.classList.remove("open"); $("workspace").classList.remove("has-drawer"); $("b_ajustes").setAttribute("aria-expanded", "false"); resize();
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

/* ---------- buzón de sugerencias ---------- */
const dlg = $("sugerencias"), form = $("f_sug"), sugStatus = $("sugStatus");
const setSugStatus = (text, error = false) => { sugStatus.textContent = text; sugStatus.classList.toggle("error", error); };
$("b_sugerencias").addEventListener("click", () => { closeExport(); closeDrawer(); setSugStatus(""); dlg.showModal(); $("sug_msg").focus(); });
$("b_sug_cerrar").addEventListener("click", () => dlg.close());
dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });  // clic en el fondo

form.addEventListener("submit", async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  if (!data.message.trim()) { setSugStatus("Escribe tu sugerencia antes de enviarla.", true); $("sug_msg").focus(); return; }
  if (data.email && !form.elements.email.checkValidity()) { setSugStatus("Revisa el correo: parece que le falta algo.", true); form.elements.email.focus(); return; }
  if (!SUGGESTIONS.accessKey) { setSugStatus("El buzón todavía no está conectado a un correo, así que el mensaje no se ha enviado.", true); return; }
  const btn = $("b_sug_enviar");
  btn.disabled = true; btn.textContent = "Enviando…"; setSugStatus("");
  try {
    const res = await fetch(SUGGESTIONS.endpoint, {
      method: "POST",
      headers: {"Content-Type": "application/json", Accept: "application/json"},
      body: JSON.stringify({
        access_key: SUGGESTIONS.accessKey,
        subject: "Nueva sugerencia en Plantimanía",
        from_name: "Plantimanía",
        name: data.name || "Anónimo",
        email: data.email || undefined,
        message: data.message,
        contexto: `${$("tipo").selectedOptions[0].textContent}, vista ${state.view}, variante ${state.seed}`,
        botcheck: data.botcheck ? true : undefined,
      }),
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok || out.success === false) throw new Error(out.message || res.status);
    form.reset();
    setSugStatus("Enviada. Gracias por escribir.");
  } catch (err) {
    setSugStatus("No se ha podido enviar. Inténtalo de nuevo en un momento.", true);
  } finally {
    btn.disabled = false; btn.textContent = "Enviar sugerencia";
  }
});

/* ---------- tema: claro (papel vegetal) u oscuro (mesa de luz) ---------- */
function setTheme(t, save = true) {
  if (t !== "claro" && t !== "oscuro") t = "claro";
  document.documentElement.dataset.theme = t;
  $("b_tema").setAttribute("aria-pressed", String(t === "oscuro"));
  $("b_tema").setAttribute("aria-label", t === "oscuro" ? "Modo claro" : "Modo oscuro");
  document.querySelector('meta[name="theme-color"]').content = t === "oscuro" ? "#121923" : "#f7f8f5";
  if (save) try { localStorage.setItem("plantimania-tema", t); } catch {}
  stage.refreshColors(); portada.refreshColors();
}
$("b_tema").addEventListener("click", () => setTheme(document.documentElement.dataset.theme === "oscuro" ? "claro" : "oscuro"));

/* ---------- portada: un olivo vivo sobre la hoja ---------- */
const portada = createStage($("cvPortada"), {onTouch: () => $("cvPortada").closest(".portada-hoja").classList.add("tocado")});
ask({type: "draw", params: buildParams("olivo", {...DEFAULT_SETTINGS, ...speciesDefaults("olivo")}, 128), views: ["alzado"]})
  .then(res => { portada.setScene(buildParams("olivo", {...DEFAULT_SETTINGS, ...speciesDefaults("olivo")}, 128), ["alzado"], res.views); route(); })
  .catch(console.error);
$("cvPortada").closest(".portada-hoja").addEventListener("pointerdown", () => $("cvPortada").closest(".portada-hoja").classList.add("tocado"));
new ResizeObserver(() => portada.resize()).observe($("cvPortada"));

// #generador abre la herramienta; cualquier otra dirección muestra la portada.
function route() {
  const inApp = location.hash === "#generador";
  $("inicio").hidden = inApp;
  document.querySelector(".app").inert = !inApp;
  portada.motion.wind.on = !inApp && !reduceMotion.matches;
  if (inApp) setTimeout(resize, 30); else { portada.resize(); portada.wake(); }
}
addEventListener("hashchange", route);

document.querySelectorAll(".fecha-hoy").forEach(el => { el.textContent = new Date().toLocaleDateString("es-ES", {day: "2-digit", month: "2-digit", year: "numeric"}); });

/* ---------- arranque ---------- */
new ResizeObserver(resize).observe($("stage"));
$("stage").querySelector(".cajetin").addEventListener("transitionend", () => resize());
document.fonts?.ready.then(() => { stage.refreshColors(); portada.refreshColors(); });
$("tipo").value = state.species;
applySpecies();
requestDraw();
setTheme(document.documentElement.dataset.theme, false);
route();
if (!reduceMotion.matches) setTimeout(() => setWind(true), 400);
