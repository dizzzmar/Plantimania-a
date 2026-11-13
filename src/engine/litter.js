// Hojarasca de otoño para la planta y la isométrica.
//
// En otoño las especies caducas dejan hojas en el suelo alrededor de la copa.
// Cada hoja tiene la forma de su especie, su propio perímetro cerrado (para
// rellenarlo de blanco), nervios de detalle y una pequeña altura de curvatura
// que le hace proyectar sombra. Se rigen por los ajustes de la planta:
// tamaño de hoja (cs), cantidad de follaje (dens), dentado (jag) y semilla.
import {mulberry, U} from "./random.js";

// Forma de hoja por especie. L = largo real aproximado en metros.
const SHAPES = {
  platano:    {kind: "palmada", L: 0.20, w: 0.30, lobes: [[0, .62], [.95, .55], [-.95, .55], [1.85, .3], [-1.85, .3]]},
  redonda:    {kind: "palmada", L: 0.13, w: 0.20, lobes: [[0, .7], [1.0, .62], [-1.0, .62], [1.95, .38], [-1.95, .38]]},
  joven:      {kind: "ovada", L: 0.09, W: 0.50, teeth: 1},
  multitallo: {kind: "eliptica", L: 0.06, W: 0.55, teeth: 0},
  rosetas:    {kind: "obovada", L: 0.28, W: 0.34, teeth: 0},
  arbusto:    {kind: "ovada", L: 0.05, W: 0.55, teeth: 0.6},
};

const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));

// Contorno y nervios en coordenadas locales: base del limbo en (0,0), punta hacia +x, largo 1.
function leafShape(S, jag, R) {
  const outline = [], veins = [];
  if (S.kind === "palmada") {
    const C = [0.5, 0], n = 64, ph = R() * 6.28;
    const rad = th => {
      let r = 0.32;
      for (const [a, amp] of S.lobes) r += amp * Math.exp(-Math.abs(wrap(th - a)) / S.w);
      r *= 0.55 + 0.45 * Math.min(1, Math.abs(wrap(th - Math.PI)) / 0.6);   // seno junto al pecíolo
      return 0.5 * r;
    };
    for (let i = 0; i < n; i++) {
      const th = -Math.PI + 2 * Math.PI * i / n;
      let r = rad(th);
      if (r > 0.22) r += jag * 0.018 * Math.sin(th * 22 + ph);                 // dientes del borde
      outline.push([C[0] + Math.cos(th) * r, C[1] + Math.sin(th) * r]);
    }
    const B = [C[0] - rad(Math.PI), 0];
    for (const [a] of S.lobes) { const r = rad(a) * 0.9; veins.push([B, [C[0] + Math.cos(a) * r, C[1] + Math.sin(a) * r]]); }
    veins.push([B, [B[0] - 0.22, 0.02]]);                                        // pecíolo
  } else {
    const n = 18, prof = {
      ovada: t => Math.pow(Math.sin(Math.PI * Math.pow(t, 0.7)), 0.9),
      eliptica: t => Math.pow(Math.sin(Math.PI * t), 0.85),
      obovada: t => Math.pow(Math.sin(Math.PI * Math.pow(t, 1.5)), 0.75),
    }[S.kind];
    const half = t => S.W / 2 * prof(t);
    const tooth = i => (S.teeth && i > 1 && i < n - 1) ? (i % 2 ? 1 : -1) * S.teeth * jag * 0.025 : 0;
    for (let i = 0; i <= n; i++) { const t = i / n; outline.push([t, half(t) + tooth(i)]); }
    for (let i = n - 1; i >= 1; i--) { const t = i / n; outline.push([t, -half(t) - tooth(i)]); }
    veins.push([[0, 0], [0.97, 0]]);
    for (const t of [0.22, 0.42, 0.62]) for (const sg of [-1, 1]) veins.push([[t, 0], [t + 0.16, sg * half(t + 0.16) * 0.8]]);
    veins.push([[0, 0], [-0.16, 0.01]]);                                         // pecíolo
  }
  return {outline, veins};
}

export function hasLitter(species) { return !!SHAPES[species]; }

// Hojas en 3D (y = altura de curvatura) alrededor de cada tronco del ejemplar o la arboleda.
export function genLitter(model, p) {
  const S = SHAPES[p.species];
  if (!S) return [];
  const R = mulberry(p.seed * 53 + 11);
  const bases = model.limbs.filter(L => L.trunk && L.pts[0][1] <= 1e-9).map(L => L.pts[0]);
  if (!bases.length) bases.push([0, 0, 0]);
  // En árboles grandes la hoja se dibuja mayor que la real (hasta ×2,2, en torno al 4 %
  // del ancho de copa) para que se lea en el plano, como se hace a mano.
  const Rtree = p.W / 2, size0 = S.L * Math.min(2.2, Math.max(1, p.W * 0.04 / S.L)) * p.cs;
  const perTree = Math.round(80 * p.dens * Math.min(2, Math.max(1, 0.2 / S.L)));
  const total = Math.min(400, perTree * bases.length);
  const leaves = [];
  for (let k = 0, tries = 0; leaves.length < total && tries < total * 10; tries++) {
    const b = bases[k++ % bases.length];
    const a = R() * 6.283, r = Rtree * (0.7 + 0.85 * Math.pow(R(), 1.6));   // más hojas junto al goteo de la copa
    const cx = b[0] + Math.cos(a) * r, cz = b[2] + Math.sin(a) * r, s = size0 * U(R, 0.8, 1.2);
    if (leaves.some(o => Math.hypot(o.cx - cx, o.cz - cz) < 0.55 * (o.s + s))) continue; // sin solaparse
    const phi = R() * 6.283, cs = Math.cos(phi), sn = Math.sin(phi);
    const h = Math.max(0.004, U(R, 0.006, 0.03) * s / 0.2);
    const {outline, veins} = leafShape(S, p.jag, R);
    const to3 = ([u, w]) => { const x = (u - 0.5) * s, y = w * s; return [cx + x * cs - y * sn, h, cz + x * sn + y * cs]; };
    leaves.push({cx, cz, s, h, outline: outline.map(to3), veins: veins.map(v => v.map(to3))});
  }
  return leaves;
}
