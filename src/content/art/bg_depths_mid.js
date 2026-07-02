// AETHERFALL — NEON DEPTHS mid parallax layer (factor ~0.4)
// Industrial superstructure of the buried tech-city: dark metal towers with lit
// window grids, riveted panel seams, hazard-stripe bands, rooftop antennas with
// beacon lights, horizontal pipe runs carrying glowing magenta/cyan conduits,
// truss gantry catwalks with hanging lamps, sagging power cables, flickering
// holo-signs, steam vents and drifting neon motes.
// 640x270, transparent above where the cavern shows, tiles horizontally
// seamlessly (all drawing is wrapped modulo canvas width).
import { PAL } from './palette.js';
import { makeCanvas, rng, shade } from './util.js';

const W = 640, H = 270;

export function build() {
  const c = makeCanvas(W, H);
  const ctx = c.getContext('2d');
  const rnd = rng(52077);

  // ---- wrapped drawing primitives (guarantee seamless horizontal tiling) ----
  const wrap = (x) => ((Math.round(x) % W) + W) % W;
  const px = (x, y, col) => {
    y |= 0;
    if (y < 0 || y >= H) return;
    ctx.fillStyle = col;
    ctx.fillRect(wrap(x), y, 1, 1);
  };
  const hspan = (x, y, w, col) => {
    y |= 0; w |= 0;
    if (w <= 0 || y < 0 || y >= H) return;
    const sx = wrap(x);
    ctx.fillStyle = col;
    if (sx + w <= W) ctx.fillRect(sx, y, w, 1);
    else { ctx.fillRect(sx, y, W - sx, 1); ctx.fillRect(0, y, w - (W - sx), 1); }
  };
  // soft two-pass emissive halo (wrapped)
  const softGlow = (x, y, r, col) => {
    ctx.save();
    ctx.globalAlpha = 0.15;
    for (let j = -r; j <= r; j++) {
      const w = Math.floor(Math.sqrt(r * r - j * j));
      hspan(x - w, y + j, w * 2 + 1, col);
    }
    ctx.globalAlpha = 0.3;
    const r2 = Math.max(1, (r / 2) | 0);
    for (let j = -r2; j <= r2; j++) {
      const w = Math.floor(Math.sqrt(r2 * r2 - j * j));
      hspan(x - w, y + j, w * 2 + 1, col);
    }
    ctx.restore();
  };

  // extra tones derived from palette
  const metalDeep = shade(PAL.metal3, -0.24);   // shadowed right flanks
  const panelDark = shade(PAL.metal3, -0.10);   // panel seam shading
  const winOff = shade(PAL.void, 0.07);         // dead window glass
  const cableCol = shade(PAL.metal3, -0.3);

  // ------------------------------------------------------------------
  // horizontal pipe run with shading bands, bolted flanges and an
  // optional glowing neon conduit stripe with hot pulse nodes
  // ------------------------------------------------------------------
  const hpipe = (y, x0, x1, r, opt = {}) => {
    for (let x = x0; x < x1; x++) {
      for (let j = -r; j <= r; j++) {
        let col;
        if (j === -r) col = PAL.metal1;             // lit top
        else if (j === -r + 1) col = PAL.metal2;
        else if (j === r) col = PAL.outline;        // dark underside edge
        else if (j === r - 1) col = metalDeep;
        else col = PAL.metal3;
        px(x, y + j, col);
      }
      if ((x % 90) === 37 && rnd() < 0.8) px(x, y + r - 1, PAL.rust2); // drip stain
    }
    if (opt.neon) {
      const [hot, bright, dim] = opt.neon;
      const ny = y + (opt.ny ?? 0);
      for (let x = x0; x < x1; x++) px(x, ny, ((x >> 4) & 1) ? bright : dim);
      for (let x = x0 + 8; x < x1; x += 32) px(x, ny, hot);   // 640%32==0 -> seamless
      for (let x = x0 + 16; x < x1; x += 80) softGlow(x, ny, 4, bright); // 640%80==0
    }
    // bolted flanges
    for (let x = x0 + (opt.f0 ?? 26); x < x1; x += 52) {
      for (let j = -r - 1; j <= r + 1; j++) {
        px(x, y + j, j === -r - 1 ? PAL.metal1 : j === r + 1 ? PAL.outline : PAL.metal2);
        px(x + 1, y + j, j === r + 1 ? PAL.outline : panelDark);
      }
    }
  };

  // vertical duct pipe with collars
  const vpipe = (x, y0, y1, r) => {
    for (let y = y0; y < y1; y++) {
      for (let j = -r; j <= r; j++) {
        px(x + j, y, j === -r ? PAL.metal1 : j === r ? metalDeep : j < 0 ? PAL.metal2 : PAL.metal3);
      }
    }
    for (let y = y0 + 9; y < y1; y += 26) {
      hspan(x - r - 1, y, 2 * r + 3, PAL.metal2);
      hspan(x - r - 1, y + 1, 2 * r + 3, panelDark);
    }
    hspan(x - r, y0, 2 * r + 1, PAL.metal1); // lit cap
  };

  // sagging power cable (catenary), optional glowing node pixels
  const cable = (x0, y0, x1, y1, sag, nodeCol) => {
    const n = Math.max(1, Math.abs(Math.round(x1 - x0)));
    for (let k = 0; k <= n; k++) {
      const t = k / n;
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t + sag * 4 * t * (1 - t);
      px(x, y, cableCol);
      if (nodeCol && k % 14 === 7) px(x, y, nodeCol);
    }
  };

  // rising steam plume (translucent)
  const steam = (x, y) => {
    ctx.save();
    let a = 0.17;
    const puffs = [[0, 0, 1], [1, -3, 1], [-1, -7, 2], [1, -11, 2], [0, -16, 2]];
    for (const [dx, dy, r] of puffs) {
      ctx.globalAlpha = a;
      for (let j = -r; j <= r; j++) {
        const w = Math.floor(Math.sqrt(r * r - j * j));
        hspan(x + dx - w, y + dy + j, w * 2 + 1, PAL.stone0);
      }
      a *= 0.78;
    }
    ctx.restore();
  };

  // ------------------------------------------------------------------
  // holo-sign: translucent glowing billboard with scanlines and glyph
  // blocks, mounted on a short bracket arm (side = -1 arm on left, +1 right)
  // ------------------------------------------------------------------
  const holo = (x, y, w, h, ramp, side = 0, armLen = 4) => {
    const [c0, c1, c2] = ramp;
    // bracket arm to the structure
    if (side !== 0) {
      const ay = y + (h >> 1);
      const ax = side < 0 ? x - armLen : x + w;
      hspan(ax, ay, armLen, PAL.metal2);
      hspan(ax, ay + 1, armLen, metalDeep);
      px(side < 0 ? x - 1 : x + w, ay, c2); // emitter stud
    }
    softGlow(x + (w >> 1), y + (h >> 1), Math.max(w, h) - 2, c1);
    ctx.save();
    ctx.globalAlpha = 0.16;
    for (let j = 0; j < h; j++) hspan(x, y + j, w, c1);       // light field
    ctx.globalAlpha = 0.3;
    for (let j = 1; j < h; j += 2) hspan(x, y + j, w, c2);    // scanlines
    ctx.globalAlpha = 0.62;
    hspan(x, y, w, c1); hspan(x, y + h - 1, w, c2);           // frame
    for (let j = 0; j < h; j++) { px(x, y + j, c1); px(x + w - 1, y + j, c2); }
    ctx.globalAlpha = 0.85;
    for (let gy = y + 3; gy < y + h - 3; gy += 4) {           // glyph blocks
      for (let gx = x + 2; gx < x + w - 3; gx += 3) {
        if (rnd() < 0.62) {
          hspan(gx, gy, 2, c1);
          if (rnd() < 0.35) px(gx, gy + 1, c2);
          if (rnd() < 0.12) px(gx, gy, c0);
        }
      }
    }
    ctx.restore();
    px(x, y, c0); px(x + w - 1, y, c1); px(x, y + h - 1, c1); // hot corners
  };

  // ------------------------------------------------------------------
  // truss gantry catwalk between two structures, with railing,
  // hazard-tick deck edge and a hanging work lamp mid-span
  // ------------------------------------------------------------------
  const gantry = (xa, xb, y, lamp = PAL.magenta1, lampHot = PAL.magenta0) => {
    // truss below the deck
    for (let sx = xa; sx + 14 <= xb; sx += 14) {
      for (let j = 0; j <= 7; j++) {
        px(sx + j, y + 3 + j, PAL.metal3);
        px(sx + 14 - j, y + 3 + j, panelDark);
      }
      for (let j = 3; j <= 10; j++) px(sx, y + j, PAL.metal2);
    }
    for (let j = 3; j <= 10; j++) px(xb, y + j, PAL.metal2);
    for (let x = xa; x <= xb; x++) px(x, y + 10, metalDeep);   // bottom chord
    // deck
    for (let x = xa - 2; x <= xb + 2; x++) {
      px(x, y, PAL.metal1);
      px(x, y + 1, PAL.metal3);
      px(x, y + 2, PAL.outline);
    }
    // hazard ticks along the deck lip
    for (let x = xa; x <= xb; x += 2) px(x, y + 1, ((x >> 1) & 1) ? PAL.amber2 : PAL.outline);
    // railing
    for (let x = xa; x <= xb; x += 8) { px(x, y - 1, PAL.metal2); px(x, y - 2, PAL.metal2); px(x, y - 3, PAL.metal2); }
    for (let x = xa - 2; x <= xb + 2; x++) px(x, y - 4, PAL.metal2);
    for (let x = xa - 1; x <= xb + 1; x += 2) px(x, y - 4, PAL.metal1); // lit rail top
    // hanging work lamp
    const mx = ((xa + xb) / 2) | 0;
    px(mx, y + 11, cableCol); px(mx, y + 12, cableCol);
    softGlow(mx, y + 14, 5, lamp);
    hspan(mx - 1, y + 13, 3, PAL.metal2);        // lamp hood
    hspan(mx - 1, y + 14, 3, lamp);
    px(mx, y + 14, lampHot);
    px(mx, y + 15, shade(lamp, -0.25));
  };

  // ------------------------------------------------------------------
  // industrial tower: dark riveted metal hull, lit window grid, panel
  // seams, vent grilles, rust streaks, hazard band, rooftop machinery
  // ------------------------------------------------------------------
  const tower = (cx, topY, hw, opts = {}) => {
    const x0 = cx - hw, x1 = cx + hw;
    // hull columns
    for (let i = -hw; i <= hw; i++) {
      const x = cx + i;
      for (let y = topY; y < H; y++) {
        const vy = y - topY;
        let col = PAL.metal3;
        if (vy % 22 === 21) col = PAL.outline;                    // horizontal seam
        else if ((i + hw) % 14 === 13) col = panelDark;           // vertical seam
        if (i < -hw * 0.45 && vy % 22 < 2 && vy > 1) col = PAL.metal2; // lit panel tops (left)
        if (i === -hw) col = PAL.metal1;                          // lit left edge
        else if (i === -hw + 1) col = PAL.metal2;
        if (i === hw) col = metalDeep;                            // dark right edge
        else if (i === hw - 1 && col === PAL.metal3) col = panelDark;
        if (vy === 0) col = i < hw ? PAL.metal1 : PAL.metal2;     // lit roofline
        else if (vy === 1 && i > -hw && i < hw && col === PAL.metal3) col = PAL.metal2;
        if (col === PAL.metal3 && rnd() < 0.012) col = PAL.rust2; // grime flecks
        px(x, y, col);
      }
    }
    // rivets at seam crossings
    for (let vy = 21; topY + vy < H; vy += 22) {
      for (let k = 13; k < 2 * hw; k += 14) px(x0 + k - 1, topY + vy - 1, PAL.metal1);
    }
    // window grid — a few lit cyan/magenta, rare amber, rest dead glass
    for (let wy = topY + 7; wy < H - 44; wy += 11) {
      for (let wx = x0 + 4; wx <= x1 - 6; wx += 9) {
        const roll = rnd();
        if (roll < 0.32) {
          const lit = roll < 0.15 ? [PAL.cyan2, PAL.cyan1] :
            roll < 0.28 ? [PAL.magenta2, PAL.magenta1] : [PAL.amber1, PAL.amber0];
          hspan(wx, wy, 3, lit[0]); hspan(wx, wy + 1, 3, lit[0]);
          px(wx + 1, wy, lit[1]);
          if (rnd() < 0.3) softGlow(wx + 1, wy + 1, 3, lit[0]);
        } else {
          hspan(wx, wy, 3, winOff); hspan(wx, wy + 1, 3, winOff);
          if (rnd() < 0.4) px(wx, wy, PAL.metal3);               // broken pane glint
        }
        hspan(wx, wy + 2, 3, PAL.outline);                        // sill shadow
        if (rnd() < 0.18) {                                       // rust streak below sill
          const len = 2 + ((rnd() * 4) | 0);
          for (let j = 1; j <= len; j++) px(wx + ((rnd() * 3) | 0), wy + 2 + j, PAL.rust2);
        }
      }
    }
    // vent grille on one panel
    if (opts.vent !== false && hw >= 20) {
      const gx = x0 + 4 + ((rnd() * (hw - 6)) | 0);
      const gy = topY + 24 + ((rnd() * 30) | 0);
      hspan(gx - 1, gy - 1, 10, PAL.metal2);
      for (let j = 0; j < 5; j++) hspan(gx, gy + j, 8, j & 1 ? PAL.outline : metalDeep);
      hspan(gx - 1, gy + 5, 10, panelDark);
    }
    // hazard-stripe band near the base
    const hy = H - 34;
    hspan(x0 + 1, hy - 1, 2 * hw - 1, PAL.outline);
    for (let y = hy; y < hy + 4; y++) {
      for (let x = x0 + 1; x < x1; x++) {
        px(x, y, (((x + y) >> 1) & 3) < 2 ? PAL.amber2 : PAL.outline);
      }
    }
    hspan(x0 + 1, hy + 4, 2 * hw - 1, PAL.outline);
    // rooftop railing
    for (let x = x0; x <= x1; x += 6) { px(x, topY - 1, PAL.metal3); px(x, topY - 2, PAL.metal2); }
    for (let x = x0; x <= x1; x++) px(x, topY - 3, PAL.metal3);
    for (let x = x0; x <= x1; x += 2) px(x, topY - 3, PAL.metal2);
    // rooftop machinery box
    if (opts.box !== false && hw >= 16) {
      const bx = cx - ((hw * 0.55) | 0), bw = 9, bh = 6;
      for (let j = 0; j < bh; j++) hspan(bx, topY - 3 - bh + j, bw, j === 0 ? PAL.metal1 : j < 3 ? PAL.metal2 : PAL.metal3);
      px(bx + 2, topY - 4 - bh, PAL.metal2); px(bx + 6, topY - 4 - bh, PAL.metal2); // stubs
      px(bx + bw - 1, topY - 4, metalDeep);
    }
    // antenna mast + beacon
    if (opts.antenna) {
      const ax = cx + ((hw * 0.35) | 0);
      const ah = 12 + ((rnd() * 8) | 0);
      for (let j = 1; j <= ah; j++) px(ax, topY - 3 - j, j & 1 ? PAL.metal2 : PAL.metal3);
      hspan(ax - 2, topY - 3 - ((ah * 0.55) | 0), 5, PAL.metal3);      // crossbar
      hspan(ax - 1, topY - 3 - ((ah * 0.8) | 0), 3, PAL.metal3);
      const by = topY - 4 - ah;
      const bc = opts.beacon || PAL.ember1;
      softGlow(ax, by, 4, bc);
      px(ax, by, PAL.white);
      px(ax - 1, by, bc); px(ax + 1, by, bc); px(ax, by - 1, bc); px(ax, by + 1, shade(bc, -0.2));
    }
    // satellite dish
    if (opts.dish) {
      const dx = cx - ((hw * 0.1) | 0);
      px(dx, topY - 4, PAL.metal3); px(dx, topY - 5, PAL.metal3);
      for (let j = 0; j < 4; j++) hspan(dx - 3 + j, topY - 9 + j, 4 - j, j === 0 ? PAL.metal1 : PAL.metal2);
      px(dx - 3, topY - 9, PAL.metal0);                                 // lit rim
    }
    // access ladder down the right flank
    if (opts.ladder) {
      const lx = x1 + 2;
      for (let y = topY + 4; y < H - 6; y++) {
        px(lx, y, PAL.metal3); px(lx + 3, y, PAL.metal3);
        if ((y - topY) % 4 === 0) { px(lx + 1, y, PAL.metal2); px(lx + 2, y, PAL.metal2); }
      }
    }
  };

  // ================= composition =================

  // ---- back plane: ghost silhouettes of deeper superstructure ----
  ctx.save();
  ctx.globalAlpha = 0.34;
  const ghost = (cx, topY, hw) => {
    for (let i = -hw; i <= hw; i++) {
      for (let y = topY; y < H; y++) px(cx + i, y, y < topY + 2 ? PAL.metal2 : PAL.metal3);
    }
    for (let y = topY - 9; y < topY; y++) { px(cx - hw + 3, y, PAL.metal3); px(cx - hw + 4, y, PAL.metal3); } // stack
  };
  ghost(162, 118, 21);
  ghost(318, 96, 27);
  ghost(497, 128, 18);
  ghost(30, 104, 23);
  ghost(604, 140, 14);
  // distant pipe gallery
  for (let x = 0; x < W; x++) { px(x, 158, PAL.metal3); px(x, 159, PAL.metal3); px(x, 160, metalDeep); }
  ctx.restore();
  // faint lit dots on the ghosts
  ctx.save();
  ctx.globalAlpha = 0.3;
  const gdots = [[154, 132, PAL.magenta1], [170, 148, PAL.cyan1], [312, 110, PAL.cyan1],
    [328, 128, PAL.magenta1], [492, 142, PAL.amber0], [24, 122, PAL.cyan1], [606, 152, PAL.magenta1]];
  for (const [gx, gy, gc] of gdots) { px(gx, gy, gc); px(gx + 1, gy, gc); }
  ctx.restore();

  // ---- elevated back pipe with cyan conduit (passes behind the towers) ----
  hpipe(118, 0, W, 2, { neon: [PAL.cyan0, PAL.cyan1, PAL.cyan3], ny: 0, f0 : 40 });

  // ---- power cables between rooftops (drawn behind hulls, ends get buried) ----
  cable(118, 96, 206, 138, 10, PAL.magenta1);
  cable(430, 78, 528, 152, 12, PAL.cyan1);
  cable(20, 118, 58, 98, 6, null);
  cable(250, 138, 362, 90, 14, PAL.cyan1);
  cable(556, 152, 618, 118, 8, null);

  // ---- main towers (E wraps the seam at x≈640/0) ----
  tower(88, 92, 32, { antenna: true, beacon: PAL.magenta1, dish: true });
  tower(228, 132, 24, { box: true, ladder: true });
  tower(396, 72, 36, { antenna: true, beacon: PAL.ember1, box: true });
  tower(548, 146, 22, { dish: true, vent: false });
  tower(640, 112, 26, { antenna: true, beacon: PAL.cyan1, box: false }); // seam-wrapping

  // ---- vertical ducts hugging the hulls ----
  vpipe(124, 104, H, 2);
  vpipe(354, 84, H, 2);
  vpipe(48, 120, H, 1);
  vpipe(576, 158, H, 1);

  // ---- gantry catwalks spanning the gaps ----
  gantry(122, 202, 176, PAL.magenta1, PAL.magenta0);
  gantry(434, 524, 190, PAL.cyan1, PAL.cyan0);
  gantry(18, 54, 216, PAL.amber1, PAL.amber0);

  // ---- holo-signs ----
  holo(130, 128, 20, 14, [PAL.cyan0, PAL.cyan1, PAL.cyan2], -1, 4);       // off tower A
  holo(330, 88, 24, 18, [PAL.magenta0, PAL.magenta1, PAL.magenta2], 1, 6); // off tower C
  // small warning holo hanging from the back pipe
  px(282, 121, cableCol); px(282, 122, cableCol); px(282, 123, cableCol);
  holo(275, 124, 15, 10, [PAL.amber0, PAL.amber1, PAL.amber2], 0);

  // ---- front pipe runs crossing the whole layer ----
  hpipe(210, 0, W, 4, { neon: [PAL.magenta0, PAL.magenta1, PAL.magenta3], ny: -1, f0: 26 });
  hpipe(246, 0, W, 3, { neon: [PAL.cyan0, PAL.cyan1, PAL.cyan3], ny: 0, f0: 50 });

  // ---- steam vents ----
  steam(258, 204);
  steam(180, 240);
  steam(456, 240);
  steam(586, 204);
  steam(60, 172);

  // ---- drifting neon motes / weld sparks ----
  for (let i = 0; i < 14; i++) {
    const fx = rnd() * W, fy = 70 + rnd() * 180;
    const col = rnd() < 0.45 ? PAL.cyan0 : rnd() < 0.55 ? PAL.magenta0 : PAL.ember0;
    ctx.save();
    ctx.globalAlpha = 0.2;
    px(fx - 1, fy, col); px(fx + 1, fy, col); px(fx, fy - 1, col); px(fx, fy + 1, col);
    ctx.globalAlpha = 0.7;
    px(fx, fy, col);
    ctx.restore();
  }

  return { canvas: c, factor: 0.4, tileX: true, y: 0, alpha: 1 };
}
