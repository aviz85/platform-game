// AETHERFALL — BOSS: THE COLOSSUS
// Huge ancient stone guardian (48x52 per frame). Cracked violet stone body,
// glowing cyan rune veins, amber core in chest, massive fists.
// Sheet layout: row0 move(6, heavy stomp) · row1 attack(6, overhead slam)
//               row2 cast(4, core flare)  · row3 hurt(2, flinch)
import { PAL } from './palette.js';
import { makeCanvas, P, R, line, outline, glow, rng, frameGrid } from './util.js';

const FW = 48, FH = 52;

// ---- small helpers ----------------------------------------------------------

// chunky "stone limb": stamp w×w blocks along a line
function limb(ctx, x0, y0, x1, y1, w, c) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= steps; i++) {
    const x = Math.round(x0 + (x1 - x0) * i / steps);
    const y = Math.round(y0 + (y1 - y0) * i / steps);
    R(ctx, x - (w >> 1), y - (w >> 1), w, w, c);
  }
}

// massive stone fist, ~10x9, centered on (x,y). side: -1 left hand, +1 right.
function fist(ctx, x, y, side, runeC, runeHot) {
  R(ctx, x - 4, y - 4, 8, 1, PAL.stone1);            // rounded top
  R(ctx, x - 5, y - 3, 10, 6, PAL.stone2);           // block
  R(ctx, x - 4, y + 3, 8, 2, PAL.stone3);            // rounded bottom (shadow)
  R(ctx, x - 5, y - 3, 1, 5, PAL.stone1);            // left rim light
  R(ctx, x + 4, y - 2, 1, 5, PAL.stone3);            // right shade
  // knuckle studs (upper-left light)
  P(ctx, x - 3, y - 4, PAL.stone0);
  P(ctx, x - 1, y - 4, PAL.stone0);
  P(ctx, x + 1, y - 4, PAL.stone0);
  // rune stud on the back of the hand
  R(ctx, x - 1, y - 1, 2, 2, runeC);
  P(ctx, x - 1 + (side > 0 ? 1 : 0), y - 1, runeHot);
  // old crack
  P(ctx, x - 3, y + 1, PAL.deepPurple);
  P(ctx, x - 2, y + 2, PAL.deepPurple);
}

// dust + ground-crack flash under a stomping foot
function stompFx(ctx, footCx, seed) {
  const r = rng(seed);
  for (let i = 0; i < 8; i++) {
    const dx = Math.round(r() * 16 - 8);
    const dy = Math.round(r() * 4);
    P(ctx, footCx + dx, 49 - dy, i % 2 ? PAL.stone1 : PAL.stone0);
  }
  line(ctx, footCx - 5, 49, footCx - 8, 51, PAL.cyan2);
  line(ctx, footCx + 5, 49, footCx + 8, 51, PAL.cyan2);
  P(ctx, footCx - 8, 51, PAL.cyan1);
  P(ctx, footCx + 8, 51, PAL.cyan1);
}

// big shockwave for the overhead-slam impact frame
function slamFx(ctx) {
  line(ctx, 10, 47, 3, 49, PAL.cyan1);
  line(ctx, 38, 47, 45, 49, PAL.cyan1);
  line(ctx, 8, 50, 1, 51, PAL.cyan0);
  line(ctx, 40, 50, 47, 51, PAL.cyan0);
  const r = rng(99);
  for (let i = 0; i < 12; i++) {
    const x = Math.round(4 + r() * 40);
    const y = Math.round(41 + r() * 8);
    P(ctx, x, y, i % 3 ? PAL.stone0 : PAL.amber0);
  }
  glow(ctx, 14, 46, 3, PAL.cyan1);
  glow(ctx, 34, 46, 3, PAL.cyan1);
}

