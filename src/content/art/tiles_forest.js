// AETHERFALL — LUMEN WOODS tileset (forest biome)
// Violet-stone floating-island earth, bioluminescent teal grass surface with tiny
// flowers, crystal-vein solid variants, carved heavy block, ancient pillar, floating
// leaf-stone one-way platform, cyan crystal spikes. Decor: g glowgrass, c crystal,
// v hanging vine, l amber lantern, r glowing rune.
//
// Sheet layout (16x16 tiles, 8 cols x 2 rows = 128x32):
//   row 0: #top v0 | #top v1 | #top v2 | # v0 | # v1 | # vein0 | # vein1 | X
//   row 1: |  | = | ^ | g | c | v | l | r

import { PAL, RAMPS } from './palette.js';
import { makeCanvas, P, R, line, dither, outline, glow, shade, rng } from './util.js';

const T = 16;

// ---------------------------------------------------------------------------
// violet stone body — bricks wrap on an 8px period so every edge seams.
// interior tile: NO directional edge light (neighbours unknown), only per-brick
// bevel which tiles cleanly.
function stoneBase(ctx, x, y, seed) {
  const r = rng(seed);
  const mortar = shade(PAL.stone3, -0.22);
  const hi = shade(PAL.stone1, 0.06);
  R(ctx, x, y, T, T, PAL.stone2);
  // horizontal mortar (period 8 -> wraps vertically)
  R(ctx, x, y + 3, T, 1, mortar);
  R(ctx, x, y + 11, T, 1, mortar);
  // vertical joints, staggered per course (period 8 -> wraps horizontally)
  R(ctx, x + 5, y + 4, 1, 7, mortar);
  R(ctx, x + 13, y + 4, 1, 7, mortar);
  R(ctx, x + 1, y + 12, 1, 4, mortar);   // wrap course: bottom half...
  R(ctx, x + 9, y + 12, 1, 4, mortar);
  R(ctx, x + 1, y, 1, 3, mortar);        // ...meets top half of tile below
  R(ctx, x + 9, y, 1, 3, mortar);
  // per-brick bevel: light catches top-left of each brick (upper-left light)
  R(ctx, x, y + 4, 5, 1, hi);  R(ctx, x + 6, y + 4, 7, 1, hi);
  R(ctx, x + 2, y + 12, 7, 1, hi); R(ctx, x + 10, y + 12, 6, 1, hi);
  R(ctx, x + 2, y, 7, 1, hi);  R(ctx, x + 10, y, 6, 1, hi);
  P(ctx, x, y + 5, hi); P(ctx, x + 6, y + 5, hi);
  P(ctx, x + 2, y + 13, hi); P(ctx, x + 10, y + 13, hi);
  // brick under-shadow (bottom of each brick, just above mortar)
  R(ctx, x, y + 2, T, 1, PAL.stone3);
  R(ctx, x, y + 10, T, 1, PAL.stone3);
  // weathering speckles + hairline cracks
  for (let i = 0; i < 9; i++) {
    const sx = x + ((r() * T) | 0), sy = y + ((r() * T) | 0);
    P(ctx, sx, sy, r() < 0.5 ? PAL.stone3 : PAL.stone1);
  }
  for (let i = 0; i < 2; i++) {
    const cx = x + 2 + ((r() * 11) | 0), cy = y + 4 + ((r() * 8) | 0);
    P(ctx, cx, cy, PAL.deepPurple);
    P(ctx, cx + 1, cy + 1, PAL.deepPurple);
    if (r() < 0.6) P(ctx, cx + 1, cy + 2, PAL.shadow);
  }
  // faint violet mineral flecks (lumen-woods flavour)
  for (let i = 0; i < 3; i++) {
    P(ctx, x + 1 + ((r() * 14) | 0), y + 1 + ((r() * 14) | 0), PAL.violet3);
  }
}

