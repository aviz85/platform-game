// AETHERFALL — bg_ruins_mid.js
// SKY BASTION · mid parallax layer (factor 0.4)
// Colossal broken towers + two tiers of ruined aqueduct arches, silhouetted
// against the sunset with warm amber lit windows, verdigris dome remnants,
// gold banners, floating masonry and faint holo-glyphs.
// Canvas 640x270, transparent above the skyline, tiles seamlessly on X:
// every mark goes through wrap-aware helpers (wP/wR/wDither), so geometry
// crossing x=640 re-enters at x=0 pixel-perfectly.
import { PAL } from './palette.js';
import { makeCanvas, P, R, glow, shade, rng } from './util.js';

const W = 640, H = 270;

// ---------- wrap-aware primitives (guarantee horizontal seamlessness) ----------
const wX = (x) => ((x % W) + W) % W;

function wP(ctx, x, y, c) {
  if (y < 0 || y >= H) return;
  P(ctx, wX(x), y, c);
}

function wR(ctx, x, y, w, h, c) {
  if (w <= 0) return;
  if (y < 0) { h += y; y = 0; }
  if (y + h > H) h = H - y;
  if (h <= 0) return;
  x = wX(x);
  if (x + w <= W) R(ctx, x, y, w, h, c);
  else { R(ctx, x, y, W - x, h, c); R(ctx, 0, y, x + w - W, h, c); }
}

function wDither(ctx, x, y, w, h, c1, c2) {
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      wP(ctx, x + i, y + j, ((x + i + y + j) & 1) ? c1 : c2);
    }
  }
}

// ---------- palette for this layer ----------
const BODY   = PAL.stone3;                 // main silhouette mass
const BODY_L = shade(PAL.stone3, 0.16);    // sunlit top/left faces
const BODY_D = PAL.shadow;                 // shaded right faces
// full 5-step ramp across a tower's width (light upper-left -> dark right),
// endpoints match BODY_L/BODY/BODY_D so the silhouette tone is unchanged —
// the two in-between steps just give the mass a rounded, cylindrical read.
const BODY_RAMP = [
  shade(PAL.stone3, 0.30),                 // grazed sunlit edge
  shade(PAL.stone3, 0.16),                 // == BODY_L
  PAL.stone3,                              // == BODY
  shade(PAL.stone3, -0.12),                // core shadow transition
  PAL.shadow,                              // == BODY_D
];
const DARK   = PAL.deepPurple;             // recesses / dark windows / rubble
const FAR    = shade(PAL.stone3, -0.18);   // one atmospheric step further back
const FAR_L  = shade(PAL.stone3, -0.02);
const RIM    = shade(PAL.horizon, 0.05);   // warm sunset rim on upper edges
const RIM_HOT = PAL.sun;                   // rare hot rim pixels
const WIN    = PAL.amber1;                 // lit window body
const WIN_HOT = PAL.amber0;                // window hot pixel
const WIN_DIM = shade(PAL.amber2, 0.06);   // dying ember windows
const VERD   = PAL.moss1;                  // verdigris copper
const VERD_D = PAL.moss2;
const GOLD   = PAL.gold1;
const GOLD_L = PAL.gold0;

// ---------------------------------------------------------------------------

// A lit/dim/dark arched window, 3px wide, 4px tall + 1px arch crown.
function windowAt(ctx, g, x, y, litChance) {
  const roll = g();
  if (roll < litChance) {
    wR(ctx, x, y, 3, 4, WIN);
    wP(ctx, x + 1, y - 1, WIN);          // arch crown
    wP(ctx, x + 1, y, WIN_HOT);          // hot pixel top-center
    if (g() < 0.25) wP(ctx, x, y + 1, WIN_HOT);
    return 2;                            // lit
  } else if (roll < litChance + 0.2) {
    wR(ctx, x, y, 3, 4, WIN_DIM);
    wP(ctx, x + 1, y - 1, WIN_DIM);
    return 1;                            // dim ember
  }
  wR(ctx, x, y, 3, 4, DARK);
  wP(ctx, x + 1, y - 1, DARK);
  return 0;                              // dead dark socket
}

