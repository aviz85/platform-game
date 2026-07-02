// AETHERFALL — SENTINEL enemy sprite.
// Stationary turret totem: carved violet-stone base (ancient), rotating tech head
// (verdigris metal housing), amber core lens. Body ~16x22 inside a 22x24 frame
// (padding gives room for glow halos + muzzle flash).
//
// anims:
//   move   — 4 frames, idle scan: head sweeps left→center→right→center,
//            antenna lags with secondary sway, core pulses, dim scan pixel ahead of lens.
//   attack — 4 frames, charge-up: core amber → gold → white-hot (big glow, converging
//            motes) → muzzle flash (head recoils, bright burst from the lens).
//
// Head is drawn lens-forward (facing right); the engine flips for facing = -1.
import { PAL, RAMPS } from './palette.js';
import { makeCanvas, P, R, line, outline, glow, shade, frameGrid } from './util.js';

const FW = 22, FH = 24;

// ---- static stone base (identical every frame — it's a rooted totem) ----
function drawBase(ctx, ox, oy) {
  const S0 = PAL.stone0, S1 = PAL.stone1, S2 = PAL.stone2, S3 = PAL.stone3;

  // bottom plinth slab
  R(ctx, ox + 4, oy + 21, 14, 1, S1);
  R(ctx, ox + 4, oy + 22, 14, 1, S2);
  R(ctx, ox + 5, oy + 23, 12, 1, S3);
  P(ctx, ox + 4, oy + 21, S0);                    // upper-left catchlight
  P(ctx, ox + 17, oy + 21, S3);                   // shaded right edge
  // carved notches along the plinth
  for (const nx of [6, 9, 12, 15]) P(ctx, ox + nx, oy + 22, S3);

  // mid step
  R(ctx, ox + 5, oy + 19, 12, 1, S1);
  R(ctx, ox + 5, oy + 20, 12, 1, S2);
  P(ctx, ox + 5, oy + 19, S0);
  P(ctx, ox + 16, oy + 19, S3);
  P(ctx, ox + 16, oy + 20, S3);

  // carved column
  R(ctx, ox + 7, oy + 14, 8, 5, S2);
  R(ctx, ox + 7, oy + 14, 8, 1, S1);              // lit top
  R(ctx, ox + 7, oy + 14, 1, 5, S1);              // lit left face
  R(ctx, ox + 14, oy + 14, 1, 5, S3);             // shaded right face
  // vertical carving grooves
  line(ctx, ox + 9, oy + 15, ox + 9, oy + 18, S3);
  line(ctx, ox + 12, oy + 15, ox + 12, oy + 18, S3);

  // glowing amber rune diamond, carved into the column front
  P(ctx, ox + 11, oy + 15, PAL.amber1);
  P(ctx, ox + 10, oy + 16, PAL.amber1);
  P(ctx, ox + 12, oy + 16, PAL.amber1);
  P(ctx, ox + 11, oy + 17, PAL.amber1);
  P(ctx, ox + 11, oy + 16, PAL.amber0);           // hot center

  // pivot collar between stone and head
  R(ctx, ox + 8, oy + 13, 6, 1, PAL.metal3);      // dark seam ring
  R(ctx, ox + 9, oy + 12, 4, 1, PAL.metal2);
  P(ctx, ox + 9, oy + 12, PAL.metal1);
}

// ---- rotating tech head ----
// s: head x-shift (sweep/recoil), sway: antenna lag,
// core: [outerRing, innerRing, hot] colors, scan: dim pixel ahead of lens
function drawHead(ctx, ox, oy, s, sway, core, scan, blink) {
  const M0 = PAL.metal0, M1 = PAL.metal1, M2 = PAL.metal2, M3 = PAL.metal3;

  // antenna (back-left, lags behind the sweep) — drawn first so housing overlaps its root
  line(ctx, ox + 8 + s, oy + 4, ox + 8 + s + sway, oy + 1, M2);
  P(ctx, ox + 8 + s + sway, oy + 1, PAL.cyan0);   // emissive tip

  // brow ridge
  R(ctx, ox + 7 + s, oy + 4, 8, 1, M2);
  P(ctx, ox + 7 + s, oy + 4, M0);

  // housing block
  R(ctx, ox + 5 + s, oy + 5, 12, 7, M1);
  R(ctx, ox + 5 + s, oy + 5, 12, 1, M0);          // lit top
  R(ctx, ox + 5 + s, oy + 5, 1, 7, M0);           // lit left
  R(ctx, ox + 16 + s, oy + 6, 1, 6, M2);          // shaded right
  R(ctx, ox + 5 + s, oy + 11, 12, 1, M3);         // dark underside
  P(ctx, ox + 5 + s, oy + 11, M2);

  // back vents (cooling slits)
  R(ctx, ox + 6 + s, oy + 7, 2, 1, M3);
  R(ctx, ox + 6 + s, oy + 9, 2, 1, M3);

  // cyan tech stripe + blinking status light
  R(ctx, ox + 6 + s, oy + 10, 3, 1, PAL.cyan2);
  P(ctx, ox + 6 + s, oy + 10, PAL.cyan1);
  P(ctx, ox + 10 + s, oy + 5, blink ? PAL.cyan0 : PAL.cyan2);

  // lens socket + amber core (forward = right)
  const cx = ox + 13 + s, cy = oy + 8;
  R(ctx, cx - 2, cy - 2, 5, 5, M3);               // dark socket
  P(ctx, cx - 2, cy - 2, M2);                     // socket bevel catches light
  // core rings
  P(ctx, cx - 1, cy - 1, core[0]);
  P(ctx, cx,     cy - 1, core[0]);
  P(ctx, cx + 1, cy - 1, core[0]);
  P(ctx, cx - 1, cy,     core[0]);
  P(ctx, cx + 1, cy,     core[0]);
  P(ctx, cx - 1, cy + 1, core[0]);
  P(ctx, cx,     cy + 1, core[0]);
  P(ctx, cx + 1, cy + 1, core[0]);
  P(ctx, cx,     cy - 1, core[1]);
  P(ctx, cx - 1, cy,     core[1]);
  P(ctx, cx,     cy,     core[2]);                // hot pixel
  // dim scan light thrown ahead of the lens
  if (scan) P(ctx, cx + 3, cy, shade(PAL.amber1, -0.35));
}

