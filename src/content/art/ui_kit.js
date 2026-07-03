// AETHERFALL — UI kit: HUD icons + bitmap font.
// Stamps: heart_full (glossy pink energy heart, 11x11 w/ emissive halo), heart_empty
//         (dark hollow socket, 11x11), shard_icon (cyan crystal w/ glow halo, 11x11).
// Icons: a crisp 9x9 outlined core is composited over a real glow() halo into an 11x11
//        cell (1px pad all round) so the emissive bloom reads without touching neighbours.
// Font: 6x8 cells, 5x7 glyph body, PAL.white strokes with PAL.outline drop shadow
//       baked at +1,+1. Chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,:!?-+/'
import { PAL } from './palette.js';
import { makeCanvas, P, outline, shade, glow } from './util.js';

// ---------------------------------------------------------------------------
// 5x7 bitmap font — consistent baseline (row 6), 1px strokes, open counters.
// ---------------------------------------------------------------------------
const FONT_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,:!?-+/';

const GLYPHS = {
  A: [
    '.###.',
    '#...#',
    '#...#',
    '#####',
    '#...#',
    '#...#',
    '#...#',
  ],
  B: [
    '####.',
    '#...#',
    '#...#',
    '####.',
    '#...#',
    '#...#',
    '####.',
  ],
  C: [
    '.###.',
    '#...#',
    '#....',
    '#....',
    '#....',
    '#...#',
    '.###.',
  ],
  D: [
    '####.',
    '#...#',
    '#...#',
    '#...#',
    '#...#',
    '#...#',
    '####.',
  ],
  E: [
    '#####',
    '#....',
    '#....',
    '####.',
    '#....',
    '#....',
    '#####',
  ],
  F: [
    '#####',
    '#....',
    '#....',
    '####.',
    '#....',
    '#....',
    '#....',
  ],
  G: [
    '.###.',
    '#...#',
    '#....',
    '#.###',
    '#...#',
    '#...#',
    '.###.',
  ],
  H: [
    '#...#',
    '#...#',
    '#...#',
    '#####',
    '#...#',
    '#...#',
    '#...#',
  ],
  I: [
    '.###.',
    '..#..',
    '..#..',
    '..#..',
    '..#..',
    '..#..',
    '.###.',
  ],
  J: [
    '....#',
    '....#',
    '....#',
    '....#',
    '....#',
    '#...#',
    '.###.',
  ],
  K: [
    '#...#',
    '#..#.',
    '#.#..',
    '##...',
    '#.#..',
    '#..#.',
    '#...#',
  ],
  L: [
    '#....',
    '#....',
    '#....',
    '#....',
    '#....',
    '#....',
    '#####',
  ],
  M: [
    '#...#',
    '##.##',
    '#.#.#',
    '#.#.#',
    '#...#',
    '#...#',
    '#...#',
  ],
  N: [
    '#...#',
    '##..#',
    '##..#',
    '#.#.#',
    '#..##',
    '#..##',
    '#...#',
  ],
  O: [
    '.###.',
    '#...#',
    '#...#',
    '#...#',
    '#...#',
    '#...#',
    '.###.',
  ],
  P: [
    '####.',
    '#...#',
    '#...#',
    '####.',
    '#....',
    '#....',
    '#....',
  ],
  Q: [
    '.###.',
    '#...#',
    '#...#',
    '#...#',
    '#.#.#',
    '#..#.',
    '.##.#',
  ],
  R: [
    '####.',
    '#...#',
    '#...#',
    '####.',
    '#.#..',
    '#..#.',
    '#...#',
  ],
  S: [
    '.####',
    '#....',
    '#....',
    '.###.',
    '....#',
    '....#',
    '####.',
  ],
  T: [
    '#####',
    '..#..',
    '..#..',
    '..#..',
    '..#..',
    '..#..',
    '..#..',
  ],
  U: [
    '#...#',
    '#...#',
    '#...#',
    '#...#',
    '#...#',
    '#...#',
    '.###.',
  ],
  V: [
    '#...#',
    '#...#',
    '#...#',
    '#...#',
    '#...#',
    '.#.#.',
    '..#..',
  ],
  W: [
    '#...#',
    '#...#',
    '#...#',
    '#.#.#',
    '#.#.#',
    '##.##',
    '#...#',
  ],
  X: [
    '#...#',
    '#...#',
    '.#.#.',
    '..#..',
    '.#.#.',
    '#...#',
    '#...#',
  ],
  Y: [
    '#...#',
    '#...#',
    '.#.#.',
    '..#..',
    '..#..',
    '..#..',
    '..#..',
  ],
  Z: [
    '#####',
    '....#',
    '...#.',
    '..#..',
    '.#...',
    '#....',
    '#####',
  ],
  '0': [
    '.###.',
    '#...#',
    '#..##',
    '#.#.#',
    '##..#',
    '#...#',
    '.###.',
  ],
  '1': [
    '..#..',
    '.##..',
    '..#..',
    '..#..',
    '..#..',
    '..#..',
    '.###.',
  ],
  '2': [
    '.###.',
    '#...#',
    '....#',
    '..##.',
    '.#...',
    '#....',
    '#####',
  ],
  '3': [
    '.###.',
    '#...#',
    '....#',
    '..##.',
    '....#',
    '#...#',
    '.###.',
  ],
  '4': [
    '...#.',
    '..##.',
    '.#.#.',
    '#..#.',
    '#####',
    '...#.',
    '...#.',
  ],
  '5': [
    '#####',
    '#....',
    '####.',
    '....#',
    '....#',
    '#...#',
    '.###.',
  ],
  '6': [
    '.###.',
    '#....',
    '#....',
    '####.',
    '#...#',
    '#...#',
    '.###.',
  ],
  '7': [
    '#####',
    '....#',
    '...#.',
    '..#..',
    '.#...',
    '.#...',
    '.#...',
  ],
  '8': [
    '.###.',
    '#...#',
    '#...#',
    '.###.',
    '#...#',
    '#...#',
    '.###.',
  ],
  '9': [
    '.###.',
    '#...#',
    '#...#',
    '.####',
    '....#',
    '....#',
    '.###.',
  ],
  ' ': [
    '.....',
    '.....',
    '.....',
    '.....',
    '.....',
    '.....',
    '.....',
  ],
  '.': [
    '.....',
    '.....',
    '.....',
    '.....',
    '.....',
    '.##..',
    '.##..',
  ],
  ',': [
    '.....',
    '.....',
    '.....',
    '.....',
    '.##..',
    '..#..',
    '.#...',
  ],
  ':': [
    '.....',
    '.##..',
    '.##..',
    '.....',
    '.##..',
    '.##..',
    '.....',
  ],
  '!': [
    '..#..',
    '..#..',
    '..#..',
    '..#..',
    '..#..',
    '.....',
    '..#..',
  ],
  '?': [
    '.###.',
    '#...#',
    '....#',
    '..##.',
    '..#..',
    '.....',
    '..#..',
  ],
  '-': [
    '.....',
    '.....',
    '.....',
    '#####',
    '.....',
    '.....',
    '.....',
  ],
  '+': [
    '.....',
    '..#..',
    '..#..',
    '#####',
    '..#..',
    '..#..',
    '.....',
  ],
  '/': [
    '....#',
    '....#',
    '...#.',
    '..#..',
    '.#...',
    '#....',
    '#....',
  ],
};

