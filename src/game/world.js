// World: loads a level, owns entities/projectiles/pickups/portal, exposes the behavior API.
import { TILE, SOLID, charAt, solidAt, moveAndCollide, aabbOverlap } from '../engine/physics.js';
import { drawAnim, animLength } from '../engine/animator.js';
import { drawBgLayer, drawTiles } from '../engine/renderer.js';
import { Player } from './player.js';

let rngState = 12345;
function rng() { rngState = (rngState * 1103515245 + 12345) & 0x7fffffff; return rngState / 0x7fffffff; }

export class World {
  constructor(levelDef, content, audio, camera, particles, W, H) {
    this.W = W; this.H = H;
    this.content = content; // { ART, BACKGROUNDS, TILESETS, PROPS, BEHAVIORS }
    this.audio = audio;
    this.camera = camera;
    this.particles = particles;
    this.time = 0;
    this.events = [];
    this.loadLevel(levelDef);
  }

  loadLevel(def) {
    // normalize map: pad rows to equal length
    const rows = def.map.map(r => r);
    const cols = Math.max(...rows.map(r => r.length));
    this.level = {
      ...def,
      map: rows.map(r => r.padEnd(cols, '.')),
      rows: rows.length,
      cols,
    };
    this.def = def;
    this.pixelW = cols * TILE;
    this.pixelH = rows.length * TILE;
    this.biome = def.biome || 'forest';
    this.tileset = this.content.TILESETS[this.biome];
    this.bgLayers = (this.content.BACKGROUNDS[this.biome] || []).filter(l => l && !l.front);
    this.fgLayers = (this.content.BACKGROUNDS[this.biome] || []).filter(l => l && l.front);
    this.props = this.content.PROPS[this.biome];

    this.spawn = { x: def.spawn.x * TILE + TILE / 2, y: def.spawn.y * TILE + TILE - 0.1 };
    this.exit = { x: def.exit.x * TILE + TILE / 2, y: def.exit.y * TILE + TILE - 0.1 };
    this.player = new Player(this.spawn.x, this.spawn.y, this.content.ART.hero);
    this.portalT = 0;
    this.completed = false; this.completeT = 0;

    // pickups from map chars
    this.pickups = [];
    for (let ty = 0; ty < this.level.rows; ty++) {
      for (let tx = 0; tx < this.level.cols; tx++) {
        const c = this.level.map[ty][tx];
        if (c === '*') this.pickups.push({ kind: 'shard', x: tx * TILE + 8, y: ty * TILE + 15, t: rng() * 6, taken: false });
        if (c === 'H') this.pickups.push({ kind: 'heart', x: tx * TILE + 8, y: ty * TILE + 15, t: rng() * 6, taken: false });
      }
    }

    // entities
    this.entities = [];
    this.projectiles = [];
    for (const spec of def.entities || []) {
      this.spawnEntity(spec.type, spec.x * TILE + TILE / 2, spec.y * TILE + TILE - 0.1, spec.props);
    }
    this.decor = def.decor || [];
    this.camera.snap(this.player.x, this.player.y, this.pixelW, this.pixelH);
  }

  spawnEntity(type, x, y, props) {
    const behavior = this.content.BEHAVIORS[type];
    if (!behavior) { console.warn('unknown entity type', type); return null; }
    const e = {
      type, behavior,
      x, y,
      w: behavior.w || 14, h: behavior.h || 14,
      vx: 0, vy: 0,
      hp: behavior.hp || 2,
      maxHp: behavior.hp || 2,
      facing: -1,
      anim: 'move', animT: 0,
      onGround: false, dead: false,
      hitT: 0, t: rng() * 10,
      spawnX: x, spawnY: y,
      timers: {}, mem: {},
      props: props || {},
    };
    try { if (behavior.init) behavior.init(e, this.api()); } catch (err) { console.warn('init fail', type, err); }
    this.entities.push(e);
    return e;
  }

