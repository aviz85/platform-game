// AETHERFALL — bg_ruins_far — SKY BASTION far layer.
// Sunset sky: indigo→amber ordered-dither gradient, low sun disc with graded corona
// bloom, dithered crepuscular light rays, haze bands,
// pale moon + stars, wind streaks, a rolling cloud sea in four lit bands, and tiny
// broken tower silhouettes (amber-rimmed, lit windows, a shattered bridge) rising
// from the clouds. 480x270 opaque, tiles horizontally seamlessly. factor 0.08.
import { PAL } from './palette.js';
import { makeCanvas, P, R, circleFill, glow, shade, rng } from './util.js';

const W = 480, H = 270;
const SUNX = 150, SUNY = 166, SUNR = 24;

// ---- wrapped drawing (horizontal seamlessness) ----
const wrap = (x) => ((x % W) + W) % W;
function wP(ctx, x, y, c) { if (y >= 0 && y < H) P(ctx, wrap(x | 0), y | 0, c); }
function wCol(ctx, x, y0, y1, c) { for (let y = y0; y < y1; y++) wP(ctx, x, y, c); }
// shortest horizontal distance to the sun, across the seam
function sunDX(x) { const d = Math.abs(wrap(x) - SUNX); return Math.min(d, W - d); }

// ---- ordered 4x4 Bayer dithered vertical gradient (no banding) ----
const B4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
function skyGradient(ctx) {
  const stops = [
    [0, PAL.skyTop],                    // deep indigo zenith
    [44, PAL.skyMid],
    [86, PAL.skyLow],
    [118, PAL.skyGlow],
    [144, PAL.horizon],                 // dusty magenta
    [163, shade(PAL.amber1, 0.18)],     // burning amber
    [178, shade(PAL.sun, -0.08)],       // pale cream right at the horizon line
  ];
  const last = stops[stops.length - 1];
  for (let y = 0; y < H; y++) {
    let c1, c2, t;
    if (y >= last[0]) { c1 = c2 = last[1]; t = 0; }
    else {
      let k = 0;
      while (stops[k + 1][0] <= y) k++;
      c1 = stops[k][1]; c2 = stops[k + 1][1];
      t = (y - stops[k][0]) / (stops[k + 1][0] - stops[k][0]);
    }
    for (let x = 0; x < W; x++) {
      P(ctx, x, y, t * 16 > B4[y & 3][x & 3] + 0.5 ? c2 : c1);
    }
  }
}

// ---- stars (upper indigo only, thin out toward the glow) ----
function stars(ctx) {
  const r = rng(77);
  const dim = shade(PAL.skyMid, 0.3);
  for (let i = 0; i < 52; i++) {
    const x = Math.floor(r() * W);
    const y = 3 + Math.floor(r() * 104);
    const b = r();
    if (y > 78 && b < 0.65) continue;           // fade out near the sunset glow
    if (b > 0.9) {                              // rare bright star with a cross
      P(ctx, x, y, PAL.white);
      P(ctx, x - 1, y, PAL.violet1); P(ctx, wrap(x + 1), y, PAL.violet1);
      if (y > 0) P(ctx, x, y - 1, PAL.violet1);
      P(ctx, x, y + 1, PAL.violet1);
    } else if (b > 0.55) {
      P(ctx, x, y, PAL.violet0);
    } else {
      P(ctx, x, y, y > 60 ? dim : PAL.violet1);
    }
  }
}

// ---- pale cratered moon, high right ----
function moon(ctx) {
  const cx = 396, cy = 40, r0 = 9;
  glow(ctx, cx, cy, 14, PAL.violet0);
  circleFill(ctx, cx, cy, r0, PAL.stone0);
  circleFill(ctx, cx + 3, cy + 3, r0 - 3, PAL.stone1);       // shadow toward lower-right
  circleFill(ctx, cx + 5, cy + 5, r0 - 5, shade(PAL.stone1, -0.12));
  // craters on the lit side
  P(ctx, cx - 4, cy - 3, PAL.stone1); P(ctx, cx - 3, cy - 3, PAL.stone1);
  P(ctx, cx - 1, cy - 6, PAL.stone1);
  P(ctx, cx - 6, cy + 1, PAL.stone1);
  // rim light upper-left
  P(ctx, cx - 6, cy - 6, PAL.white); P(ctx, cx - 5, cy - 7, PAL.white);
}

