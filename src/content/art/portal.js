// AETHERFALL — level-exit PORTAL sprite (kind: sprite)
// Frame 30x38, anchor bottom-center. Two anims:
//   idle: 8 frames — slow swirling violet ring gate, 3 cyan motes orbiting
//         THROUGH the gate (depth-sorted behind/in-front), pulsing runes on
//         a carved stone base, rotating rim glint.
//   open: 6 frames — bright white-cyan rapid swirl, spinning energy rays,
//         hot white core, sparks flung off the rim, runes blazing white.
// Light from upper-left, PAL colors only, outline() per frame, deterministic.
import { PAL } from './palette.js';
import { makeCanvas, P, R, outline, glow, shade, rng, frameGrid } from './util.js';

const FW = 30, FH = 38;
const NIDLE = 8, NOPEN = 6;
const CX = 15, CY = 17;      // ring center inside a frame
const ORX = 11, ORY = 15;    // ring outer radii
const IRX = 8,  IRY = 12;    // inner rim (swirl surface inside)
const TAU = Math.PI * 2;

// normalized elliptical radius (1 = on the ellipse)
function en(dx, dy, rx, ry) {
  const nx = dx / rx, ny = dy / ry;
  return Math.sqrt(nx * nx + ny * ny);
}

// ---------------------------------------------------------------- swirl fill
// two-armed spiral rotating with phase t (0..1). cols = [bg, dim, mid, bright]
function drawSwirl(ctx, ox, oy, t, cols, hot, arms, twist) {
  for (let y = -IRY; y <= IRY; y++) {
    for (let x = -IRX; x <= IRX; x++) {
      const rr = en(x, y, IRX, IRY);
      if (rr > 1) continue;
      const ang = Math.atan2(y / IRY, x / IRX);
      let v = (ang / TAU) * arms + rr * twist - t;
      v = ((v % 1) + 1) % 1;
      let c;
      if      (v < 0.14) c = cols[3];
      else if (v < 0.30) c = cols[2];
      else if (v < 0.46) c = cols[1];
      else               c = cols[0];
      // event-horizon: darken the very edge so the rim pops
      if (rr > 0.86) c = shade(c, -0.35);
      // gravity well: brighten toward the core
      else if (rr < 0.34 && c !== cols[3]) c = cols[2];
      P(ctx, ox + CX + x, oy + CY + y, c);
    }
  }
  // hot core (2x2) + single white-hot pixel
  R(ctx, ox + CX - 1, oy + CY - 1, 2, 2, hot);
  P(ctx, ox + CX, oy + CY, PAL.white);
}

// ---------------------------------------------------------------- ring band
// carved crystal ring, lit upper-left, with a bright glint orbiting at phase t
function drawRing(ctx, ox, oy, t, base, lite, dark, glint) {
  const ga = -t * TAU - Math.PI / 2; // glint angle (starts at top, rotates)
  for (let y = -ORY; y <= ORY; y++) {
    for (let x = -ORX; x <= ORX; x++) {
      const ro = en(x, y, ORX, ORY);
      const ri = en(x, y, IRX + 1, IRY + 1);
      if (ro > 1 || ri < 1) continue;
      let c = base;
      const s = x + y;                       // upper-left light rule
      if (s < -7) c = lite;
      else if (s > 8) c = dark;
      // faceted crystal: subtle alternating segments around the band
      const ang = Math.atan2(y / ORY, x / ORX);
      const seg = Math.floor(((ang / TAU) + 1) * 10) % 2;
      if (seg === 0 && c === base) c = shade(base, -0.14);
      // orbiting glint
      let d = Math.abs(ang - (((ga % TAU) + TAU) % TAU) + (ang < 0 ? TAU : 0));
      d = Math.min(d, TAU - d);
      if (d < 0.22) c = PAL.white;
      else if (d < 0.55) c = glint;
      P(ctx, ox + CX + x, oy + CY + y, c);
    }
  }
}

