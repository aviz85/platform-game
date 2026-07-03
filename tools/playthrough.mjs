#!/usr/bin/env node
// Automated playthrough: a greedy platformer bot drives the REAL engine through
// every level spawn->exit (and kills the boss in L6), proving the game is beatable.
// Not a crash test (integration.mjs does that) — this is a winnability proof.
import { pathToFileURL } from 'url';
import { resolve } from 'path';

// ---- headless canvas/DOM/timing stubs ----
function stubCtx(c) {
  return new Proxy({ canvas: c }, {
    get(t, p) {
      if (p in t) return t[p];
      if (p === 'getImageData') return (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(0, (w|0)*(h|0)*4)) });
      if (p === 'putImageData') return () => {};
      if (p === 'createLinearGradient' || p === 'createRadialGradient') return () => ({ addColorStop() {} });
      if (p === 'createPattern') return () => ({});
      if (p === 'measureText') return () => ({ width: 0 });
      return () => {};
    },
    set(t, p, v) { t[p] = v; return true; },
  });
}
class Cv { constructor(w=1,h=1){this.width=w;this.height=h;} getContext(){return stubCtx(this);} }
globalThis.OffscreenCanvas = Cv;
globalThis.document = { createElement: () => new Cv() };
globalThis.window = { innerWidth: 1280, innerHeight: 720, addEventListener(){} };
globalThis.performance = globalThis.performance || { now: () => 0 };
globalThis.requestAnimationFrame = () => 0;

const ROOT = resolve(process.argv[2] || '.');
const imp = (p) => import(pathToFileURL(resolve(ROOT, p)).href);
const { loadContent } = await imp('src/content/registry.js');
const { World } = await imp('src/game/world.js');
const { Camera } = await imp('src/engine/camera.js');
const { Particles } = await imp('src/engine/particles.js');
const { TILE, solidAt, charAt, hazardAt } = await imp('src/engine/physics.js');

const audio = { sfxMap:{}, musicMap:{}, playSfx(){}, playMusic(){}, stopMusic(){}, unlock(){}, toggleMute(){} };
const content = loadContent();
audio.sfxMap = content.SFX; audio.musicMap = content.MUSIC;
const W = 480, H = 270, DT = 1/60;

// Bot input object mimicking engine Input
class Bot {
  constructor(){ this.d = {}; this.prev = {}; }
  frame(next){ this.prev = this.d; this.d = next; }
  isDown(a){ return !!this.d[a]; }
  justPressed(a){ return !!this.d[a] && !this.prev[a]; }
}

// ground check helpers (in px)
const groundBelow = (lv, px, py, maxTiles=3) => {
  for (let d=1; d<=maxTiles; d++){ const c = charAt(lv, Math.floor(px/TILE), Math.floor(py/TILE)+d); if (c==='#'||c==='X'||c==='|'||c==='=') return d; }
  return 0;
};

function decide(world, goalX, goalY, mem) {
  const p = world.player, lv = world.level;
  const dir = Math.sign(goalX - p.x) || 1;
  const inp = {};
  if (dir > 0) inp.right = true; else inp.left = true;

  const foot = p.y - 2;
  const aheadX = p.x + dir * (p.w/2 + 6);
  const farX = p.x + dir * (p.w/2 + 20);
  const wallAhead = solidAt(lv, p.x + dir*(p.w/2+3), p.y - 6) || solidAt(lv, p.x + dir*(p.w/2+3), p.y - 12);
  const gapAhead = p.onGround && groundBelow(lv, aheadX, p.y, 2) === 0;
  const wideGap = p.onGround && groundBelow(lv, farX, p.y, 2) === 0 && groundBelow(lv, p.x + dir*(p.w/2+40), p.y, 2) === 0;
  const hazardAhead = hazardAt(lv, aheadX, p.y - 2) || hazardAt(lv, aheadX, p.y + 8) || hazardAt(lv, farX, p.y + 8);
  const goalAbove = (goalY - p.y) < -12 && Math.abs(goalX - p.x) < 96;
  const stuckTimer = mem.stuck || 0;

  // start a jump (hold for height) when grounded and need to clear something
  if (p.onGround && (wallAhead || gapAhead || hazardAhead || goalAbove || stuckTimer > 20)) {
    mem.jumpHold = (wideGap || goalAbove || hazardAhead) ? 15 : 10;
    mem.dashArmed = wideGap || (hazardAhead && groundBelow(lv, farX, p.y, 3) === 0);
  }
  if (mem.jumpHold > 0) { inp.jump = true; mem.jumpHold--; }

  // air-dash to extend a long jump across a wide gap
  if (!p.onGround && mem.dashArmed && p.vy > -30 && (mem.dashCd|0) <= 0) {
    inp.dash = true; mem.dashArmed = false; mem.dashCd = 40;
  }
  if (mem.dashCd > 0) mem.dashCd--;

  // attack if an enemy is close ahead
  const en = world.entities.find(e => !e.dead && Math.abs(e.x - p.x) < 26 && Math.abs(e.y - p.y) < 22 && Math.sign(e.x - p.x) === dir);
  if (en) inp.attack = true;

  return inp;
}