// ---- sun disc with hot core and atmosphere cut-bands ----
function sun(ctx) {
  // broad graded corona bloom — a soft outer halo the sunset light bleeds into
  ctx.save();
  ctx.globalAlpha = 0.09;
  circleFill(ctx, SUNX, SUNY, 72, shade(PAL.amber1, -0.12));
  ctx.globalAlpha = 0.14;
  circleFill(ctx, SUNX, SUNY, 58, PAL.amber1);
  ctx.restore();
  glow(ctx, SUNX, SUNY, 52, PAL.amber1);
  glow(ctx, SUNX, SUNY, 36, PAL.sun);
  circleFill(ctx, SUNX, SUNY, SUNR, PAL.sun);
  circleFill(ctx, SUNX - 4, SUNY - 5, 14, PAL.gold0);
  circleFill(ctx, SUNX - 5, SUNY - 6, 7, PAL.white);          // hot pixel core
  // haze strata slicing the lower disc (sun sinking into the cloud sea)
  const haze = shade(PAL.amber1, 0.2);
  const bands = [[7, 1], [12, 2], [17, 2], [21, 1]];
  for (const [dy, th] of bands) {
    const hw = Math.floor(Math.sqrt(SUNR * SUNR - dy * dy));
    R(ctx, SUNX - hw - 3, SUNY + dy, hw * 2 + 7, th, haze);
  }
}

// ---- crepuscular rays: faint light shafts fanning up from the sinking sun ----
function sunRays(ctx) {
  // angles measured from straight-up (radians); a wide, uneven fan reads as god-rays
  const angs = [-1.32, -0.98, -0.62, -0.28, 0.05, 0.34, 0.68, 1.02, 1.30];
  const lens = [58, 74, 66, 88, 80, 84, 62, 76, 60];
  ctx.save();
  ctx.globalAlpha = 0.13;
  for (let a = 0; a < angs.length; a++) {
    const ang = -Math.PI / 2 + angs[a];
    const dx = Math.cos(ang), dy = Math.sin(ang);
    const rlen = lens[a];
    for (let t = SUNR + 3; t < rlen; t++) {
      const frac = (t - SUNR) / (rlen - SUNR);          // 0 near sun -> 1 at tip
      const keep = (t * 3 + a * 5) % 5;                 // irregular gaps => no banding
      if (frac > 0.42 && keep < 2) continue;            // shafts thin out with distance
      if (frac > 0.72 && keep < 3) continue;
      const x = SUNX + dx * t, y = SUNY + dy * t;
      if (y < 4) break;
      wP(ctx, x, y, frac < 0.5 ? PAL.sun : shade(PAL.amber0, -0.12));
    }
  }
  ctx.restore();
}

// ---- long wind-blown haze streaks across the amber band ----
function hazeStreaks(ctx) {
  const r = rng(55);
  for (let i = 0; i < 11; i++) {
    const y = 146 + Math.floor(r() * 30);
    const x = Math.floor(r() * W);
    const len = 28 + Math.floor(r() * 72);
    const c = y < 160 ? shade(PAL.horizon, 0.14) : shade(PAL.amber1, 0.32);
    for (let k = 0; k < len; k++) if ((k & 7) < 6) wP(ctx, x + k, y, c);
  }
}

// ---- distant birds, tiny 'v' specks against the bright band ----
function birds(ctx) {
  const c = shade(PAL.skyMid, -0.05);
  const pts = [[262, 148], [274, 143], [286, 150], [252, 156], [297, 146], [56, 152]];
  for (const [x, y] of pts) {
    wP(ctx, x, y, c); wP(ctx, x + 2, y, c); wP(ctx, x + 1, y + 1, c);
  }
}

