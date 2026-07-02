// AETHERFALL — props_depths.js — NEON DEPTHS scenic props (kind: props)
//
// Stamp names (reference these from level decor lists):
//   reactor_core  — pulsing cyan reactor core in a dark-metal containment ring (~56x62)
//   pipe_cluster  — rusty pipe bundle with valve wheel + magenta conduit (~52x50)
//   mech_husk     — broken mech carcass, torn hull, one dead + one flickering eye (~58x44)
//   neon_sign     — hanging neon panel, magenta glyphs + cyan trim, hazard stripes (~40x46)
//   vent_stack    — steam vent stack, grilled chimney with rising vapor puffs (~28x58)
//
// Only palette.js colors + shade() derivatives. Deterministic via rng(seed).

import { PAL, RAMPS } from './palette.js';
import {
  makeCanvas, P, R, line, circleFill, ellipseFill,
  dither, outline, glow, shade, rng,
} from './util.js';

// ---------------------------------------------------------------------------
// shared micro-helpers
// ---------------------------------------------------------------------------

// horizontal metal pipe segment: lit top edge, mid body, dark underside
function hPipe(ctx, x, y, w, r) {
  R(ctx, x, y, w, 1, r[0]);          // top highlight (light from upper-left)
  R(ctx, x, y + 1, w, 1, r[1]);
  R(ctx, x, y + 2, w, 2, r[2]);
  R(ctx, x, y + 4, w, 1, r[3]);      // dark underside
}

// vertical metal pipe segment: lit left edge, mid body, dark right
function vPipe(ctx, x, y, h, r) {
  R(ctx, x, y, 1, h, r[0]);
  R(ctx, x + 1, y, 1, h, r[1]);
  R(ctx, x + 2, y, 2, h, r[2]);
  R(ctx, x + 4, y, 1, h, r[3]);
}

// pipe joint collar (slightly wider band across a vertical pipe)
function collarV(ctx, x, y, r) {
  R(ctx, x - 1, y, 7, 2, r[2]);
  R(ctx, x - 1, y, 7, 1, r[1]);
  P(ctx, x - 1, y, r[0]);
  P(ctx, x + 5, y + 1, r[3]);
}

// diagonal amber/dark hazard stripes inside a rect
function hazardStripes(ctx, x, y, w, h) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const s = ((i + j) >> 1) & 1;
    P(ctx, x + i, y + j, s ? PAL.amber1 : PAL.metal3);
  }
  R(ctx, x, y, w, 1, shade(PAL.amber1, 0.15)); // lit top edge
}

// rivet: 1 bright pixel + 1 shadow pixel
function rivet(ctx, x, y, r) {
  P(ctx, x, y, r[0]);
  P(ctx, x + 1, y + 1, r[3]);
}

// rust patch scatter inside a region
function rustPatch(ctx, x, y, w, h, rand, density = 0.3) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const v = rand();
    if (v < density) P(ctx, x + i, y + j, v < density * 0.35 ? PAL.rust2 : PAL.rust1);
  }
}

// small emissive status light with halo
function statusLight(ctx, x, y, col) {
  glow(ctx, x, y, 2, col);
  P(ctx, x, y, PAL.white);
  P(ctx, x + 1, y, col);
  P(ctx, x, y + 1, col);
}

