// AETHERFALL — props_forest.js — LUMEN WOODS scenic props (kind: props)
//
// Stamp names (reference these from level decor lists):
//   crystal_big   — giant glowing cyan crystal cluster on mossy violet rock (~54x64)
//   tree_glow     — bioluminescent tree with hanging light strands (~58x78)
//   statue        — ancient mossy hooded-guardian statue with glowing rune eyes (~36x54)
//   arch_stone    — cracked violet stone arch, moss + glowing keystone rune (~72x58)
//   firefly_bush  — low glowing bush with hovering fireflies (~32x24)
//   lantern       — lost-civilization amber lantern on a stone post (~20x44)
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

// faceted crystal shard: kite polygon from tip (tx,ty) down to base (bx,by).
// left facet light, mid facet, 1px dark right edge, highlight sliver, hot tip.
function drawShard(ctx, bx, by, tx, ty, hw, ramp) {
  const dy = Math.max(1, by - ty);
  for (let j = 0; j <= dy; j++) {
    const t = j / dy;
    const w = t < 0.3 ? (t / 0.3) * hw : hw * (1 - 0.22 * ((t - 0.3) / 0.7));
    const cx = tx + (bx - tx) * t;
    const y = ty + j;
    const x0 = Math.round(cx - w), x1 = Math.round(cx + w);
    const span = x1 - x0 + 1;
    const lw = Math.max(1, Math.round(span * 0.4));
    R(ctx, x0, y, lw, 1, ramp[1]);                       // lit left facet
    if (span - lw - 1 > 0) R(ctx, x0 + lw, y, span - lw - 1, 1, ramp[2]); // mid facet
    P(ctx, x1, y, ramp[3]);                              // dark right edge
    if (t > 0.1 && t < 0.85) P(ctx, x0, y, ramp[0]);     // rim highlight (upper-left light)
  }
  // internal facet seam (dark) + a parallel caustic light core on wide shards
  const mx = Math.round((tx + bx) / 2);
  line(ctx, tx, ty + 2, mx, by - 2, ramp[2]);
  if (hw >= 5) {
    // bright inner glow line — light refracting down the crystal body
    line(ctx, tx - 1, ty + 3, mx - 1, by - 8, ramp[0]);
    P(ctx, tx - 1, ty + 4, PAL.cyan0 === ramp[0] ? PAL.white : ramp[0]);
  }
  // hot emissive tip + a soft second-brightest step below it (no hard banding)
  P(ctx, tx, ty, PAL.white);
  P(ctx, tx, ty + 1, ramp[0]);
  P(ctx, tx, ty + 2, ramp[1]);
}

// tiny hovering firefly: hot core + soft halo
function firefly(ctx, x, y, col) {
  glow(ctx, x, y, 3, col);
  P(ctx, x, y, PAL.white);
  P(ctx, x + 1, y, col);
  P(ctx, x, y + 1, col);
}

// moss clumps along a top surface (light from upper-left → moss reads bright)
function mossRun(ctx, x, y, w, rand) {
  for (let i = 0; i < w; i++) {
    const r = rand();
    if (r < 0.62) P(ctx, x + i, y, r < 0.28 ? PAL.moss1 : PAL.moss2);
    if (r < 0.22) P(ctx, x + i, y - 1, PAL.leaf1);
    if (r < 0.08) P(ctx, x + i, y - 2, PAL.leaf0);
  }
}

// rim light: brighten the top/left-facing edge of the whole silhouette (light
// from upper-left). MUST run before outline() — it keys off transparent neighbors.
// Blends softly so it reads as a glowing catch-light on the contour, not a paint edge.
function rimLight(ctx, x, y, w, h, color, alpha = 0.5) {
  const img = ctx.getImageData(x, y, w, h);
  const d = img.data;
  const al = (i, j) => (i < 0 || j < 0 || i >= w || j >= h) ? 0 : d[(j * w + i) * 4 + 3];
  const marks = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    if (al(i, j) > 20 && (al(i, j - 1) <= 20 || al(i - 1, j) <= 20)) marks.push([i, j]);
  }
  ctx.save();
  ctx.globalAlpha = alpha;
  for (const [i, j] of marks) P(ctx, x + i, y + j, color);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// crystal_big — giant glowing crystal cluster (~54x64)
