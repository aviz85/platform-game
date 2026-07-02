// AETHERFALL — enemy_wraith: spectral hooded ghost of the lost civilization.
// Violet robes fading into drifting wisps, burning magenta ember eyes,
// a faint magenta rune smoldering on its chest. Faces RIGHT (engine flips).
//
// anims:
//   move   — 6 frames, row 0: slow drifting bob, wisp tails sway, robe trail motes behind
//   attack — 4 frames, row 1: rear-up anticipation → claw lunge with magenta slash arc → recover
//   dim    — 4 frames, row 2: semi-faded phase — drawn with checker-sparse pixels
//            (alternating phase per frame = spectral shimmer), no outline, ember eyes only
//
// Frame 18x22. Only palette colors + util helpers. Fully deterministic.
import { PAL } from './palette.js';
import { makeCanvas, P, outline, glow, frameGrid } from './util.js';

const FW = 18, FH = 22;

const V0 = PAL.violet0, V1 = PAL.violet1, V2 = PAL.violet2, V3 = PAL.violet3;
const M0 = PAL.magenta0, M1 = PAL.magenta1, M2 = PAL.magenta2;
const DK = PAL.deepPurple, VD = PAL.void, SH = PAL.shadow;

export function build() {
  const c = makeCanvas(FW * 6, FH * 3);
  const ctx = c.getContext('2d');

  // ---- row 0: move (drift) ----
  for (let i = 0; i < 6; i++) {
    const ph = (i / 6) * Math.PI * 2;
    wraith(ctx, i * FW, 0, {
      bob: Math.round(Math.sin(ph) * 1.2),
      tailPh: ph,
      pose: 'drift',
      trail: i,
      sparse: 0,
      eye: 1,
    });
  }

  // ---- row 1: attack (claw lunge) ----
  const atk = [
    { pose: 'rear',    bob: -1, eye: 2, tailPh: 0.6 }, // anticipation: rear up, claws raised, eyes flare
    { pose: 'lunge',   bob: 0,  eye: 2, tailPh: 2.2 }, // dart forward, claws out
    { pose: 'lunge2',  bob: 1,  eye: 2, tailPh: 3.8 }, // full extension + slash arc
    { pose: 'recover', bob: 0,  eye: 1, tailPh: 5.2 }, // settle back
  ];
  for (let i = 0; i < 4; i++) {
    wraith(ctx, i * FW, FH, { sparse: 0, trail: -1, ...atk[i] });
  }

  // ---- row 2: dim (semi-faded — sparser pixels ≈ lower alpha) ----
  for (let i = 0; i < 4; i++) {
    const ph = (i / 4) * Math.PI * 2;
    wraith(ctx, i * FW, FH * 2, {
      bob: Math.round(Math.sin(ph) * 1.2),
      tailPh: ph + 0.9,
      pose: 'drift',
      trail: -1,
      sparse: 1 + (i & 1), // alternate checker phase per frame → shimmer
      eye: 0,
    });
  }

  return {
    image: c,
    anims: {
      move:   { frames: frameGrid(FW, FH, 6, 0), fps: 8,  loop: true },
      attack: { frames: frameGrid(FW, FH, 4, 1), fps: 10, loop: false },
      dim:    { frames: frameGrid(FW, FH, 4, 2), fps: 6,  loop: true },
    },
    anchor: { x: FW / 2, y: FH },
  };
}

