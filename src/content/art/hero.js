// AETHERFALL — HERO sprite sheet.
// Agile explorer in a blue-cyan tech suit: glowing visor, chest energy core,
// ember-red flowing scarf, cyan energy blade. Facing RIGHT (engine flips).
// Sheet layout: 32x32 frames, one row per anim:
//   row 0 idle(4) · row 1 run(8) · row 2 jump(2) · row 3 fall(2)
//   row 4 attack(4) · row 5 hurt(2) · row 6 dash(2)
// Anchor: feet-center (16, 32).

import { PAL } from './palette.js';
import { makeCanvas, P, R, line, outline, glow, shade, frameGrid } from './util.js';

const FW = 32, FH = 32;

const C = {
  helm: PAL.hero1,
  helmHi: PAL.hero0,
  helmSh: PAL.heroSuit1,
  suit: PAL.heroSuit1,
  suitHi: PAL.hero1,
  suitLt: PAL.hero0,
  suitSh: PAL.heroSuit2,
  boot: PAL.hero1,
  bootHi: PAL.hero0,
  glove: PAL.hero0,
  skin: PAL.skin1,
  skinHi: PAL.skin0,
  scarf: PAL.ember1,
  scarfHi: PAL.ember0,
  scarfSh: PAL.ember2,
  visor: PAL.cyan1,
  visorDim: PAL.cyan3,
  visorHot: PAL.cyan0,
  core: PAL.cyan0,
  coreRim: PAL.cyan1,
  blade: PAL.cyan1,
  bladeCore: PAL.cyan0,
  white: PAL.white,
  buckle: PAL.gold1,
};

// ---------------------------------------------------------------------------
// pose factory — every frame is this skeleton with parameters tweaked
// ---------------------------------------------------------------------------
function pose(over = {}) {
  return Object.assign({
    dy: 0,                 // torso+head vertical offset (down = +)
    lean: 0,               // upper-body horizontal offset (fwd = +)
    headDy: 0,             // extra head offset (nod / recoil)
    hips: [14, 18],        // hip x positions
    feet: [{ x: 14, y: 30 }, { x: 18, y: 30 }],
    handB: { x: 12, y: 22 },
    handF: { x: 20, y: 22 },
    scarf: [[11, 17], [9, 18], [7, 18]],  // 2x2 cloth blocks, back to tip
    blink: false,
    hurt: false,
    pulse: 0,              // chest core glow 0..1
    wide: 0,               // torso stretch (dash)
    blade: null,           // {x0,y0,x1,y1}
    arc: null,             // {cx,cy,r,a0,a1,fade} slash trail (radians)
    sparks: null,          // [[x,y,color],...] charge/impact pixels
    streaks: 0,            // dash motion-line variant (0=none,1,2)
  }, over);
}

// ---------------------------------------------------------------------------
// body-part painters (all coords local to frame, offset by ox/oy)
// ---------------------------------------------------------------------------
function drawScarf(ctx, ox, oy, p) {
  const cols = [C.scarf, C.scarfHi, C.scarfSh];
  p.scarf.forEach(([sx, sy], i) => {
    const x = ox + sx + p.lean, y = oy + sy + p.dy;
    R(ctx, x, y, 2, 2, cols[Math.min(i, 2)]);
    P(ctx, x, y, i === 0 ? C.scarfHi : C.scarf); // top-left catch-light
  });
  // knot at the neck
  R(ctx, ox + 12 + p.lean, oy + 17 + p.dy, 3, 2, C.scarf);
  P(ctx, ox + 12 + p.lean, oy + 17 + p.dy, C.scarfHi);
  P(ctx, ox + 14 + p.lean, oy + 18 + p.dy, C.scarfSh);
}

function drawLeg(ctx, ox, oy, hx, hy, f, back) {
  const main = back ? C.suitSh : C.suit;
  const hi = back ? C.suit : C.suitHi;
  line(ctx, ox + hx, oy + hy, ox + f.x, oy + f.y - 1, main);
  line(ctx, ox + hx + 1, oy + hy, ox + f.x + 1, oy + f.y - 1, main);
  P(ctx, ox + hx, oy + hy, hi); // hip catch-light
  // boot
  R(ctx, ox + f.x - 1, oy + f.y - 1, 4, 2, back ? shade(C.boot, -0.25) : C.boot);
  P(ctx, ox + f.x + 2, oy + f.y - 1, back ? C.boot : C.bootHi); // toe cap
  P(ctx, ox + f.x - 1, oy + f.y, back ? shade(C.boot, -0.4) : shade(C.boot, -0.25));
}

