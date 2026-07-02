# AETHERFALL — Content Module Contracts

You are building ONE content module for a pixel-art platformer. Your file must be a
browser ES module (plain JS, no TypeScript, no npm imports). The engine is already
written — you only implement your module's contract, then validate it:

```
node tools/validate.mjs src/content/<your-file>
```

**You are DONE only when the validator prints PASS.** Iterate until it does.
Never edit any file except the one assigned to you.

## The world & art direction (read carefully — quality bar is high)

**AETHERFALL** — a floating fantasy-scifi archipelago. Crystal-punk: ancient violet
stone ruins fused with living cyan crystals and humming neon technology. Three biomes:

- **forest** — Lumen Woods: violet-stone floating islands, bioluminescent teal/green
  foliage, giant glowing cyan crystals, fireflies, warm amber lanterns of a lost
  civilization. Sky: deep violet gradient with magenta horizon and shattered moons.
- **ruins** — Sky Bastion: colossal broken towers and bridges above the clouds, pale
  stone + verdigris metal, floating masonry, golden banners, holographic glyphs,
  wind-blown cloud sea below, warm sunset amber against indigo.
- **depths** — Neon Depths: underground tech-caverns, dark metal + rust, magenta/cyan
  neon conduits, pulsing reactor cores, steam vents, hazard stripes, dark teal rock.

**Pixel-art rules (mandatory):**
- Use ONLY colors from `src/content/art/palette.js` (`PAL`, `RAMPS`) plus colors made
  with `shade()` from `src/content/art/util.js`. Vivid, saturated, cohesive.
- 1px outlines in `PAL.outline` (dark purple — never pure black) around characters
  and props. Use the `outline()` helper AFTER drawing a frame region.
- Light from upper-left: top/left edges get the lightest ramp step, bottom/right the darkest.
- 3–4 shade ramp per material (use `RAMPS`). Selective `dither()` for gradients on
  large surfaces — never banding.
- Emissive parts (crystals, eyes, engines, neon) get a `glow()` halo + a `PAL.white`
  or ramp-0 hot pixel.
- Strong silhouettes. A sprite must read at a glance at 1x zoom.
- Draw with the helpers in `src/content/art/util.js`: `makeCanvas, P (pixel),
  R (rect), line, circleFill, ellipseFill, dither, outline, glow, shade, rng, frameGrid`.
- Determinism: use `rng(seed)` from util.js, never `Math.random()`. `build()` must
  return identical art every call.
- Art modules must work in node (the validator stubs OffscreenCanvas): NEVER touch
  `document`/`window` at top level. Only use `makeCanvas()` inside `build()`.

## Contract by kind

### kind: sprite  (hero, enemies, boss, fx_particles, collectibles, portal)
```js
import { PAL, RAMPS } from './palette.js';
import { makeCanvas, P, R, outline, glow, ... } from './util.js';
export function build() {
  const fw = 24, fh = 24;               // frame size — pick what fits
  const c = makeCanvas(fw * NFRAMES, fh * NROWS);
  const ctx = c.getContext('2d');
  // ... draw every frame at (i*fw, row*fh) ...
  return {
    image: c,
    anims: {
      idle: { frames: [{x,y,w:fw,h:fh}, ...], fps: 6,  loop: true },
      run:  { frames: frameGrid(fw, fh, 8, 1), fps: 14, loop: true },
      // ...
    },
    anchor: { x: fw/2, y: fh },          // FEET CENTER (x,y = center-bottom in engine)
  };
}
```
Frame budget (minimum): hero run 8, idle 4 (breathing), jump 2, fall 2, attack 4,
hurt 2, dash 2. Enemies: 'move' ≥4 frames + a second anim ('attack'/'telegraph') ≥3.
Squash & stretch, anticipation frames, secondary motion (antennae, cloth, glow pulse).
Characters must have readable faces/eyes. Hero: agile explorer in a
blue-cyan tech-suit (PAL.hero0/1, heroSuit1/2) with a glowing energy blade for the
attack anim (cyan arc slash), warm skin tones, flowing short scarf.

fx_particles anims needed: spark, dust, orb (+ optional boom, shard_glint), 3-5 frames each,
small (6–10px), designed to fade out over the animation.
collectibles: 'shard' (spinning cyan crystal, 6 frames), 'heart' (pulsing pink energy heart, 4 frames).
portal: 'idle' (slow swirling violet ring gate, ≥6 frames, ~28x36), 'open' (bright rapid swirl).

### kind: tileset  (tiles_forest / tiles_ruins / tiles_depths)
```js
export function build() {
  // 16x16 tiles packed in one canvas
  return { image, tileSize: 16, tiles: {
    '#': [{x,y}, {x,y}, ...],   // solid fill — 2-4 variants (array = variants)
    '#top': [{x,y}, ...],       // solid with grass/moss/tech surface (air above)
    'X': {x,y},                 // heavy solid block (metal/carved stone)
    '|': {x,y},                 // pillar/column solid
    '=': {x,y},                 // one-way platform: only TOP 5-6px should be drawn opaque-ish
    '^': {x,y},                 // hazard: crystal spikes / energy vents — clearly dangerous
    // decor (non-solid, drawn in place, biome-flavored) — pick sensible lowercase chars:
    'g': ..., 'c': ..., 'v': ..., 'l': ..., 'r': ...,  // e.g. grass, crystal, vine, lamp, rune
  }};
}
```
Tiles must seam perfectly side-by-side. '#top' is the beauty tile — lush surface.
Include at least 4 decor chars. Edges shaded per light rule.

