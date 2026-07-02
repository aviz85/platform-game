// AETHERFALL — bg_depths_near: NEON DEPTHS near parallax layer (factor 0.7).
// Close machinery silhouettes kept darker than gameplay: reactor tanks, cooling
// stacks, full-width pipe runs, catwalk gantries, a half-buried reactor core,
// blinking status lights (mixed on/off states), magenta/cyan neon conduits,
// rising steam plumes and hanging ceiling cables.
// Every draw call goes through wrap helpers (drawn at x, x-W, x+W) so the layer
// tiles horizontally with zero seam.
import { PAL } from './palette.js';
import { makeCanvas, P, R, line, ellipseFill, glow, shade, rng } from './util.js';

const W = 640, H = 270;

export function build() {
  const c = makeCanvas(W, H);
  const ctx = c.getContext('2d');
  const rnd = rng(4207);

  // ---- tones: deliberately darker than gameplay tiles ----
  const farSil = shade(PAL.deepPurple, -0.12); // deepest silhouette band (must read against cave backdrop)
  const dk3 = shade(PAL.metal3, -0.42);        // main silhouette body
  const dk2 = shade(PAL.metal3, -0.22);        // detail / lit-side panels
  const dk1 = shade(PAL.metal3, -0.06);        // sparse brightest structure tone
  const rim = shade(PAL.metal2, -0.28);        // upper-left rim light
  const rimHi = shade(PAL.metal2, -0.10);      // hottest rim accents (sparse)
  const rustD = shade(PAL.rust2, -0.34);
  const rustM = shade(PAL.rust2, -0.14);
  const teal = shade(PAL.leaf3, -0.30);        // dark teal cavern rock
  const tealD = shade(PAL.leaf3, -0.48);
  const hazA = shade(PAL.amber2, -0.30);       // muted hazard stripes
  const hazB = shade(PAL.outline, -0.15);
  const steamA = shade(PAL.stone1, 0.06);
  const steamB = shade(PAL.stone2, 0.04);

  // ---- seamless wrap helpers ----
  const wR = (x, y, w, h, col) => { R(ctx, x, y, w, h, col); R(ctx, x - W, y, w, h, col); R(ctx, x + W, y, w, h, col); };
  const wP = (x, y, col) => { P(ctx, ((x % W) + W) % W, y, col); };
  const wGlow = (x, y, r, col) => { glow(ctx, x, y, r, col); glow(ctx, x - W, y, r, col); glow(ctx, x + W, y, r, col); };
  const wEll = (x, y, rx, ry, col) => { ellipseFill(ctx, x, y, rx, ry, col); ellipseFill(ctx, x - W, y, rx, ry, col); ellipseFill(ctx, x + W, y, rx, ry, col); };
  const wLine = (x0, y0, x1, y1, col) => { line(ctx, x0, y0, x1, y1, col); line(ctx, x0 - W, y0, x1 - W, y1, col); line(ctx, x0 + W, y0, x1 + W, y1, col); };

  // ---- small part painters ----
  // status beacon: lit = glow + hot core + colored cross; off = dead dark diode
  function beacon(x, y, col, on) {
    if (on) {
      wGlow(x, y, 3, col);
      wP(x - 1, y, col); wP(x + 1, y, col); wP(x, y - 1, col); wP(x, y + 1, col);
      wP(x, y, PAL.white);
    } else {
      wP(x, y, shade(col, -0.62));
    }
  }

  // row of small indicator lights on a recessed panel — mixed blink states
  function lightPanel(x, y, n, col) {
    wR(x - 2, y - 2, n * 4 + 3, 5, shade(dk3, -0.30));
    wR(x - 2, y - 2, n * 4 + 3, 1, dk2);
    for (let i = 0; i < n; i++) beacon(x + i * 4, y, col, rnd() > 0.42);
  }

  // dark machine box with rim light, panel seams, rivets and vent slits
  function box(x, y, w, h, base) {
    wR(x, y, w, h, base);
    wR(x, y, w, 1, rim);                       // top rim (light from upper-left)
    wR(x, y, 1, h, shade(base, 0.16));         // left edge
    wR(x + w - 1, y, 1, h, shade(base, -0.30));// right shadow
    for (let sx = x + 11; sx < x + w - 3; sx += 13) wR(sx, y + 2, 1, h - 2, shade(base, -0.24));
    for (let rx = x + 3; rx < x + w - 2; rx += 6) wP(rx, y + 2, shade(base, 0.22));
    for (let vy = y + 6; vy < y + Math.min(h - 3, 22); vy += 4) wR(x + 4, vy, 5, 1, shade(base, -0.34));
  }

  // vertical cylinder tank: dome, curved shading, rings, rust streaks, lit port
  function tank(cx, baseY, w, h, portCol) {
    const x0 = cx - (w >> 1), top = baseY - h;
    for (let i = 0; i < w; i++) {
      const t = i / (w - 1);
      let col = dk3;
      if (t < 0.10) col = rim;
      else if (t < 0.30) col = dk2;
      else if (t > 0.86) col = shade(dk3, -0.32);
      wR(x0 + i, top + 3, 1, h - 3, col);
    }
    wEll(cx, top + 3, w >> 1, 3, dk2);                    // dome
    wR(x0 + 3, top + 1, Math.max(3, w >> 2), 1, rimHi);   // dome highlight
    for (let ry = top + 15; ry < baseY - 10; ry += 18) {  // weld rings
      wR(x0, ry, w, 1, shade(dk3, -0.36));
      wR(x0, ry + 1, w, 1, dk2);
    }
    for (let k = 0; k < 3; k++) {                          // rust drips
      const sx = x0 + 4 + ((rnd() * (w - 8)) | 0);
      const sy = top + 12 + ((rnd() * (h * 0.45)) | 0);
      wR(sx, sy, 1, 5 + ((rnd() * 9) | 0), rustD);
      wP(sx, sy, rustM);
    }
    // lit inspection port
    wR(cx - 3, top + (h >> 1) - 2, 6, 5, shade(dk3, -0.36));
    wR(cx - 2, top + (h >> 1) - 1, 4, 3, shade(portCol, -0.45));
    wP(cx - 1, top + (h >> 1), portCol);
    wGlow(cx, top + (h >> 1), 3, portCol);
    beacon(cx, top - 2, PAL.ember1, true);                 // dome beacon
  }

  // cooling stack: hazard band collar + top beacon
  function stack(cx, baseY, w, h, on) {
    const x0 = cx - (w >> 1), top = baseY - h;
    wR(x0, top, w, h, dk3);
    wR(x0, top, 1, h, dk2);
    wR(x0 + w - 1, top, 1, h, shade(dk3, -0.32));
    wR(x0 - 1, top, w + 2, 2, dk2);                        // lip
    wR(x0 - 1, top, w + 2, 1, rim);
    for (let i = 0; i < w; i++)                            // diagonal hazard band
      for (let j = 0; j < 5; j++) wP(x0 + i, top + 5 + j, (((i + j) >> 1) & 1) ? hazA : hazB);
    for (let ry = top + 16; ry < baseY - 6; ry += 14) wR(x0, ry, w, 1, shade(dk3, -0.30));
    beacon(cx, top - 3, PAL.ember1, on);
  }

  // full-width horizontal pipe run (period-64 flanges keep the seam invisible)
  function pipeRun(y, r, base) {
    wR(0, y - r, W, r * 2 + 1, base);
    wR(0, y - r, W, 1, shade(base, 0.18));
    wR(0, y - r + 1, W, 1, shade(base, 0.08));
    wR(0, y + r - 1, W, 2, shade(base, -0.32));
    for (let x = 18; x < W + 18; x += 64) {
      wR(x, y - r - 1, 3, r * 2 + 3, shade(base, -0.16));
      wR(x, y - r - 1, 1, r * 2 + 3, shade(base, 0.14));
    }
  }

  // vertical pipe with joint collars
  function vpipe(x, y0, y1, w) {
    wR(x, y0, w, y1 - y0, dk3);
    wR(x, y0, 1, y1 - y0, dk2);
    wR(x + w - 1, y0, 1, y1 - y0, shade(dk3, -0.32));
    for (let yy = y0 + 6; yy < y1 - 3; yy += 18) { wR(x - 1, yy, w + 2, 2, dk2); wR(x - 1, yy, w + 2, 1, rim); }
  }

  // catwalk gantry: deck, railing, X-braces
  function catwalk(x0, x1, y) {
    wR(x0, y - 6, x1 - x0, 1, dk2);                        // handrail
    for (let x = x0; x <= x1 - 1; x += 9) wR(x, y - 5, 1, 5, shade(dk3, -0.10));
    wR(x0, y, x1 - x0, 2, dk2);                            // deck
    wR(x0, y, x1 - x0, 1, rim);
    for (let x = x0; x + 12 <= x1; x += 12) {              // truss braces
      wLine(x, y + 2, x + 11, y + 9, shade(dk3, -0.18));
      wLine(x + 11, y + 2, x, y + 9, shade(dk3, -0.18));
    }
    wR(x0, y + 9, x1 - x0, 1, shade(dk3, -0.28));          // lower chord
  }

  // recessed exhaust fan with faint cyan inner glow
  function fan(cx, cy, r) {
    wEll(cx, cy, r + 2, r + 2, shade(dk3, -0.36));
    ctx.globalAlpha = 0.55;
    wEll(cx, cy, r, r, shade(PAL.cyan3, -0.40));
    ctx.globalAlpha = 1;
    wLine(cx - r + 1, cy, cx + r - 1, cy, dk2);
    wLine(cx, cy - r + 1, cx, cy + r - 1, dk2);
    wR(cx - 1, cy - 1, 3, 3, dk2);
    wP(cx - 1, cy - 1, rim);
  }

  // rising steam plume from a vent mouth
  function plume(x, baseY, h, seed) {
    const r2 = rng(seed);
    for (let t = 0; t < h; t += 3) {
      const k = t / h;
      const px = x + Math.round(Math.sin(t * 0.13 + seed) * (1 + k * 3) + k * 6 + (r2() - 0.5) * 2);
      const rx = Math.max(1, Math.round(2 + k * 6));
      const ry = Math.max(1, Math.round(1 + k * 2.2));
      ctx.globalAlpha = 0.05 + 0.24 * (1 - k * 0.85);
      wEll(px, baseY - t, rx, ry, ((t / 3) & 1) ? steamA : steamB);
    }
    ctx.globalAlpha = 1;
    wR(x - 3, baseY - 2, 7, 3, shade(dk3, -0.36));        // vent mouth
    wR(x - 3, baseY - 2, 7, 1, dk2);
  }

  // thin neon conduit line with pulse nodes (period-64 → seamless)
  function conduit(y, c3, c1, c0) {
    wR(0, y, W, 1, c3);
    for (let x = 6; x < W + 6; x += 16) wR(x, y, 5, 1, shade(c3, 0.18));
    for (let x = 30; x < W + 30; x += 64) {
      wGlow(x, y, 3, c1);
      wP(x - 1, y, c1); wP(x + 1, y, c1);
      wP(x, y, c0);
    }
  }

  // hanging ceiling cable (parabolic sag from y=0)
  function cable(x0, x1, sag, col) {
    const mid = (x0 + x1) / 2, hw = (x1 - x0) / 2;
    for (let x = x0; x <= x1; x++) {
      const t = (x - mid) / hw;
      wP(x, Math.round(sag * (1 - t * t)), col);
    }
  }

  // ============ depth band 0: deepest machinery skyline ============
  const backTops = [
    [0, 78, 148], [78, 60, 122], [138, 74, 156], [212, 92, 116],
    [304, 70, 140], [374, 66, 120], [440, 96, 150], [536, 104, 130],
  ];
  for (const [x, w, top] of backTops) {
    wR(x, top, w, H - top, farSil);
    wR(x, top, w, 1, shade(farSil, 0.10));
    if (w > 66) {                                          // antenna mast + dim beacon
      const mx = x + (w >> 1);
      wR(mx, top - 14, 1, 14, farSil);
      wR(mx - 3, top - 8, 7, 1, farSil);
      beacon(mx, top - 15, shade(PAL.ember1, -0.20), rnd() > 0.5);
    }
    // faint lit windows on the deep band
    for (let wy = top + 8; wy < top + 30; wy += 9) {
      for (let wx = x + 6; wx < x + w - 4; wx += 11) {
        if (rnd() > 0.72) wP(wx, wy, shade(PAL.cyan3, -0.18));
      }
    }
  }

  // half-buried reactor core peeking between deep structures
  wEll(258, 152, 27, 27, shade(farSil, -0.25));
  wEll(258, 152, 22, 22, dk3);
  wEll(258, 152, 15, 15, shade(PAL.magenta3, -0.35));
  wEll(258, 152, 8, 8, PAL.magenta3);
  wGlow(258, 152, 10, PAL.magenta1);
  wR(257, 151, 3, 3, PAL.magenta1);
  wP(258, 152, PAL.magenta0);
  for (let a = 0; a < 8; a++) {                            // core housing bolts
    const ang = (a / 8) * Math.PI * 2;
    wP(258 + Math.round(Math.cos(ang) * 24), 152 + Math.round(Math.sin(ang) * 24), dk2);
  }

  // ============ depth band 1: main silhouette structures ============
  tank(62, 262, 54, 118, PAL.cyan1);
  box(126, 172, 88, 98, dk3);
  fan(158, 196, 11);
  lightPanel(180, 182, 4, PAL.cyan1);
  stack(238, 250, 16, 128, true);
  stack(268, 250, 14, 112, false);
  tank(338, 262, 60, 104, PAL.magenta1);
  // lattice gantry tower
  {
    const gx = 424, gw = 34, gt = 128;
    wR(gx, gt, 1, H - gt, dk2);
    wR(gx + gw, gt, 1, H - gt, shade(dk3, -0.20));
    wR(gx + 1, gt, gw - 1, 2, dk2);
    wR(gx + 1, gt, gw - 1, 1, rim);
    for (let yy = gt + 8; yy < 244; yy += 16) {
      wLine(gx, yy, gx + gw, yy + 12, shade(dk3, -0.10));
      wLine(gx + gw, yy, gx, yy + 12, shade(dk3, -0.10));
      wR(gx, yy, gw + 1, 1, dk3);
    }
    beacon(gx + (gw >> 1), gt - 2, PAL.ember1, true);
    // dish antenna on the tower head
    wEll(gx + 26, gt - 5, 4, 3, dk2);
    wP(gx + 26, gt - 8, rim);
  }
  tank(508, 258, 44, 86, PAL.cyan1);
  // seam-crossing machine hall (hides the tile boundary)
  box(596, 178, 92, 92, dk3);
  fan(618, 204, 9);
  lightPanel(604, 188, 5, PAL.magenta1);
  vpipe(560, 196, 262, 7);
  vpipe(150, 214, 262, 6);
  vpipe(368, 210, 262, 6);

  // ============ depth band 2: front floor mass + pipe works ============
  catwalk(96, 300, 188);
  catwalk(432, 624, 182);
  pipeRun(212, 6, dk2);
  pipeRun(232, 3, shade(PAL.rust2, -0.26));
  // floor mass
  wR(0, 240, W, 30, dk2);
  wR(0, 240, W, 1, rim);
  wR(0, 241, W, 1, dk1);
  for (let x = 9; x < W + 9; x += 32) wR(x, 243, 1, 27, shade(dk3, -0.14));   // floor seams
  for (let x = 4; x < W + 4; x += 16) wP(x, 244, shade(dk2, 0.20));           // rivets
  for (let i = 0; i < W; i++)                                                  // hazard strip
    for (let j = 0; j < 4; j++) wP(i, 248 + j, ((((i + j) >> 2) & 1) ? hazA : hazB));
  wR(0, 252, W, 1, shade(dk3, -0.30));
  // grated under-glow vents along the floor
  for (let x = 44; x < W + 44; x += 128) {
    wR(x, 258, 22, 6, shade(dk3, -0.36));
    for (let gx = x + 2; gx < x + 21; gx += 3) wR(gx, 259, 1, 4, shade(PAL.magenta3, -0.30));
    wGlow(x + 11, 261, 5, shade(PAL.magenta2, -0.15));
    wP(x + 11, 261, PAL.magenta1);
  }
  // dark teal cavern rock shoulders at the floor line
  wEll(20, 274, 34, 16, teal);
  wEll(20, 274, 34, 16, teal);
  wEll(46, 278, 22, 12, tealD);
  wEll(322, 278, 30, 13, tealD);
  wEll(300, 276, 26, 13, teal);
  wEll(606, 275, 30, 14, teal);
  for (let k = 0; k < 10; k++) wP(2 + ((rnd() * 60) | 0), 262 + ((rnd() * 6) | 0), shade(teal, 0.15));

  // status panels on the floor machines
  lightPanel(330, 246, 6, PAL.cyan1);
  lightPanel(118, 246, 4, PAL.magenta1);
  lightPanel(524, 246, 5, PAL.cyan1);

  // ============ neon conduits ============
  conduit(220, shade(PAL.cyan3, -0.20), PAL.cyan2, PAL.cyan0);
  conduit(237, shade(PAL.magenta3, -0.22), PAL.magenta2, PAL.magenta0);

  // ============ steam plumes (over machinery) ============
  plume(152, 210, 84, 3);
  plume(238, 122, 58, 7);
  plume(372, 206, 72, 11);
  plume(566, 192, 88, 17);

  // ============ ceiling: pipe strip + hanging cables ============
  wR(0, 0, W, 3, dk3);
  wR(0, 3, W, 1, shade(dk3, -0.26));
  for (let x = 22; x < W + 22; x += 64) wR(x, 0, 2, 6, dk2);   // clamps
  cable(38, 150, 16, shade(dk3, 0.10));
  cable(150, 236, 11, dk3);
  cable(330, 470, 19, shade(dk3, 0.10));
  cable(470, 560, 9, dk3);
  cable(586, 690, 14, dk3);                                     // wraps the seam
  beacon(94, 16, PAL.cyan1, true);
  beacon(400, 19, PAL.magenta1, rnd() > 0.5);
  beacon(638, 13, PAL.cyan1, false);

  return { canvas: c, factor: 0.7, tileX: true, y: 0, alpha: 1 };
}
