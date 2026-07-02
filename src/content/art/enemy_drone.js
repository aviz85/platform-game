// AETHERFALL — enemy_drone: hovering scout robot.
// Violet saucer shell, single cyan sensor eye, twin under-thrusters with glow.
// Sheet layout: row 0 = 'move' (6 frames: hover bob + thruster flicker + antenna sway)
//               row 1 = 'attack' (4 frames: swoop telegraph — eye flares red-magenta,
//                                 thrusters choke then blast, nose dips into the dive)
// Frame size 18x16. Anchor = bottom-center (feet), engine flips via facing.
import { PAL } from './palette.js';
import { makeCanvas, P, outline, glow, shade, frameGrid } from './util.js';

const FW = 18, FH = 16;

// One drone pose. All coords are frame-local; `dip` shears the nose (x>=10) down
// for the swoop pose. Draw order inside a frame: hull -> outline -> emissives.
function drawDrone(ctx, fx, fy, o) {
  const {
    bob = 0,          // vertical hover offset (-1..1)
    dip = 0,          // nose-down shear for the dive pose
    sway = 0,         // antenna lag (secondary motion, opposite the bob)
    eyeTop, eyeBot,   // lens ramp
    eyeHot,           // catchlight pixel
    eyeGlowC, eyeGlowR,
    tipC,             // antenna beacon color
    thrL = 2, thrR = 2, // flame lengths (0..3)
    thrHot = false,   // white-hot flame cores
    crackle = false,  // energy sparks on the shell (attack peak)
  } = o;

  const by = 5 + bob; // hull top row
  const px = (x, y, c) => P(ctx, fx + x, fy + y + (dip && x >= 10 ? dip : 0), c);
  const row = (x0, x1, y, c) => { for (let x = x0; x <= x1; x++) px(x, y, c); };

  // --- antenna (lags behind the bob) ---
  px(6, by - 1, PAL.metal2);
  px(6 + sway, by - 2, PAL.metal1);

  // --- violet hull, lit from upper-left ---
  row(7, 10, by, PAL.violet0);                                  // dome highlight
  row(5, 12, by + 1, PAL.violet1);
  row(5, 7, by + 1, PAL.violet0);                               // top-left light
  row(4, 13, by + 2, PAL.violet1);
  px(4, by + 2, PAL.violet0);
  px(13, by + 2, PAL.violet2);
  row(3, 14, by + 3, PAL.violet2);                              // waistline / eye row
  px(3, by + 3, PAL.violet1);                                   // lit left edge
  row(4, 13, by + 4, PAL.violet2);
  row(9, 13, by + 4, PAL.violet3);                              // lower-right shade
  px(4, by + 4, shade(PAL.violet2, 0.12));
  row(5, 12, by + 5, PAL.violet3);                              // underbelly
  px(12, by + 5, PAL.cyan3);                                    // thruster rim bounce

  // panel seams
  px(6, by + 2, shade(PAL.violet1, -0.18));
  px(12, by + 4, shade(PAL.violet3, -0.2));

  // --- side fins ---
  px(2, by + 3, PAL.violet1);                                   // left fin (lit)
  px(15, by + 3, PAL.violet3);                                  // right fin (shaded)
  px(15, by + 4, shade(PAL.violet3, -0.15));

  // --- eye socket + lens base (hot pixels & glow come after outline) ---
  row(7, 11, by + 2, PAL.deepPurple);
  row(7, 11, by + 3, PAL.deepPurple);
  row(8, 10, by + 2, eyeTop);
  row(8, 10, by + 3, eyeBot);

  // --- thruster nozzles ---
  px(5, by + 6, PAL.metal0); px(6, by + 6, PAL.metal2);
  px(11, by + 6, PAL.metal1); px(12, by + 6, PAL.metal3);

  // hull outline (before emissive flames/glows so they stay halo-free)
  outline(ctx, fx, fy, FW, FH);

  // --- emissives: antenna beacon, eye hot pixels, flames, glows ---
  px(6 + sway, by - 3, tipC);
  glow(ctx, fx + 6 + sway, fy + by - 3, 1, tipC);

  px(8, by + 2, eyeHot);                                        // catchlight
  px(9, by + 2, shade(eyeHot, 0.35));                           // hot core
  glow(ctx, fx + 9, fy + by + 2, eyeGlowR, eyeGlowC);

  const flame = (x0, len, hot) => {
    if (len <= 0) return;
    const yy = by + 7 + (dip && x0 >= 10 ? dip : 0);
    row(x0, x0 + 1, by + 7, hot ? PAL.white : PAL.cyan0);
    if (len > 1) row(x0, x0 + 1, by + 8, PAL.cyan1);
    if (len > 2) px(x0 + (hot ? 1 : 0), by + 9, PAL.cyan2);
    glow(ctx, fx + x0, fy + yy + 1, 2, PAL.cyan1);
  };
  flame(5, thrL, thrHot);
  flame(11, thrR, thrHot);

  if (crackle) {                                                // pre-swoop energy arcs
    px(5, by, PAL.magenta0);
    px(12, by + 1, PAL.magenta0);
    px(4, by + 5, PAL.magenta1);
    px(14, by + 2, PAL.magenta0);
  }
}

