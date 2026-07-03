// AETHERFALL — bg_ruins_near.js
// SKY BASTION near parallax layer (factor 0.7, autoScroll 2).
// A continuous ruined rampart runs the full width: crenellated battlements,
// a shattered round tower, two weathered guardian statues (one hooded with a
// stone sword, one headless winged sentinel), a collapsed bridge arch with
// floating masonry, and a torn golden banner. Everything is pushed several
// shades darker than the play area so gameplay reads clearly, with faint
// sunset-amber rim light from the upper-left, dim cyan holo-glyphs, and
// drifting alpha cloud wisps front and back. Tiles horizontally seamlessly:
// the rampart profile is built from sines periodic in W, and every free
// shape is drawn through wrap-around helpers.
import { PAL } from './palette.js';
import { makeCanvas, P, R, dither, glow, shade, rng } from './util.js';

const W = 640, H = 270;
const TAU = Math.PI * 2;

// ---------- dark ruins palette (near layer sits BEHIND play — keep it deep) ----------
const C = {
  dark:    shade(PAL.stone3, -0.52), // deepest shadow / right edges
  base3:   shade(PAL.stone3, -0.36), // main silhouette fill
  base2:   shade(PAL.stone3, -0.14), // lit-side fill
  base1:   shade(PAL.stone2, -0.30), // carved details / sword stone
  lit:     shade(PAL.stone1, -0.40), // top edges catching the sky
  mortar:  shade(PAL.stone3, -0.62), // brick seams
  crack:   shade(PAL.stone3, -0.70),
  rim:     shade(PAL.amber2, -0.10), // sunset rim light, upper-left contours
  rimHot:  shade(PAL.amber1, -0.30),
  winGlow: shade(PAL.amber1, -0.35), // dim window interior
  verd2:   shade(PAL.moss2, -0.28),  // verdigris streaks
  verd1:   shade(PAL.moss1, -0.45),
  gold:    shade(PAL.gold1, -0.55),  // torn banner cloth
  goldLit: shade(PAL.gold1, -0.35),
  glyph:   PAL.cyan2,
  glyphHot: PAL.cyan1,
  cloudA:  shade(PAL.skyGlow, 0.22),
  cloudB:  shade(PAL.horizon, 0.06),
  cloudC:  shade(PAL.stone0, 0.02),
};

// ---------- wrap-around drawing (keeps the tile seam invisible) ----------
function WP(ctx, x, y, c) { P(ctx, ((Math.round(x) % W) + W) % W, y, c); }
function WR(ctx, x, y, w, h, c) {
  x = ((Math.round(x) % W) + W) % W;
  w = Math.round(w);
  if (w <= 0 || h <= 0) return;
  if (x + w <= W) R(ctx, x, y, w, h, c);
  else { R(ctx, x, y, W - x, h, c); R(ctx, 0, y, x + w - W, h, c); }
}

// rampart walkway height — sum of sines with periods that divide W => seamless
const rTop = (x) =>
  208 +
  7 * Math.sin(TAU * (2 * x) / W) +
  4 * Math.sin(TAU * (5 * x) / W + 2.1) +
  3 * Math.sin(TAU * (9 * x) / W + 4.4);

// soft wind-torn cloud wisp (alpha-blended, wrapped). Alpha feathers per row so the
// top/bottom edges dissolve into mist instead of reading as a hard-edged strip.
function wisp(ctx, cx, cy, len, th, col, a, rr) {
  ctx.save();
  for (let j = -th; j <= th; j++) {
    const f = Math.max(0, 1 - (j * j) / (th * th + 0.2));
    const wRow = Math.round(len * Math.sqrt(f) * (0.82 + rr() * 0.32));
    const drift = Math.round((rr() - 0.5) * 6) + (j < 0 ? j * 2 : j); // top blown leeward
    ctx.globalAlpha = a * (0.30 + 0.70 * f);   // core rows opaque, fringes fade to nothing
    WR(ctx, cx - wRow / 2 + drift, Math.round(cy) + j, wRow, 1, col);
  }
  ctx.restore();
}

// small rubble mound sitting on the walkway
function rubble(ctx, cx, gy, w, rr) {
  const h = Math.max(2, Math.round(w * 0.45));
  for (let j = 0; j < h; j++) {
    const rw = Math.round(w * (j + 1) / h) + Math.round(rr() * 2);
    WR(ctx, cx - rw / 2, gy - h + j, rw, 1, j === 0 ? C.base2 : C.base3);
  }
  WP(ctx, cx - Math.round(w / 4), gy - h, C.lit);
}

