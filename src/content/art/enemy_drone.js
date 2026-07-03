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
    flick = 0,        // per-frame flame flicker offset (0..1) — jittered hot core
    crackle = false,  // energy sparks on the shell (attack peak)
    rimFlash = null,  // silhouette rim-light color (attack charge telegraph)
    eyeGlowR2,        // optional inner-pulse radius for a two-ring eye glow
  } = o;

  const by = 5 + bob; // hull top row
  // shear starts past the lens (x>=11) so the eye never splits across the dip
  const px = (x, y, c) => P(ctx, fx + x, fy + y + (dip && x >= 11 ? dip : 0), c);
  const row = (x0, x1, y, c) => { for (let x = x0; x <= x1; x++) px(x, y, c); };

  // --- antenna (lags behind the bob) ---
  px(6, by - 1, PAL.metal2);
  px(6 + sway, by - 2, PAL.metal1);

  // --- violet hull, lit from upper-left ---
  row(7, 10, by, PAL.violet0);                                  // dome highlight
  px(7, by, shade(PAL.violet0, 0.42));                          // specular glint (key light)
  px(8, by, shade(PAL.violet0, 0.2));
  row(5, 12, by + 1, PAL.violet1);
  row(5, 7, by + 1, PAL.violet0);                               // top-left light
  px(11, by + 1, shade(PAL.violet1, -0.14));                    // anti-band: right-side falloff
  row(4, 13, by + 2, PAL.violet1);
  px(4, by + 2, PAL.violet0);
  px(11, by + 2, PAL.violet2);                                  // anti-band step into waistline
  px(13, by + 2, PAL.violet2);
  row(3, 14, by + 3, PAL.violet2);                              // waistline / eye row
  px(3, by + 3, PAL.violet1);                                   // lit left edge
  px(4, by + 3, shade(PAL.violet2, 0.16));                      // anti-band graded edge
  row(4, 13, by + 4, PAL.violet2);
  row(9, 13, by + 4, PAL.violet3);                              // lower-right shade
  px(8, by + 4, shade(PAL.violet2, -0.08));                     // anti-band transition pixel
  px(4, by + 4, shade(PAL.violet2, 0.12));
  row(5, 12, by + 5, PAL.violet3);                              // underbelly
  px(5, by + 5, PAL.cyan3);                                     // left thruster rim bounce
  px(12, by + 5, PAL.cyan3);                                    // right thruster rim bounce
  px(8, by + 5, shade(PAL.violet3, -0.12));                     // deepest belly shade (form)

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
  px(9, by + 3, shade(eyeBot, 0.28));                           // lower lens glint (depth)
  glow(ctx, fx + 9, fy + by + 2, eyeGlowR, eyeGlowC);
  if (eyeGlowR2) glow(ctx, fx + 9, fy + by + 2, eyeGlowR2, eyeHot); // inner pulse ring

  const flame = (x0, len, hot) => {
    if (len <= 0) return;
    const yy = by + 7 + (dip && x0 >= 11 ? dip : 0);
    // throat: white-hot pair when firing hard, else a bright cyan core
    row(x0, x0 + 1, by + 7, hot ? PAL.white : PAL.cyan0);
    px(x0 + flick, by + 7, PAL.white);                          // flicker: darting hot core
    if (len > 1) {
      row(x0, x0 + 1, by + 8, PAL.cyan1);
      px(x0 + flick, by + 8, hot ? PAL.cyan0 : PAL.cyan1);      // flicker: brighter mid pixel
    }
    if (len > 2) {
      px(x0 + (hot ? 1 : 0), by + 9, PAL.cyan2);
      px(x0 + (1 - flick), by + 9, shade(PAL.cyan2, -0.12));   // dithered taper tip (anti hard-edge)
    }
    glow(ctx, fx + x0, fy + yy + 1, len >= 3 ? 3 : 2, hot ? PAL.cyan0 : PAL.cyan1);
  };
  flame(5, thrL, thrHot);
  flame(11, thrR, thrHot);

  // silhouette rim-flash: flare color licks the hull edges — reads as "charging"
  if (rimFlash) {
    px(7, by - 0, rimFlash); px(10, by, shade(rimFlash, 0.2));  // dome corners
    px(3, by + 3, rimFlash); px(14, by + 3, rimFlash);          // widest points glow
    px(4, by + 4, shade(rimFlash, -0.15));
    glow(ctx, fx + 3, fy + by + 3, 1, rimFlash);
    glow(ctx, fx + 14, fy + by + 3, 1, rimFlash);
  }

  if (crackle) {                                                // pre-swoop energy arcs
    px(5, by, PAL.magenta0);
    px(12, by + 1, PAL.magenta0);
    px(4, by + 5, PAL.magenta1);
    px(14, by + 2, PAL.magenta0);
    glow(ctx, fx + 5, fy + by, 1, PAL.magenta1);                // arcs now spark real light
    glow(ctx, fx + 14, fy + by + 2, 1, PAL.magenta1);
  }
}