// glowing crystal vein snaking through the stone (interior detail — seam-safe)
function crystalVein(ctx, x, y, seed) {
  const r = rng(seed);
  // zig-zag path from lower-left to upper-right
  let px = x + 2 + ((r() * 2) | 0), py = y + 13;
  const pts = [[px, py]];
  while (py > y + 2 && px < x + 14) {
    px += 1 + ((r() * 2) | 0);
    py -= 1 + ((r() * 2) | 0);
    pts.push([Math.min(px, x + 13), Math.max(py, y + 2)]);
  }
  for (let i = 0; i < pts.length - 1; i++) {
    line(ctx, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], PAL.cyan3);
  }
  // bright core beads along the vein
  for (let i = 0; i < pts.length; i++) {
    P(ctx, pts[i][0], pts[i][1], i % 2 ? PAL.cyan2 : PAL.cyan1);
  }
  const [mx, my] = pts[(pts.length / 2) | 0];
  glow(ctx, mx, my, 2, PAL.cyan1);
  P(ctx, mx, my, PAL.cyan0);                    // hot node
  P(ctx, pts[pts.length - 1][0], pts[pts.length - 1][1], PAL.cyan0);
  // tiny facet sparkle offshoot
  P(ctx, mx + 1, my - 1, PAL.cyan1);
}

// lush glowing teal grass/moss cap on top of stone (air above)
function grassCap(ctx, x, y, seed) {
  const r = rng(seed);
  // soil transition
  dither(ctx, x, y + 5, T, 1, PAL.leaf3, PAL.moss2);
  R(ctx, x, y + 4, T, 1, PAL.leaf3);
  // per-column turf with slightly ragged top edge
  for (let i = 0; i < T; i++) {
    const top = y + (r() < 0.35 ? 0 : 1);
    for (let yy = top; yy <= y + 3; yy++) {
      const d = yy - top;
      P(ctx, x + i, yy, d === 0 ? PAL.leaf0 : d === 1 ? PAL.leaf1 : (i + yy) & 1 ? PAL.leaf1 : PAL.leaf2);
    }
  }
  // teal glow: some blade tips read as bioluminescent
  for (let i = 0; i < 4; i++) {
    const bx = x + ((r() * T) | 0);
    P(ctx, bx, y, r() < 0.5 ? PAL.cyan1 : PAL.cyan0);
  }
  // tall blades poking up past the turf line
  for (let i = 0; i < 3; i++) {
    const bx = x + 1 + ((r() * 14) | 0);
    P(ctx, bx, y, PAL.leaf0);
    P(ctx, bx, y + 1, PAL.leaf1);
  }
  // moss dripping over the stone edge
  for (let i = 0; i < 2; i++) {
    const mx = x + 1 + ((r() * 14) | 0);
    P(ctx, mx, y + 6, PAL.moss2);
    if (r() < 0.5) P(ctx, mx, y + 7, shade(PAL.moss2, -0.15));
  }
  // glow-moss spot (soft halo + hot pixel)
  const gx = x + 2 + ((r() * 12) | 0);
  glow(ctx, gx, y + 2, 2, PAL.cyan1);
  P(ctx, gx, y + 2, PAL.cyan0);
  // tiny flowers: petal cross + warm/pink center
  for (let i = 0; i < 2; i++) {
    const fx = x + 2 + ((r() * 12) | 0), fy = y + 1;
    const petal = r() < 0.5 ? PAL.pink0 : PAL.magenta0;
    P(ctx, fx - 1, fy, petal); P(ctx, fx + 1, fy, petal);
    P(ctx, fx, fy - 1, petal); P(ctx, fx, fy + 1, PAL.leaf2);
    P(ctx, fx, fy, PAL.gold0);
  }
}

function tileTop(ctx, tx, ty, seed) {
  const x = tx * T, y = ty * T;
  stoneBase(ctx, x, y, seed);
  grassCap(ctx, x, y, seed + 71);
}