// ---- one full colossus frame on its own 48x52 canvas ------------------------
function buildFrame(p) {
  const q = Object.assign({
    bob: 0, lean: 0,                    // body offset (y) and sway (x)
    liftL: 0, liftR: 0, fwdL: 0, fwdR: 0, // legs
    fistL: null, fistR: null,           // [x,y] fist centers; null = hang
    swingL: 0, swingR: 0,               // hang-pose arm sway
    castArms: false,                    // arms spread for casting
    core: 1,                            // 0 dim .. 3 supernova
    eye: 'cyan',                        // cyan | amber | white
    hurt: 0,                            // 0 none, 1 fading embers, 2 fresh hit
    dustL: false, dustR: false,         // stomp fx per foot
    shock: false,                       // slam impact fx
    motion: null,                       // 'down' = slam speed lines
    rays: false, sparks: 0,             // cast core fx
  }, p);
  const c = makeCanvas(FW, FH);
  const ctx = c.getContext('2d');
  const sh = 14 + q.bob;                // shoulder line
  const L = q.lean;
  const crackC = q.hurt ? (q.hurt > 1 ? PAL.ember1 : PAL.ember2) : PAL.deepPurple;

  // ---- legs (behind everything) ----
  const legTop = sh + 20;
  const legs = [
    { x: 12 + q.fwdL, lift: q.liftL, dust: q.dustL, seed: 11 },
    { x: 27 + q.fwdR, lift: q.liftR, dust: q.dustR, seed: 47 },
  ];
  for (const g of legs) {
    const foot = 50 - g.lift;
    const top = Math.min(legTop, foot - 7);
    R(ctx, g.x, top, 9, foot - top, PAL.stone2);
    R(ctx, g.x, top, 2, foot - top, PAL.stone1);     // left light
    R(ctx, g.x + 7, top, 2, foot - top, PAL.stone3); // right shade
    R(ctx, g.x + 1, top + 3, 7, 2, PAL.stone1);      // knee plate
    R(ctx, g.x + 1, top + 3, 7, 1, PAL.stone0);
    // foot cap
    R(ctx, g.x - 1, foot - 3, 11, 3, PAL.stone2);
    R(ctx, g.x - 1, foot - 3, 11, 1, PAL.stone1);
    R(ctx, g.x - 1, foot - 1, 11, 1, PAL.violet3);
    // ankle rune + shin crack
    P(ctx, g.x + 4, foot - 5, PAL.cyan2);
    P(ctx, g.x + 6, top + 7, crackC);
    P(ctx, g.x + 5, top + 8, crackC);
    P(ctx, g.x + 5, top + 9, PAL.deepPurple);
  }

  // ---- pelvis ----
  R(ctx, 13 + L, sh + 18, 22, 6, PAL.stone2);
  R(ctx, 13 + L, sh + 18, 22, 1, PAL.stone1);
  R(ctx, 13 + L, sh + 23, 22, 1, PAL.violet3);
  R(ctx, 13 + L, sh + 18, 1, 5, PAL.stone1);
  R(ctx, 34 + L, sh + 19, 1, 5, PAL.stone3);
  // rune belt with amber keystone
  R(ctx, 22 + L, sh + 20, 4, 2, PAL.violet3);
  P(ctx, 23 + L, sh + 20, PAL.amber1);
  P(ctx, 24 + L, sh + 20, PAL.amber0);
  P(ctx, 18 + L, sh + 21, PAL.cyan2);
  P(ctx, 29 + L, sh + 21, PAL.cyan2);

  // ---- torso ----
  // waist
  R(ctx, 13 + L, sh + 11, 22, 8, PAL.stone2);
  R(ctx, 13 + L, sh + 11, 2, 8, PAL.stone1);
  R(ctx, 33 + L, sh + 11, 2, 8, PAL.stone3);
  R(ctx, 15 + L, sh + 15, 18, 1, PAL.stone3);        // waist seam
  // chest slab (massive)
  R(ctx, 10 + L, sh, 28, 12, PAL.stone2);
  R(ctx, 10 + L, sh, 28, 2, PAL.stone1);
  R(ctx, 10 + L, sh, 2, 12, PAL.stone1);
  R(ctx, 36 + L, sh + 1, 2, 11, PAL.stone3);
  R(ctx, 10 + L, sh, 1, 3, PAL.stone0);              // hottest upper-left rim
  R(ctx, 10 + L, sh, 6, 1, PAL.stone0);
  // carved pectoral plates
  R(ctx, 12 + L, sh + 3, 10, 6, PAL.stone1);
  R(ctx, 26 + L, sh + 3, 10, 6, PAL.stone1);
  R(ctx, 12 + L, sh + 3, 10, 1, PAL.stone0);
  R(ctx, 26 + L, sh + 3, 10, 1, PAL.stone0);
  R(ctx, 12 + L, sh + 8, 10, 1, PAL.stone3);
  R(ctx, 26 + L, sh + 8, 10, 1, PAL.stone3);
  // weathering specks (deterministic, ride with the body)
  const tr = rng(5);
  for (let i = 0; i < 10; i++) {
    const tx = Math.round(12 + tr() * 24);
    const ty = Math.round(1 + tr() * 16);
    P(ctx, tx + L, sh + ty, (i & 1) ? PAL.stone3 : PAL.violet3);
  }

  // ---- amber core in a shadowed socket ----
  const ccx = 24 + L, ccy = sh + 6;
  for (let d = -3; d <= 3; d++) {
    const w = 3 - Math.abs(d);
    R(ctx, ccx - w, ccy + d, w * 2 + 1, 1, PAL.shadow);
  }
  const coreCols = [
    [PAL.amber2, PAL.amber1],
    [PAL.amber1, PAL.amber0],
    [PAL.amber0, PAL.gold0],
    [PAL.gold0, PAL.white],
  ][q.core];
  for (let d = -2; d <= 2; d++) {
    const w = 2 - Math.abs(d);
    R(ctx, ccx - w, ccy + d, w * 2 + 1, 1, coreCols[0]);
  }
  P(ctx, ccx, ccy, coreCols[1]);
  P(ctx, ccx, ccy - 1, coreCols[1]);

  // ---- cyan rune veins radiating from the core ----
  const runeC = q.core >= 2 ? PAL.cyan1 : PAL.cyan2;
  const runeHot = q.core >= 2 ? PAL.cyan0 : PAL.cyan1;
  line(ctx, ccx - 3, ccy + 2, ccx - 6, ccy + 5, runeC);
  line(ctx, ccx + 3, ccy + 2, ccx + 6, ccy + 5, runeC);
  line(ctx, ccx - 6, ccy + 6, ccx - 6, ccy + 10, runeC);
  line(ctx, ccx + 6, ccy + 6, ccx + 6, ccy + 10, runeC);
  line(ctx, ccx - 4, ccy - 3, ccx - 4, ccy - 5, runeC);
  line(ctx, ccx + 4, ccy - 3, ccx + 4, ccy - 5, runeC);
  P(ctx, ccx - 6, ccy + 5, runeHot);
  P(ctx, ccx + 6, ccy + 5, runeHot);
  P(ctx, ccx - 4, ccy - 5, runeHot);
  P(ctx, ccx + 4, ccy - 5, runeHot);

  // ---- ancient cracks across the torso ----
  line(ctx, 32 + L, sh + 1, 30 + L, sh + 4, crackC);
  line(ctx, 30 + L, sh + 4, 31 + L, sh + 7, crackC);
  line(ctx, 15 + L, sh + 12, 17 + L, sh + 15, crackC);
  line(ctx, 17 + L, sh + 15, 16 + L, sh + 17, PAL.deepPurple);
  P(ctx, 14 + L, sh + 2, crackC);
  P(ctx, 33 + L, sh + 14, crackC);

  // ---- arms ----
  const shLx = 8 + L, shRx = 39 + L, shY = sh + 5;
  let fL, fR;
  if (q.fistL) fL = q.fistL.slice();
  else if (q.castArms) fL = [6 + L, sh + 16];
  else fL = [7 + L, sh + 24 + q.swingL];
  if (q.fistR) fR = q.fistR.slice();
  else if (q.castArms) fR = [41 + L, sh + 16];
  else fR = [40 + L, sh + 24 + q.swingR];
  limb(ctx, shLx, shY, fL[0], fL[1] - 5, 4, PAL.stone2);
  limb(ctx, shRx, shY, fR[0], fR[1] - 5, 4, PAL.stone2);
  limb(ctx, shLx - 1, shY - 1, fL[0] - 1, fL[1] - 6, 1, PAL.stone1);
  limb(ctx, shRx - 1, shY - 1, fR[0] - 1, fR[1] - 6, 1, PAL.stone1);
  // rune spark at each elbow midpoint
  P(ctx, (shLx + fL[0]) >> 1, ((shY + fL[1] - 5) >> 1), runeC);
  P(ctx, (shRx + fR[0]) >> 1, ((shY + fR[1] - 5) >> 1), runeC);

  // ---- pauldrons over the shoulder joints ----
  for (const s of [-1, 1]) {
    const px = s < 0 ? 4 + L : 34 + L;
    R(ctx, px, sh - 2, 10, 8, PAL.stone1);
    R(ctx, px + 1, sh - 3, 8, 1, PAL.stone0);
    R(ctx, px, sh - 2, 10, 1, PAL.stone0);
    R(ctx, px, sh + 4, 10, 2, PAL.stone3);
    R(ctx, px + (s < 0 ? 0 : 9), sh - 2, 1, 6, s < 0 ? PAL.stone0 : PAL.stone3);
    // violet crystal spike on top
    P(ctx, px + 4, sh - 4, PAL.violet1);
    P(ctx, px + 5, sh - 4, PAL.violet1);
    P(ctx, px + 4, sh - 5, PAL.violet0);
    // rune dots
    P(ctx, px + 3, sh + 1, PAL.cyan2);
    P(ctx, px + 6, sh + 1, PAL.cyan2);
    // chip crack
    P(ctx, px + 7, sh - 1, PAL.deepPurple);
  }

  // ---- head ----
  const hy = sh - 9;
  R(ctx, 20 + L, hy, 8, 9, PAL.stone1);
  R(ctx, 20 + L, hy, 8, 1, PAL.stone0);
  R(ctx, 20 + L, hy, 1, 8, PAL.stone0);
  R(ctx, 27 + L, hy + 1, 1, 8, PAL.stone3);
  R(ctx, 20 + L, hy + 7, 8, 2, PAL.stone3);          // jaw
  R(ctx, 20 + L, hy + 3, 8, 1, PAL.violet3);         // brow ridge
  R(ctx, 20 + L, hy + 4, 8, 2, PAL.shadow);          // deep eye sockets
  const eyeC = q.eye === 'white' ? PAL.white : q.eye === 'amber' ? PAL.amber0 : PAL.cyan1;
  const eyeHot = q.eye === 'white' ? PAL.white : q.eye === 'amber' ? PAL.gold0 : PAL.cyan0;
  R(ctx, 21 + L, hy + 4, 2, 2, eyeC);
  R(ctx, 25 + L, hy + 4, 2, 2, eyeC);
  P(ctx, 21 + L, hy + 4, eyeHot);
  P(ctx, 26 + L, hy + 4, eyeHot);
  R(ctx, 22 + L, hy + 7, 4, 1, PAL.deepPurple);      // grim mouth seam
  // crown crest crystal
  P(ctx, 23 + L, hy - 1, PAL.violet1);
  P(ctx, 24 + L, hy - 1, PAL.violet1);
  P(ctx, 23 + L, hy - 2, PAL.violet0);

  // ---- fists (in front of everything) ----
  fist(ctx, fL[0], fL[1], -1, runeC, runeHot);
  fist(ctx, fR[0], fR[1], 1, runeC, runeHot);

  // ---- outline the whole guardian ----
  outline(ctx, 0, 0, FW, FH);

  // ---- post-outline fx (never outlined) ----
  // emissive glows
  glow(ctx, 21 + L, hy + 4, 2, eyeC);
  glow(ctx, 26 + L, hy + 4, 2, eyeC);
  glow(ctx, ccx, ccy, 2 + q.core, q.core >= 3 ? PAL.gold0 : PAL.amber0);
  if (q.rays) {
    line(ctx, ccx - 7, ccy, ccx - 10, ccy, PAL.gold0);
    line(ctx, ccx + 7, ccy, ccx + 10, ccy, PAL.gold0);
    line(ctx, ccx, ccy - 7, ccx, ccy - 9, PAL.gold0);
    line(ctx, ccx, ccy + 7, ccx, ccy + 9, PAL.gold0);
    P(ctx, ccx - 8, ccy - 6, PAL.amber0);
    P(ctx, ccx + 8, ccy - 6, PAL.amber0);
    P(ctx, ccx - 8, ccy + 6, PAL.amber0);
    P(ctx, ccx + 8, ccy + 6, PAL.amber0);
    glow(ctx, ccx, ccy, 8, PAL.amber0);
  }
  if (q.sparks) {
    const pts = q.sparks === 1
      ? [[ccx - 9, ccy - 4], [ccx + 8, ccy + 3], [ccx + 2, ccy - 9]]
      : [[ccx + 9, ccy - 3], [ccx - 8, ccy + 4], [ccx - 2, ccy + 9]];
    for (const [sx, sy] of pts) {
      P(ctx, sx, sy, PAL.amber0);
      P(ctx, sx, sy - 1, PAL.gold0);
    }
  }
  if (q.motion === 'down') {
    for (const mx of [fL[0] - 4, fL[0] + 3, fR[0] - 3, fR[0] + 4]) {
      line(ctx, mx, fL[1] - 16, mx, fL[1] - 9, PAL.violet0);
    }
  }
  if (q.dustL) stompFx(ctx, 16 + q.fwdL, 13);
  if (q.dustR) stompFx(ctx, 31 + q.fwdR, 29);
  if (q.shock) slamFx(ctx);
  if (q.hurt > 1) {
    // fresh-hit ember flecks bursting from the cracks
    P(ctx, 31 + L, sh + 4, PAL.ember0);
    P(ctx, 34 + L, sh + 2, PAL.ember0);
    P(ctx, 16 + L, sh + 13, PAL.ember0);
    P(ctx, 13 + L, sh + 15, PAL.ember1);
    glow(ctx, 31 + L, sh + 4, 2, PAL.ember0);
  }
  return c;
}

