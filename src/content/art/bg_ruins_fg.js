// AETHERFALL — bg_ruins_fg — SKY BASTION foreground layer (drawn OVER gameplay).
// Bottom ~74px: a drifting cloud sea, wind-torn fog wisps, and broken balustrade
// silhouettes of a shattered sky-bridge — near-outline darks with a faint sunset-gold
// rim light catching handrails and post caps. Mostly transparent; never touches the
// middle of the screen. Tiles horizontally (every pixel goes through wrap()).
import { PAL } from './palette.js';
import { makeCanvas, P, rng, shade } from './util.js';

const W = 640, H = 270;
const TAU = Math.PI * 2;

export function build() {
  const c = makeCanvas(W, H);
  const ctx = c.getContext('2d');

  // every pixel wraps horizontally -> seamless tileX
  const px = (x, y, col, a = 1) => {
    y = Math.round(y);
    if (y < 0 || y >= H) return;
    x = Math.round(x);
    ctx.globalAlpha = a;
    P(ctx, ((x % W) + W) % W, y, col);
    ctx.globalAlpha = 1;
  };

  // wrapped emissive bloom — radial falloff, tiles seamlessly (glow() can't wrap)
  const goldGlow = (cx, cy, r, col, a) => {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const d = Math.hypot(dx, dy);
        if (d > r) continue;
        const f = 1 - d / r;
        px(cx + dx, cy + dy, col, a * f * f);
      }
    }
  };
  // 4x4 ordered-dither offset (−0.5..~0.44) to break gradient banding, deterministic
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const bayer = (x, y) => BAYER[(y & 3) * 4 + (x & 3)] / 16 - 0.47;

  // ---- soft fog wisp: flat lens shape, dithered edges, optional lit top ----
  function wisp(cx, cy, len, th, col, a, seed, topLight, lightA) {
    const r = rng(seed);
    const hl = len / 2;
    for (let dx = -hl; dx <= hl; dx++) {
      const t = dx / hl; // -1..1
      const hh = th * Math.sqrt(Math.max(0, 1 - t * t));
      if (hh < 0.6) { if (r() < 0.5) px(cx + dx, cy, col, a * 0.6); continue; }
      const yTop = cy - hh / 2 + Math.sin(t * Math.PI) * 1.4; // gentle S drift
      for (let dy = 0; dy < hh; dy++) {
        const nearEdge = dy < 1 || dy > hh - 2 || Math.abs(t) > 0.72;
        if (nearEdge && r() < 0.42) continue; // ragged, airy edges
        px(cx + dx, yTop + dy, col, a);
      }
      if (topLight && Math.abs(t) < 0.62 && r() < 0.34) {
        px(cx + dx, yTop - 1, topLight, lightA);
      }
    }
  }

  // =====================================================================
  // 1) HIGH DRIFT — faint torn streaks riding the wind (y ~198..232)
  // =====================================================================
  const hi = [
    // [cx, cy, len, th, alpha, seed, litTop]
    [60, 214, 120, 3, 0.13, 11, false],
    [188, 203, 88, 2.6, 0.11, 12, true],
    [300, 222, 150, 3.4, 0.14, 13, false],
    [420, 208, 96, 2.4, 0.10, 14, true],
    [520, 227, 130, 3, 0.13, 15, false],
    [606, 200, 76, 2.2, 0.09, 16, false],
    [130, 230, 90, 2.6, 0.12, 17, true],
  ];
  for (const [cx, cy, len, th, a, s, lit] of hi) {
    wisp(cx, cy, len, th, PAL.shadow, a, s, lit ? PAL.skyGlow : null, a * 0.9);
  }
  // stray fog motes between streaks
  {
    const r = rng(77);
    for (let i = 0; i < 46; i++) {
      const x = r() * W, y = 200 + r() * 34;
      px(x, y, PAL.shadow, 0.08 + r() * 0.07);
      if (r() < 0.4) px(x + 1, y, PAL.violet3, 0.07);
    }
  }

  // =====================================================================
  // 2) CLOUD SEA — rolling bank filling the bottom edge (periodic contour)
  // =====================================================================
  const seaTop = (x) =>
    249 +
    3.6 * Math.sin(TAU * (x / W) * 3 + 1.2) +
    2.4 * Math.sin(TAU * (x / W) * 7 + 4.0) +
    1.3 * Math.sin(TAU * (x / W) * 13 + 2.4);
  {
    const r = rng(303);
    for (let x = 0; x < W; x++) {
      const yT = Math.round(seaTop(x));
      // sunset catching the crest — layered ramp, no hard band
      if (r() < 0.5) px(x, yT - 1, PAL.horizon, 0.22);
      if (r() < 0.28) px(x, yT - 1, PAL.skyGlow, 0.16);
      if (r() < 0.055) { // rare gold glint on a crest — bloom + hot core
        goldGlow(x, yT - 2, 2, PAL.gold1, 0.12);
        px(x, yT - 2, PAL.gold0, 0.5);
      }
      px(x, yT, PAL.skyGlow, 0.3);
      // upper body — checkered translucency (dither, no banding)
      for (let y = yT + 1; y < yT + 6; y++) {
        if (((x + y) & 1) === 0) px(x, y, PAL.shadow, 0.5);
        else px(x, y, PAL.deepPurple, 0.34);
      }
      // mid body
      for (let y = yT + 6; y < yT + 13; y++) {
        px(x, y, PAL.deepPurple, 0.66);
        if (((x * 3 + y) & 7) === 0) px(x, y, PAL.shadow, 0.4);
      }
      // deep base fading to void at the screen edge — bayer-dithered alpha, no banding
      for (let y = yT + 13; y < H; y++) {
        const t = (y - (yT + 13)) / Math.max(1, H - (yT + 13));
        const a = 0.72 + t * 0.16 + bayer(x, y) * 0.07;
        px(x, y, ((x + y) & 1) ? PAL.void : PAL.deepPurple, a);
      }
    }
  }

  // =====================================================================
  // 3) BROKEN BALUSTRADES — shattered sky-bridge railings in silhouette
  // =====================================================================
  const dkGold = shade(PAL.gold1, -0.25);

  // heavy square post with cap or jagged break
  function post(x0, baseY, h, broken, seed) {
    const r = rng(seed);
    const topY = baseY - h;
    for (let i = 0; i < 4; i++) {
      const jag = broken ? Math.floor(r() * 4) : 0;
      const col = i === 0 ? PAL.deepPurple : i === 3 ? PAL.outline : PAL.void;
      for (let y = topY + jag; y <= baseY; y++) px(x0 + i, y, col, 1);
      if (broken && r() < 0.6) px(x0 + i, topY + jag - 1, PAL.outline, 0.85); // splinter
    }
    if (!broken) {
      // cap slab + finial catching the sun
      for (let i = -1; i <= 4; i++) {
        px(x0 + i, topY - 1, PAL.void, 1);
        px(x0 + i, topY - 2, PAL.outline, 1);
      }
      // finial catching the sun: bloom → gold ramp → hot white core
      goldGlow(x0 + 1, topY - 3, 3, PAL.gold1, 0.16);
      px(x0 - 1, topY - 3, dkGold, 0.44);
      px(x0, topY - 3, PAL.gold1, 0.62);
      px(x0 + 1, topY - 3, PAL.gold0, 0.85);
      px(x0 + 1, topY - 4, PAL.white, 0.7); // hot spark core
      px(x0 + 2, topY - 3, dkGold, 0.4);
    } else {
      px(x0, topY + Math.floor(r() * 3), PAL.gold1, 0.42); // faint light on the break
    }
    // left-edge rim (light from upper-left)
    px(x0, topY + (broken ? 2 : 0), PAL.gold1, 0.4);
    px(x0, topY + (broken ? 3 : 1), dkGold, 0.28);
    if (r() < 0.7) px(x0, topY + 4, dkGold, 0.16);
    // erosion notches
    for (let k = 0; k < 3; k++) {
      if (r() < 0.7) px(x0 + Math.floor(r() * 4), topY + 4 + Math.floor(r() * (h - 5)), PAL.outline, 0.9);
    }
  }

  // a run of railing: sill + handrail (with a torn gap) + balusters
  function railing(x0, baseY, len, seed) {
    const r = rng(seed);
    const topY = baseY - 14;
    const gapA = 0.3 + r() * 0.28;          // torn-out section (fractions of len)
    const gapB = gapA + 0.13 + r() * 0.14;
    const inGap = (f) => f > gapA && f < gapB;

    // deck sill — the bridge edge itself, ragged underside
    for (let dx = 0; dx < len; dx++) {
      const x = x0 + dx;
      px(x, baseY - 1, PAL.outline, 1);
      px(x, baseY, PAL.void, 1);
      if (r() < 0.14) px(x, baseY + 1, PAL.void, 0.85);
      if (r() < 0.05) px(x, baseY - 2, PAL.deepPurple, 0.9); // rubble on the deck
    }
    // handrail — droops toward the broken gap, gold rim along the top
    for (let dx = 0; dx < len; dx++) {
      const f = dx / len;
      if (inGap(f)) continue;
      const x = x0 + dx;
      const dEdge = Math.min(Math.abs(f - gapA), Math.abs(f - gapB));
      const near = f > gapA - 0.05 && f < gapB + 0.05;
      const droop = near && dEdge < 0.05 ? Math.round((0.05 - dEdge) * 56) : 0;
      const y = topY + droop;
      px(x, y, PAL.outline, 1);
      px(x, y + 1, PAL.void, 1);
      if (r() < 0.5) px(x, y - 1, PAL.gold1, 0.34);        // sun skimming the rail
      else if (r() < 0.14) { px(x, y - 1, PAL.gold0, 0.55); if (r() < 0.3) goldGlow(x, y - 1, 2, PAL.gold1, 0.1); } // sparkle w/ bloom
    }
    // balusters every 5px — some snapped, some hanging, some gone
    for (let dx = 4; dx < len - 4; dx += 5) {
      const f = dx / len;
      const x = x0 + dx;
      let top = topY + 2, bot = baseY - 2;
      if (inGap(f)) {
        if (r() < 0.45) continue;                          // ripped out
        top = bot - 2 - Math.floor(r() * 4);               // snapped stub on the sill
      } else if (r() < 0.14) {
        if (r() < 0.5) bot = top + 2 + Math.floor(r() * 4); // hangs broken from the rail
        else top = bot - 3 - Math.floor(r() * 4);           // stub from the sill
      }
      for (let y = top; y <= bot; y++) {
        px(x, y, PAL.void, 1);
        px(x + 1, y, PAL.outline, 1);
      }
      px(x, top, PAL.gold1, 0.44);                         // rim on the lit corner
      if (r() < 0.32) px(x, top, PAL.gold0, 0.5);          // occasional hot cap
      if (r() < 0.5) px(x, top + 1, dkGold, 0.24);         // falloff down the shaft
      if (r() < 0.22) px(x, top + 2, dkGold, 0.12);
    }
    // heavy end posts (left one whole more often — it faces the light)
    post(x0 - 3, baseY, 17 + Math.floor(r() * 3), r() < 0.35, seed * 7 + 1);
    post(x0 + len - 1, baseY, 15 + Math.floor(r() * 4), r() < 0.7, seed * 7 + 3);
  }

  // snapped post leaning in the wind, rubble at its foot
  function leaningStump(x0, baseY, h, lean, seed) {
    const r = rng(seed);
    for (let y = 0; y <= h; y++) {
      const t = y / h;
      const x = x0 + Math.round(lean * t * t); // curves as it rises
      const yy = baseY - y;
      px(x, yy, PAL.deepPurple, 1);
      px(x + 1, yy, PAL.void, 1);
      px(x + 2, yy, PAL.outline, 1);
      if (y === h && r() < 0.8) px(x + 1, yy - 1, PAL.outline, 0.8); // splinter
    }
    const tipX = x0 + Math.round(lean);
    goldGlow(tipX + 1, baseY - h - 1, 2, PAL.gold1, 0.14); // bloom on the fresh break
    px(tipX, baseY - h, PAL.gold1, 0.5);
    px(tipX + 1, baseY - h - 1, PAL.gold0, 0.6); // sun on the break
    px(tipX + 1, baseY - h - 2, PAL.white, 0.4); // hot splinter tip
    px(x0, baseY - 1, PAL.gold1, 0.2);
    for (let k = 0; k < 6; k++) { // rubble
      const rx = x0 - 3 + Math.floor(r() * 10), ry = baseY - Math.floor(r() * 2);
      px(rx, ry, r() < 0.5 ? PAL.void : PAL.outline, 0.95);
      if (r() < 0.3) px(rx, ry - 1, PAL.deepPurple, 0.85);
    }
  }

  // torn chain swinging from a broken rail end
  function chain(x0, y0, links, sway, seed) {
    const r = rng(seed);
    for (let i = 0; i < links; i++) {
      const t = i / links;
      const x = x0 + Math.round(Math.sin(t * 2.6) * sway);
      const y = y0 + i * 2;
      px(x, y, PAL.outline, 0.95);
      px(x, y + 1, PAL.void, 0.9);
      if (r() < 0.3) px(x - 1, y, dkGold, 0.3); // glinting link
    }
  }

  // --- layout across the strip (wraps freely past x=640) ---
  railing(26, 246, 92, 5);
  leaningStump(168, 250, 13, 5, 6);
  railing(214, 251, 118, 7);
  chain(338, 240, 6, 2, 8);
  leaningStump(382, 247, 16, -4, 9);
  railing(436, 244, 76, 10);
  // small rubble field in the gap
  {
    const r = rng(41);
    for (let k = 0; k < 9; k++) {
      const rx = 540 + Math.floor(r() * 26), ry = 252 - Math.floor(r() * 3);
      px(rx, ry, r() < 0.5 ? PAL.void : PAL.outline, 0.95);
      if (r() < 0.35) px(rx, ry - 1, r() < 0.5 ? PAL.deepPurple : dkGold, 0.5);
    }
  }
  railing(586, 252, 64, 12); // wraps across the seam back over x=0

  // =====================================================================
  // 4) FRONT FOG — dense wisps rolling over the railing feet (depth sell)
  // =====================================================================
  const lo = [
    // [cx, cy, len, th, col, alpha, seed, topLight, lightA]
    [48, 250, 110, 4.4, PAL.shadow, 0.4, 21, PAL.skyGlow, 0.3],
    [150, 256, 96, 3.6, PAL.deepPurple, 0.45, 22, PAL.horizon, 0.2],
    [252, 249, 128, 4.8, PAL.shadow, 0.38, 23, PAL.skyGlow, 0.26],
    [352, 258, 100, 3.8, PAL.deepPurple, 0.46, 24, null, 0],
    [446, 251, 118, 4.4, PAL.shadow, 0.4, 25, PAL.horizon, 0.22],
    [556, 255, 108, 4, PAL.deepPurple, 0.44, 26, PAL.skyGlow, 0.24],
    [630, 248, 88, 3.4, PAL.shadow, 0.36, 27, null, 0],
    [96, 262, 84, 3, PAL.void, 0.4, 28, null, 0],
    [500, 263, 92, 3.2, PAL.void, 0.42, 29, null, 0],
  ];
  for (const [cx, cy, len, th, col, a, s, tl, tla] of lo) wisp(cx, cy, len, th, col, a, s, tl, tla);

  // last golden dust catching the light between the posts
  {
    const r = rng(99);
    for (let i = 0; i < 14; i++) {
      const x = r() * W, y = 236 + r() * 18;
      px(x, y, r() < 0.35 ? PAL.gold0 : dkGold, 0.14 + r() * 0.14);
    }
  }

  return {
    canvas: c,
    factor: 1.2,     // foreground parallax — slides past the camera
    tileX: true,
    y: 0,
    front: true,     // drawn over gameplay
    autoScroll: 6,   // wind drift, px/sec
    alpha: 1,
  };
}