### kind: props  (props_forest / props_ruins / props_depths)
```js
export function build() {
  return { stamps: {
    crystal_big: { canvas },   // 3-6 stamps, each its own canvas, 24-80px tall
    tree_glow: { canvas },
    statue: { canvas },
  }};
}
```
Large scenic decor placed behind tiles. Names are yours; levels reference them via
`decor: [{stamp:'crystal_big', x:tileX, y:tileY(bottom row)}]` — so document stamp
names in a comment at the top of your file. Make them gorgeous — these sell the biome.

### kind: bg  (bg_<biome>_far / _mid / _near / _fg)
```js
export function build() {
  const c = makeCanvas(480, 270);   // or wider (e.g. 640) for less obvious repetition
  // paint the layer... must TILE HORIZONTALLY SEAMLESSLY (left edge meets right edge)
  return {
    canvas: c,
    factor: 0.1,        // parallax: far 0.05-0.25, mid 0.3-0.6, near 0.6-0.95, fg 1.05-1.7
    tileX: true,
    y: 0,               // px offset from level bottom (optional)
    front: true,        // ONLY for _fg files (drawn over gameplay)
    autoScroll: 4,      // optional px/sec drift (clouds, fog)
    alpha: 1,
  };
}
```
- `_far`: sky gradient + celestial bodies + distant silhouettes. Full 480x270, mostly
  opaque. Use dither() between sky bands, stars/moons/nebula.
- `_mid`: big structural silhouettes (islands/towers/machines) — transparent above.
- `_near`: closer detailed silhouettes, darker than gameplay so play area reads clearly.
- `_fg`: sparse foreground silhouettes at the BOTTOM edge (foliage/pipes/crystals),
  height ~60-100px, canvas 480 wide, mostly transparent, very dark (near PAL.outline
  tones) with faint rim light — must never obscure the middle of the screen.

### kind: ui  (ui_kit)
```js
export function build() {
  return {
    stamps: { heart_full:{canvas}, heart_empty:{canvas}, shard_icon:{canvas} }, // ~8-10px
    font: { canvas, cw: 6, ch: 8, chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,:!?-+/' },
  };
}
```
Bitmap font: glyphs in ONE ROW on the canvas, each cw px wide, ch px tall, in `chars`
order, PAL.white with 1px PAL.outline shadow at +1,+1. Crisp and readable.

### kind: titleart  (title_art)
```js
export function build() { return { stamps: { logo: { canvas } } }; }
```
"AETHERFALL" logo, ~220-300px wide: chunky pixel lettering, cyan-to-violet vertical
gradient with crystal facets, glow accents, dark outline. Optional subtitle line.

### kind: sfx  (audio/sfx.js)
```js
export const SFX = {
  jump: { wave:'square', from:300, to:660, dur:0.14, vol:0.30, curve:'exp' },
  ...
};
```
Required names: jump, land, attack, hit, hurt, death, dash, pickup, heart, portal,
menu, enemyDeath. Optional extras: shoot, telegraph, bossHit, bossRoar, step.
Params: wave square|sine|triangle|sawtooth|noise; from/to Hz (noise = bandpass sweep);
dur sec; vol 0..1 (keep ≤0.5); curve 'exp'|'lin'; attack sec; repeat n + gap sec for trills.
Design cohesive retro-futuristic sounds: airy jumps, crunchy noise hits, sparkly pickups.