// ---------------------------------------------------------------------------
function buildCrystalBig() {
  const W = 54, H = 64;
  const c = makeCanvas(W, H);
  const ctx = c.getContext('2d');
  const rand = rng(7401);
  const C = RAMPS.crystal, V = RAMPS.violet;

  // mossy violet rock base
  ellipseFill(ctx, 27, 57, 22, 6, PAL.violet3);
  ellipseFill(ctx, 26, 56, 20, 5, PAL.stone3);
  ellipseFill(ctx, 22, 55, 12, 4, PAL.stone2);
  dither(ctx, 12, 55, 18, 3, PAL.stone2, PAL.stone3);
  dither(ctx, 6, 58, 42, 2, PAL.stone3, PAL.violet3);   // blend rock→shadow (anti-band)
  R(ctx, 8, 60, 38, 3, PAL.deepPurple);           // base shadow band
  dither(ctx, 8, 59, 38, 1, PAL.deepPurple, PAL.violet3); // soften shadow top edge
  // scattered rock chunks
  ellipseFill(ctx, 8, 58, 4, 3, PAL.stone3);
  P(ctx, 6, 56, PAL.stone1);
  ellipseFill(ctx, 47, 58, 4, 3, PAL.stone3);
  P(ctx, 45, 56, PAL.stone1);
  // cyan light-pool: the crystals cast their glow down onto the rock beneath them
  ctx.save();
  ctx.globalAlpha = 0.16;
  ellipseFill(ctx, 27, 54, 17, 4, PAL.cyan2);
  ctx.globalAlpha = 0.1;
  ellipseFill(ctx, 27, 55, 21, 5, PAL.cyan1);
  ctx.restore();

  // back accent shard (violet, reads as depth)
  drawShard(ctx, 18, 54, 8, 22, 4, V);

  // main shards (cyan) — big center, two flankers, two small front
  drawShard(ctx, 40, 55, 45, 16, 5, C);
  drawShard(ctx, 30, 56, 27, 3, 7, C);
  drawShard(ctx, 15, 57, 16, 30, 5, C);
  drawShard(ctx, 22, 60, 20, 40, 3, C);
  drawShard(ctx, 36, 61, 38, 42, 3, C);

  // moss creeping onto the rock (top-left, catching light)
  mossRun(ctx, 10, 53, 14, rand);
  mossRun(ctx, 31, 52, 12, rand);
  mossRun(ctx, 6, 56, 5, rand);

  // sparkle glints on facets (4-point twinkle: hot core + soft arms)
  const twinkle = (gx, gy, col) => {
    P(ctx, gx, gy, PAL.white);
    P(ctx, gx - 1, gy, col); P(ctx, gx + 1, gy, col);
    P(ctx, gx, gy - 1, col); P(ctx, gx, gy + 1, col);
  };
  twinkle(24, 14, PAL.cyan0); twinkle(44, 26, PAL.cyan0);
  twinkle(13, 38, PAL.cyan0);
  P(ctx, 10, 28, PAL.cyan0); P(ctx, 31, 20, PAL.white); P(ctx, 37, 47, PAL.cyan0);

  // rim light along the top/left crystal contour — ambient glow catch on the silhouette
  rimLight(ctx, 0, 0, W, H, PAL.cyan0, 0.42);

  outline(ctx, 0, 0, W, H);

  // emissive halos after outline so the outline stays crisp (layered for depth)
  glow(ctx, 27, 6, 9, PAL.cyan1);
  glow(ctx, 27, 6, 4, PAL.cyan0);
  glow(ctx, 45, 18, 6, PAL.cyan1);
  glow(ctx, 16, 32, 6, PAL.cyan1);
  glow(ctx, 8, 24, 4, PAL.violet1);
  glow(ctx, 20, 42, 3, PAL.cyan1);
  glow(ctx, 38, 44, 3, PAL.cyan1);
  glow(ctx, 27, 52, 12, PAL.cyan1);            // broad under-glow lifting the whole base
  // ambient fireflies drawn to the crystal light
  firefly(ctx, 4, 16, PAL.cyan1);
  firefly(ctx, 50, 34, PAL.gold0);
  firefly(ctx, 47, 12, PAL.cyan1);
  return c;
}

