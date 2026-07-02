// AETHERFALL — tiles_ruins.js — SKY BASTION tileset (biome: ruins)
// Pale weathered stone masonry high above the cloud sea: sun-bleached brick courses
// with verdigris metal trim, cracked slab tops threaded with broken gold inlay and
// tiny wind-blown dry grass, marble columns, bronze-capped wooden beam platforms,
// and jagged broken rebar spikes.
//
// tiles:  '#'   solid masonry fill (3 variants)
//         '#top' cracked slab surface w/ gold inlay + dry grass (3 variants)
//         'X'   reinforced block: stone panel in a riveted verdigris-braced frame
//         '|'   fluted marble column (stacks seamlessly, drum joints every 8px)
//         '='   one-way platform: wooden beam with bronze end caps (top 6px only)
//         '^'   hazard: broken rusted rebar spikes
// decor:  'g'   dry wind-blown grass (2 variants)
//         'c'   verdigris bronze ornament (corroded rosette)
//         'v'   torn golden banner scrap
//         'l'   brazier with warm flame
//         'r'   holographic glyph projection

import { PAL } from './palette.js';
import { makeCanvas, P, R, line, circleFill, outline, glow, shade, rng } from './util.js';

const T = 16;

// ---- material shorthands -------------------------------------------------
const S0 = PAL.stone0, S1 = PAL.stone1, S2 = PAL.stone2, S3 = PAL.stone3;
const MARBLE = shade(PAL.stone0, 0.35);        // sun-bleached lit edge
const VG_HI = shade(PAL.moss1, 0.35);          // verdigris (corroded bronze) ramp
const VG = PAL.moss1;
const VG_LO = PAL.moss2;
const VG_DK = shade(PAL.moss2, -0.3);
const WOOD_HI = shade(PAL.amber1, 0.3);        // weathered beam wood
const WOOD = PAL.amber1;
const WOOD_LO = PAL.amber2;
const WOOD_DK = shade(PAL.amber2, -0.35);
const GRASS_HI = PAL.gold0;                    // dry sun-gold grass
const GRASS = PAL.gold1;
const GRASS_LO = shade(PAL.gold1, -0.3);

// ---- '#' solid masonry fill ------------------------------------------------
// Brick courses 4px tall; mortar lines at fixed rows and internal-only vertical
// joints so any two tiles seam perfectly side by side and stacked.
function stoneBody(ctx, x, y, seed) {
  const rr = rng(seed);
  R(ctx, x, y, T, T, S1);
  for (let j0 = 0; j0 < 16; j0 += 4) {
    // mortar shadow at the bottom of each course
    R(ctx, x, y + j0 + 3, T, 1, S2);
    // weathered lit top edge of each course (light from upper-left)
    for (let i = 0; i < 16; i++) if (rr() < 0.55) P(ctx, x + i, y + j0, S0);
    // vertical joints — alternating running bond, internal columns only
    const joints = (j0 >> 2) % 2 === 0 ? [7] : [3, 11];
    for (const jx of joints) {
      R(ctx, x + jx, y + j0, 1, 3, S2);
      P(ctx, x + jx, y + j0 + 3, S3);
      P(ctx, x + jx + 1, y + j0, S0); // lit brick corner beside the joint
    }
  }
  // deeper mortar accents
  for (let i = 0; i < 6; i++) P(ctx, x + ((rr() * 16) | 0), y + 3 + 4 * ((rr() * 4) | 0), S3);
  // weathering pocks
  for (let i = 0; i < 7; i++) P(ctx, x + ((rr() * 16) | 0), y + ((rr() * 16) | 0), S2);
  // verdigris run-off stains
  for (let i = 0; i < 3; i++) {
    const sx = x + 1 + ((rr() * 14) | 0), sy = y + 1 + ((rr() * 14) | 0);
    P(ctx, sx, sy, VG_LO);
    if (rr() < 0.6) P(ctx, sx, sy + 1, VG_DK);
  }
  // a hairline crack wandering down
  if (rr() < 0.9) {
    let cx = x + 2 + ((rr() * 11) | 0), cy = y + 1 + ((rr() * 4) | 0);
    for (let s = 0; s < 6; s++) {
      P(ctx, cx, cy, S3);
      cy += 1 + (rr() < 0.4 ? 1 : 0);
      cx += rr() < 0.45 ? 1 : rr() < 0.5 ? -1 : 0;
      if (cy > y + 14 || cx < x || cx > x + 15) break;
    }
  }
}

