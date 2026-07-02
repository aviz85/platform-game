// Pixel-art drawing helpers for content modules. Works in browser AND in the node validator.
import { PAL } from './palette.js';

export function makeCanvas(w, h) {
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }
  return new OffscreenCanvas(w, h); // validator stubs this in node
}

// deterministic rng — art must be identical every build
export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export const P = (ctx, x, y, c) => { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, 1, 1); };
export const R = (ctx, x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, w, h); };

export function line(ctx, x0, y0, x1, y1, c) {
  x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0;
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    P(ctx, x0, y0, c);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

export function circleFill(ctx, cx, cy, r, c) {
  for (let y = -r; y <= r; y++) {
    const w = Math.floor(Math.sqrt(r * r - y * y));
    R(ctx, cx - w, cy + y, w * 2 + 1, 1, c);
  }
}

export function ellipseFill(ctx, cx, cy, rx, ry, c) {
  for (let y = -ry; y <= ry; y++) {
    const w = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
    R(ctx, cx - w, cy + y, w * 2 + 1, 1, c);
  }
}

// checker dithering inside a rect between two colors
export function dither(ctx, x, y, w, h, c1, c2) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    P(ctx, x + i, y + j, ((i + j) & 1) ? c1 : c2);
  }
}

// 1px outline around all opaque pixels of a canvas region (call AFTER drawing a sprite frame)
export function outline(ctx, x, y, w, h, color = PAL.outline) {
  const img = ctx.getImageData(x, y, w, h);
  const d = img.data;
  const solid = (i, j) => i >= 0 && j >= 0 && i < w && j < h && d[(j * w + i) * 4 + 3] > 10;
  const marks = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    if (!solid(i, j) && (solid(i + 1, j) || solid(i - 1, j) || solid(i, j + 1) || solid(i, j - 1))) {
      marks.push([i, j]);
    }
  }
  for (const [i, j] of marks) P(ctx, x + i, y + j, color);
}

// soft additive glow halo around a point (for emissive crystals/eyes/engines)
export function glow(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.globalAlpha = 0.28;
  circleFill(ctx, cx | 0, cy | 0, r, color);
  ctx.globalAlpha = 0.5;
  circleFill(ctx, cx | 0, cy | 0, Math.max(1, (r / 2) | 0), color);
  ctx.restore();
}

// hex color shade: amt -1..1 (negative darker)
export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const t = amt < 0 ? 0 : 255, a = Math.abs(amt);
  r = Math.round(r + (t - r) * a);
  g = Math.round(g + (t - g) * a);
  b = Math.round(b + (t - b) * a);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// evenly slice a strip of frames: frameGrid(fw, fh, count) -> frames array for anims
export function frameGrid(fw, fh, count, row = 0) {
  const out = [];
  for (let i = 0; i < count; i++) out.push({ x: i * fw, y: row * fh, w: fw, h: fh });
  return out;
}
