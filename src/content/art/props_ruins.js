// AETHERFALL — props_ruins.js — SKY BASTION scenic props (kind: props)
//
// Stamp names (reference these from level `decor`):
//   tower_broken      — 56x80  colossal broken tower section: jagged crown, amber-lit
//                       arched window, verdigris band, holo-glyph, floating masonry chips
//   banner_pole       — 28x78  verdigris pole + gold finial, wind-torn golden banner
//                       with violet crystal emblem
//   bridge_arch       — 76x54  shattered stone bridge arch: two piers, broken span,
//                       hanging chain, falling rubble in the gap
//   guardian_statue   — 32x68  ancient armored sentinel on a pedestal, sword point-down,
//                       glowing cyan eyes, moss + cracks
//   brazier_column    — 26x60  fluted stone column, verdigris fire-bowl, living amber
//                       flame + drifting embers
//   floating_masonry  — 36x34  drifting rubble cluster held aloft by cyan crystal shards
//
// Palette-only colors (PAL/RAMPS + shade()). Light from upper-left. Outlines PAL.outline.

import { PAL, RAMPS } from './palette.js';
import {
  makeCanvas, P, R, line, circleFill, ellipseFill,
  dither, outline, glow, shade, rng,
} from './util.js';

const ST = RAMPS.stone;             // [light..dark] pale bastion stone
const VG1 = PAL.moss1, VG2 = PAL.moss2;   // verdigris metal
const CRACK = shade(ST[3], -0.25);        // deep crack color (from ramp, darker)

// ---------------------------------------------------------------- helpers

// horizontal mortar + offset vertical brick joints inside a rect
function bricks(ctx, x, y, w, h, rowH, brickW, cLine, r) {
  for (let j = rowH; j < h; j += rowH) {
    R(ctx, x, y + j, w, 1, cLine);
    const off = ((j / rowH) & 1) ? (brickW >> 1) : 0;
    for (let i = off; i < w; i += brickW) {
      const jitter = (r() * 2) | 0;
      line(ctx, x + i, y + j - rowH + 1 + jitter, x + i, y + j - 1, cLine);
    }
  }
}

// wandering crack line downward
function crack(ctx, x, y, len, r, c = CRACK) {
  let cx = x, cy = y;
  for (let i = 0; i < len; i++) {
    P(ctx, cx, cy, c);
    cy++;
    if (r() < 0.45) cx += r() < 0.5 ? -1 : 1;
  }
}

// moss speckle patch
function moss(ctx, x, y, w, h, r, density = 0.35) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    if (r() < density * (1 - j / h)) P(ctx, x + i, y + j, r() < 0.3 ? VG1 : VG2);
  }
}

// ------------------------------------------------------------ tower_broken