// heavy carved block — framed, studded, with a recessed glowing sigil
function tileX(ctx, tx, ty) {
  const x = tx * T, y = ty * T;
  R(ctx, x, y, T, T, PAL.stone2);
  // dark perimeter so blocks read as distinct masonry when tiled
  R(ctx, x, y, T, 1, PAL.outline); R(ctx, x, y + 15, T, 1, PAL.outline);
  R(ctx, x, y, 1, T, PAL.outline); R(ctx, x + 15, y, 1, T, PAL.outline);
  // bevel: light upper-left, shadow lower-right
  R(ctx, x + 1, y + 1, 14, 1, PAL.stone0); R(ctx, x + 1, y + 1, 1, 14, PAL.stone0);
  R(ctx, x + 1, y + 14, 14, 1, PAL.stone3); R(ctx, x + 14, y + 1, 1, 14, PAL.stone3);
  R(ctx, x + 2, y + 2, 12, 1, PAL.stone1); R(ctx, x + 2, y + 2, 1, 12, PAL.stone1);
  // corner studs
  for (const [sx, sy] of [[3, 3], [12, 3], [3, 12], [12, 12]]) {
    P(ctx, x + sx, y + sy, PAL.stone0);
    P(ctx, x + sx + 1, y + sy + 1, PAL.stone3);
  }
  // recessed carved panel
  R(ctx, x + 5, y + 5, 6, 6, PAL.shadow);
  R(ctx, x + 5, y + 5, 6, 1, PAL.deepPurple);   // recess top shadow (light from above)
  R(ctx, x + 5, y + 5, 1, 6, PAL.deepPurple);
  R(ctx, x + 5, y + 10, 6, 1, PAL.stone1);      // recess bottom catches light
  // carved diamond sigil, faintly alive
  P(ctx, x + 7, y + 6, PAL.violet1); P(ctx, x + 8, y + 6, PAL.violet1);
  P(ctx, x + 6, y + 7, PAL.violet1); P(ctx, x + 9, y + 7, PAL.violet1);
  P(ctx, x + 6, y + 8, PAL.violet2); P(ctx, x + 9, y + 8, PAL.violet2);
  P(ctx, x + 7, y + 9, PAL.violet2); P(ctx, x + 8, y + 9, PAL.violet2);
  glow(ctx, x + 8, y + 8, 2, PAL.violet1);
  P(ctx, x + 7, y + 7, PAL.cyan0); P(ctx, x + 8, y + 7, PAL.cyan1);
  // weathering nicks
  P(ctx, x + 12, y + 8, PAL.stone3); P(ctx, x + 4, y + 13, PAL.stone3);
}

// ancient fluted pillar drum — stacks vertically into a column
function tilePillar(ctx, tx, ty) {
  const x = tx * T, y = ty * T;
  // silhouette edges (transparent air either side)
  R(ctx, x + 1, y, 1, T, PAL.outline);
  R(ctx, x + 14, y, 1, T, PAL.outline);
  // shaft, lit from the left
  R(ctx, x + 2, y, 1, T, PAL.stone0);
  R(ctx, x + 3, y, 2, T, PAL.stone1);
  R(ctx, x + 5, y, 1, T, PAL.stone3);           // flute groove
  R(ctx, x + 6, y, 1, T, PAL.stone1);
  R(ctx, x + 7, y, 2, T, PAL.stone2);
  R(ctx, x + 9, y, 1, T, PAL.stone3);           // flute groove
  R(ctx, x + 10, y, 1, T, PAL.stone2);
  R(ctx, x + 11, y, 2, T, shade(PAL.stone2, -0.1));
  R(ctx, x + 13, y, 1, T, PAL.stone3);
  // drum seam band (repeats every tile -> stacked-drum look)
  R(ctx, x + 2, y + 6, 12, 1, shade(PAL.stone3, -0.2));
  R(ctx, x + 2, y + 7, 12, 1, PAL.stone1);
  P(ctx, x + 2, y + 7, PAL.stone0);
  // age: cracks, moss creeping up the lit side, one faint lumen fleck
  P(ctx, x + 7, y + 2, PAL.deepPurple); P(ctx, x + 8, y + 3, PAL.deepPurple);
  P(ctx, x + 11, y + 12, PAL.deepPurple);
  P(ctx, x + 3, y + 1, PAL.moss1); P(ctx, x + 4, y + 2, PAL.moss2);
  P(ctx, x + 3, y + 13, PAL.moss2); P(ctx, x + 4, y + 14, PAL.moss1);
  P(ctx, x + 12, y + 10, PAL.violet2);
  glow(ctx, x + 12, y + 10, 1, PAL.violet1);
}

