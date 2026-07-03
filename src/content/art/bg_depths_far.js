// AETHERFALL — bg_depths_far.js
// NEON DEPTHS far parallax layer (factor 0.1): a vast dark cavern wall with
// faint teal rock striations, distant magenta/cyan neon glows and reactor
// lights pulsing in the darkness. 480x270, fully opaque, horizontally
// seamless — every feature either uses integer sine cycles across the width
// or is drawn through a wrapping pixel helper (x mod 480).
import { PAL } from './palette.js';
import { makeCanvas, P, R, circleFill, dither, glow, shade, rng } from './util.js';

const W = 480, H = 270;
const TAU = Math.PI * 2;

export function build() {
  const c = makeCanvas(W, H);
  const ctx = c.getContext('2d');
  const rnd = rng(0xDE9F5);

  // ---- derived dark shades (all from PAL via shade) ----
  const ink   = shade(PAL.void, -0.35);        // deepest silhouette
  const void0 = PAL.void;
  const dusk0 = shade(PAL.deepPurple, -0.5);
  const dusk1 = shade(PAL.deepPurple, -0.3);
  const dusk2 = shade(PAL.deepPurple, -0.1);
  const teal0 = shade(PAL.cyan3, -0.75);       // teal-dark floor haze
  const teal1 = shade(PAL.cyan3, -0.62);       // faint striation
  const teal2 = shade(PAL.cyan3, -0.45);       // brighter striation
  const teal3 = shade(PAL.cyan3, -0.25);       // mineral vein highlight
  const vio0  = shade(PAL.violet3, -0.55);     // violet-tinted strata
  const mag0  = shade(PAL.magenta3, -0.45);    // dark magenta conduit energy
  const pipe0 = shade(PAL.metal3, -0.45);      // conduit metal

  // ---- seam-safe helpers ----
  const px = (x, y, col) => {
    if (y < 0 || y >= H) return;
    P(ctx, ((Math.round(x) % W) + W) % W, y, col);
  };
  const wglow = (cx, cy, r, col) => {
    glow(ctx, cx - W, cy, r, col);
    glow(ctx, cx, cy, r, col);
    glow(ctx, cx + W, cy, r, col);
  };
  const ambient = (cx, cy, r, col, a) => { // soft wrapped light wash
    ctx.save();
    ctx.globalAlpha = a;
    circleFill(ctx, (cx | 0) - W, cy | 0, r, col);
    circleFill(ctx, cx | 0, cy | 0, r, col);
    circleFill(ctx, (cx | 0) + W, cy | 0, r, col);
    ctx.restore();
  };

  // ============ 1. cavern gradient: black ceiling -> purple wall -> teal floor
  R(ctx, 0, 0, W, 28, ink);
  dither(ctx, 0, 28, W, 8, ink, void0);
  R(ctx, 0, 36, W, 44, void0);
  dither(ctx, 0, 80, W, 10, void0, dusk0);
  R(ctx, 0, 90, W, 50, dusk0);
  dither(ctx, 0, 140, W, 10, dusk0, dusk1);
  R(ctx, 0, 150, W, 50, dusk1);
  dither(ctx, 0, 200, W, 10, dusk1, teal0);
  R(ctx, 0, 210, W, 40, teal0);
  dither(ctx, 0, 250, W, 6, teal0, dusk0);
  R(ctx, 0, 256, W, 14, dusk0);

  // ============ 2. faint teal rock striations (integer cycles => seamless)
  for (let s = 0; s < 16; s++) {
    const baseY = 34 + s * 14 + (rnd() * 8 - 4);
    const a1 = 2 + rnd() * 5, a2 = 1 + rnd() * 3;
    const k1 = 1 + ((rnd() * 3) | 0), k2 = 3 + ((rnd() * 5) | 0);
    const p1 = rnd() * TAU, p2 = rnd() * TAU;
    const gk = 1 + ((rnd() * 3) | 0), gp = rnd() * TAU; // gap wave (also seamless)
    const roll = rnd();
    const upper = baseY < 88;
    const col = upper ? shade(void0, 0.06)
      : roll < 0.25 ? vio0
      : roll < 0.75 ? teal1
      : teal2;
    const thick = !upper && rnd() < 0.45;
    const under = shade(col, -0.3);
    for (let x = 0; x < W; x++) {
      if (Math.sin(TAU * gk * x / W + gp) > 0.86) continue; // natural breaks
      const y = Math.round(
        baseY + a1 * Math.sin(TAU * k1 * x / W + p1) + a2 * Math.sin(TAU * k2 * x / W + p2)
      );
      px(x, y, col);
      if (thick && ((x + s) % 3)) px(x, y + 1, under);
    }
  }

  // glowing mineral veins — short bright teal seams in the rock
  for (let v = 0; v < 8; v++) {
    const vx = (rnd() * W) | 0;
    const vy = 96 + ((rnd() * 145) | 0);
    const len = 4 + ((rnd() * 8) | 0);
    for (let i = 0; i < len; i++) px(vx + i, vy + (((i / 3) | 0) & 1), teal2);
    px(vx + ((len / 2) | 0), vy, teal3);
    ambient(vx + ((len / 2) | 0), vy, 4, PAL.cyan3, 0.10); // wide dim wash
    wglow(vx + ((len / 2) | 0), vy, 2, PAL.cyan2);         // tight emissive halo
  }

  // dark vertical fissures wandering down the wall
  for (let k = 0; k < 12; k++) {
    let fx = rnd() * W;
    const fy = 60 + rnd() * 150;
    const len = 14 + rnd() * 30;
    for (let j = 0; j < len; j++) {
      px(fx, fy + j, ink);
      if (rnd() < 0.4) fx += rnd() < 0.5 ? -1 : 1;
    }
  }

  // rock grain speckle
  for (let i = 0; i < 540; i++) {
    const sx = rnd() * W, sy = 30 + rnd() * 226;
    const r = rnd();
    const col = r < 0.55 ? shade(void0, 0.05) : r < 0.8 ? dusk2 : r < 0.95 ? teal1 : teal2;
    px(sx, sy | 0, col);
  }

  // ============ 3. cavern silhouettes
  // stalactites hanging from the ceiling
  const stal = [
    [18, 10, 26], [52, 16, 44], [95, 8, 20], [150, 22, 55], [210, 12, 30],
    [260, 18, 40], [318, 10, 24], [366, 24, 60], [430, 14, 34], [464, 8, 18],
  ];
  const stalRim = shade(void0, 0.13); // faint upper-left edge separates rock from wall
  for (const [sx, sw, sl] of stal) {
    for (let i = -sw; i <= sw; i++) {
      const t = 1 - Math.abs(i) / sw;
      const hgt = Math.max(1, Math.round(sl * Math.pow(t, 1.4)));
      for (let j = 0; j < hgt; j++) px(sx + i, j, ink);
    }
    for (let i = -sw; i < 0; i++) { // rim the lower-left contour of the cone
      const t = 1 - Math.abs(i) / sw;
      const hgt = Math.max(1, Math.round(sl * Math.pow(t, 1.4)));
      if ((i & 1) === 0) px(sx + i, hgt - 1, stalRim);
    }
    if (sl >= 40) { px(sx, sl - 1, teal1); wglow(sx, sl - 1, 2, PAL.cyan3); } // long tips catch faint reactor uplight
  }

  // floor mounds / distant rubble ridges
  const mounds = [[40, 55, 34], [130, 70, 26], [250, 90, 40], [350, 60, 22], [446, 75, 32]];
  for (const [mx, mw, mh] of mounds) {
    for (let i = -mw; i <= mw; i++) {
      const hgt = Math.round(mh * Math.sqrt(Math.max(0, 1 - (i / mw) * (i / mw))));
      for (let j = 0; j < hgt; j++) px(mx + i, H - 1 - j, ink);
      if (hgt > 2 && ((i + mx) % 3 === 0)) px(mx + i, H - 1 - hgt, shade(ink, 0.07)); // crest
    }
  }

  // two colossal support columns, floor to ceiling
  const colEdge = shade(ink, 0.08);
  for (const [cx0, cw] of [[70, 13], [345, 16]]) {
    for (let y = 0; y < H; y++) {
      const notch = (y % 30) < 2 ? 1 : 0; // segmented plating
      for (let i = notch; i < cw - notch; i++) px(cx0 + i, y, ink);
      px(cx0 + notch, y, colEdge); // faint upper-left catch light
      if (y % 30 === 2) for (let i = 0; i < cw; i++) px(cx0 + i, y, shade(ink, 0.05));
    }
    for (let y = 10; y < H; y += 18) px(cx0 + cw - 3, y, teal1); // dim service lights
    px(cx0 + cw - 3, 46, PAL.cyan1); // one live beacon
    px(cx0 + cw - 3, 45, PAL.cyan0); // hot pixel
    ambient(cx0 + cw - 3, 46, 4, PAL.cyan3, 0.12);
    wglow(cx0 + cw - 3, 46, 3, PAL.cyan2);
    px(cx0, 0, colEdge); // faint upper-left cap catch light
  }

  // ============ 4. large soft color washes (depth + atmosphere)
  ambient(200, 85, 60, PAL.violet3, 0.05);
  ambient(60, 232, 50, PAL.cyan3, 0.06);
  ambient(295, 248, 70, PAL.magenta3, 0.05);

  // ============ 5. neon conduits bolted across the wall
  const conduit = (cy0, dark, bright, phase, nodeOff) => {
    R(ctx, 0, cy0, W, 1, pipe0);
    R(ctx, 0, cy0 + 1, W, 1, shade(pipe0, -0.3));
    for (let x = 0; x < W; x++) {
      const s = Math.sin(TAU * 6 * x / W + phase); // 6 cycles: seamless pulses
      if (s > 0.55) px(x, cy0, dark);
      if (s > 0.9) px(x, cy0, bright);
    }
    for (let n = 0; n < 8; n++) { // 8 junction nodes, evenly spaced => wraps clean
      const nx = (n * 60 + nodeOff) % W;
      px(nx, cy0 - 1, dark);
      px(nx, cy0, bright);
      ambient(nx, cy0, 2, bright, 0.28);
    }
  };
  conduit(160, mag0, PAL.magenta2, 1.3, 22);
  conduit(232, teal1, PAL.cyan2, 4.0, 48);

  // ============ 6. distant facility windows (tiny light clusters)
  const clusters = [
    [30, 118, 4, 2, 'c'], [160, 96, 3, 2, 'm'], [205, 176, 5, 2, 'c'],
    [278, 130, 3, 3, 'm'], [390, 150, 4, 2, 'c'], [452, 100, 3, 2, 'm'],
    [95, 148, 3, 2, 'c'], [330, 205, 4, 2, 'c'],
  ];
  for (const [gx, gy, nc, nr, kind] of clusters) {
    const dim = kind === 'c' ? shade(PAL.cyan2, -0.35) : shade(PAL.magenta2, -0.35);
    const bright = kind === 'c' ? PAL.cyan1 : PAL.magenta1;
    for (let i = -2; i < nc * 2 + 1; i++) // dark structure behind the lights
      for (let j = -2; j < nr * 2 + 1; j++) px(gx + i, gy + j, ink);
    for (let j = 0; j < nr; j++)
      for (let i = 0; i < nc; i++) {
        if ((i * 7 + j * 5 + gx) % 11 === 3) continue; // some windows dark
        px(gx + i * 2, gy + j * 2, dim);
      }
    px(gx + 2, gy, bright); // one window still lit bright
    ambient(gx + 2, gy, 2, bright, 0.22);
  }

  // ============ 7. reactor cores — the hero glows of the darkness
  const reactor = (cx0, cy0, ramp) => {
    const [hot, mid, rim] = ramp;
    ambient(cx0, cy0 + 3, 40, rim, 0.07); // wide wash lighting the rock
    ambient(cx0, cy0 + 3, 22, mid, 0.10);
    for (let i = -8; i <= 8; i++) // housing silhouette
      for (let j = -2; j <= 12; j++) px(cx0 + i, cy0 + j, ink);
    for (let i = -6; i <= 6; i++) px(cx0 + i, cy0 - 3, ink); // roof
    // upper-left rim light on the housing silhouette
    for (let i = -6; i <= 6; i++) px(cx0 + i, cy0 - 3, i < 0 ? shade(ink, 0.11) : shade(ink, 0.05));
    for (let j = -2; j <= 12; j++) if ((j & 1) === 0) px(cx0 - 8, cy0 + j, shade(ink, 0.08));
    for (let j = 0; j < 7; j++) px(cx0, cy0 - 4 - j, ink);   // mast
    px(cx0 - 1, cy0 - 6, shade(ink, 0.09));                  // mast edge catch
    px(cx0, cy0 - 11, hot);                                   // mast beacon
    wglow(cx0, cy0 - 11, 3, mid);
    for (let j = -3; j <= 3; j++)                             // circular core window
      for (let i = -3; i <= 3; i++) {
        const d2 = i * i + j * j;
        if (d2 > 10) continue;
        px(cx0 + i, cy0 + 3 + j, d2 <= 1 ? hot : d2 <= 4 ? mid : rim);
      }
    px(cx0, cy0 + 3, PAL.white); // hot pixel
    wglow(cx0, cy0 + 3, 6, mid);
    px(cx0 - 7, cy0 + 1, PAL.amber0); // tiny warning light
    px(cx0 + 7, cy0 + 8, hot);        // side status light
    px(cx0 + 6, cy0 - 2, shade(ink, 0.1)); // top-left plating catch light
  };
  reactor(110, 190, [PAL.cyan1, PAL.cyan2, PAL.cyan3]);
  reactor(250, 148, [PAL.magenta1, PAL.magenta2, PAL.magenta3]);
  reactor(415, 205, [PAL.cyan1, PAL.cyan2, PAL.cyan3]);

  // ============ 8. floor haze
  ctx.save();
  ctx.globalAlpha = 0.10;
  R(ctx, 0, 236, W, 8, teal2);
  ctx.globalAlpha = 0.07;
  R(ctx, 0, 246, W, 12, teal2);
  ctx.restore();

  return {
    canvas: c,
    factor: 0.1,
    tileX: true,
    y: 0,
    alpha: 1,
  };
}