### kind: music  (audio/music_*.js)
```js
export const track = {
  bpm: 112, bars: 16, beatsPerBar: 4, stepsPerBeat: 4, loop: true,
  channels: [
    { wave:'triangle', volume:0.30, decay:0.9, pan:0,    notes:[[bar,step,midi,lenSteps],...] }, // bass
    { wave:'square',   volume:0.16, decay:0.8, pan:-0.3, notes:[...] },  // lead
    { wave:'square',   volume:0.10, decay:0.6, pan: 0.3, notes:[...] },  // harmony/arp
    { wave:'noise',    volume:0.08, decay:0.3,           notes:[[0,0,80,1],[0,8,80,1],...] }, // drums (midi≈pitch of hiss)
  ],
};
```
step index 0..15 within each bar (16th notes). midi 20..105. Write REAL compositions:
chord progressions, a memorable lead melody with phrases and rests, bassline locked to
the kick, arpeggios, variation between bar groups (A A B A). 16-32 bars.
Moods — title: wonder, slow build, arpeggiated. forest: bright adventurous 100-120bpm.
ruins: majestic, windswept, 90-110bpm, minor-major shifts. depths: tense driving
synthwave 120-140bpm. boss: aggressive, pounding, 140-160bpm.
The engine adds a subtle space-echo; leave room (don't wall-of-sound every step).

### kind: level  (levels/level1..6.js)
```js
export const level = {
  name: 'LUMEN WOODS',        // shown as toast
  biome: 'forest',            // forest|ruins|depths
  music: 'forest',            // title|forest|ruins|depths|boss
  skyColor: '#150c2e',
  spawn: { x: 3, y: 12 },     // TILE coords (col,row) standing on ground
  exit:  { x: 116, y: 6 },    // portal location, right of spawn
  map: [
    '................',        // strings, one row per line, tile chars:
    // '.' air  '#' solid  'X' heavy solid  '|' pillar  '=' one-way platform
    // '^' hazard spikes  '*' shard pickup  'H' heart pickup
    // lowercase letters = decor from the biome tileset (g,c,v,l,r,...)
  ],
  entities: [ { type:'crawler', x: 22, y: 12 }, ... ],
  decor: [ { stamp:'crystal_big', x: 30, y: 12 }, ... ],  // props stamps (y = bottom tile row)
};
```
Level design bar: 17-24 rows tall, 100-200 cols wide. Teach → test → twist pacing.
Jumps max 4 tiles high / 6 wide (player: speed 130, jump ~4.5 tiles, dash 330px/s).
Use one-way platforms for verticality, hazards with safe rhythm gaps, shard trails
that guide the eye along the intended path (≥14 shards), 1-2 hearts, secrets off the
main path, enemy placement that creates setpieces not spam. Always ground under
spawn/exit. Entity types: drone, crawler, floater, sentinel, slime, wraith,
boss_colossus (level6 only — build an arena: flat floor, side walls, platforms).
Progression: level1 forest (easy, teach), level2 forest (verticality), level3 ruins
(platforming focus), level4 ruins (combat focus), level5 depths (hazard gauntlet),
level6 depths boss arena (60-80 cols, boss + a few shards + heart).

### kind: behavior  (behaviors/*.js)
```js
export const behavior = {
  sprite: 'enemy_drone',      // FIXED per file (validator enforces)
  hp: 3, damage: 1, w: 14, h: 12,
  gravity: false,             // engine applies gravity+ground collision if true
  collides: true,             // tile collision (false = ghost/flying through walls)
  contactDamage: true,
  shardDrop: 1,
  isBoss: false,
  init(e, world) { e.mem.baseY = e.y; },
  update(e, world, dt) {
    // steer via e.vx / e.vy (px/sec). e.facing = ±1 (visual flip).
    // e.anim = 'move' | 'attack' | ... (must match your art module's anims)
    // e.mem = free scratch object, e.t = lifetime sec, e.timers = free
  },
};
```
World API available inside init/update:
`world.player` {x,y,vx,vy,facing,hp,dead} · `world.time` ·
`world.solidAt(px,py)` · `world.groundAhead(e,dist)` ·
`world.distToPlayer(e)` · `world.dirToPlayer(e)` (±1) · `world.angleToPlayer(e)` ·
`world.spawnParticles(kind,x,y,n,{speed,life,color,gravity,up,angle,spread})` ·
`world.spawnProjectile({x,y,vx,vy,damage:1,ttl,r,color,glow,gravity})` ·
`world.playSfx(name)` · `world.shake(mag,dur)` · `world.rng()` · `world.emit(name)`.
Coordinates: x,y = feet center. Design intent:
- drone: hovering patroller, sine bob; on player within 90px — telegraph then swoop dive. hp2.
- crawler: grounded walker (gravity:true), turns at edges/walls (groundAhead), brief charge when player near+level. hp3.
- floater: slow drifting jellyfish-like, ignores tiles (collides:false), gentle homing ≤40px/s, pulsing glow particles. hp2.
- sentinel: stationary turret; aims and fires 1-3 projectile bursts with clear telegraph (particles+sfx 'telegraph'/'shoot'), cooldown ≥1.6s. hp4.
- slime: gravity hopper; hops toward player every 1-1.4s, squash anim on land, splat particles. hp3.
- wraith: phasing ghost (collides:false); fades between visible/dim (use e.anim variants), sweeping figure-eight approach, retreats after contact. hp2.
- boss_colossus: isBoss:true, hp 45-60, w~40 h~48, gravity:true. 3 phases by hp:
  (1) slow stomps toward player + shockwave particles on land;
  (2) adds radial projectile bursts with telegraph;
  (3) enraged — faster, ground-pound leaps (world.shake), spiral bullets.
  Give each attack a ≥0.5s readable telegraph. Never leave the arena (clamp to spawnX±200).

## Checklist before you finish
1. `node tools/validate.mjs src/content/<file>` → **PASS** (fix and re-run until it does).
2. Re-read your art at the quality bar above — would it look at home in Celeste/Owlboy?
   If not, add detail: rim light, glow, extra frames, secondary motion.
3. Your final message: one line — file path, PASS, and (for art) frame counts.