// two-tier statue pedestal; returns y of its top surface
function pedestal(ctx, cx, gy) {
  WR(ctx, cx - 15, gy - 5, 30, 5, C.base3);
  WR(ctx, cx - 15, gy - 5, 30, 1, C.lit);
  WR(ctx, cx - 15, gy - 4, 1, 4, C.base2);
  WR(ctx, cx + 14, gy - 4, 1, 4, C.dark);
  WR(ctx, cx - 11, gy - 9, 22, 4, C.base3);
  WR(ctx, cx - 11, gy - 9, 22, 1, C.lit);
  WR(ctx, cx - 11, gy - 8, 1, 3, C.base2);
  WR(ctx, cx + 10, gy - 8, 1, 3, C.dark);
  // chipped corner + hairline crack
  WP(ctx, cx + 12, gy - 5, C.mortar);
  WP(ctx, cx - 4, gy - 3, C.crack);
  WP(ctx, cx - 3, gy - 2, C.crack);
  return gy - 9;
}

// hooded guardian statue holding a stone sword point-down
function statueGuardian(ctx, cx, gy) {
  const base = pedestal(ctx, cx, gy);
  const shoulderY = base - 32;
  // robe — trapezoid widening to the base, shaded left→right
  for (let r = 0; r <= 32; r++) {
    const hw = 3 + Math.round((r / 32) * 5);
    const y = shoulderY + r;
    WR(ctx, cx - hw, y, hw * 2 + 1, 1, C.base3);
    WR(ctx, cx - hw, y, 2, 1, C.base2);
    WP(ctx, cx + hw, y, C.dark);
    if (r % 3 === 0) WP(ctx, cx - hw, y, C.rim); // sunset rim on left contour
    if (r > 14) { WP(ctx, cx - 2, y, C.mortar); WP(ctx, cx + 3, y, C.mortar); } // fold shadows
  }
  // hood + head
  const hw2 = [2, 3, 4, 4, 4, 4, 3, 3];
  for (let j = 0; j < 8; j++) {
    const y = shoulderY - 8 + j;
    WR(ctx, cx - hw2[j], y, hw2[j] * 2 + 1, 1, C.base3);
    WP(ctx, cx - hw2[j], y, j < 4 ? C.rim : C.base2);
  }
  WP(ctx, cx, shoulderY - 9, C.lit); // hood peak
  // shadowed face opening + cyan watcher eyes
  WR(ctx, cx - 2, shoulderY - 4, 5, 2, PAL.void);
  glow(ctx, cx, shoulderY - 3, 4, PAL.cyan3);
  WP(ctx, cx - 2, shoulderY - 4, C.glyph);
  WP(ctx, cx + 1, shoulderY - 4, C.glyphHot);
  WP(ctx, cx + 1, shoulderY - 4, PAL.cyan0); // hot core — a spark of life left in the stone
  // hands clasped at chest on the sword
  WR(ctx, cx - 1, shoulderY + 5, 3, 2, C.base2);
  // crossguard + blade running down to the pedestal
  WR(ctx, cx - 4, shoulderY + 7, 9, 1, C.base1);
  WP(ctx, cx - 4, shoulderY + 7, C.lit);
  for (let y = shoulderY + 8; y < base; y++) {
    WP(ctx, cx, y, C.base1);
    WP(ctx, cx + 1, y, C.base3);
  }
  WP(ctx, cx, base - 1, C.base2); // point
  // broken right shoulder — a bite of sky
  ctx.clearRect(cx + 3, shoulderY - 1, 3, 3);
  WP(ctx, cx + 3, shoulderY + 2, C.base2);
  WP(ctx, cx + 4, shoulderY + 2, C.lit);
  // long weathering crack down the robe
  let crx = cx - 3;
  for (let y = shoulderY + 10; y < base - 2; y += 2) {
    WP(ctx, crx, y, C.crack);
    crx += (y % 4 === 0) ? 1 : ((y % 6 === 0) ? -1 : 0);
  }
}