export function build() {
  const c = makeCanvas(FW * 6, FH * 2);
  const ctx = c.getContext('2d');

  // ---- move: gentle sine bob, flickering thrusters, lagging antenna ----
  const bobs = [0, -1, -1, 0, 1, 1];
  const tL = [2, 3, 2, 2, 3, 2];
  const tR = [3, 2, 2, 3, 2, 3];
  const eyeR = [2, 2, 3, 3, 3, 2];      // sine-ish eye glow pulse across the loop
  const eyeR2 = [0, 0, 1, 1, 0, 0];     // inner ring blooms at the pulse peak
  const flk = [0, 1, 0, 1, 1, 0];       // thruster hot-core jitter per frame
  for (let i = 0; i < 6; i++) {
    drawDrone(ctx, i * FW, 0, {
      bob: bobs[i],
      sway: -bobs[i],
      eyeTop: PAL.cyan1, eyeBot: PAL.cyan2,
      eyeHot: eyeR2[i] ? PAL.white : PAL.cyan0,
      eyeGlowC: PAL.cyan1, eyeGlowR: eyeR[i], eyeGlowR2: eyeR2[i],
      tipC: i % 2 === 0 ? PAL.cyan0 : PAL.cyan1,
      thrL: tL[i], thrR: tR[i], thrHot: i === 1 || i === 4,
      flick: flk[i],
    });
  }

  // ---- attack: rise + choke -> red-magenta flare builds -> nose-down swoop ----
  drawDrone(ctx, 0, FH, {                    // f0: anticipation — lift, engines choke
    bob: -1, sway: -1,
    eyeTop: PAL.magenta1, eyeBot: PAL.magenta2,
    eyeHot: PAL.magenta0,
    eyeGlowC: PAL.magenta1, eyeGlowR: 2,
    tipC: PAL.magenta0, thrL: 1, thrR: 1, flick: 0,
  });
  drawDrone(ctx, FW, FH, {                   // f1: flare builds — rim starts to glow
    bob: -1, sway: 0,
    eyeTop: PAL.pink1, eyeBot: PAL.magenta1,
    eyeHot: PAL.pink0,
    eyeGlowC: PAL.magenta1, eyeGlowR: 3, eyeGlowR2: 1,
    tipC: PAL.pink0, thrL: 2, thrR: 2, flick: 1,
    rimFlash: PAL.magenta1,
  });
  drawDrone(ctx, FW * 2, FH, {               // f2: peak flare — crackling, white-hot, silhouette ablaze
    bob: 0, sway: 1,
    eyeTop: PAL.pink1, eyeBot: PAL.ember1,
    eyeHot: PAL.white,
    eyeGlowC: PAL.pink1, eyeGlowR: 4, eyeGlowR2: 2,
    tipC: PAL.pink0, thrL: 3, thrR: 3, thrHot: true, flick: 0,
    crackle: true, rimFlash: PAL.pink0,
  });
  drawDrone(ctx, FW * 3, FH, {               // f3: swoop — nose dips, engines blast, rim streaks back
    bob: 0, dip: 1, sway: 1,                 // bob 0 keeps the dipped flame tip in-frame
    eyeTop: PAL.pink1, eyeBot: PAL.magenta2,
    eyeHot: PAL.white,
    eyeGlowC: PAL.magenta1, eyeGlowR: 3, eyeGlowR2: 1,
    tipC: PAL.magenta0, thrL: 3, thrR: 3, thrHot: true, flick: 1,
    rimFlash: PAL.magenta1,
  });

  return {
    image: c,
    anims: {
      move: { frames: frameGrid(FW, FH, 6, 0), fps: 8, loop: true },
      attack: { frames: frameGrid(FW, FH, 4, 1), fps: 10, loop: false },
    },
    anchor: { x: FW / 2, y: FH },
  };
}
