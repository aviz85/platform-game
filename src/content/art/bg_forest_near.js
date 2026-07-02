// AETHERFALL — bg_forest_near — LUMEN WOODS near parallax layer (factor 0.7)
// A close, dense dark-teal tree line: massive mossy trunks, lush layered
// canopies over a deep forest backdrop band, dim living-crystal formations,
// small amber lanterns of the lost civilization hanging on chains, glowing
// mushrooms, fireflies and feathered violet mist.
// Transparent above, seamless horizontal tiling (all drawing goes through
// modulo-wrapped primitives), deliberately darker than gameplay tiles.
import { PAL } from './palette.js';
import { makeCanvas, P, R, rng, shade } from './util.js';

const W = 640, H = 270;
const TAU = Math.PI * 2;
const GROUND = 246; // top of undergrowth band

export function build() {
  const c = makeCanvas(W, H);
  const ctx = c.getContext('2d');
  const rnd = rng(40713);

  // ---- palette (kept darker than gameplay tiles; emissives are tiny) ----
  const C = {
    backBand: shade(PAL.leaf3, -0.70),   // deep forest mass behind everything
    backBandL: shade(PAL.leaf3, -0.60),
    backTrunk: shade(PAL.deepPurple, -0.40),
    backLeafD: shade(PAL.leaf3, -0.64),
    backLeaf: shade(PAL.leaf3, -0.54),
    backLeafL: shade(PAL.leaf3, -0.42),

    trunkD: shade(PAL.deepPurple, -0.18),
    trunk: PAL.deepPurple,
    trunkL: shade(PAL.shadow, -0.18),
    moss: shade(PAL.moss2, -0.30),

    leafD: shade(PAL.leaf3, -0.40),
    leaf: shade(PAL.leaf3, -0.20),
    leafRim: shade(PAL.leaf2, -0.36),
    vine: shade(PAL.moss2, -0.24),

    cryD: shade(PAL.cyan3, -0.42),
    cry: shade(PAL.cyan3, -0.15),
    cryL: shade(PAL.cyan2, -0.25),
    cryHot: PAL.cyan1,

    chain: shade(PAL.metal2, -0.15),
    lampCap: shade(PAL.amber2, -0.45),
    lampBody: shade(PAL.amber1, -0.15),
    lampHot: PAL.amber0,

    groundD: shade(PAL.void, 0.02),
    ground: shade(PAL.deepPurple, -0.35),
    tuft: shade(PAL.moss2, -0.42),
    tuftL: shade(PAL.moss2, -0.26),

    mist: PAL.violet3,
    mistHi: shade(PAL.violet3, 0.12),
  };

  // ---- wrapped drawing helpers (guarantee left edge meets right edge) ----
  const wx = (x) => (((Math.round(x)) % W) + W) % W;
  const wP = (x, y, col) => { if (y >= 0 && y < H) P(ctx, wx(x), y, col); };
  const wR = (x, y, w, h, col) => {
    x = Math.round(x); w = Math.round(w);
    if (w <= 0 || h <= 0) return;
    const sx = wx(x);
    if (sx + w <= W) R(ctx, sx, y, w, h, col);
    else { R(ctx, sx, y, W - sx, h, col); R(ctx, 0, y, w - (W - sx), h, col); }
  };
  const wLine = (x0, y0, x1, y1, col) => {
    x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0;
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      wP(x0, y0, col);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  };
  const wEllipse = (cx, cy, rx, ry, col) => {
    rx = Math.max(1, Math.round(rx)); ry = Math.max(1, Math.round(ry));
    for (let dy = -ry; dy <= ry; dy++) {
      const hw = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry))));
      wR(cx - hw, Math.round(cy) + dy, hw * 2 + 1, 1, col);
    }
  };
  const wCircle = (cx, cy, r, col) => wEllipse(cx, cy, r, r, col);
  const wGlow = (cx, cy, r, col) => {
    ctx.save();
    ctx.globalAlpha = 0.2;
    wCircle(cx, cy, r, col);
    ctx.globalAlpha = 0.38;
    wCircle(cx, cy, Math.max(1, r >> 1), col);
    ctx.restore();
  };
  // wrapped checker dither row (seam-safe because W is even)
  const wDitherRow = (x, y, w, c1, c2) => {
    x = Math.round(x);
    for (let i = 0; i < w; i++) wP(x + i, y, ((x + i + y) & 1) ? c1 : c2);
  };
  // feathered patchy fog: checkered pixels; alpha rises/falls through the
  // band vertically AND drifts horizontally (periodic in W, so seam-safe)
  const mistBand = (y0, h, peak, col, ph = 0) => {
    ctx.save();
    for (let j = 0; j < h; j++) {
      const fv = Math.sin((Math.PI * (j + 0.5)) / h);
      for (let x0 = 0; x0 < W; x0 += 8) {
        const fh = 0.55 + 0.45 * Math.sin((TAU * 2 * x0) / W + ph + j * 0.22);
        ctx.globalAlpha = peak * fv * fh;
        for (let x = x0 + (j & 1); x < x0 + 8; x += 2) P(ctx, x, y0 + j, col);
      }
    }
    ctx.restore();
  };
  // periodic heightfield — integer harmonics of W wrap perfectly at the seam
  const heightAt = (x, base, waves) => {
    let y = base;
    for (const [k, amp, ph] of waves) y += amp * Math.sin((TAU * k * x) / W + ph);
    return Math.round(y);
  };

  // ---- canopy blob: rim light upper-left, dark dithered underside ----
  function blob(cx, cy, rx, ry, body, rim, dark) {
    cx = Math.round(cx); cy = Math.round(cy);
    rx = Math.max(3, Math.round(rx)); ry = Math.max(3, Math.round(ry));
    wEllipse(cx, cy, rx, ry, rim);                     // rim base
    wEllipse(cx + 1, cy + 1, rx - 1, ry - 1, body);    // body leaves UL crescent
    const from = Math.max(1, Math.floor(ry * 0.3));
    for (let dy = from; dy <= ry; dy++) {              // shadowed underside
      const hw = Math.floor((rx - 1) * Math.sqrt(Math.max(0, 1 - (dy * dy) / ((ry - 1) * (ry - 1)))));
      if (dy === from) wDitherRow(cx + 1 - hw, cy + 1 + dy, hw * 2 + 1, body, dark);
      else wR(cx + 1 - hw, cy + 1 + dy, hw * 2 + 1, 1, dark);
    }
    for (let k = 0; k < 4; k++) {                      // leaf clump texture, lit side
      const a = rnd() * Math.PI - Math.PI * 0.9;
      wR(cx + Math.round(Math.cos(a) * rx * 0.55), cy + Math.round(Math.sin(a) * ry * 0.55), 2, 1, rim);
    }
  }

  // ---- full crown: overlapping blob cluster + scalloped underside ----
  function crown(cx, cy, s, body, rim, dark) {
    const jx = () => Math.round((rnd() - 0.5) * s * 0.18);            // organic jitter
    wEllipse(cx, cy + s * 0.22, s * 1.18, s * 0.62, dark);            // under-mass
    blob(cx - s * 0.80 + jx(), cy + s * 0.24, s * 0.52, s * 0.36, body, rim, dark);
    blob(cx + s * 0.78 + jx(), cy + s * 0.28, s * 0.55, s * 0.38, body, rim, dark);
    blob(cx - s * 0.36 + jx(), cy - s * 0.26 + jx(), s * 0.58, s * 0.42, body, rim, dark);
    blob(cx + s * 0.40 + jx(), cy - s * 0.22 + jx(), s * 0.52, s * 0.38, body, rim, dark);
    blob(cx, cy, s * 0.80, s * 0.52, body, rim, dark);                // main crown
    const bot = Math.round(cy + s * 0.62);                            // scalloped bottom
    for (let i = -Math.round(s * 1.0); i <= Math.round(s * 1.0); i += 5) {
      wCircle(cx + i, bot - Math.round(Math.abs(i) * 0.22), 2, dark);
    }
  }

  // ---- hanging vine with dim bioluminescent tip ----
  function vine(x, y, len, litTip) {
    let vx = Math.round(x);
    for (let i = 0; i < len; i++) {
      if (i > 2 && (i % 5) === 0) vx += rnd() < 0.5 ? -1 : 1;
      wP(vx, y + i, C.vine);
      if ((i % 4) === 2) wP(vx + ((i % 8) < 4 ? 1 : -1), y + i, C.leafD);
    }
    if (litTip) { wP(vx, y + len, C.cryL); wGlow(vx, y + len, 2, PAL.cyan2); }
    else wP(vx, y + len, C.leafD);
  }

  // ---- amber lantern on a chain (the lost civilization's lights) ----
  function lantern(x, y, chainLen) {
    x = Math.round(x); y = Math.round(y);
    for (let i = 0; i < chainLen; i++) wP(x, y + i, (i & 1) ? C.chain : C.trunkD);
    const ly = y + chainLen;
    wR(x - 1, ly, 3, 1, C.lampCap);          // top cap
    wR(x - 2, ly + 1, 5, 3, C.lampCap);      // frame
    wR(x - 1, ly + 1, 3, 3, C.lampBody);     // glass
    wP(x, ly + 2, C.lampHot);                // hot core
    wP(x - 1, ly + 1, PAL.amber1);           // upper-left light
    wR(x - 1, ly + 4, 3, 1, C.lampCap);      // base
    wP(x, ly + 5, C.lampCap);                // finial
    wGlow(x, ly + 2, 7, PAL.amber1);
    wP(x, ly + 2, C.lampHot);                // re-assert core over glow
  }

  // ---- crystal shard: faceted spike, lit left facet, hot core near tip ----
  function crystal(bx, by, h, wBase, lean) {
    bx = Math.round(bx); by = Math.round(by);
    for (let i = 0; i < h; i++) {
      const t = i / h;                                   // 0 tip -> 1 base
      const prof = t < 0.35 ? t / 0.35 : 1 - (t - 0.35) * 0.25;
      const half = Math.max(0, Math.round((wBase / 2) * prof));
      const cxx = Math.round(bx + lean * (1 - t));
      const y = by - h + i;
      wR(cxx - half, y, half * 2 + 1, 1, C.cry);
      if (half > 0) {                                    // facets
        wP(cxx - half, y, C.cryL);                       // lit left edge
        if (half > 1) wP(cxx - half + 1, y, C.cryL);
        wP(cxx + half, y, C.cryD);                       // dark right edge
        if (half > 2) wP(cxx + half - 1, y, C.cryD);
      }
      if (half > 1 && t < 0.5) wP(cxx, y, C.cryHot);     // glowing core column
      if (half > 2 && ((i + 2) % 5) === 0) wP(cxx + 1, y, C.cryD); // facet break
    }
    wP(bx + lean, by - h, PAL.white);                    // white-hot tip
    wP(bx + lean, by - h + 1, C.cryHot);
    wGlow(bx + lean, by - h + 2, Math.max(5, h >> 2), PAL.cyan2);
  }

  function crystalCluster(x, by, hMain) {
    const big = hMain >= 26;
    wEllipse(x, by, big ? 13 : 8, big ? 4 : 3, C.trunkD);     // rocky mound
    wEllipse(x - 2, by - 1, big ? 9 : 5, 2, C.trunk);
    wP(x - (big ? 7 : 4), by - 2, C.trunkL);
    crystal(x - (big ? 7 : 4), by - 1, Math.round(hMain * 0.55), big ? 7 : 5, -(big ? 4 : 3));
    crystal(x + (big ? 7 : 4), by - 1, Math.round(hMain * 0.42), big ? 6 : 5, big ? 5 : 3);
    crystal(x, by, hMain, big ? 9 : 6, (rnd() * 2 - 1) | 0);
    if (big) crystal(x + 12, by, Math.round(hMain * 0.28), 5, 6);
    wGlow(x, by - (hMain >> 1), big ? 10 : 6, PAL.cyan3);     // heart glow
    for (let i = 0; i < 4; i++) {                             // glinting dust
      wP(x + Math.round((rnd() - 0.5) * (big ? 30 : 18)), by - ((rnd() * 3) | 0), C.cryL);
    }
  }

  // ---- back tree (dark silhouette row, adds depth between hero trees) ----
  function backTree(x, cy, s) {
    for (let y = GROUND + 2; y >= cy; y--) {
      const t = (GROUND - y) / (GROUND - cy);
      const w = Math.max(2, Math.round(5 * (1 - t * 0.55)));
      wR(x - (w >> 1), y, w, 1, C.backTrunk);
    }
    crown(x, cy, s, C.backLeaf, C.backLeafL, C.backLeafD);
  }

  // ---- hero tree: massive mossy trunk, branches, big layered crown ----
  // dim=true pushes the crown a half-step darker for depth variety
  function frontTree(x, cy, s, girth, dim) {
    const body = dim ? shade(PAL.leaf3, -0.28) : C.leaf;
    const rim = dim ? shade(PAL.leaf2, -0.44) : C.leafRim;
    const lean = Math.round((rnd() * 2 - 1) * 6);
    // trunk from undergrowth up into the crown (lit left / shadow right)
    for (let y = GROUND + 4; y >= cy + Math.round(s * 0.2); y--) {
      const t = (GROUND - y) / (GROUND - cy);
      const w = Math.max(3, Math.round(girth * (1 - t * 0.45)));
      const cxx = Math.round(x + lean * t + Math.sin(t * Math.PI) * 1.5);
      wR(cxx - (w >> 1), y, w, 1, C.trunk);
      wP(cxx - (w >> 1), y, C.trunkL);
      wP(cxx - (w >> 1) + w - 1, y, C.trunkD);
      if ((y % 9) === 3) { wP(cxx - (w >> 1) + 1, y, C.moss); wP(cxx - (w >> 1) + 2, y, C.moss); }
      if ((y % 13) === 6) wP(cxx + (w >> 2), y, C.trunkD);        // bark crack
    }
    // root flare
    for (let i = 0; i < 5; i++) {
      wR(x - (girth >> 1) - i, GROUND - 1 + i, girth + i * 2, 1, i > 1 ? C.trunkD : C.trunk);
    }
    wP(x - (girth >> 1) - 4, GROUND + 3, C.trunkL);
    wP(x - (girth >> 1) - 3, GROUND + 2, C.trunkL);
    // branches reaching into the crown sides
    const tx = x + lean;
    const bx1 = tx - Math.round(s * 0.85), bx2 = tx + Math.round(s * 0.85);
    wLine(tx, cy + Math.round(s * 0.45), bx1, cy + Math.round(s * 0.18), C.trunkD);
    wLine(tx, cy + Math.round(s * 0.55), bx2, cy + Math.round(s * 0.25), C.trunkD);
    crown(tx, cy, s, body, rim, C.leafD);
    // vines dangling from the underside into open air
    const bot = Math.round(cy + s * 0.62);
    const nv = 2 + ((rnd() * 3) | 0);
    for (let i = 0; i < nv; i++) {
      vine(tx - s + Math.round(rnd() * s * 2), bot + ((rnd() * 3) | 0), 9 + ((rnd() * 14) | 0), rnd() < 0.4);
    }
    return { tx, bot, bx1, bx2 };
  }

  // ================= paint order (back to front) =================

  // 0) deep forest backdrop band — fills the mid-air with dense dark mass
  const bandWaves = [[3, 10, 1.0], [8, 5, 2.4], [13, 3, 0.6]];
  for (let x = 0; x < W; x++) {
    const top = heightAt(x, 162, bandWaves);
    R(ctx, x, top, 1, H - top, C.backBand);
  }
  for (let x = 0; x < W; x += 6) {                       // fluffy canopy bumps on top
    const bx = x + ((rnd() * 6) | 0) - 3;
    wCircle(bx, heightAt(bx, 162, bandWaves), 2 + ((rnd() * 4) | 0), C.backBand);
  }
  for (let x = 0; x < W; x += 5) {                       // faint lit tips on the band
    if (rnd() < 0.55) wP(x + ((rnd() * 4) | 0), heightAt(x, 162, bandWaves) - ((rnd() * 3) | 0), C.backBandL);
  }
  mistBand(152, 18, 0.32, C.mistHi, 0.7);

  // 1) back tree row — dark silhouettes peeking over/between the hero trees
  const backSpots = [
    [26, 120, 17], [96, 132, 15], [178, 116, 19], [258, 136, 14],
    [338, 122, 18], [414, 134, 15], [488, 118, 19], [566, 130, 16],
  ];
  for (const [bx, bcy, bs] of backSpots) backTree(bx + ((rnd() * 8) | 0), bcy, bs);
  mistBand(182, 20, 0.28, C.mist, 2.9);

  // 2) undergrowth ground band with wavy seam-safe top edge
  const gWaves = [[8, 2, 0], [3, 1.5, 1.2]];
  for (let x = 0; x < W; x++) {
    const yTop = heightAt(x, GROUND, gWaves);
    R(ctx, x, yTop, 1, H - yTop, C.ground);
    P(ctx, x, yTop, C.tuft);
    R(ctx, x, Math.min(H - 6, yTop + 12), 1, 20, C.groundD);
  }

  // 3) small crystal clusters behind the hero trunks
  crystalCluster(70, GROUND + 1, 16 + ((rnd() * 5) | 0));
  crystalCluster(252, GROUND + 2, 14 + ((rnd() * 5) | 0));
  crystalCluster(430, GROUND + 1, 17 + ((rnd() * 5) | 0));
  crystalCluster(598, GROUND + 2, 15 + ((rnd() * 4) | 0));

  // 4) hero tree line — big overlapping crowns (one crosses the seam)
  const trees = [
    frontTree(34, 100, 30, 10, false),
    frontTree(128, 118, 26, 8, true),
    frontTree(222, 92, 33, 11, false),
    frontTree(316, 122, 25, 8, true),
    frontTree(408, 98, 31, 10, false),
    frontTree(500, 116, 27, 9, true),
    frontTree(592, 90, 34, 11, false),   // wraps around the seam
  ];

  // 5) lanterns hanging on chains in the open air below the crowns
  const lampSpots = [
    [trees[0].bx2 - 2, trees[0].bot - 4, 10],
    [trees[1].tx - 16, trees[1].bot - 3, 8],
    [trees[2].bx1 + 3, trees[2].bot - 5, 13],
    [trees[3].bx2, trees[3].bot - 4, 9],
    [trees[4].tx + 18, trees[4].bot - 4, 11],
    [trees[5].bx1 + 1, trees[5].bot - 3, 8],
    [trees[6].bx2 - 3, trees[6].bot - 5, 14],
  ];
  for (const [lx, ly, chn] of lampSpots) lantern(lx, ly, chn);

  // 6) hero crystal formations in front of the trunks
  crystalCluster(176, GROUND + 3, 34 + ((rnd() * 8) | 0));
  crystalCluster(358, GROUND + 4, 28 + ((rnd() * 6) | 0));
  crystalCluster(540, GROUND + 3, 38 + ((rnd() * 8) | 0));
  crystalCluster(636, GROUND + 4, 20 + ((rnd() * 4) | 0)); // seam-crossing

  // 7) undergrowth details: grass tufts + glowing mushrooms
  for (let i = 0; i < 52; i++) {
    const gx = (rnd() * W) | 0;
    const gy = GROUND - 1 + ((rnd() * 5) | 0);
    wP(gx, gy, C.tuft);
    wP(gx, gy - 1, rnd() < 0.4 ? C.tuftL : C.tuft);
    if (rnd() < 0.35) wP(gx + 1, gy, C.tuft);
  }
  const shrooms = [52, 122, 208, 288, 388, 462, 520, 610];
  for (const sx of shrooms) {
    const sy = GROUND + 1 + ((rnd() * 3) | 0);
    wR(sx, sy - 2, 1, 3, C.trunkD);               // stem
    wR(sx - 2, sy - 4, 5, 2, C.trunk);            // cap
    wP(sx - 2, sy - 4, C.trunkL);
    wP(sx, sy - 3, C.cryL);                       // glowing gill
    wGlow(sx, sy - 3, 3, PAL.cyan2);
  }

  // 8) fireflies drifting through the wood
  for (let i = 0; i < 20; i++) {
    const fx = (rnd() * W) | 0;
    const fy = 104 + ((rnd() * 128) | 0);
    const warm = rnd() < 0.5;
    wP(fx, fy, warm ? PAL.amber0 : C.cryHot);
    if (rnd() < 0.5) wGlow(fx, fy, 2, warm ? PAL.amber1 : PAL.cyan2);
  }

  // 9) low ground fog softening the bases
  mistBand(226, 20, 0.30, C.mist, 5.1);

  return { canvas: c, factor: 0.7, tileX: true, y: 0, alpha: 1 };
}