// ---------------------------------------------------------------------------
// tree_glow — bioluminescent tree with hanging lights (~58x78)
// ---------------------------------------------------------------------------
function buildTreeGlow() {
  const W = 58, H = 78;
  const c = makeCanvas(W, H);
  const ctx = c.getContext('2d');
  const rand = rng(9313);
  const bark2 = shade(PAL.violet3, -0.25);
  const bark1 = PAL.violet3;
  const bark0 = shade(PAL.violet2, -0.15);

  // ---- canopy (drawn first, trunk overlaps its base) ----
  ellipseFill(ctx, 29, 22, 26, 15, PAL.leaf3);          // dark mass
  ellipseFill(ctx, 22, 18, 17, 11, PAL.leaf2);          // mid, biased upper-left
  ellipseFill(ctx, 40, 20, 12, 9, PAL.leaf2);
  ellipseFill(ctx, 18, 14, 11, 7, PAL.leaf1);           // lit lobes
  ellipseFill(ctx, 34, 12, 9, 6, PAL.leaf1);
  ellipseFill(ctx, 15, 11, 6, 4, PAL.leaf0);            // top-left rim light
  ellipseFill(ctx, 32, 9, 5, 3, PAL.leaf0);
  // ragged edge + dither transitions (no banding)
  dither(ctx, 8, 24, 14, 4, PAL.leaf2, PAL.leaf3);
  dither(ctx, 30, 26, 16, 4, PAL.leaf2, PAL.leaf3);
  dither(ctx, 12, 16, 10, 3, PAL.leaf1, PAL.leaf2);
  for (let i = 0; i < 26; i++) {                         // leafy fringe below
    const x = 6 + Math.floor(rand() * 46);
    const y = 32 + Math.floor(rand() * 5);
    P(ctx, x, y, rand() < 0.5 ? PAL.leaf3 : PAL.leaf2);
  }

  // bioluminescent buds inside canopy
  const buds = [[14, 16], [25, 11], [37, 15], [45, 22], [20, 25], [33, 24], [10, 21]];
  for (const [bx, by] of buds) {
    P(ctx, bx, by, PAL.cyan0);
    P(ctx, bx + 1, by, PAL.cyan2);
    P(ctx, bx, by + 1, PAL.cyan2);
  }

  // ---- trunk: tapering, slightly S-curved ----
  for (let y = 30; y < 72; y++) {
    const t = (y - 30) / 42;
    const w = Math.round(3 + t * 4);                     // half-width 3→7
    const cx = 29 + Math.round(Math.sin(t * 2.4) * 2);
    R(ctx, cx - w, y, w * 2, 1, bark1);
    R(ctx, cx - w, y, 2, 1, bark0);                      // lit left edge
    P(ctx, cx + w - 1, y, bark2);                        // shaded right edge
    if ((y & 3) === 0) P(ctx, cx - 1 + ((y >> 2) % 3), y, bark2); // bark grooves
  }
  // branches
  line(ctx, 27, 33, 14, 27, bark1); line(ctx, 27, 34, 15, 28, bark2);
  line(ctx, 31, 32, 43, 26, bark1); line(ctx, 31, 33, 42, 27, bark2);
  // root flare
  R(ctx, 20, 70, 20, 2, bark1);
  line(ctx, 20, 71, 16, 73, bark2);
  line(ctx, 39, 71, 44, 73, bark2);
  R(ctx, 21, 70, 3, 1, bark0);
  ellipseFill(ctx, 30, 74, 18, 3, PAL.deepPurple);       // ground shadow
  mossRun(ctx, 17, 73, 26, rand);
  // moss on trunk's lit side
  for (let y = 40; y < 68; y += 3) if (rand() < 0.6) P(ctx, 24 + ((y >> 1) % 3), y, PAL.moss1);

  // ---- hanging light strands from canopy ----
  const strands = [[11, 27, 9], [21, 30, 14], [30, 33, 10], [39, 29, 16], [48, 24, 8]];
  const orbCols = [PAL.amber0, PAL.cyan1, PAL.amber0, PAL.cyan1, PAL.gold0];
  strands.forEach(([sx, sy, len], i) => {
    line(ctx, sx, sy, sx, sy + len, PAL.shadow);
    P(ctx, sx, sy + len + 1, orbCols[i]);
    P(ctx, sx, sy + len + 2, shade(orbCols[i], -0.35));
  });

  // rim light on the canopy's upper-left mass + lit trunk edge (moonlit contour)
  rimLight(ctx, 0, 0, W, H, PAL.leaf0, 0.4);

  outline(ctx, 0, 0, W, H);

  // ambient canopy bloom — the whole crown breathes a soft bioluminescent haze
  glow(ctx, 22, 18, 14, PAL.leaf2);
  glow(ctx, 30, 20, 10, PAL.leaf1);
  // glow pass (over outline, soft) — orbs layered hot + halo
  strands.forEach(([sx, sy, len], i) => {
    glow(ctx, sx, sy + len + 1, 4, orbCols[i]);
    glow(ctx, sx, sy + len + 1, 2, shade(orbCols[i], 0.35));
    // faint light-pool where each hanging orb spills onto the ground below
    ctx.save(); ctx.globalAlpha = 0.12;
    ellipseFill(ctx, sx, 74, 4, 2, orbCols[i]); ctx.restore();
  });
  for (const [bx, by] of buds) glow(ctx, bx, by, 2, PAL.cyan1);
  firefly(ctx, 52, 44, PAL.gold0);
  firefly(ctx, 6, 38, PAL.cyan1);
  firefly(ctx, 44, 40, PAL.cyan1);
  return c;
}