// glow passes drawn AFTER outline so halos read as light, not body
function drawGlows(ctx, ox, oy, s, sway, glowR, glowC) {
  glow(ctx, ox + 13 + s, oy + 8, glowR, glowC);           // core
  glow(ctx, ox + 11, oy + 16, 2, PAL.amber1);             // base rune
  glow(ctx, ox + 8 + s + sway, oy + 1, 1, PAL.cyan1);     // antenna tip
}

export function build() {
  const c = makeCanvas(FW * 4, FH * 2);
  const ctx = c.getContext('2d');

  // ---------- row 0: move (idle scan sweep) ----------
  const sweep = [-2, 0, 2, 0];
  const sway  = [1, 0, -1, 0];                    // antenna lags opposite the sweep
  for (let i = 0; i < 4; i++) {
    const ox = i * FW, oy = 0;
    const pulse = i === 3;                        // core breathes on the return frame
    drawBase(ctx, ox, oy);
    drawHead(ctx, ox, oy, sweep[i], sway[i],
      [PAL.amber2, PAL.amber1, pulse ? PAL.gold0 : PAL.amber0],
      true, i === 1);
    outline(ctx, ox, oy, FW, FH);
    drawGlows(ctx, ox, oy, sweep[i], sway[i], pulse ? 3 : 2, PAL.amber1);
  }

  // ---------- row 1: attack (charge-up → muzzle flash) ----------
  // f0 gather, f1 hotter, f2 white-hot overload, f3 recoil + muzzle flash
  const atkShift = [0, 0, 0, -1];
  const atkSway  = [0, -1, -1, 1];                // antenna whips on the shot
  const cores = [
    [PAL.amber2, PAL.amber0, PAL.gold0],
    [PAL.amber1, PAL.gold0,  PAL.white],
    [PAL.gold0,  PAL.white,  PAL.white],
    [PAL.gold1,  PAL.gold0,  PAL.white],
  ];
  const glowRs = [3, 4, 5, 4];
  const glowCs = [PAL.amber1, PAL.amber0, PAL.gold0, PAL.gold0];
  // converging energy motes per charge frame (deterministic, hand-placed spiral-in)
  const motes = [
    [[18, 4, PAL.amber1], [10, 12, PAL.amber1], [17, 12, PAL.amber2], [9, 3, PAL.amber2]],
    [[16, 5, PAL.amber0], [12, 11, PAL.gold0],  [17, 9,  PAL.amber0], [10, 4, PAL.amber1]],
    [[15, 6, PAL.gold0],  [13, 10, PAL.white],  [16, 7,  PAL.gold0],  [11, 5, PAL.gold0]],
    [],
  ];
  for (let i = 0; i < 4; i++) {
    const ox = i * FW, oy = FH;
    const s = atkShift[i];
    drawBase(ctx, ox, oy);
    drawHead(ctx, ox, oy, s, atkSway[i], cores[i], false, true);
    // rune surges with the charge
    if (i >= 1) P(ctx, ox + 11, oy + 16, PAL.gold0);
    // white-hot frame: rim-light the whole housing top with heat
    if (i === 2) {
      R(ctx, ox + 5 + s, oy + 5, 12, 1, shade(PAL.metal0, 0.35));
      P(ctx, ox + 16 + s, oy + 6, PAL.gold1);
    }
    outline(ctx, ox, oy, FW, FH);
    drawGlows(ctx, ox, oy, s, atkSway[i], glowRs[i], glowCs[i]);
    // charge motes (emissive — after outline)
    for (const [mx, my, mc] of motes[i]) P(ctx, ox + mx, oy + my, mc);
    // f3: muzzle flash burst from the lens
    if (i === 3) {
      const fx = ox + 13 + s + 2, fy = oy + 8;    // just ahead of the recoiled lens
      R(ctx, fx, fy - 1, 3, 3, PAL.gold0);
      P(ctx, fx + 1, fy, PAL.white);
      P(ctx, fx, fy, PAL.white);
      line(ctx, fx + 3, fy, fx + 6, fy, PAL.white);      // forward ray
      P(ctx, fx + 7, fy, PAL.gold0);
      P(ctx, fx + 3, fy - 2, PAL.gold0);                 // diagonal rays
      P(ctx, fx + 4, fy - 3, PAL.gold1);
      P(ctx, fx + 3, fy + 2, PAL.gold0);
      P(ctx, fx + 4, fy + 3, PAL.gold1);
      P(ctx, fx - 1, fy - 2, PAL.gold1);                 // back-scatter sparks
      P(ctx, fx - 1, fy + 2, PAL.gold1);
      glow(ctx, fx + 1, fy, 4, PAL.gold0);
      glow(ctx, fx + 1, fy, 2, PAL.white);
    }
  }

  return {
    image: c,
    anims: {
      move:   { frames: frameGrid(FW, FH, 4, 0), fps: 5,  loop: true },
      attack: { frames: frameGrid(FW, FH, 4, 1), fps: 10, loop: false },
    },
    anchor: { x: FW / 2, y: FH },
  };
}
