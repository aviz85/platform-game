// AETHERFALL — bg_forest_far: LUMEN WOODS far parallax layer (factor 0.1).
// Deep violet dithered sky falling into a magenta horizon glow, star field,
// faint nebula wisps, two shattered moons (violet stone + rose), and distant
// floating-island silhouettes hanging on the horizon, with a dark abyss below.
// 480x270, fully opaque, seamless horizontal tiling: every scattered element is
// plotted through a wrapping px() helper and the dither pattern period divides 480.
import { PAL } from './palette.js';
import { makeCanvas, P, glow, shade, rng } from './util.js';

export function build() {
  const W = 480, H = 270;
  const c = makeCanvas(W, H);
  const ctx = c.getContext('2d');
  const rnd = rng(0x1f0537);

  const wrapX = (x) => (((Math.round(x)) % W) + W) % W;
  const px = (x, y, col) => { y = Math.round(y); if (y >= 0 && y < H) P(ctx, wrapX(x), y, col); };

  // 4x4 Bayer ordered-dither threshold in 0..1 — pattern period 4 divides 480,
  // so the dithering itself tiles seamlessly across the wrap seam.
  const BAYER = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
  ];
  const bth = (x, y) => (BAYER[y & 3][x & 3] + 0.5) / 16;

  // ---------------------------------------------------------------- sky bands
  // Smooth ordered-dither gradient: near-black zenith -> violet -> magenta
  // horizon bloom -> back down into the dark abyss beneath the archipelago.
  const stops = [
    [0, PAL.void],
    [30, PAL.skyTop],
    [72, PAL.skyMid],
    [118, PAL.skyLow],
    [160, PAL.skyGlow],
    [192, PAL.horizon],
    [214, PAL.horizon],          // held bright band at the horizon line
    [226, PAL.skyGlow],
    [240, PAL.skyLow],
    [256, PAL.skyMid],
    [270, PAL.skyTop],
  ];
  for (let y = 0; y < H; y++) {
    let i = 0;
    while (i < stops.length - 2 && y >= stops[i + 1][0]) i++;
    const [y0, c0] = stops[i];
    const [y1, c1] = stops[i + 1];
    const t = y1 > y0 ? (y - y0) / (y1 - y0) : 0;
    for (let x = 0; x < W; x++) P(ctx, x, y, t > bth(x, y) ? c1 : c0);
  }

  // ------------------------------------------------------------- nebula wisps
  // Faint dithered dust clouds: scattered low-alpha pixels along a curved spine.
  // One wisp deliberately crosses the wrap seam (px() handles the wrap).
  const gauss = () => (rnd() + rnd() + rnd()) / 1.5 - 1; // ~ -1..1, center-biased
  const wisp = (cx, cy, len, ang, thick, wave, cols, n) => {
    const ca = Math.cos(ang), sa = Math.sin(ang);
    for (let i = 0; i < n; i++) {
      const t = rnd() * 2 - 1;                       // position along spine
      const swell = 1 - Math.abs(t) * 0.75;          // taper toward the tips
      const off = gauss() * thick * swell + Math.sin(t * 3.1 + cx) * wave;
      const x = cx + t * len * ca - off * sa;
      const y = cy + t * len * sa + off * ca;
      const r = rnd();
      px(x, y, r < 0.16 ? cols[2] : r < 0.5 ? cols[1] : cols[0]);
    }
  };
  ctx.globalAlpha = 0.4;
  wisp(138, 88, 82, -0.24, 9, 3, [PAL.skyMid, shade(PAL.violet3, 0.06), PAL.violet2], 520);
  wisp(300, 52, 64, 0.18, 7, 2, [PAL.skyMid, PAL.magenta3, shade(PAL.magenta2, -0.1)], 380);
  wisp(474, 128, 88, -0.1, 8, 3, [PAL.skyLow, shade(PAL.violet3, 0.12), PAL.violet2], 480); // wraps the seam
  wisp(220, 148, 52, 0.3, 6, 2, [PAL.skyLow, PAL.magenta3, shade(PAL.cyan3, -0.1)], 260);
  ctx.globalAlpha = 0.22; // whisper-thin bright cores
  wisp(138, 86, 60, -0.24, 4, 2, [PAL.violet1, PAL.magenta2, PAL.violet1], 130);
  wisp(474, 126, 60, -0.1, 4, 2, [PAL.violet1, PAL.magenta2, PAL.cyan2], 120);
  ctx.globalAlpha = 1;

  // --------------------------------------------------------------- star field
  const starCols = [PAL.stone0, PAL.stone0, PAL.violet0, PAL.violet0, PAL.cyan0, PAL.white];
  for (let i = 0; i < 150; i++) {
    const x = rnd() * W;
    const y = Math.pow(rnd(), 1.35) * 188;           // denser near the zenith
    const col = starCols[(rnd() * starCols.length) | 0];
    px(x, y, col);
    if (rnd() < 0.14) px(x + 1, y, shade(col, -0.35)); // faint double star
  }
  // bright sparkle stars: white core + colored cross arms (kept off the seam so
  // their tiny glow halos never clip)
  for (let i = 0; i < 11; i++) {
    const x = (12 + rnd() * (W - 24)) | 0;
    const y = (6 + Math.pow(rnd(), 1.3) * 160) | 0;
    const arm = rnd() < 0.5 ? PAL.violet0 : PAL.cyan0;
    px(x, y, PAL.white);
    px(x - 1, y, arm); px(x + 1, y, arm);
    px(x, y - 1, arm); px(x, y + 1, arm);
    if (i < 4) glow(ctx, x, y, 3, arm);
  }

  // ------------------------------------------------------------ shattered moons
  // Per-pixel lit sphere with ordered-dither shading. `chunk` shears off a cap
  // along the lower-right diagonal leaving a real sky gap (so it reads as a
  // drifting fragment), `cut` bites a circle out of the rim.
  const sphere = (bx, by, br, ramp, opt = {}) => {
    const craters = opt.craters || [];
    const ck = opt.chunk;
    for (let dy = -br; dy <= br; dy++) {
      for (let dx = -br; dx <= br; dx++) {
        const d2 = dx * dx + dy * dy;
        if (d2 > br * br) continue;
        const nx = dx / br, ny = dy / br;
        if (opt.cut) {
          const cdx = nx - opt.cut.x, cdy = ny - opt.cut.y;
          if (cdx * cdx + cdy * cdy < opt.cut.r * opt.cut.r) continue; // bitten away
        }
        const diag = (nx + ny) * 0.707;
        let ox = 0, oy = 0, capEdge = false;
        if (ck) {
          if (diag > ck.at && diag < ck.at + ck.gap) continue;     // open sky gap
          if (diag >= ck.at + ck.gap) {
            ox = ck.dx; oy = ck.dy;
            capEdge = diag < ck.at + ck.gap + 0.09;                // fresh fracture face
          }
        }
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
        let lum = -0.6 * nx - 0.6 * ny + 0.5 * nz;   // light from upper-left
        for (const cr of craters) {
          const kx = nx - cr.x, ky = ny - cr.y;
          if (kx * kx + ky * ky < cr.r * cr.r) lum -= 0.34;
        }
        lum += (bth(bx + dx + ox, by + dy + oy) - 0.5) * 0.22; // dithered thresholds
        const idx = lum > 0.58 ? 0 : lum > 0.3 ? 1 : lum > 0.02 ? 2 : lum > -0.3 ? 3 : 4;
        let col = ramp[Math.min(idx, ramp.length - 1)];
        if (capEdge) col = ((dx + dy) & 3) === 0 ? PAL.cyan1 : PAL.cyan3; // molten rim
        px(bx + dx + ox, by + dy + oy, col);
      }
    }
  };

  // -- big moon: violet stone, sheared apart with a glowing cyan fissure
  const M1 = { x: 352, y: 76, r: 24 };
  glow(ctx, M1.x, M1.y, M1.r + 12, PAL.violet2);
  const moonRamp = [shade(PAL.stone0, 0.3), PAL.stone0, PAL.stone1, PAL.stone2, PAL.stone3];
  sphere(M1.x, M1.y, M1.r, moonRamp, {
    chunk: { at: 0.38, gap: 0.13, dx: 6, dy: 5 },
    craters: [
      { x: -0.42, y: 0.1, r: 0.2 }, { x: 0.12, y: -0.44, r: 0.15 },
      { x: 0.3, y: 0.05, r: 0.11 }, { x: -0.12, y: 0.38, r: 0.13 },
    ],
  });
  // glowing fissure along the main body's fracture face: nx+ny = at/0.707 -> dy = fk - dx
  const fk = Math.round((0.38 / 0.707) * M1.r);
  glow(ctx, M1.x + fk / 2 + 3, M1.y + fk / 2 + 3, 10, PAL.cyan2);
  for (let dx = -M1.r; dx <= M1.r; dx++) {
    const dy = fk - dx;
    if (dx * dx + dy * dy > M1.r * M1.r * 0.96) continue;
    px(M1.x + dx, M1.y + dy, ((dx & 3) === 0) ? PAL.cyan0 : PAL.cyan1);
    px(M1.x + dx, M1.y + dy - 1, ((dx & 3) === 2) ? PAL.cyan2 : PAL.cyan3);
    if ((dx & 7) === 5) { // sparks bleeding into the gap
      px(M1.x + dx + 1, M1.y + dy + 2, PAL.cyan1);
      px(M1.x + dx + 2, M1.y + dy + 4, PAL.cyan3);
    }
  }
  px(M1.x + fk / 2, M1.y + fk / 2, PAL.white); // hot core pixel on the fissure
  // secondary hairline crack across the lit face
  for (let s = -9; s <= 6; s++) {
    const cx2 = M1.x - 4 + s, cy2 = M1.y - 6 + Math.round(s * 0.35) + ((s & 2) ? 1 : 0);
    px(cx2, cy2, (s & 3) === 1 ? PAL.cyan2 : PAL.stone3);
  }
  // drifting debris shards off the sheared edge
  const shards1 = [
    [M1.x + M1.r + 8, M1.y + 13, 2], [M1.x + M1.r + 14, M1.y + 20, 1],
    [M1.x + 15, M1.y + M1.r + 9, 2], [M1.x + 24, M1.y + M1.r + 4, 1],
    [M1.x + M1.r + 5, M1.y + 2, 1],
  ];
  for (const [sx, sy, sr] of shards1) {
    for (let dy = -sr; dy <= sr; dy++) for (let dx = -sr; dx <= sr; dx++) {
      if (Math.abs(dx) + Math.abs(dy) > sr) continue;
      px(sx + dx, sy + dy, dx + dy < 0 ? PAL.stone1 : PAL.stone3);
    }
    px(sx - sr, sy, PAL.stone0);
    if (sr > 1) px(sx, sy, PAL.cyan1); // crystal heart glint
  }

  // -- small moon: dusty rose, rim bitten off with floating fragments
  const M2 = { x: 96, y: 50, r: 12 };
  glow(ctx, M2.x, M2.y, M2.r + 8, PAL.magenta2);
  const roseRamp = [shade(PAL.horizon, 0.4), shade(PAL.horizon, 0.1), shade(PAL.horizon, -0.28), shade(PAL.horizon, -0.5), PAL.shadow];
  sphere(M2.x, M2.y, M2.r, roseRamp, {
    cut: { x: 0.62, y: -0.5, r: 0.52 },
    craters: [{ x: -0.3, y: 0.25, r: 0.22 }, { x: 0.15, y: 0.45, r: 0.14 }],
  });
  // jagged glowing edge along the bite + fragments drifting away
  px(M2.x + 4, M2.y - 8, PAL.magenta1); px(M2.x + 7, M2.y - 6, PAL.magenta1);
  px(M2.x + 9, M2.y - 3, PAL.magenta0); px(M2.x + 6, M2.y - 7, PAL.magenta0);
  const frags2 = [[M2.x + 12, M2.y - 11, 1], [M2.x + 17, M2.y - 8, 1], [M2.x + 15, M2.y - 14, 0]];
  for (const [sx, sy, sr] of frags2) {
    px(sx, sy, shade(PAL.horizon, 0.1));
    if (sr) { px(sx + 1, sy, shade(PAL.horizon, -0.4)); px(sx, sy + 1, shade(PAL.horizon, -0.4)); px(sx - 1, sy, shade(PAL.horizon, 0.4)); }
  }
  px(M2.x + 13, M2.y - 10, PAL.magenta0);

  // ------------------------------------------------- horizon haze (behind isles)
  ctx.globalAlpha = 0.4;
  for (let i = 0; i < 26; i++) {
    const y = 196 + rnd() * 22;
    const x0 = rnd() * W;
    const len = 8 + rnd() * 34;
    const col = rnd() < 0.5 ? shade(PAL.horizon, 0.12) : PAL.skyGlow;
    for (let dx = 0; dx < len; dx += 2) px(x0 + dx, y, col);
  }
  ctx.globalAlpha = 1;

  // ------------------------------------------- floating island silhouettes
  // Two depth rows against the horizon bloom. Domed tops, tapering rocky
  // undersides, dangling debris. One front island crosses the wrap seam.
  const island = (cx, hw, top, hang, baseY, fill, rim, seed) => {
    const irnd = rng(seed);
    const jag = [];
    for (let i = 0; i <= hw * 2; i++) jag.push(irnd());
    for (let i = -hw; i <= hw; i++) {
      const u = i / hw;
      const dome = Math.pow(Math.max(0, 1 - u * u), 0.65);
      const hTop = Math.max(1, Math.round(top * dome + jag[i + hw] * 1.6 - 0.8));
      const hBot = Math.round(hang * Math.pow(Math.max(0, 1 - Math.abs(u)), 0.55) * (0.65 + jag[i + hw] * 0.5));
      for (let y = baseY - hTop; y <= baseY + hBot; y++) px(cx + i, y, fill);
      px(cx + i, baseY - hTop, rim);                     // sunset rim light on top
      if (jag[i + hw] > 0.8 && hBot > 3) {               // dangling rock motes
        px(cx + i, baseY + hBot + 2, fill);
        if (jag[i + hw] > 0.92) px(cx + i, baseY + hBot + 4, fill);
      }
    }
    return irnd;
  };
  const backFill = shade(PAL.skyGlow, -0.2), backRim = shade(PAL.horizon, 0.14);
  const frontFill = shade(PAL.skyLow, -0.22), frontRim = PAL.skyGlow;
  island(40, 34, 7, 11, 213, backFill, backRim, 11);
  island(152, 26, 5, 8, 211, backFill, backRim, 22);
  island(262, 40, 8, 13, 214, backFill, backRim, 33);
  island(384, 28, 6, 9, 212, backFill, backRim, 44);
  island(98, 22, 9, 15, 222, frontFill, frontRim, 55);
  island(212, 17, 7, 12, 220, frontFill, frontRim, 66);
  island(330, 26, 11, 17, 223, frontFill, frontRim, 77);
  island(470, 29, 10, 18, 221, frontFill, frontRim, 88); // wraps across the seam
  // faraway life: a few crystal glints and one warm lantern on the front isles
  px(330, 211, PAL.cyan1); px(324, 213, PAL.cyan2); px(331, 210, PAL.cyan0);
  px(98, 212, PAL.cyan2); px(99, 211, PAL.cyan1);
  px(470, 210, PAL.amber1); px(470, 209, PAL.amber0);
  px(212, 214, PAL.amber1);

  // ------------------------------------------------ foreground haze (over isles)
  ctx.globalAlpha = 0.3;
  for (let i = 0; i < 16; i++) {
    const y = 212 + rnd() * 18;
    const x0 = rnd() * W;
    const len = 10 + rnd() * 40;
    for (let dx = 0; dx < len; dx += 2) px(x0 + dx, y, shade(PAL.horizon, 0.06));
  }
  ctx.globalAlpha = 1;

  return {
    canvas: c,
    factor: 0.1,
    tileX: true,
    y: 0,
    alpha: 1,
  };
}