// ---- module contract ---------------------------------------------------------
export function build() {
  const rows = [
    // row 0 — move: heavy stomp-walk. L-impact, settle, R-lift, R-impact, settle, L-lift.
    [
      { bob: 1, lean: -1, dustL: true, core: 1, swingL: 1, swingR: -1 },
      { bob: 0, lean: 0, core: 1 },
      { bob: -1, lean: 1, liftR: 6, fwdR: 2, core: 1, swingL: -1, swingR: 1 },
      { bob: 1, lean: 1, dustR: true, fwdR: 1, core: 2, swingL: -1, swingR: 1 },
      { bob: 0, lean: 0, core: 1 },
      { bob: -1, lean: -1, liftL: 6, fwdL: 2, core: 1, swingL: 1, swingR: -1 },
    ],
    // row 1 — attack: overhead slam. windup → raise → overhead hold → swing → IMPACT → recover.
    [
      { bob: 1, fwdL: -1, fwdR: 1, fistL: [5, 32], fistR: [42, 32], core: 1 },
      { bob: -1, fwdL: -1, fwdR: 1, fistL: [8, 14], fistR: [39, 14], core: 1 },
      { bob: -2, fwdL: -1, fwdR: 1, fistL: [16, 5], fistR: [32, 5], core: 2 },
      { bob: 2, fwdL: -1, fwdR: 1, fistL: [17, 28], fistR: [31, 28], core: 2, motion: 'down' },
      { bob: 3, fwdL: -1, fwdR: 1, fistL: [14, 44], fistR: [34, 44], core: 3, shock: true },
      { bob: 2, fwdL: -1, fwdR: 1, fistL: [12, 36], fistR: [36, 36], core: 1 },
    ],
    // row 2 — cast: chest core charges up for the projectile phase.
    [
      { castArms: true, core: 1 },
      { castArms: true, core: 2, sparks: 1 },
      { castArms: true, core: 3, rays: true, bob: -1, eye: 'amber' },
      { castArms: true, core: 2, sparks: 2 },
    ],
    // row 3 — hurt: flinch with ember-lit cracks, then settle.
    [
      { bob: 1, lean: 2, eye: 'white', hurt: 2, core: 0 },
      { bob: 0, lean: 1, hurt: 1, core: 1 },
    ],
  ];

  const c = makeCanvas(FW * 6, FH * rows.length);
  const ctx = c.getContext('2d');
  rows.forEach((poses, row) => {
    poses.forEach((pose, i) => {
      ctx.drawImage(buildFrame(pose), i * FW, row * FH);
    });
  });

  return {
    image: c,
    anims: {
      move:   { frames: frameGrid(FW, FH, 6, 0), fps: 7,  loop: true },
      attack: { frames: frameGrid(FW, FH, 6, 1), fps: 9,  loop: false },
      cast:   { frames: frameGrid(FW, FH, 4, 2), fps: 8,  loop: true },
      hurt:   { frames: frameGrid(FW, FH, 2, 3), fps: 10, loop: false },
    },
    anchor: { x: FW / 2, y: FH },
  };
}