// headless winged sentinel, one wing snapped, raised arm cradling a dim orb
function statueSentinel(ctx, cx, gy) {
  const base = pedestal(ctx, cx, gy);
  const topY = base - 26;
  // intact left wing — sweeping up-left in layered stone feathers
  for (let j = 0; j < 7; j++) {
    const y = topY + 8 - j * 2;
    const x0 = cx - 7 - j * 3;
    const wl = 8 + j;
    WR(ctx, x0, y, wl, 2, C.base3);
    WR(ctx, x0, y, wl, 1, C.base2);
    WP(ctx, x0, y, C.rim);
    WP(ctx, x0 + 2, y + 2, C.dark); // feather notch
  }
  WP(ctx, cx - 7 - 6 * 3, topY + 8 - 12 - 1, C.rimHot); // wingtip catch-light
  // snapped right wing stub
  WR(ctx, cx + 4, topY + 5, 6, 4, C.base3);
  WR(ctx, cx + 4, topY + 5, 6, 1, C.base2);
  WP(ctx, cx + 9, topY + 6, C.mortar);
  WP(ctx, cx + 8, topY + 8, C.mortar);
  // torso — shaded left→right
  for (let r = 0; r <= 26; r++) {
    const hw = 3 + Math.round((r / 26) * 3);
    const y = topY + r;
    WR(ctx, cx - hw, y, hw * 2 + 1, 1, C.base3);
    WR(ctx, cx - hw, y, 2, 1, C.base2);
    WP(ctx, cx + hw, y, C.dark);
    if (r % 3 === 1) WP(ctx, cx - hw, y, C.rim);
  }
  // headless neck stump, flat and lit
  WR(ctx, cx - 2, topY - 1, 5, 1, C.lit);
  WR(ctx, cx - 2, topY, 5, 1, C.base2);
  // raised arm to a cradled dim cyan orb (the one light it still carries)
  WP(ctx, cx - 4, topY + 3, C.base2);
  WP(ctx, cx - 5, topY + 1, C.base2);
  WP(ctx, cx - 6, topY - 1, C.base2);
  WP(ctx, cx - 7, topY - 3, C.base1);
  WR(ctx, cx - 9, topY - 6, 3, 3, PAL.cyan3);
  WP(ctx, cx - 9, topY - 6, C.glyph);
  WP(ctx, cx - 8, topY - 6, C.glyphHot);
  WP(ctx, cx - 8, topY - 5, PAL.cyan0); // hot core of the last-carried light
  glow(ctx, cx - 8, topY - 5, 5, PAL.cyan3);
  // waist crack
  WP(ctx, cx - 1, topY + 14, C.crack);
  WP(ctx, cx, topY + 15, C.crack);
  WP(ctx, cx + 1, topY + 15, C.crack);
}