// ---------------------------------------------------------------------------
// reactor_core — pulsing cyan reactor in dark-metal containment ring (~56x62)
// ---------------------------------------------------------------------------
function buildReactorCore() {
  const W = 56, H = 62;
  const c = makeCanvas(W, H);
  const ctx = c.getContext('2d');
  const rand = rng(9101);
  const M = RAMPS.metal, C = RAMPS.crystal;
  const cx = 28, cy = 27;

  // heavy base plinth (reaches canvas bottom — stamps are bottom-aligned by the engine)
  R(ctx, 8, 52, 40, 8, M[2]);
  R(ctx, 8, 52, 40, 1, M[1]);
  R(ctx, 6, 56, 44, 6, M[3]);
  R(ctx, 6, 56, 44, 1, M[2]);
  R(ctx, 6, 61, 44, 1, shade(PAL.metal3, -0.3));
  hazardStripes(ctx, 12, 53, 32, 3);
  rustPatch(ctx, 9, 56, 10, 3, rand, 0.35);
  rivet(ctx, 8, 57, M); rivet(ctx, 46, 57, M);

  // support struts from ring to plinth
  R(ctx, 14, 42, 4, 10, M[2]); R(ctx, 14, 42, 1, 10, M[1]); R(ctx, 17, 42, 1, 10, M[3]);
  R(ctx, 38, 42, 4, 10, M[2]); R(ctx, 38, 42, 1, 10, M[1]); R(ctx, 41, 42, 1, 10, M[3]);

  // outer containment ring (dark metal torus)
  circleFill(ctx, cx, cy, 22, M[3]);
  circleFill(ctx, cx - 1, cy - 1, 21, M[2]);
  // ring inner cut (leave a 5px band)
  circleFill(ctx, cx, cy, 16, PAL.void);
  // ring rim light upper-left
  for (let a = 0; a < 40; a++) {
    const t = Math.PI * (0.95 + a / 40 * 0.65); // upper-left arc
    P(ctx, Math.round(cx + Math.cos(t) * 21), Math.round(cy + Math.sin(t) * 21), M[0]);
    P(ctx, Math.round(cx + Math.cos(t) * 20), Math.round(cy + Math.sin(t) * 20), M[1]);
  }
  // ring bolts at compass points
  rivet(ctx, cx - 1, cy - 21, M); rivet(ctx, cx - 1, cy + 18, M);
  rivet(ctx, cx - 21, cy - 1, M); rivet(ctx, cx + 18, cy - 1, M);
  // rust streaks on lower-right of ring — clamped to the ring band (r 16..21)
  for (let j = 0; j < 6; j++) for (let i = 0; i < 8; i++) {
    const px = cx + 10 + i, py = cy + 12 + j;
    const dd = (px - cx) * (px - cx) + (py - cy) * (py - cy);
    const v = rand();
    if (v < 0.3 && dd >= 16 * 16 && dd <= 21 * 21) {
      P(ctx, px, py, v < 0.1 ? PAL.rust2 : PAL.rust1);
    }
  }

  // glow bath inside the cavity
  glow(ctx, cx, cy, 15, PAL.cyan2);

  // energy core — layered orb
  circleFill(ctx, cx, cy, 12, PAL.cyan3);
  circleFill(ctx, cx, cy, 10, C[2]);
  circleFill(ctx, cx - 1, cy - 1, 8, C[1]);
  circleFill(ctx, cx - 2, cy - 2, 5, C[0]);
  circleFill(ctx, cx - 3, cy - 3, 2, PAL.white);
  // dither shimmer between core bands
  dither(ctx, cx - 4, cy + 4, 9, 3, C[1], C[2]);
  // orbiting energy motes around the core
  for (let i = 0; i < 7; i++) {
    const a = rand() * Math.PI * 2, rr = 13 + Math.floor(rand() * 2);
    const mx = Math.round(cx + Math.cos(a) * rr), my = Math.round(cy + Math.sin(a) * rr);
    P(ctx, mx, my, rand() < 0.5 ? C[0] : PAL.white);
  }
  // hot arc crackle on the core surface
  line(ctx, cx - 6, cy + 3, cx - 2, cy + 6, C[0]);
  line(ctx, cx + 3, cy - 6, cx + 6, cy - 2, C[0]);

  // magenta conduit cables feeding the ring from below (endpoints touch the ring)
  line(ctx, 12, 52, 13, 42, PAL.magenta2);
  line(ctx, 11, 52, 12, 43, PAL.magenta3);
  P(ctx, 13, 42, PAL.magenta1);
  line(ctx, 44, 52, 43, 43, PAL.magenta2);
  line(ctx, 45, 52, 44, 44, PAL.magenta3);
  P(ctx, 43, 43, PAL.magenta1);
  statusLight(ctx, 10, 48, PAL.magenta1);
  statusLight(ctx, 46, 48, PAL.magenta1);

  // core light spill onto plinth
  ctx.save();
  ctx.globalAlpha = 0.25;
  ellipseFill(ctx, cx, 53, 14, 2, C[1]);
  ctx.restore();

  outline(ctx, 0, 0, W, H);
  return c;
}