  // API surface handed to behavior modules
  api() {
    if (this._api) { this._api.time = this.time; return this._api; }
    const w = this;
    this._api = {
      time: this.time,
      get player() { return w.player; },
      solidAt: (x, y) => solidAt(w.level, x, y),
      groundAhead: (e, dist = 10) => solidAt(w.level, e.x + e.facing * (e.w / 2 + dist), e.y + 6),
      distToPlayer: (e) => Math.hypot(w.player.x - e.x, (w.player.y - w.player.h / 2) - (e.y - e.h / 2)),
      dirToPlayer: (e) => Math.sign(w.player.x - e.x) || 1,
      angleToPlayer: (e) => Math.atan2((w.player.y - w.player.h / 2) - (e.y - e.h / 2), w.player.x - e.x),
      spawnParticles: (kind, x, y, n, opts) => w.particles.spawn(kind, x, y, n, opts),
      spawnProjectile: (opts) => {
        w.projectiles.push({
          x: opts.x, y: opts.y, vx: opts.vx || 0, vy: opts.vy || 0,
          damage: opts.damage || 1, ttl: opts.ttl || 3, t: 0,
          r: opts.r || 3, color: opts.color || '#ff7bd5', glow: opts.glow || '#ff7bd577',
          gravity: opts.gravity || 0, fromEnemy: true,
        });
        if (w.projectiles.length > 80) w.projectiles.shift();
      },
      playSfx: (n) => w.audio.playSfx(n),
      shake: (m, d) => w.camera.shake(m, d),
      rng,
      emit: (name) => w.events.push(name),
    };
    return this._api;
  }

  playerAttack(player) {
    // resolved next update via attackBox window; immediate feedback spark
    this.particles.spawn('spark', player.x + player.facing * 14, player.y - 10, 5,
      { speed: 70, life: 0.25, color: '#bdf6ff', angle: player.facing > 0 ? 0 : Math.PI, spread: 1.2, gravity: 0 });
  }

  update(dt, input) {
    this.time += dt;
    const p = this.player;
    p.update(dt, input, this);

    const api = this.api();
    const box = p.attackBox();

    // --- entities ---
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const e = this.entities[i];
      if (e.dead) {
        e.deadT = (e.deadT || 0) + dt;
        if (e.deadT > 0.5) this.entities.splice(i, 1);
        continue;
      }
      // cull far-away updates (keep boss always live)
      const dx = Math.abs(e.x - p.x);
      if (dx > this.W * 1.4 && !e.behavior.isBoss) continue;

      e.t += dt; e.animT += dt; e.hitT -= dt;
      const prevAnim = e.anim;
      try { e.behavior.update(e, api, dt); } catch (err) { /* keep game alive */ }
      if (e.anim !== prevAnim) e.animT = 0;

      if (e.behavior.gravity) {
        e.vy += 1350 * dt;
        if (e.vy > 380) e.vy = 380;
      }
      if (e.behavior.collides !== false) moveAndCollide(e, this.level, dt);
      else { e.x += e.vx * dt; e.y += e.vy * dt; }

      if (!Number.isFinite(e.x) || !Number.isFinite(e.y)) { e.x = e.spawnX; e.y = e.spawnY; e.vx = e.vy = 0; }

      // player attack hits
      if (box && e.hitT <= 0 && aabbOverlap(box.x, box.y, box.w, box.h, e.x, e.y, e.w, e.h)) {
        e.hp -= 1; e.hitT = 0.25;
        e.vx += p.facing * 90;
        this.audio.playSfx('hit');
        this.camera.shake(2, 0.1);
        this.particles.spawn('spark', e.x, e.y - e.h / 2, 8, { speed: 90, life: 0.4, color: '#ffe27a' });
        if (e.hp <= 0) this.killEntity(e);
      }
      // contact damage
      if (!e.dead && e.behavior.contactDamage !== false &&
          aabbOverlap(p.x, p.y, p.w, p.h, e.x, e.y, e.w, e.h)) {
        p.hurt(e.behavior.damage || 1, this, Math.sign(p.x - e.x) || 1);
      }
    }