// floating leaf-stone platform (one-way): only top ~6px drawn
function tilePlatform(ctx, tx, ty, seed) {
  const x = tx * T, y = ty * T;
  const r = rng(seed);
  // mossy top fringe
  for (let i = 0; i < T; i++) {
    const top = r() < 0.3 ? 0 : 1;
    if (top === 0) P(ctx, x + i, y, (i & 3) === 1 ? PAL.cyan1 : PAL.leaf0);
    P(ctx, x + i, y + 1, top === 0 ? PAL.leaf1 : PAL.leaf0);
  }
  R(ctx, x, y + 2, T, 1, PAL.leaf2);
  // stone slab body
  R(ctx, x, y + 3, T, 1, PAL.stone1);
  R(ctx, x, y + 4, T, 1, PAL.stone2);
  R(ctx, x, y + 5, T, 1, PAL.stone3);
  // slab joints (period 8 -> seams)
  P(ctx, x + 4, y + 3, PAL.stone3); P(ctx, x + 4, y + 4, PAL.stone3);
  P(ctx, x + 12, y + 3, PAL.stone3); P(ctx, x + 12, y + 4, PAL.stone3);
  // ragged under-edge: a few gaps + hanging root/moss drips
  P(ctx, x + 2, y + 5, PAL.stone2); P(ctx, x + 10, y + 5, PAL.stone2);
  P(ctx, x + 6, y + 6, PAL.moss2); P(ctx, x + 13, y + 6, shade(PAL.moss2, -0.15));
  P(ctx, x + 6, y + 7, PAL.leaf3);
  // levitation shimmer: faint cyan motes just under the slab
  P(ctx, x + 3, y + 7, PAL.cyan2);
  P(ctx, x + 11, y + 8, PAL.cyan3);
  // one glowing tuft + tiny flower on top
  const gx = x + 3 + ((r() * 10) | 0);
  glow(ctx, gx, y + 1, 2, PAL.cyan1);
  P(ctx, gx, y, PAL.cyan0);
  const fx = x + 2 + ((r() * 12) | 0);
  P(ctx, fx, y, PAL.pink0);
  P(ctx, fx, y + 1, PAL.gold0);
}

// one crystal shard (light facet left, dark facet right, hot tip)
function shard(ctx, cx, baseY, h, halfW, lean) {
  const topY = baseY - h;
  for (let yy = topY; yy <= baseY; yy++) {
    const t = (yy - topY) / h;
    const w = Math.max(0, Math.round(halfW * t));
    const ox = Math.round(lean * (1 - t));
    for (let dx = -w; dx <= w; dx++) {
      const c = dx < 0 ? PAL.cyan1 : dx === 0 ? PAL.cyan2 : PAL.cyan3;
      P(ctx, cx + ox + dx, yy, c);
    }
  }
  return topY;
}

// hazard: cluster of cyan crystal spikes — clearly dangerous
function tileSpikes(ctx, tx, ty) {
  const x = tx * T, y = ty * T;
  // rubble base
  dither(ctx, x, y + 14, T, 2, PAL.stone3, PAL.shadow);
  R(ctx, x, y + 13, T, 1, PAL.stone3);
  P(ctx, x + 3, y + 13, PAL.stone1); P(ctx, x + 11, y + 13, PAL.stone1);
  // shards of varying height/lean
  const tips = [];
  tips.push([x + 3, shard(ctx, x + 3, y + 13, 8, 2, 0)]);
  tips.push([x + 8, shard(ctx, x + 8, y + 13, 12, 2, -1) ]);
  tips.push([x + 12, shard(ctx, x + 12, y + 13, 6, 2, 1)]);
  // silhouette pass BEFORE glow so halos stay soft
  outline(ctx, x, y, T, T);
  // inner facet sparkle lines
  P(ctx, x + 2, y + 9, PAL.cyan0); P(ctx, x + 7, y + 6, PAL.cyan0);
  P(ctx, x + 12, y + 11, PAL.cyan0);
  // glowing hot tips
  for (const [tx2, ty2] of tips) {
    glow(ctx, tx2, ty2 + 1, 2, PAL.cyan1);
    P(ctx, tx2, ty2, PAL.white);
    P(ctx, tx2, ty2 + 1, PAL.cyan0);
  }
}

// decor: glowgrass tuft
function tileGlowgrass(ctx, tx, ty) {
  const x = tx * T, y = ty * T;
  // mossy root pad
  R(ctx, x + 3, y + 15, 10, 1, PAL.moss2);
  R(ctx, x + 5, y + 14, 6, 1, PAL.leaf3);
  // arcing blades
  const blades = [
    [x + 4, 6, -1], [x + 6, 9, 0], [x + 8, 11, 0],
    [x + 10, 8, 1], [x + 12, 5, 1], [x + 5, 4, -1],
  ];
  for (const [bx, h, lean] of blades) {
    for (let i = 0; i < h; i++) {
      const yy = y + 15 - i;
      const ox = i > h * 0.6 ? lean : 0;
      P(ctx, bx + ox, yy, i >= h - 2 ? PAL.leaf0 : i > h / 2 ? PAL.leaf1 : PAL.leaf2);
    }
  }
  outline(ctx, x, y, T, T);
  // bioluminescent tips
  glow(ctx, x + 8, y + 4, 3, PAL.cyan1);
  P(ctx, x + 8, y + 4, PAL.cyan0);
  P(ctx, x + 5, y + 11, PAL.cyan1);
  P(ctx, x + 13, y + 10, PAL.cyan0);
  P(ctx, x + 4, y + 9, PAL.cyan1);
}

