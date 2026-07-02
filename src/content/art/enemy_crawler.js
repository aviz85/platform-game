// AETHERFALL — enemy_crawler: armored beetle-mech ground walker.
// Ancient stone-metal plated carapace with moss growth, magenta reactor underglow.
// Sheet layout: row 0 = 'move' (6 frames, tri-leg gait cycle, body bob, antenna wave)
//               row 1 = 'attack' (4 frames, LOOPING charge cycle: plates flared open
//                       exposing the magenta core, antennae pinned back, legs skittering
//                       at double cadence, pulsing white-hot eye + streaming motion trail).
//                       Loop-coherent on purpose — the crawler behavior holds anim='attack'
//                       across telegraph+charge (~1s = 3 loops), so no one-shot poses here;
//                       anticipation is acted by the behavior (recoil/shiver/dust).
// Facing RIGHT. Engine flips via e.facing. Body ~20x14 inside a 26x18 frame.
import { PAL } from './palette.js';
import { makeCanvas, P, R, line, outline, glow, shade, frameGrid } from './util.js';

const FW = 26, FH = 18;
const G = 16; // ground row (feet rest here; outline adds row 17)

// Carapace dome spans: [y, x0, x1] (plate-local, before bob/lift shifts)
const DOME = [
  [4, 8, 17],
  [5, 6, 19],
  [6, 5, 20],
  [7, 4, 21],
  [8, 3, 21],
  [9, 3, 21],
  [10, 3, 21],
  [11, 4, 21],
];

// Static moss patches growing on the plates: [x, y, color] (plate-local)
const MOSS = [
  // rear patch
  [5, 6, PAL.moss2], [6, 5, PAL.moss1], [6, 6, PAL.moss1], [7, 5, PAL.moss2],
  // mid ridge patch
  [11, 4, PAL.moss1], [12, 4, PAL.leaf1], [12, 5, PAL.moss1], [13, 5, PAL.moss2],
  // front tuft
  [17, 5, PAL.moss2], [18, 6, PAL.moss1],
  // drip down the rear edge
  [4, 8, PAL.moss2], [4, 9, PAL.moss2],
];

const NEAR_HIPS = [7, 12, 17];
const FAR_HIPS = [5, 10, 15];

// gait pose for a leg at cycle phase p (0..1): foot swing dx + step lift
function legPose(p) {
  const a = p * Math.PI * 2;
  return { dx: Math.round(Math.cos(a) * 2), lift: Math.max(0, Math.round(Math.sin(a) * 1.7)) };
}