// Ruined aqueduct: piers + semicircular arches + (broken) deck with parapet.
// period must divide W so the arcade is inherently seamless.
function aqueduct(ctx, g, { deckY, period, pierW, deckH, archH, broken, far }) {
  const n = W / period;
  const body = far ? FAR : BODY;
  const bodyL = far ? FAR_L : BODY_L;
  const bodyD = far ? shade(FAR, -0.14) : BODY_D;
  const rim = far ? shade(RIM, -0.22) : RIM;

  for (let i = 0; i < n; i++) {
    const px = i * period;
    // pier down into the cloud haze, buttress flare near the bottom
    wR(ctx, px, deckY, pierW, H - deckY, body);
    wR(ctx, px, deckY, 2, H - deckY, bodyL);                     // lit left face
    wR(ctx, px + pierW - 2, deckY, 2, H - deckY, bodyD);         // shaded right
    wR(ctx, px - 1, H - 26, pierW + 2, 26, body);                // buttress flare
    wR(ctx, px - 1, H - 26, 1, 26, bodyL);
    wR(ctx, px + pierW, H - 26, 1, 26, bodyD);
    wP(ctx, px - 1, H - 26, rim);
    // carved pier band + slit windows below the deck
    wR(ctx, px + 1, deckY + deckH + archH + 6, pierW - 2, 2, bodyD);
    if (g() < 0.6) {
      const wy = deckY + deckH + archH + 12 + ((g() * 10) | 0);
      wR(ctx, px + ((pierW / 2) | 0), wy, 1, 3, g() < 0.6 ? WIN : DARK);
    }

    // spandrel fill above the arch curve (opening shows sky through)
    const open = period - pierW;                 // opening width
    const hw = open / 2;
    const isBroken = broken.includes(i);
    for (let dx = 0; dx < open; dx++) {
      const t = (dx - hw + 0.5) / hw;            // -1..1 across the opening
      const drop = Math.round(archH * (1 - Math.sqrt(Math.max(0, 1 - t * t))));
      const x = px + pierW + dx;
      if (!isBroken) {
        wR(ctx, x, deckY + deckH, 1, drop, body);
        wP(ctx, x, deckY + deckH + drop, bodyD); // arch intrados shadow line
      } else if (drop > archH * 0.55) {
        // broken span: only the arch springers survive near the piers
        wR(ctx, x, deckY + deckH, 1, drop, body);
        wP(ctx, x, deckY + deckH + drop - 1, bodyD);
      }
    }

    // deck + parapet (skipped over broken spans, with jagged stubs)
    if (!isBroken) {
      wR(ctx, px, deckY, period, deckH, body);
      wR(ctx, px, deckY, period, 1, bodyL);
      for (let dx = 0; dx < period; dx += 5) {   // crenellated parapet posts
        wR(ctx, px + dx, deckY - 2, 2, 2, body);
        wP(ctx, px + dx, deckY - 2, rim);
      }
      if (g() < 0.5) wP(ctx, px + ((g() * period) | 0), deckY - 1, RIM_HOT);
    } else {
      // jagged stubs on each side of the collapsed span
      for (let s = 0; s < 8; s++) {
        wR(ctx, px + s, deckY + ((s / 3) | 0), 1, deckH - ((s / 3) | 0), body);
        wR(ctx, px + period - 1 - s, deckY + ((s / 3) | 0), 1, deckH - ((s / 3) | 0), body);
      }
      wP(ctx, px, deckY, rim);
      wP(ctx, px + period - 1, deckY, rim);
      // rubble crumbs frozen mid-fall
      for (let r = 0; r < 4; r++) {
        wP(ctx, px + 10 + ((g() * (period - 20)) | 0), deckY + 8 + ((g() * 20) | 0), bodyD);
      }
    }
  }
}

