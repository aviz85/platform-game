// AETHERFALL — SENTINEL enemy sprite.
// Stationary turret totem: carved violet-stone base (ancient), rotating tech head
// (verdigris metal housing), amber core lens. Body ~16x22 inside a 22x24 frame
// (padding gives room for glow halos + muzzle flash).
//
// anims:
//   move   — 8 frames, idle head-scan: head glides left→center→right→center in
//            single-px steps (no stiff jumps), antenna lags with secondary sway,
//            core breathes once per cycle, a dim scan beam sweeps ahead of the lens
//            with a stippled falloff, status light blinks periodically.
//   attack — 4 frames, charge-up: core amber → gold → white-hot overload (heat
//            blooms across the housing, converging motes, anti-banding stipple halo)
//            → muzzle flash (head recoils, forked burst + shock stipple from the lens).
//
// Head is drawn lens-forward (facing right); the engine flips for facing = -1.
import { PAL, RAMPS } from './palette.js';
import { makeCanvas, P, R, line, outline, glow, shade, frameGrid } from './util.js';

const FW = 22, FH = 24;

// deterministic stipple ring/band — dithered soft edge (anti-banding) for emissive halos.
// places checker-parity pixels inside an annulus so the halo fades without hard steps.
function stipple(ctx, cx, cy, rOuter, rInner, color, phase = 0) {
  cx |= 0; cy |= 0;
  const ro2 = rOuter * rOuter, ri2 = rInner * rInner;
  for (let y = -rOuter; y <= rOuter; y++) {
    for (let x = -rOuter; x <= rOuter; x++) {
      const d = x * x + y * y;
      if (d <= ro2 && d >= ri2 && (((x + y + phase) & 1) === 0)) P(ctx, cx + x, cy + y, color);
    }
  }
}

// ---- static stone base (identical every frame — it's a rooted totem) ----
function drawBase(ctx, ox, oy) {
  const S0 = PAL.stone0, S1 = PAL.stone1, S2 = PAL.stone2, S3 = PAL.stone3;

  // bottom plinth slab
  R(ctx, ox + 4, oy + 21, 14, 1, S1);
  R(ctx, ox + 4, oy + 22, 14, 1, S2);
  R(ctx, ox + 5, oy + 23, 12, 1, S3);
  P(ctx, ox + 4, oy + 21, S0);                    // upper-left catchlight
  P(ctx, ox + 5, oy + 21, shade(S0, 0.25));       // catchlight rolloff (anti-band)
  P(ctx, ox + 17, oy + 21, S3);                   // shaded right edge
  P(ctx, ox + 17, oy + 22, PAL.violet3);          // cool ambient bounce on shadow edge
  // carved notches along the plinth
  for (const nx of [6, 9, 12, 15]) P(ctx, ox + nx, oy + 22, S3);

  // mid step
  R(ctx, ox + 5, oy + 19, 12, 1, S1);
  R(ctx, ox + 5, oy + 20, 12, 1, S2);
  P(ctx, ox + 5, oy + 19, S0);
  P(ctx, ox + 16, oy + 19, S3);
  P(ctx, ox + 16, oy + 20, S3);
  P(ctx, ox + 16, oy + 20, PAL.violet3);          // rim of ambient on the step corner

  // carved column
  R(ctx, ox + 7, oy + 14, 8, 5, S2);
  R(ctx, ox + 7, oy + 14, 8, 1, S1);              // lit top
  R(ctx, ox + 7, oy + 14, 1, 5, S1);              // lit left face
  P(ctx, ox + 7, oy + 14, S0);                    // hot corner
  R(ctx, ox + 14, oy + 14, 1, 5, S3);             // shaded right face
  P(ctx, ox + 14, oy + 17, PAL.violet3);          // cool rim bounce low-right
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
  P(ctx, ox + 12, oy + 12, PAL.metal3);           // shaded far end of collar
}

