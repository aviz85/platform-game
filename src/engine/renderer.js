// Renders parallax backgrounds and the tile layer.
import { TILE, SOLID, charAt } from './physics.js';

// bg layer result: { canvas, factor:0..1.6, y? (px from level bottom, default 0),
//                    tileX:true, front?:bool, autoScroll?:pxPerSec, alpha? }
export function drawBgLayer(ctx, layer, cam, levelH, time, W, H) {
  if (!layer || !layer.canvas) return;
  const img = layer.canvas;
  const f = layer.factor ?? 0.3;
  const scroll = (layer.autoScroll || 0) * time;
  let ox = -((cam.ox * f + scroll) % img.width);
  if (ox > 0) ox -= img.width;
  // vertical: anchor layer bottom to level bottom, with slight parallax
  const yBase = (levelH - img.height - (layer.y || 0));
  let oy = Math.round(yBase - cam.oy * (layer.factorY ?? f));
  // keep sky layers pinned to viewport top if they're screen-sized
  if (img.height >= H && f <= 0.15) oy = Math.min(oy, 0);
  ctx.globalAlpha = layer.alpha ?? 1;
  if (layer.tileX === false) {
    ctx.drawImage(img, Math.round(-cam.ox * f), oy);
  } else {
    for (let x = ox; x < W; x += img.width) {
      ctx.drawImage(img, Math.round(x), oy);
    }
  }
  ctx.globalAlpha = 1;
}

function pickVariant(entry, tx, ty) {
  if (Array.isArray(entry)) return entry[(tx * 7 + ty * 13) % entry.length];
  return entry;
}

// Fallback colors when a tileset is missing a char
const FALLBACK = { '#': '#3a3352', 'X': '#4c4668', '|': '#3a3352', '=': '#6a5f8a', '^': '#e5484d' };

export function drawTiles(ctx, level, tileset, cam, W, H) {
  const ts = tileset && tileset.tileSize ? tileset.tileSize : TILE;
  const x0 = Math.floor(cam.ox / TILE), x1 = Math.ceil((cam.ox + W) / TILE);
  const y0 = Math.floor(cam.oy / TILE), y1 = Math.ceil((cam.oy + H) / TILE);
  for (let ty = Math.max(0, y0); ty <= Math.min(level.rows - 1, y1); ty++) {
    for (let tx = Math.max(0, x0); tx <= Math.min(level.cols - 1, x1); tx++) {
      const c = level.map[ty][tx];
      if (!c || c === '.') continue;
      const px = tx * TILE - cam.ox, py = ty * TILE - cam.oy;
      let entry = tileset && tileset.tiles && tileset.tiles[c];
      // grass/edge variant: use '#top' when solid tile has open air above
      if (c === '#' && tileset && tileset.tiles && tileset.tiles['#top']) {
        const above = charAt(level, tx, ty - 1);
        if (!SOLID.has(above) && above !== '=') entry = tileset.tiles['#top'];
      }
      if (entry) {
        const v = pickVariant(entry, tx, ty);
        ctx.drawImage(tileset.image, v.x, v.y, ts, ts, Math.round(px), Math.round(py), ts, ts);
      } else if (FALLBACK[c]) {
        ctx.fillStyle = FALLBACK[c];
        if (c === '=') ctx.fillRect(Math.round(px), Math.round(py), TILE, 5);
        else if (c === '^') {
          ctx.beginPath();
          ctx.moveTo(px, py + TILE); ctx.lineTo(px + TILE / 2, py + 4); ctx.lineTo(px + TILE, py + TILE);
          ctx.fill();
        } else ctx.fillRect(Math.round(px), Math.round(py), TILE, TILE);
      }
      // decor chars with no tileset entry render nothing — intended
    }
  }
}
