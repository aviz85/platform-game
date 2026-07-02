// AETHERFALL — NEON DEPTHS tileset (biome: depths)
// Dark teal cavern rock + riveted rust metal + humming magenta/cyan neon conduits.
//
// Atlas (16x16 tiles, 8 cols x 2 rows = 128x32):
//   '#'    rock fill — 4 variants (plain / bolted plate / cyan seam / rusted pipe stub)
//   '#top' surface — riveted metal plate with pulsing neon conduit strip, 3 phase variants
//   'X'    heavy hazard-striped metal block
//   '|'    riveted support strut (I-beam with cross brace)
//   '='    one-way metal grate platform (top 5px opaque)
//   '^'    energy vent spikes (magenta plasma, clearly dangerous)
// decor (non-solid):
//   'g' cable clumps on the floor   'c' neon crystal shard   'v' hanging cable from ceiling
//   'l' amber warning light         'r' wall vent grill
import { PAL } from './palette.js';
import { makeCanvas, P, R, line, dither, outline, glow, shade, rng } from './util.js';

const TS = 16;
const COLS = 8;
const t = (i) => ({ x: (i % COLS) * TS, y: ((i / COLS) | 0) * TS });

// dark teal rock ramp derived from cyan3 (light upper-left)
const ROCK0 = shade(PAL.cyan3, 0.16);   // rare glint
const ROCK1 = shade(PAL.cyan3, -0.16);  // lit speck
const ROCK2 = shade(PAL.cyan3, -0.42);  // body
const ROCK3 = shade(PAL.cyan3, -0.62);  // shadow / cracks
const SLOT = shade(PAL.metal3, -0.4);   // deep slots / grate gaps
const STRIPE_DARK = shade(PAL.metal3, -0.25); // hazard dark stripe

// draw inside a clip so glows never bleed into neighboring atlas tiles
function clipped(ctx, ox, oy, fn) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(ox, oy, TS, TS);
  ctx.clip();
  fn();
  ctx.restore();
}

// ---------- rock body (seamless: x-wrapped noise, no edge bias) ----------
function rockFill(ctx, ox, oy, seed, fromY = 0) {
  const rnd = rng(seed);
  R(ctx, ox, oy + fromY, TS, TS - fromY, ROCK2);
  // darker strata blotches, dithered, wrapped in x so side seams vanish
  for (let n = 0; n < 6; n++) {
    const bx = (rnd() * TS) | 0;
    const by = fromY + ((rnd() * (TS - fromY)) | 0);
    const bw = 3 + ((rnd() * 5) | 0), bh = 1 + ((rnd() * 3) | 0);
    for (let j = 0; j < bh; j++) {
      for (let i = 0; i < bw; i++) {
        const py = by + j;
        if (py > 15) continue;
        if (((i + j) & 1) === 0) P(ctx, ox + ((bx + i) % TS), oy + py, ROCK3);
      }
    }
  }
  // lit specks with a shadow pixel tucked under (light from upper-left)
  for (let n = 0; n < 7; n++) {
    const sx = (rnd() * TS) | 0, sy = fromY + ((rnd() * (TS - fromY)) | 0);
    if (sy > 15) continue;
    P(ctx, ox + sx, oy + sy, ROCK1);
    if (rnd() < 0.35 && sx < 15 && sy < 15) P(ctx, ox + sx + 1, oy + sy + 1, ROCK3);
  }
  // jagged hairline cracks
  for (let n = 0; n < 2; n++) {
    let cx = 2 + ((rnd() * 11) | 0), cy = fromY + 1 + ((rnd() * Math.max(1, 13 - fromY)) | 0);
    for (let s = 0; s < 3; s++) {
      const nx = Math.min(15, Math.max(0, cx + ((rnd() * 5) | 0) - 2));
      const ny = Math.min(15, cy + 1 + ((rnd() * 2) | 0));
      line(ctx, ox + cx, oy + cy, ox + nx, oy + ny, ROCK3);
      cx = nx; cy = ny;
    }
  }
  // one faint teal glint
  const gx = 3 + ((rnd() * 10) | 0), gy = Math.min(15, fromY + 2 + ((rnd() * 8) | 0));
  P(ctx, ox + gx, oy + gy, ROCK0);
}

const rivet = (ctx, x, y) => { P(ctx, x, y, PAL.metal0); P(ctx, x, y + 1, PAL.metal3); };

