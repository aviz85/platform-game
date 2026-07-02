#!/usr/bin/env node
// Contract validator for AETHERFALL content modules.
// Usage: node tools/validate.mjs <file>            (kind inferred from path/name)
//        node tools/validate.mjs all               (validate every manifest file that exists)
// Exit 0 = pass, 1 = fail. Prints PASS/FAIL + reasons.
import { pathToFileURL } from 'url';
import { resolve, basename } from 'path';
import { existsSync } from 'fs';

// ---------- canvas stubs ----------
let OPS = 0;
function makeStubCtx(canvas) {
  const state = {};
  return new Proxy({}, {
    get(_, prop) {
      if (prop === 'canvas') return canvas;
      if (prop in state) return state[prop];
      if (prop === 'getImageData') {
        return (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(0, w * h * 4)), width: w, height: h });
      }
      if (prop === 'putImageData') return () => { OPS += 50; };
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient') {
        return () => ({ addColorStop() {} });
      }
      if (prop === 'createPattern') return () => ({});
      if (prop === 'measureText') return () => ({ width: 0 });
      return (...args) => { OPS++; };
    },
    set(_, prop, v) { state[prop] = v; return true; },
  });
}
class StubOffscreenCanvas {
  constructor(w, h) { this.width = w; this.height = h; }
  getContext() { return makeStubCtx(this); }
}
globalThis.OffscreenCanvas = StubOffscreenCanvas;

// ---------- manifest ----------
const A = 'src/content/art/', AU = 'src/content/audio/', L = 'src/content/levels/', B = 'src/content/behaviors/';
export const MANIFEST = {
  [A + 'hero.js']: { kind: 'sprite', anims: ['idle', 'run', 'jump', 'fall', 'attack', 'hurt', 'dash'], minOps: 400 },
  [A + 'enemy_drone.js']: { kind: 'sprite', anims: ['move'], minAnims: 2, minOps: 250 },
  [A + 'enemy_crawler.js']: { kind: 'sprite', anims: ['move'], minAnims: 2, minOps: 250 },
  [A + 'enemy_floater.js']: { kind: 'sprite', anims: ['move'], minAnims: 2, minOps: 250 },
  [A + 'enemy_sentinel.js']: { kind: 'sprite', anims: ['move'], minAnims: 2, minOps: 250 },
  [A + 'enemy_slime.js']: { kind: 'sprite', anims: ['move'], minAnims: 2, minOps: 250 },
  [A + 'enemy_wraith.js']: { kind: 'sprite', anims: ['move'], minAnims: 2, minOps: 250 },
  [A + 'boss_colossus.js']: { kind: 'sprite', anims: ['move', 'attack'], minOps: 600 },
  [A + 'tiles_forest.js']: { kind: 'tileset', minOps: 300 },
  [A + 'tiles_ruins.js']: { kind: 'tileset', minOps: 300 },
  [A + 'tiles_depths.js']: { kind: 'tileset', minOps: 300 },
  [A + 'props_forest.js']: { kind: 'props', minStamps: 3, minOps: 150 },
  [A + 'props_ruins.js']: { kind: 'props', minStamps: 3, minOps: 150 },
  [A + 'props_depths.js']: { kind: 'props', minStamps: 3, minOps: 150 },
  [A + 'bg_forest_far.js']: { kind: 'bg', factorMax: 0.25 },
  [A + 'bg_forest_mid.js']: { kind: 'bg', factorMin: 0.25, factorMax: 0.6 },
  [A + 'bg_forest_near.js']: { kind: 'bg', factorMin: 0.55, factorMax: 0.98 },
  [A + 'bg_forest_fg.js']: { kind: 'bg', front: true, factorMin: 1.02, factorMax: 1.7 },
  [A + 'bg_ruins_far.js']: { kind: 'bg', factorMax: 0.25 },
  [A + 'bg_ruins_mid.js']: { kind: 'bg', factorMin: 0.25, factorMax: 0.6 },
  [A + 'bg_ruins_near.js']: { kind: 'bg', factorMin: 0.55, factorMax: 0.98 },
  [A + 'bg_ruins_fg.js']: { kind: 'bg', front: true, factorMin: 1.02, factorMax: 1.7 },
  [A + 'bg_depths_far.js']: { kind: 'bg', factorMax: 0.25 },
  [A + 'bg_depths_mid.js']: { kind: 'bg', factorMin: 0.25, factorMax: 0.6 },
  [A + 'bg_depths_near.js']: { kind: 'bg', factorMin: 0.55, factorMax: 0.98 },
  [A + 'bg_depths_fg.js']: { kind: 'bg', front: true, factorMin: 1.02, factorMax: 1.7 },
  [A + 'fx_particles.js']: { kind: 'sprite', anims: ['spark', 'dust', 'orb'], minOps: 100 },
  [A + 'ui_kit.js']: { kind: 'ui' },
  [A + 'collectibles.js']: { kind: 'sprite', anims: ['shard', 'heart'], minOps: 100 },
  [A + 'portal.js']: { kind: 'sprite', anims: ['idle', 'open'], minOps: 150 },
  [A + 'title_art.js']: { kind: 'titleart' },
  [AU + 'sfx.js']: { kind: 'sfx' },
  [AU + 'music_title.js']: { kind: 'music' },
  [AU + 'music_forest.js']: { kind: 'music' },
  [AU + 'music_ruins.js']: { kind: 'music' },
  [AU + 'music_depths.js']: { kind: 'music' },
  [AU + 'music_boss.js']: { kind: 'music' },
  [L + 'level1.js']: { kind: 'level' },
  [L + 'level2.js']: { kind: 'level' },
  [L + 'level3.js']: { kind: 'level' },
  [L + 'level4.js']: { kind: 'level' },
  [L + 'level5.js']: { kind: 'level' },
  [L + 'level6.js']: { kind: 'level' },
  [B + 'drone.js']: { kind: 'behavior', sprite: 'enemy_drone' },
  [B + 'crawler.js']: { kind: 'behavior', sprite: 'enemy_crawler' },
  [B + 'floater.js']: { kind: 'behavior', sprite: 'enemy_floater' },
  [B + 'sentinel.js']: { kind: 'behavior', sprite: 'enemy_sentinel' },
  [B + 'slime.js']: { kind: 'behavior', sprite: 'enemy_slime' },
  [B + 'wraith.js']: { kind: 'behavior', sprite: 'enemy_wraith' },
  [B + 'boss_colossus.js']: { kind: 'behavior', sprite: 'boss_colossus', isBoss: true },
};