function towerBroken() {
  const W = 56, H = 80;
  const c = makeCanvas(W, H);
  const ctx = c.getContext('2d');
  const r = rng(7101);

  const L = 8, Rt = 48;              // tower body x-range [L, Rt)
  // jagged broken crown — height per 4px column
  const crown = [22, 15, 19, 12, 16, 10, 14, 18, 13, 20];
  const topAt = (x) => crown[Math.min(crown.length - 1, ((x - L) / 4) | 0)];
  // -- body columns with cylindrical shading (light upper-left)
  for (let x = L; x < Rt; x++) {
    const t = (x - L) / (Rt - L - 1);           // 0 left .. 1 right
    const col = t < 0.22 ? ST[0] : t < 0.5 ? ST[1] : t < 0.8 ? ST[2] : ST[3];
    R(ctx, x, topAt(x), 1, H - topAt(x), col);
  }
  // dither the two shading seams so the cylinder reads smooth
  for (let y = 10; y < H; y++) {
    const seamA = L + Math.round((Rt - L) * 0.22), seamB = L + Math.round((Rt - L) * 0.5);
    if (y >= topAt(seamA)) P(ctx, seamA + ((y & 1) ? 0 : -1), y, ((y & 1) ? ST[0] : ST[1]));
    if (y >= topAt(seamB)) P(ctx, seamB + ((y & 1) ? 0 : -1), y, ((y & 1) ? ST[1] : ST[2]));
  }
  // broken-crown rim highlight + rubble teeth shadows
  for (let x = L; x < Rt; x++) {
    const ty = topAt(x);
    P(ctx, x, ty, shade(ST[0], 0.18));
    if (topAt(x + 1) > ty + 2) R(ctx, x, ty + 1, 1, 2, ST[3]); // break shadow face
  }
  // brickwork
  bricks(ctx, L, 24, Rt - L, H - 24, 8, 12, shade(ST[2], -0.18), r);
  // verdigris metal band
  R(ctx, L, 64, Rt - L, 5, VG2);
  R(ctx, L, 64, Rt - L, 1, VG1);
  R(ctx, L, 64, 9, 5, VG1);                        // lit left end
  for (let x = L + 2; x < Rt - 1; x += 7) P(ctx, x, 66, PAL.gold1); // rivets
  // arched window, amber sunset light inside
  const wx = 22, wy = 38, ww = 12, wh = 22;
  R(ctx, wx, wy + 4, ww, wh - 4, PAL.deepPurple);
  ellipseFill(ctx, wx + ww / 2 - 0.5, wy + 4, 6, 5, PAL.deepPurple);
  R(ctx, wx + 1, wy + wh - 7, ww - 2, 6, PAL.amber2);
  R(ctx, wx + 2, wy + wh - 4, ww - 4, 3, PAL.amber1);
  R(ctx, wx + 4, wy + wh - 2, ww - 8, 1, PAL.amber0);
  P(ctx, wx + 5, wy + wh - 2, PAL.sun);
  // window sill + keystone
  R(ctx, wx - 1, wy + wh, ww + 2, 2, ST[1]);
  R(ctx, wx - 1, wy + wh, ww + 2, 1, ST[0]);
  R(ctx, wx + 4, wy - 3, 4, 3, ST[0]);
  // holographic glyph (emissive cyan rune)
  const gx = 14, gy = 50;
  R(ctx, gx, gy, 1, 7, PAL.cyan1); R(ctx, gx + 3, gy, 1, 7, PAL.cyan1);
  R(ctx, gx, gy + 3, 4, 1, PAL.cyan0); P(ctx, gx + 1, gy, PAL.cyan0);
  // cracks + weathering
  crack(ctx, 40, 26, 14, r); crack(ctx, 13, 30, 10, r); crack(ctx, 33, 64, 9, r);
  moss(ctx, L, H - 8, 14, 8, r, 0.45);
  moss(ctx, 36, H - 6, 12, 6, r, 0.3);
  dither(ctx, Rt - 5, 30, 3, 20, ST[2], ST[3]);    // right-side ambient occlusion
  outline(ctx, 0, 8, W, H - 8, PAL.outline);       // body outline (skip chip zone first)
  // floating masonry chips (drawn after body outline, then outlined themselves)
  const chip = (x, y, w, h) => {
    R(ctx, x, y, w, h, ST[2]); R(ctx, x, y, w, 1, ST[0]); R(ctx, x, y + 1, 1, h - 1, ST[1]);
  };
  const chips = [[1, 12, 6, 5], [50, 30, 5, 4], [2, 44, 4, 4]];
  for (const [x, y, w, h] of chips) chip(x, y, w, h);
  outline(ctx, 0, 0, W, H, PAL.outline);
  // emissive passes AFTER outline (glow halos must not be outlined)
  glow(ctx, wx + 6, wy + wh - 3, 6, PAL.amber1);       // window light spill
  glow(ctx, gx + 2, gy + 3, 5, PAL.cyan1);             // holo-glyph
  for (const [x, y, w, h] of chips) {                  // anti-grav motes under chips
    P(ctx, x + (w >> 1), y + h + 1, PAL.cyan0);
    glow(ctx, x + (w >> 1), y + h + 2, 3, PAL.cyan1);
  }
  return { canvas: c };
}

// ------------------------------------------------------------- banner_pole