// ---------- '#' variants ----------
function tileRock(ctx, ox, oy, seed, extra) {
  rockFill(ctx, ox, oy, seed);
  if (extra === 'plate') {
    // small bolted rust plate half-buried in the rock
    R(ctx, ox + 9, oy + 10, 6, 4, PAL.rust1);
    R(ctx, ox + 9, oy + 10, 6, 1, PAL.rust0);
    R(ctx, ox + 9, oy + 13, 6, 1, PAL.rust2);
    P(ctx, ox + 10, oy + 11, PAL.metal0); P(ctx, ox + 13, oy + 12, PAL.metal3);
    line(ctx, ox + 8, oy + 10, ox + 8, oy + 13, ROCK3); // seat shadow
  } else if (extra === 'seam') {
    // hairline energized seam in the rock — faint cyan vein
    line(ctx, ox + 2, oy + 3, ox + 6, oy + 8, PAL.cyan3);
    line(ctx, ox + 6, oy + 8, ox + 11, oy + 12, PAL.cyan3);
    P(ctx, ox + 6, oy + 8, PAL.cyan2);
    P(ctx, ox + 9, oy + 10, PAL.cyan2);
    glow(ctx, ox + 6, oy + 8, 2, PAL.cyan2);
  } else if (extra === 'pipe') {
    // rusted pipe stub embedded in the wall, with a status lamp
    R(ctx, ox + 2, oy + 6, 2, 6, PAL.metal2);              // left flange
    R(ctx, ox + 2, oy + 6, 2, 1, PAL.metal1);
    R(ctx, ox + 12, oy + 6, 2, 6, PAL.metal2);             // right flange
    R(ctx, ox + 12, oy + 11, 2, 1, PAL.metal3);
    R(ctx, ox + 4, oy + 7, 8, 4, PAL.rust1);               // pipe body
    R(ctx, ox + 4, oy + 7, 8, 1, PAL.rust0);               // top lit
    R(ctx, ox + 4, oy + 10, 8, 1, PAL.rust2);              // bottom shade
    rivet(ctx, ox + 2, oy + 7); rivet(ctx, ox + 13, oy + 9);
    P(ctx, ox + 8, oy + 8, PAL.cyan1);                     // status lamp
    P(ctx, ox + 8, oy + 8, PAL.cyan1); P(ctx, ox + 9, oy + 8, PAL.cyan0);
    glow(ctx, ox + 8, oy + 8, 2, PAL.cyan1);
    // rust drip under the pipe
    R(ctx, ox + 6, oy + 11, 1, 3, PAL.rust2);
  }
}

// ---------- '#top' — riveted plate + neon conduit strip ----------
function tileTop(ctx, ox, oy, phase, seed) {
  // metal deck plate (light from top)
  R(ctx, ox, oy, TS, 1, PAL.metal0);        // lit walk edge
  R(ctx, ox, oy + 1, TS, 2, PAL.metal1);    // plate face
  rivet(ctx, ox + 2, oy + 1);
  rivet(ctx, ox + 13, oy + 1);
  // conduit groove
  R(ctx, ox, oy + 3, TS, 1, PAL.metal3);    // groove shadow
  // pulsing neon strip — phase shifts across variants so runs look like flow
  for (let x = 0; x < TS; x++) {
    const k = (x + phase * 5) % 10;
    let c;
    if (k < 4) c = PAL.cyan1;
    else if (k < 5) c = PAL.cyan0;
    else if (k < 9) c = PAL.magenta1;
    else c = PAL.magenta0;
    P(ctx, ox + x, oy + 4, c);
  }
  const hotA = (2 + phase * 5) % TS, hotB = (10 + phase * 5) % TS;
  P(ctx, ox + hotA, oy + 4, PAL.white);
  P(ctx, ox + hotB, oy + 4, PAL.white);
  R(ctx, ox, oy + 5, TS, 1, PAL.metal2);    // lower lip
  dither(ctx, ox, oy + 6, TS, 1, PAL.metal3, ROCK2); // plate-to-rock transition
  // rock body underneath
  rockFill(ctx, ox, oy, seed, 7);
  // weathering: rust drips bleeding off the plate
  const rnd = rng(seed + 900);
  for (let n = 0; n < 2; n++) {
    const dx = 1 + ((rnd() * 14) | 0);
    R(ctx, ox + dx, oy + 6, 1, 2 + ((rnd() * 2) | 0), PAL.rust2);
  }
  // neon halo (clip keeps it inside this tile)
  glow(ctx, ox + hotA, oy + 4, 3, PAL.cyan1);
  glow(ctx, ox + hotB, oy + 4, 3, PAL.magenta1);
}

