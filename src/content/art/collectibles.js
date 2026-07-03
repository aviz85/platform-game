// AETHERFALL collectibles — 'shard' (spinning cyan crystal, 6 frames) and
// 'heart' (pulsing pink energy heart, 4 frames). Frames are 10x12; anchor is
// feet-center (bottom middle). Row 0 = shard, row 1 = heart.
import { PAL } from './palette.js';
import { makeCanvas, P, R, outline, glow, shade, frameGrid } from './util.js';

const FW = 10, FH = 12;

// ---------------------------------------------------------------------------
// SHARD — an elongated crystal diamond rotating around its vertical axis.
// 6 frames: front → turning → edge-flash (catches the light) → dark edge →
// back-turning → back. Width follows |cos| of the rotation; the specular
// glint column sweeps across the face and the shaded facets swap sides so
// the 3D spin reads clearly at 1x.
// ---------------------------------------------------------------------------

// vertical taper: pointed tip, widest just above center, long lower point
const SHARD_PROFILE = [0.18, 0.55, 0.85, 1, 1, 0.85, 0.62, 0.42, 0.26, 0.1];

// per-frame: half-width, facet colors [left, mid, right, rightEdge, top],
// glint column offset from center (null = no glint), brightness of frame
const SHARD_FRAMES = [
  { hw: 3, left: PAL.cyan1, mid: PAL.cyan1, right: PAL.cyan2, edge: PAL.cyan3, top: PAL.cyan0, glint: -1, flash: false },
  { hw: 2, left: PAL.cyan1, mid: PAL.cyan2, right: PAL.cyan3, edge: PAL.cyan3, top: PAL.cyan0, glint: 0,  flash: false },
  { hw: 1, left: PAL.cyan0, mid: PAL.cyan0, right: PAL.cyan1, edge: PAL.cyan1, top: PAL.white, glint: 0,  flash: true  },
  { hw: 1, left: PAL.cyan3, mid: PAL.cyan2, right: PAL.cyan3, edge: PAL.cyan3, top: PAL.cyan1, glint: null, flash: false },
  { hw: 2, left: PAL.cyan3, mid: PAL.cyan2, right: PAL.cyan1, edge: PAL.cyan2, top: PAL.cyan1, glint: 1,  flash: false },
  { hw: 3, left: PAL.cyan2, mid: PAL.cyan2, right: PAL.cyan1, edge: PAL.cyan2, top: PAL.cyan0, glint: 2,  flash: false },
];

function drawShard(ctx, ox, oy, f) {
  const S = SHARD_FRAMES[f];
  const cx = ox + 5;          // center column of the 10px frame
  const topY = oy + 1;        // crystal spans y 1..10 inside the frame

  for (let r = 0; r < SHARD_PROFILE.length; r++) {
    const rhw = Math.round(S.hw * SHARD_PROFILE[r]);
    const y = topY + r;
    // upper-left light: top rows read slightly hotter, lower rows sink darker
    const vf = 0.09 - r * 0.024;
    for (let dx = -rhw; dx <= rhw; dx++) {
      const isEdge = dx === rhw && rhw > 0;
      const isRim  = dx === -rhw && rhw > 0 && r <= 4;
      let c = dx < 0 ? S.left : dx > 0 ? S.right : S.mid;
      if (r <= 1) c = S.top;                                  // lit tip (upper-left light)
      else if (isEdge) c = S.edge;                            // dark right edge
      else if (isRim) c = PAL.cyan0;                          // rim light, upper-left
      else {
        // interior facet — vertical ramp + anti-band checker (two close shades)
        c = ((dx + r) & 1) ? shade(c, vf) : shade(c, vf - 0.07);
      }
      if (r >= 8) c = dx >= 0 ? PAL.cyan3 : PAL.cyan2;        // shaded lower point
      P(ctx, cx + dx, y, c);
    }
    // internal facet ridge (mid column stays bright on wide frames)
    if (S.hw >= 2 && r >= 2 && r <= 5) P(ctx, cx, y, shade(PAL.cyan1, vf + 0.05));
  }

  // sweeping specular glint — a hot core with a soft trailing bloom above/below
  if (S.glint !== null) {
    const gx = cx + Math.max(-S.hw + 1, Math.min(S.hw - (S.hw > 1 ? 1 : 0), S.glint));
    P(ctx, gx, topY + 1, PAL.cyan1);
    P(ctx, gx, topY + 2, PAL.cyan0);
    P(ctx, gx, topY + 3, PAL.white);
    P(ctx, gx, topY + 4, PAL.cyan0);
    P(ctx, gx, topY + 5, PAL.cyan1);
    if (S.hw >= 3) { P(ctx, gx - 1, topY + 3, PAL.cyan0); }   // widened glint on broad faces
  }

  outline(ctx, ox, oy, FW, FH);

  // emissive halo + hot pixels (after outline so bloom sits over everything)
  glow(ctx, cx, oy + 5, S.flash ? 6 : 5, PAL.cyan2);              // wide faint aura
  glow(ctx, cx, oy + 5, S.flash ? 4 : 3, S.flash ? PAL.cyan0 : PAL.cyan1);
  P(ctx, cx, topY + 3, PAL.white);

  if (S.flash) {
    // edge-on flash: 4-point star sparkle
    P(ctx, cx, oy + 0, PAL.white);
    P(ctx, cx, topY + 10, PAL.cyan0);
    P(ctx, cx - 3, oy + 5, PAL.cyan0);
    P(ctx, cx + 3, oy + 5, PAL.cyan0);
    P(ctx, cx - 2, oy + 2, PAL.white);
    P(ctx, cx + 2, oy + 8, PAL.cyan0);
  } else {
    // tiny orbiting mote to add secondary motion
    const motes = [[cx + 3, oy + 2], [cx + 4, oy + 6], [cx - 4, oy + 8], null, [cx - 4, oy + 4], [cx - 3, oy + 1]];
    const m = motes[f];
    if (m) P(ctx, m[0], m[1], PAL.cyan0);
  }
}