function drawArm(ctx, ox, oy, sx, sy, h, back) {
  line(ctx, ox + sx, oy + sy, ox + h.x, oy + h.y, back ? C.suitSh : C.suit);
  R(ctx, ox + h.x - 1, oy + h.y - 1, 2, 2, back ? shade(C.glove, -0.3) : C.glove);
}

function drawTorso(ctx, ox, oy, p) {
  const tx = ox + 13 + p.lean - p.wide, ty = oy + 17 + p.dy;
  const tw = 7 + p.wide * 2;
  R(ctx, tx, ty, tw, 7, C.suit);
  // chest plate
  R(ctx, tx + 1, ty + 1, tw - 2, 3, C.suitHi);
  // upper-left light
  R(ctx, tx, ty, 2, 1, C.suitLt);
  P(ctx, tx, ty + 1, C.suitLt);
  P(ctx, tx + 1, ty + 1, C.suitLt);
  // lower/right shade
  R(ctx, tx + tw - 1, ty + 1, 1, 6, C.suitSh);
  R(ctx, tx, ty + 5, tw, 1, C.suitSh);
  // belt + buckle
  R(ctx, tx, ty + 6, tw, 1, shade(C.suitSh, -0.25));
  P(ctx, tx + (tw >> 1), ty + 6, C.buckle);
  // shoulder pads
  R(ctx, tx - 1, ty, 2, 2, C.helm);
  P(ctx, tx - 1, ty, C.helmHi);
  R(ctx, tx + tw - 1, ty, 2, 2, C.helm);
  P(ctx, tx + tw - 1, ty, C.helmHi);
  // chest energy core (emissive — hot pixel now, glow later)
  const cx = tx + (tw >> 1);
  P(ctx, cx, ty + 2, C.core);
  P(ctx, cx - 1, ty + 2, C.coreRim);
  P(ctx, cx + 1, ty + 2, C.coreRim);
  P(ctx, cx, ty + 1, C.coreRim);
  P(ctx, cx, ty + 3, PAL.cyan2);
}

function drawHead(ctx, ox, oy, p) {
  const cx = ox + 16 + p.lean;
  const top = oy + 9 + p.dy + p.headDy;
  // helmet dome
  R(ctx, cx - 2, top, 5, 1, C.helm);
  R(ctx, cx - 3, top + 1, 7, 1, C.helm);
  R(ctx, cx - 4, top + 2, 8, 2, C.helm);
  // dome top-left highlight
  R(ctx, cx - 2, top, 2, 1, C.helmHi);
  P(ctx, cx - 3, top + 1, C.helmHi);
  P(ctx, cx - 2, top + 1, C.helmHi);
  // right-side shade
  P(ctx, cx + 2, top, C.helmSh);
  P(ctx, cx + 3, top + 1, C.helmSh);
  R(ctx, cx + 3, top + 2, 1, 2, C.helmSh);
  // helmet cheek guards (rows 4..7)
  R(ctx, cx - 4, top + 4, 1, 4, C.helm);
  P(ctx, cx - 4, top + 4, C.helmHi);
  R(ctx, cx + 3, top + 4, 1, 4, C.helmSh);
  // visor band (emissive)
  const vc = p.hurt ? PAL.ember1 : (p.blink ? C.visorDim : C.visor);
  R(ctx, cx - 3, top + 4, 6, 2, PAL.cyan2);
  R(ctx, cx - 3, top + 4, 6, 1, vc);
  if (!p.blink && !p.hurt) {
    P(ctx, cx + 1, top + 4, C.visorHot);
    P(ctx, cx + 2, top + 4, C.visorHot);
    P(ctx, cx - 3, top + 4, PAL.cyan2);
  }
  if (p.hurt) { P(ctx, cx + 1, top + 4, C.white); }
  // jaw / chin (warm skin under the visor)
  R(ctx, cx - 3, top + 6, 6, 2, C.skin);
  P(ctx, cx - 3, top + 6, C.skinHi);
  P(ctx, cx - 2, top + 6, C.skinHi);
  P(ctx, cx + 2, top + 7, shade(C.skin, -0.25));
  // mouth
  P(ctx, cx, top + 7, p.hurt ? PAL.ember2 : shade(C.skin, -0.35));
  // antenna fin with emissive stud
  P(ctx, cx - 4, top + 1, C.helm);
  P(ctx, cx - 5, top, PAL.cyan2);
  P(ctx, cx - 5, top - 1, C.visor);
}