// ---------- 'X' — heavy hazard-striped block ----------
function tileHazardBlock(ctx, ox, oy) {
  R(ctx, ox, oy, TS, TS, PAL.metal2);
  // bevel: lit top/left, shaded bottom/right
  R(ctx, ox, oy, TS, 1, PAL.metal0);
  R(ctx, ox, oy, 1, TS, PAL.metal1);
  R(ctx, ox, oy + 15, TS, 1, PAL.metal3);
  R(ctx, ox + 15, oy, 1, TS, PAL.metal3);
  // recessed hazard band
  R(ctx, ox + 1, oy + 4, 14, 1, PAL.metal3);
  for (let y = 5; y <= 10; y++) {
    for (let x = 1; x <= 14; x++) {
      const s = (((x - y) % 8) + 8) % 8;
      P(ctx, ox + x, oy + y, s < 4 ? PAL.amber1 : STRIPE_DARK);
    }
  }
  // lit top edge of the amber stripes
  for (let x = 1; x <= 14; x++) {
    const s = (((x - 5) % 8) + 8) % 8;
    if (s === 1 || s === 2) P(ctx, ox + x, oy + 5, PAL.amber0);
  }
  R(ctx, ox + 1, oy + 11, 14, 1, PAL.metal3);
  // corner rivets
  rivet(ctx, ox + 2, oy + 1); rivet(ctx, ox + 13, oy + 1);
  rivet(ctx, ox + 2, oy + 12); rivet(ctx, ox + 13, oy + 12);
  // wear: rust bloom + scratch
  P(ctx, ox + 12, oy + 7, PAL.rust1); P(ctx, ox + 4, oy + 9, PAL.rust2);
  P(ctx, ox + 5, oy + 13, PAL.rust1); P(ctx, ox + 6, oy + 13, PAL.rust2);
  line(ctx, ox + 8, oy + 13, ox + 11, oy + 13, PAL.metal1);
}

// ---------- '|' — riveted support strut ----------
function tileStrut(ctx, ox, oy) {
  // I-beam runs full tile height so stacks seam perfectly
  R(ctx, ox + 4, oy, 1, TS, PAL.metal0);   // lit left edge
  R(ctx, ox + 5, oy, 1, TS, PAL.metal1);
  R(ctx, ox + 6, oy, 4, TS, PAL.metal2);   // web
  R(ctx, ox + 10, oy, 1, TS, PAL.metal1);
  R(ctx, ox + 11, oy, 1, TS, PAL.metal3);  // shaded right edge
  // cross brace
  line(ctx, ox + 5, oy + 2, ox + 10, oy + 13, PAL.metal1);
  line(ctx, ox + 10, oy + 2, ox + 5, oy + 13, PAL.metal3);
  // seam bands top/bottom with bolts
  R(ctx, ox + 4, oy, 8, 1, PAL.metal0);
  R(ctx, ox + 4, oy + 15, 8, 1, PAL.metal3);
  rivet(ctx, ox + 5, oy + 1); rivet(ctx, ox + 10, oy + 1);
  P(ctx, ox + 5, oy + 14, PAL.metal1); P(ctx, ox + 10, oy + 14, PAL.metal1);
  // rust streaks
  R(ctx, ox + 7, oy + 4, 1, 3, PAL.rust2);
  R(ctx, ox + 9, oy + 10, 1, 3, PAL.rust2);
  P(ctx, ox + 7, oy + 4, PAL.rust1);
  outline(ctx, ox, oy, TS, TS);
  // small magenta service lamp at the brace crossing
  P(ctx, ox + 7, oy + 7, PAL.magenta1);
  P(ctx, ox + 8, oy + 7, PAL.magenta0);
  glow(ctx, ox + 8, oy + 7, 2, PAL.magenta1);
}