// ---- one tiny broken tower (jagged top, battlement cap, sun rim, lit windows) ----
function tower(ctx, bx, baseY, tw, th, col, rimCol, winCol, seed, spire) {
  const r = rng(seed);
  const tops = [];
  for (let i = 0; i < tw; i++) {
    const topY = baseY - th + Math.floor(r() * 3.4);          // broken crown
    tops.push(topY);
    wCol(ctx, bx + i, topY, baseY, col);
  }
  // shattered battlement cap — 1px overhang each side, crenel gaps (only if wide enough)
  if (tw >= 5) {
    const capY = Math.min(...tops);
    for (let i = -1; i <= tw; i++) {
      if (i >= 0 && i < tw && tops[i] > capY + 2) continue;    // keep the break jagged
      if (((i + tw) & 3) === 2) continue;                      // crenel gap
      wP(ctx, bx + i, capY, col);
      wP(ctx, bx + i, capY - 1, i < tw / 2 ? rimCol : col);    // merlon, sunlit on left
    }
    // shoulder buttress at the base, right side (broadens the footing)
    wCol(ctx, bx + tw, baseY - Math.floor(th * 0.3), baseY, shade(col, -0.15));
  }
  if (spire) {
    const sx = bx + (tw >> 1);
    wCol(ctx, sx, tops[tw >> 1] - 6, tops[tw >> 1], col);
    wP(ctx, sx, tops[tw >> 1] - 7, rimCol);                   // sun catches the tip
  }
  // rim light: left face + left half of the crown (light from upper-left / sun side)
  const rimH = Math.floor(th * 0.45);
  wCol(ctx, bx, tops[0], tops[0] + rimH, rimCol);
  for (let i = 0; i < Math.ceil(tw / 2); i++) wP(ctx, bx + i, tops[i], rimCol);
  // shadow edge on the right face
  wCol(ctx, bx + tw - 1, tops[tw - 1] + 1, baseY, shade(col, -0.22));
  // sparse lit windows of the lost garrison
  if (winCol) {
    const n = 2 + Math.floor(r() * 3);
    for (let k = 0; k < n; k++) {
      const wx = bx + 1 + Math.floor(r() * Math.max(1, tw - 2));
      const wy = baseY - 4 - Math.floor(r() * Math.max(1, th - 9));
      wP(ctx, wx, wy, winCol);
    }
  }
  return tops;
}

// ---- shattered bridge span between two towers ----
function brokenBridge(ctx, x0, x1, y, col) {
  const gap0 = x0 + Math.floor((x1 - x0) * 0.45);
  const gap1 = gap0 + 7;
  for (let x = x0; x <= x1; x++) {
    if (x > gap0 && x < gap1) continue;                        // the missing span
    wP(ctx, x, y, col);
    if ((x - x0) % 5 === 0) wP(ctx, x, y + 1, shade(col, -0.2)); // hanging struts
  }
  // dangling rubble at the break
  wP(ctx, gap0, y + 1, col); wP(ctx, gap0, y + 2, shade(col, -0.2));
  wP(ctx, gap1, y + 1, col);
  wP(ctx, gap0 + 3, y + 4, shade(col, -0.15));                 // falling stone
}

// ---- one cloud puff: soft top-half ellipse + top-left highlight arc + under-shadow ----
function puff(ctx, cx, cy, rx, ry, col, hi, sh) {
  rx = Math.max(2, rx | 0); ry = Math.max(1, ry | 0);
  for (let dy = -ry; dy <= 0; dy++) {
    const w = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry))));
    for (let i = -w; i <= w; i++) wP(ctx, cx + i, cy + dy, col);
  }
  // rim light on the upper-left arc
  for (let dx = -rx; dx <= Math.floor(rx * 0.35); dx++) {
    const yy = Math.floor(ry * Math.sqrt(Math.max(0, 1 - (dx * dx) / (rx * rx))));
    if (yy > 0) wP(ctx, cx + dx, cy - yy, hi);
  }
  // soft shadow tucked under the right shoulder — gives the swell a rolling belly
  if (sh) {
    const w = Math.floor(rx * 0.55);
    for (let i = 0; i <= w; i++) if ((i & 3) !== 3) wP(ctx, cx + i + ((rx * 0.2) | 0), cy + 2, sh);
  }
}

// ---- one band of the cloud sea: base fill + rolling lit puffs along the top ----
function cloudBand(ctx, yTop, col, hiCol, hiSun, seed, rMin, rMax, ryMax) {
  R(ctx, 0, yTop + 2, W, H - yTop - 2, col);
  const sh = shade(col, -0.13);
  const r = rng(seed);
  let x = Math.floor(r() * 6);
  while (x < W + rMax) {                                       // overshoot => seam covered
    const rx = rMin + r() * (rMax - rMin);
    const ry = 3 + r() * (ryMax - 2);
    const cy = yTop + 2 + Math.floor(r() * 3);                 // varied crest heights
    const hi = sunDX(x) < 85 ? hiSun : hiCol;
    puff(ctx, x, cy, rx, ry, col, hi, sh);
    x += rx * (0.55 + r() * 0.6);                              // denser => no flat gaps
  }
}

// ---- sun glitter road on the cloud tops: widens toward the viewer, sparkles thin out ----
function glitter(ctx, yTop) {
  const r = rng(99);
  for (let i = 0; i < 30; i++) {
    const y = yTop - 2 + Math.floor(r() * 16);                 // reaches down the band
    const spreadHalf = 16 + (y - yTop) * 2.1;                  // road widens with depth
    const x = SUNX - spreadHalf + Math.floor(r() * spreadHalf * 2);
    if (r() < (y - yTop + 3) / 26) continue;                   // sparser far from the crest
    const len = 2 + Math.floor(r() * 4);
    const c = r() > 0.45 ? PAL.sun : (r() > 0.4 ? PAL.gold0 : PAL.amber0);
    for (let k = 0; k < len; k++) wP(ctx, x + k, y, c);
  }
  // one hot glint right where the sun meets the cloud sea
  R(ctx, SUNX - 5, yTop - 1, 10, 1, PAL.gold0);
  R(ctx, SUNX - 2, yTop - 1, 5, 1, PAL.white);
}