// o: { dy (body bob, +down), lift (plate flare, +up), core (0..1 reactor heat),
//      lean (-1..1 body shift), near/far (leg poses), ant (-1|0|1 antenna sway),
//      hot (eye white-hot), jaw (mandible open), trail (0|1|2 charge motion trail) }
function drawCrawler(ctx, ox, oy, o) {
  const lean = o.lean || 0, dy = o.dy || 0, lift = o.lift || 0, core = o.core || 0;
  const bx = ox + lean;      // chassis x origin
  const by = oy + dy;        // chassis y origin
  const py = by - lift;      // plate y origin (flares upward)

  // --- far legs (dark, behind chassis) ---
  for (let i = 0; i < 3; i++) {
    const lp = o.far[i];
    const hx = bx + FAR_HIPS[i], hy = by + 12;
    const fx = hx + lp.dx, fy = oy + G - lp.lift;
    line(ctx, hx, hy, fx, fy, PAL.metal3);
    P(ctx, fx + (lp.dx >= 0 ? 1 : -1), fy, PAL.metal3); // foot claw
  }

  // --- belly / chassis undercarriage ---
  R(ctx, bx + 5, by + 12, 15, 1, PAL.shadow);
  R(ctx, bx + 7, by + 13, 11, 1, PAL.deepPurple);
  // reactor vents — the magenta underglow sources
  const ventC = core > 0.6 ? PAL.magenta1 : PAL.magenta2;
  for (const vx of [9, 12, 15]) P(ctx, bx + vx, by + 13, ventC);
  if (core > 0.6) P(ctx, bx + 12, by + 13, PAL.magenta0);

  // --- exposed reactor core when the plates flare open ---
  if (lift > 0) {
    for (let yy = 12 - lift; yy <= 11; yy++) R(ctx, bx + 5, by + yy, 15, 1, PAL.magenta3);
    const filC = core > 0.5 ? PAL.magenta1 : PAL.magenta2;
    R(ctx, bx + 6, by + 12 - lift, 13, 1, filC);
    if (core > 0.5) {
      for (const hx2 of [8, 11, 14, 17]) P(ctx, bx + hx2, by + 12 - lift, PAL.magenta0);
      P(ctx, bx + 12, by + 12 - lift, PAL.white); // white-hot filament pixel
    }
  }

  // --- carapace dome (stone plates, light upper-left) ---
  for (const [yy, x0, x1] of DOME) {
    for (let x = x0; x <= x1; x++) {
      let c = PAL.stone1;
      if (yy <= 5 || (yy === 6 && x <= 10)) c = PAL.stone0;   // lit top-left
      if (yy >= 9) c = PAL.stone2;                             // lower shade
      if (yy >= 8 && x >= x1 - 1) c = PAL.stone3;              // right edge in shadow
      if (yy === 11) c = (x <= 5 || x >= 20) ? PAL.metal3 : PAL.metal2; // metal skirt rim
      P(ctx, bx + x, py + yy, c);
    }
  }
  // ridge specular
  P(ctx, bx + 9, py + 4, shade(PAL.stone0, 0.25));
  P(ctx, bx + 10, py + 4, shade(PAL.stone0, 0.25));
  // plate seams — subtle panel lines; glow magenta when the core is hot
  const seamC = core > 0.5 ? PAL.magenta1 : PAL.stone3;
  for (const sx of [9, 15]) {
    P(ctx, bx + sx, py + 5, PAL.stone2); // softened seam top
    for (let yy = 6; yy <= 10; yy++) P(ctx, bx + sx, py + yy, seamC);
  }
  if (core > 0.5) { P(ctx, bx + 9, py + 7, PAL.magenta0); P(ctx, bx + 15, py + 7, PAL.magenta0); }
  // weathering cracks on each plate
  P(ctx, bx + 6, py + 8, PAL.stone2); P(ctx, bx + 7, py + 9, PAL.stone3);
  P(ctx, bx + 12, py + 7, PAL.stone2); P(ctx, bx + 13, py + 8, PAL.stone2);
  P(ctx, bx + 17, py + 8, PAL.stone2); P(ctx, bx + 18, py + 9, PAL.stone3);
  // rivets along the metal skirt
  for (const rx of [6, 12, 18]) P(ctx, bx + rx, py + 11, PAL.metal0);
  // moss rides on the plates
  for (const [mx, my, c] of MOSS) P(ctx, bx + mx, py + my, c);
  // dark cut separating the dome from the head
  for (let yy = 7; yy <= 10; yy++) P(ctx, bx + 19, py + yy, PAL.stone3);

  // --- head (chassis-mounted, stays put while plates flare) ---
  R(ctx, bx + 21, by + 6, 2, 1, PAL.metal0);
  R(ctx, bx + 20, by + 7, 4, 1, PAL.metal1);
  R(ctx, bx + 20, by + 8, 4, 1, PAL.metal2);   // dark visor band — eye pops against it
  P(ctx, bx + 23, by + 8, PAL.metal3);
  R(ctx, bx + 20, by + 9, 4, 1, PAL.metal2);
  R(ctx, bx + 20, by + 10, 3, 1, PAL.metal3);
  // mandibles
  P(ctx, bx + 23, by + 10, PAL.metal3);
  P(ctx, bx + 24, by + 9, PAL.metal2);
  if (o.jaw) P(ctx, bx + 24, by + 10, PAL.metal3); // jaw open
  // eye (emissive magenta, white-hot in attack)
  P(ctx, bx + 21, by + 8, PAL.magenta1);
  P(ctx, bx + 22, by + 8, o.hot ? PAL.white : PAL.magenta0);

  // --- antennae (secondary motion) ---
  const ant = o.ant || 0;
  P(ctx, bx + 21, by + 5, PAL.metal2);
  P(ctx, bx + 21 + ant, by + 4, PAL.magenta1);   // emissive tip
  P(ctx, bx + 19, by + 5, PAL.metal2);
  P(ctx, bx + 19 + ant, by + 4, PAL.magenta1);

  // --- near legs (lit, in front) ---
  for (let i = 0; i < 3; i++) {
    const lp = o.near[i];
    const hx = bx + NEAR_HIPS[i], hy = by + 12;
    const fx = hx + lp.dx, fy = oy + G - lp.lift;
    P(ctx, hx, hy, PAL.metal0);                   // hip joint (lit)
    line(ctx, hx, hy + 1, fx, fy, PAL.metal1);    // limb
    P(ctx, fx, fy, PAL.metal2);                   // foot
    P(ctx, fx + (lp.dx >= 0 ? 1 : -1), fy, PAL.metal2); // claw
  }

  // --- outline, then soft emissive light (kept inside the frame) ---
  outline(ctx, ox, oy, FW, FH);

  // charge motion trail (soft, after outline)
  if (o.trail) {
    ctx.save();
    ctx.globalAlpha = 0.55;
    P(ctx, ox + 1, oy + 8 + dy, PAL.magenta1);
    P(ctx, ox + 2, oy + 10 + dy, PAL.magenta2);
    if (o.trail > 1) { P(ctx, ox + 1, oy + 11 + dy, PAL.magenta2); P(ctx, ox + 2, oy + 6 + dy, PAL.magenta2); }
    ctx.restore();
  }

  // magenta underglow pooled beneath the body
  glow(ctx, bx + 12, oy + 14, core > 0.6 ? 3 : 2, PAL.magenta2);
  glow(ctx, bx + 9, oy + 14, 1, PAL.magenta2);
  glow(ctx, bx + 15, oy + 14, 1, PAL.magenta2);
  if (core > 0.5 && lift > 0) glow(ctx, bx + 12, by + 11, 3, PAL.magenta1); // flared core bloom
  // eye glow
  glow(ctx, bx + 22, by + 8, 2, o.hot ? PAL.magenta0 : PAL.magenta2);
}