// ---------- '=' — one-way metal grate platform ----------
function tileGrate(ctx, ox, oy) {
  R(ctx, ox, oy, TS, 1, PAL.metal0);       // lit walk edge
  for (let x = 0; x < TS; x++) {
    const slat = (x % 4) !== 3;
    for (let y = 1; y <= 3; y++) {
      P(ctx, ox + x, oy + y, slat ? (y === 1 ? PAL.metal1 : PAL.metal2) : SLOT);
    }
  }
  R(ctx, ox, oy + 4, TS, 1, PAL.metal3);   // underside shadow
  // cyan safety markers on the edge + rust wear
  P(ctx, ox + 2, oy, PAL.cyan1); P(ctx, ox + 10, oy, PAL.cyan1);
  P(ctx, ox + 5, oy, PAL.rust1); P(ctx, ox + 13, oy, PAL.rust0);
  P(ctx, ox + 6, oy + 2, PAL.rust2); P(ctx, ox + 12, oy + 3, PAL.rust2);
  // hanger brackets below (sparse, keeps tile one-way readable)
  R(ctx, ox + 2, oy + 5, 1, 2, PAL.metal3);
  R(ctx, ox + 13, oy + 5, 1, 2, PAL.metal3);
  P(ctx, ox + 2, oy + 7, PAL.rust2);
  P(ctx, ox + 13, oy + 7, PAL.rust2);
}

// ---------- '^' — magenta energy vent spikes ----------
function energySpike(ctx, ox, oy, cx, tipY, baseY, halfW) {
  const h = baseY - tipY;
  for (let y = tipY; y <= baseY; y++) {
    const p = (y - tipY) / h;
    const w = Math.min(halfW, Math.round(p * (halfW + 0.6)));
    for (let x = cx - w; x <= cx + w; x++) {
      if (x < 0 || x > 15) continue;
      let c = PAL.magenta2;
      if (x === cx - w) c = PAL.magenta1;        // lit left edge
      else if (x === cx) c = PAL.magenta1;       // hot core
      P(ctx, ox + x, oy + y, c);
    }
  }
  P(ctx, ox + cx, oy + tipY, PAL.white);         // white-hot tip
  P(ctx, ox + cx, oy + tipY + 1, PAL.magenta0);
}
function tileVentSpikes(ctx, ox, oy) {
  // vent base
  R(ctx, ox, oy + 13, TS, 1, PAL.metal1);
  R(ctx, ox, oy + 14, TS, 1, PAL.metal2);
  R(ctx, ox, oy + 15, TS, 1, PAL.metal3);
  for (let x = 1; x < TS; x += 3) P(ctx, ox + x, oy + 13, PAL.metal3); // intake slots
  P(ctx, ox + 0, oy + 13, PAL.metal0); P(ctx, ox + 7, oy + 13, PAL.metal0);
  P(ctx, ox + 4, oy + 14, PAL.rust2); P(ctx, ox + 11, oy + 14, PAL.rust1);
  // plasma spikes
  energySpike(ctx, ox, oy, 3, 6, 13, 2);
  energySpike(ctx, ox, oy, 8, 2, 13, 2);
  energySpike(ctx, ox, oy, 13, 7, 13, 2);
  outline(ctx, ox, oy, TS, TS);
  // emissive glow after outline
  glow(ctx, ox + 8, oy + 2, 3, PAL.magenta1);
  glow(ctx, ox + 3, oy + 6, 2, PAL.magenta1);
  glow(ctx, ox + 13, oy + 7, 2, PAL.magenta1);
}

// ---------- decor ----------
function decorCables(ctx, ox, oy) { // 'g' — cable clumps on the floor
  // dead cable (dark metal), draped
  line(ctx, ox + 0, oy + 14, ox + 3, oy + 12, PAL.metal3);
  line(ctx, ox + 3, oy + 12, ox + 7, oy + 13, PAL.metal3);
  line(ctx, ox + 7, oy + 13, ox + 11, oy + 11, PAL.metal3);
  line(ctx, ox + 11, oy + 11, ox + 15, oy + 14, PAL.metal3);
  P(ctx, ox + 3, oy + 12, PAL.metal1); P(ctx, ox + 11, oy + 11, PAL.metal1); // top-lit crests
  // rusted cable underneath
  line(ctx, ox + 2, oy + 15, ox + 6, oy + 13, PAL.rust2);
  line(ctx, ox + 6, oy + 13, ox + 10, oy + 15, PAL.rust2);
  P(ctx, ox + 6, oy + 13, PAL.rust1);
  // powered cyan-jacketed cable
  line(ctx, ox + 1, oy + 13, ox + 4, oy + 11, PAL.cyan3);
  line(ctx, ox + 4, oy + 11, ox + 6, oy + 12, PAL.cyan3);
  P(ctx, ox + 4, oy + 11, PAL.cyan1);
  // loose coil
  P(ctx, ox + 12, oy + 12, PAL.rust0);
  P(ctx, ox + 11, oy + 13, PAL.rust1); P(ctx, ox + 13, oy + 13, PAL.rust1);
  P(ctx, ox + 12, oy + 14, PAL.rust2);
  // amber connector plug
  P(ctx, ox + 8, oy + 14, PAL.amber1); P(ctx, ox + 8, oy + 13, PAL.amber0);
  outline(ctx, ox, oy, TS, TS);
  glow(ctx, ox + 4, oy + 11, 2, PAL.cyan1);
}