// ---------------------------------------------------------------------------
// pipe_cluster — rusty pipe bundle + valve wheel + magenta conduit (~52x50)
// ---------------------------------------------------------------------------
function buildPipeCluster() {
  const W = 52, H = 50;
  const c = makeCanvas(W, H);
  const ctx = c.getContext('2d');
  const rand = rng(6203);
  const M = RAMPS.metal;
  const RU = [PAL.rust0, PAL.rust1, PAL.rust2, shade(PAL.rust2, -0.35)];

  // wall-mount back plate
  R(ctx, 2, 6, 10, 42, M[3]);
  R(ctx, 2, 6, 1, 42, M[2]);
  rivet(ctx, 4, 9, M); rivet(ctx, 4, 43, M);

  // big vertical rust pipe (main)
  vPipe(ctx, 14, 2, 46, RU);
  collarV(ctx, 14, 8, M);
  collarV(ctx, 14, 34, M);
  rustPatch(ctx, 15, 18, 3, 12, rand, 0.4);

  // second vertical pipe (metal, thinner)
  R(ctx, 24, 4, 1, 44, M[0]);
  R(ctx, 25, 4, 2, 44, M[2]);
  R(ctx, 27, 4, 1, 44, M[3]);
  R(ctx, 23, 12, 6, 2, M[1]); P(ctx, 23, 12, M[0]); P(ctx, 28, 13, M[3]);
  R(ctx, 23, 40, 6, 2, M[1]); P(ctx, 23, 40, M[0]); P(ctx, 28, 41, M[3]);

  // horizontal pipe branching right from main pipe
  hPipe(ctx, 18, 20, 32, M);
  // elbow joint where it meets the main
  R(ctx, 18, 19, 4, 7, RU[2]);
  R(ctx, 18, 19, 4, 1, RU[1]);
  P(ctx, 18, 19, RU[0]);
  // end flange on the right
  R(ctx, 48, 18, 3, 9, M[2]);
  R(ctx, 48, 18, 3, 1, M[1]);
  P(ctx, 48, 18, M[0]); P(ctx, 50, 26, M[3]);
  rivet(ctx, 48, 20, M); rivet(ctx, 48, 24, M);

  // valve wheel on the horizontal pipe
  const vx = 34, vy = 17;
  R(ctx, vx - 1, vy + 3, 3, 4, M[2]);            // stem
  P(ctx, vx - 1, vy + 3, M[1]);
  circleFill(ctx, vx, vy - 2, 6, RU[3]);          // wheel outer
  circleFill(ctx, vx - 1, vy - 3, 5, RU[2]);
  circleFill(ctx, vx, vy - 2, 3, PAL.void);       // wheel cut
  circleFill(ctx, vx, vy - 2, 1, RU[1]);          // hub
  line(ctx, vx - 4, vy - 2, vx + 4, vy - 2, RU[1]); // spokes
  line(ctx, vx, vy - 6, vx, vy + 2, RU[1]);
  P(ctx, vx - 4, vy - 5, RU[0]);                  // rim light on wheel
  P(ctx, vx - 3, vy - 6, RU[0]);
  P(ctx, vx - 5, vy - 4, RU[0]);

  // magenta neon conduit snaking across the wall plate
  line(ctx, 3, 14, 11, 22, PAL.magenta2);
  line(ctx, 11, 22, 11, 34, PAL.magenta2);
  line(ctx, 11, 34, 5, 42, PAL.magenta2);
  P(ctx, 11, 22, PAL.magenta1); P(ctx, 11, 28, PAL.magenta1); P(ctx, 11, 34, PAL.magenta1);
  glow(ctx, 11, 28, 3, PAL.magenta1);
  P(ctx, 11, 28, PAL.white);

  // pressure gauge on the main pipe
  circleFill(ctx, 16, 30, 3, M[1]);
  circleFill(ctx, 16, 30, 2, PAL.void);
  P(ctx, 16, 30, PAL.cyan1);
  line(ctx, 16, 30, 17, 28, PAL.cyan0);
  statusLight(ctx, 21, 44, PAL.cyan1);

  // drip stain under the elbow
  line(ctx, 20, 26, 20, 32, RU[2]);
  P(ctx, 20, 33, RU[1]);

  outline(ctx, 0, 0, W, H);
  return c;
}

