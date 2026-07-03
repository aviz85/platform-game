// AETHERFALL — title logo (kind: titleart)
// build() -> { stamps: { logo: { canvas } } }
//
// 244x60 wordmark: chunky angled (italic-sheared) pixel lettering, vertical
// cyan→violet crystal gradient with dithered transitions, diagonal facet
// highlights/shadows per letter, upper-left rim light, PAL.outline outline,
// cyan/violet glow accents + star sparkles, and a tiny 3x5-px subtitle
// "A CRYSTAL-PUNK ODYSSEY" flanked by gem-tipped rule lines.
import { PAL } from './palette.js';
import { makeCanvas, P, R, outline, glow, shade } from './util.js';

// ---- big letterforms: 10x14 grids, 3px-thick strokes, chamfered corners ----
const GLYPHS = {
  A: [
    '...####...',
    '..######..',
    '.###..###.',
    '.###..###.',
    '###....###',
    '###....###',
    '##########',
    '##########',
    '###....###',
    '###....###',
    '###....###',
    '###....###',
    '###....###',
    '###....###',
  ],
  E: [
    '.#########',
    '##########',
    '###.......',
    '###.......',
    '###.......',
    '#########.',
    '#########.',
    '###.......',
    '###.......',
    '###.......',
    '###.......',
    '###.......',
    '##########',
    '.#########',
  ],
  T: [
    '.########.',
    '##########',
    '##########',
    '...####...',
    '...####...',
    '...####...',
    '...####...',
    '...####...',
    '...####...',
    '...####...',
    '...####...',
    '...####...',
    '...####...',
    '....###...',
  ],
  H: [
    '.##....###',
    '###....###',
    '###....###',
    '###....###',
    '###....###',
    '##########',
    '##########',
    '###....###',
    '###....###',
    '###....###',
    '###....###',
    '###....###',
    '###....###',
    '###....##.',
  ],
  R: [
    '.#######..',
    '#########.',
    '###...###.',
    '###....###',
    '###....###',
    '###....###',
    '#########.',
    '########..',
    '###.###...',
    '###..###..',
    '###...###.',
    '###...###.',
    '###....###',
    '###....###',
  ],
  F: [
    '.#########',
    '##########',
    '###.......',
    '###.......',
    '###.......',
    '#########.',
    '#########.',
    '###.......',
    '###.......',
    '###.......',
    '###.......',
    '###.......',
    '###.......',
    '.##.......',
  ],
  L: [
    '.##.......',
    '###.......',
    '###.......',
    '###.......',
    '###.......',
    '###.......',
    '###.......',
    '###.......',
    '###.......',
    '###.......',
    '###.......',
    '###.......',
    '##########',
    '.#########',
  ],
};

const WORD = 'AETHERFALL';
// tighter pairs where letterforms leave air (T flanks, R leg into F, F foot into A apex)
const KERN = { ET: 2, TH: 2, RF: 3, FA: 2 };

// ---- tiny 3x5 subtitle font ----
const TINY = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'],
  C: ['.##', '#..', '#..', '#..', '.##'],
  D: ['##.', '#.#', '#.#', '#.#', '##.'],
  E: ['###', '#..', '##.', '#..', '###'],
  K: ['#.#', '#.#', '##.', '#.#', '#.#'],
  L: ['#..', '#..', '#..', '#..', '###'],
  N: ['#.#', '###', '###', '#.#', '#.#'],
  O: ['.#.', '#.#', '#.#', '#.#', '.#.'],
  P: ['##.', '#.#', '##.', '#..', '#..'],
  R: ['##.', '#.#', '##.', '#.#', '#.#'],
  S: ['.##', '#..', '.#.', '..#', '##.'],
  T: ['###', '.#.', '.#.', '.#.', '.#.'],
  U: ['#.#', '#.#', '#.#', '#.#', '###'],
  Y: ['#.#', '#.#', '.#.', '.#.', '.#.'],
  '-': ['...', '...', '###', '...', '...'],
  ' ': ['...', '...', '...', '...', '...'],
};

function drawTiny(ctx, text, x, y, col) {
  let px = x;
  for (const ch of text) {
    const g = TINY[ch] || TINY[' '];
    for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) {
      if (g[j][i] === '#') P(ctx, px + i, y + j, col);
    }
    px += 4;
  }
}

// 4-point star sparkle (white core, cyan arms)
function star(ctx, x, y, big) {
  const arm = big ? 2 : 1;
  for (let d = 1; d <= arm; d++) {
    const col = d === 1 ? PAL.cyan0 : PAL.cyan1;
    P(ctx, x - d, y, col); P(ctx, x + d, y, col);
    P(ctx, x, y - d, col); P(ctx, x, y + d, col);
  }
  P(ctx, x, y, PAL.white);
}

