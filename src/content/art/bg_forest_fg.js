// AETHERFALL — bg_forest_fg
// Lumen Woods FOREGROUND layer: sparse near-black leaf clumps, arcing branches,
// ferns and crystal shard silhouettes hugging the bottom ~80px of the screen,
// kissed by a faint cyan rim light (upper-left). Drawn in FRONT of gameplay at
// parallax factor 1.25 — deliberately sparse + mostly transparent so it frames
// the action without ever hiding it. Tiles horizontally seamlessly (all drawing
// goes through a wrapping pixel putter).
import { PAL } from './palette.js';
import { makeCanvas, P, rng, shade } from './util.js';

export function build() {
  const W = 960, H = 270;
  const TOPLIMIT = H - 80;            // content never rises above bottom 80px
  const c = makeCanvas(W, H);
  const ctx = c.getContext('2d');
  const rnd = rng(771244);

  // silhouette tones — near PAL.outline, never pure black
  const SIL = PAL.outline;            // #1a1030 body
  const SIL_D = PAL.void;             // #0b0716 shaded (lower-right)
  const SIL_L = PAL.deepPurple;       // #241537 lit (upper-left)
  const RIM = PAL.cyan3;              // faint cyan rim
  const RIM_B = PAL.cyan2;            // rare brighter rim sparkle
  const RIM_HOT = PAL.cyan1;          // crystal hot tip

  // ---- wrap-safe pixel helpers (guarantee seamless horizontal tiling) ----
  const wrap = (x) => ((x % W) + W) % W;
  const px = (x, y, col) => {
    y = Math.round(y);
    if (y < 0 || y >= H) return;
    P(ctx, wrap(Math.round(x)), y, col);
  };
  const pxA = (x, y, col, a) => {
    ctx.globalAlpha = a;
    px(x, y, col);
    ctx.globalAlpha = 1;
  };

  // ============================================================
  // 1) Broken ground fringe along the very bottom (undulating,
  //    seamless via integer-frequency sines, with real gaps so
  //    the layer stays mostly transparent)
  // ============================================================
  const TAU = Math.PI * 2;
  for (let x = 0; x < W; x++) {
    const u = x / W;
    const gate = Math.sin(TAU * (u * 5 + 0.13)) + 0.55 * Math.sin(TAU * (u * 11 + 0.71));
    if (gate < -0.5) continue; // gap — see straight through to gameplay
    const h = Math.max(1, Math.round(
      2.6 + 2.0 * Math.sin(TAU * (u * 3 + 0.05)) + 1.4 * Math.sin(TAU * (u * 7 + 0.42))
    ));
    for (let j = 0; j < h; j++) {
      const y = H - 1 - j;
      px(x, y, j === h - 1 ? SIL : (j < 1 ? SIL_D : SIL));
    }
    // whisper of rim light catching a few crest pixels
    if (rnd() < 0.05) pxA(x, H - h - 1, RIM, 0.3);
  }

  // scattered grass blades rising from the fringe
  for (let i = 0; i < 90; i++) {
    const bx = Math.floor(rnd() * W);
    const bh = 3 + Math.floor(rnd() * 8);
    const sway = rnd() < 0.5 ? -1 : 1;
    for (let j = 0; j < bh; j++) {
      const off = sway * Math.floor((j * j) / (bh * 2.2));
      px(bx + off, H - 2 - j, j > bh - 3 ? SIL_L : SIL);
    }
    if (rnd() < 0.25) pxA(bx + sway * Math.floor(bh / 2.2), H - 1 - bh, RIM, 0.35);
  }

  // ============================================================
  // shape drawers
  // ============================================================

  // rounded leaf clump built from overlapping blobs; tracks its own top
  // profile so a sparse cyan rim can be laid along the upper-left crown
  function leafClump(cx, cy, parts) {
    const tops = new Map();
    const put = (x, y, col) => {
      px(x, y, col);
      const k = wrap(Math.round(x));
      const t = tops.get(k);
      if (t === undefined || y < t) tops.set(k, Math.round(y));
    };
    const blob = (bx, by, rx, ry, col) => {
      for (let dy = -ry; dy <= ry; dy++) {
        const w = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry))));
        for (let dx = -w; dx <= w; dx++) put(bx + dx, by + dy, col);
      }
    };
    for (const p of parts) blob(cx + p[0], cy + p[1], p[2], p[3], p[4] || SIL);
    // scalloped leaf notches biting into the crown (foliage read, not a lump)
    for (const [x, y] of tops) {
      if (rnd() < 0.18) {
        ctx.clearRect(x, Math.max(0, y), 1, 1 + Math.floor(rnd() * 2));
        tops.set(x, y + 2);
      }
    }
    // upper-left biased faint rim
    for (const [x, y] of tops) {
      const leftBias = ((wrap(x - wrap(Math.round(cx))) + W) % W) > W / 2 ? 0.55 : 0.2;
      if (rnd() < leftBias) pxA(x, y, RIM, 0.4);
      else if (rnd() < 0.06) pxA(x, y, RIM_B, 0.35);
    }
    // a couple of hanging leaf tips under the canopy
    for (let i = 0; i < 3; i++) {
      const hx = cx + Math.round((rnd() - 0.5) * 26);
      const hy = cy + 3 + Math.floor(rnd() * 4);
      px(hx, hy, SIL);
      px(hx, hy + 1, SIL);
      px(hx + 1, hy + 1, SIL_D);
      px(hx, hy + 2, SIL_D);
    }
  }

  // dark crystal shard rising from the ground, faint cyan rim down its
  // left edge and a soft hot pixel at the tip
  function crystal(baseX, tipX, tipY, halfW) {
    tipY = Math.max(tipY, TOPLIMIT + 2);
    const baseY = H - 1;
    const hgt = baseY - tipY;
    const leftEdge = [];
    for (let y = tipY; y <= baseY; y++) {
      const t = (y - tipY) / hgt;
      const cxr = tipX + (baseX - tipX) * t;
      const w = Math.max(0, Math.round(halfW * Math.pow(t, 0.72)));
      for (let dx = -w; dx <= w; dx++) {
        const col = dx <= -w + 1 ? SIL_L : (dx >= w - 1 ? SIL_D : SIL);
        px(cxr + dx, y, col);
      }
      leftEdge.push([Math.round(cxr) - w, y]);
    }
    // inner facet crease (barely-there, sells the crystal cut)
    for (let y = tipY + 3; y <= baseY; y += 2) {
      const t = (y - tipY) / hgt;
      const cxr = tipX + (baseX - tipX) * t;
      pxA(cxr - Math.round(halfW * Math.pow(t, 0.72) * 0.4), y, PAL.shadow, 0.8);
    }
    // faint rim light along the upper-left edge
    for (const [x, y] of leftEdge) {
      if (rnd() < 0.7) pxA(x, y, RIM, 0.5);
      if (rnd() < 0.08) pxA(x, y, RIM_B, 0.4);
    }
    // hot tip + one-pixel inner glow (kept dim — it's a silhouette)
    pxA(tipX, tipY, RIM_HOT, 0.65);
    pxA(tipX, tipY + 1, RIM_B, 0.5);
    pxA(tipX, tipY + 2, RIM, 0.4);
  }

  // arcing branch (quadratic bezier) with small leaf sprigs
  function branch(x0, y0, mx, my, x1, y1) {
    const n = 56;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const it = 1 - t;
      const xt = it * it * x0 + 2 * it * t * mx + t * t * x1;
      const yt = it * it * y0 + 2 * it * t * my + t * t * y1;
      px(xt, yt, SIL);
      if (t < 0.55) { px(xt, yt + 1, SIL_D); px(xt + 1, yt, SIL); } // thicker near base
      if (rnd() < 0.10 && t > 0.15) pxA(xt, yt - 1, RIM, 0.3);     // moon-kiss on top
      // leaf sprigs hanging off the branch
      if ((i === 18 || i === 30 || i === 44) && t > 0.2) {
        for (let s = 0; s < 4; s++) {
          px(xt + s - 1, yt + 2, SIL);
          px(xt + s - 1, yt + 3, s % 2 ? SIL_D : SIL);
        }
        px(xt, yt + 4, SIL_D);
        pxA(xt - 1, yt + 2, RIM, 0.3);
      }
    }
    // leaf cluster at the branch tip
    leafClump(x1, y1 - 2, [
      [0, 0, 7, 4], [-4, 2, 5, 3, SIL_D], [4, 1, 4, 3],
    ]);
  }

  // fern: fanned arcs of pixels from a ground base
  function fern(fx, hMax) {
    const fronds = 5;
    for (let f = 0; f < fronds; f++) {
      const dir = f < 2 ? -1 : (f > 2 ? 1 : (rnd() < 0.5 ? -1 : 1));
      const spread = (f - (fronds - 1) / 2) * 7;
      const h = hMax - Math.abs(f - (fronds - 1) / 2) * 6;
      for (let j = 0; j <= h; j++) {
        const t = j / h;
        const xx = fx + spread * t + dir * 2 * t * t;
        const yy = H - 2 - h * Math.sin(t * Math.PI / 2);
        px(xx, yy, t > 0.75 ? SIL_L : SIL);
        // tiny leaflets
        if (j % 3 === 0 && t > 0.2 && t < 0.9) {
          px(xx - 1, yy + 1, SIL_D);
          px(xx + 1, yy + 1, SIL_D);
        }
      }
      pxA(fx + spread + dir * 2, H - 2 - h, RIM, 0.35);
    }
  }

  // small mossy stone mound
  function stone(sx, w, h) {
    for (let dy = 0; dy < h; dy++) {
      const ww = Math.round(w * Math.sqrt(1 - Math.pow(dy / h, 2)));
      for (let dx = -ww; dx <= ww; dx++) {
        px(sx + dx, H - 1 - (h - 1 - dy), dx < -ww + 2 ? SIL_L : (dx > ww - 2 ? SIL_D : SIL));
      }
    }
    if (rnd() < 0.8) pxA(sx - Math.round(w * 0.5), H - h, RIM, 0.35);
  }

  // ============================================================
  // 2) Sparse scene composition — clusters with generous gaps
  // ============================================================

  // — cluster A: low leaf clump + baby shard (x ~ 40)
  leafClump(42, H - 10, [
    [0, 0, 24, 9], [-14, 3, 12, 6, SIL_D], [12, -2, 12, 6], [3, -6, 10, 5],
  ]);
  crystal(74, 78, H - 26, 4);
  stone(10, 7, 4);

  // — cluster B: tall twin crystal shards (x ~ 155) — the layer's landmark
  crystal(152, 148, TOPLIMIT + 6, 8);
  crystal(170, 174, H - 44, 5);
  crystal(140, 136, H - 24, 3);

  // — cluster C: arcing branch sweeping in from the ground (x ~ 300)
  branch(276, H - 1, 296, H - 52, 336, H - 58);
  stone(272, 9, 5);

  // — cluster D: big layered canopy clump (x ~ 480)
  leafClump(478, H - 14, [
    [0, 0, 32, 12], [-20, 4, 14, 7, SIL_D], [18, 2, 15, 8],
    [-6, -9, 16, 7], [10, -12, 11, 5],
  ]);
  crystal(452, 448, H - 34, 4);

  // — cluster E: leaning crystal trio (x ~ 645)
  crystal(640, 630, TOPLIMIT + 14, 7);
  crystal(658, 666, H - 40, 5);
  crystal(624, 620, H - 22, 3);
  stone(680, 8, 4);

  // — cluster F: fern fan (x ~ 790)
  fern(790, 36);
  stone(812, 6, 3);

  // — cluster G: medium clump + shard, near the seam (wraps cleanly) (x ~ 895)
  leafClump(896, H - 11, [
    [0, 0, 20, 8], [-12, 2, 10, 5, SIL_D], [10, -4, 10, 5],
  ]);
  crystal(925, 929, H - 30, 4);

  // ============================================================
  // 3) A few faint fireflies drifting in the fringe band
  // ============================================================
  for (let i = 0; i < 7; i++) {
    const fx = Math.floor(rnd() * W);
    const fy = TOPLIMIT + 12 + Math.floor(rnd() * 52);
    pxA(fx, fy, RIM_HOT, 0.45);
    pxA(fx + 1, fy, RIM, 0.15);
    pxA(fx - 1, fy, RIM, 0.15);
    pxA(fx, fy + 1, RIM, 0.15);
    pxA(fx, fy - 1, RIM, 0.15);
  }

  // a hair of extra depth: darken the extreme bottom row so the layer
  // grounds itself against the level edge
  ctx.globalAlpha = 0.6;
  for (let x = 0; x < W; x++) px(x, H - 1, shade(SIL_D, -0.3));
  ctx.globalAlpha = 1;

  return {
    canvas: c,
    factor: 1.25,      // fg parallax — slides slightly faster than gameplay
    tileX: true,
    y: 0,              // hug the level bottom
    front: true,       // drawn over gameplay (kept sparse so it never obscures)
    autoScroll: 0,
    alpha: 1,
  };
}