function decorShard(ctx, ox, oy) { // 'c' — neon crystal shard cluster
  // main magenta shard leaning left, base at the floor
  for (let y = 5; y <= 15; y++) {
    const p = (y - 5) / 10;
    const cx = Math.round(6 + p * 2);
    const w = Math.round(p * 2.5);
    for (let x = cx - w; x <= cx + w; x++) {
      let c = PAL.magenta1;
      if (x === cx - w) c = PAL.magenta0;                 // lit left facet
      else if (w > 0 && x >= cx + w - 1) c = PAL.magenta2; // shaded right facet
      P(ctx, ox + x, oy + y, c);
    }
  }
  P(ctx, ox + 6, oy + 5, PAL.white);                      // hot tip
  line(ctx, ox + 7, oy + 8, ox + 8, oy + 13, PAL.magenta2); // inner facet line
  // small cyan side shard
  for (let y = 9; y <= 15; y++) {
    const p = (y - 9) / 6;
    const cx = Math.round(11 + p);
    const w = Math.round(p * 1.5);
    for (let x = cx - w; x <= cx + w; x++) {
      let c = PAL.cyan1;
      if (x === cx - w) c = PAL.cyan0;
      else if (w > 0 && x === cx + w) c = PAL.cyan2;
      P(ctx, ox + x, oy + y, c);
    }
  }
  P(ctx, ox + 11, oy + 9, PAL.white);
  // rubble at the base
  P(ctx, ox + 3, oy + 15, ROCK1); P(ctx, ox + 4, oy + 14, ROCK3);
  P(ctx, ox + 14, oy + 15, ROCK1); P(ctx, ox + 2, oy + 15, ROCK3);
  outline(ctx, ox, oy, TS, TS);
  glow(ctx, ox + 6, oy + 5, 3, PAL.magenta1);
  glow(ctx, ox + 11, oy + 9, 2, PAL.cyan1);
}

function decorHangingCable(ctx, ox, oy) { // 'v' — cable dangling from the ceiling
  // main cable with a powered indicator plug
  line(ctx, ox + 4, oy + 0, ox + 4, oy + 3, PAL.metal3);
  line(ctx, ox + 4, oy + 3, ox + 5, oy + 6, PAL.metal3);
  line(ctx, ox + 5, oy + 6, ox + 7, oy + 9, PAL.metal3);
  line(ctx, ox + 7, oy + 9, ox + 8, oy + 10, PAL.metal3);
  P(ctx, ox + 4, oy + 1, PAL.metal1); P(ctx, ox + 5, oy + 6, PAL.metal1); // lit side
  R(ctx, ox + 7, oy + 11, 3, 2, PAL.metal2);   // connector housing
  R(ctx, ox + 7, oy + 11, 3, 1, PAL.metal1);
  P(ctx, ox + 8, oy + 13, PAL.cyan0);          // live indicator
  // second frayed cable, sparking
  line(ctx, ox + 11, oy + 0, ox + 12, oy + 3, PAL.rust2);
  line(ctx, ox + 12, oy + 3, ox + 12, oy + 6, PAL.rust2);
  line(ctx, ox + 12, oy + 6, ox + 13, oy + 7, PAL.rust2);
  P(ctx, ox + 11, oy + 1, PAL.rust1);
  P(ctx, ox + 13, oy + 8, PAL.gold0);          // spark
  outline(ctx, ox, oy, TS, TS);
  glow(ctx, ox + 8, oy + 13, 2, PAL.cyan1);
  glow(ctx, ox + 13, oy + 8, 2, PAL.amber0);
}

