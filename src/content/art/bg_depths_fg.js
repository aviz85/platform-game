// AETHERFALL — bg_depths_fg
// Neon Depths FOREGROUND layer: sagging cable bundles, industrial pipe runs
// with flanges + valve wheels, junction boxes and broken conduit stumps
// hugging the bottom ~80px of the screen — near-black silhouettes kissed by a
// faint MAGENTA rim light (upper-left) with rare hot LED pixels. Drawn in
// FRONT of gameplay at parallax factor 1.3 — deliberately sparse and mostly
// transparent so it frames the action without ever hiding it. Tiles
// horizontally seamlessly (all drawing goes through a wrapping pixel putter).
import { PAL } from './palette.js';
import { makeCanvas, P, rng, shade } from './util.js';

export function build() {
  const W = 960, H = 270;
  const TOPLIMIT = H - 80;            // content never rises above bottom 80px
  const c = makeCanvas(W, H);
  const ctx = c.getContext('2d');
  const rnd = rng(553311);

  // silhouette tones — near PAL.outline, never pure black
  const SIL = PAL.outline;            // #1a1030 body
  const SIL_D = PAL.void;             // #0b0716 shaded (lower-right)
  const SIL_L = PAL.deepPurple;       // #241537 lit (upper-left)
  const RIM = PAL.magenta3;           // faint magenta rim
  const RIM_B = PAL.magenta2;         // brighter rim sparkle
  const RIM_HOT = PAL.magenta1;       // hot LED / spark
  const RIM_CORE = PAL.magenta0;      // rare white-hot core pixel

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
  // tiny soft LED halo (glow() isn't wrap-safe, so do it by hand)
  const led = (x, y, hot = true) => {
    if (hot) px(x, y, RIM_CORE); else px(x, y, RIM_HOT);
    pxA(x + 1, y, RIM_HOT, 0.35); pxA(x - 1, y, RIM_HOT, 0.35);
    pxA(x, y + 1, RIM_HOT, 0.35); pxA(x, y - 1, RIM_HOT, 0.35);
    pxA(x + 1, y + 1, RIM, 0.18); pxA(x - 1, y - 1, RIM, 0.18);
    pxA(x + 1, y - 1, RIM, 0.18); pxA(x - 1, y + 1, RIM, 0.18);
  };

  // ============================================================
  // 1) Broken metal deck fringe along the very bottom — flat riveted
  //    plate segments with real gaps so the layer stays transparent
  // ============================================================
  const TAU = Math.PI * 2;
  for (let x = 0; x < W; x++) {
    const u = x / W;
    // integer-frequency gates => the pattern wraps seamlessly
    const gate = Math.sin(TAU * (u * 6 + 0.21)) + 0.6 * Math.sin(TAU * (u * 13 + 0.57));
    if (gate < -0.45) continue;      // gap — see straight through to gameplay
    const h = Math.max(2, Math.round(
      3 + 1.6 * Math.sin(TAU * (u * 4 + 0.11)) + 1.1 * Math.sin(TAU * (u * 9 + 0.66))
    ));
    for (let j = 0; j < h; j++) {
      const y = H - 1 - j;
      px(x, y, j === h - 1 ? SIL : (j < 1 ? SIL_D : SIL));
    }
    // rivet studs + whisper of magenta catching plate crests
    if ((x % 17) === 3) px(x, H - h, SIL_L);
    if (rnd() < 0.05) pxA(x, H - h - 1, RIM, 0.3);
  }

  // ============================================================
  // shape drawers
  // ============================================================

  // horizontal pipe run: cylinder shading + sparse magenta top rim
  function hpipe(xa, xb, cy, r) {
    for (let x = xa; x <= xb; x++) {
      for (let dy = -r; dy <= r; dy++) {
        const col = dy === -r ? SIL_L : (dy >= r - 1 ? SIL_D : SIL);
        px(x, cy + dy, col);
      }
      if (rnd() < 0.5) pxA(x, cy - r, RIM, 0.5);          // top rim light
      if (rnd() < 0.12) pxA(x, cy - r, RIM_B, 0.45);      // brighter glints
      if (rnd() < 0.1) pxA(x, cy - r + 1, RIM_B, 0.3);    // spec line
    }
  }

  // bolted flange coupling on a horizontal pipe
  function flange(x, cy, r) {
    for (let dy = -r - 2; dy <= r + 2; dy++) {
      px(x, cy + dy, dy <= -r - 1 ? SIL_L : SIL);
      px(x + 1, cy + dy, dy >= r + 1 ? SIL_D : SIL);
    }
    px(x, cy - r - 1, SIL_L); px(x + 1, cy - r - 1, SIL_L);  // bolt heads
    px(x, cy + r + 1, SIL_D); px(x + 1, cy + r + 1, SIL_D);
    pxA(x, cy - r - 2, RIM_B, 0.45);                         // rim on the lip
    pxA(x - 1, cy - r - 1, RIM, 0.3);
  }

  // vertical pipe from yTop down into the deck, coupling bands + left rim
  function vpipe(cx, yTop, r) {
    yTop = Math.max(yTop, TOPLIMIT + 2);
    for (let y = yTop; y < H; y++) {
      for (let dx = -r; dx <= r; dx++) {
        const col = dx === -r ? SIL_L : (dx >= r - 1 ? SIL_D : SIL);
        px(cx + dx, y, col);
      }
      // left rim light, strongest near the (upper-left lit) top
      const nearTop = 1 - Math.min(1, (y - yTop) / 26);
      if (rnd() < 0.3 + 0.4 * nearTop) pxA(cx - r, y, RIM, 0.5);
      if (rnd() < 0.05 + 0.1 * nearTop) pxA(cx - r, y, RIM_B, 0.4);
      if (rnd() < 0.06) pxA(cx - r + 1, y, RIM_B, 0.3);
    }
    // top cap collar
    for (let dx = -r - 1; dx <= r + 1; dx++) {
      px(cx + dx, yTop - 1, SIL);
      px(cx + dx, yTop - 2, dx <= 0 ? SIL_L : SIL);
    }
    pxA(cx - r - 1, yTop - 2, RIM_B, 0.5);
    pxA(cx - r, yTop - 3, RIM, 0.35);
    // coupling bands
    for (let y = yTop + 9; y < H - 4; y += 14) {
      for (let dx = -r - 1; dx <= r + 1; dx++) {
        px(cx + dx, y, SIL_D);
        px(cx + dx, y - 1, dx <= -r ? SIL_L : SIL);
      }
      pxA(cx - r - 1, y - 1, RIM, 0.4);
    }
  }

  // sagging cable: parabola between two anchor points, occasional rim on top
  function cable(x0, y0, x1, y1, sag, thick = 1) {
    const n = Math.max(8, Math.abs(x1 - x0));
    let px0 = null, py0 = null;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const xt = x0 + (x1 - x0) * t;
      const yt = y0 + (y1 - y0) * t + sag * 4 * t * (1 - t);
      if (px0 !== null) {
        // fill vertical steps so steep cables stay connected
        const steps = Math.abs(Math.round(yt) - Math.round(py0));
        for (let s = 1; s <= steps; s++) {
          px(px0, py0 + Math.sign(yt - py0) * s, SIL);
        }
      }
      px(xt, yt, SIL);
      if (thick > 1) px(xt, yt + 1, SIL_D);
      // magenta kiss along the upper face, biased toward the left half
      if (rnd() < (t < 0.5 ? 0.16 : 0.07)) pxA(xt, yt - 1, RIM, 0.35);
      px0 = Math.round(xt); py0 = Math.round(yt);
    }
  }

  // bundle: several cables of varied sag between two posts + tie clamps
  function cableBundle(x0, y0, x1, y1, baseSag, count) {
    for (let k = 0; k < count; k++) {
      cable(x0, y0 + k, x1, y1 + k, baseSag + k * 3 + Math.floor(rnd() * 2), k === count - 1 ? 2 : 1);
    }
    // tie clamps pinching the bundle at thirds
    for (const t of [0.33, 0.66]) {
      const xt = x0 + (x1 - x0) * t;
      const yt = y0 + (y1 - y0) * t + baseSag * 4 * t * (1 - t) + Math.floor(count / 2);
      for (let dy = -1; dy <= count + 1; dy++) px(xt, yt + dy, SIL_D);
      px(xt, yt - 2, SIL_L);
      pxA(xt, yt - 3, RIM, 0.4);
    }
  }

  // frayed cable hanging from a point, sparking at the tip
  function frayed(x, y, len, swayDir) {
    let xx = x;
    for (let j = 0; j < len; j++) {
      if (j > 2 && rnd() < 0.3) xx += swayDir;
      px(xx, y + j, j > len - 3 ? SIL_L : SIL);
    }
    // split copper ends
    px(xx - 1, y + len, SIL_L); px(xx + 1, y + len, SIL_L);
    led(xx, y + len + 1, true);                       // spark
    pxA(xx, y + len + 2, RIM_B, 0.3);
  }

  // valve wheel mounted on a pipe (circle + cross spokes)
  function valve(cx, cy, r) {
    for (let a = 0; a < 24; a++) {
      const th = (a / 24) * TAU;
      const vx = cx + Math.round(Math.cos(th) * r);
      const vy = cy + Math.round(Math.sin(th) * r);
      px(vx, vy, th > Math.PI * 0.9 && th < Math.PI * 1.7 ? SIL_L : SIL);
    }
    for (let d = -r + 1; d <= r - 1; d++) { px(cx + d, cy, SIL); px(cx, cy + d, SIL); }
    px(cx, cy, SIL_L);                                 // hub
    px(cx, cy - r - 1, SIL);                           // stem
    pxA(cx - Math.round(r * 0.7), cy - Math.round(r * 0.7), RIM_HOT, 0.6); // rim glint
    pxA(cx - Math.round(r * 0.7) + 1, cy - Math.round(r * 0.7) - 1, RIM_B, 0.4);
    pxA(cx - r, cy, RIM, 0.4);
  }

  // junction box with status LED and stubby conduits
  function junctionBox(bx, by, w, h) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const col = (i === 0 || j === 0) ? SIL_L : ((i === w - 1 || j === h - 1) ? SIL_D : SIL);
      px(bx + i, by + j, col);
    }
    // vent slits
    for (let j = 2; j < h - 2; j += 2) px(bx + 2, by + j, SIL_D);
    led(bx + w - 3, by + 2, true);                     // status LED
    for (let i = 0; i < w; i++) if (rnd() < 0.4) pxA(bx + i, by - 1, RIM, 0.35);
  }

  // faint steam wisp rising from a vent point (very low alpha, deterministic)
  function steam(sx, sy, hgt) {
    let xx = sx;
    for (let j = 0; j < hgt; j++) {
      if (rnd() < 0.4) xx += rnd() < 0.5 ? -1 : 1;
      const a = 0.16 * (1 - j / hgt);
      pxA(xx, sy - j, PAL.stone1, a);
      if (rnd() < 0.3) pxA(xx + 1, sy - j, PAL.stone2, a * 0.7);
    }
  }

  // ============================================================
  // 2) Sparse scene composition — clusters with generous gaps
  // ============================================================

  // — cluster A (x ~ 20-130): main pipe run w/ flanges, riser + valve wheel
  hpipe(8, 122, H - 12, 4);
  flange(34, H - 12, 4);
  flange(96, H - 12, 4);
  vpipe(64, TOPLIMIT + 16, 3);
  valve(64, TOPLIMIT + 9, 5);
  led(52, H - 17, false);                              // dim pipe-status lamp
  steam(98, H - 17, 16);

  // — cluster B (x ~ 200-300): cable bundle sagging between two conduit posts
  vpipe(204, H - 56, 2);
  vpipe(296, H - 48, 2);
  cableBundle(206, H - 54, 294, H - 46, 8, 3);
  frayed(252, H - 34, 12, 1);                          // snapped strand, sparking
  // stray ground cable slithering off the post
  cable(296, H - 4, 344, H - 2, 2, 1);

  // — cluster C (x ~ 400-440): junction box on a stub + conduit drop
  vpipe(420, H - 40, 3);
  junctionBox(408, H - 40, 24, 14);
  cable(408, H - 33, 372, H - 2, 6, 1);                // conduit draping to deck
  steam(432, H - 41, 12);

  // — cluster D (x ~ 540-680): the layer's landmark — big elbow pipe + drape
  vpipe(566, TOPLIMIT + 4, 5);                         // tall riser
  hpipe(566, 668, H - 34, 4);                          // shoulder run
  flange(590, H - 34, 4);
  flange(646, H - 34, 4);
  vpipe(664, H - 34, 3);                               // drop leg
  valve(566, TOPLIMIT + 12, 4);
  cableBundle(572, H - 29, 662, H - 29, 10, 2);        // cables slung under the run
  led(612, H - 39, true);
  frayed(636, H - 30, 9, -1);

  // — cluster E (x ~ 770-820): broken pipe stump venting steam
  vpipe(788, H - 30, 4);
  // jagged broken lip
  px(784, H - 31, SIL); px(785, H - 32, SIL_L); px(787, H - 31, SIL);
  px(790, H - 33, SIL); px(791, H - 32, SIL_L); px(792, H - 31, SIL_D);
  pxA(785, H - 33, RIM_B, 0.5); pxA(790, H - 34, RIM, 0.4);
  steam(788, H - 33, 22);
  steam(790, H - 35, 14);
  cable(792, H - 26, 828, H - 2, 5, 1);                // loose line to the deck

  // — cluster F (x ~ 900 .. wraps past seam): bundle crossing the seam
  vpipe(902, H - 50, 2);
  vpipe(970, H - 44, 2);                               // x 970 wraps to x 10
  cableBundle(904, H - 48, 968, H - 42, 7, 3);         // spans the seam cleanly
  led(902, H - 52, false);

  // ============================================================
  // 3) Faint neon motes drifting in the fringe band (dust catching
  //    magenta light) — sells depth without clutter
  // ============================================================
  for (let i = 0; i < 8; i++) {
    const fx = Math.floor(rnd() * W);
    const fy = TOPLIMIT + 14 + Math.floor(rnd() * 50);
    pxA(fx, fy, RIM_HOT, 0.4);
    pxA(fx + 1, fy, RIM, 0.14);
    pxA(fx - 1, fy, RIM, 0.14);
    pxA(fx, fy + 1, RIM, 0.14);
    pxA(fx, fy - 1, RIM, 0.14);
  }

  // ground the layer: darken the extreme bottom row against the level edge
  ctx.globalAlpha = 0.6;
  for (let x = 0; x < W; x++) px(x, H - 1, shade(SIL_D, -0.3));
  ctx.globalAlpha = 1;

  return {
    canvas: c,
    factor: 1.3,       // fg parallax — slides slightly faster than gameplay
    tileX: true,
    y: 0,              // hug the level bottom
    front: true,       // drawn over gameplay (kept sparse so it never obscures)
    autoScroll: 0,
    alpha: 1,
  };
}
