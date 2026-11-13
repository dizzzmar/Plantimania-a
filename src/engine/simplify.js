// Simplificación del perímetro exterior para Revit.
//
// El perímetro sale de un trazado de la silueta muy fino (miles de vértices y tramos
// de menos de un milímetro). Para CAD está bien, pero Revit descarta las líneas
// más cortas de ~0,8 mm y se atasca con tantos tramos. Aquí se reduce cada anillo
// del perímetro conservando su forma:
//  1. Visvalingam-Whyatt: quita primero los vértices que menos área aportan,
//     así se mantienen los salientes y entrantes que dan carácter a la silueta.
//  2. Tramo mínimo: ningún lado queda por debajo de una longitud mínima.
//  3. Sin autointersecciones: si el anillo se cruza consigo mismo se repite con
//     menos tolerancia (Revit no acepta contornos cruzados en una región rellena).
//  4. Se eliminan islas y huecos diminutos que a esa escala ya no se leen.

const MIN_SEGMENT = 0.004; // 4 mm: holgado frente al mínimo de Revit (~0,8 mm)

// Tolerancia en metros según la cantidad de simplificación (0 = nada, 1 = máxima).
export function toleranceFor(bb, amount) {
  if (!(amount > 0)) return 0;
  const size = Math.max(bb[2] - bb[0], bb[3] - bb[1]);
  return size * 0.0008 * Math.pow(30, Math.min(1, amount));
}

export function ringArea(P) {
  let A = 0;
  for (let i = 0, n = P.length; i < n; i++) { const a = P[i], b = P[(i + 1) % n]; A += a[0] * b[1] - b[0] * a[1]; }
  return A / 2;
}

const triArea = (a, b, c) => Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2;

// Montículo mínimo de [área, índice, versión].
class Heap {
  constructor() { this.a = []; }
  get size() { return this.a.length; }
  push(x) {
    const a = this.a; a.push(x);
    let i = a.length - 1;
    while (i > 0) { const p = (i - 1) >> 1; if (a[p][0] <= a[i][0]) break; [a[p], a[i]] = [a[i], a[p]]; i = p; }
  }
  pop() {
    const a = this.a, top = a[0], last = a.pop();
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < a.length && a[l][0] < a[m][0]) m = l;
        if (r < a.length && a[r][0] < a[m][0]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]]; i = m;
      }
    }
    return top;
  }
}

// Visvalingam-Whyatt sobre un anillo abierto (sin repetir el primer punto).
function visvalingam(P, minArea, keep) {
  const n = P.length;
  if (n <= keep) return P.slice();
  const prev = new Int32Array(n), next = new Int32Array(n), area = new Float64Array(n), ver = new Int32Array(n);
  const alive = new Uint8Array(n).fill(1);
  const heap = new Heap();
  for (let i = 0; i < n; i++) {
    prev[i] = (i - 1 + n) % n; next[i] = (i + 1) % n;
    area[i] = triArea(P[prev[i]], P[i], P[next[i]]);
    heap.push([area[i], i, 0]);
  }
  let left = n, floor = 0;
  while (heap.size && left > keep) {
    const [A, i, v] = heap.pop();
    if (!alive[i] || v !== ver[i]) continue;
    if (A >= minArea) break;
    floor = Math.max(floor, A);
    alive[i] = 0; left--;
    const a = prev[i], b = next[i];
    next[a] = b; prev[b] = a;
    for (const k of [a, b]) {
      area[k] = Math.max(floor, triArea(P[prev[k]], P[k], P[next[k]]));
      ver[k]++;
      heap.push([area[k], k, ver[k]]);
    }
  }
  let s = 0; while (!alive[s]) s++;
  const out = [];
  let i = s;
  do { out.push(P[i]); i = next[i]; } while (i !== s);
  return out;
}