function drawBlade(ctx, ox, oy, b) {
  // energy blade: cyan edge, white-hot core, hilt
  line(ctx, ox + b.x0, oy + b.y0, ox + b.x1, oy + b.y1, C.blade);
  const mx = (b.x0 + b.x1) / 2, my = (b.y0 + b.y1) / 2;
  line(ctx, ox + Math.round((b.x0 + mx) / 2), oy + Math.round((b.y0 + my) / 2),
    ox + b.x1, oy + b.y1, C.bladeCore);
  P(ctx, ox + b.x1, oy + b.y1, C.white);
  // hilt
  P(ctx, ox + b.x0, oy + b.y0, C.buckle);
  P(ctx, ox + b.x0 + Math.sign(b.x0 - b.x1), oy + b.y0 + Math.sign(b.y0 - b.y1), PAL.amber1);
}

function drawArc(ctx, ox, oy, a) {
  // slash trail — drawn AFTER outline so it stays pure light
  const steps = Math.max(6, Math.round(Math.abs(a.a1 - a.a0) * a.r));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const ang = a.a0 + (a.a1 - a.a0) * t;
    const px = ox + a.cx + Math.round(Math.cos(ang) * a.r);
    const py = oy + a.cy + Math.round(Math.sin(ang) * a.r);
    if (a.fade && (i % 3 !== 0)) continue;    // dissipating trail
    P(ctx, px, py, C.blade);
    if (!a.fade) {
      const ix = ox + a.cx + Math.round(Math.cos(ang) * (a.r - 1));
      const iy = oy + a.cy + Math.round(Math.sin(ang) * (a.r - 1));
      P(ctx, ix, iy, t > 0.55 ? C.bladeCore : PAL.cyan2);
      if (i === steps || i === steps - 2) P(ctx, px, py, C.white);
    }
  }
}