// Bake the font strip: glyph body at (0..4, 0..6) of each 6x8 cell,
// PAL.outline drop shadow at +1,+1 drawn first, PAL.white strokes on top.
function buildFont() {
  const cw = 6, ch = 8;
  const c = makeCanvas(cw * FONT_CHARS.length, ch);
  const ctx = c.getContext('2d');
  for (let gi = 0; gi < FONT_CHARS.length; gi++) {
    const rows = GLYPHS[FONT_CHARS[gi]];
    if (!rows) continue;
    const gx = gi * cw;
    // shadow pass (+1,+1)
    for (let y = 0; y < 7; y++) for (let x = 0; x < 5; x++) {
      if (rows[y][x] === '#') P(ctx, gx + x + 1, y + 1, PAL.outline);
    }
    // stroke pass
    for (let y = 0; y < 7; y++) for (let x = 0; x < 5; x++) {
      if (rows[y][x] === '#') P(ctx, gx + x, y, PAL.white);
    }
  }
  return { canvas: c, cw, ch, chars: FONT_CHARS };
}

// ---------------------------------------------------------------------------
// Icon stamps.
// A core() renders a 9x9 color-mapped sprite and 1px-outlines it (crisp edge).
// wrap() composites that core over an optional glow() halo into an 11x11 cell
// (core offset +1,+1), so emissive bloom sits BEHIND the sprite without smearing
// the outline (outline is computed on the isolated core before compositing).
// ---------------------------------------------------------------------------
const CORE = 9, CELL = 11, PAD = (CELL - CORE) >> 1, MID = CELL >> 1;