// A colossal broken tower with cornices, window grids, verdigris streaks,
// optional dome remnant, banner and holo-glyphs.
function tower(ctx, g, { x, w, top, seed, banner, dome, glyphs, noGlow }) {
  const gt = rng(seed);
  // jagged broken crown — per-column top offsets (random walk, clamped)
  const colTop = new Array(w);
  let off = 2;
  for (let i = 0; i < w; i++) {
    if (gt() < 0.45) off = Math.min(9, Math.max(0, off + (gt() < 0.5 ? -2 : 2)));
    colTop[i] = top + off;
  }
  // body columns — cylindrical 5-step ramp, ordered-dithered to kill banding,
  // biased darker toward the base so the tower sinks into the cloud haze.
  for (let i = 0; i < w; i++) {
    const t = w > 1 ? i / (w - 1) : 0;
    const baseCF = 0.35 + t * 3.3;                        // light left -> dark right
    const yTop = colTop[i];
    for (let y = yTop; y < H; y++) {
      const hz = y > 176 ? Math.min(1, (y - 176) / 78) * 0.9 : 0;   // haze sink
      const cf = Math.max(0, Math.min(BODY_RAMP.length - 1, baseCF + hz));
      const lo = Math.floor(cf), hi = Math.min(BODY_RAMP.length - 1, lo + 1);
      const th = (((x + i) * 3 + y * 5) & 7) / 8;          // ordered dither threshold
      wP(ctx, x + i, y, (cf - lo) > th ? BODY_RAMP[hi] : BODY_RAMP[lo]);
    }
    wP(ctx, x + i, yTop, RIM);                            // sunset rim on the crown
    if (gt() < 0.07) wP(ctx, x + i, yTop, RIM_HOT);
    if (colTop[i] > top + 5) wR(ctx, x + i, yTop + 1, 1, 3, DARK);  // exposed interior
  }
  // warm sunset rim grazing straight down the sunlit left edge (secondary light)
  for (let y = colTop[0] + 1; y < Math.min(H - 16, colTop[0] + 46); y++) {
    if (((y * 13) & 3) === 0) wP(ctx, x, y, gt() < 0.12 ? RIM_HOT : RIM);
  }
  // dome remnant (verdigris quarter-shell perched on the crown)
  if (dome) {
    const dr = Math.max(7, (w / 4) | 0);
    const cx = x + ((w * 0.32) | 0);
    const baseY = top + 2;
    for (let dy = 0; dy <= dr; dy++) {
      const half = Math.floor(dr * Math.sqrt(Math.max(0, 1 - (dy / dr - 1) * (dy / dr - 1))));
      const keep = Math.max(2, half - ((dy < 3) ? 0 : ((gt() * 3) | 0)));  // broken right edge
      wR(ctx, cx - half, baseY + dy - dr, keep + half, 1, dy < 2 ? shade(VERD, 0.18) : VERD);
      wP(ctx, cx - half, baseY + dy - dr, dy < dr / 2 ? RIM : VERD_D);
      wP(ctx, cx + keep - 1, baseY + dy - dr, VERD_D);
    }
    wP(ctx, cx, baseY - dr - 1, RIM_HOT);                 // finial glint
    if (!noGlow) {                                        // last sun catching the dome peak
      const dgx = wX(cx);
      if (dgx > 12 && dgx < W - 12) glow(ctx, dgx, baseY - dr, 3, PAL.amber0);
    }
  }
  // cornice bands + window grids between them
  let band = 0;
  for (let by = top + 16; by < H - 24; by += 26) {
    wR(ctx, x - 1, by, w + 2, 2, PAL.stone2);
    wP(ctx, x - 1, by, RIM);
    wR(ctx, x - 1, by + 2, w + 2, 1, DARK);               // under-cornice shadow
    // verdigris drip streaks under some cornices
    for (let i = 2; i < w - 2; i++) {
      if (gt() < 0.1) wR(ctx, x + i, by + 3, 1, 2 + ((gt() * 4) | 0), VERD_D);
    }
    // two rows of windows per storey; haze kills lights near the bottom
    for (const rowY of [by + 7, by + 16]) {
      if (rowY + 5 > H - 18) continue;
      const litChance = rowY > 205 ? 0.14 : (band === 0 ? 0.55 : 0.45);
      for (let wx = x + 4; wx + 3 <= x + w - 4; wx += 7) {
        const lit = windowAt(ctx, gt, wx, rowY, litChance);
        // a rare big glowing window gets a halo (kept away from the seam)
        if (!noGlow && lit === 2 && gt() < 0.2) {
          const gxp = wX(wx + 1);
          if (gxp > 12 && gxp < W - 12) glow(ctx, gxp, rowY + 2, 4, PAL.amber1);
        }
      }
    }
    band++;
  }
  // gold banner hanging from the first cornice, gently wind-blown
  if (banner) {
    const bx = x + ((w * 0.62) | 0), by = top + 18;
    for (let r = 0; r < 20; r++) {
      const sway = Math.round(Math.sin(r * 0.45) * 1.4);
      const isTail = r > 15;
      const bw = isTail ? 5 - (r - 15) : 5;               // swallowtail taper
      if (isTail) {
        wR(ctx, bx + sway, by + r, 2, 1, GOLD);
        wR(ctx, bx + sway + bw - 1, by + r, 2, 1, GOLD);
      } else {
        wR(ctx, bx + sway, by + r, 5, 1, r === 0 ? GOLD_L : GOLD);
        wP(ctx, bx + sway, by + r, GOLD_L);               // lit left edge
        if (r === 6 || r === 7) wR(ctx, bx + sway + 1, by + r, 3, 1, PAL.ember1); // emblem stripe
      }
    }
    wR(ctx, bx - 1, by - 1, 7, 1, PAL.stone2);            // banner rod
    if (!noGlow) {                                        // warm halo lifting the gold cloth
      const gbx = wX(bx + 2);
      if (gbx > 14 && gbx < W - 14) glow(ctx, gbx, by + 7, 4, GOLD);
    }
  }
  // faint holographic glyphs drifting beside the tower
  if (glyphs) {
    const gx = x - 10;
    for (let k = 0; k < 3; k++) {
      const gy = top + 66 + k * 12;
      wR(ctx, gx, gy, 3, 2, PAL.cyan2);
      wP(ctx, gx + 1, gy, PAL.cyan1);
      wP(ctx, gx + (k & 1), gy - 3, PAL.cyan3);
      const gxp = wX(gx + 1);
      if (gxp > 12 && gxp < W - 12) glow(ctx, gxp, gy + 1, 3, PAL.cyan2);
    }
    wP(ctx, wX(gx + 1), top + 66 + 1, PAL.cyan0);         // one hot glyph pixel
  }
  // base fades into haze with a dithered hem
  wDither(ctx, x, H - 14, w, 6, BODY, DARK);
  wR(ctx, x, H - 8, w, 8, DARK);
}

