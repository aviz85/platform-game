// Tile-based AABB physics. Entities have x,y = CENTER-BOTTOM (feet), w,h hitbox.
export const TILE = 16;
export const SOLID = new Set(['#', 'X', '|']);
export const ONEWAY = '=';
export const HAZARD = '^';

export function charAt(level, tx, ty) {
  if (tx < 0 || tx >= level.cols) return '#';       // walls at horizontal bounds
  if (ty < 0) return '.';                            // open sky
  if (ty >= level.rows) return '.';                  // open pit below (death)
  return level.map[ty][tx] || '.';
}
export function solidAt(level, px, py) {
  return SOLID.has(charAt(level, Math.floor(px / TILE), Math.floor(py / TILE)));
}
export function hazardAt(level, px, py) {
  return charAt(level, Math.floor(px / TILE), Math.floor(py / TILE)) === HAZARD;
}

// Sweep an entity by vx,vy*dt against tiles. Mutates e. Sets e.onGround, e.hitWall, e.hitCeil.
export function moveAndCollide(e, level, dt) {
  const hw = e.w / 2;
  e.hitWall = false; e.hitCeil = false;
  const wasOnGround = e.onGround;
  e.onGround = false;

  // --- horizontal ---
  let nx = e.x + e.vx * dt;
  if (e.vx !== 0) {
    const dir = Math.sign(e.vx);
    const edge = nx + dir * hw;
    const tx = Math.floor(edge / TILE);
    const top = Math.floor((e.y - e.h + 1) / TILE);
    const bot = Math.floor((e.y - 1) / TILE);
    let blocked = false;
    for (let ty = top; ty <= bot; ty++) {
      if (SOLID.has(charAt(level, tx, ty))) { blocked = true; break; }
    }
    if (blocked) {
      nx = dir > 0 ? tx * TILE - hw - 0.01 : (tx + 1) * TILE + hw + 0.01;
      e.vx = 0; e.hitWall = true;
    }
  }
  e.x = nx;

  // --- vertical ---
  let ny = e.y + e.vy * dt;
  if (e.vy > 0) { // falling
    const tyNew = Math.floor(ny / TILE);
    const tyOld = Math.floor((e.y - 0.01) / TILE);
    const l = Math.floor((e.x - hw + 1) / TILE);
    const r = Math.floor((e.x + hw - 1) / TILE);
    outer:
    for (let ty = Math.max(tyOld, 0); ty <= tyNew; ty++) {
      for (let tx = l; tx <= r; tx++) {
        const c = charAt(level, tx, ty);
        const isOneway = c === ONEWAY && !e.dropThrough && (e.y - 0.5) <= ty * TILE;
        if (SOLID.has(c) || isOneway) {
          ny = ty * TILE - 0.01;
          e.vy = 0; e.onGround = true;
          break outer;
        }
      }
    }
  } else if (e.vy < 0) { // rising
    const head = ny - e.h;
    const ty = Math.floor(head / TILE);
    const l = Math.floor((e.x - hw + 1) / TILE);
    const r = Math.floor((e.x + hw - 1) / TILE);
    for (let tx = l; tx <= r; tx++) {
      if (SOLID.has(charAt(level, tx, ty))) {
        ny = (ty + 1) * TILE + e.h + 0.01;
        e.vy = 0; e.hitCeil = true;
        break;
      }
    }
  }
  e.y = ny;
  if (!e.onGround && wasOnGround && e.vy >= 0) e.coyoteFrom = true;
}

export function aabbOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  // x,y = center-bottom
  return Math.abs(ax - bx) < (aw + bw) / 2 && ay > by - bh && by > ay - ah;
}