export function build() {
  const W = 244, H = 60;
  const SC = 2, GW = 10, GH = 14;          // grid scale / glyph grid size
  const y0 = 8, letterH = GH * SC;         // wordmark band: y 8..35
  const c = makeCanvas(W, H);
  const ctx = c.getContext('2d');

  // --- pen positions with kerning ---
  const pens = [];
  let pen = 4;
  for (let i = 0; i < WORD.length; i++) {
    pens.push(pen);
    if (i < WORD.length - 1) pen += GW * SC + (KERN[WORD[i] + WORD[i + 1]] ?? 4);
  }

  // --- stamp sheared glyphs into a mask (so edges/facets can be computed) ---
  const mask = new Uint8Array(W * H);
  const who = new Int8Array(W * H).fill(-1);      // which letter owns each pixel
  const shear = (gy) => (13 - gy) >> 2;           // italic slant: top rows shift right 3..0
  for (let k = 0; k < WORD.length; k++) {
    const g = GLYPHS[WORD[k]];
    for (let gy = 0; gy < GH; gy++) for (let gx = 0; gx < GW; gx++) {
      if (g[gy][gx] !== '#') continue;
      const sx = pens[k] + (gx + shear(gy)) * SC;
      const sy = y0 + gy * SC;
      for (let dy = 0; dy < SC; dy++) for (let dx = 0; dx < SC; dx++) {
        mask[(sy + dy) * W + (sx + dx)] = 1;
        who[(sy + dy) * W + (sx + dx)] = k;
      }
    }
  }
  const at = (x, y) => x >= 0 && y >= 0 && x < W && y < H && mask[y * W + x] === 1;

  // --- color pass: vertical cyan→violet gradient + crystal facets + rim light ---
  // 8-step ramp: extended past cyan0/violet3 at both ends for deeper crystal
  // contrast and finer facet stepping (less banding on the tall letter columns).
  const stops = [
    shade(PAL.cyan0, 0.45),   // near-white cyan crown
    PAL.cyan0, PAL.cyan1, PAL.cyan2,
    PAL.violet1, PAL.violet2, PAL.violet3,
    shade(PAL.violet3, -0.35), // deep violet root
  ];
  const TOP = stops.length - 1;
  const botEdge = shade(PAL.violet3, -0.4);
  for (let y = y0; y < y0 + letterH; y++) {
    for (let x = 0; x < W; x++) {
      if (!at(x, y)) continue;
      const r = y - y0;
      const pos = (r / (letterH - 1)) * TOP;
      let i = Math.floor(pos);
      const f = pos - i;
      if (f > 0.66) i++;                              // hard step
      else if (f > 0.33 && ((x + y) & 1)) i++;        // checker-dithered band edge
      const k = who[y * W + x], ph = k * 7;
      if (((x + y + ph) % 15) < 2) i--;               // bright diagonal facet
      else if (((x - y + ph * 2 + 300) % 21) < 2) i++; // dark counter-facet
      if (!at(x - 1, y)) i--;                          // left edge catches light
      if (!at(x + 1, y)) i++;                          // right edge in shadow
      i = Math.max(0, Math.min(TOP, i));
      let col = stops[i];
      // upper-left lit edge — the silhouette catches the key light on its left rim
      if (!at(x - 1, y) && r < letterH * 0.5) col = shade(PAL.cyan0, 0.2);
      if (!at(x, y - 1)) col = ((x * 3 + k) % 11 === 0) ? PAL.white : PAL.cyan0; // top rim
      if (!at(x, y + 1)) col = botEdge;                                          // grounded bottom edge
      P(ctx, x, y, col);
    }
  }

  // --- dark-purple outline around the wordmark ---
  outline(ctx, 0, 0, W, y0 + letterH + 4, PAL.outline);

  // --- glow accents on crystal hot points (after outline so halos stay soft) ---
  glow(ctx, pens[0] + 15, y0 + 2, 5, PAL.cyan1);       // A apex
  glow(ctx, pens[2] + 10, y0 + 3, 3, PAL.cyan1);       // T bar
  glow(ctx, pens[5] + 19, y0 + 26, 3, PAL.violet1);    // R leg tip
  glow(ctx, pens[9] + 18, y0 + 26, 4, PAL.cyan1);      // last L corner
  glow(ctx, pens[3] + 10, y0 + 13, 3, PAL.cyan2);      // H crossbar (mid-word warmth)
  glow(ctx, pens[7] + 10, y0 + 5, 3, PAL.violet1);     // 2nd A apex (violet half)
  // sparkles
  star(ctx, pens[0] + 15, y0 + 1, true);               // A apex
  star(ctx, pens[4] + 24, y0 + 1, false);              // 2nd E top-right
  star(ctx, pens[2] + 9, y0 + 3, false);               // T bar
  star(ctx, pens[9] + 19, y0 + 26, true);              // final L corner

  // --- subtitle: "A CRYSTAL-PUNK ODYSSEY" + gem-tipped rules ---
  const sub = 'A CRYSTAL-PUNK ODYSSEY';
  const subW = sub.length * 4 - 1;                     // 87px
  const sx = ((W - subW) / 2) | 0, sy = 47;
  drawTiny(ctx, sub, sx + 1, sy + 1, PAL.outline);     // drop shadow
  drawTiny(ctx, sub, sx, sy, PAL.cyan1);
  // flanking rules with shimmer
  R(ctx, 22, sy + 2, 46, 1, PAL.violet2);
  R(ctx, W - 68, sy + 2, 46, 1, PAL.violet2);
  for (let x = 24; x < 68; x += 7) P(ctx, x, sy + 2, PAL.violet1);
  for (let x = W - 66; x < W - 22; x += 7) P(ctx, x, sy + 2, PAL.violet1);
  // gem diamonds at the inner ends
  for (const gx of [72, W - 72]) {
    P(ctx, gx, sy + 1, PAL.cyan1); P(ctx, gx, sy + 3, PAL.cyan1);
    P(ctx, gx - 1, sy + 2, PAL.cyan1); P(ctx, gx + 1, sy + 2, PAL.cyan1);
    P(ctx, gx, sy + 2, PAL.white);
    glow(ctx, gx, sy + 2, 2, PAL.cyan1);
  }

  return { stamps: { logo: { canvas: c } } };
}