// ---------------------------------------------------------------- stone base
function drawBase(ctx, ox, oy, f, open) {
  // lower slab
  R(ctx, ox + 2, oy + 34, 26, 3, PAL.stone2);
  R(ctx, ox + 2, oy + 34, 26, 1, PAL.stone1);   // top edge catches light
  R(ctx, ox + 2, oy + 34, 9, 1, PAL.stone0);    // left = brightest
  R(ctx, ox + 2, oy + 37, 26, 1, PAL.stone3);   // ground shadow row
  R(ctx, ox + 26, oy + 34, 2, 3, PAL.stone3);   // right edge dark
  // upper step (holds the ring)
  R(ctx, ox + 6, oy + 31, 18, 3, PAL.stone2);
  R(ctx, ox + 6, oy + 31, 18, 1, PAL.stone1);
  R(ctx, ox + 6, oy + 31, 6, 1, PAL.stone0);
  R(ctx, ox + 22, oy + 31, 2, 3, PAL.stone3);
  // carved cracks / mortar lines (deterministic)
  P(ctx, ox + 8, oy + 35, PAL.shadow);  P(ctx, ox + 9, oy + 36, PAL.shadow);
  P(ctx, ox + 17, oy + 35, PAL.shadow); P(ctx, ox + 23, oy + 36, PAL.shadow);
  P(ctx, ox + 13, oy + 32, PAL.shadow); P(ctx, ox + 19, oy + 33, PAL.shadow);
  // corner crystal shards growing from the slab
  P(ctx, ox + 3, oy + 33, PAL.cyan2); P(ctx, ox + 4, oy + 33, PAL.cyan1);
  P(ctx, ox + 4, oy + 32, PAL.cyan0);
  P(ctx, ox + 26, oy + 33, PAL.cyan2); P(ctx, ox + 25, oy + 33, PAL.cyan1);
  P(ctx, ox + 25, oy + 32, PAL.cyan0);
  // rune pair on the front face — pulse with animation phase
  const pulse = open ? 3 : (f % 4 < 2 ? 1 : 2);
  const runeC = [PAL.cyan3, PAL.cyan2, PAL.cyan1, PAL.white][pulse];
  P(ctx, ox + 9, oy + 35, runeC);  P(ctx, ox + 10, oy + 36, runeC);
  P(ctx, ox + 20, oy + 35, runeC); P(ctx, ox + 19, oy + 36, runeC);
}

// ---------------------------------------------------------------- motes
// 3 cyan motes orbiting horizontally THROUGH the gate; pass='back' draws the
// far half (dim, occluded by the swirl), pass='front' the near half (bright).
const MOTES = [
  { ph: 0.00, my: 10, r: 13.5 },
  { ph: 0.37, my: 17, r: 14.5 },
  { ph: 0.71, my: 25, r: 12.5 },
];
function drawMotes(ctx, ox, oy, t, pass, bright) {
  for (const m of MOTES) {
    const a = (t + m.ph) * TAU;
    const front = Math.sin(a) >= 0;
    if ((pass === 'front') !== front) continue;
    const x = ox + CX + Math.round(Math.cos(a) * m.r);
    const y = oy + m.my + Math.round(Math.sin(a) * 1.6);
    if (front) {
      const core = bright ? PAL.white : PAL.cyan0;
      P(ctx, x, y, core);
      P(ctx, x - 1, y, PAL.cyan1); P(ctx, x + 1, y, PAL.cyan1);
      P(ctx, x, y - 1, PAL.cyan1); P(ctx, x, y + 1, PAL.cyan2);
      // tiny motion trail opposite to travel
      P(ctx, x + (Math.cos(a) > 0 ? -2 : 2), y, PAL.cyan2);
      glow(ctx, x, y, 2, PAL.cyan1);
    } else {
      P(ctx, x, y, PAL.cyan3); // dim spark seen through the veil
      P(ctx, x, y - 1, shade(PAL.cyan3, -0.2));
    }
  }
}