// ---------------------------------------------------------------------------

export function build() {
  const c = makeCanvas(W, H);
  const ctx = c.getContext('2d');
  const g = rng(9107);

  // --- far arcade tier (one atmospheric step back, higher and paler) ---
  aqueduct(ctx, g, { deckY: 128, period: 64, pierW: 10, deckH: 5, archH: 15, broken: [2, 7], far: true });

  // --- slender back towers (behind the near arcade) ---
  tower(ctx, g, { x: 148, w: 38, top: 86, seed: 21, dome: true });
  tower(ctx, g, { x: 428, w: 34, top: 98, seed: 34 });

  // --- near arcade tier (bigger arches, heavier piers) ---
  aqueduct(ctx, g, { deckY: 192, period: 80, pierW: 13, deckH: 7, archH: 20, broken: [4], far: false });

  // --- foreground colossi ---
  tower(ctx, g, { x: 8,   w: 54, top: 48, seed: 55, banner: true });
  tower(ctx, g, { x: 282, w: 68, top: 22, seed: 89, banner: true, glyphs: true }); // the colossus
  tower(ctx, g, { x: 528, w: 46, top: 58, seed: 13, dome: true });
  tower(ctx, g, { x: 606, w: 44, top: 76, seed: 71, noGlow: true });               // crosses the seam

  // --- floating masonry, torn free of the bastion ---
  const chunks = [
    [70, 106, 9, 6], [104, 86, 6, 4], [236, 68, 7, 5], [262, 118, 5, 4],
    [366, 58, 8, 5], [392, 100, 5, 3], [472, 138, 7, 5], [502, 118, 4, 3],
    [586, 108, 6, 4], [34, 148, 5, 4], [630, 156, 8, 5],                            // last one wraps the seam
  ];
  for (const [cx, cy, cw, ch] of chunks) {
    wR(ctx, cx, cy, cw, ch, BODY);
    wR(ctx, cx, cy, cw, 1, BODY_L);
    wR(ctx, cx, cy + ch - 1, cw, 1, BODY_D);
    wP(ctx, cx, cy, RIM);
    wP(ctx, cx + 1 + ((g() * (cw - 2)) | 0), cy + ch + 2, BODY_D);                  // crumb frozen below
    if (g() < 0.35) wP(ctx, cx + ((cw / 2) | 0), cy + ((ch / 2) | 0), PAL.cyan3);   // dormant rune
  }

  // --- rubble ridge along the bottom (sum-of-sines => perfectly periodic) ---
  for (let x = 0; x < W; x++) {
    const t = (x / W) * Math.PI * 2;
    const hgt = 20 + Math.round(
      6 * Math.sin(t * 3 + 1.3) + 4 * Math.sin(t * 7 + 0.5) + 3 * Math.sin(t * 13 + 2.1)
    );
    wR(ctx, x, H - hgt, 1, hgt, DARK);
    wP(ctx, x, H - hgt, shade(DARK, 0.2));
    if (((x * 7919) % 97) === 3) wP(ctx, x, H - hgt + 4, WIN_DIM);                  // buried ember light
  }

  // --- atmospheric haze: tint only drawn pixels so the sky stays transparent ---
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.globalAlpha = 0.12;
  R(ctx, 0, 175, W, 55, PAL.skyGlow);
  ctx.globalAlpha = 0.2;
  R(ctx, 0, 230, W, 40, PAL.skyGlow);
  ctx.restore();

  // --- thin cloud-sea mist licking the bases (full-width => tiles trivially) ---
  ctx.save();
  ctx.globalAlpha = 0.16;
  R(ctx, 0, 244, W, 26, PAL.skyGlow);
  ctx.globalAlpha = 0.22;
  R(ctx, 0, 256, W, 14, shade(PAL.skyGlow, 0.12));
  ctx.globalAlpha = 0.1;
  for (let x = 0; x < W; x += 2) P(ctx, x, 243, PAL.skyGlow);   // dithered mist edge
  ctx.restore();

  return {
    canvas: c,
    factor: 0.4,
    tileX: true,
    y: 0,
    alpha: 1,
  };
}