function bannerPole() {
  const W = 28, H = 78;
  const c = makeCanvas(W, H);
  const ctx = c.getContext('2d');
  const r = rng(7202);

  // stone footing
  R(ctx, 1, 72, 10, 6, ST[2]); R(ctx, 1, 72, 10, 1, ST[0]);
  R(ctx, 2, 70, 8, 2, ST[1]); R(ctx, 2, 70, 8, 1, ST[0]);
  moss(ctx, 1, 75, 5, 3, r, 0.5);
  // pole (verdigris metal, lit left edge)
  R(ctx, 5, 8, 3, 63, VG2);
  R(ctx, 5, 8, 1, 63, VG1);
  P(ctx, 6, 20, VG1); P(ctx, 6, 40, VG1); P(ctx, 6, 58, VG1); // worn glints
  // crossbar
  R(ctx, 5, 10, 21, 2, VG2); R(ctx, 5, 10, 21, 1, VG1);
  P(ctx, 25, 12, PAL.gold1);
  // gold finial (emissive in sunset light)
  circleFill(ctx, 6, 5, 3, PAL.gold1);
  P(ctx, 5, 4, PAL.gold0); P(ctx, 6, 4, PAL.gold0); P(ctx, 5, 5, PAL.gold0);
  P(ctx, 5, 3, PAL.white);
  // banner — hangs from crossbar, wind-blown wavy right edge, tattered hem
  const by = 13, bx = 9;
  for (let y = by; y <= 56; y++) {
    const t = (y - by) / (56 - by);
    const sway = Math.round(Math.sin(t * 5.2) * 2.5 * t);          // wave grows downward
    const w = 15 - Math.round(t * 2) + sway;
    if (w < 5) continue;
    // tattered hem: ragged column drops near the bottom
    let ww = w;
    if (y > 48) { const bite = [0, 3, 1, 4, 2, 5, 1, 3][y - 49] || 0; ww = Math.max(3, w - bite); }
    const base = ((sway >= 1) ? PAL.gold0 : sway <= -1 ? PAL.amber1 : PAL.gold1);
    R(ctx, bx, y, ww, 1, base);
    P(ctx, bx, y, PAL.gold0);                                       // lit left edge
    if (ww > 6) P(ctx, bx + ww - 1, y, PAL.amber2);                 // shaded fly edge
  }
  // fold shading (vertical creases)
  for (let y = by + 2; y <= 47; y++) {
    P(ctx, bx + 5 + Math.round(Math.sin(y * 0.35) * 1.5), y, PAL.amber1);
    if (y > by + 8) P(ctx, bx + 10 + Math.round(Math.sin(y * 0.3 + 2) * 1.5), y, PAL.amber2);
  }
  // violet crystal emblem
  const ex = 15, ey = 28;
  P(ctx, ex, ey - 3, PAL.violet1);
  R(ctx, ex - 1, ey - 2, 3, 2, PAL.violet1);
  R(ctx, ex - 2, ey, 5, 2, PAL.violet2);
  R(ctx, ex - 1, ey + 2, 3, 2, PAL.violet2);
  P(ctx, ex, ey + 4, PAL.violet3);
  P(ctx, ex - 1, ey - 1, PAL.violet0); P(ctx, ex, ey, PAL.violet0);
  // banner rings on crossbar
  P(ctx, 10, 12, PAL.gold1); P(ctx, 16, 12, PAL.gold1); P(ctx, 22, 12, PAL.gold1);
  outline(ctx, 0, 0, W, H, PAL.outline);
  // emissive passes AFTER outline
  glow(ctx, 6, 5, 5, PAL.gold0);       // finial catching the sun
  glow(ctx, ex, ey, 4, PAL.violet1);   // crystal emblem
  return { canvas: c };
}

// ------------------------------------------------------------- bridge_arch

