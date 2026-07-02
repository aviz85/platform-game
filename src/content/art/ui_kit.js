// AETHERFALL — UI kit: HUD icons + bitmap font.
// Stamps: heart_full (glossy pink energy heart, 9x9), heart_empty (dark socket, 9x9),
//         shard_icon (cyan crystal, 9x9).
// Font: 6x8 cells, 5x7 glyph body, PAL.white strokes with PAL.outline drop shadow
//       baked at +1,+1. Chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,:!?-+/'
import { PAL } from './palette.js';
import { makeCanvas, P, outline, shade } from './util.js';

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
// Icon stamps — 9x9, drawn from color-coded pixel maps, PAL.outline'd.
// ---------------------------------------------------------------------------
function stamp(w, h, rows, colors, post) {
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      const k = rows[y][x];
      if (k !== '.') P(ctx, x, y, colors[k]);
    }
  }
  outline(ctx, 0, 0, w, h, PAL.outline);
  if (post) post(ctx);
  return { canvas: c };
}

function buildHeartFull() {
  // Glossy pink energy heart: light from upper-left, white shine pixel,
  // darker ramp toward lower-right, hot rim on the left lobe.
  const L = PAL.pink0;                 // highlight
  const M = PAL.pink1;                 // base
  const D = shade(PAL.pink1, -0.32);   // shaded
  const E = shade(PAL.pink1, -0.52);   // deepest (bottom-right edge)
  const W = PAL.white;                 // shine
  return stamp(9, 9, [
    '.........',
    '..LL.MM..',
    '.LWLMMMD.',
    '.LLMMMDD.',
    '.MMMMDDE.',
    '..MMDDE..',
    '...MDE...',
    '....E....',
    '.........',
  ], { L, M, D, E, W });
}

function buildHeartEmpty() {
  // Dark empty socket: same silhouette, sunken void center, faint top-left rim.
  const S = PAL.shadow;      // rim catch-light (still dark)
  const B = PAL.deepPurple;  // socket body
  const V = PAL.void;        // hollow center
  return stamp(9, 9, [
    '.........',
    '..SS.SS..',
    '.SBBBBBB.',
    '.SBVVVBB.',
    '.BBVVVBB.',
    '..BBBBB..',
    '...BBB...',
    '....B....',
    '.........',
  ], { S, B, V });
}

function buildShardIcon() {
  // Cyan crystal shard: elongated gem, lit left facet, dark right facet,
  // white hot pixel at the tip + soft emissive glow.
  const W = PAL.white;
  const A = PAL.cyan0;
  const B = PAL.cyan1;
  const C = PAL.cyan2;
  const D = PAL.cyan3;
  return stamp(9, 9, [
    '....W....',
    '...ABC...',
    '..AABCC..',
    '..ABBCD..',
    '..ABBCD..',
    '..ABCDD..',
    '...BCD...',
    '....C....',
    '.........',
  ], { W, A, B, C, D }, (ctx) => {
    // subtle additive halo — the shard is emissive
    ctx.save();
    ctx.globalAlpha = 0.22;
    P(ctx, 3, 0, PAL.cyan1); P(ctx, 5, 0, PAL.cyan1);
    P(ctx, 1, 2, PAL.cyan1); P(ctx, 7, 2, PAL.cyan1);
    P(ctx, 1, 5, PAL.cyan1); P(ctx, 7, 5, PAL.cyan1);
    ctx.restore();
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