function runLevel(idx, def) {
  const cam = new Camera(W, H);
  const parts = new Particles(content.ART.fx_particles);
  const world = new World(def, content, audio, cam, parts, W, H);
  world.player.shards = 0;
  const bot = new Bot();
  const goalX = world.exit.x, goalY = world.exit.y;
  const isBoss = idx === 5;

  let best = -Infinity, bestFrame = 0, deaths = 0;
  const mem = { stuck: 0, lastX: world.player.x, jumpHold: 0, dashCd: 0 };
  const MAXF = 60 * 120; // 120s budget
  let bossStartHp = 0;

  for (let f = 0; f < MAXF; f++) {
    const p = world.player;
    // stuck detection
    if (Math.abs(p.x - mem.lastX) < 0.6) mem.stuck++; else mem.stuck = 0;
    mem.lastX = p.x;

    let goal = { x: goalX, y: goalY };
    if (isBoss) {
      const boss = world.entities.find(e => e.behavior.isBoss && !e.dead);
      if (boss) { if (!bossStartHp) bossStartHp = boss.maxHp; goal = { x: boss.x, y: boss.y }; }
    }
    bot.frame(decide(world, goal.x, goal.y, mem));
    world.update(DT, bot);

    const prog = p.x;
    if (prog > best) { best = prog; bestFrame = f; }

    if (isBoss) {
      if (world.events.includes('bossDead')) return { win: true, frames: f, deaths, note: `boss defeated (${(f/60).toFixed(1)}s, ${deaths} deaths)` };
    } else if (world.completed) {
      return { win: true, frames: f, deaths, note: `reached portal (${(f/60).toFixed(1)}s, ${deaths} deaths)` };
    }

    if (p.dead && p.deathT > 0.1) {
      deaths++;
      if (deaths > 15) break;
      // respawn: reset player at spawn, keep going
      p.hp = p.maxHp; p.dead = false; p.deathT = 0; p.inv = 1.2;
      p.x = world.spawn.x; p.y = world.spawn.y; p.vx = 0; p.vy = 0;
      mem.stuck = 0; mem.lastX = p.x;
      cam.snap(p.x, p.y, world.pixelW, world.pixelH);
    }
    // hopeless-stuck guard: no forward progress for 12s
    if (f - bestFrame > 60 * 12) break;
  }
  const pct = isBoss
    ? (bossStartHp ? `boss hp ${(world.entities.find(e=>e.behavior.isBoss)?.hp ?? '?')}/${bossStartHp}` : 'no boss?')
    : `${((best / (world.pixelW)) * 100).toFixed(0)}% across (stuck ~col ${Math.floor(best/TILE)}, exit col ${Math.floor(goalX/TILE)})`;
  return { win: false, frames: MAXF, deaths, note: `STUCK — ${pct}` };
}

let allWin = true;
console.log('AETHERFALL automated playthrough (greedy bot on real engine)\n');
for (let i = 0; i < content.LEVELS.length; i++) {
  const def = content.LEVELS[i];
  const r = runLevel(i, def);
  allWin = allWin && r.win;
  console.log(`  L${i+1} ${(def.name||'').padEnd(18)} ${r.win ? 'WIN ✓' : 'FAIL ✗'}  ${r.note}`);
}
console.log('\n' + (allWin ? 'PLAYTHROUGH PASS — all 6 levels beatable + boss defeated by the bot'
                            : 'PLAYTHROUGH INCOMPLETE — see STUCK notes above (bot may be too dumb, or a real blocker)'));
process.exit(allWin ? 0 : 1);