function bridgeArch() {
  const W = 76, H = 54;
  const c = makeCanvas(W, H);
  const ctx = c.getContext('2d');
  const r = rng(7303);

  const deckY = 8, cx = 38;
  // arch underside curve; span is BROKEN between breakL..breakR
  const underside = (x) => Math.min(H, deckY + 10 + Math.round(((x - cx) * (x - cx)) / 26));
  const breakL = 30, breakR = 47;
  for (let x = 2; x < 74; x++) {
    // jagged break boundary
    const jag = [0, 2, 1, 3, 0, 2][x % 6];
    if (x >= breakL + (x % 3) && x < breakR - jag % 2) continue;
    const bot = underside(x);
    const col = x < 14 ? ST[1] : x > 62 ? ST[2] : ST[1];
    R(ctx, x, deckY, 1, bot - deckY, col);
    // broken end shadow faces
    if (x >= breakL - 3 && x < breakL) R(ctx, x, deckY + 2, 1, underside(x) - deckY - 2, ST[3]);
    if (x >= breakR && x < breakR + 2) R(ctx, x, deckY, 1, underside(x) - deckY, ST[2]);
  }
  // piers (full height)
  R(ctx, 2, deckY, 16, H - deckY, ST[1]);
  R(ctx, 58, deckY, 16, H - deckY, ST[2]);
  R(ctx, 2, deckY, 1, H - deckY, ST[0]);            // lit left edges
  R(ctx, 58, deckY, 1, H - deckY, ST[1]);
  bricks(ctx, 2, deckY + 4, 16, H - deckY - 4, 7, 9, shade(ST[2], -0.15), r);
  bricks(ctx, 58, deckY + 4, 16, H - deckY - 4, 7, 9, shade(ST[3], -0.1), r);
  // deck top: light walking surface + verdigris rail stubs
  R(ctx, 2, deckY, 28, 2, ST[0]);
  R(ctx, 47, deckY, 27, 2, shade(ST[0], -0.08));
  for (const rx of [4, 12, 20, 62, 70]) {
    R(ctx, rx, deckY - 5, 2, 5, VG2); P(ctx, rx, deckY - 5, VG1);
    P(ctx, rx, deckY - 6, PAL.gold1);
  }
  R(ctx, 3, deckY - 3, 20, 1, VG2); R(ctx, 61, deckY - 3, 12, 1, VG2); // rail bars
  // arch voussoir stones along the underside curve
  for (let x = 4; x < 72; x += 3) {
    if (x > breakL - 2 && x < breakR + 2) continue;
    const uy = underside(x);
    if (uy < H) { P(ctx, x, uy - 1, ST[3]); P(ctx, x + 1, uy - 1, ST[3]); }
  }
  // jagged break silhouettes (bite triangles out of the broken ends)
  for (let j = 0; j < 6; j++) {
    const bx = breakL - 1 - (j % 3), by = deckY + j * 3;
    P(ctx, bx, by, ST[2]);
  }
  // hanging chain from the left break
  let chx = breakL - 4, chy = deckY + 12;
  for (let i = 0; i < 7; i++) {
    P(ctx, chx, chy + i * 2, VG1); P(ctx, chx + ((i & 1) ? 1 : 0), chy + i * 2 + 1, VG2);
  }
  P(ctx, chx, chy + 14, PAL.gold1);
  // falling / floating rubble in the gap
  const rub = [[33, 26, 3, 2], [39, 34, 4, 3], [36, 44, 2, 2], [43, 24, 2, 2]];
  for (const [x, y, w, h] of rub) {
    R(ctx, x, y, w, h, ST[2]); P(ctx, x, y, ST[0]);
  }
  // weathering
  crack(ctx, 9, 20, 12, r); crack(ctx, 66, 24, 14, r);
  moss(ctx, 2, H - 6, 10, 6, r, 0.4); moss(ctx, 60, H - 5, 12, 5, r, 0.35);
  moss(ctx, 20, deckY, 8, 2, r, 0.25);
  outline(ctx, 0, 0, W, H, PAL.outline);
  return { canvas: c };
}

// --------------------------------------------------------- guardian_statue

