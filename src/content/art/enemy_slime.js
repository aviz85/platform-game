// AETHERFALL — enemy_slime: glowing cyan-green energy slime with a tiny magenta
// reactor core pulsing inside its translucent gel body.
// Frames are 20x18 (body ~16x12) to leave room for stretch, airborne lift and a
// full 1px outline even on the widest squash frames.
//   row 0: move   — 7-frame hop cycle (rest, deep-crouch, launch-stretch, apex,
//                   fall-stretch, mega-splat, rebound) — big squash & stretch
//   row 1: attack — 4-frame wind-up jiggle (lean-back, wobble, charge-recoil, pop)
// Gel body: 4-step cyan ramp with dithered anti-banding transitions + upper-left rim.
// Reactor core: layered magenta glow (soft halo + tight hot center) that pulses with
// o.core, cyan energy bleeding into the surrounding gel, two orbiting motes.
// Anchor = feet center (10, 18).
import { PAL } from './palette.js';
import { makeCanvas, P, R, circleFill, outline, glow, frameGrid } from './util.js';

const FW = 20, FH = 18, CX = 10;

// draw one slime pose into frame at (fx, fy)
// o: { bw, bh, lift, lean, squint, core (0..1), ph (fleck phase), mouth, splat, drip, charge, burst }
function drawSlime(ctx, fx, fy, o) {
  const cx = fx + CX;
  const bottom = fy + FH - 1 - (o.lift | 0);
  const bh = o.bh, rx = o.bw / 2;
  const topY = bottom - bh + 1;

  // --- gel dome body (light upper-left, shaded lower-right, green energy band) ---
  // full 4-step cyan ramp (cyan0>cyan1>cyan2>cyan3) with checker-dithered transitions
  // between steps so the translucent gel gradates instead of banding.
  for (let j = 0; j < bh; j++) {
    const u = bh > 1 ? j / (bh - 1) : 1;                     // 0 = top, 1 = bottom
    const halfW = Math.max(1, Math.round(rx * Math.sqrt(Math.max(0.02, u * (2 - u)))));
    const shift = Math.round(o.lean * (1 - u));              // top leans, base stays planted
    const y = topY + j;
    for (let i = -halfW; i <= halfW; i++) {
      const x = cx + shift + i;
      const edgeR = i >= halfW - 1, edgeL = i <= -halfW + 1;
      const d = (i + j) & 1;
      let col;
      if (u < 0.10)      col = PAL.cyan0;                                  // hot lit cap
      else if (u < 0.24) col = PAL.cyan1;                                  // lit upper
      else if (u < 0.40) col = d ? PAL.cyan1 : PAL.cyan2;                  // dither cyan1→cyan2
      else if (u < 0.62) col = PAL.cyan2;                                  // mid body
      else if (u < 0.80) col = d ? PAL.cyan2 : PAL.cyan3;                  // dither cyan2→cyan3
      else               col = d ? PAL.leaf2 : PAL.cyan3;                  // dark green-cyan floor
      if (u >= 0.36 && u <= 0.72 && !edgeR && !edgeL && d) col = PAL.leaf1; // living energy band
      if (edgeR && u > 0.12) col = PAL.cyan3;                              // right shade
      if (edgeL && u > 0.16 && u < 0.9) col = u < 0.5 ? PAL.cyan0 : PAL.cyan1; // left rim light (hot up top)
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
  // clamp so the r=3 core glow never bleeds past this frame's bottom row
  const coreY = Math.min(topY + Math.round(bh * 0.58), fy + FH - 4);
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
    const maxY = fy + FH - 1;             // clamp: never bleed into the frame below
    P(ctx, cx - 2, Math.min(bottom + 1, maxY), PAL.cyan2);
    P(ctx, cx + 1, Math.min(bottom + 2, maxY), PAL.leaf1);
    P(ctx, cx - 1, Math.min(bottom + 3, maxY), PAL.cyan3);
  }

  // dark contour around everything opaque so far
  outline(ctx, fx, fy, FW, FH);

  // --- emissive layer (after outline: glow must not get contoured) ---
  if (o.charge) glow(ctx, cx, coreY, 6, PAL.cyan1);          // whole-body charge flare
  // layered reactor-core glow: cyan energy bleeding into the gel + soft magenta halo +
  // a tight hot center that swells as o.core rises (0..1). Radii capped so the halo
  // never bleeds past this frame's bottom row (see coreY clamp above).
  glow(ctx, cx, coreY, 2, PAL.cyan2);                        // reactor light diffusing through gel
  glow(ctx, cx, coreY, 3, PAL.magenta1);                     // outer magenta halo
  glow(ctx, cx, coreY, 2 + Math.round(o.core), PAL.magenta0); // inner hot glow, pulses with core
  const ringC = o.core >= 0.75 ? PAL.magenta1 : PAL.magenta2;
  P(ctx, cx + 1, coreY, ringC); P(ctx, cx - 1, coreY, ringC);
  P(ctx, cx, coreY + 1, ringC); P(ctx, cx, coreY - 1, ringC);
  P(ctx, cx, coreY, o.core >= 0.75 ? PAL.white : PAL.magenta0);
  if (o.core >= 0.9) {                                       // white-hot cross at peak charge
    P(ctx, cx + 1, coreY, PAL.magenta0); P(ctx, cx - 1, coreY, PAL.magenta0);
  }
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
  const c = makeCanvas(FW * 7, FH * 2);
  const ctx = c.getContext('2d');

  // big-squash hop cycle: rest -> deep crouch -> tall launch -> relaxed apex ->
  // fall stretch -> mega splat -> rebound. Extreme bw/bh swings sell the S&S; the
  // rebound frame stops the splat from snapping stiffly back to rest.
  const MOVE = [
    { bw: 14, bh: 10, lift: 0, lean: 0,  squint: 0, core: 0.5,  ph: 0 },                   // rest
    { bw: 16, bh: 6,  lift: 0, lean: 0,  squint: 1, core: 0.3,  ph: 1 },                   // deep anticipation crouch
    { bw: 9,  bh: 15, lift: 0, lean: 1,  squint: 0, core: 0.85, ph: 2, drip: true },       // launch — tall & pinched
    { bw: 12, bh: 11, lift: 5, lean: 0,  squint: 0, core: 1.0,  ph: 3, drip: true },       // apex — relaxed round, airborne
    { bw: 9,  bh: 14, lift: 2, lean: -1, squint: 0, core: 0.85, ph: 4, drip: true },       // fall — stretched down
    { bw: 16, bh: 5,  lift: 0, lean: 0,  squint: 1, core: 0.5,  ph: 5, splat: true },      // land — mega splat
    { bw: 12, bh: 12, lift: 1, lean: 0,  squint: 0, core: 0.55, ph: 6 },                   // rebound overshoot
  ];
  // wind-up jiggle: lean back (gather) -> wobble forward flat -> charge recoil squash
  // (core flash) -> pop spring. Alternating lean + bh swing reads as a jiggly wind-up.
  const ATTACK = [
    { bw: 13, bh: 11, lift: 0, lean: -2, squint: 0, core: 0.5, ph: 0 },                    // lean back, gather
    { bw: 16, bh: 8,  lift: 0, lean: 2,  squint: 0, core: 0.7, ph: 2, mouth: true },       // wobble forward, flatten
    { bw: 15, bh: 7,  lift: 0, lean: -2, squint: 1, core: 1.0, ph: 4, mouth: true, charge: true }, // recoil squash + charge
    { bw: 11, bh: 13, lift: 0, lean: 0,  squint: 0, core: 1.0, ph: 1, mouth: true, burst: true },  // pop — spring up + burst
  ];

  MOVE.forEach((o, i) => drawSlime(ctx, i * FW, 0, o));
  ATTACK.forEach((o, i) => drawSlime(ctx, i * FW, FH, o));

  return {
    image: c,
    anims: {
      move:   { frames: frameGrid(FW, FH, 7, 0), fps: 11, loop: true },
      attack: { frames: frameGrid(FW, FH, 4, 1), fps: 12, loop: true },
    },
    anchor: { x: CX, y: FH },
  };
}
