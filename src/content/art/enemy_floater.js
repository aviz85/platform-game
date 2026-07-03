// AETHERFALL — enemy_floater: ethereal crystal jellyfish.
// Translucent violet bell with a glowing cyan crystal heart visible through the dome,
// scalloped skirt, and five trailing cyan tendrils that ripple with a travelling wave.
// anims: move (6 frames — bell pulse + tendril wave), attack (4 — gather → flash flare).
// Frame 16x20, anchor at feet-center (8,20). Light upper-left, PAL.outline outlines.
import { PAL } from './palette.js';
import { makeCanvas, P, R, outline, glow, shade, frameGrid } from './util.js';

const FW = 16, FH = 20;

// brighten a palette color by 0..1 (attack pulse), identity at 0
const lift = (c, b) => (b > 0 ? shade(c, b) : c);

/**
 * Draw one floater into frame (ox,oy).
 * wave  0..1  travelling-wave phase for tendrils / motes
 * pose -1..1  bell pulse: -1 stretched tall (gather), +1 contracted wide (push)
 * bob   px    whole-body vertical drift
 * bright 0..1 emissive intensity (attack)
 * flare 0..1  tendril outward splay (attack release)
 */
function drawFloater(ctx, ox, oy, { wave, pose, bob, bright, flare }) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(ox, oy, FW, FH);
  ctx.clip();

  const cx = ox + 8;

  // ---- palette for this frame (lifted when attack-bright) ----
  const bB = bright * 0.30;
  const v0 = lift(PAL.violet0, bB), v1 = lift(PAL.violet1, bB);
  const v2 = lift(PAL.violet2, bB), v3 = lift(PAL.violet3, bB * 0.8);
  const c0 = lift(PAL.cyan0, bB), c1 = lift(PAL.cyan1, bB);
  const c2 = lift(PAL.cyan2, bB), c3 = lift(PAL.cyan3, bB);

  // ---- bell geometry: pose>0 contracted (short/wide), pose<0 stretched (tall/narrow)
  const H = Math.max(7, Math.min(11, Math.round(9 - pose * 2))); // rows tall
  const rx = H >= 11 ? 5 : 6;
  let top = oy + 1 + Math.round((11 - H) / 2) + bob;
  top = Math.max(oy + 1, Math.min(oy + 4, top));
  const bot = top + H - 1;

  // ---- translucent dome, row by row (widest at the bottom lip) ----
  const vMid = lift(shade(PAL.violet2, -0.10), bB);        // extra in-between ramp step (anti-banding glass depth)
  const vRim = lift(shade(PAL.violet0, 0.18), bB);         // bright upper-left rim highlight
  for (let y = top; y <= bot; y++) {
    const u = (bot - y) / (bot - top);                     // 0 lip .. 1 crown
    const w = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (u * 0.94) ** 2)) + 0.35);
    // full vertical shade ramp: lit crown → glassy mid → deep mid → shaded lip
    let col = u > 0.66 ? v1 : u > 0.40 ? v2 : vMid;
    if (y <= top + 1) col = v1;                            // lit crown
    if (y >= bot - 1) col = v3;                            // shaded lip
    R(ctx, cx - w, y, w * 2 + 1, 1, col);
    // dither the deep-mid → lip transition so the translucent ramp never bands
    if (u > 0.14 && u < 0.34 && w >= 2) {
      P(ctx, cx - w + 1 + ((y & 1)), y, v3);
      P(ctx, cx + w - 1 - ((y & 1)), y, v3);
    }
    P(ctx, cx - w, y, y >= bot - 1 ? v3 : v1);             // left rim catches light
    if (u > 0.5) P(ctx, cx - w + 1, y, vRim);              // rim light on the lit upper-left curve
    P(ctx, cx + w, y, v3);                                 // right edge in shade
  }
  // interior depth: dark under-bell cavity + soft mid gradient (reads as glass)
  R(ctx, cx - rx + 2, bot, rx * 2 - 3, 1, PAL.deepPurple);
  for (let i = -rx + 3; i <= rx - 3; i++) {
    if ((i + bot) & 1) P(ctx, cx + i, bot - 2, v3);        // sparse dither, no banding
  }
  // glass sheen, upper-left
  P(ctx, cx - 2, top + 1, v0);
  P(ctx, cx - 3, top + 2, v0);
  P(ctx, cx - 4, top + 3, v1);
  P(ctx, cx - 1, top, v0);

  // ---- crystal heart, visible through the bell ----
  const coreY = top + Math.round(H * 0.5);
  P(ctx, cx, coreY - 1, c1);
  P(ctx, cx - 1, coreY, c1);
  P(ctx, cx + 1, coreY, c1);
  P(ctx, cx, coreY + 1, c2);
  P(ctx, cx - 1, coreY - 1, c2);
  P(ctx, cx + 1, coreY + 1, c3);
  P(ctx, cx, coreY, bright > 0.6 ? PAL.white : c0);        // hot pixel

  // ---- eyes: two glowing points with dark pupils, low on the bell ----
  const eyeY = bot - 3;
  for (const ex of [cx - 3, cx + 3]) {
    P(ctx, ex, eyeY + 1, PAL.outline);
    P(ctx, ex, eyeY, bright > 0.6 ? PAL.white : c0);
  }

  // ---- scalloped skirt fringe ----
  for (let x = cx - rx + 1; x <= cx + rx - 1; x += 2) P(ctx, x, bot + 1, v3);

  // outline the bell only (tendrils stay soft & luminous, drawn after)
  outline(ctx, ox, oy, FW, Math.min(FH, bot + 3 - oy));

  // ---- five trailing tendrils with a travelling wave (secondary motion) ----
  const baseX = [-4, -2, 0, 2, 4];
  const tipY = [oy + 16, oy + 18, oy + 19, oy + 18, oy + 16];
  const yStart = bot + 2;
  const tips = [];
  for (let ti = 0; ti < 5; ti++) {
    const tx = cx + baseX[ti];
    const len = Math.max(1, tipY[ti] - yStart);
    let prevX = null;
    for (let y = yStart; y <= tipY[ti]; y++) {
      const k = y - yStart;
      const amp = Math.min(2, 0.5 + k * 0.25);             // amplitude grows to the tip
      // two-harmonic sway: base swell + faster ripple → organic, non-uniform secondary motion
      const swell = Math.sin(wave * Math.PI * 2 - k * 0.8 + ti * 1.7);
      const ripple = 0.4 * Math.sin(wave * Math.PI * 4 - k * 0.55 + ti * 0.9);
      let xo = Math.round((swell + ripple) * amp * 0.86);
      if (flare > 0) xo += Math.sign(tx - cx || 1) * Math.round(flare * k / 4); // outward splay
      const f = k / len;
      const col = f < 0.3 ? c3 : f < 0.6 ? c2 : f < 0.85 ? c1 : c0; // 4-step ramp, brightening to the luminous tip
      const X = tx + xo;
      if (prevX !== null && Math.abs(X - prevX) > 1) {
        P(ctx, (X + prevX) >> 1, y, col);                  // bridge diagonal jumps — keep tendril connected
      }
      P(ctx, X, y, col);
      if (ti === 2 && k < 2) P(ctx, X + 1, y, c3);         // thicker center tendril root
      if (y === tipY[ti]) { P(ctx, X, y, bright > 0.6 ? PAL.white : c0); tips.push([X, y]); } // lit tip
      prevX = X;
    }
  }

  // ---- drifting motes (one inside the glass bell, one outside) ----
  const a = wave * Math.PI * 2;
  P(ctx, cx + Math.round(Math.cos(a) * 4), coreY - 1 + Math.round(Math.sin(a) * 2), c0);
  P(ctx, cx - Math.round(Math.cos(a) * 6), bot + 4 + Math.round(Math.sin(a + 2) * 2), v0);

  // ---- emissive glow: heart halo + crown rim + luminous tendril tips ----
  glow(ctx, cx, coreY, 4 + Math.round(bright * 3), bright > 0.5 ? PAL.cyan0 : PAL.cyan1);
  glow(ctx, cx - 2, top + 1, 2, PAL.violet0);
  for (const [tX, tY] of tips) glow(ctx, tX, tY, 1, bright > 0.6 ? PAL.white : PAL.cyan1); // tendril tips shed light
  if (bright > 0.4) glow(ctx, cx, coreY - 1, 5 + Math.round(bright * 4), lift(PAL.violet0, 0.12)); // whole-bell attack pulse
  if (flare >= 1) glow(ctx, cx, bot, 7, PAL.cyan0);        // release flash

  ctx.restore();
}