function guardianStatue() {
  const W = 32, H = 68;
  const c = makeCanvas(W, H);
  const ctx = c.getContext('2d');
  const r = rng(7404);

  // pedestal — two steps, gold trim line
  R(ctx, 2, 62, 28, 6, ST[2]); R(ctx, 2, 62, 28, 1, ST[0]); R(ctx, 2, 63, 1, 5, ST[1]);
  R(ctx, 5, 57, 22, 5, ST[1]); R(ctx, 5, 57, 22, 1, ST[0]); R(ctx, 29, 62, 1, 6, ST[3]);
  R(ctx, 6, 61, 20, 1, PAL.gold1); P(ctx, 6, 61, PAL.gold0);
  // legs (armored greaves)
  R(ctx, 11, 44, 4, 13, ST[1]); R(ctx, 17, 44, 4, 13, ST[2]);
  R(ctx, 11, 44, 1, 13, ST[0]);
  R(ctx, 10, 55, 6, 2, ST[1]); R(ctx, 16, 55, 6, 2, ST[2]);   // sabatons
  P(ctx, 12, 48, ST[3]); P(ctx, 18, 48, ST[3]);               // knee joints
  // torso (cuirass) with chest sigil
  R(ctx, 9, 30, 14, 14, ST[1]);
  R(ctx, 9, 30, 4, 14, ST[0]);                                 // lit left plate
  R(ctx, 19, 30, 4, 14, ST[2]);
  R(ctx, 9, 42, 14, 2, ST[2]);                                 // faulds shade
  R(ctx, 15, 33, 2, 5, PAL.gold1); P(ctx, 15, 33, PAL.gold0);  // gold sigil
  P(ctx, 14, 35, PAL.gold1); P(ctx, 17, 35, PAL.gold1);
  // pauldrons (broad shoulders — strong silhouette)
  R(ctx, 5, 28, 7, 5, ST[0]); R(ctx, 5, 31, 7, 2, ST[1]);
  R(ctx, 20, 28, 7, 5, ST[1]); R(ctx, 20, 31, 7, 2, ST[2]);
  P(ctx, 5, 28, shade(ST[0], 0.18)); P(ctx, 26, 32, ST[3]);
  // arms meet at sword grip
  R(ctx, 10, 33, 3, 8, ST[1]); R(ctx, 19, 33, 3, 8, ST[2]);
  R(ctx, 13, 39, 6, 3, ST[1]); R(ctx, 13, 39, 6, 1, ST[0]);    // gauntlets
  // helmet
  R(ctx, 11, 19, 10, 9, ST[1]);
  R(ctx, 11, 19, 3, 9, ST[0]);
  R(ctx, 18, 19, 3, 9, ST[2]);
  R(ctx, 12, 17, 8, 2, ST[0]);                                 // crown ridge
  R(ctx, 14, 13, 3, 5, PAL.gold1); P(ctx, 14, 13, PAL.gold0);  // gold crest plume
  P(ctx, 15, 11, PAL.gold1);
  // visor slit + glowing cyan eyes (emissive)
  R(ctx, 12, 23, 8, 2, PAL.deepPurple);
  P(ctx, 14, 23, PAL.cyan0); P(ctx, 18, 23, PAL.cyan0);
  P(ctx, 14, 24, PAL.cyan1); P(ctx, 18, 24, PAL.cyan1);
  // greatsword — point down, blade between the legs' front
  R(ctx, 15, 44, 2, 14, RAMPS.metal[1]);
  R(ctx, 15, 44, 1, 14, RAMPS.metal[0]);
  P(ctx, 15, 58, RAMPS.metal[1]); P(ctx, 16, 58, RAMPS.metal[2]);
  P(ctx, 15, 59, RAMPS.metal[2]);                              // tip
  R(ctx, 12, 42, 8, 2, PAL.gold1); R(ctx, 12, 42, 8, 1, PAL.gold0); // crossguard
  P(ctx, 15, 41, PAL.gold1); P(ctx, 16, 41, PAL.gold1);        // grip to gauntlets
  P(ctx, 15, 45, PAL.white);                                   // blade glint
  // weathering — cracks, chipped pauldron, moss
  crack(ctx, 21, 31, 8, r); crack(ctx, 12, 46, 7, r);
  P(ctx, 26, 28, PAL.outline);                                 // chipped shoulder notch
  moss(ctx, 5, 28, 4, 2, r, 0.5); moss(ctx, 3, 64, 8, 3, r, 0.5);
  moss(ctx, 22, 58, 5, 2, r, 0.4);
  outline(ctx, 0, 0, W, H, PAL.outline);
  glow(ctx, 16, 24, 4, PAL.cyan1);     // eye glow AFTER outline
  return { canvas: c };
}

// ------------------------------------------------------------ brazier_column