// decor: small crystal cluster
function tileCrystal(ctx, tx, ty) {
  const x = tx * T, y = ty * T;
  // rocky base
  R(ctx, x + 3, y + 14, 10, 2, PAL.stone3);
  R(ctx, x + 4, y + 13, 8, 1, PAL.stone2);
  P(ctx, x + 4, y + 13, PAL.stone1); P(ctx, x + 5, y + 14, PAL.stone1);
  const tipA = shard(ctx, x + 7, y + 13, 9, 2, -1);
  const tipB = shard(ctx, x + 11, y + 13, 5, 1, 1);
  const tipC = shard(ctx, x + 4, y + 13, 4, 1, 0);
  outline(ctx, x, y, T, T);
  // facet gleams
  P(ctx, x + 6, y + 8, PAL.cyan0); P(ctx, x + 11, y + 11, PAL.cyan0);
  // glow + hot tips
  glow(ctx, x + 7, tipA + 2, 3, PAL.cyan1);
  P(ctx, x + 6, tipA, PAL.white); P(ctx, x + 6, tipA + 1, PAL.cyan0);
  P(ctx, x + 12, tipB, PAL.cyan0);
  P(ctx, x + 4, tipC, PAL.cyan0);
}

// decor: hanging vine (attaches to ceiling tile above)
function tileVine(ctx, tx, ty) {
  const x = tx * T, y = ty * T;
  // anchor moss along ceiling line
  R(ctx, x + 2, y, 3, 1, PAL.moss2); R(ctx, x + 7, y, 3, 1, PAL.moss2);
  R(ctx, x + 11, y, 3, 1, PAL.moss2);
  const strands = [
    { cx: x + 3, len: 15, sway: [0, 0, 1, 1, 1, 0, 0, -1, -1, 0, 0, 1, 1, 0, 0] },
    { cx: x + 8, len: 11, sway: [0, 0, -1, -1, 0, 0, 1, 1, 1, 0, 0] },
    { cx: x + 12, len: 13, sway: [0, 1, 1, 0, 0, -1, -1, -1, 0, 0, 1, 1, 0] },
  ];
  const buds = [];
  for (let s = 0; s < strands.length; s++) {
    const { cx, len, sway } = strands[s];
    for (let i = 0; i < len; i++) {
      const px = cx + sway[i];
      P(ctx, px, y + i, i < 2 ? PAL.leaf3 : PAL.leaf2);
      // leaf pairs every few px
      if (i > 1 && i % 3 === 0 && i < len - 2) {
        P(ctx, px - 1, y + i, PAL.leaf1);
        P(ctx, px + 1, y + i + 1, PAL.leaf1);
        if (i % 6 === 0) P(ctx, px - 1, y + i - 1, PAL.leaf0);
      }
    }
    buds.push([cx + sway[len - 1], y + len - 1]);
  }
  outline(ctx, x, y, T, T);
  // glowing buds at strand ends (teal, one magenta bloom)
  glow(ctx, buds[0][0], buds[0][1], 2, PAL.cyan1);
  P(ctx, buds[0][0], buds[0][1], PAL.cyan0);
  glow(ctx, buds[1][0], buds[1][1], 2, PAL.magenta1);
  P(ctx, buds[1][0], buds[1][1], PAL.magenta0);
  P(ctx, buds[2][0], buds[2][1], PAL.cyan1);
}

