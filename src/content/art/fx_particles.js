// AETHERFALL — fx_particles: tiny 8x8 particle sprites, all designed to fade out
// across their animation. Rows: 0 spark(4) · 1 dust(4) · 2 orb(5) · 3 boom(5) · 4 shard_glint(4)
import { PAL } from './palette.js';
import { makeCanvas, P, glow, shade, frameGrid } from './util.js';

const FW = 8, FH = 8;

// draw a list of [x,y,color] pixels at a frame origin
function px(ctx, ox, oy, pts) {
  for (const [x, y, c] of pts) P(ctx, ox + x, oy + y, c);
}

// run a frame-drawing fn with a global alpha (the fade), restoring state after
function fade(ctx, a, fn) {
  ctx.save();
  ctx.globalAlpha = a;
  fn();
  ctx.restore();
}

export function build() {
  const c = makeCanvas(FW * 5, FH * 5);
  const ctx = c.getContext('2d');

  const C0 = PAL.cyan0, C1 = PAL.cyan1, C2 = PAL.cyan2, C3 = PAL.cyan3;
  const V0 = PAL.violet0, V1 = PAL.violet1, V2 = PAL.violet2, V3 = PAL.violet3;
  const M0 = PAL.magenta0, M1 = PAL.magenta1, M2 = PAL.magenta2, M3 = PAL.magenta3;
  const A0 = PAL.amber0, A1 = PAL.amber1;
  const W = PAL.white;
  const G0 = shade(PAL.stone0, 0.10);           // dust highlight (soft pale grey-violet)
  const G1 = PAL.stone1, G2 = PAL.stone2, G3 = PAL.stone3;

  // ---------------------------------------------------------------- spark (row 0)
  // cyan four-point star, hot white core, shrinking + dimming
  {
    const oy = 0;
    // f0 — full star: 3px arms, diagonal glints, halo
    fade(ctx, 1, () => {
      const ox = 0;
      glow(ctx, ox + 3, oy + 3, 3, C1);
      px(ctx, ox, oy, [
        [3, 0, C2], [3, 1, C1], [3, 2, C0],           // up arm
        [3, 6, C2], [3, 5, C1], [3, 4, C0],           // down arm
        [0, 3, C2], [1, 3, C1], [2, 3, C0],           // left arm
        [6, 3, C2], [5, 3, C1], [4, 3, C0],           // right arm
        [2, 2, C1], [4, 2, C1], [2, 4, C1], [4, 4, C1], // diagonal glints
        [3, 3, W],                                     // hot core
      ]);
    });
    // f1 — arms shrink to 2px, diagonals gone dim
    fade(ctx, 0.9, () => {
      const ox = FW;
      glow(ctx, ox + 3, oy + 3, 2, C1);
      px(ctx, ox, oy, [
        [3, 1, C1], [3, 2, C0],
        [3, 5, C1], [3, 4, C0],
        [1, 3, C1], [2, 3, C0],
        [5, 3, C1], [4, 3, C0],
        [2, 2, C2], [4, 4, C2],
        [3, 3, W],
      ]);
    });
    // f2 — tiny plus
    fade(ctx, 0.7, () => {
      const ox = FW * 2;
      px(ctx, ox, oy, [
        [3, 2, C1], [3, 4, C1], [2, 3, C1], [4, 3, C1],
        [3, 3, C0],
      ]);
    });
    // f3 — dying ember pixel + drifting specks
    fade(ctx, 0.45, () => {
      const ox = FW * 3;
      px(ctx, ox, oy, [
        [3, 3, C1],
        [1, 2, C3], [5, 5, C3],
      ]);
    });
  }

  // ---------------------------------------------------------------- dust (row 1)
  // soft grey-violet puff — billows outward, breaks apart, dissolves
  {
    const oy = FH;
    // f0 — tight round puff, lit from upper-left
    fade(ctx, 0.85, () => {
      const ox = 0;
      px(ctx, ox, oy, [
        [3, 2, G0], [4, 2, G1],
        [2, 3, G0], [3, 3, G1], [4, 3, G1], [5, 3, G2],
        [2, 4, G1], [3, 4, G1], [4, 4, G2], [5, 4, G2],
        [3, 5, G2], [4, 5, G3],
      ]);
    });
    // f1 — expands, interior thins
    fade(ctx, 0.65, () => {
      const ox = FW;
      px(ctx, ox, oy, [
        [3, 1, G0], [4, 1, G1],
        [2, 2, G0], [5, 2, G1],
        [1, 3, G1], [3, 3, G1], [6, 3, G2],
        [1, 4, G1], [4, 4, G2], [6, 4, G2],
        [2, 5, G2], [5, 5, G2],
        [3, 6, G3], [4, 6, G3],
      ]);
    });
    // f2 — breaks into drifting clumps
    fade(ctx, 0.45, () => {
      const ox = FW * 2;
      px(ctx, ox, oy, [
        [2, 1, G1], [3, 1, G1],
        [5, 2, G1], [6, 2, G2],
        [0, 4, G2], [1, 4, G2],
        [4, 5, G2], [6, 5, G3],
        [2, 6, G3],
      ]);
    });
    // f3 — last faint motes
    fade(ctx, 0.25, () => {
      const ox = FW * 3;
      px(ctx, ox, oy, [
        [1, 1, G1], [6, 2, G2], [0, 5, G2], [4, 6, G3], [7, 5, G3],
      ]);
    });
  }

  // ---------------------------------------------------------------- orb (row 2)
  // violet glow orb — soft pulse down to nothing
  {
    const oy = FH * 2;
    // f0 — full orb, hot white glint upper-left, halo
    fade(ctx, 1, () => {
      const ox = 0;
      glow(ctx, ox + 3, oy + 3, 3, V1);
      px(ctx, ox, oy, [
        [3, 1, V1], [4, 1, V1],
        [2, 2, V1], [3, 2, V0], [4, 2, V0], [5, 2, V1],
        [2, 3, V0], [3, 3, V0], [4, 3, V1], [5, 3, V2],
        [2, 4, V1], [3, 4, V1], [4, 4, V2], [5, 4, V2],
        [3, 5, V2], [4, 5, V2],
        [3, 2, W],                                    // hot glint (upper-left light)
      ]);
    });
    // f1 — slightly dimmer, glint cooling
    fade(ctx, 0.85, () => {
      const ox = FW;
      glow(ctx, ox + 3, oy + 3, 2, V1);
      px(ctx, ox, oy, [
        [3, 1, V2], [4, 1, V2],
        [2, 2, V1], [3, 2, V0], [4, 2, V1], [5, 2, V2],
        [2, 3, V1], [3, 3, V0], [4, 3, V1], [5, 3, V2],
        [2, 4, V2], [3, 4, V1], [4, 4, V2], [5, 4, V3],
        [3, 5, V2], [4, 5, V3],
      ]);
    });
    // f2 — contracts to 3x3
    fade(ctx, 0.65, () => {
      const ox = FW * 2;
      glow(ctx, ox + 3, oy + 3, 2, V2);
      px(ctx, ox, oy, [
        [3, 2, V1], [4, 2, V2],
        [2, 3, V1], [3, 3, V0], [4, 3, V2],
        [3, 4, V2], [4, 4, V3],
      ]);
    });
    // f3 — 2x2 ember
    fade(ctx, 0.45, () => {
      const ox = FW * 3;
      px(ctx, ox, oy, [
        [3, 3, V1], [4, 3, V2],
        [3, 4, V2], [4, 4, V3],
      ]);
    });
    // f4 — final spark of light
    fade(ctx, 0.25, () => {
      const ox = FW * 4;
      glow(ctx, ox + 3, oy + 3, 1, V2);
      px(ctx, ox, oy, [[3, 3, V2], [4, 4, V3]]);
    });
  }

  // ---------------------------------------------------------------- boom (row 3)
  // magenta-amber burst — hot flash, expanding ring, breaking apart
  {
    const oy = FH * 3;
    // f0 — hot compact flash
    fade(ctx, 1, () => {
      const ox = 0;
      glow(ctx, ox + 3, oy + 3, 3, A1);
      px(ctx, ox, oy, [
        [3, 2, A0], [4, 2, A0],
        [2, 3, A0], [3, 3, W], [4, 3, W], [5, 3, A0],
        [2, 4, A0], [3, 4, W], [4, 4, A0], [5, 4, A0],
        [3, 5, A0], [4, 5, A0],
        [2, 2, M0], [5, 2, M0], [2, 5, M0], [5, 5, M0], // magenta corners
      ]);
    });
    // f1 — burst opens: amber ring, magenta rim, diagonal sparks
    fade(ctx, 1, () => {
      const ox = FW;
      glow(ctx, ox + 3, oy + 3, 3, M1);
      px(ctx, ox, oy, [
        [3, 1, A0], [4, 1, A0],
        [2, 2, A0], [5, 2, A0],
        [1, 3, A0], [6, 3, A0],
        [1, 4, A1], [6, 4, A1],
        [2, 5, A1], [5, 5, A1],
        [3, 6, A1], [4, 6, A1],
        [3, 3, W],                                    // lingering core flash
        [1, 1, M0], [6, 1, M0], [1, 6, M1], [6, 6, M1], // diagonal sparks
      ]);
    });
    // f2 — hollow ring at full radius, amber at cardinals
    fade(ctx, 0.8, () => {
      const ox = FW * 2;
      px(ctx, ox, oy, [
        [3, 0, A1], [4, 0, M1],
        [1, 1, M0], [6, 1, M1],
        [0, 3, A1], [7, 3, M1],
        [0, 4, M1], [7, 4, M2],
        [1, 6, M1], [6, 6, M2],
        [3, 7, M2], [4, 7, A1],
        [3, 3, PAL.ember1],                           // dying ember in the middle
      ]);
    });
    // f3 — ring breaks into dashes
    fade(ctx, 0.55, () => {
      const ox = FW * 3;
      px(ctx, ox, oy, [
        [3, 0, M2], [6, 1, M2],
        [0, 2, M2], [7, 4, M2],
        [1, 6, M2], [5, 7, M2],
        [4, 3, PAL.ember2],
      ]);
    });
    // f4 — last scattered cinders
    fade(ctx, 0.3, () => {
      const ox = FW * 4;
      px(ctx, ox, oy, [
        [1, 0, M3], [7, 2, M3], [0, 5, M3], [6, 7, M3], [4, 4, PAL.ember2],
      ]);
    });
  }

  // ---------------------------------------------------------------- shard_glint (row 4)
  // cyan diamond twinkle — flash peaks on f1, then fades away
  {
    const oy = FH * 4;
    // f0 — faceted diamond appears
    fade(ctx, 1, () => {
      const ox = 0;
      glow(ctx, ox + 3, oy + 3, 2, C1);
      px(ctx, ox, oy, [
        [3, 1, C0],
        [2, 2, C0], [3, 2, C0], [4, 2, C1],
        [1, 3, C1], [2, 3, C0], [3, 3, W], [4, 3, C1], [5, 3, C2],
        [2, 4, C1], [3, 4, C1], [4, 4, C2],
        [3, 5, C2],
      ]);
    });
    // f1 — peak twinkle: cross flash through the diamond
    fade(ctx, 1, () => {
      const ox = FW;
      glow(ctx, ox + 3, oy + 3, 3, C0);
      px(ctx, ox, oy, [
        [3, 0, W], [3, 1, C0],
        [2, 2, C0], [3, 2, C0], [4, 2, C0],
        [0, 3, W], [1, 3, C0], [2, 3, W], [3, 3, W], [4, 3, C0], [5, 3, C0], [6, 3, W],
        [2, 4, C0], [3, 4, C1], [4, 4, C1],
        [3, 5, C0], [3, 6, W],
        [1, 1, C1], [5, 5, C1],                        // diagonal sparkle hints
      ]);
    });
    // f2 — flash collapses back to a small dim diamond
    fade(ctx, 0.7, () => {
      const ox = FW * 2;
      px(ctx, ox, oy, [
        [3, 2, C1],
        [2, 3, C1], [3, 3, C0], [4, 3, C2],
        [3, 4, C2],
      ]);
    });
    // f3 — afterglow specks
    fade(ctx, 0.4, () => {
      const ox = FW * 3;
      px(ctx, ox, oy, [
        [3, 3, C2], [5, 1, C3], [1, 5, C3],
      ]);
    });
  }

  return {
    image: c,
    anims: {
      spark:       { frames: frameGrid(FW, FH, 4, 0), fps: 16, loop: false },
      dust:        { frames: frameGrid(FW, FH, 4, 1), fps: 10, loop: false },
      orb:         { frames: frameGrid(FW, FH, 5, 2), fps: 10, loop: false },
      boom:        { frames: frameGrid(FW, FH, 5, 3), fps: 14, loop: false },
      shard_glint: { frames: frameGrid(FW, FH, 4, 4), fps: 12, loop: false },
    },
    anchor: { x: FW / 2, y: FH / 2 },   // particles anchor at their center
  };
}