// ---- '#top' cracked slab surface -------------------------------------------
function stoneTop(ctx, x, y, seed) {
  stoneBody(ctx, x, y, seed + 40);
  const rr = rng(seed);
  ctx.clearRect(x, y, T, 2);                 // open air above the walkway slab
  // pale slab, sun catching the rim
  R(ctx, x, y + 2, T, 1, MARBLE);
  R(ctx, x, y + 3, T, 2, S0);
  R(ctx, x, y + 5, T, 1, S1);
  // cracks across the slab
  const n = 2 + ((rr() * 2) | 0);
  for (let i = 0; i < n; i++) {
    const cx = x + 1 + ((rr() * 13) | 0);
    P(ctx, cx, y + 3, S2);
    P(ctx, cx + (rr() < 0.5 ? 1 : -1), y + 4, S2);
    if (rr() < 0.5) P(ctx, cx, y + 5, S3);
  }
  // broken gold inlay channel — edge pixels always present so the ancient
  // gold line runs continuously across neighbouring tiles
  P(ctx, x, y + 4, PAL.gold1);
  P(ctx, x + 15, y + 4, PAL.gold1);
  for (let i = 1; i < 15; i++) if (rr() < 0.7) P(ctx, x + i, y + 4, PAL.gold1);
  P(ctx, x + 3 + ((rr() * 9) | 0), y + 4, PAL.gold0);   // sun glint
  // one crack biting down into the masonry below
  const dx = x + 2 + ((rr() * 11) | 0);
  P(ctx, dx, y + 6, S3); P(ctx, dx + 1, y + 7, S3); P(ctx, dx + 1, y + 8, S2);
  // tiny wind-blown dry grass tufts, all bent the same way by the high wind
  const tufts = 3 + ((rr() * 2) | 0);
  for (let t = 0; t < tufts; t++) {
    const bx = x + 1 + ((rr() * 12) | 0);
    const col = rr() < 0.5 ? GRASS : GRASS_LO;
    P(ctx, bx, y + 2, GRASS_LO);
    P(ctx, bx, y + 1, col);
    P(ctx, bx + 1, y, col);
    if (rr() < 0.4) P(ctx, bx + 2, y, GRASS_HI);        // seed head catching sun
  }
}

// ---- 'X' reinforced block ---------------------------------------------------
function blockX(ctx, x, y) {
  R(ctx, x, y, T, T, PAL.metal2);
  // dark rim
  R(ctx, x, y, T, 1, PAL.metal3);
  R(ctx, x, y + 15, T, 1, shade(PAL.metal3, -0.35));
  R(ctx, x, y, 1, T, PAL.metal3);
  R(ctx, x + 15, y, 1, T, shade(PAL.metal3, -0.35));
  // bevel — lit upper-left, dark lower-right
  R(ctx, x + 1, y + 1, 14, 1, PAL.metal0);
  R(ctx, x + 1, y + 1, 1, 14, PAL.metal1);
  R(ctx, x + 1, y + 14, 14, 1, PAL.metal3);
  R(ctx, x + 14, y + 2, 1, 13, PAL.metal3);
  // recessed carved stone panel
  R(ctx, x + 3, y + 3, 10, 10, S2);
  R(ctx, x + 3, y + 3, 10, 1, S3);
  R(ctx, x + 3, y + 3, 1, 10, S3);
  R(ctx, x + 4, y + 12, 9, 1, S1);
  R(ctx, x + 12, y + 4, 1, 9, S1);
  // verdigris cross braces
  line(ctx, x + 4, y + 4, x + 11, y + 11, VG);
  line(ctx, x + 4, y + 5, x + 10, y + 11, VG_LO);
  line(ctx, x + 11, y + 4, x + 4, y + 11, VG);
  line(ctx, x + 11, y + 5, x + 5, y + 11, VG_LO);
  P(ctx, x + 4, y + 4, VG_HI);
  P(ctx, x + 11, y + 4, VG_HI);
  // hub plate where the braces meet
  P(ctx, x + 7, y + 7, VG_HI); P(ctx, x + 8, y + 7, VG_HI);
  P(ctx, x + 7, y + 8, VG); P(ctx, x + 8, y + 8, VG_DK);
  // gold rivets in the frame corners
  for (const [rx, ry] of [[2, 2], [13, 2], [2, 13], [13, 13]]) {
    P(ctx, x + rx, y + ry, PAL.gold1);
    P(ctx, x + rx + 1, y + ry + 1, PAL.amber2);
  }
  P(ctx, x + 2, y + 2, PAL.gold0);   // upper-left rivet catches the sun
}