export function build() {
  const c = makeCanvas(FW * 6, FH * 2);
  const ctx = c.getContext('2d');

  // ---- move: gentle sine bob, flickering thrusters, lagging antenna ----
  const bobs = [0, -1, -1, 0, 1, 1];
  const tL = [2, 3, 2, 2, 3, 2];
  const tR = [3, 2, 2, 3, 2, 3];
  for (let i = 0; i < 6; i++) {
    drawDrone(ctx, i * FW, 0, {
      bob: bobs[i],
      sway: -bobs[i],
      eyeTop: PAL.cyan1, eyeBot: PAL.cyan2,
      eyeHot: i % 3 === 0 ? PAL.white : PAL.cyan0,
      eyeGlowC: PAL.cyan1, eyeGlowR: 2,
      tipC: i % 2 === 0 ? PAL.cyan0 : PAL.cyan1,
      thrL: tL[i], thrR: tR[i], thrHot: i === 1 || i === 4,
    });
  }

  // ---- attack: rise + choke -> red-magenta flare builds -> nose-down swoop ----
  drawDrone(ctx, 0, FH, {                    // f0: anticipation — lift, engines choke
    bob: -1, sway: -1,
    eyeTop: PAL.magenta1, eyeBot: PAL.magenta2,
    eyeHot: PAL.magenta0,
    eyeGlowC: PAL.magenta1, eyeGlowR: 2,
    tipC: PAL.magenta0, thrL: 1, thrR: 1,
  });
  drawDrone(ctx, FW, FH, {                   // f1: flare builds
    bob: -1, sway: 0,
    eyeTop: PAL.pink1, eyeBot: PAL.magenta1,
    eyeHot: PAL.pink0,
    eyeGlowC: PAL.magenta1, eyeGlowR: 3,
    tipC: PAL.pink0, thrL: 2, thrR: 2,
  });
  drawDrone(ctx, FW * 2, FH, {               // f2: peak flare — crackling, white-hot
    bob: 0, sway: 1,
    eyeTop: PAL.pink1, eyeBot: PAL.ember1,
    eyeHot: PAL.white,
    eyeGlowC: PAL.pink1, eyeGlowR: 4,
    tipC: PAL.pink0, thrL: 3, thrR: 3, thrHot: true,
    crackle: true,
  });
  drawDrone(ctx, FW * 3, FH, {               // f3: swoop — nose dips, engines blast
    bob: 1, dip: 1, sway: 1,
    eyeTop: PAL.pink1, eyeBot: PAL.magenta2,
    eyeHot: PAL.white,
    eyeGlowC: PAL.magenta1, eyeGlowR: 3,
    tipC: PAL.magenta0, thrL: 3, thrR: 3, thrHot: true,
  });

  return {
    image: c,
    anims: {
      move: { frames: frameGrid(FW, FH, 6, 0), fps: 8, loop: true },
      attack: { frames: frameGrid(FW, FH, 4, 1), fps: 10, loop: false },
    },
    anchor: { x: FW / 2, y: FH - 1 },
  };
}
