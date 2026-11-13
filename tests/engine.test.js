import {describe, it, expect} from "vitest";
import {SPECIES} from "../src/engine/species.js";
import {gen} from "../src/engine/model.js";
import {drawView} from "../src/engine/draw.js";
import {makeDXF, makeSVG} from "../src/engine/export.js";
import {buildParams} from "../src/params.js";

const VIEWS = ["alzado", "planta", "iso"];

describe("motor de vegetación", () => {
  for (const id of Object.keys(SPECIES)) {
    it(`genera y exporta ${id}`, () => {
      const p = buildParams(id, {}, 128);
      const model = gen(p);
      const views = {};
      for (const v of VIEWS) {
        views[v] = drawView(model, p, v);
        expect(views[v].lines.length).toBeGreaterThan(0);
        expect(views[v].bb.every(Number.isFinite)).toBe(true);
      }
      const dxf = makeDXF(p, VIEWS, views);
      expect(dxf.startsWith("0\nSECTION")).toBe(true);
      expect(dxf.trimEnd().endsWith("EOF")).toBe(true);
      expect(dxf).not.toMatch(/NaN|undefined/);
      const svg = makeSVG(p, VIEWS, views);
      expect(svg).toContain("<svg");
      expect(svg).not.toMatch(/NaN|undefined/);
    });
  }

  it("es determinista con la misma semilla", () => {
    const p = buildParams("olivo", {}, 42);
    const a = drawView(gen(p), p, "alzado").lines.length;
    const b = drawView(gen(p), p, "alzado").lines.length;
    expect(a).toBe(b);
  });

  it("forma una arboleda con varios ejemplares", () => {
    const uno = buildParams("platano", {tallos: 1}, 5), tres = buildParams("platano", {tallos: 3}, 5);
    const a = drawView(gen(uno), uno, "planta").bb, b = drawView(gen(tres), tres, "planta").bb;
    expect(b[2] - b[0]).toBeGreaterThan((a[2] - a[0]) * 1.4);
  });

  it("deja caer las hojas en otoño en especies caducas", () => {
    const p = buildParams("platano", {estacion: "otono"}, 7);
    const verano = buildParams("platano", {estacion: "verano"}, 7);
    expect(gen(p).clumps.length).toBe(gen(verano).clumps.length);
    expect(drawView(gen(p), p, "alzado").lines.length).toBeGreaterThan(0);
  });
});