// ---- '|' fluted marble column ------------------------------------------------
function column(ctx, x, y) {
  // crisp silhouette edges
  R(ctx, x + 2, y, 1, T, PAL.outline);
  R(ctx, x + 13, y, 1, T, PAL.outline);
  // shaft — light rakes in from the left
  R(ctx, x + 3, y, 1, T, MARBLE);
  R(ctx, x + 4, y, 2, T, S0);
  R(ctx, x + 6, y, 1, T, S2);                 // flute groove (deep shadow)
  R(ctx, x + 7, y, 1, T, MARBLE);             // lit ridge between flutes
  R(ctx, x + 8, y, 1, T, S0);
  R(ctx, x + 9, y, 1, T, S2);                 // flute groove (deep shadow)
  R(ctx, x + 10, y, 2, T, shade(S0, -0.12));
  R(ctx, x + 12, y, 1, T, S2);                // east shadow edge
  // drum joints every 8px so stacked tiles read as segmented drums
  for (const jy of [7, 15]) {
    R(ctx, x + 3, y + jy, 10, 1, S2);
    P(ctx, x + 3, y + jy, S1);
  }
  for (const jy of [0, 8]) R(ctx, x + 4, y + jy, 8, 1, MARBLE);
  // age: chipped flute + verdigris weep below the joint
  P(ctx, x + 7, y + 4, S1); P(ctx, x + 8, y + 5, S1);
  P(ctx, x + 5, y + 10, VG_LO); P(ctx, x + 5, y + 11, VG_DK);
  P(ctx, x + 11, y + 2, VG_LO);
}

// ---- '=' one-way beam platform -------------------------------------------------
function beam(ctx, x, y) {
  // wooden walking beam — only the top 6px are drawn (one-way platform)
  R(ctx, x, y, T, 1, WOOD_HI);
  R(ctx, x, y + 1, T, 3, WOOD);
  R(ctx, x, y + 4, T, 1, WOOD_LO);
  R(ctx, x, y + 5, T, 1, WOOD_DK);
  // grain flecks
  const rr = rng(77);
  for (let i = 0; i < 7; i++) P(ctx, x + ((rr() * 16) | 0), y + 1 + ((rr() * 3) | 0), shade(WOOD, -0.22));
  // plank break line mid-span
  R(ctx, x + 8, y + 1, 1, 4, shade(WOOD, -0.3));
  P(ctx, x + 9, y + 1, WOOD_HI);
  // bronze end caps (become segment collars when tiles repeat)
  for (const cx of [0, 14]) {
    R(ctx, x + cx, y, 2, 6, PAL.gold1);
    R(ctx, x + cx, y, 2, 1, PAL.gold0);
    R(ctx, x + cx, y + 5, 2, 1, PAL.amber2);
    P(ctx, x + cx + (cx === 0 ? 1 : 0), y + 2, PAL.amber2);   // rivet
    P(ctx, x + cx + (cx === 0 ? 0 : 1), y + 4, VG_LO);        // corrosion fleck
  }
}

// ---- '^' broken rebar spikes ---------------------------------------------------
function spikes(ctx, x, y, seed) {
  const rr = rng(seed);
  // rubble base
  R(ctx, x, y + 14, T, 2, S2);
  for (let i = 0; i < 16; i++) if (rr() < 0.5) P(ctx, x + i, y + 13, S1);
  for (let i = 0; i < 8; i++) P(ctx, x + ((rr() * 16) | 0), y + 14 + ((rr() * 2) | 0), S3);
  P(ctx, x + 2, y + 13, S0); P(ctx, x + 11, y + 13, S0);      // lit rubble chips
  // sheared rebar shafts — rusted, bent, tips catching light
  const bars = [
    { bx: 2, tip: 5, bend: 1 },
    { bx: 6, tip: 3, bend: -1 },
    { bx: 10, tip: 6, bend: 1 },
    { bx: 13, tip: 7, bend: 0 },
  ];
  for (const b of bars) {
    line(ctx, x + b.bx, y + 13, x + b.bx + b.bend, y + b.tip, PAL.rust1);
    line(ctx, x + b.bx + 1, y + 13, x + b.bx + 1 + b.bend, y + b.tip + 1, PAL.rust2);
    P(ctx, x + b.bx + b.bend, y + b.tip, PAL.rust0);          // bright sheared tip
  }
  // danger glints on the two tallest points
  P(ctx, x + 5, y + 3, PAL.ember1);
  P(ctx, x + 11, y + 6, PAL.ember1);
  // a snapped bar leaning across
  line(ctx, x + 4, y + 9, x + 8, y + 6, PAL.rust2);
  P(ctx, x + 8, y + 6, PAL.rust0);
  outline(ctx, x, y, T, T);
}