const WAVES = ['square', 'sine', 'triangle', 'sawtooth', 'noise'];
const BIOMES = ['forest', 'ruins', 'depths'];
const MUSICS = ['title', 'forest', 'ruins', 'depths', 'boss'];
const ENTITY_TYPES = ['drone', 'crawler', 'floater', 'sentinel', 'slime', 'wraith', 'boss_colossus'];
const SOLID = new Set(['#', 'X', '|']);
const STRUCTURAL = new Set(['.', '#', 'X', '|', '=', '^', '*', 'H']);
const SFX_REQUIRED = ['jump', 'land', 'attack', 'hit', 'hurt', 'death', 'dash', 'pickup', 'heart', 'portal', 'menu', 'enemyDeath'];

const errs = [];
const err = (m) => errs.push(m);

function isCanvasLike(c) {
  return c && typeof c === 'object' && Number.isFinite(c.width) && Number.isFinite(c.height) && c.width > 0 && c.height > 0;
}
function checkAnims(r, spec, name) {
  if (!isCanvasLike(r.image)) return err(`${name}: build().image is not a canvas with positive size`);
  if (!r.anims || typeof r.anims !== 'object') return err(`${name}: missing anims`);
  const names = Object.keys(r.anims);
  for (const need of spec.anims || []) {
    if (!names.includes(need)) err(`${name}: missing required anim '${need}'`);
  }
  if (spec.minAnims && names.length < spec.minAnims) err(`${name}: needs >=${spec.minAnims} anims, has ${names.length}`);
  for (const [an, a] of Object.entries(r.anims)) {
    if (!Array.isArray(a.frames) || a.frames.length === 0) { err(`${name}: anim '${an}' has no frames`); continue; }
    if ((spec.anims || []).includes(an) && a.frames.length < 2 && an !== 'idle') {
      // allow 1-frame only for non-core anims
    }
    for (const f of a.frames) {
      if (![f.x, f.y, f.w, f.h].every(Number.isFinite)) { err(`${name}: anim '${an}' has bad frame rect`); break; }
      if (f.x < 0 || f.y < 0 || f.x + f.w > r.image.width + 0.01 || f.y + f.h > r.image.height + 0.01) {
        err(`${name}: anim '${an}' frame outside image bounds (${f.x},${f.y},${f.w},${f.h} vs ${r.image.width}x${r.image.height})`);
        break;
      }
    }
    if (a.fps !== undefined && !(a.fps > 0 && a.fps <= 30)) err(`${name}: anim '${an}' fps out of range`);
  }
  if (r.anchor && !(Number.isFinite(r.anchor.x) && Number.isFinite(r.anchor.y))) err(`${name}: bad anchor`);
}