// ---------------------------------------------------------------- open rays
function drawRays(ctx, ox, oy, t) {
  for (let k = 0; k < 5; k++) {
    const a = (t + k / 5) * TAU;
    const ca = Math.cos(a), sa = Math.sin(a);
    for (let s = 2; s <= 7; s++) {
      const x = ox + CX + Math.round(ca * s * 0.9);
      const y = oy + CY + Math.round(sa * s * 1.3);
      if (en(x - ox - CX, y - oy - CY, IRX, IRY) > 0.94) break;
      P(ctx, x, y, s < 5 ? PAL.white : PAL.cyan0);
    }
  }
}

// ---------------------------------------------------------------- frames
function drawIdleFrame(ctx, ox, oy, f) {
  const t = f / NIDLE; // one full slow revolution per loop
  drawMotes(ctx, ox, oy, t, 'back', false);
  drawSwirl(ctx, ox, oy, t, [PAL.deepPurple, PAL.violet3, PAL.violet2, PAL.violet1], PAL.violet0, 2, 2.3);
  drawRing(ctx, ox, oy, t, PAL.violet2, PAL.violet1, PAL.violet3, PAL.violet0);
  drawBase(ctx, ox, oy, f, false);
  outline(ctx, ox, oy, FW, FH);
  drawMotes(ctx, ox, oy, t, 'front', false);
  // breathing core glow (after outline so the halo stays soft)
  const pr = 3 + (f % 4 < 2 ? 0 : 1);
  glow(ctx, ox + CX, oy + CY, pr, PAL.violet1);
  glow(ctx, ox + CX, oy + CY, 1, PAL.cyan0);
}

function drawOpenFrame(ctx, ox, oy, f) {
  const t = (f / NOPEN) * 2; // double-speed swirl = rapid
  drawMotes(ctx, ox, oy, t * 0.5, 'back', true);
  drawSwirl(ctx, ox, oy, t, [PAL.cyan3, PAL.cyan2, PAL.cyan1, PAL.cyan0], PAL.white, 3, 3.1);
  drawRays(ctx, ox, oy, t);
  drawRing(ctx, ox, oy, t, PAL.cyan1, PAL.cyan0, PAL.cyan2, PAL.white);
  drawBase(ctx, ox, oy, f, true);
  outline(ctx, ox, oy, FW, FH);
  drawMotes(ctx, ox, oy, t * 0.5, 'front', true);
  // sparks flung off the rim (deterministic per frame)
  const rnd = rng(101 + f * 7);
  for (let k = 0; k < 6; k++) {
    const a = rnd() * TAU;
    const d = 1.05 + rnd() * 0.28;
    const x = ox + CX + Math.round(Math.cos(a) * ORX * d);
    const y = oy + CY + Math.round(Math.sin(a) * ORY * d);
    if (x > ox && x < ox + FW - 1 && y > oy && y < oy + FH - 1) {
      P(ctx, x, y, rnd() > 0.5 ? PAL.cyan0 : PAL.white);
    }
  }
  // blazing core halo
  glow(ctx, ox + CX, oy + CY, 5, PAL.cyan1);
  glow(ctx, ox + CX, oy + CY, 2, PAL.white);
}

// ---------------------------------------------------------------- build
export function build() {
  const c = makeCanvas(FW * Math.max(NIDLE, NOPEN), FH * 2);
  const ctx = c.getContext('2d');
  for (let f = 0; f < NIDLE; f++) drawIdleFrame(ctx, f * FW, 0, f);
  for (let f = 0; f < NOPEN; f++) drawOpenFrame(ctx, f * FW, FH, f);
  return {
    image: c,
    anims: {
      idle: { frames: frameGrid(FW, FH, NIDLE, 0), fps: 7,  loop: true },
      open: { frames: frameGrid(FW, FH, NOPEN, 1), fps: 14, loop: true },
    },
    anchor: { x: FW / 2, y: FH },
  };
}