// ---------------------------------------------------------------------------
// statue — ancient mossy hooded guardian (~36x54)
// ---------------------------------------------------------------------------
function buildStatue() {
  const W = 36, H = 54;
  const c = makeCanvas(W, H);
  const ctx = c.getContext('2d');
  const rand = rng(5117);
  const S = RAMPS.stone;

  // plinth (two steps)
  R(ctx, 3, 48, 30, 5, S[2]);
  R(ctx, 3, 48, 30, 1, S[1]);
  R(ctx, 3, 48, 8, 1, S[0]);
  P(ctx, 32, 52, S[3]); R(ctx, 31, 49, 2, 4, S[3]);
  R(ctx, 6, 44, 24, 4, S[1]);
  R(ctx, 6, 44, 24, 1, S[0]);
  R(ctx, 28, 45, 2, 3, S[3]);

  // robe: tapering silhouette from shoulders to plinth
  const robeMid = shade(S[1], -0.12);                    // extra ramp step (anti-band)
  for (let y = 20; y < 44; y++) {
    const t = (y - 20) / 24;
    const hw = Math.round(6 + t * 4);                    // widens downward
    R(ctx, 18 - hw, y, hw * 2, 1, S[1]);
    R(ctx, 18 - hw, y, 2, 1, S[0]);                      // lit left
    R(ctx, 18 + hw - 4, y, 1, 1, robeMid);               // soft mid step before shadow
    R(ctx, 18 + hw - 3, y, 3, 1, S[2]);                  // shaded right
    P(ctx, 18 + hw - 1, y, S[3]);
    if ((y & 1) === 0) P(ctx, 18 - hw + 2, y, robeMid);  // faint dither off the lit edge
  }
  // robe folds
  line(ctx, 14, 26, 12, 43, S[2]);
  line(ctx, 22, 26, 25, 43, S[3]);
  line(ctx, 18, 24, 18, 42, robeMid);                    // soft central fold highlight

  // shoulders + hood
  R(ctx, 10, 18, 16, 4, S[1]);
  R(ctx, 10, 18, 5, 1, S[0]);
  ellipseFill(ctx, 18, 13, 6, 7, S[1]);                  // hood dome
  ellipseFill(ctx, 16, 11, 3, 3, S[0]);                  // lit crown
  R(ctx, 22, 12, 2, 6, S[2]);
  // hood cavity + glowing rune eyes
  R(ctx, 15, 12, 6, 6, PAL.deepPurple);
  R(ctx, 16, 13, 4, 4, PAL.void);
  // rune-light pooling on the cavity walls (eyes bounce cyan into the void)
  ctx.save(); ctx.globalAlpha = 0.35;
  R(ctx, 16, 15, 4, 2, PAL.cyan3); ctx.restore();
  P(ctx, 16, 14, PAL.cyan1); P(ctx, 19, 14, PAL.cyan1);
  P(ctx, 16, 13, PAL.cyan0); P(ctx, 19, 13, PAL.cyan0);
  P(ctx, 16, 15, PAL.cyan2); P(ctx, 19, 15, PAL.cyan2); // eye lower gleam

  // clasped hands + ancient sword held point-down
  R(ctx, 16, 28, 5, 3, S[0]);
  R(ctx, 17, 20, 2, 8, PAL.metal1);                      // hilt/grip
  P(ctx, 17, 20, PAL.metal0);
  R(ctx, 14, 26, 9, 1, PAL.metal2);                      // crossguard
  for (let y = 31; y < 46; y++) {                        // blade
    P(ctx, 17, y, PAL.metal0);
    P(ctx, 18, y, PAL.metal2);
  }
  P(ctx, 17, 46, PAL.metal1);                            // point

  // cracks
  line(ctx, 26, 33, 24, 40, S[3]);
  line(ctx, 11, 35, 13, 30, S[3]);
  line(ctx, 8, 49, 11, 51, S[3]);

  // moss: top surfaces + plinth ledges
  mossRun(ctx, 13, 8, 8, rand);
  mossRun(ctx, 10, 18, 6, rand);
  mossRun(ctx, 6, 44, 10, rand);
  mossRun(ctx, 3, 48, 13, rand);
  P(ctx, 27, 22, PAL.moss2); P(ctx, 26, 30, PAL.moss2);

  // rim light: cool ambient catch along the hood/shoulder contour
  rimLight(ctx, 0, 0, W, H, PAL.stone0, 0.45);

  outline(ctx, 0, 0, W, H);
  // layered eye glow — hot core + wider bloom spilling from the hood
  glow(ctx, 16, 14, 3, PAL.cyan1);
  glow(ctx, 19, 14, 3, PAL.cyan1);
  glow(ctx, 17, 14, 2, PAL.cyan0);
  glow(ctx, 18, 15, 5, PAL.cyan2);              // soft downward face-wash
  firefly(ctx, 31, 26, PAL.gold0);
  firefly(ctx, 5, 30, PAL.cyan1);
  return c;
}