function decorWarningLight(ctx, ox, oy) { // 'l' — ceiling-mounted amber warning light
  R(ctx, ox + 4, oy + 0, 8, 1, PAL.metal0);    // mount plate
  R(ctx, ox + 4, oy + 1, 8, 1, PAL.metal2);
  P(ctx, ox + 5, oy + 1, PAL.metal3); P(ctx, ox + 10, oy + 1, PAL.metal3);
  R(ctx, ox + 7, oy + 2, 2, 1, PAL.metal2);    // stem
  R(ctx, ox + 5, oy + 3, 6, 5, PAL.metal2);    // housing
  P(ctx, ox + 5, oy + 3, PAL.metal1);          // lit corner
  R(ctx, ox + 6, oy + 4, 4, 3, PAL.ember1);    // lamp
  R(ctx, ox + 7, oy + 4, 2, 2, PAL.amber0);    // hot center
  P(ctx, ox + 7, oy + 4, PAL.white);
  R(ctx, ox + 5, oy + 8, 6, 1, PAL.metal3);    // lower lip
  outline(ctx, ox, oy, TS, TS);
  glow(ctx, ox + 8, oy + 5, 4, PAL.amber1);
  // faint light cone falling downward
  ctx.save();
  ctx.globalAlpha = 0.16;
  for (let j = 0; j < 6; j++) R(ctx, ox + 6 - (j >> 1), oy + 9 + j, 4 + j, 1, PAL.amber0);
  ctx.restore();
}

function decorVentGrill(ctx, ox, oy) { // 'r' — wall vent grill
  R(ctx, ox + 2, oy + 3, 12, 1, PAL.metal0);   // lit top frame
  R(ctx, ox + 2, oy + 4, 1, 8, PAL.metal1);    // left frame
  R(ctx, ox + 13, oy + 4, 1, 8, PAL.metal2);   // right frame
  R(ctx, ox + 2, oy + 12, 12, 1, PAL.metal3);  // bottom frame
  R(ctx, ox + 3, oy + 4, 10, 8, SLOT);         // dark recess
  for (let y = 5; y <= 11; y += 2) {           // slats
    R(ctx, ox + 3, oy + y, 10, 1, PAL.metal2);
    P(ctx, ox + 3, oy + y, PAL.metal1);
    P(ctx, ox + 12, oy + y, PAL.metal3);
  }
  // corner bolts, rust-bled
  P(ctx, ox + 3, oy + 4, PAL.rust1); P(ctx, ox + 12, oy + 4, PAL.rust1);
  P(ctx, ox + 3, oy + 11, PAL.rust2); P(ctx, ox + 12, oy + 11, PAL.rust2);
  R(ctx, ox + 12, oy + 13, 1, 2, PAL.rust2);   // drip below
  outline(ctx, ox, oy, TS, TS);
  // wisp of escaping steam
  ctx.save();
  ctx.globalAlpha = 0.3;
  P(ctx, ox + 5, oy + 2, PAL.white); P(ctx, ox + 4, oy + 1, PAL.white);
  P(ctx, ox + 6, oy + 1, PAL.metal0); P(ctx, ox + 3, oy + 0, PAL.metal0);
  ctx.restore();
}

// ---------- build ----------
export function build() {
  const c = makeCanvas(COLS * TS, 2 * TS);
  const ctx = c.getContext('2d');
  const draw = (i, fn) => { const { x, y } = t(i); clipped(ctx, x, y, () => fn(ctx, x, y)); };

  draw(0, (x2, ox, oy) => tileRock(x2, ox, oy, 11, null));
  draw(1, (x2, ox, oy) => tileRock(x2, ox, oy, 227, 'plate'));
  draw(2, (x2, ox, oy) => tileRock(x2, ox, oy, 313, 'seam'));
  draw(15, (x2, ox, oy) => tileRock(x2, ox, oy, 77, 'pipe'));

  draw(3, (x2, ox, oy) => tileTop(x2, ox, oy, 0, 401));
  draw(4, (x2, ox, oy) => tileTop(x2, ox, oy, 1, 502));
  draw(5, (x2, ox, oy) => tileTop(x2, ox, oy, 2, 603));

  draw(6, tileHazardBlock);
  draw(7, tileStrut);
  draw(8, tileGrate);
  draw(9, tileVentSpikes);

  draw(10, decorCables);
  draw(11, decorShard);
  draw(12, decorHangingCable);
  draw(13, decorWarningLight);
  draw(14, decorVentGrill);

  return {
    image: c,
    tileSize: TS,
    tiles: {
      '#': [t(0), t(1), t(2), t(15)],
      '#top': [t(3), t(4), t(5)],
      'X': t(6),
      '|': t(7),
      '=': t(8),
      '^': t(9),
      'g': t(10),
      'c': t(11),
      'v': t(12),
      'l': t(13),
      'r': t(14),
    },
  };
}
