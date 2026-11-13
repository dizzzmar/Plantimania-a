// Worker de dibujo: genera el modelo y las vistas fuera del hilo principal,
// así la interfaz y la animación no se congelan mientras se calcula.
import {gen} from "./engine/model.js";
import {drawView} from "./engine/draw.js";
import {makeDXF, makeSVG, blockName} from "./engine/export.js";

const LAYER_CODES = ["VEG_PERIMETRO", "VEG_CONTORNO", "VEG_DETALLE", "VEG_RAICES"];

// Lo que cambia el modelo 3D; los grosores y la escala no obligan a regenerarlo.
const IGNORED = ["gp", "gc", "gd", "gr", "escala", "perim", "dxfw", "tres"];
const keyOf = p => JSON.stringify(Object.assign({}, p, Object.fromEntries(IGNORED.map(k => [k, 0]))));

let cacheKey = null, model = null, views = {};

function ensure(p, list) {
  const key = keyOf(p);
  if (key !== cacheKey) { cacheKey = key; model = gen(p); views = {}; }
  for (const v of list) if (!views[v]) views[v] = drawView(model, p, v);
}

// Empaqueta polilíneas en arrays planos transferibles.
function packRings(rings) {
  let n = 0; for (const r of rings) n += r.length;
  const xy = new Float32Array(n * 2), start = new Uint32Array(rings.length + 1);
  let k = 0;
  rings.forEach((r, i) => { start[i] = k; for (const q of r) { xy[2 * k] = q[0]; xy[2 * k + 1] = q[1]; k++; } });
  start[rings.length] = k;
  return {xy, start};
}

function pack(v) {
  const lines = packRings(v.lines.map(l => l.pts));
  const layer = Uint8Array.from(v.lines.map(l => Math.max(0, LAYER_CODES.indexOf(l.layer))));
  const white = packRings(v.white.flatMap(w => [w.outer, ...w.holes]));
  const shadow = packRings(v.shadow);
  const crown = packRings(v.lines.filter(l => l.layer === "VEG_PERIMETRO" && l.outer).map(l => l.pts));
  return {
    bb: v.bb, lines: {...lines, layer}, white, shadow, crown,
    count: v.lines.length,
    transfer: [lines.xy.buffer, lines.start.buffer, layer.buffer, white.xy.buffer, white.start.buffer,
      shadow.xy.buffer, shadow.start.buffer, crown.xy.buffer, crown.start.buffer],
  };
}

self.onmessage = e => {
  const {type, id, params, views: list} = e.data;
  try {
    ensure(params, list);
    if (type === "draw") {
      const out = {}, transfer = [];
      for (const v of list) { const pk = pack(views[v]); transfer.push(...pk.transfer); delete pk.transfer; out[v] = pk; }
      const name = blockName(params, list.length > 1 ? "3V" : list[0]);
      self.postMessage({type, id, views: out, name}, transfer);
    } else if (type === "export") {
      const name = blockName(params, list.length > 1 ? "3V" : list[0]);
      const text = e.data.format === "dxf" ? makeDXF(params, list, views) : makeSVG(params, list, views);
      const filename = e.data.format === "dxf" ? name + ".dxf" : name + "_1-" + params.escala + ".svg";
      self.postMessage({type, id, text, filename});
    }
  } catch (err) {
    self.postMessage({type: "error", id, message: String(err && err.message || err)});
  }
};
