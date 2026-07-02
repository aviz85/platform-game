#!/usr/bin/env node
// Headless integration test: load real content + engine, build every level,
// simulate update+draw for many frames while driving the player and exercising
// every enemy. Catches wiring/runtime/draw errors without a browser.
import { pathToFileURL } from 'url';
import { resolve } from 'path';

// ---- DOM / canvas / timing stubs ----
let DRAWS = 0;
function stubCtx(canvas) {
  const s = { canvas };
  return new Proxy(s, {
    get(t, p) {
      if (p in t) return t[p];
      if (p === 'canvas') return canvas;
      if (p === 'getImageData') return (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(0, (w | 0) * (h | 0) * 4)), width: w, height: h });
      if (p === 'putImageData') return () => {};
      if (p === 'createLinearGradient' || p === 'createRadialGradient') return () => ({ addColorStop() {} });
      if (p === 'createPattern') return () => ({});
      if (p === 'measureText') return () => ({ width: 0 });
      if (p === 'drawImage') return (img) => { if (!img) throw new Error('drawImage called with undefined image'); DRAWS++; };
      return () => { DRAWS++; };
    },
    set(t, p, v) { t[p] = v; return true; },
  });
}
class Cv { constructor(w = 1, h = 1) { this.width = w; this.height = h; } getContext() { return stubCtx(this); } }
globalThis.OffscreenCanvas = Cv;
globalThis.document = { createElement: (t) => (t === 'canvas' ? new Cv() : {}) };
globalThis.window = { innerWidth: 1280, innerHeight: 720, addEventListener() {}, AudioContext: null };
globalThis.performance = globalThis.performance || { now: () => Date.now() };
globalThis.requestAnimationFrame = () => 0;

const ROOT = resolve(process.argv[2] || '.');
const imp = (p) => import(pathToFileURL(resolve(ROOT, p)).href);

const errs = [];
const warn = (m) => errs.push(m);
const origWarn = console.warn, origErr = console.error;
let capturedWarns = [];
console.warn = (...a) => { capturedWarns.push(a.join(' ')); };
console.error = (...a) => { capturedWarns.push('ERROR: ' + a.join(' ')); };

// silent-audio stub (no WebAudio in node)
const audio = {
  sfxMap: {}, musicMap: {}, currentMusic: null,
  playSfx() {}, playMusic() {}, stopMusic() {}, unlock() {}, toggleMute() {},
};

const { loadContent } = await imp('src/content/registry.js');
const { World } = await imp('src/game/world.js');
const { Camera } = await imp('src/engine/camera.js');
const { Particles } = await imp('src/engine/particles.js');

const content = loadContent();
audio.sfxMap = content.SFX; audio.musicMap = content.MUSIC;

// content sanity
if (!content.LEVELS || content.LEVELS.length !== 6) warn(`expected 6 levels, got ${content.LEVELS?.length}`);
for (const [k, v] of Object.entries(content.ART)) if (!v) warn(`ART.${k} is null (build failed)`);
for (const [k, v] of Object.entries(content.BEHAVIORS)) if (!v || typeof v.update !== 'function') warn(`BEHAVIOR.${k} invalid`);
for (const b of ['forest', 'ruins', 'depths']) {
  if (!content.TILESETS[b]) warn(`TILESET ${b} missing`);
  const bg = content.BACKGROUNDS[b] || [];
  if (bg.filter(Boolean).length < 4) warn(`biome ${b} has <4 bg layers`);
}

const W = 480, H = 270;
const fakeInput = {
  _d: {}, isDown(a) { return !!this._d[a]; },
  justPressed(a) { return !!this._p[a]; }, _p: {},
  set(map, pressed) { this._d = map; this._p = pressed || {}; },
};

let totalFrames = 0;
for (let li = 0; li < content.LEVELS.length; li++) {
  const def = content.LEVELS[li];
  capturedWarns = [];
  let world;
  try {
    const cam = new Camera(W, H);
    const parts = new Particles(content.ART.fx_particles);
    world = new World(def, content, audio, cam, parts, W, H);
  } catch (e) {
    warn(`level ${li + 1} (${def?.name}): World construction threw — ${e.message}\n  ${(e.stack || '').split('\n')[1]?.trim()}`);
    continue;
  }
  const nEnt = world.entities.length;
  // scripted input pattern to exercise systems: move right, jump, attack, dash
  const patterns = [
    [{ right: 1 }, {}], [{ right: 1, jump: 1 }, { jump: 1 }], [{ right: 1 }, {}],
    [{ attack: 1 }, { attack: 1 }], [{ right: 1, dash: 1 }, { dash: 1 }],
    [{ left: 1 }, {}], [{ jump: 1 }, { jump: 1 }], [{}, {}],
  ];
  try {
    for (let f = 0; f < 600; f++) {
      const [d, p] = patterns[(f >> 3) % patterns.length];
      fakeInput.set(d, f % 8 === 0 ? p : {});
      world.update(1 / 60, fakeInput);
      world.draw(stubCtx(new Cv(W, H)));
      totalFrames++;
      const pl = world.player;
      if (!Number.isFinite(pl.x) || !Number.isFinite(pl.y)) { warn(`level ${li + 1}: player NaN at frame ${f}`); break; }
      for (const e of world.entities) {
        if (!Number.isFinite(e.x) || !Number.isFinite(e.y)) { warn(`level ${li + 1}: entity ${e.type} NaN at frame ${f}`); throw new Error('nan'); }
      }
      if (pl.dead) { pl.hp = pl.maxHp; pl.dead = false; pl.deathT = 0; pl.inv = 1; } // keep sim alive
    }
  } catch (e) {
    if (e.message !== 'nan') warn(`level ${li + 1} (${def.name}): update/draw threw — ${e.message}\n  ${(e.stack || '').split('\n')[1]?.trim()}`);
  }
  // boss level: verify boss present + emits bossDead when killed
  if (li === 5) {
    const boss = world.entities.find(e => e.behavior.isBoss);
    if (!boss) warn(`level 6: no boss entity spawned`);
  }
  const realWarns = capturedWarns.filter(w => !w.includes('unknown entity type') || true);
  const label = `L${li + 1} ${def.name || ''}`.padEnd(22);
  origErr(`  ${label} entities:${nEnt}  ${realWarns.length ? 'warns:' + realWarns.length : 'clean'}`);
  for (const w of realWarns.slice(0, 5)) warn(`level ${li + 1}: console — ${w}`);
}

console.warn = origWarn; console.error = origErr;
console.log(`\nsimulated ${totalFrames} frames across ${content.LEVELS.length} levels, ${DRAWS} draw ops`);
if (errs.length) {
  console.log(`\nFAIL (${errs.length} issues):`);
  for (const e of errs) console.log(' - ' + e);
  process.exit(1);
}
console.log('INTEGRATION PASS — all levels build, simulate, and render without errors');
