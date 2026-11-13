import {describe, it, expect} from "vitest";
import {gen} from "../src/engine/model.js";
import {drawView} from "../src/engine/draw.js";
import {makeDXF} from "../src/engine/export.js";
import {simplifyView, selfIntersects, ringArea} from "../src/engine/simplify.js";
import {buildParams} from "../src/params.js";

const perimeter = v => v.lines.filter(l => l.layer === "VEG_PERIMETRO" && l.closed);
const outerArea = v => perimeter(v).filter(l => l.outer).reduce((s, l) => s + Math.abs(ringArea(l.pts)), 0);

describe("simplificación del perímetro para Revit", () => {
  for (const [id, view] of [["olivo", "alzado"], ["platano", "planta"], ["arbusto", "alzado"], ["palmera", "planta"]]) {
    it(`${id} en ${view}: menos vértices sin perder la forma`, () => {
      const p = buildParams(id, {}, 128);
      const full = drawView(gen(p), p, view);
      const {view: simple, stats} = simplifyView(full, 0.6);
      expect(stats.after).toBeLessThan(stats.before / 10);
      for (const l of perimeter(simple)) {
        const P = l.pts;
        expect(P[0]).toEqual(P[P.length - 1]);                      // sigue cerrada
        expect(selfIntersects(P.slice(0, -1))).toBe(false);          // sin cruces
        for (let i = 1; i < P.length; i++)                           // ningún tramo por debajo de 4 mm
          expect(Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1])).toBeGreaterThanOrEqual(0.004 - 1e-9);
      }
      expect(Math.abs(outerArea(simple) - outerArea(full)) / outerArea(full)).toBeLessThan(0.03);
      // el relleno usa los mismos anillos simplificados
      const rings = new Set(perimeter(simple).map(l => l.pts));
      for (const w of simple.white) expect(rings.has(w.outer)).toBe(true);
    });
  }

  it("sin simplificar deja el dibujo igual (CAD)", () => {
    const p = buildParams("olivo", {}, 128);
    const full = drawView(gen(p), p, "alzado");
    expect(simplifyView(full, 0).view).toBe(full);
  });

  it("el DXF simplificado lleva muchos menos vértices en el perímetro", () => {
    const p = buildParams("pino", {simp: 0.6}, 128);
    const full = drawView(gen(p), p, "alzado");
    const {view} = simplifyView(full, p.simp);
    const count = dxf => dxf.split("\n8\nVEG_PERIMETRO\n").length;
    expect(count(makeDXF(p, ["alzado"], {alzado: view}))).toBeLessThan(count(makeDXF(p, ["alzado"], {alzado: full})) / 10);
  });
});