// ---------------------------------------------------------------------------
// mech_husk — broken mech carcass, torn hull, flickering eye (~58x44)
// ---------------------------------------------------------------------------
function buildMechHusk() {
  const W = 58, H = 44;
  const c = makeCanvas(W, H);
  const ctx = c.getContext('2d');
  const rand = rng(3307);
  const M = RAMPS.metal;
  const RU = [PAL.rust0, PAL.rust1, PAL.rust2, shade(PAL.rust2, -0.35)];

  // debris scatter on the ground
  R(ctx, 2, 41, 54, 3, PAL.deepPurple);
  for (let i = 0; i < 14; i++) {
    const dx = 3 + Math.floor(rand() * 52), dy = 40 + Math.floor(rand() * 3);
    P(ctx, dx, dy, rand() < 0.5 ? M[2] : RU[2]);
  }

  // slumped torso hull (tilted slab, lying to the right)
  // main mass
  for (let j = 0; j < 22; j++) {
    const y = 16 + j;
    const x0 = 10 + Math.floor(j * 0.35);
    const x1 = 46 + Math.floor(j * 0.25);
    R(ctx, x0, y, x1 - x0, 1, j < 3 ? M[1] : M[2]);
    P(ctx, x0, y, M[0]);           // lit left edge
    P(ctx, x1 - 1, y, M[3]);       // dark right edge
  }
  R(ctx, 12, 16, 34, 1, M[0]);     // top rim light
  // panel seams
  line(ctx, 22, 17, 25, 37, M[3]);
  line(ctx, 36, 16, 39, 37, M[3]);
  rivet(ctx, 15, 19, M); rivet(ctx, 30, 18, M); rivet(ctx, 43, 19, M);
  rivet(ctx, 17, 33, M); rivet(ctx, 42, 34, M);
  // rust bloom
  rustPatch(ctx, 26, 24, 12, 10, rand, 0.3);
  rustPatch(ctx, 13, 30, 8, 7, rand, 0.35);

  // torn hull breach — jagged dark hole with glowing innards
  const bx = 30, by = 27;
  circleFill(ctx, bx, by, 6, PAL.void);
  P(ctx, bx - 7, by - 2, PAL.void); P(ctx, bx + 6, by - 4, PAL.void);
  P(ctx, bx - 5, by + 5, PAL.void); P(ctx, bx + 7, by + 2, PAL.void);
  // jagged bright torn-metal lip on upper-left of breach
  P(ctx, bx - 6, by - 4, M[0]); P(ctx, bx - 4, by - 6, M[0]);
  P(ctx, bx - 2, by - 7, M[1]); P(ctx, bx + 2, by - 6, M[1]);
  P(ctx, bx - 7, by - 1, M[1]);
  // sparking innards
  glow(ctx, bx, by + 1, 4, PAL.magenta1);
  P(ctx, bx, by + 1, PAL.white);
  P(ctx, bx - 2, by + 2, PAL.magenta1);
  P(ctx, bx + 2, by, PAL.magenta2);
  line(ctx, bx - 1, by - 2, bx + 1, by + 3, PAL.magenta1);

  // fallen head unit leaning against torso's left side
  R(ctx, 2, 26, 12, 12, M[2]);
  R(ctx, 2, 26, 12, 1, M[1]);
  R(ctx, 2, 26, 1, 12, M[0]);
  R(ctx, 13, 27, 1, 11, M[3]);
  // visor slit: one dead eye, one flickering cyan eye
  R(ctx, 4, 30, 8, 3, PAL.void);
  P(ctx, 6, 31, M[3]);                  // dead eye socket
  glow(ctx, 10, 31, 3, PAL.cyan1);      // live eye
  P(ctx, 10, 31, PAL.white);
  P(ctx, 11, 31, PAL.cyan1);
  // head dents + rust
  P(ctx, 8, 27, M[3]); P(ctx, 5, 28, M[3]);
  rustPatch(ctx, 3, 34, 9, 3, rand, 0.4);

  // severed arm sticking up from behind the torso, clawed hand open
  vPipe(ctx, 47, 6, 14, M);
  collarV(ctx, 47, 12, RU);
  // claw fingers
  line(ctx, 47, 5, 44, 1, M[1]); P(ctx, 44, 1, M[0]);
  line(ctx, 49, 5, 49, 0, M[1]); P(ctx, 49, 0, M[0]);
  line(ctx, 51, 5, 54, 2, M[2]); P(ctx, 54, 2, M[1]);
  // torn cable dangling from the shoulder joint, sparking at the tip
  line(ctx, 46, 19, 42, 24, PAL.magenta3);
  line(ctx, 42, 24, 43, 28, PAL.magenta3);
  statusLight(ctx, 43, 29, PAL.magenta1);

  // scorch marks under the breach
  dither(ctx, 26, 36, 10, 2, PAL.shadow, PAL.void);

  outline(ctx, 0, 0, W, H);
  return c;
}