// Junta vértices que dejarían un tramo más corto que minLen.
function enforceMinSegment(P, minLen) {
  const out = [P[0]];
  for (let i = 1; i < P.length; i++) {
    const l = out[out.length - 1];
    if (Math.hypot(P[i][0] - l[0], P[i][1] - l[1]) >= minLen) out.push(P[i]);
  }
  while (out.length > 3) {
    const a = out[out.length - 1], b = out[0];
    if (Math.hypot(a[0] - b[0], a[1] - b[1]) >= minLen) break;
    out.pop();
  }
  return out;
}

// ¿Se cruza el anillo consigo mismo? (lados no contiguos)
export function selfIntersects(P) {
  const n = P.length;
  const o = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  for (let i = 0; i < n; i++) {
    const a = P[i], b = P[(i + 1) % n];
    const minx = Math.min(a[0], b[0]), maxx = Math.max(a[0], b[0]), miny = Math.min(a[1], b[1]), maxy = Math.max(a[1], b[1]);
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue;
      const c = P[j], d = P[(j + 1) % n];
      if (Math.max(c[0], d[0]) < minx || Math.min(c[0], d[0]) > maxx || Math.max(c[1], d[1]) < miny || Math.min(c[1], d[1]) > maxy) continue;
      const d1 = o(c, d, a), d2 = o(c, d, b), d3 = o(a, b, c), d4 = o(a, b, d);
      if ((d1 > 0) !== (d2 > 0) && (d3 > 0) !== (d4 > 0)) return true;
    }
  }
  return false;
}

// Simplifica un anillo cerrado (último punto = primero). Devuelve el anillo cerrado.
export function simplifyRing(ring, tol) {
  const closed = ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1];
  const P = closed ? ring.slice(0, -1) : ring.slice();
  if (P.length < 4 || !(tol > 0)) return ring;
  let t = tol, best = null;
  for (let attempt = 0; attempt < 6; attempt++) {
    let Q = visvalingam(P, t * t, 6);
    Q = enforceMinSegment(Q, Math.max(MIN_SEGMENT, t * 0.8));
    if (Q.length >= 4 && !selfIntersects(Q)) { best = Q; break; }
    t *= 0.6;
  }
  if (!best) best = enforceMinSegment(P, MIN_SEGMENT);
  return best.concat([best[0].slice()]);
}

// Aplica la simplificación al perímetro de una vista ya dibujada (y a su relleno).
export function simplifyView(view, amount) {
  const rings = view.lines.filter(l => l.layer === "VEG_PERIMETRO" && l.closed);
  const before = rings.reduce((s, l) => s + l.pts.length - 1, 0);
  if (!(amount > 0) || !rings.length) return {view, stats: {before, after: before, tol: 0}};

  const tol = toleranceFor(view.bb, amount);
  // Islas y huecos menores que esto ya no se leen a esta tolerancia.
  const minIsland = Math.pow(tol * 5, 2), minHole = Math.pow(tol * 4, 2);
  const outers = rings.filter(l => l.outer);
  const largest = outers.reduce((m, l) => Math.abs(ringArea(l.pts)) > Math.abs(ringArea(m ? m.pts : [])) ? l : m, null);

  const map = new Map();
  const lines = [];
  for (const l of view.lines) {
    if (l.layer !== "VEG_PERIMETRO" || !l.closed) { lines.push(l); continue; }
    const A = Math.abs(ringArea(l.pts));
    if (l !== largest && A < (l.outer ? minIsland : minHole)) { map.set(l.pts, null); continue; }
    const pts = simplifyRing(l.pts, tol);
    map.set(l.pts, pts);
    lines.push({...l, pts});
  }
  const pick = r => map.has(r) ? map.get(r) : r;
  const white = view.white
    .map(w => ({outer: pick(w.outer), holes: w.holes.map(pick).filter(Boolean)}))
    .filter(w => w.outer);
  const after = lines.filter(l => l.layer === "VEG_PERIMETRO" && l.closed).reduce((s, l) => s + l.pts.length - 1, 0);
  return {view: {...view, lines, white}, stats: {before, after, tol}};
}