async function validateFile(rel) {
  const spec = MANIFEST[rel];
  if (!spec) { err(`${rel}: not in manifest`); return; }
  const abs = resolve(rel);
  if (!existsSync(abs)) { err(`${rel}: file does not exist`); return; }
  OPS = 0;
  let mod;
  try { mod = await import(pathToFileURL(abs).href + '?t=' + Date.now()); }
  catch (e) { err(`${rel}: import failed — ${e.message}`); return; }
  const name = basename(rel);

  if (['sprite', 'tileset', 'props', 'bg', 'ui', 'titleart'].includes(spec.kind)) {
    if (typeof mod.build !== 'function') return err(`${name}: must export function build()`);
    let r;
    try { r = mod.build(); } catch (e) { return err(`${name}: build() threw — ${e.message}\n${(e.stack || '').split('\n')[1] || ''}`); }
    if (!r || typeof r !== 'object') return err(`${name}: build() returned nothing`);
    // determinism: second call must not throw
    try { mod.build(); } catch (e) { return err(`${name}: build() not re-callable — ${e.message}`); }

    if (spec.kind === 'sprite') checkAnims(r, spec, name);
    if (spec.kind === 'tileset') {
      if (!isCanvasLike(r.image)) err(`${name}: tileset image missing`);
      if (r.tileSize !== 16) err(`${name}: tileSize must be 16`);
      if (!r.tiles || typeof r.tiles !== 'object') err(`${name}: missing tiles map`);
      else {
        for (const need of ['#', '=', '^', 'X']) if (!r.tiles[need]) err(`${name}: tiles map missing '${need}'`);
        if (!r.tiles['#top']) err(`${name}: tiles map missing '#top' (surface variant)`);
        for (const [c, entry] of Object.entries(r.tiles)) {
          const list = Array.isArray(entry) ? entry : [entry];
          for (const v of list) {
            if (!Number.isFinite(v.x) || !Number.isFinite(v.y)) { err(`${name}: tile '${c}' bad coords`); break; }
            if (v.x + 16 > r.image.width + 0.01 || v.y + 16 > r.image.height + 0.01) { err(`${name}: tile '${c}' outside image`); break; }
          }
        }
      }
    }
    if (spec.kind === 'props') {
      if (!r.stamps || typeof r.stamps !== 'object') err(`${name}: props must export build() -> {stamps:{...}}`);
      else {
        const ks = Object.keys(r.stamps);
        if (ks.length < (spec.minStamps || 3)) err(`${name}: needs >=${spec.minStamps} stamps, has ${ks.length}`);
        for (const [k, s] of Object.entries(r.stamps)) if (!isCanvasLike(s.canvas)) err(`${name}: stamp '${k}' missing canvas`);
      }
    }
    if (spec.kind === 'bg') {
      if (!isCanvasLike(r.canvas)) err(`${name}: bg must return {canvas}`);
      else {
        if (r.canvas.width < 128) err(`${name}: bg canvas too narrow (<128)`);
        if (r.canvas.height < 60) err(`${name}: bg canvas too short (<60)`);
      }
      if (!Number.isFinite(r.factor)) err(`${name}: missing numeric factor`);
      else {
        if (spec.factorMin && r.factor < spec.factorMin) err(`${name}: factor ${r.factor} below ${spec.factorMin}`);
        if (spec.factorMax && r.factor > spec.factorMax) err(`${name}: factor ${r.factor} above ${spec.factorMax}`);
      }
      if (spec.front && r.front !== true) err(`${name}: foreground layer must set front:true`);
      if (!spec.front && r.front) err(`${name}: only _fg layers may set front:true`);
    }
    if (spec.kind === 'ui') {
      if (!r.stamps) err(`${name}: ui_kit needs stamps`);
      else for (const need of ['heart_full', 'heart_empty', 'shard_icon']) {
        if (!r.stamps[need] || !isCanvasLike(r.stamps[need].canvas)) err(`${name}: missing stamp '${need}'`);
      }
      if (r.font) {
        const f = r.font;
        if (!isCanvasLike(f.canvas) || !Number.isFinite(f.cw) || !Number.isFinite(f.ch) || typeof f.chars !== 'string' || f.chars.length < 36) {
          err(`${name}: font must be {canvas, cw, ch, chars(>=36 glyphs)}`);
        } else if (f.chars.length * f.cw > f.canvas.width + 0.01) {
          err(`${name}: font canvas narrower than chars*cw`);
        }
      } else err(`${name}: ui_kit should include a bitmap font {canvas,cw,ch,chars}`);
    }
    if (spec.kind === 'titleart') {
      if (!r.stamps || !r.stamps.logo || !isCanvasLike(r.stamps.logo.canvas)) err(`${name}: title_art needs stamps.logo.canvas`);
      else if (r.stamps.logo.canvas.width < 120) err(`${name}: logo should be >=120px wide`);
    }
    if (spec.minOps && OPS < spec.minOps) err(`${name}: only ${OPS} draw ops — too simple, add real pixel detail (need >=${spec.minOps})`);
  }

  if (spec.kind === 'sfx') {
    const S = mod.SFX;
    if (!S || typeof S !== 'object') return err(`${name}: must export const SFX = {...}`);
    for (const need of SFX_REQUIRED) if (!S[need]) err(`${name}: missing sfx '${need}'`);
    for (const [k, p] of Object.entries(S)) {
      if (!WAVES.includes(p.wave)) err(`${name}: sfx '${k}' bad wave '${p.wave}'`);
      if (!(p.dur > 0 && p.dur <= 2)) err(`${name}: sfx '${k}' dur out of range`);
      if (!(p.vol > 0 && p.vol <= 1)) err(`${name}: sfx '${k}' vol out of range`);
      if (!(p.from > 10 && p.from < 12000)) err(`${name}: sfx '${k}' from out of range`);
    }
  }

  if (spec.kind === 'music') {
    const t = mod.track;
    if (!t) return err(`${name}: must export const track = {...}`);
    if (!(t.bpm >= 60 && t.bpm <= 200)) err(`${name}: bpm out of range`);
    if (!(t.bars >= 4 && t.bars <= 64)) err(`${name}: bars must be 4..64`);
    if (!Array.isArray(t.channels) || t.channels.length < 2 || t.channels.length > 8) err(`${name}: 2..8 channels required`);
    else {
      const spb = (t.beatsPerBar || 4) * (t.stepsPerBeat || 4);
      let total = 0;
      for (let i = 0; i < t.channels.length; i++) {
        const ch = t.channels[i];
        if (!WAVES.includes(ch.wave)) err(`${name}: channel ${i} bad wave`);
        if (!(ch.volume > 0 && ch.volume <= 0.5)) err(`${name}: channel ${i} volume must be 0..0.5`);
        if (!Array.isArray(ch.notes)) { err(`${name}: channel ${i} missing notes`); continue; }
        total += ch.notes.length;
        for (const n of ch.notes) {
          if (!Array.isArray(n) || n.length < 3) { err(`${name}: channel ${i} bad note ${JSON.stringify(n)}`); break; }
          const [bar, step, midi, len] = n;
          if (!(bar >= 0 && bar < t.bars)) { err(`${name}: channel ${i} note bar ${bar} out of range`); break; }
          if (!(step >= 0 && step < spb)) { err(`${name}: channel ${i} note step ${step} out of range`); break; }
          if (!(midi >= 20 && midi <= 105)) { err(`${name}: channel ${i} midi ${midi} out of range`); break; }
          if (len !== undefined && !(len >= 1 && len <= spb * 4)) { err(`${name}: channel ${i} len ${len} out of range`); break; }
        }
      }
      if (total < t.bars * 3) err(`${name}: only ${total} notes for ${t.bars} bars — too sparse, aim for a real composition`);
    }
  }

  if (spec.kind === 'level') {
    const lv = mod.level;
    if (!lv) return err(`${name}: must export const level = {...}`);
    if (!BIOMES.includes(lv.biome)) err(`${name}: biome must be one of ${BIOMES}`);
    if (!MUSICS.includes(lv.music)) err(`${name}: music must be one of ${MUSICS}`);
    if (typeof lv.name !== 'string' || !lv.name) err(`${name}: needs a name`);
    if (!Array.isArray(lv.map) || lv.map.length < 15) return err(`${name}: map must be >=15 rows of strings`);
    const rows = lv.map.length, cols = Math.max(...lv.map.map(r => r.length));
    if (cols < 60) err(`${name}: level too short (${cols} cols, need >=60)`);
    if (cols > 500) err(`${name}: level too long`);
    for (let y = 0; y < rows; y++) {
      for (const c of lv.map[y]) {
        if (!STRUCTURAL.has(c) && !/[a-z]/.test(c)) err(`${name}: illegal map char '${c}' row ${y}`);
      }
    }
    const at = (x, y) => (y >= 0 && y < rows && x >= 0 && x < (lv.map[y] || '').length) ? lv.map[y][x] : '.';
    const checkPoint = (pt, label) => {
      if (!pt || !Number.isFinite(pt.x) || !Number.isFinite(pt.y)) return err(`${name}: bad ${label}`);
      if (pt.x < 0 || pt.x >= cols || pt.y < 0 || pt.y >= rows) return err(`${name}: ${label} out of bounds`);
      if (SOLID.has(at(pt.x, pt.y))) err(`${name}: ${label} inside solid tile`);
      let ground = false;
      for (let dy = 1; dy <= 4; dy++) {
        const c = at(pt.x, pt.y + dy);
        if (SOLID.has(c) || c === '=') { ground = true; break; }
      }
      if (!ground) err(`${name}: ${label} has no ground within 4 tiles below`);
    };
    checkPoint(lv.spawn, 'spawn');
    checkPoint(lv.exit, 'exit');
    const shards = lv.map.join('').split('*').length - 1;
    if (shards < 8) err(`${name}: only ${shards} shards '*', need >=8`);
    for (const e of lv.entities || []) {
      if (!ENTITY_TYPES.includes(e.type)) err(`${name}: unknown entity type '${e.type}'`);
      if (!Number.isFinite(e.x) || !Number.isFinite(e.y) || e.x < 0 || e.x >= cols || e.y < 0 || e.y >= rows) err(`${name}: entity '${e.type}' out of bounds`);
    }
    if ((lv.entities || []).length < 3 && name !== 'level6.js') err(`${name}: needs >=3 enemies`);
    if (name === 'level6.js' && !(lv.entities || []).some(e => e.type === 'boss_colossus')) err(`${name}: level6 must contain boss_colossus`);
    if (lv.map.some(r => r.length !== lv.map[0].length)) { /* padding handled by engine */ }
    // spawn should be near left, exit near right (progression)
    if (lv.spawn && lv.exit && lv.exit.x <= lv.spawn.x) err(`${name}: exit must be to the right of spawn`);
  }

  if (spec.kind === 'behavior') {
    const b = mod.behavior;
    if (!b) return err(`${name}: must export const behavior = {...}`);
    if (b.sprite !== spec.sprite) err(`${name}: sprite must be '${spec.sprite}'`);
    if (typeof b.update !== 'function') return err(`${name}: behavior.update must be a function`);
    if (!(b.hp >= 1 && b.hp <= 200)) err(`${name}: hp out of range`);
    if (!(b.damage >= 1 && b.damage <= 3)) err(`${name}: damage must be 1..3`);
    if (!(b.w > 4 && b.w <= 64 && b.h > 4 && b.h <= 64)) err(`${name}: w/h out of range`);
    if (spec.isBoss && b.isBoss !== true) err(`${name}: must set isBoss:true`);
    // simulation smoke test
    const mkPlayer = () => ({ x: 200, y: 100, w: 10, h: 15, vx: 0, vy: 0, facing: 1, hp: 5, dead: false });
    let projCount = 0;
    const world = {
      time: 0, player: mkPlayer(),
      solidAt: (x, y) => y > 150,
      groundAhead: () => true,
      distToPlayer: (e) => Math.hypot(world.player.x - e.x, world.player.y - e.y),
      dirToPlayer: (e) => Math.sign(world.player.x - e.x) || 1,
      angleToPlayer: (e) => Math.atan2(world.player.y - e.y, world.player.x - e.x),
      spawnParticles: () => {}, spawnProjectile: () => { projCount++; },
      playSfx: () => {}, shake: () => {}, rng: () => 0.42, emit: () => {},
    };
    const e = {
      type: name.replace('.js', ''), behavior: b, x: 160, y: 150, w: b.w, h: b.h,
      vx: 0, vy: 0, hp: b.hp, maxHp: b.hp, facing: -1, anim: 'move', animT: 0,
      onGround: true, dead: false, hitT: 0, t: 0, spawnX: 160, spawnY: 150, timers: {}, mem: {}, props: {},
    };
    try {
      if (b.init) b.init(e, world);
      for (let i = 0; i < 900; i++) {
        world.time += 1 / 60; e.t += 1 / 60; e.animT += 1 / 60;
        world.player.x = 200 + Math.sin(i / 40) * 120;
        b.update(e, world, 1 / 60);
        e.x += e.vx / 60; e.y += e.vy / 60;
        if (!Number.isFinite(e.x) || !Number.isFinite(e.y) || !Number.isFinite(e.vx) || !Number.isFinite(e.vy)) {
          err(`${name}: NaN/Infinity after ${i} sim steps`); break;
        }
        if (Math.abs(e.vx) > 2000 || Math.abs(e.vy) > 2000) { err(`${name}: velocity exploded (${e.vx},${e.vy})`); break; }
      }
    } catch (ex) { err(`${name}: update() threw during simulation — ${ex.message}`); }
  }
}

// ---------- main ----------
const arg = process.argv[2];
if (!arg) { console.error('usage: node tools/validate.mjs <file|all>'); process.exit(2); }
const targets = arg === 'all'
  ? Object.keys(MANIFEST).filter(f => existsSync(resolve(f)))
  : [arg.replace(/^\.\//, '').replace(resolve('.') + '/', '')];
let anyMissing = false;
if (arg === 'all') {
  const missing = Object.keys(MANIFEST).filter(f => !existsSync(resolve(f)));
  if (missing.length) { console.log(`MISSING (${missing.length}):\n  ` + missing.join('\n  ')); anyMissing = true; }
}
for (const t of targets) await validateFile(t);
if (errs.length) {
  console.log('FAIL');
  for (const e of errs) console.log(' - ' + e);
  process.exit(1);
}
console.log(anyMissing ? 'PASS (existing files)' : 'PASS');