// ---------------------------------------------------------------------------
// neon_sign — hanging neon panel, magenta glyphs + cyan trim (~40x46)
// ---------------------------------------------------------------------------
function buildNeonSign() {
  const W = 40, H = 46;
  const c = makeCanvas(W, H);
  const ctx = c.getContext('2d');
  const rand = rng(5507);
  const M = RAMPS.metal;

  // ceiling mount bar
  R(ctx, 4, 0, 32, 3, M[2]);
  R(ctx, 4, 0, 32, 1, M[1]);
  rivet(ctx, 6, 1, M); rivet(ctx, 32, 1, M);
  // hanging chains
  for (let j = 3; j < 10; j += 2) {
    P(ctx, 9, j, M[1]); P(ctx, 9, j + 1, M[3]);
    P(ctx, 30, j, M[1]); P(ctx, 30, j + 1, M[3]);
  }

  // panel body
  R(ctx, 3, 10, 34, 30, M[3]);
  R(ctx, 4, 11, 32, 28, PAL.void);
  R(ctx, 3, 10, 34, 1, M[1]);            // lit top
  R(ctx, 3, 10, 1, 30, M[2]);            // lit left
  P(ctx, 3, 10, M[0]);
  // cyan neon trim tube around inner edge
  R(ctx, 5, 12, 30, 1, PAL.cyan2);
  R(ctx, 5, 37, 30, 1, PAL.cyan2);
  R(ctx, 5, 13, 1, 24, PAL.cyan2);
  R(ctx, 34, 13, 1, 24, PAL.cyan2);
  P(ctx, 5, 12, PAL.cyan1); P(ctx, 20, 12, PAL.cyan1); P(ctx, 34, 37, PAL.cyan3); // tube hot/cold spots
  P(ctx, 12, 12, PAL.cyan0);

  // magenta glyph rows (alien lettering, uneven strokes)
  const glyphRow = (y, seed) => {
    const rr = rng(seed);
    let x = 8;
    while (x < 31) {
      const w = 1 + Math.floor(rr() * 3);
      const tall = rr() < 0.4;
      R(ctx, x, y, w, 1, PAL.magenta1);
      if (tall) R(ctx, x, y - 2, 1, 2, PAL.magenta1);
      if (rr() < 0.35) P(ctx, x + w - 1, y + 1, PAL.magenta2);
      if (rr() < 0.25) P(ctx, x, y - 1, PAL.magenta0);
      x += w + 1 + Math.floor(rr() * 2);
    }
  };
  glyphRow(18, 111);
  glyphRow(25, 222);
  glyphRow(32, 333);
  // one dying flicker glyph (dimmed segment)
  R(ctx, 26, 32, 3, 1, PAL.magenta3);
  // glyph glow wash
  glow(ctx, 19, 24, 9, PAL.magenta2);
  P(ctx, 10, 18, PAL.white);          // hottest glyph pixel
  glow(ctx, 10, 18, 2, PAL.magenta0);

  // hazard stripe strip under the panel
  hazardStripes(ctx, 6, 41, 28, 3);
  // mount bolts bottom corners
  rivet(ctx, 4, 41, M); rivet(ctx, 34, 41, M);

  // power cable running up the right side
  line(ctx, 36, 10, 38, 4, PAL.magenta3);
  P(ctx, 38, 3, PAL.magenta2);

  // grime on lower-right of frame
  rustPatch(ctx, 30, 36, 5, 3, rand, 0.4);

  outline(ctx, 0, 0, W, H);
  return c;
}