// ---- floating masonry motes drifting near the towers ----
function motes(ctx, col) {
  const r = rng(41);
  const spots = [[236, 190], [330, 182], [356, 176], [404, 194], [430, 186], [222, 178]];
  for (const [x, y] of spots) {
    wP(ctx, x, y, col);
    if (r() > 0.45) wP(ctx, x + 1, y, shade(col, -0.18));
    if (r() > 0.7) wP(ctx, x, y - 3, shade(col, 0.12));        // higher fleck
  }
}

export function build() {
  const c = makeCanvas(W, H);
  const ctx = c.getContext('2d');

  // 1) sky
  skyGradient(ctx);
  stars(ctx);
  moon(ctx);
  sun(ctx);
  sunRays(ctx);
  hazeStreaks(ctx);
  birds(ctx);

  // 2) farthest tower ghosts — barely darker than the haze, behind the first cloud band
  const ghost = shade(PAL.skyGlow, -0.1);
  const ghostRim = shade(PAL.horizon, 0.1);
  tower(ctx, 38, 196, 5, 15, ghost, ghostRim, null, 601, false);
  tower(ctx, 226, 197, 4, 12, ghost, ghostRim, null, 602, false);
  tower(ctx, 302, 196, 6, 20, ghost, ghostRim, null, 603, true);
  tower(ctx, 366, 197, 4, 14, ghost, ghostRim, null, 604, false);
  tower(ctx, 452, 196, 5, 17, ghost, ghostRim, null, 605, false);

  // 3) cloud sea band 0 — sunset-pink tops, amber where the sun path crosses
  cloudBand(ctx, 184, PAL.horizon, shade(PAL.horizon, 0.25), PAL.amber0, 21, 7, 14, 5);
  glitter(ctx, 184);

  // 4) main tower silhouettes of the Sky Bastion, standing in the first band
  const tcol = shade(PAL.violet3, -0.05);
  const trim = PAL.amber1;
  tower(ctx, 212, 206, 5, 30, tcol, trim, PAL.amber0, 611, false);
  tower(ctx, 258, 206, 6, 24, tcol, trim, PAL.amber0, 612, false);
  brokenBridge(ctx, 217, 258, 188, tcol);
  const tallTops = tower(ctx, 342, 206, 7, 42, tcol, trim, PAL.amber0, 613, true);
  glow(ctx, 345, tallTops[3] + 9, 2, PAL.amber0);              // one warm beacon window
  wP(ctx, 345, tallTops[3] + 9, PAL.gold0);
  tower(ctx, 415, 206, 5, 27, tcol, trim, PAL.amber0, 614, false);
  tower(ctx, 474, 206, 8, 33, tcol, trim, PAL.amber0, 615, false); // straddles the seam
  brokenBridge(ctx, 420, 474, 190, tcol);                     // second ruined span
  motes(ctx, tcol);

  // 5) cloud sea band 1 — swallows the tower bases
  cloudBand(ctx, 206, PAL.skyGlow, shade(PAL.horizon, 0.05), shade(PAL.horizon, 0.18), 22, 8, 16, 6);

  // 6) drowned tower stumps between the deeper swells
  const deep = shade(PAL.violet3, -0.3);
  tower(ctx, 96, 230, 6, 24, deep, shade(PAL.horizon, -0.08), null, 621, false);
  tower(ctx, 168, 230, 5, 18, deep, shade(PAL.horizon, -0.08), null, 622, false);
  tower(ctx, 388, 230, 7, 27, deep, shade(PAL.horizon, -0.08), null, 623, true);

  // 7) deepest, darkest swells — the sea rolls off into indigo night
  cloudBand(ctx, 230, PAL.skyLow, PAL.skyGlow, shade(PAL.skyGlow, 0.12), 23, 9, 18, 6);
  cloudBand(ctx, 252, PAL.skyMid, shade(PAL.skyLow, 0.1), shade(PAL.skyLow, 0.18), 24, 10, 20, 5);

  return {
    canvas: c,
    factor: 0.08,
    tileX: true,
    y: 0,
    alpha: 1,
  };
}