    // --- projectiles ---
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      pr.t += dt;
      pr.vy += pr.gravity * dt;
      pr.x += pr.vx * dt; pr.y += pr.vy * dt;
      let kill = pr.t > pr.ttl || solidAt(this.level, pr.x, pr.y);
      if (!kill && aabbOverlap(p.x, p.y, p.w, p.h, pr.x, pr.y + pr.r, pr.r * 2, pr.r * 2)) {
        p.hurt(pr.damage, this, Math.sign(p.x - pr.x) || 1);
        kill = true;
      }
      if (kill) {
        this.particles.spawn('spark', pr.x, pr.y, 4, { speed: 50, life: 0.3, color: pr.color });
        this.projectiles.splice(i, 1);
      }
    }

    // --- pickups ---
    for (const pk of this.pickups) {
      if (pk.taken) continue;
      pk.t += dt;
      if (aabbOverlap(p.x, p.y, p.w + 6, p.h + 4, pk.x, pk.y, 12, 14)) {
        pk.taken = true;
        if (pk.kind === 'shard') { p.shards++; this.audio.playSfx('pickup'); }
        else { p.hp = Math.min(p.maxHp, p.hp + 1); this.audio.playSfx('heart'); }
        this.particles.spawn('shard_glint', pk.x, pk.y - 6, 8,
          { speed: 60, life: 0.5, color: pk.kind === 'shard' ? '#7df1ff' : '#ff8fa8', gravity: -40 });
      }
    }

    // --- portal / level complete ---
    this.portalT += dt;
    if (!this.completed && !p.dead &&
        Math.hypot(p.x - this.exit.x, (p.y - 8) - (this.exit.y - 12)) < 15) {
      this.completed = true;
      this.audio.playSfx('portal');
      this.particles.spawn('orb', this.exit.x, this.exit.y - 12, 24, { speed: 80, life: 0.9, color: '#c48bff', gravity: -60 });
    }
    if (this.completed) this.completeT += dt;

    // boss death → victory event
    if (this.events.includes('bossDead') && !this._bossHandled) {
      this._bossHandled = true;
    }

    this.particles.update(dt);
    this.camera.follow(p, this.pixelW, this.pixelH, dt);
  }

  killEntity(e) {
    e.dead = true; e.deadT = 0;
    this.audio.playSfx('enemyDeath');
    this.particles.spawn('boom', e.x, e.y - e.h / 2, 14, { speed: 100, life: 0.6, color: '#c48bff' });
    this.particles.spawn('spark', e.x, e.y - e.h / 2, 10, { speed: 130, life: 0.5, color: '#7df1ff' });
    const drops = e.behavior.shardDrop ?? 1;
    for (let i = 0; i < drops; i++) {
      this.pickups.push({ kind: 'shard', x: e.x + (rng() - 0.5) * 16, y: e.y - 4, t: 0, taken: false });
    }
    if (e.behavior.isBoss) this.events.push('bossDead');
    this.camera.shake(e.behavior.isBoss ? 8 : 3, e.behavior.isBoss ? 0.8 : 0.2);
  }

  draw(ctx) {
    const cam = this.camera, W = this.W, H = this.H;
    const ART = this.content.ART;
    // background fill
    ctx.fillStyle = this.def.skyColor || '#0b0716';
    ctx.fillRect(0, 0, W, H);
    for (const l of this.bgLayers) drawBgLayer(ctx, l, cam, this.pixelH, this.time, W, H);
    // decor stamps (props behind tiles)
    if (this.props && this.props.stamps) {
      for (const d of this.decor) {
        const st = this.props.stamps[d.stamp];
        if (st && st.canvas) {
          const sx = d.x * TILE - cam.ox, sy = (d.y + 1) * TILE - st.canvas.height - cam.oy;
          if (sx > -st.canvas.width && sx < W) ctx.drawImage(st.canvas, Math.round(sx), Math.round(sy));
        }
      }
    }
    drawTiles(ctx, this.level, this.tileset, cam, W, H);

    // portal
    const portalArt = ART.portal;
    drawAnim(ctx, portalArt, this.completed ? 'open' : 'idle', this.portalT,
      this.exit.x - cam.ox, this.exit.y - cam.oy);

    // pickups
    const colArt = ART.collectibles;
    for (const pk of this.pickups) {
      if (pk.taken) continue;
      const bob = Math.sin(pk.t * 3) * 2;
      drawAnim(ctx, colArt, pk.kind, pk.t, pk.x - cam.ox, pk.y + bob - cam.oy);
    }

    // entities
    for (const e of this.entities) {
      const art = ART[e.behavior.sprite];
      const alpha = e.dead ? Math.max(0, 1 - e.deadT * 2) : (e.hitT > 0 ? 0.7 : 1);
      drawAnim(ctx, art, e.anim, e.animT, e.x - cam.ox, e.y - cam.oy, e.facing < 0, alpha);
      if (e.behavior.isBoss && !e.dead) this._bossBar = e; // draw later in HUD
    }

    // player
    this.player.draw(ctx, cam);

    // projectiles (glowy orbs)
    for (const pr of this.projectiles) {
      const x = pr.x - cam.ox, y = pr.y - cam.oy;
      ctx.fillStyle = pr.glow;
      ctx.beginPath(); ctx.arc(x, y, pr.r + 2.5, 0, 7); ctx.fill();
      ctx.fillStyle = pr.color;
      ctx.beginPath(); ctx.arc(x, y, pr.r, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
    }

    ctx.save();
    ctx.translate(-cam.ox, -cam.oy);
    this.particles.draw(ctx);
    ctx.restore();

    // foreground parallax layers (factor > 1, drawn on top)
    for (const l of this.fgLayers) drawBgLayer(ctx, l, cam, this.pixelH, this.time, W, H);
  }
}