// ---------------------------------------------------------------------------
// vent_stack — steam vent chimney with rising vapor (~28x58)
// ---------------------------------------------------------------------------
function buildVentStack() {
  const W = 28, H = 58;
  const c = makeCanvas(W, H);
  const ctx = c.getContext('2d');
  const rand = rng(8811);
  const M = RAMPS.metal;
  const RU = [PAL.rust0, PAL.rust1, PAL.rust2, shade(PAL.rust2, -0.35)];
  const steam1 = shade(PAL.metal0, 0.35);
  const steam2 = PAL.metal0;

  // rising steam puffs (behind the stack top) — drawn first so stack overlaps
  const puffs = [
    { x: 13, y: 4, r: 4 }, { x: 17, y: 8, r: 3 },
    { x: 10, y: 10, r: 3 }, { x: 14, y: 14, r: 2 },
  ];
  ctx.save();
  ctx.globalAlpha = 0.55;
  for (const p of puffs) circleFill(ctx, p.x, p.y, p.r, steam2);
  ctx.globalAlpha = 0.8;
  for (const p of puffs) circleFill(ctx, p.x - 1, p.y - 1, Math.max(1, p.r - 2), steam1);
  ctx.restore();
  P(ctx, 12, 3, PAL.white); P(ctx, 16, 7, steam1);

  // stack body (tapered chimney)
  for (let j = 0; j < 34; j++) {
    const y = 18 + j;
    const half = 5 + Math.floor(j / 14);
    const x0 = 13 - half, x1 = 13 + half;
    R(ctx, x0, y, x1 - x0 + 1, 1, M[2]);
    P(ctx, x0, y, M[0]);            // lit left edge
    P(ctx, x0 + 1, y, M[1]);
    P(ctx, x1, y, M[3]);            // dark right edge
  }
  // mouth cap — flared rim with dark opening
  R(ctx, 6, 16, 15, 3, M[1]);
  R(ctx, 6, 16, 15, 1, M[0]);
  P(ctx, 20, 18, M[3]);
  R(ctx, 8, 15, 11, 1, PAL.void);   // dark vent mouth
  // heat shimmer at the mouth
  P(ctx, 11, 14, steam1); P(ctx, 15, 14, steam2);

  // grille band midway (dark slits)
  for (let j = 0; j < 3; j++) R(ctx, 9, 30 + j * 3, 10, 1, PAL.void);
  R(ctx, 8, 29, 12, 1, M[1]);
  R(ctx, 8, 38, 12, 1, M[3]);
  // cyan heat glow leaking through the grille
  glow(ctx, 14, 33, 4, PAL.cyan2);
  P(ctx, 12, 33, PAL.cyan1); P(ctx, 16, 30, PAL.cyan1); P(ctx, 14, 36, PAL.cyan0);

  // joint collar + rivets
  R(ctx, 7, 24, 13, 2, M[1]);
  R(ctx, 7, 24, 13, 1, M[0]);
  rivet(ctx, 8, 43, M); rivet(ctx, 17, 43, M);

  // rust streaks running down from the grille
  rustPatch(ctx, 10, 40, 8, 8, rand, 0.25);
  line(ctx, 18, 39, 18, 46, RU[2]);
  P(ctx, 18, 47, RU[1]);

  // hazard stripe base block
  R(ctx, 4, 52, 20, 6, M[2]);
  R(ctx, 4, 52, 20, 1, M[1]);
  R(ctx, 4, 57, 20, 1, M[3]);
  hazardStripes(ctx, 6, 53, 16, 3);
  rivet(ctx, 5, 55, M); rivet(ctx, 21, 55, M);

  // small magenta status light on the base
  statusLight(ctx, 23, 53, PAL.magenta1);

  outline(ctx, 0, 0, W, H);
  return c;
}

// ---------------------------------------------------------------------------
// contract
// ---------------------------------------------------------------------------
export function build() {
  return {
    stamps: {
      reactor_core: { canvas: buildReactorCore() },
      pipe_cluster: { canvas: buildPipeCluster() },
      mech_husk:    { canvas: buildMechHusk() },
      neon_sign:    { canvas: buildNeonSign() },
      vent_stack:   { canvas: buildVentStack() },
    },
  };
}