export function build() {
  const c = makeCanvas(W, H);
  const ctx = c.getContext('2d');

  // ================= back cloud wisps (behind the ruins) =================
  const br = rng(333);
  for (let i = 0; i < 5; i++) {
    wisp(ctx, br() * W, 148 + br() * 55, 70 + br() * 120, 3 + Math.round(br() * 4),
      C.cloudC, 0.09 + br() * 0.05, br);
  }
  wisp(ctx, 96, 82, 150, 2, C.cloudC, 0.08, br);   // thin high streaks
  wisp(ctx, 430, 58, 190, 2, C.cloudC, 0.07, br);

  // ================= continuous rampart (full width => seamless) =================
  for (let x = 0; x < W; x++) {
    const t = Math.round(rTop(x));
    R(ctx, x, t, 1, H - t, C.base3);
    P(ctx, x, t, C.lit);       // walkway lip catches the sky
    P(ctx, x, t + 1, C.base2);
  }
  // brick courses — horizontal mortar seams + offset vertical joints
  for (let y = 190; y < H; y += 9) {
    for (let x = 0; x < W; x++) if (y > rTop(x) + 3) P(ctx, x, y, C.mortar);
    const course = (y - 190) / 9;
    for (let x = (course % 2) * 8; x < W; x += 16) {
      for (let j = 1; j < 9 && y + j < H; j++) {
        if (y + j > rTop(x) + 3) P(ctx, x, y + j, shade(C.base3, -0.22));
      }
    }
  }
  const wr = rng(41);
  // chipped catch-light stones scattered across the face
  for (let i = 0; i < 60; i++) {
    const x = Math.floor(wr() * W), y = 196 + Math.floor(wr() * 66);
    if (y > rTop(x) + 4) { WP(ctx, x, y, C.base1); WP(ctx, x + 1, y, C.base2); }
  }
  // deep weathering cracks wandering down the masonry
  for (let i = 0; i < 6; i++) {
    let x = Math.floor(wr() * W);
    let y = Math.round(rTop(x)) + 4;
    const len = 14 + Math.floor(wr() * 16);
    for (let j = 0; j < len && y < H - 2; j++) {
      WP(ctx, x, y, C.crack);
      y += 1;
      if (wr() < 0.4) x += wr() < 0.5 ? -1 : 1;
    }
  }
  // battle-damage bites out of the walkway lip
  for (let i = 0; i < 10; i++) {
    const x = 8 + Math.floor(wr() * (W - 20));
    const t = Math.round(rTop(x));
    const bw = 3 + Math.floor(wr() * 3);
    ctx.clearRect(x, t, bw, 2);
    for (let k = 0; k < bw; k++) P(ctx, x + k, t + 2, C.base2);
  }

  // ================= crenellations (40 merlons, 16px period divides W) =================
  const mr = rng(101);
  for (let i = 0; i < 40; i++) {
    const x0 = i * 16 + 4;
    const t = Math.round(rTop(x0 + 4));
    const roll = mr();
    if (roll < 0.16) { // blasted away — rubble stump only
      WR(ctx, x0 + 1, t - 2, 5, 3, C.base3);
      WR(ctx, x0 + 2, t - 3, 2, 1, C.base2);
      WP(ctx, x0 + 1, t - 3, C.lit);
      continue;
    }
    const h = 7 + Math.floor(mr() * 5);
    WR(ctx, x0, t - h, 8, h + 2, C.base3);
    WR(ctx, x0, t - h, 8, 1, C.lit);
    WR(ctx, x0, t - h + 1, 1, h, C.base2);
    WR(ctx, x0 + 7, t - h + 1, 1, h, C.dark);
    if (mr() < 0.5) { // chipped top-right corner
      ctx.clearRect(x0 + 5, t - h, 3, 2);
      WR(ctx, x0 + 5, t - h + 2, 3, 1, C.lit);
    }
  }

  // ================= arrow slits along the face (two still faintly lit) ==============
  const slitXs = [30, 148, 214, 305, 382, 490, 558, 612];
  for (let i = 0; i < slitXs.length; i++) {
    const x = slitXs[i];
    const y = Math.round(rTop(x)) + 14;
    WR(ctx, x, y, 2, 7, PAL.void);
    WP(ctx, x, y - 1, PAL.void);
    WR(ctx, x - 1, y + 7, 4, 1, C.base2); // sill
    if (i === 2 || i === 6) {             // someone — or something — keeps a lamp
      WP(ctx, x, y + 4, C.winGlow);
      WP(ctx, x + 1, y + 5, shade(C.winGlow, -0.25));
      glow(ctx, x + 1, y + 4, 3, shade(PAL.amber1, -0.45));
    }
  }

  // ================= shattered round tower (x 60..108) =================
  {
    const twX = 60, twW = 48;
    const rt = rng(7);
    const tops = [];
    let ty = 96;
    for (let i = 0; i < twW; i++) {
      ty += i > 34 ? 1 + rt() * 2.4 : (rt() - 0.5) * 3; // right side slumps into ruin
      ty = Math.max(88, Math.min(152, ty));
      tops.push(Math.round(ty));
    }
    for (let i = 0; i < twW; i++) {
      const x = twX + i, top = tops[i], bot = Math.round(rTop(x)) + 2;
      const col = i < 8 ? C.base2 : (i < 36 ? C.base3 : C.dark);
      R(ctx, x, top, 1, Math.max(0, bot - top), col);
      P(ctx, x, top, i < 36 ? C.lit : C.base2);
      if (i === 0 && top % 4 === 0) P(ctx, x, top, C.rim);
    }
    for (let y = 100; y < 205; y += 4) if (y % 8 === 0) P(ctx, twX, y, C.rim); // rim dashes
    // belt courses
    for (const by of [122, 152]) {
      for (let i = 1; i < twW - 1; i++) {
        if (by > tops[i] + 2) {
          P(ctx, twX + i, by, C.base2);
          P(ctx, twX + i, by - 1, i < 36 ? C.lit : C.base2);
        }
      }
    }
    // brick hint
    for (let y = 100; y < 204; y += 7) {
      for (let i = 2; i < twW - 2; i += 2) if (y > tops[i] + 2) P(ctx, twX + i, y, C.mortar);
    }
    // arched windows — top pair dark, lower one dimly lit from within
    const win = (wx, wy, lit2) => {
      for (let j = 0; j < 14; j++) {
        const wdt = j === 0 ? 4 : (j === 1 ? 6 : 8);
        const off = (8 - wdt) / 2;
        for (let k = 0; k < wdt; k++) {
          const i = wx - twX + off + k;
          if (wy + j > tops[Math.max(0, Math.min(twW - 1, Math.round(i)))] + 2) {
            P(ctx, wx + off + k, wy + j, PAL.void);
          }
        }
      }
      WR(ctx, wx - 1, wy + 14, 10, 1, C.base2); // sill
      if (lit2) {
        dither(ctx, wx + 2, wy + 9, 4, 4, PAL.void, C.winGlow);
        glow(ctx, wx + 4, wy + 11, 4, shade(PAL.amber1, -0.4));
      }
    };
    win(twX + 12, 106, false);
    win(twX + 12, 156, true);
    win(twX + 27, 130, false);
    // verdigris weeping from the sills and the break
    const vg = (vx, vy, len) => {
      for (let j = 0; j < len; j++) {
        P(ctx, vx, vy + j, C.verd2);
        if (j % 3 === 1) P(ctx, vx + 1, vy + j, C.verd2);
      }
      P(ctx, vx, vy, C.verd1);
    };
    vg(twX + 14, 121, 9);
    vg(twX + 31, 145, 7);
    vg(twX + 20, 171, 10);
    // snapped floor beam jutting from the collapse
    WR(ctx, twX + 40, 138, 9, 3, C.base3);
    WR(ctx, twX + 40, 138, 9, 1, C.base2);
    WP(ctx, twX + 48, 139, C.mortar);
  }

  // ================= hooded guardian statue =================
  statueGuardian(ctx, 180, Math.round(rTop(180)) + 1);

  // ================= collapsed bridge arch (x 250..360) =================
  {
    const pier = (px) => {
      const bot = Math.round(rTop(px + 6)) + 2;
      WR(ctx, px - 2, 150, 16, 3, C.base3); // cap
      WR(ctx, px - 2, 150, 16, 1, C.lit);
      WP(ctx, px - 2, 151, C.rim);
      for (let i = 0; i < 12; i++) {
        const col = i < 3 ? C.base2 : (i < 10 ? C.base3 : C.dark);
        R(ctx, px + i, 153, 1, Math.max(0, bot - 153), col);
      }
      for (let y = 158; y < bot; y += 8) WR(ctx, px + 1, y, 10, 1, C.mortar);
    };
    pier(252);
    pier(344);
    // broken arch band — middle span fell into the clouds long ago
    const acx = 304, arx = 42, ary = 27, atop = 153;
    const ar = rng(19);
    for (let x = acx - arx; x <= acx + arx; x++) {
      if (x > 293 && x < 317) continue; // the missing span
      const f = 1 - ((x - acx) * (x - acx)) / (arx * arx);
      if (f <= 0) continue;
      let yA = Math.round(atop - ary * Math.sqrt(f));
      const nearBreak = (x > 289 && x <= 293) || (x >= 317 && x < 321);
      if (nearBreak) yA += Math.round(ar() * 2); // jagged fracture edges
      P(ctx, x, yA, C.lit);
      R(ctx, x, yA + 1, 1, 2, x < acx ? C.base2 : C.base3);
      R(ctx, x, yA + 3, 1, 3, C.base3);
      P(ctx, x, yA + 6, C.dark);
      if (nearBreak && ar() < 0.6) P(ctx, x, yA + 7, C.base3); // hanging shards
    }
    // masonry still floating where the span used to be (aether holds it)
    const chunk = (kx, ky, kw, kh, runed) => {
      WR(ctx, kx, ky, kw, kh, C.base3);
      WR(ctx, kx, ky, kw, 1, C.base2);
      WP(ctx, kx, ky, C.rim);
      WP(ctx, kx + kw - 1, ky + kh - 1, C.dark);
      if (runed) {
        WP(ctx, kx + Math.floor(kw / 2), ky + Math.floor(kh / 2), C.glyphHot);
        WP(ctx, kx + Math.floor(kw / 2), ky + Math.floor(kh / 2) - 1, PAL.cyan0); // hot core
        glow(ctx, kx + Math.floor(kw / 2), ky + Math.floor(kh / 2), 3, PAL.cyan3);
      }
    };
    chunk(296, 108, 7, 5, false);
    chunk(308, 117, 5, 4, true);
    chunk(302, 97, 4, 3, false);
    chunk(315, 103, 3, 3, false);
    chunk(291, 122, 4, 3, false);
    // spill of fallen blocks on the walkway beneath the gap
    rubble(ctx, 300, Math.round(rTop(300)) + 1, 12, ar);
    rubble(ctx, 310, Math.round(rTop(310)) + 1, 7, ar);
  }

  // ================= banner wall (x 400..470) =================
  {
    const bw0 = 400, bw1 = 470;
    for (let x = bw0; x <= bw1; x++) {
      let top = 170;
      if (x > 460) top += Math.round((x - 460) * 1.5); // eroded right corner
      const bot = Math.round(rTop(x)) + 2;
      const i = x - bw0;
      const col = i < 4 ? C.base2 : (x > 456 ? C.dark : C.base3);
      R(ctx, x, top, 1, Math.max(0, bot - top), col);
      P(ctx, x, top, x <= 460 ? C.lit : C.base2);
    }
    for (let y = 176; y < 204; y += 8) WR(ctx, bw0 + 2, y, 62, 1, C.mortar);
    for (let y = 174; y < 200; y += 8) WP(ctx, bw0, y, C.rim);
    // merlons on top (one blown out)
    for (let i = 0; i < 5; i++) {
      if (i === 3) continue;
      const x0 = 402 + i * 12;
      WR(ctx, x0, 163, 7, 8, C.base3);
      WR(ctx, x0, 163, 7, 1, C.lit);
      WR(ctx, x0, 164, 1, 7, C.base2);
      WP(ctx, x0 + 6, 164, C.dark);
    }
    // banner pole with a gold finial
    WR(ctx, 438, 112, 2, 58, C.base1);
    WR(ctx, 438, 112, 1, 58, C.base2);
    WP(ctx, 438, 111, C.goldLit);
    WP(ctx, 439, 111, C.gold);
    glow(ctx, 438, 111, 3, shade(PAL.gold1, -0.25));
    // torn golden banner streaming right on the wind
    const fr2 = rng(88);
    for (let y = 116; y <= 148; y++) {
      const r = y - 116;
      let wCloth = Math.round(17 - r * 0.18 + Math.sin(r * 0.55) * 2);
      if (y > 140) { // tattered hem — ragged strips
        if (fr2() < 0.35) continue;
        wCloth = Math.max(3, wCloth - Math.round(fr2() * 6));
      }
      WR(ctx, 440, y, wCloth, 1, C.gold);
      WP(ctx, 440, y, C.goldLit);
      // wind folds
      const f1 = 445 + Math.round(Math.sin(y * 0.5) * 2);
      const f2 = 451 + Math.round(Math.sin(y * 0.4 + 2) * 2);
      if (f1 < 440 + wCloth) WP(ctx, f1, y, shade(C.gold, -0.3));
      if (f2 < 440 + wCloth) WP(ctx, f2, y, shade(C.gold, -0.3));
    }
    // faded sigil — a diamond of the lost bastion
    WP(ctx, 447, 124, C.glyph);
    WP(ctx, 446, 125, C.glyph);
    WP(ctx, 448, 125, C.glyphHot);
    WP(ctx, 447, 126, C.glyph);
    WP(ctx, 447, 125, PAL.cyan0); // hot core of the ward-sigil
    glow(ctx, 447, 125, 4, PAL.cyan3);
  }

  // ================= headless winged sentinel =================
  statueSentinel(ctx, 522, Math.round(rTop(522)) + 1);

  // ================= squat ruined turret (x 585..627) =================
  {
    const tx = 585, tw = 42;
    const rt2 = rng(23);
    let ty2 = 178;
    for (let i = 0; i < tw; i++) {
      ty2 += (rt2() - 0.48) * 2.4;
      ty2 = Math.max(172, Math.min(196, ty2));
      const top = Math.round(ty2);
      const bot = Math.round(rTop(tx + i)) + 2;
      const col = i < 6 ? C.base2 : (i > 34 ? C.dark : C.base3);
      R(ctx, tx + i, top, 1, Math.max(0, bot - top), col);
      P(ctx, tx + i, top, i > 34 ? C.base2 : C.lit);
      if (i === 0 && top % 4 === 0) P(ctx, tx, top, C.rim);
    }
    for (let y = 186; y < 208; y += 7) WR(ctx, tx + 2, y, tw - 5, 1, C.mortar);
    // dark doorway arch facing the walkway
    WR(ctx, tx + 16, 194, 6, 12, PAL.void);
    WR(ctx, tx + 17, 192, 4, 2, PAL.void);
    WP(ctx, tx + 15, 194, C.base2);
    // verdigris stain
    for (let j = 0; j < 8; j++) P(ctx, tx + 30, 190 + j, C.verd2);
    P(ctx, tx + 30, 190, C.verd1);
  }

  // ================= rubble scatter along the walkway =================
  const rb = rng(64);
  for (const rx of [40, 132, 226, 340, 480, 570]) {
    rubble(ctx, rx, Math.round(rTop(rx)) + 1, 6 + Math.round(rb() * 6), rb);
  }

  // ================= floating holo-glyphs (ancient wards still flickering) ==========
  ctx.save();
  ctx.globalAlpha = 0.8;
  for (const [gx, gy] of [[122, 138], [366, 132], [543, 150]]) {
    WP(ctx, gx, gy, C.glyph);
    WP(ctx, gx, gy + 3, C.glyphHot);
    WP(ctx, gx, gy + 6, C.glyph);
    WP(ctx, gx + 1, gy + 3, C.glyph);
    WP(ctx, gx, gy + 3, PAL.cyan0); // flickering hot core of the ward
  }
  ctx.restore();
  glow(ctx, 122, 141, 4, PAL.cyan3);
  glow(ctx, 366, 135, 4, PAL.cyan3);
  glow(ctx, 543, 153, 4, PAL.cyan3);

  // ================= mid cloud wisps drifting across the structures =================
  const fr = rng(777);
  for (let i = 0; i < 4; i++) {
    wisp(ctx, fr() * W, 194 + fr() * 34, 100 + fr() * 140, 4 + Math.round(fr() * 4),
      i % 2 ? C.cloudC : C.cloudA, 0.11 + fr() * 0.06, fr);
  }

  // ============ atmospheric AO: the wall dissolves into the mist at its base ==========
  // Graded dither (full width => seamless) darkens the flat masonry toward the cloudline,
  // killing the banding of the plain C.base3 fill and grounding the rampart in the sea.
  dither(ctx, 0, 226, W, 8, C.base3, shade(C.base3, -0.14));
  dither(ctx, 0, 234, W, 9, C.base3, shade(C.base3, -0.32));
  dither(ctx, 0, 243, W, 10, shade(C.base3, -0.34), C.dark);

  // ================= cloud sea licking the base of the wall =================
  const cr = rng(555);
  for (let i = 0; i < 9; i++) {
    wisp(ctx, cr() * W, 246 + cr() * 16, 90 + cr() * 130, 4 + Math.round(cr() * 4),
      i % 2 ? C.cloudA : C.cloudB, 0.15 + cr() * 0.1, cr);
  }
  // dense periodic band at the very bottom (sines divide W => seamless).
  // Per-row alpha ramp: wispy at the crest, thick and opaque at the very bottom.
  ctx.save();
  for (let x = 0; x < W; x++) {
    const hh = Math.round(7 + 4 * Math.sin(TAU * 3 * x / W) + 3 * Math.sin(TAU * 7 * x / W + 2));
    for (let k = 0; k < hh; k++) {
      ctx.globalAlpha = 0.10 + 0.26 * (k / Math.max(1, hh - 1)); // fade in from the crest down
      P(ctx, x, H - hh + k, k > hh - 3 ? C.cloudA : C.cloudB);   // brightest froth at the base
    }
  }
  ctx.restore();

  return {
    canvas: c,
    factor: 0.7,     // near layer parallax
    tileX: true,
    y: 0,
    autoScroll: 2,   // slow wind drift for the cloud wisps
    alpha: 1,
  };
}