// decor: warm amber lantern of the lost civilisation
function tileLantern(ctx, tx, ty) {
  const x = tx * T, y = ty * T;
  // chain
  P(ctx, x + 8, y, PAL.stone1);
  P(ctx, x + 8, y + 1, PAL.gold1);
  P(ctx, x + 8, y + 2, PAL.stone1);
  // cap
  R(ctx, x + 6, y + 3, 5, 1, PAL.amber2);
  P(ctx, x + 6, y + 3, PAL.amber1);              // lit left edge
  // body frame + glass
  R(ctx, x + 5, y + 4, 1, 7, PAL.amber2);
  R(ctx, x + 11, y + 4, 1, 7, shade(PAL.amber2, -0.2));
  R(ctx, x + 6, y + 4, 5, 7, PAL.amber1);
  R(ctx, x + 7, y + 5, 3, 5, PAL.amber0);
  R(ctx, x + 7, y + 6, 3, 3, PAL.gold0);
  P(ctx, x + 5, y + 4, PAL.amber1);              // frame highlight upper-left
  // bottom + finial
  R(ctx, x + 6, y + 11, 5, 1, PAL.amber2);
  P(ctx, x + 8, y + 12, PAL.gold1);
  P(ctx, x + 8, y + 13, PAL.amber2);
  outline(ctx, x, y, T, T);
  // warm halo + white-hot flame core
  glow(ctx, x + 8, y + 7, 5, PAL.amber0);
  P(ctx, x + 8, y + 7, PAL.white);
  P(ctx, x + 8, y + 8, PAL.gold0);
}

// decor: glowing rune etched by the lost civilisation
function tileRune(ctx, tx, ty) {
  const x = tx * T, y = ty * T;
  const pat = [
    '..#...',
    '..##..',
    '..#.#.',
    '..#..#',
    '..###.',
    '..#.#.',
    '..#..#',
    '.##...',
  ];
  const ox = x + 5, oy = y + 4;
  for (let j = 0; j < pat.length; j++) {
    for (let i = 0; i < pat[j].length; i++) {
      if (pat[j][i] === '#') P(ctx, ox + i, oy + j, j < 3 ? PAL.violet0 : PAL.violet1);
    }
  }
  outline(ctx, x, y, T, T);
  // etched arc fragments around the glyph
  P(ctx, x + 3, y + 3, PAL.violet3); P(ctx, x + 12, y + 3, PAL.violet3);
  P(ctx, x + 2, y + 8, PAL.violet3); P(ctx, x + 13, y + 8, PAL.violet3);
  P(ctx, x + 3, y + 13, PAL.violet3); P(ctx, x + 12, y + 13, PAL.violet3);
  // living light
  glow(ctx, x + 7, y + 8, 3, PAL.violet1);
  P(ctx, x + 7, y + 5, PAL.cyan0);
  P(ctx, x + 7, y + 8, PAL.white);
  P(ctx, x + 10, y + 11, PAL.cyan1);
}

// ---------------------------------------------------------------------------
export function build() {
  const c = makeCanvas(8 * T, 2 * T);
  const ctx = c.getContext('2d');

  // row 0 — surfaces & solids
  tileTop(ctx, 0, 0, 11);
  tileTop(ctx, 1, 0, 23);
  tileTop(ctx, 2, 0, 37);
  stoneBase(ctx, 3 * T, 0, 41);
  stoneBase(ctx, 4 * T, 0, 53);
  stoneBase(ctx, 5 * T, 0, 67); crystalVein(ctx, 5 * T, 0, 68);
  stoneBase(ctx, 6 * T, 0, 79); crystalVein(ctx, 6 * T, 0, 80);
  tileX(ctx, 7, 0);

  // row 1 — pillar, platform, hazard, decor
  tilePillar(ctx, 0, 1);
  tilePlatform(ctx, 1, 1, 97);
  tileSpikes(ctx, 2, 1);
  tileGlowgrass(ctx, 3, 1);
  tileCrystal(ctx, 4, 1);
  tileVine(ctx, 5, 1);
  tileLantern(ctx, 6, 1);
  tileRune(ctx, 7, 1);

  return {
    image: c,
    tileSize: 16,
    tiles: {
      '#top': [{ x: 0, y: 0 }, { x: 16, y: 0 }, { x: 32, y: 0 }],
      '#': [{ x: 48, y: 0 }, { x: 64, y: 0 }, { x: 80, y: 0 }, { x: 96, y: 0 }],
      'X': { x: 112, y: 0 },
      '|': { x: 0, y: 16 },
      '=': { x: 16, y: 16 },
      '^': { x: 32, y: 16 },
      'g': { x: 48, y: 16 },
      'c': { x: 64, y: 16 },
      'v': { x: 80, y: 16 },
      'l': { x: 96, y: 16 },
      'r': { x: 112, y: 16 },
    },
  };
}