// ---------------------------------------------------------------------------
// HEART — pink energy heart, 4-frame pulse: contracted → swelling → full
// bloom (bright rim + sparkle) → settling. Light upper-left: pale-pink
// highlight on the left lobe, magenta shade on the lower-right.
// ---------------------------------------------------------------------------

// row spans [startCol, endCol] relative to the shape's own grid
const HEART_SMALL = [ // 5 wide, 4 tall
  [[0, 1], [3, 4]],
  [[0, 4]],
  [[1, 3]],
  [[2, 2]],
];
const HEART_BIG = [ // 7 wide, 7 tall
  [[1, 2], [4, 5]],
  [[0, 6]],
  [[0, 6]],
  [[0, 6]],
  [[1, 5]],
  [[2, 4]],
  [[3, 3]],
];

function drawHeartShape(ctx, ox, oy, spans, w, bright = 0) {
  const h = spans.length;
  for (let r = 0; r < h; r++) {
    const vt = h > 1 ? r / (h - 1) : 0;                         // 0 top .. 1 bottom tip
    for (const [a, b] of spans[r]) {
      for (let cIdx = a; cIdx <= b; cIdx++) {
        // vertical energy gradient: bright pink lobes fading into deep magenta core
        let col = vt < 0.34 ? PAL.pink1
                : vt < 0.68 ? shade(PAL.pink1, -0.14)          // mid transition tone
                : PAL.magenta1;
        if (cIdx >= w - 2 && r >= 1) col = PAL.magenta1;        // right shade
        if (r >= h - 3 && cIdx >= (w >> 1)) col = PAL.magenta2; // lower-right deep shade
        if (cIdx === b && r >= h - 2) col = PAL.magenta2;       // bottom tip edge
        // anti-band dither on the interior mid-body so the gradient never stripes
        if (vt >= 0.3 && vt < 0.72 && cIdx > a && cIdx < b && cIdx < w - 2) {
          col = ((cIdx + r) & 1) ? col : shade(col, 0.1);
        }
        if (r <= 1 && cIdx <= 2 && cIdx >= a) col = PAL.pink0;  // left-lobe highlight
        if (bright) col = shade(col, bright);                  // pulse bloom lift
        P(ctx, ox + cIdx, oy + r, col);
      }
    }
  }
}

function drawHeart(ctx, ox, oy, f) {
  const cx = ox + 5;
  if (f === 0) {
    // contracted beat
    drawHeartShape(ctx, ox + 3, oy + 4, HEART_SMALL, 5);
    P(ctx, ox + 4, oy + 5, PAL.white);                 // hot core
    outline(ctx, ox, oy, FW, FH);
    glow(ctx, cx, oy + 6, 4, PAL.magenta2);            // faint resting aura
    glow(ctx, cx, oy + 6, 2, PAL.pink1);
  } else {
    drawHeartShape(ctx, ox + 2, oy + 3, HEART_BIG, 7, f === 2 ? 0.13 : 0);
    P(ctx, ox + 3, oy + 4, PAL.white);                 // hot core pixel
    P(ctx, ox + 4, oy + 5, PAL.pink0);
    if (f === 2) {
      // full bloom: bright rim on the lit side
      P(ctx, ox + 2, oy + 2, PAL.pink0);
      P(ctx, ox + 3, oy + 2, PAL.white);
      P(ctx, ox + 6, oy + 2, PAL.pink0);
      P(ctx, ox + 1, oy + 4, PAL.pink0);
    }
    outline(ctx, ox, oy, FW, FH);
    glow(ctx, cx, oy + 6, f === 2 ? 6 : 5, PAL.magenta2);          // wide faint aura
    glow(ctx, cx, oy + 6, f === 2 ? 4 : 3, f === 2 ? PAL.pink0 : PAL.pink1);
    if (f === 2) {
      // sparkle motes flung off at peak of the pulse
      P(ctx, ox + 1, oy + 1, PAL.white);
      P(ctx, ox + 9, oy + 3, PAL.pink0);
      P(ctx, ox + 0, oy + 8, PAL.pink0);
    }
    if (f === 3) P(ctx, ox + 8, oy + 1, PAL.pink0);    // settling glint
  }
  // re-assert the hot core over the glow pass
  P(ctx, ox + (f === 0 ? 4 : 3), oy + (f === 0 ? 5 : 4), PAL.white);
}

// ---------------------------------------------------------------------------

export function build() {
  const c = makeCanvas(FW * 6, FH * 2);
  const ctx = c.getContext('2d');

  for (let f = 0; f < 6; f++) drawShard(ctx, f * FW, 0, f);
  for (let f = 0; f < 4; f++) drawHeart(ctx, f * FW, FH, f);

  return {
    image: c,
    anims: {
      shard: { frames: frameGrid(FW, FH, 6, 0), fps: 10, loop: true },
      heart: { frames: frameGrid(FW, FH, 4, 1), fps: 6, loop: true },
    },
    anchor: { x: FW / 2, y: FH },
  };
}