export function build() {
  const c = makeCanvas(FW * 6, FH * 2);
  const ctx = c.getContext('2d');

  // row 0 — move: continuous pulse, tendril wave travels down
  for (let i = 0; i < 6; i++) {
    const t = i / 6;
    drawFloater(ctx, i * FW, 0, {
      wave: t,
      pose: Math.sin(t * Math.PI * 2),
      bob: Math.round(Math.cos(t * Math.PI * 2)),
      bright: 0,
      flare: 0,
    });
  }

  // row 1 — attack: dim → gather tall (anticipation) → contract + flash (release) → settle
  const atk = [
    { wave: 0.00, pose: -0.4, bob: 0, bright: 0.15, flare: 0 },
    { wave: 0.25, pose: -1.0, bob: -1, bright: 0.5, flare: 0 },
    { wave: 0.50, pose: 1.0, bob: 1, bright: 1.0, flare: 1 },
    { wave: 0.75, pose: 0.3, bob: 0, bright: 0.35, flare: 0.4 },
  ];
  for (let i = 0; i < 4; i++) drawFloater(ctx, i * FW, FH, atk[i]);

  return {
    image: c,
    anims: {
      move: { frames: frameGrid(FW, FH, 6, 0), fps: 8, loop: true },
      attack: { frames: frameGrid(FW, FH, 4, 1), fps: 10, loop: true },
    },
    anchor: { x: FW / 2, y: FH },
  };
}