// ---- rotating tech head ----
// s: head x-shift (sweep/recoil), sway: antenna lag,
// core: [outerRing, innerRing, hot] colors
function drawHead(ctx, ox, oy, s, sway, core, blink) {
  const M0 = PAL.metal0, M1 = PAL.metal1, M2 = PAL.metal2, M3 = PAL.metal3;

  // antenna (back-left, lags behind the sweep) — drawn first so housing overlaps its root
  line(ctx, ox + 8 + s, oy + 4, ox + 8 + s + sway, oy + 1, M2);
  P(ctx, ox + 8 + s, oy + 4, M1);                 // lit lower joint
  P(ctx, ox + 8 + s + sway, oy + 1, PAL.cyan0);   // emissive tip

  // brow ridge
  R(ctx, ox + 7 + s, oy + 4, 8, 1, M2);
  P(ctx, ox + 7 + s, oy + 4, M0);

  // housing block — full 4-step metal ramp, light from upper-left
  R(ctx, ox + 5 + s, oy + 5, 12, 7, M1);
  R(ctx, ox + 5 + s, oy + 5, 12, 1, M0);          // lit top
  R(ctx, ox + 5 + s, oy + 5, 1, 7, M0);           // lit left
  R(ctx, ox + 6 + s, oy + 6, 10, 1, shade(M1, 0.18)); // soft interior highlight band (anti-band)
  R(ctx, ox + 16 + s, oy + 6, 1, 6, M2);          // shaded right
  R(ctx, ox + 5 + s, oy + 11, 12, 1, M3);         // dark underside
  P(ctx, ox + 5 + s, oy + 11, M2);
  P(ctx, ox + 16 + s, oy + 11, M3);               // deepest corner
  // cool ambient rim on the shadow edges (crystal-lit world bounce)
  P(ctx, ox + 16 + s, oy + 9, PAL.cyan3);
  P(ctx, ox + 15 + s, oy + 11, shade(PAL.cyan3, -0.2));

  // back vents (cooling slits)
  R(ctx, ox + 6 + s, oy + 7, 2, 1, M3);
  R(ctx, ox + 6 + s, oy + 9, 2, 1, M3);
  P(ctx, ox + 6 + s, oy + 8, shade(M0, 0.2));     // slit spec

  // cyan tech stripe + blinking status light
  R(ctx, ox + 6 + s, oy + 10, 3, 1, PAL.cyan2);
  P(ctx, ox + 6 + s, oy + 10, PAL.cyan1);
  P(ctx, ox + 10 + s, oy + 5, blink ? PAL.cyan0 : PAL.cyan2);

  // lens socket + amber core (forward = right)
  const cx = ox + 13 + s, cy = oy + 8;
  R(ctx, cx - 2, cy - 2, 5, 5, M3);               // dark socket
  P(ctx, cx - 2, cy - 2, M2);                     // socket bevel catches light
  P(ctx, cx + 2, cy + 2, PAL.void);               // deep socket shadow lower-right
  // core rings (3x3)
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
}

// glow passes drawn AFTER outline so halos read as light, not body
function drawGlows(ctx, ox, oy, s, sway, glowR, glowC) {
  glow(ctx, ox + 13 + s, oy + 8, glowR, glowC);           // core
  glow(ctx, ox + 11, oy + 16, 2, PAL.amber1);             // base rune
  stipple(ctx, ox + 11, oy + 16, 3, 2, PAL.amber2);       // rune halo, dithered edge
  glow(ctx, ox + 8 + s + sway, oy + 1, 1, PAL.cyan1);     // antenna tip
}

