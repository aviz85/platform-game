// AETHERFALL — LUMEN WOODS mid parallax layer (factor ~0.4)
// Large violet-stone floating islands with bioluminescent foliage caps, hanging
// vines, cyan crystal clusters glowing on the undersides, drifting rock shards,
// a couple of lost-civilization amber lanterns, and faint fireflies.
// 640x270, transparent sky above, tiles horizontally seamlessly (all drawing is
// wrapped modulo canvas width).
import { PAL } from './palette.js';
import { makeCanvas, rng, shade } from './util.js';

const W = 640, H = 270;

export function build() {
  const c = makeCanvas(W, H);
  const ctx = c.getContext('2d');
  const rnd = rng(9137);

  // ---- wrapped drawing primitives (guarantee seamless horizontal tiling) ----
  const wrap = (x) => ((Math.round(x) % W) + W) % W;
  const px = (x, y, col) => {
    y |= 0;
    if (y < 0 || y >= H) return;
    ctx.fillStyle = col;
    ctx.fillRect(wrap(x), y, 1, 1);
  };
  const hspan = (x, y, w, col) => {
    y |= 0; w |= 0;
    if (w <= 0 || y < 0 || y >= H) return;
    const sx = wrap(x);
    ctx.fillStyle = col;
    if (sx + w <= W) ctx.fillRect(sx, y, w, 1);
    else { ctx.fillRect(sx, y, W - sx, 1); ctx.fillRect(0, y, w - (W - sx), 1); }
  };
  // soft two-pass emissive halo (wrapped)
  const softGlow = (x, y, r, col) => {
    ctx.save();
    ctx.globalAlpha = 0.16;
    for (let j = -r; j <= r; j++) {
      const w = Math.floor(Math.sqrt(r * r - j * j));
      hspan(x - w, y + j, w * 2 + 1, col);
    }
    ctx.globalAlpha = 0.3;
    const r2 = Math.max(1, (r / 2) | 0);
    for (let j = -r2; j <= r2; j++) {
      const w = Math.floor(Math.sqrt(r2 * r2 - j * j));
      hspan(x - w, y + j, w * 2 + 1, col);
    }
    ctx.restore();
  };

  // extra tones derived from palette
  const stoneLit = shade(PAL.stone1, 0.08);      // brightest upper-left lit stone
  const stoneRim = shade(PAL.stone2, 0.10);      // upper-left lit stone edge
  const violetRim = shade(PAL.violet2, 0.06);
  const stoneDeep = shade(PAL.deepPurple, -0.12);
  const leafGlow = shade(PAL.leaf1, 0.18);
  const cryBounce = shade(PAL.cyan3, -0.18);     // faint cyan light bouncing onto stone
  const cryBounce1 = shade(PAL.cyan2, -0.30);    // slightly brighter bounce, closest to source

  // ------------------------------------------------------------------
  // hanging vine: wavy strand with leaf pairs, optional glowing bud tip
  // ------------------------------------------------------------------
  const vine = (x0, y0, len, phase, withBud) => {
    let lx = x0;
    for (let k = 0; k < len; k++) {
      const off = Math.round(Math.sin(k * 0.33 + phase) * (1 + k * 0.045));
      lx = x0 + off;
      const y = y0 + k;
      px(lx, y, k % 5 === 2 ? PAL.leaf2 : PAL.leaf3);
      if (k > 2 && k % 6 === 3) {          // leaf pair
        px(lx - 1, y, PAL.leaf3);
        px(lx + 1, y + (k % 12 === 3 ? 0 : 1), PAL.moss2);
      }
      if (k > 4 && k % 9 === 7) px(lx + 1, y, PAL.leaf2);
    }
    if (withBud) {
      const by = y0 + len;
      softGlow(lx, by, 4, PAL.cyan1);
      px(lx - 1, by, PAL.cyan2); px(lx + 1, by, PAL.cyan2);
      px(lx, by - 1, PAL.cyan2); px(lx, by + 1, PAL.cyan3);
      px(lx, by, PAL.cyan0);
    }
  };

  // ------------------------------------------------------------------
  // downward crystal cluster (grows from island underside)
  // ------------------------------------------------------------------
  const crystalDown = (x, y, h, w0) => {
    // layered emissive halo: wide faint wash + tight bright core
    softGlow(x, y + (h / 2) | 0, h - 1, PAL.cyan1);
    softGlow(x, y + ((h * 0.62) | 0), Math.max(2, (h * 0.4) | 0), PAL.cyan0);
    // faint cyan light bouncing UP onto the stone above the crystal (seat stays dark)
    ctx.save();
    ctx.globalAlpha = 0.55;
    hspan(x - w0 - 1, y - 2, (w0 + 1) * 2 + 1, cryBounce1);
    ctx.globalAlpha = 0.32;
    hspan(x - w0 - 1, y - 3, (w0 + 1) * 2 + 1, cryBounce);
    hspan(x - w0, y - 4, w0 * 2 + 1, cryBounce);
    ctx.restore();
    for (let j = 0; j < h; j++) {
      const w = Math.max(0, Math.round((1 - j / h) * w0));
      // left face lit (upper-left light), right face dark, bright core line
      hspan(x - w, y + j, w, PAL.cyan2);
      hspan(x + 1, y + j, w, PAL.cyan3);
      px(x - w, y + j, PAL.cyan1);                 // lit left rim facet
      px(x, y + j, j < h - 2 ? PAL.cyan1 : PAL.cyan0);
      if (j === 0) hspan(x - w, y - 1, w * 2 + 1, PAL.outline); // seat shadow
    }
    px(x, y + h, PAL.cyan0);                       // hot tip
    softGlow(x, y + h, 2, PAL.white);              // tip sparkle bloom
    px(x - 1, y + ((h * 0.4) | 0), PAL.cyan0);      // facet sparkle
    // small side shard
    const sh = Math.max(2, (h * 0.45) | 0);
    for (let j = 0; j < sh; j++) {
      const w = Math.max(0, Math.round((1 - j / sh) * (w0 * 0.5)));
      hspan(x + w0 - w + 2, y + j, w + 1, PAL.cyan3);
      px(x + w0 + 2, y + j, PAL.cyan2);
    }
    px(x + w0 + 2, y + sh, PAL.cyan1);
  };

  // ------------------------------------------------------------------
  // tiny amber lantern of the lost civilization, hung on a short chain
  // ------------------------------------------------------------------
  const lantern = (x, y, chain) => {
    for (let k = 0; k < chain; k++) px(x, y + k, k & 1 ? PAL.stone3 : PAL.metal3);
    const ly = y + chain;
    softGlow(x, ly + 2, 6, PAL.amber1);
    hspan(x - 1, ly, 3, PAL.amber2);         // cap
    hspan(x - 2, ly + 1, 5, PAL.amber1);
    hspan(x - 2, ly + 2, 5, PAL.amber1);
    px(x, ly + 1, PAL.gold0);                // hot core
    px(x - 1, ly + 2, PAL.amber0);
    px(x, ly + 2, PAL.amber0);
    hspan(x - 1, ly + 3, 3, PAL.amber2);
    px(x, ly + 4, PAL.outline);
  };

  // ------------------------------------------------------------------
  // floating island: domed bioluminescent foliage cap over a violet-stone
  // body that tapers to a jagged inverted-cone underside
  // ------------------------------------------------------------------
  const island = (cx, topY, rw, depth, opts = {}) => {
    const surf = [], bot = [];
    let jag = 0;
    for (let i = -rw; i <= rw; i++) {
      const t = i / rw;
      const dome = (1 - t * t) * (2.5 + rw * 0.05);
      surf.push(topY - Math.floor(dome) - (rnd() < 0.25 ? 1 : 0));
      jag += (rnd() - 0.5) * 3.2;
      jag *= 0.8;
      const cone = Math.pow(Math.max(0, 1 - Math.abs(t)), 0.5);
      bot.push(topY + Math.max(2, Math.floor(depth * cone * (0.72 + 0.28 * rnd()) + jag)));
    }
    // body columns
    for (let i = -rw; i <= rw; i++) {
      const k = i + rw, x = cx + i, t = i / rw;
      const sy = surf[k], by = bot[k];
      if (by <= sy) continue;
      const colH = by - sy;
      const folH = Math.min(colH - 1, 3 + ((rnd() * 2) | 0) + (Math.abs(t) < 0.5 ? 1 : 0));
      // foliage cap — teal-green bioluminescent turf
      for (let y = sy; y < sy + folH; y++) {
        const d = y - sy;
        let col = d === 0 ? (t < -0.15 ? PAL.leaf1 : PAL.leaf2)
          : d === 1 ? PAL.leaf2 : PAL.leaf3;
        if (d === 0 && t < -0.5) col = PAL.leaf0;                 // sun-catch rim, lit edge
        else if (d === 0 && rnd() < 0.10) col = leafGlow;         // lit blade
        if (d > 0 && rnd() < 0.05) col = PAL.moss1;               // moss patch
        if (d > 0 && rnd() < 0.028) { col = PAL.cyan2; softGlow(x, y, 2, PAL.cyan1); } // biolum fleck + bloom
        px(x, y, col);
      }
      // occasional grass tuft poking above the surface
      if (rnd() < 0.14) px(x, sy - 1, t < 0 ? PAL.leaf1 : PAL.leaf2);
      if (rnd() < 0.04) { px(x, sy - 1, PAL.leaf1); px(x, sy - 2, leafGlow); }
      // stone body — depth-banded, upper-left lit, dither seams between bands
      for (let y = sy + folH; y < by; y++) {
        const f = (y - sy) / colH;
        let col;
        if (f < 0.34) col = PAL.stone3;
        else if (f < 0.42) col = ((x + y) & 1) ? PAL.stone3 : PAL.shadow;
        else if (f < 0.62) col = PAL.shadow;
        else if (f < 0.7) col = ((x + y) & 1) ? PAL.shadow : PAL.deepPurple;
        else if (f < 0.86) col = PAL.deepPurple;
        else if (f < 0.92) col = ((x + y) & 1) ? PAL.deepPurple : stoneDeep; // anti-band seam
        else col = stoneDeep;
        // lit left flank near the surface — fuller light→dark ramp (upper-left source)
        const dCap = y - (sy + folH);
        if (t < -0.62) {
          if (dCap < 2) col = stoneLit;
          else if (dCap < 4) col = stoneRim;
          else if (dCap < 6) col = PAL.stone2;
          else if (dCap < 8) col = ((x + y) & 1) ? PAL.stone2 : PAL.stone3;
        } else if (t < -0.32) {
          if (dCap < 2) col = stoneRim;
          else if (dCap < 4) col = PAL.stone2;
          else if (dCap < 5) col = ((x + y) & 1) ? PAL.stone2 : PAL.stone3;
        }
        // embedded violet strata + buried crystal glints
        if (rnd() < 0.02 && f > 0.3 && f < 0.8) col = PAL.violet3;
        if (rnd() < 0.006 && f > 0.45) col = PAL.violet2;
        px(x, y, col);
      }
      px(x, by, PAL.outline);                                     // dark under-edge
      if (rnd() < 0.1 && colH > 8) px(x, by + 1, PAL.deepPurple);  // dangling grit
      // side rim-light on the far-left edge
      if (k === 0) for (let y = sy + 1; y < Math.min(by, sy + 6); y++) px(x - 1, y, violetRim);
    }
    // strata cracks across the body
    const nCracks = Math.max(1, (rw / 26) | 0);
    for (let s = 0; s < nCracks; s++) {
      let x = cx - rw * 0.5 + rnd() * rw, y = topY + 5 + rnd() * depth * 0.35;
      const len = 5 + ((rnd() * 7) | 0);
      for (let j = 0; j < len; j++) {
        px(x, y, PAL.outline);
        x += rnd() < 0.7 ? 1 : 0;
        y += rnd() < 0.45 ? 1 : 0;
      }
    }
    // crystals on the underside
    const nCr = opts.crystals ?? Math.max(1, (rw / 34) | 0);
    for (let s = 0; s < nCr; s++) {
      const t = -0.55 + (s + 0.5) * (1.1 / nCr) + (rnd() - 0.5) * 0.18;
      const k = Math.max(0, Math.min(2 * rw, Math.round((t + 1) * rw)));
      const h = 6 + ((rnd() * 6) | 0), w0 = 2 + ((rnd() * 2) | 0);
      crystalDown(cx + (k - rw), bot[k] - 1, h, w0);
    }
    // broad faint underglow — the cluster's collective crystal light in the void below
    if (nCr > 0) {
      const midK = Math.max(0, Math.min(2 * rw, rw));
      softGlow(cx, bot[midK] + 3, Math.max(6, (rw * 0.45) | 0), PAL.cyan3);
    }
    // hanging vines from the surface lip and the underside
    const nV = opts.vines ?? (3 + ((rnd() * 3) | 0));
    for (let s = 0; s < nV; s++) {
      const edge = rnd() < 0.45;
      let k;
      if (edge) k = rnd() < 0.5 ? 1 + ((rnd() * 4) | 0) : 2 * rw - 1 - ((rnd() * 4) | 0);
      else k = ((rw * 0.35) | 0) + ((rnd() * rw) | 0);
      k = Math.max(0, Math.min(2 * rw, k));
      const vx = cx + (k - rw);
      const vy = edge ? surf[k] + 2 : bot[k];
      vine(vx, vy, 8 + ((rnd() * 16) | 0), rnd() * 6.28, rnd() < 0.34);
    }
    if (opts.lantern) {
      const k = Math.max(2, Math.min(2 * rw - 2, ((0.3 + rnd() * 0.4) * 2 * rw) | 0));
      lantern(cx + (k - rw), bot[k], 3 + ((rnd() * 3) | 0));
    }
  };

  // small drifting rock shard with mossy top
  const shard = (x, y, r) => {
    for (let j = 0; j <= r; j++) {
      const w = Math.max(0, Math.round((1 - j / (r + 1)) * r * 1.5));
      hspan(x - w, y + j, w * 2 + 1, j === 0 ? PAL.stone3 : j < r * 0.6 ? PAL.shadow : PAL.deepPurple);
    }
    hspan(x - ((r * 1.2) | 0), y - 1, ((r * 1.2) | 0) * 2 + 1, PAL.leaf3);
    px(x - ((r * 0.8) | 0), y - 1, PAL.leaf2);
    px(x - 1, y - 2, PAL.leaf2);
    px(x, y + r + 1, PAL.outline);
    if (r > 2 && rnd() < 0.8) px(x + 1, y + ((r * 0.5) | 0), PAL.violet3);
  };

  // ================= composition =================

  // faint back-plane silhouettes for depth (translucent, no detail)
  ctx.save();
  ctx.globalAlpha = 0.4;
  const ghost = (cx, topY, rw, depth) => {
    let jag = 0;
    for (let i = -rw; i <= rw; i++) {
      const t = i / rw;
      // roughened canopy line — small runs of jitter instead of a razor edge
      const sy = topY - Math.floor((1 - t * t) * 3)
        - ((rnd() < 0.3 ? 1 : 0) + (rnd() < 0.08 ? 1 : 0));
      jag += (rnd() - 0.5) * 2.4;
      jag *= 0.75;
      const by = topY + Math.floor(depth * Math.pow(Math.max(0, 1 - Math.abs(t)), 0.55) + jag);
      for (let y = sy; y <= by; y++) px(cx + i, y, y < sy + 3 ? PAL.skyGlow : PAL.skyLow);
      if (rnd() < 0.1) px(cx + i, sy - 1, PAL.skyGlow);   // stray canopy tufts
      if (rnd() < 0.12 && by > sy + 4) px(cx + i, by + 1, PAL.skyLow); // hanging grit
    }
  };
  ghost(45, 78, 52, 34);
  ghost(258, 152, 44, 28);
  ghost(468, 58, 60, 38);
  ghost(600, 196, 36, 22);
  ctx.restore();

  // main islands (spread heights, one wraps the seam at x≈640/0)
  island(112, 118, 76, 66, { crystals: 3, vines: 6, lantern: true });
  island(330, 66, 54, 48, { crystals: 2, vines: 4 });
  island(514, 148, 66, 56, { crystals: 2, vines: 5, lantern: true });
  island(636, 42, 34, 26, { crystals: 1, vines: 2 });   // wraps left<->right edge
  island(232, 196, 26, 20, { crystals: 1, vines: 2 });
  island(428, 208, 30, 24, { crystals: 1, vines: 3 });

  // drifting rock shards between islands
  shard(212, 92, 3);
  shard(268, 118, 2);
  shard(398, 118, 4);
  shard(454, 96, 2);
  shard(586, 92, 3);
  shard(58, 210, 3);
  shard(154, 232, 2);
  shard(330, 244, 3);
  shard(548, 236, 2);
  shard(622, 130, 2);

  // fireflies — faint biolum motes drifting between the islands, soft glow halos
  for (let i = 0; i < 22; i++) {
    const fx = rnd() * W, fy = 54 + rnd() * 190;
    const col = rnd() < 0.55 ? PAL.cyan0 : rnd() < 0.5 ? PAL.leaf0 : PAL.violet0;
    const bright = rnd() < 0.4;                     // brighter, nearer motes
    softGlow(fx, fy, bright ? 3 : 2, col);          // additive halo
    ctx.save();
    ctx.globalAlpha = bright ? 0.95 : 0.7;
    px(fx, fy, col);
    if (bright) { ctx.globalAlpha = 1; px(fx, fy, PAL.white); }  // hot white center
    ctx.restore();
  }

  return { canvas: c, factor: 0.4, tileX: true, y: 0, alpha: 1 };
}
