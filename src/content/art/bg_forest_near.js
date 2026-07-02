// AETHERFALL — bg_forest_near — LUMEN WOODS near parallax layer (factor 0.7)
// Closer dark-teal tree line, glowing crystal formations, small amber lanterns
// of the lost civilization, undergrowth + mushrooms, fireflies.
// Transparent above, seamless horizontal tiling, darker than gameplay tiles.
import { PAL } from './palette.js';
import { makeCanvas, P, R, rng, shade } from './util.js';

const W = 640, H = 270;
const GROUND = 250; // top of undergrowth band

export function build() {
  const c = makeCanvas(W, H);
  const ctx = c.getContext('2d');
  const rnd = rng(40713);

  // ---- palette (kept darker than gameplay tiles; emissives are tiny) ----
  const C = {
    backTrunk: shade(PAL.deepPurple, -0.38),
    backLeafD: shade(PAL.leaf3, -0.66),
    backLeaf: shade(PAL.leaf3, -0.55),
    backLeafL: shade(PAL.leaf3, -0.42),

    trunkD: shade(PAL.deepPurple, -0.18),
    trunk: PAL.deepPurple,
    trunkL: shade(PAL.shadow, -0.2),
    moss: shade(PAL.moss2, -0.32),

    leafD: shade(PAL.leaf3, -0.38),
    leaf: shade(PAL.leaf3, -0.2),
    leafRim: shade(PAL.leaf2, -0.35),
    vine: shade(PAL.moss2, -0.22),

    cryD: shade(PAL.cyan3, -0.42),
    cry: shade(PAL.cyan3, -0.15),
    cryL: shade(PAL.cyan2, -0.25),
    cryHot: PAL.cyan1,

    chain: shade(PAL.metal3, -0.25),
    lampCap: shade(PAL.amber2, -0.45),
    lampBody: shade(PAL.amber1, -0.2),
    lampHot: PAL.amber0,

    groundD: shade(PAL.void, 0.02),
    ground: shade(PAL.deepPurple, -0.35),
    tuft: shade(PAL.moss2, -0.42),
    tuftL: shade(PAL.moss2, -0.28),

    mist: PAL.violet3,
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
    for (let dy = -ry; dy <= ry; dy++) {
      const hw = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry))));
      wR(cx - hw, cy + dy, hw * 2 + 1, 1, col);
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
  // wrapped checker dither row (seam-safe, unlike util.dither at edges)
  const wDitherRow = (x, y, w, c1, c2) => {
    for (let i = 0; i < w; i++) wP(x + i, y, ((x + i + y) & 1) ? c1 : c2);
  };

  // ---- canopy blob: rim light upper-left, dark underside, dither seams ----
  function blob(cx, cy, rx, ry, body, rim, dark) {
    wEllipse(cx, cy, rx, ry, rim);                     // rim base
    wEllipse(cx + 1, cy + 1, rx - 1, ry - 1, body);    // body leaves 1px UL crescent
    const from = Math.max(1, Math.floor(ry * 0.3));
    for (let dy = from; dy <= ry; dy++) {              // shadowed underside
      const hw = Math.floor((rx - 1) * Math.sqrt(Math.max(0, 1 - (dy * dy) / ((ry - 1) * (ry - 1)))));
      if (dy === from) wDitherRow(cx + 1 - hw, cy + 1 + dy, hw * 2 + 1, body, dark);
      else wR(cx + 1 - hw, cy + 1 + dy, hw * 2 + 1, 1, dark);
    }
    // leaf clumps texture on lit side
    for (let k = 0; k < 4; k++) {
      const a = rnd() * Math.PI - Math.PI * 0.9;
      const px = cx + Math.round(Math.cos(a) * rx * 0.55);
      const py = cy + Math.round(Math.sin(a) * ry * 0.55);
      wR(px, py, 2, 1, rim);
    }
  }

  // ---- hanging vine with dim bioluminescent tip ----
  function vine(x, y, len, litTip) {
    let vx = x;
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
    for (let i = 0; i < chainLen; i++) wP(x, y + i, C.chain);
    const ly = y + chainLen;
    wR(x - 1, ly, 3, 1, C.lampCap);          // top cap
    wR(x - 2, ly + 1, 5, 3, C.lampCap);      // frame
    wR(x - 1, ly + 1, 3, 3, C.lampBody);     // glass
    wP(x, ly + 2, C.lampHot);                // hot core
    wP(x - 1, ly + 1, PAL.amber1);           // upper-left light
    wR(x - 1, ly + 4, 3, 1, C.lampCap);      // base
    wP(x, ly + 5, C.lampCap);                // finial
    wGlow(x, ly + 2, 6, PAL.amber1);
  }

  // ---- crystal shard: chunky faceted spike — widest at the shoulder,
  //      pointed tip, lit left facet, bright inner core near the tip ----
  function crystal(bx, by, h, wBase, lean) {
    for (let i = 0; i < h; i++) {
      const t = i / h;                                   // 0 tip -> 1 base
      // diamond profile: swells to full width ~35% down, holds toward base
      const prof = t < 0.35 ? t / 0.35 : 1 - (t - 0.35) * 0.25;
      const half = Math.max(0, Math.round((wBase / 2) * prof));
      const cxx = Math.round(bx + lean * (1 - t));
      const y = by - h + i;
      wR(cxx - half, y, half * 2 + 1, 1, C.cry);
      if (half > 0) {                                    // facets
        wP(cxx - half, y, C.cryL);                       // lit left edge
        if (half > 1) wP(cxx - half + 1, y, C.cryL);     // wide lit facet
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

  function crystalCluster(x, by, big) {
    // rocky base mound
    wEllipse(x, by, big ? 12 : 8, big ? 4 : 3, C.trunkD);
    wEllipse(x - 2, by - 1, big ? 8 : 5, 2, C.trunk);
    wP(x - (big ? 7 : 4), by - 2, C.trunkL);
    // tight formation: tall central shard + two leaning flankers
    const hMain = big ? 32 + ((rnd() * 10) | 0) : 16 + ((rnd() * 6) | 0);
    crystal(x - (big ? 6 : 4), by - 1, Math.round(hMain * 0.55), big ? 7 : 5, -(big ? 4 : 3));
    crystal(x + (big ? 6 : 4), by - 1, Math.round(hMain * 0.42), big ? 6 : 5, big ? 5 : 3);
    crystal(x, by, hMain, big ? 9 : 6, (rnd() * 2 - 1) | 0);
    if (big) crystal(x + 11, by, Math.round(hMain * 0.3), 5, 6);
    wGlow(x, by - (hMain >> 1), big ? 10 : 6, PAL.cyan3); // heart glow
  }

  // ---- back tree (simple dark silhouette, adds depth) ----
  function backTree(x, h, rBase) {
    const topY = GROUND - h;
    for (let y = GROUND + 2; y >= topY + rBase; y--) {
      const t = (GROUND - y) / h;
      const w = Math.max(2, Math.round(4 * (1 - t * 0.6)));
      wR(x - (w >> 1), y, w, 1, C.backTrunk);
    }
    blob(x, topY + rBase - 2, rBase + 4, rBase, C.backLeaf, C.backLeafL, C.backLeafD);
    blob(x - rBase, topY + rBase + 3, rBase - 2, rBase - 4, C.backLeaf, C.backLeafL, C.backLeafD);
    blob(x + rBase - 1, topY + rBase + 4, rBase - 3, rBase - 4, C.backLeaf, C.backLeafL, C.backLeafD);
  }

  // ---- front tree: girthy trunk, moss, branches, layered canopy ----
  function frontTree(x, h, girth) {
    const lean = Math.round((rnd() * 2 - 1) * 7);
    const topY = GROUND - h;
    // trunk (tapered, lit left / shadow right)
    for (let y = GROUND + 3; y >= topY + 10; y--) {
      const t = (GROUND - y) / h;
      const w = Math.max(3, Math.round(girth * (1 - t * 0.5)));
      const cxx = Math.round(x + lean * t);
      wR(cxx - (w >> 1), y, w, 1, C.trunk);
      wP(cxx - (w >> 1), y, C.trunkL);
      wP(cxx - (w >> 1) + w - 1, y, C.trunkD);
      if ((y & 7) === 3) wP(cxx - (w >> 1) + 1, y, C.moss);      // moss patches
      if ((y & 11) === 6) wP(cxx + (w >> 2), y, C.trunkD);       // bark crack
    }
    // root flare
    for (let i = 0; i < 4; i++) {
      wR(x - (girth >> 1) - i, GROUND - 1 + i, girth + i * 2, 1, i > 1 ? C.trunkD : C.trunk);
    }
    wP(x - (girth >> 1) - 3, GROUND + 2, C.trunkL);
    // branches out to canopy blobs
    const cTop = topY + 6;
    const bx1 = x + lean - girth - 6, bx2 = x + lean + girth + 7;
    wLine(x + lean, cTop + 10, bx1, cTop + 4, C.trunkD);
    wLine(x + lean, cTop + 12, bx2, cTop + 6, C.trunkD);
    // layered canopy — big crown + two side blobs + under-blob
    blob(x + lean, cTop, girth + 12, 13, C.leaf, C.leafRim, C.leafD);
    blob(bx1, cTop + 5, 11, 8, C.leaf, C.leafRim, C.leafD);
    blob(bx2, cTop + 7, 10, 8, C.leaf, C.leafRim, C.leafD);
    blob(x + lean - 4, cTop + 12, girth + 5, 7, C.leafD, C.leaf, C.backLeafD);
    // vines off the canopy underside
    const nv = 2 + (rnd() * 2 | 0);
    for (let i = 0; i < nv; i++) {
      const vxp = x + lean - girth - 4 + Math.round(rnd() * (girth * 2 + 8));
      vine(vxp, cTop + 16 + (rnd() * 4 | 0), 8 + (rnd() * 12 | 0), rnd() < 0.45);
    }
    return { cx: x + lean, cy: cTop, bx1, bx2 };
  }

  // ================= paint order (back to front) =================

  // 0) undergrowth ground band with wavy seam-safe top edge (integer sine cycles)
  for (let x = 0; x < W; x++) {
    const yTop = GROUND + Math.round(
      2 * Math.sin((x * 8 * Math.PI * 2) / W) + 1.5 * Math.sin((x * 3 * Math.PI * 2) / W + 1.2)
    );
    R(ctx, x, yTop, 1, H - yTop, C.ground);
    P(ctx, x, yTop, C.tuft);
    R(ctx, x, Math.min(H - 6, yTop + 12), 1, 20, C.groundD);
  }

  // 1) back tree row — dark, uniform, fills gaps between front trees
  const backXs = [18, 88, 152, 231, 296, 361, 434, 501, 566];
  for (let i = 0; i < backXs.length; i++) {
    const x = backXs[i] + (rnd() * 10 | 0);
    backTree(x, 118 + (rnd() * 42 | 0), 13 + (rnd() * 5 | 0));
  }

  // 2) atmospheric mist bands between rows — feathered edges, no hard stripes
  const mistBand = (y0, h, peak) => {
    ctx.save();
    for (let j = 0; j < h; j++) {
      ctx.globalAlpha = peak * Math.sin((Math.PI * (j + 0.5)) / h);
      R(ctx, 0, y0 + j, W, 1, C.mist);
    }
    ctx.restore();
  };
  mistBand(162, 16, 0.1);
  mistBand(192, 20, 0.12);
  mistBand(222, 24, 0.16);

  // 3) crystal clusters behind the front trunks
  crystalCluster(70, GROUND + 1, false);
  crystalCluster(340, GROUND + 2, false);
  crystalCluster(585, GROUND + 1, false);

  // 4) front tree line (crosses the seam on purpose — wrap makes it seamless)
  const trees = [
    frontTree(36, 168, 9),
    frontTree(140, 146, 8),
    frontTree(238, 178, 10),
    frontTree(330, 140, 7),
    frontTree(422, 172, 9),
    frontTree(524, 152, 8),
    frontTree(614, 182, 10), // wraps around the seam
  ];

  // 5) lanterns hanging from branches — warm counterpoint to the teal
  const lampSpots = [
    [trees[0].bx2, trees[0].cy + 7, 9],
    [trees[1].cx - 14, trees[1].cy + 10, 7],
    [trees[2].bx1, trees[2].cy + 6, 11],
    [trees[3].bx2 + 2, trees[3].cy + 8, 8],
    [trees[4].cx + 16, trees[4].cy + 9, 10],
    [trees[5].bx1 - 1, trees[5].cy + 7, 7],
    [trees[6].bx2, trees[6].cy + 8, 12],
  ];
  for (const [lx, ly, ch] of lampSpots) lantern(Math.round(lx), Math.round(ly), ch);

  // 6) foreground crystal formations (bigger, in front of trunks)
  crystalCluster(188, GROUND + 3, true);
  crystalCluster(472, GROUND + 4, true);
  crystalCluster(628, GROUND + 3, false); // seam-crossing cluster

  // 7) undergrowth details: grass tufts + glowing mushrooms
  for (let i = 0; i < 46; i++) {
    const gx = (rnd() * W) | 0;
    const gy = GROUND - 1 + ((rnd() * 4) | 0);
    wP(gx, gy, C.tuft);
    wP(gx, gy - 1, rnd() < 0.4 ? C.tuftL : C.tuft);
    if (rnd() < 0.35) wP(gx + 1, gy, C.tuft);
  }
  const shrooms = [52, 122, 208, 275, 388, 449, 540, 600];
  for (const sx of shrooms) {
    const sy = GROUND + 1 + ((rnd() * 3) | 0);
    wR(sx, sy - 2, 1, 3, C.trunkD);               // stem
    wR(sx - 2, sy - 4, 5, 2, C.trunk);            // cap
    wP(sx - 2, sy - 4, C.trunkL);
    wP(sx, sy - 3, C.cryL);                       // glowing gill
    wGlow(sx, sy - 3, 3, PAL.cyan2);
  }

  // 8) fireflies drifting through the wood
  for (let i = 0; i < 16; i++) {
    const fx = (rnd() * W) | 0;
    const fy = 96 + ((rnd() * 140) | 0);
    const warm = rnd() < 0.5;
    wP(fx, fy, warm ? PAL.amber0 : C.cryHot);
    if (rnd() < 0.5) wGlow(fx, fy, 2, warm ? PAL.amber1 : PAL.cyan2);
  }

  return { canvas: c, factor: 0.7, tileX: true, y: 0, alpha: 1 };
}