function core(rows, colors) {
  const c = makeCanvas(CORE, CORE);
  const ctx = c.getContext('2d');
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      const k = rows[y][x];
      if (k !== '.') P(ctx, x, y, colors[k]);
    }
  }
  outline(ctx, 0, 0, CORE, CORE, PAL.outline);
  return c;
}

// Composite a crisp core into an 11x11 cell over an optional emissive glow halo.
// glowColor null => no halo (empty socket). `top` paints hot pixels above everything.
function wrap(coreCanvas, glowColor, glowR, top) {
  const c = makeCanvas(CELL, CELL);
  const ctx = c.getContext('2d');
  if (glowColor) glow(ctx, MID, MID, glowR, glowColor);
  ctx.drawImage(coreCanvas, PAD, PAD);
  if (top) top(ctx, PAD);
  return { canvas: c };
}

// hot additive pixel (specular sparkle) at core-local (x,y)
function hot(ctx, ox, x, y, color, a = 0.85) {
  ctx.save();
  ctx.globalAlpha = a;
  P(ctx, ox + x, ox + y, color);
  ctx.restore();
}

function buildHeartFull() {
  // Glossy pink energy heart: light upper-left. Full ramp pink0->pink1->-.30->-.52,
  // white specular on the left lobe, hot pink rim on the top/left silhouette, and a
  // soft pink emissive halo behind (energy heart). H rim, W shine, M base, D/E shade.
  const H = PAL.pink0;                 // highlight / rim (brightest hue)
  const W = PAL.white;                 // specular shine
  const M = PAL.pink1;                 // base
  const D = shade(PAL.pink1, -0.30);   // shaded
  const E = shade(PAL.pink1, -0.52);   // deepest (bottom-right edge)
  const cc = core([
    '.........',
    '.HHH.HMD.',
    'HWHMMMMDE',
    '.HMMMMDE.',
    '..HMMDE..',
    '...MDE...',
    '....E....',
    '.........',
    '.........',
  ], { H, W, M, D, E });
  return wrap(cc, PAL.pink1, 5, (ctx, ox) => {
    // twin specular glints — glossy read
    hot(ctx, ox, 1, 1, PAL.white, 0.9);
    hot(ctx, ox, 5, 1, PAL.pink0, 0.55);
  });
}

function buildHeartEmpty() {
  // Dark hollow socket: same silhouette, sunken void center, faint top-left rim.
  // 11x11 to align with heart_full; no emissive halo (spent life = no energy).
  const S = PAL.shadow;      // rim catch-light (still dark)
  const B = PAL.deepPurple;  // socket body
  const V = PAL.void;        // hollow center
  const cc = core([
    '.........',
    '.SSS.SBB.',
    'SSBBVVBBB',
    '.SBVVVBB.',
    '..SBVBB..',
    '...BBB...',
    '....B....',
    '.........',
    '.........',
  ], { S, B, V });
  return wrap(cc, null, 0, (ctx, ox) => {
    hot(ctx, ox, 1, 1, PAL.stone2, 0.4); // faint rim catch-light
  });
}

function buildShardIcon() {
  // Cyan crystal shard: elongated gem, lit left facet (cyan0/1), dark right facet
  // (cyan2/3), white hot core streak + tip, hot-left rim, and a real cyan glow halo.
  const W = PAL.white;
  const A = PAL.cyan0;   // light facet
  const B = PAL.cyan1;   // mid-light
  const C = PAL.cyan2;   // mid-dark
  const D = PAL.cyan3;   // dark facet
  const cc = core([
    '....W....',
    '...WAB...',
    '..AABCC..',
    '..AWBCD..',
    '..ABBCD..',
    '..ABCDD..',
    '...BCD...',
    '....C....',
    '.........',
  ], { W, A, B, C, D });
  return wrap(cc, PAL.cyan1, 5, (ctx, ox) => {
    hot(ctx, ox, 4, 0, PAL.white, 0.95);  // blazing tip
    hot(ctx, ox, 3, 3, PAL.cyan0, 0.7);   // inner sparkle
  });
}

// ---------------------------------------------------------------------------
export function build() {
  return {
    stamps: {
      heart_full: buildHeartFull(),
      heart_empty: buildHeartEmpty(),
      shard_icon: buildShardIcon(),
    },
    font: buildFont(),
  };
}