// Draw one wraith frame at (ox,oy).
// o: { bob, tailPh, pose, trail, sparse, eye }
//   pose: 'drift' | 'rear' | 'lunge' | 'lunge2' | 'recover'
//   sparse: 0 = solid; 1|2 = checker mask phase (dim variant)
//   eye: 0 = dim embers, 1 = lit, 2 = attack flare
function wraith(ctx, ox, oy, o) {
  const sp = o.sparse | 0;

  // masked plotter (frame-local coords, clipped to frame)
  const px = (x, y, cc) => {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= FW || y >= FH) return;
    if (sp && ((x + y + sp) & 1)) return;
    P(ctx, ox + x, oy + y, cc);
  };
  // unmasked plotter for emissive bits that must survive the sparse mask
  const ep = (x, y, cc) => {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= FW || y >= FH) return;
    P(ctx, ox + x, oy + y, cc);
  };
  const hl = (x0, x1, y, cc) => { for (let x = x0; x <= x1; x++) px(x, y, cc); };

  const b = o.bob | 0;
  const pose = o.pose;
  const L = pose === 'rear' ? -1 : pose === 'lunge' ? 2 : pose === 'lunge2' ? 3 : pose === 'recover' ? 1 : 0;
  // head bob/duck. rear rises with the body bob only (an extra -1 would push the
  // hood peak to y=-1 and clip it off the frame top).
  const hy = b + (pose === 'lunge2' ? 1 : 0);

  // ================= wisp tails (behind body) =================
  const roots = [5, 8, 12];
  const lens = [4, 6, 5];
  for (let k = 0; k < 3; k++) {
    for (let j = 0; j < lens[k]; j++) {
      const sw = Math.round(Math.sin(o.tailPh + k * 2.1 + j * 0.8) * (0.5 + j * 0.5));
      const y = 15 + b + j;
      const cc = j < 2 ? V3 : j < 4 ? DK : SH;
      px(roots[k] + sw, y, cc);
      if (j === 0) px(roots[k] + sw - 1, y, DK); // wider root, shadow side
    }
  }

  // ================= robe body =================
  // collar (shows behind hood when head leans)
  hl(5, 12, 8 + b, V2);
  // shoulders — light from upper-left: left lit, right shaded
  hl(3, 14, 9 + b, V2);
  px(3, 9 + b, V1); px(4, 9 + b, V1); px(5, 9 + b, V1);
  hl(12, 14, 9 + b, V3);
  hl(3, 14, 10 + b, V2);
  px(3, 10 + b, V0); px(4, 10 + b, V1);
  hl(12, 14, 10 + b, V3);
  hl(4, 13, 11 + b, V2);
  px(4, 11 + b, V1);
  hl(11, 13, 11 + b, V3);
  hl(4, 13, 12 + b, V2);
  px(4, 12 + b, V1);
  hl(11, 13, 12 + b, V3);
  // cloth fold shadows
  px(6, 11 + b, V3); px(6, 12 + b, V3); px(9, 12 + b, V3);
  // ragged hem
  hl(4, 13, 13 + b, V3);
  px(4, 13 + b, V2); px(7, 13 + b, DK); px(11, 13 + b, DK);
  // tail roots
  hl(4, 5, 14 + b, V3); hl(7, 9, 14 + b, V3); hl(11, 12, 14 + b, V3);
  px(8, 14 + b, DK);
  // chest rune base (emissive core added after outline)
  px(8, 11 + b, M2); px(9, 11 + b, M2);

  // ================= hood + head (drawn over body) =================
  // hood peak, tiny sway = secondary motion
  px(8 + L + (Math.sin(o.tailPh + 1) > 0.4 ? 1 : 0), hy + 1, V1);
  hl(7 + L, 9 + L, hy + 2, V1); px(7 + L, hy + 2, V0);
  hl(6 + L, 10 + L, hy + 3, V1); px(6 + L, hy + 3, V0); px(10 + L, hy + 3, V2);
  hl(5 + L, 11 + L, hy + 4, V2);
  px(5 + L, hy + 4, V0); px(6 + L, hy + 4, V1); px(7 + L, hy + 4, V1); px(11 + L, hy + 4, V3);
  hl(4 + L, 12 + L, hy + 5, V2);
  px(4 + L, hy + 5, V0); px(5 + L, hy + 5, V1); px(12 + L, hy + 5, V3);
  // hood rim + void face
  px(4 + L, hy + 6, V1); px(5 + L, hy + 6, V2);
  hl(6 + L, 11 + L, hy + 6, VD);
  px(12 + L, hy + 6, V3);
  px(4 + L, hy + 7, V1); px(5 + L, hy + 7, V2);
  hl(6 + L, 11 + L, hy + 7, VD);
  px(12 + L, hy + 7, V3);
  px(4 + L, hy + 8, V2); px(5 + L, hy + 8, V2);
  hl(6 + L, 11 + L, hy + 8, DK);
  px(12 + L, hy + 8, V3);

  // ================= arms / claws =================
  if (pose === 'rear') {
    // both claw-hands raised beside the hood
    px(3 + L, hy + 7, V2); px(3 + L, hy + 6, V2);          // left sleeve
    px(2 + L, hy + 5, V1);                                  // left hand
    px(1 + L, hy + 4, V0); px(2 + L, hy + 4, V0);           // left claws
    px(13 + L, hy + 7, V3); px(13 + L, hy + 6, V2);         // right sleeve
    px(14 + L, hy + 5, V1);                                 // right hand
    px(14 + L, hy + 4, V0); px(15 + L, hy + 4, V0);         // right claws
  } else if (pose === 'lunge' || pose === 'lunge2') {
    // forward arm extended, three raking claws
    px(12, 9 + b, V2); px(13, 9 + b, V2);                   // sleeve
    px(14, 8 + b, V1); px(15, 8 + b, V1);                   // hand
    px(16, 6 + b, V0);                                      // claw A
    px(16, 8 + b, V0);                                      // claw B
    px(16, 10 + b, V0);                                     // claw C
  } else if (pose === 'recover') {
    px(12, 9 + b, V2); px(13, 8 + b, V1); px(14, 8 + b, V0);
  }

  // ================= outline (skip for dim — it stays spectral) =================
  if (!sp) outline(ctx, ox, oy, FW, FH);

  // ================= emissive pass (after outline: glows, hot pixels) =================
  const ex1 = 7 + L, ex2 = 10 + L, ey = hy + 7;
  if (o.eye === 0) {
    // dim embers, no halo
    ep(ex1, ey, M2); ep(ex2, ey, M2);
  } else if (o.eye === 1) {
    glow(ctx, ox + ex1, oy + ey, 2, M1);
    glow(ctx, ox + ex2, oy + ey, 2, M1);
    ep(ex1, ey, M0); ep(ex2, ey, M0);
    ep(ex1, ey + 1, M2); ep(ex2, ey + 1, M2); // under-eye smolder
  } else {
    // attack flare — wide burning eyes
    glow(ctx, ox + ex1, oy + ey, 3, M1);
    glow(ctx, ox + ex2 + 1, oy + ey, 3, M1);
    ep(ex1, ey, M0); ep(ex1 + 1, ey, M1);
    ep(ex2, ey, M0); ep(ex2 + 1, ey, M1);
  }

  // chest rune core
  if (o.eye > 0) {
    glow(ctx, ox + 8, oy + 11 + b, 2, M1);
    ep(8, 11 + b, M1); ep(9, 11 + b, M0);
  }

  // claw tips ignite magenta on the lunge
  if (pose === 'lunge' || pose === 'lunge2') {
    ep(17, 5 + b, M1); ep(17, 8 + b, M1); ep(17, 11 + b, M1);
    ep(16, 7 + b, M0);
  }
  if (pose === 'rear') {
    ep(1 + L, hy + 3, M2); ep(15 + L, hy + 3, M2); // claw sparks
  }

  // slash arc on full extension
  if (pose === 'lunge2') {
    ep(14, 2 + b, M2); ep(15, 3 + b, M1); ep(16, 5 + b, M1);
    ep(17, 8 + b, M0); ep(16, 11 + b, M1); ep(15, 13 + b, M1);
    ep(14, 15 + b, M2);
  }

  // robe trail — spectral motes shed behind while drifting (move anim only)
  if (o.trail >= 0) {
    const t = o.trail;
    ep(2, 9 + ((t * 2) % 5) + b, V3);
    ep(1, 12 - (t % 3) + b, DK);
    ep(2, 15 + (t % 3) + b, SH);
    if (t % 2 === 0) ep(3, 6 + (t % 4) + b, M2); // stray ember mote
  }
}
