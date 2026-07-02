// AETHERFALL — enemy_slime: glowing cyan-green energy slime with a tiny magenta
// reactor core pulsing inside its translucent gel body.
// Frames are 18x18 (body ~16x12) to leave room for stretch + airborne lift.
//   row 0: move   — 6-frame hop cycle (rest, crouch, launch, apex, fall, land-splat)
//   row 1: attack — 4-frame wind-up jiggle (lean, wobble, charge-flash, pop)
// Anchor = feet center (9, 18).
import { PAL } from './palette.js';
import { makeCanvas, P, R, circleFill, outline, glow, frameGrid } from './util.js';

const FW = 18, FH = 18, CX = 9;

// draw one slime pose into frame at (fx, fy)
// o: { bw, bh, lift, lean, squint, core (0..1), ph (fleck phase), mouth, splat, drip, charge, burst }
function drawSlime(ctx, fx, fy, o) {
  const cx = fx + CX;
  const bottom = fy + FH - 1 - (o.lift | 0);
  const bh = o.bh, rx = o.bw / 2;
  const topY = bottom - bh + 1;

  // --- gel dome body (light upper-left, shaded lower-right, green energy band) ---
  for (let j = 0; j < bh; j++) {
    const u = bh > 1 ? j / (bh - 1) : 1;                     // 0 = top, 1 = bottom
    const halfW = Math.max(1, Math.round(rx * Math.sqrt(Math.max(0.02, u * (2 - u)))));
    const shift = Math.round(o.lean * (1 - u));              // top leans, base stays planted
    const y = topY + j;
    for (let i = -halfW; i <= halfW; i++) {
      const x = cx + shift + i;
      const edgeR = i >= halfW - 1, edgeL = i <= -halfW + 1;
      let col;
      if (u < 0.22) col = PAL.cyan1;                                       // lit cap
      else if (u > 0.74) col = ((i + j) & 1) ? PAL.leaf2 : PAL.cyan3;      // dark green-cyan base
      else col = PAL.cyan2;
      if (u >= 0.34 && u <= 0.74 && !edgeR && !edgeL && ((i + j) & 1)) col = PAL.leaf1; // energy band
      if (edgeR && u > 0.12) col = PAL.cyan3;                              // right shade
      if (edgeL && u > 0.2 && u < 0.9) col = PAL.cyan1;                    // left rim light
      if (j === 0) col = PAL.cyan0;                                        // hot top cap
      P(ctx, x, y, col);
    }
  }
  // wet top-left rim sparkle
  const leanTop = Math.round(o.lean);
  P(ctx, cx + leanTop - Math.max(1, Math.round(rx * 0.45)), topY + 1, PAL.cyan0);
  P(ctx, cx + leanTop - Math.max(0, Math.round(rx * 0.15)), topY, PAL.white);
  P(ctx, cx + leanTop - Math.max(1, Math.round(rx * 0.55)), topY + 2, PAL.leaf0);

  // --- dark gel pocket where the reactor core sits ---
  const coreY = topY + Math.round(bh * 0.58);
  circleFill(ctx, cx, coreY, 2, PAL.cyan3);

  // --- face: two glossy eyes (+ optional mouth) ---
  const eyeJ = Math.max(1, Math.round(bh * 0.3));
  const ey = topY + eyeJ;
  const eu = bh > 1 ? eyeJ / (bh - 1) : 1;
  const es = Math.round(o.lean * (1 - eu));
  for (const dx of [-4, 2]) {
    const x = cx + es + dx;
    if (o.squint) {                       // squashed: flat determined eyes
      P(ctx, x, ey, PAL.outline); P(ctx, x + 1, ey, PAL.outline);
    } else {                              // 2x2 glossy eye, white glint upper-left
      P(ctx, x, ey, PAL.white);
      P(ctx, x + 1, ey, PAL.outline);
      P(ctx, x, ey + 1, PAL.outline);
      P(ctx, x + 1, ey + 1, PAL.outline);
    }
  }
  if (o.mouth) R(ctx, cx + es - 1, Math.min(ey + 3, bottom - 1), 3, 1, PAL.outline);

  // --- secondary motion: droplets ---
  if (o.splat) {                          // landing splash flying sideways
    P(ctx, cx - 8, bottom, PAL.cyan1);
    P(ctx, cx + 8, bottom, PAL.cyan1);
    P(ctx, cx - 8, bottom - 2, PAL.leaf0);
    P(ctx, cx + 8, bottom - 3, PAL.cyan0);
    P(ctx, cx - 7, bottom - 4, PAL.cyan0);
  }
  if (o.drip) {                           // goo trailing below an airborne body
    P(ctx, cx - 2, bottom + 1, PAL.cyan2);
    P(ctx, cx + 1, bottom + 2, PAL.leaf1);
    P(ctx, cx - 1, Math.min(bottom + 3, fy + FH - 1), PAL.cyan3);
  }

  // dark contour around everything opaque so far
  outline(ctx, fx, fy, FW, FH);

  // --- emissive layer (after outline: glow must not get contoured) ---
  if (o.charge) glow(ctx, cx, coreY, 6, PAL.cyan1);          // whole-body charge flare
  glow(ctx, cx, coreY, 3, PAL.magenta1);
  const ringC = o.core >= 0.75 ? PAL.magenta1 : PAL.magenta2;
  P(ctx, cx + 1, coreY, ringC); P(ctx, cx - 1, coreY, ringC);
  P(ctx, cx, coreY + 1, ringC); P(ctx, cx, coreY - 1, ringC);
  P(ctx, cx, coreY, o.core >= 0.75 ? PAL.white : PAL.magenta0);
  // two energy motes orbiting the core inside the gel
  const a = o.ph * (Math.PI / 3);
  P(ctx, cx + Math.round(Math.cos(a) * 3), coreY + Math.round(Math.sin(a) * 2), PAL.magenta0);
  P(ctx, cx - Math.round(Math.cos(a) * 3), coreY - Math.round(Math.sin(a) * 2), PAL.magenta1);

  if (o.burst) {                          // attack pop: sparks ringing the body
    const my = topY + Math.round(bh * 0.5);
    glow(ctx, cx, my, 7, PAL.cyan1);
    P(ctx, cx - 8, my, PAL.cyan0);  P(ctx, cx + 8, my, PAL.cyan0);
    P(ctx, cx, topY - 2, PAL.white);
    P(ctx, cx - 5, topY - 1, PAL.cyan0); P(ctx, cx + 5, topY - 1, PAL.cyan0);
    P(ctx, cx - 7, my + 3, PAL.leaf0);   P(ctx, cx + 7, my + 3, PAL.leaf0);
  }
}