function brazierColumn() {
  const W = 26, H = 60;
  const c = makeCanvas(W, H);
  const ctx = c.getContext('2d');
  const r = rng(7505);

  // base — two steps
  R(ctx, 3, 55, 20, 5, ST[2]); R(ctx, 3, 55, 20, 1, ST[0]); R(ctx, 3, 56, 1, 4, ST[1]);
  R(ctx, 5, 51, 16, 4, ST[1]); R(ctx, 5, 51, 16, 1, ST[0]);
  // fluted shaft (vertical light bands: highlight left, core, shadow right)
  R(ctx, 8, 19, 10, 32, ST[1]);
  R(ctx, 8, 19, 2, 32, ST[0]);
  R(ctx, 12, 19, 1, 32, ST[2]);                                // flute groove
  R(ctx, 15, 19, 3, 32, ST[2]);
  R(ctx, 17, 19, 1, 32, ST[3]);
  // capital
  R(ctx, 6, 16, 14, 3, ST[1]); R(ctx, 6, 16, 14, 1, ST[0]); R(ctx, 19, 16, 1, 3, ST[3]);
  // verdigris fire-bowl
  ellipseFill(ctx, 12.5, 13, 8, 3, VG2);
  R(ctx, 5, 10, 16, 3, VG2);
  R(ctx, 5, 10, 16, 1, VG1);
  P(ctx, 5, 10, shade(VG1, 0.15)); P(ctx, 7, 11, VG1);
  P(ctx, 8, 13, PAL.gold1); P(ctx, 17, 13, PAL.gold1);         // gold rivets
  // living flame — layered ember->amber->gold->white
  ellipseFill(ctx, 12.5, 7, 6, 4, PAL.ember1);
  ellipseFill(ctx, 12.5, 6, 4, 3, PAL.amber1);
  ellipseFill(ctx, 12.5, 5, 3, 2, PAL.amber0);
  R(ctx, 11, 2, 3, 3, PAL.amber0);
  P(ctx, 12, 1, PAL.amber0); P(ctx, 10, 3, PAL.amber1); P(ctx, 14, 2, PAL.amber1);
  P(ctx, 12, 4, PAL.sun); P(ctx, 12, 5, PAL.white); P(ctx, 13, 5, PAL.sun);
  P(ctx, 15, 4, PAL.ember0); P(ctx, 9, 5, PAL.ember0);         // licking tongues
  // warm underlight on the capital from the fire
  P(ctx, 9, 16, PAL.amber1); P(ctx, 12, 16, PAL.amber0); P(ctx, 16, 16, PAL.amber1);
  // weathering
  crack(ctx, 10, 30, 9, r);
  moss(ctx, 3, 57, 7, 3, r, 0.5); moss(ctx, 16, 52, 5, 2, r, 0.4);
  outline(ctx, 0, 0, W, H, PAL.outline);
  // emissive passes AFTER outline: fire halo + drifting embers
  glow(ctx, 12, 5, 8, PAL.amber1);
  glow(ctx, 12, 4, 4, PAL.amber0);
  P(ctx, 6, 2, PAL.ember0); P(ctx, 19, 1, PAL.amber0); P(ctx, 21, 5, PAL.ember1);
  return { canvas: c };
}

// --------------------------------------------------------- floating_masonry

function floatingMasonry() {
  const W = 36, H = 34;
  const c = makeCanvas(W, H);
  const ctx = c.getContext('2d');
  const r = rng(7606);

  const block = (x, y, w, h, base) => {
    R(ctx, x, y, w, h, base);
    R(ctx, x, y, w, 1, ST[0]);                 // sunlit top
    R(ctx, x, y + 1, 1, h - 1, shade(base, 0.15));
    R(ctx, x + w - 1, y + 1, 1, h - 1, ST[3]);
    R(ctx, x + 1, y + h - 1, w - 1, 1, ST[3]);
    // carved groove
    if (w > 6) R(ctx, x + 2, y + (h >> 1), w - 4, 1, shade(base, -0.15));
    // cyan crystal shard clinging beneath — the anti-gravity source
    const sx = x + (w >> 1);
    P(ctx, sx, y + h, PAL.cyan1); P(ctx, sx - 1, y + h, PAL.cyan2);
    P(ctx, sx, y + h + 1, PAL.cyan0); P(ctx, sx + 1, y + h + 1, PAL.cyan2);
    P(ctx, sx, y + h + 2, PAL.cyan1);
  };
  const blocks = [[2, 3, 13, 8, ST[1]], [20, 8, 14, 9, ST[2]], [9, 20, 11, 7, ST[1]]];
  for (const [x, y, w, h, base] of blocks) block(x, y, w, h, base);
  // tiny drifting grit
  P(ctx, 17, 4, ST[2]); P(ctx, 30, 22, ST[2]); P(ctx, 4, 16, ST[1]);
  P(ctx, 25, 28, ST[2]); P(ctx, 33, 3, ST[1]);
  outline(ctx, 0, 0, W, H, PAL.outline);
  // emissive passes AFTER outline: shard halos + holo-glyph mote
  for (const [x, y, w, h] of blocks) glow(ctx, x + (w >> 1), y + h + 1, 4, PAL.cyan1);
  P(ctx, 6, 29, PAL.cyan1); glow(ctx, 6, 29, 2, PAL.cyan1);
  return { canvas: c };
}

// ------------------------------------------------------------------ export

export function build() {
  return {
    stamps: {
      tower_broken:     towerBroken(),
      banner_pole:      bannerPole(),
      bridge_arch:      bridgeArch(),
      guardian_statue:  guardianStatue(),
      brazier_column:   brazierColumn(),
      floating_masonry: floatingMasonry(),
    },
  };
}