// ---------------------------------------------------------------------------
// arch_stone — cracked stone arch with glowing keystone (~72x58)
// ---------------------------------------------------------------------------
function buildArch() {
  const W = 72, H = 58;
  const c = makeCanvas(W, H);
  const ctx = c.getContext('2d');
  const rand = rng(3271);
  const S = RAMPS.stone;
  const cx = 36, cy = 30, RO = 26, RI = 18;

  // arch band (upper half annulus), per-pixel shading by height + edge
  for (let dy = 0; dy <= RO; dy++) {
    const y = cy - dy;
    const xo = Math.floor(Math.sqrt(RO * RO - dy * dy));
    const xi = dy < RI ? Math.ceil(Math.sqrt(RI * RI - dy * dy)) : 0;
    for (const sgn of [-1, 1]) {
      const a = sgn === -1 ? cx - xo : cx + xi;
      const b = sgn === -1 ? cx - xi : cx + xo;
      for (let x = a; x <= b; x++) {
        const d = Math.sqrt((x - cx) * (x - cx) + dy * dy);
        let col = S[1];
        if (d > RO - 1.6) col = dy > RO * 0.4 && x < cx + 4 ? S[0] : S[2]; // outer edge: lit on top-left
        else if (d < RI + 1.6) col = S[3];                                  // inner underside dark
        else if (x > cx + 8) col = S[2];                                    // right side shaded
        else if (((x + y) % 7) === 0) col = S[2];                           // masonry texture
        P(ctx, x, y, col);
      }
    }
    if (xi > 0 && dy > 2) { P(ctx, cx - xi, y, S[3]); P(ctx, cx + xi, y, S[3]); }
  }
  // voussoir seams radiating through the band
  for (const ang of [-1.15, -0.75, -0.35, 0.35, 0.75, 1.15]) {
    const x0 = cx + Math.round(Math.sin(ang) * RI), y0 = cy - Math.round(Math.cos(ang) * RI);
    const x1 = cx + Math.round(Math.sin(ang) * (RO - 1)), y1 = cy - Math.round(Math.cos(ang) * (RO - 1));
    line(ctx, x0, y0, x1, y1, S[3]);
  }

  // pillars under the band ends
  for (const px of [cx - RO, cx + RI]) {
    const w = RO - RI;
    R(ctx, px, cy, w, 22, S[1]);
    R(ctx, px, cy, 1, 22, S[0]);                         // lit left edge
    R(ctx, px + w - 2, cy, 2, 22, S[2]);
    P(ctx, px + w - 1, cy + 10, S[3]);
    for (let y = cy + 4; y < cy + 22; y += 5) line(ctx, px + 1, y, px + w - 2, y, S[2]); // block courses
    // footing (reaches y=56 so the arch sits flush when bottom-aligned on the ground)
    R(ctx, px - 2, cy + 22, w + 4, 5, S[2]);
    R(ctx, px - 2, cy + 22, w + 4, 1, S[1]);
    R(ctx, px - 2, cy + 22, 4, 1, S[0]);
    P(ctx, px + w + 1, cy + 25, S[3]);
    R(ctx, px - 2, cy + 26, w + 4, 1, S[3]);               // dark contact row at ground
  }

  // glowing keystone rune at the apex
  R(ctx, cx - 3, cy - RO + 1, 7, 6, S[2]);
  R(ctx, cx - 3, cy - RO + 1, 7, 1, S[0]);
  P(ctx, cx, cy - RO + 3, PAL.cyan0);
  P(ctx, cx, cy - RO + 4, PAL.cyan1);
  P(ctx, cx - 1, cy - RO + 4, PAL.cyan2); P(ctx, cx + 1, cy - RO + 4, PAL.cyan2);
  P(ctx, cx, cy - RO + 5, PAL.cyan1);

  // cracks + missing chips
  line(ctx, cx - 20, cy - 12, cx - 16, cy - 4, S[3]);
  line(ctx, cx + 14, cy - 16, cx + 18, cy - 9, S[3]);
  line(ctx, cx + RI + 2, cy + 12, cx + RI + 5, cy + 18, S[3]);

  // moss on top of the arch + vines hanging from the underside
  for (let x = cx - 16; x <= cx + 16; x++) {
    const dy = Math.floor(Math.sqrt(Math.max(0, RO * RO - (x - cx) * (x - cx))));
    if (rand() < 0.55) P(ctx, x, cy - dy - 1, rand() < 0.4 ? PAL.moss1 : PAL.moss2);
    if (rand() < 0.15) P(ctx, x, cy - dy - 2, PAL.leaf1);
  }
  for (const vx of [cx - 10, cx - 2, cx + 7]) {
    const dy = Math.floor(Math.sqrt(RI * RI - (vx - cx) * (vx - cx)));
    const vl = 5 + Math.floor(rand() * 6);
    line(ctx, vx, cy - dy + 1, vx, cy - dy + vl, PAL.leaf3);
    P(ctx, vx, cy - dy + vl, PAL.leaf2);
    P(ctx, vx - 1, cy - dy + Math.floor(vl / 2), PAL.leaf2);
  }
  mossRun(ctx, cx - RO - 2, cy + 21, 8, rand);
  mossRun(ctx, cx + RI, cy + 21, 8, rand);

  // rim light along the arch's lit outer curve + pillar edges
  rimLight(ctx, 0, 0, W, H, PAL.stone0, 0.4);

  outline(ctx, 0, 0, W, H);
  // keystone rune: layered glow so the apex reads as the arch's power source
  glow(ctx, cx, cy - RO + 4, 5, PAL.cyan1);
  glow(ctx, cx, cy - RO + 4, 2, PAL.cyan0);
  firefly(ctx, cx - 6, cy + 6, PAL.gold0);
  firefly(ctx, cx + 9, cy - 2, PAL.cyan1);
  return c;
}