export function build() {
  const c = makeCanvas(FW * 8, FH * 2);
  const ctx = c.getContext('2d');

  // ---------- row 0: move (idle head-scan, 8 smooth frames) ----------
  // single-px glide so the sweep reads as continuous rotation, not a jump-cut.
  const sweep   = [-2, -1, 0, 1, 2, 1, 0, -1];
  // antenna lags opposite the instantaneous motion (right-moving 0..3, left-moving 4..7)
  const sway    = [-1, -1, -1, -2, 1, 1, 1, 2];
  // core breathes once per cycle (dim → bright → dim); glow radius follows
  const hot     = [PAL.amber0, PAL.amber0, PAL.gold0, PAL.gold0, PAL.gold0, PAL.amber0, PAL.amber0, PAL.amber0];
  const glowRad = [2, 2, 3, 3, 3, 2, 2, 2];
  const blinkOn = [false, true, false, false, false, true, false, false];
  for (let i = 0; i < 8; i++) {
    const ox = i * FW, oy = 0;
    drawBase(ctx, ox, oy);
    drawHead(ctx, ox, oy, sweep[i], sway[i], [PAL.amber2, PAL.amber1, hot[i]], blinkOn[i]);
    outline(ctx, ox, oy, FW, FH);
    drawGlows(ctx, ox, oy, sweep[i], sway[i], glowRad[i], PAL.amber1);
    // scan beam thrown ahead of the lens — brightest at the muzzle, stippled falloff (emissive)
    const bx = ox + 13 + sweep[i], by = oy + 8;
    P(ctx, bx + 3, by, PAL.amber0);
    P(ctx, bx + 4, by, PAL.amber1);
    P(ctx, bx + 5, by, shade(PAL.amber2, -0.25));
    // faint vertical spread on the bright breath frames
    if (glowRad[i] === 3) {
      P(ctx, bx + 3, by - 1, shade(PAL.amber2, -0.15));
      P(ctx, bx + 3, by + 1, shade(PAL.amber2, -0.15));
    }
  }

  // ---------- row 1: attack (charge-up → muzzle flash) ----------
  // f0 gather, f1 hotter, f2 white-hot overload, f3 recoil + muzzle flash
  const atkShift = [0, 0, 0, -1];
  const atkSway  = [0, -1, -2, 2];                // antenna whips forward on the shot
  // fuller white-hot ramp: amber → gold → white, with gold1 bridging tone to kill banding
  const cores = [
    [PAL.amber2, PAL.amber0, PAL.gold0],
    [PAL.amber1, PAL.gold0,  PAL.white],
    [PAL.gold1,  PAL.white,  PAL.white],
    [PAL.amber1, PAL.gold1,  PAL.gold0],          // core drained after discharge
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
    drawHead(ctx, ox, oy, s, atkSway[i], cores[i], true);
    // rune surges with the charge
    if (i >= 1) P(ctx, ox + 11, oy + 16, PAL.gold0);
    if (i === 2) P(ctx, ox + 11, oy + 16, PAL.white);
    // white-hot frame: heat blooms across the housing (rim-lit top + left face)
    if (i === 2) {
      R(ctx, ox + 5 + s, oy + 5, 12, 1, shade(PAL.metal0, 0.4));
      R(ctx, ox + 5 + s, oy + 5, 1, 4, shade(PAL.metal0, 0.25));
      P(ctx, ox + 16 + s, oy + 6, PAL.gold1);
      P(ctx, ox + 16 + s, oy + 7, PAL.gold0);
    }
    outline(ctx, ox, oy, FW, FH);
    drawGlows(ctx, ox, oy, s, atkSway[i], glowRs[i], glowCs[i]);
    const cx = ox + 13 + s, cy = oy + 8;
    // charge motes (emissive — after outline)
    for (const [mx, my, mc] of motes[i]) P(ctx, ox + mx, oy + my, mc);
    // white-hot overload: bright bleed ring + anti-banding stipple halo around the core
    if (i === 2) {
      P(ctx, cx + 2, cy, PAL.gold0); P(ctx, cx - 2, cy, PAL.gold0);
      P(ctx, cx, cy + 2, PAL.gold0); P(ctx, cx, cy - 2, PAL.gold0);
      stipple(ctx, cx, cy, 4, 3, PAL.gold0, 0);
      stipple(ctx, cx, cy, 6, 5, PAL.amber0, 1);   // soft dithered outer bloom
    }
    if (i === 1) stipple(ctx, cx, cy, 4, 3, PAL.amber0, 0);
    // f3: muzzle flash burst from the recoiled lens
    if (i === 3) {
      const fx = ox + 13 + s + 2, fy = oy + 8;      // just ahead of the recoiled lens
      R(ctx, fx, fy - 1, 3, 3, PAL.gold0);
      P(ctx, fx + 1, fy, PAL.white);
      P(ctx, fx, fy, PAL.white);
      line(ctx, fx + 3, fy, fx + 6, fy, PAL.white);        // forward ray
      P(ctx, fx + 7, fy, PAL.gold0);
      P(ctx, fx + 3, fy - 2, PAL.gold0);                   // diagonal rays
      P(ctx, fx + 4, fy - 3, PAL.gold1);
      P(ctx, fx + 3, fy + 2, PAL.gold0);
      P(ctx, fx + 4, fy + 3, PAL.gold1);
      P(ctx, fx - 1, fy - 2, PAL.gold1);                   // back-scatter sparks
      P(ctx, fx - 1, fy + 2, PAL.gold1);
      stipple(ctx, fx + 1, fy, 5, 3, PAL.gold0, 1);        // dithered shock ring
      // muzzle recoil smoke puffing back over the housing
      stipple(ctx, ox + 8 + s, oy + 8, 4, 2, shade(PAL.amber2, -0.3), 0);
      glow(ctx, fx + 1, fy, 4, PAL.gold0);
      glow(ctx, fx + 1, fy, 2, PAL.white);
    }
  }

  return {
    image: c,
    anims: {
      move:   { frames: frameGrid(FW, FH, 8, 0), fps: 8,  loop: true },
      attack: { frames: frameGrid(FW, FH, 4, 1), fps: 10, loop: false },
    },
    anchor: { x: FW / 2, y: FH },
  };
}