// ---- 'g' dry wind-blown grass ---------------------------------------------------
function dryGrass(ctx, x, y, seed) {
  const rr = rng(seed);
  R(ctx, x + 3, y + 15, 10, 1, GRASS_LO);   // root shadow
  for (let i = 0; i < 6; i++) {
    const bx = x + 2 + ((rr() * 11) | 0);
    const h = 3 + ((rr() * 5) | 0);
    const col = [GRASS, GRASS_LO, PAL.amber1][(rr() * 3) | 0];
    let px = bx;
    for (let k = 0; k < h; k++) {
      P(ctx, px, y + 15 - k, col);
      if (k > h - 3) px += 1;               // tips all bend with the wind
    }
    if (rr() < 0.5) P(ctx, px, y + 15 - h, GRASS_HI);   // dry seed head
  }
  outline(ctx, x, y, T, T);
}

// ---- 'c' verdigris ornament ------------------------------------------------------
function ornament(ctx, x, y) {
  // corroded bronze rosette bolted to the masonry — machined ring with a
  // recessed dark well and surviving gold leaf, so it reads METAL not foliage
  circleFill(ctx, x + 8, y + 8, 5, VG_DK);          // shaded outer rim
  circleFill(ctx, x + 7, y + 7, 4, VG);             // ring body, lit toward upper-left
  circleFill(ctx, x + 8, y + 8, 2, VG_DK);          // recessed center well
  // surviving gold leaf — bold crescent along the sun-lit upper-left rim
  for (const [ax, ay] of [[3, 7], [3, 8], [4, 5], [4, 6], [5, 4], [6, 4], [7, 3], [8, 3]]) {
    P(ctx, x + ax, y + ay, PAL.gold1);
  }
  P(ctx, x + 4, y + 4, PAL.gold0);                  // sun glints on the leaf
  P(ctx, x + 6, y + 3, PAL.gold0);
  // machined highlight inside the ring + radial rivet spokes
  P(ctx, x + 5, y + 6, VG_HI); P(ctx, x + 6, y + 5, VG_HI);
  for (const [sx, sy] of [[8, 5], [5, 8], [8, 11], [11, 8]]) P(ctx, x + sx, y + sy, PAL.amber2);
  // gold center boss glinting in the dark well
  P(ctx, x + 8, y + 8, PAL.gold1);
  P(ctx, x + 7, y + 7, PAL.gold0);
  // corner mounting bolts
  P(ctx, x + 3, y + 3, PAL.amber2); P(ctx, x + 12, y + 3, VG_LO);
  P(ctx, x + 3, y + 12, VG_LO); P(ctx, x + 12, y + 12, VG_DK);
  // green drip stain weeping down
  P(ctx, x + 8, y + 13, VG_LO);
  P(ctx, x + 8, y + 14, VG_LO);
  P(ctx, x + 8, y + 15, VG_DK);
  outline(ctx, x, y, T, T);
}

// ---- 'v' torn golden banner scrap --------------------------------------------------
function banner(ctx, x, y) {
  // bronze rod
  R(ctx, x + 2, y, 12, 1, PAL.gold1);
  P(ctx, x + 2, y, PAL.gold0);
  P(ctx, x + 13, y, PAL.amber2);
  // ragged cloth — column lengths give the torn hem, wind drifts the tips right
  const hem = [11, 13, 8, 12, 14, 9, 11, 6];
  for (let i = 0; i < 8; i++) {
    const h = hem[i];
    for (let k = 1; k <= h; k++) {
      const cx = x + 4 + i + (k > 10 ? 1 : 0);          // lower cloth blown sideways
      let col = PAL.gold1;
      if (i === 0) col = PAL.gold0;                     // lit leading edge
      else if (i >= 6) col = PAL.amber2;                // shadowed trailing edge
      if (k >= 5 && k <= 6) col = PAL.ember2;           // faded emblem stripe
      P(ctx, cx, y + k, col);
    }
    P(ctx, x + 4 + i + (h + 1 > 10 ? 1 : 0), y + h + 1, shade(PAL.amber2, -0.25)); // frayed tip
  }
  outline(ctx, x, y, T, T);
}