function drawStreaks(ctx, ox, oy, p) {
  // dash motion lines behind the body
  ctx.save();
  ctx.globalAlpha = 0.55;
  const off = p.streaks === 2 ? 1 : 0;
  R(ctx, ox + 1 + off, oy + 14 + p.dy, 7 - off * 2, 1, PAL.cyan1);
  R(ctx, ox + 3 - off, oy + 18 + p.dy, 8, 1, C.helmHi);
  R(ctx, ox + 1 + off, oy + 22 + p.dy, 6 + off, 1, PAL.cyan1);
  R(ctx, ox + 4, oy + 26, 5 - off, 1, PAL.cyan2);
  ctx.globalAlpha = 0.85;
  P(ctx, ox + 8 + off, oy + 18 + p.dy, C.white);
  P(ctx, ox + 6 - off, oy + 14 + p.dy, PAL.cyan0);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// frame assembler
// ---------------------------------------------------------------------------
function drawFrame(ctx, col, row, p) {
  const ox = col * FW, oy = row * FH;
  const ty = 17 + p.dy;

  // back-to-front
  drawScarf(ctx, ox, oy, p);
  drawArm(ctx, ox, oy, 13 + p.lean, ty + 1, p.handB, true);
  drawLeg(ctx, ox, oy, p.hips[0] + p.lean, 24 + p.dy, p.feet[0], true);
  drawLeg(ctx, ox, oy, p.hips[1] + p.lean, 24 + p.dy, p.feet[1], false);
  drawTorso(ctx, ox, oy, p);
  drawHead(ctx, ox, oy, p);
  drawArm(ctx, ox, oy, 19 + p.lean, ty + 1, p.handF, false);
  if (p.blade) drawBlade(ctx, ox, oy, p.blade);

  // 1px dark-purple outline around everything opaque so far
  outline(ctx, ox, oy, FW, FH);

  // pure-light passes (never outlined)
  if (p.arc) drawArc(ctx, ox, oy, p.arc);
  if (p.streaks) drawStreaks(ctx, ox, oy, p);
  if (p.sparks) for (const [sx, sy, sc] of p.sparks) P(ctx, ox + sx, oy + sy, sc);

  // emissive glows
  const cx = 16 + p.lean;
  glow(ctx, ox + cx, oy + ty + 2, 2 + Math.round(p.pulse), PAL.cyan1);           // chest core
  if (!p.blink) glow(ctx, ox + cx + 1, oy + 13 + p.dy + p.headDy, 2, p.hurt ? PAL.ember1 : PAL.cyan1); // visor
  if (p.blade) {
    glow(ctx, ox + p.blade.x1, oy + p.blade.y1, 3, PAL.cyan1);
    glow(ctx, ox + ((p.blade.x0 + p.blade.x1) >> 1), oy + ((p.blade.y0 + p.blade.y1) >> 1), 2, PAL.cyan1);
  }
}

// ---------------------------------------------------------------------------
// build
// ---------------------------------------------------------------------------
export function build() {
  const c = makeCanvas(FW * 8, FH * 7);
  const ctx = c.getContext('2d');

  // ---- row 0: IDLE (4) — breathing, scarf flutter, core pulse, blink -------
  const idle = [
    pose({ scarf: [[11, 17], [9, 18], [7, 18]], pulse: 0 }),
    pose({ scarf: [[11, 17], [9, 17], [7, 18]], pulse: 0.6, headDy: 0 }),
    pose({ dy: 1, scarf: [[11, 18], [9, 18], [7, 19]], pulse: 1 }),
    pose({ scarf: [[11, 17], [9, 18], [7, 17]], pulse: 0.4, blink: true }),
  ];
  idle.forEach((p, i) => drawFrame(ctx, i, 0, p));

  // ---- row 1: RUN (8) — stance i0..4, swing i5..7, bob + counter-arms ------
  const xo = [5, 3, 0, -4, -5, -3, 0, 4];          // foot A offset
  const lift = [0, 0, 0, 0, 0, 3, 4, 2];            // foot A lift
  const bobs = [1, 0, -1, 0, 1, 0, -1, 0];
  for (let i = 0; i < 8; i++) {
    const j = (i + 4) % 8;
    const swing = Math.round(xo[i] * 0.8);
    const p = pose({
      dy: bobs[i],
      lean: 2,
      feet: [
        { x: 16 + xo[i] - 2, y: 30 - lift[i] },     // back leg (A)
        { x: 16 + xo[j], y: 30 - lift[j] },         // front leg (B)
      ],
      hips: [14, 17],
      handB: { x: 14 + swing, y: 21 - Math.max(0, swing) },
      handF: { x: 18 - swing, y: 21 - Math.max(0, -swing) },
      scarf: (i & 1)
        ? [[10, 17], [7, 16], [5, 17]]
        : [[10, 17], [7, 18], [5, 16]],
      pulse: 0.5,
    });
    drawFrame(ctx, i, 1, p);
  }

  // ---- row 2: JUMP (2) — launch stretch, then tuck --------------------------
  drawFrame(ctx, 0, 2, pose({
    dy: -1, lean: 1,
    feet: [{ x: 13, y: 28 }, { x: 19, y: 27 }],
    handB: { x: 11, y: 18 }, handF: { x: 21, y: 17 },
    scarf: [[11, 19], [9, 20], [8, 22]],
    pulse: 1,
  }));
  drawFrame(ctx, 1, 2, pose({
    dy: 0, lean: 1,
    feet: [{ x: 14, y: 27 }, { x: 18, y: 26 }],
    handB: { x: 12, y: 18 }, handF: { x: 21, y: 18 },
    scarf: [[11, 20], [10, 22], [9, 24]],
    pulse: 0.6,
  }));

  // ---- row 3: FALL (2) — limbs flare, scarf streams upward ------------------
  drawFrame(ctx, 0, 3, pose({
    dy: 0, lean: 0,
    feet: [{ x: 12, y: 29 }, { x: 19, y: 28 }],
    handB: { x: 11, y: 16 }, handF: { x: 21, y: 16 },
    scarf: [[11, 15], [9, 13], [8, 11]],
    pulse: 0.4,
  }));
  drawFrame(ctx, 1, 3, pose({
    dy: 1, lean: 0,
    feet: [{ x: 13, y: 29 }, { x: 20, y: 28 }],
    handB: { x: 10, y: 17 }, handF: { x: 22, y: 17 },
    scarf: [[11, 15], [10, 13], [8, 12]],
    pulse: 0.7,
  }));

  // ---- row 4: ATTACK (4) — windup, overhead slash, extension, recovery ------
  const D = Math.PI / 180;
  drawFrame(ctx, 0, 4, pose({                      // anticipation: blade back-high
    dy: 1, lean: -2,
    feet: [{ x: 12, y: 30 }, { x: 19, y: 30 }],
    handB: { x: 12, y: 21 }, handF: { x: 11, y: 16 },
    blade: { x0: 11, y0: 16, x1: 6, y1: 10 },
    scarf: [[12, 18], [10, 19], [8, 19]],
    sparks: [[8, 12, PAL.cyan0], [5, 8, PAL.cyan1], [10, 15, PAL.white]],
    pulse: 1,
  }));
  drawFrame(ctx, 1, 4, pose({                      // overhead slash
    dy: 0, lean: 1,
    feet: [{ x: 12, y: 30 }, { x: 20, y: 30 }],
    handB: { x: 12, y: 20 }, handF: { x: 20, y: 12 },
    blade: { x0: 20, y0: 12, x1: 26, y1: 7 },
    arc: { cx: 17, cy: 19, r: 11, a0: -170 * D, a1: -55 * D },
    scarf: [[11, 18], [9, 19], [7, 20]],
    pulse: 1,
  }));
  drawFrame(ctx, 2, 4, pose({                      // full forward extension
    dy: 1, lean: 2,
    feet: [{ x: 11, y: 30 }, { x: 21, y: 30 }],
    handB: { x: 13, y: 21 }, handF: { x: 22, y: 18 },
    blade: { x0: 22, y0: 18, x1: 28, y1: 16 },
    arc: { cx: 17, cy: 19, r: 12, a0: -55 * D, a1: 30 * D },
    scarf: [[10, 17], [8, 16], [6, 17]],
    sparks: [[29, 12, PAL.cyan0], [30, 20, PAL.white]],
    pulse: 1,
  }));
  drawFrame(ctx, 3, 4, pose({                      // follow-through, trail fading
    dy: 1, lean: 1,
    feet: [{ x: 12, y: 30 }, { x: 20, y: 30 }],
    handB: { x: 12, y: 21 }, handF: { x: 21, y: 23 },
    blade: { x0: 21, y0: 23, x1: 26, y1: 28 },
    arc: { cx: 17, cy: 19, r: 12, a0: -10 * D, a1: 55 * D, fade: true },
    scarf: [[11, 17], [9, 18], [7, 18]],
    pulse: 0.5,
  }));

  // ---- row 5: HURT (2) — recoil, ember visor flash, stagger -----------------
  drawFrame(ctx, 0, 5, pose({
    dy: 0, lean: -2, headDy: 1, hurt: true,
    feet: [{ x: 12, y: 30 }, { x: 19, y: 30 }],
    handB: { x: 9, y: 17 }, handF: { x: 22, y: 16 },
    scarf: [[19, 15], [21, 14], [23, 15]],          // scarf whips forward
    sparks: [[22, 12, PAL.white], [10, 13, PAL.ember0], [24, 20, PAL.ember1]],
    pulse: 0,
  }));
  drawFrame(ctx, 1, 5, pose({
    dy: 1, lean: -3, headDy: 1, hurt: true, blink: true,
    feet: [{ x: 13, y: 30 }, { x: 18, y: 30 }],
    handB: { x: 10, y: 20 }, handF: { x: 21, y: 19 },
    scarf: [[18, 16], [20, 15], [22, 16]],
    pulse: 0,
  }));

  // ---- row 6: DASH (2) — motion-stretched lunge, streaks, horizontal scarf --
  drawFrame(ctx, 0, 6, pose({
    dy: 1, lean: 3, wide: 2, streaks: 1,
    feet: [{ x: 11, y: 29 }, { x: 14, y: 30 }],
    handB: { x: 12, y: 22 }, handF: { x: 24, y: 19 },
    scarf: [[10, 17], [7, 17], [4, 18]],
    pulse: 1,
  }));
  drawFrame(ctx, 1, 6, pose({
    dy: 1, lean: 3, wide: 2, streaks: 2,
    feet: [{ x: 12, y: 30 }, { x: 15, y: 29 }],
    handB: { x: 13, y: 22 }, handF: { x: 24, y: 20 },
    scarf: [[10, 18], [7, 16], [4, 17]],
    pulse: 0.6,
  }));

  return {
    image: c,
    anims: {
      idle:   { frames: frameGrid(FW, FH, 4, 0), fps: 5,  loop: true },
      run:    { frames: frameGrid(FW, FH, 8, 1), fps: 14, loop: true },
      jump:   { frames: frameGrid(FW, FH, 2, 2), fps: 8,  loop: false },
      fall:   { frames: frameGrid(FW, FH, 2, 3), fps: 8,  loop: true },
      attack: { frames: frameGrid(FW, FH, 4, 4), fps: 16, loop: false },
      hurt:   { frames: frameGrid(FW, FH, 2, 5), fps: 8,  loop: false },
      dash:   { frames: frameGrid(FW, FH, 2, 6), fps: 12, loop: true },
    },
    anchor: { x: FW / 2, y: FH },
  };
}