// ---------------------------------------------------------------------------
// firefly_bush — low glowing bush with fireflies (~32x24)
// ---------------------------------------------------------------------------
function buildFireflyBush() {
  const W = 32, H = 24;
  const c = makeCanvas(W, H);
  const ctx = c.getContext('2d');
  const rand = rng(2861);

  ellipseFill(ctx, 16, 18, 13, 5, PAL.leaf3);            // dark under-mass
  ellipseFill(ctx, 12, 15, 8, 5, PAL.leaf2);             // lit lobes upper-left
  ellipseFill(ctx, 21, 16, 7, 4, PAL.leaf2);
  ellipseFill(ctx, 10, 13, 4, 3, PAL.leaf1);
  ellipseFill(ctx, 19, 13, 3, 2, PAL.leaf1);
  P(ctx, 8, 11, PAL.leaf0); P(ctx, 9, 12, PAL.leaf0); P(ctx, 18, 12, PAL.leaf0);
  dither(ctx, 8, 17, 16, 3, PAL.leaf2, PAL.leaf3);
  // ragged leaf fringe
  for (let i = 0; i < 12; i++) {
    const x = 4 + Math.floor(rand() * 24);
    P(ctx, x, 10 + Math.floor(rand() * 3), rand() < 0.5 ? PAL.leaf1 : PAL.leaf2);
  }
  // tiny twigs at soil line
  P(ctx, 12, 22, PAL.deepPurple); P(ctx, 20, 22, PAL.deepPurple);
  R(ctx, 6, 22, 20, 1, PAL.deepPurple);                  // ground shadow
  // glowing berries nestled in the foliage
  P(ctx, 14, 16, PAL.cyan0); P(ctx, 22, 15, PAL.cyan1); P(ctx, 9, 16, PAL.cyan1);

  // rim light on the leafy upper-left contour
  rimLight(ctx, 0, 0, W, H, PAL.leaf0, 0.38);

  outline(ctx, 0, 0, W, H);
  // every berry gets its own glow (emissive)
  glow(ctx, 14, 16, 2, PAL.cyan1);
  glow(ctx, 22, 15, 2, PAL.cyan1);
  glow(ctx, 9, 16, 2, PAL.cyan1);
  // fireflies rising off the bush
  firefly(ctx, 5, 6, PAL.gold0);
  firefly(ctx, 16, 3, PAL.amber0);
  firefly(ctx, 27, 7, PAL.gold0);
  firefly(ctx, 23, 11, PAL.amber0);
  return c;
}