// ---- 'l' brazier ---------------------------------------------------------------------
function brazier(ctx, x, y) {
  // flame body (drawn first so the bowl rim overlaps its base)
  R(ctx, x + 5, y + 7, 6, 2, PAL.ember1);
  R(ctx, x + 6, y + 5, 4, 2, PAL.ember1);
  R(ctx, x + 7, y + 4, 2, 1, PAL.ember1);
  P(ctx, x + 8, y + 3, PAL.ember1);
  P(ctx, x + 5, y + 6, PAL.ember0);                 // licking tongue
  R(ctx, x + 7, y + 6, 2, 3, PAL.amber0);           // hot core
  P(ctx, x + 7, y + 5, PAL.amber0);
  P(ctx, x + 7, y + 7, PAL.white);                  // hottest pixel
  // bronze bowl
  R(ctx, x + 4, y + 9, 8, 1, PAL.gold0);            // lit rim
  R(ctx, x + 4, y + 10, 8, 2, PAL.gold1);
  R(ctx, x + 5, y + 12, 6, 1, PAL.amber2);
  P(ctx, x + 5, y + 11, VG);                        // verdigris creeping up the bowl
  P(ctx, x + 10, y + 11, VG_LO);
  P(ctx, x + 11, y + 10, PAL.amber2);               // shaded east side
  // pedestal
  R(ctx, x + 7, y + 13, 2, 2, PAL.metal2);
  P(ctx, x + 7, y + 13, PAL.metal1);
  R(ctx, x + 5, y + 15, 6, 1, PAL.metal3);
  P(ctx, x + 5, y + 15, PAL.metal1);
  outline(ctx, x, y, T, T);
  glow(ctx, x + 8, y + 6, 5, PAL.amber0);           // warm halo over everything
}

// ---- 'r' holographic glyph --------------------------------------------------------------
function glyph(ctx, x, y) {
  // projector stud set into the floor
  R(ctx, x + 6, y + 14, 4, 2, PAL.metal2);
  R(ctx, x + 6, y + 14, 4, 1, PAL.metal1);
  P(ctx, x + 7, y + 14, PAL.cyan0);
  P(ctx, x + 8, y + 14, PAL.cyan1);
  // faint dashed beam
  P(ctx, x + 7, y + 12, PAL.cyan3);
  P(ctx, x + 8, y + 11, PAL.cyan3);
  // hovering holo-rune with scanline gaps
  const rune = [
    '..####..',
    '.#....#.',
    '........',   // scanline gap
    '.#.##.#.',
    '.#....#.',
    '........',   // scanline gap
    '..#..#..',
    '...##...',
  ];
  for (let j = 0; j < rune.length; j++) {
    for (let i = 0; i < 8; i++) {
      if (rune[j][i] === '#') P(ctx, x + 4 + i, y + 2 + j, PAL.cyan1);
    }
  }
  // hot nodes + chromatic interference
  P(ctx, x + 6, y + 5, PAL.cyan0);
  P(ctx, x + 9, y + 5, PAL.cyan0);
  P(ctx, x + 7, y + 9, PAL.white);
  P(ctx, x + 4, y + 3, PAL.violet1);
  P(ctx, x + 11, y + 8, PAL.violet1);
  glow(ctx, x + 8, y + 5, 5, PAL.cyan1);
}

// ---- build ------------------------------------------------------------------------------
export function build() {
  const c = makeCanvas(10 * T, 2 * T);
  const ctx = c.getContext('2d');
  const at = (i, j) => ({ x: i * T, y: j * T });

  // row 0 — structural tiles
  stoneBody(ctx, 0, 0, 11);
  stoneBody(ctx, 16, 0, 23);
  stoneBody(ctx, 32, 0, 37);
  stoneTop(ctx, 48, 0, 51);
  stoneTop(ctx, 64, 0, 67);
  stoneTop(ctx, 80, 0, 83);
  blockX(ctx, 96, 0);
  column(ctx, 112, 0);
  beam(ctx, 128, 0);
  spikes(ctx, 144, 0, 91);

  // row 1 — decor
  dryGrass(ctx, 0, 16, 101);
  dryGrass(ctx, 16, 16, 113);
  ornament(ctx, 32, 16);
  banner(ctx, 48, 16);
  brazier(ctx, 64, 16);
  glyph(ctx, 80, 16);

  return {
    image: c,
    tileSize: T,
    tiles: {
      '#': [at(0, 0), at(1, 0), at(2, 0)],
      '#top': [at(3, 0), at(4, 0), at(5, 0)],
      'X': at(6, 0),
      '|': at(7, 0),
      '=': at(8, 0),
      '^': at(9, 0),
      'g': [at(0, 1), at(1, 1)],
      'c': at(2, 1),
      'v': at(3, 1),
      'l': at(4, 1),
      'r': at(5, 1),
    },
  };
}