export function build() {
  const c = makeCanvas(FW * 6, FH * 2);
  const ctx = c.getContext('2d');

  // ---- row 0: move (6 frames) — tri-leg gait, subtle bob, antenna sway ----
  const BOB = [0, 1, 1, 0, 1, 1];
  for (let f = 0; f < 6; f++) {
    const near = [], far = [];
    for (let i = 0; i < 3; i++) {
      near.push(legPose((f / 6 + i / 3) % 1));
      far.push(legPose((f / 6 + i / 3 + 0.5) % 1));
    }
    drawCrawler(ctx, f * FW, 0, {
      dy: BOB[f], lift: 0, core: 0.25, lean: 0,
      near, far,
      ant: (f === 2 || f === 3) ? 1 : 0,
      jaw: f % 3 === 1,
      hot: false, trail: 0,
    });
  }

  // ---- row 1: attack (4 frames) — LOOPING flared skitter-charge ----
  // Plates locked fully open (lift 2), magenta core exposed and blazing, antennae
  // pinned back. Legs run the same tri-gait at double cadence (full cycle per loop),
  // body bounces 0/1/0/1, eye + jaw + trail pulse on alternate frames. Every channel
  // returns to its frame-0 value after frame 3, so the 3 loops per charge read as
  // one continuous sprint — no snap-back.
  const ATK_DY = [0, 1, 0, 1];
  const ATK_CORE = [0.7, 1, 0.7, 1];
  for (let f = 0; f < 4; f++) {
    const near = [], far = [];
    for (let i = 0; i < 3; i++) {
      near.push(legPose((f / 4 + i / 3) % 1));
      far.push(legPose((f / 4 + i / 3 + 0.5) % 1));
    }
    drawCrawler(ctx, f * FW, FH, {
      dy: ATK_DY[f], lift: 2, core: ATK_CORE[f], lean: 0,
      near, far,
      ant: -1,
      hot: f % 2 === 1,
      jaw: f % 2 === 0,
      trail: 1 + (f % 2),
    });
  }

  return {
    image: c,
    anims: {
      move: { frames: frameGrid(FW, FH, 6, 0), fps: 10, loop: true },
      attack: { frames: frameGrid(FW, FH, 4, 1), fps: 12, loop: true },
    },
    anchor: { x: FW / 2, y: FH },
  };
}