// ---------------------------------------------------------------------------
// lantern — lost-civilization amber lantern on a stone post (~20x44)
// ---------------------------------------------------------------------------
function buildLantern() {
  const W = 20, H = 44;
  const c = makeCanvas(W, H);
  const ctx = c.getContext('2d');
  const rand = rng(6089);
  const S = RAMPS.stone;

  // post
  R(ctx, 4, 8, 4, 32, S[1]);
  R(ctx, 4, 8, 1, 32, S[0]);
  R(ctx, 7, 8, 1, 32, S[2]);
  line(ctx, 5, 18, 6, 24, S[2]);                         // crack
  // curved arm
  R(ctx, 4, 6, 10, 2, S[1]);
  R(ctx, 4, 6, 6, 1, S[0]);
  P(ctx, 13, 7, S[2]);
  R(ctx, 12, 8, 2, 2, S[2]);
  // base footing
  R(ctx, 2, 40, 8, 3, S[2]);
  R(ctx, 2, 40, 8, 1, S[1]);
  P(ctx, 9, 42, S[3]);
  mossRun(ctx, 2, 39, 7, rand);
  mossRun(ctx, 4, 8, 3, rand);

  // hanging chain + lantern cage
  P(ctx, 13, 10, PAL.metal2); P(ctx, 13, 11, PAL.metal1);
  R(ctx, 10, 12, 7, 2, PAL.metal2);                      // cap
  R(ctx, 10, 12, 4, 1, PAL.metal1);
  R(ctx, 10, 14, 7, 8, PAL.metal2);                      // frame
  R(ctx, 11, 15, 5, 6, PAL.amber1);                      // glass, amber-lit
  R(ctx, 11, 15, 2, 2, PAL.amber0);
  P(ctx, 13, 17, PAL.gold0);                             // flame core
  P(ctx, 13, 16, PAL.white);
  P(ctx, 13, 15, PAL.amber0);
  P(ctx, 10, 14, PAL.metal1); P(ctx, 10, 21, PAL.metal1); // lit frame corners
  R(ctx, 10, 22, 7, 1, PAL.metal3);                      // base of cage
  P(ctx, 13, 23, PAL.metal2);                            // finial

  // warm amber light-pool spilling onto the post + arm before outline
  ctx.save(); ctx.globalAlpha = 0.14;
  ellipseFill(ctx, 8, 20, 6, 8, PAL.amber1); ctx.restore();
  // rim light — cool ambient on the stone edges (contrasts the warm flame)
  rimLight(ctx, 0, 0, W, H, PAL.stone0, 0.4);

  outline(ctx, 0, 0, W, H);
  // flame glow: warm layered bloom
  glow(ctx, 13, 17, 7, PAL.amber1);
  glow(ctx, 13, 17, 5, PAL.amber0);
  glow(ctx, 13, 17, 2, PAL.gold0);
  firefly(ctx, 3, 26, PAL.gold0);
  return c;
}

// ---------------------------------------------------------------------------

export function build() {
  return {
    stamps: {
      crystal_big:  { canvas: buildCrystalBig() },
      tree_glow:    { canvas: buildTreeGlow() },
      statue:       { canvas: buildStatue() },
      arch_stone:   { canvas: buildArch() },
      firefly_bush: { canvas: buildFireflyBush() },
      lantern:      { canvas: buildLantern() },
    },
  };
}