export function build() {
  const c = makeCanvas(FW * 6, FH * 2);
  const ctx = c.getContext('2d');

  // hop cycle: rest -> anticipation crouch -> launch stretch -> apex -> fall stretch -> land splat
  const MOVE = [
    { bw: 14, bh: 9,  lift: 0, lean: 0,  squint: 0, core: 0.5,  ph: 0 },
    { bw: 15, bh: 7,  lift: 0, lean: 0,  squint: 1, core: 0.35, ph: 1 },
    { bw: 10, bh: 14, lift: 1, lean: 1,  squint: 0, core: 0.8,  ph: 2, drip: true },
    { bw: 11, bh: 12, lift: 4, lean: 0,  squint: 0, core: 1.0,  ph: 3, drip: true },
    { bw: 10, bh: 13, lift: 2, lean: -1, squint: 0, core: 0.8,  ph: 4, drip: true },
    { bw: 14, bh: 6,  lift: 0, lean: 0,  squint: 1, core: 0.5,  ph: 5, splat: true },
  ];
  // wind-up jiggle: lean back -> wobble forward -> charge squash (core flash) -> pop
  const ATTACK = [
    { bw: 14, bh: 9,  lift: 0, lean: -2, squint: 0, core: 0.5, ph: 0 },
    { bw: 15, bh: 8,  lift: 0, lean: 2,  squint: 0, core: 0.7, ph: 2, mouth: true },
    { bw: 15, bh: 7,  lift: 0, lean: -2, squint: 1, core: 1.0, ph: 4, mouth: true, charge: true },
    { bw: 12, bh: 12, lift: 0, lean: 0,  squint: 0, core: 1.0, ph: 1, mouth: true, burst: true },
  ];

  MOVE.forEach((o, i) => drawSlime(ctx, i * FW, 0, o));
  ATTACK.forEach((o, i) => drawSlime(ctx, i * FW, FH, o));

  return {
    image: c,
    anims: {
      move:   { frames: frameGrid(FW, FH, 6, 0), fps: 10, loop: true },
      attack: { frames: frameGrid(FW, FH, 4, 1), fps: 12, loop: true },
    },
    anchor: { x: CX, y: FH },
  };
}
