// Player controller: run, variable jump, coyote time, jump buffer, dash, melee attack.
import { moveAndCollide, hazardAt } from '../engine/physics.js';
import { drawAnim, animLength } from '../engine/animator.js';

const SPEED = 130, ACCEL = 1400, FRICTION = 1100;
const GRAV = 1350, MAX_FALL = 380;
const JUMP_V = -440, JUMP_CUT = 0.42; // peak ~4.5 tiles — matches level-design spec (was -335 ≈ 2.6 tiles, too low)
const COYOTE = 0.10, BUFFER = 0.12;
const DASH_SPEED = 330, DASH_TIME = 0.16, DASH_CD = 0.55;
const ATTACK_TIME = 0.32, ATTACK_CD = 0.38;
const IFRAMES = 1.1, MAX_HP = 5;

export class Player {
  constructor(x, y, art) {
    this.x = x; this.y = y;
    this.w = 10; this.h = 15;
    this.vx = 0; this.vy = 0;
    this.facing = 1;
    this.onGround = false;
    this.hp = MAX_HP; this.maxHp = MAX_HP;
    this.shards = 0;
    this.art = art;
    this.anim = 'idle'; this.animT = 0;
    this.coyote = 0; this.buffer = 0;
    this.dashT = 0; this.dashCd = 0; this.canDash = true;
    this.attackT = 0; this.attackCd = 0;
    this.hurtT = 0; this.inv = 0;
    this.dead = false; this.deathT = 0;
  }

  update(dt, input, world) {
    const { level, particles, audio, camera } = world;
    if (this.dead) { this.deathT += dt; this.animT += dt; return; }

    this.coyote -= dt; this.buffer -= dt;
    this.dashCd -= dt; this.attackCd -= dt;
    this.inv -= dt; this.hurtT -= dt;

    const left = input.isDown('left'), right = input.isDown('right');
    const move = (right ? 1 : 0) - (left ? 1 : 0);

    // --- dash ---
    if (input.justPressed('dash') && this.dashCd <= 0 && this.canDash) {
      this.dashT = DASH_TIME; this.dashCd = DASH_CD;
      if (!this.onGround) this.canDash = false;
      this.vy = 0;
      audio.playSfx('dash');
      particles.spawn('dust', this.x, this.y, 8, { speed: 40, up: 8, life: 0.4, color: '#9be8ff', gravity: 40 });
      camera.shake(2, 0.12);
    }

    if (this.dashT > 0) {
      this.dashT -= dt;
      this.vx = this.facing * DASH_SPEED;
      this.vy = 0;
      if ((this.dashT * 30 | 0) % 2 === 0) {
        particles.spawn('spark', this.x - this.facing * 4, this.y - 8, 1, { speed: 10, life: 0.3, color: '#7df1ff', gravity: 0 });
      }
    } else {
      // --- horizontal ---
      if (move !== 0) {
        this.facing = move;
        this.vx += move * ACCEL * dt;
        const cap = SPEED;
        if (Math.abs(this.vx) > cap) this.vx = move * cap;
      } else {
        const s = Math.sign(this.vx);
        this.vx -= s * FRICTION * dt;
        if (Math.sign(this.vx) !== s) this.vx = 0;
      }
      // --- gravity ---
      this.vy += GRAV * dt;
      if (this.vy > MAX_FALL) this.vy = MAX_FALL;
    }

    // --- jump ---
    if (input.justPressed('jump')) this.buffer = BUFFER;
    if (this.buffer > 0 && (this.onGround || this.coyote > 0)) {
      this.vy = JUMP_V;
      this.buffer = 0; this.coyote = 0;
      this.onGround = false;
      audio.playSfx('jump');
      particles.spawn('dust', this.x, this.y, 5, { speed: 30, up: 10, life: 0.35, color: '#cbd7ff', gravity: 100 });
    }
    if (!input.isDown('jump') && this.vy < 0 && this.dashT <= 0) this.vy *= (1 - (1 - JUMP_CUT) * Math.min(1, dt * 22));

    // drop through one-way platforms
    this.dropThrough = input.isDown('left') === false && input.isDown('right') === false && input.isDown('jump') === false && input.isDown('dash') === false && false;

    // --- attack ---
    if (input.justPressed('attack') && this.attackCd <= 0) {
      this.attackT = ATTACK_TIME; this.attackCd = ATTACK_CD;
      audio.playSfx('attack');
      world.playerAttack(this);
    }
    if (this.attackT > 0) this.attackT -= dt;

    // --- physics ---
    const wasGround = this.onGround;
    moveAndCollide(this, level, dt);
    if (this.onGround) { this.coyote = COYOTE; this.canDash = true; }
    else if (wasGround && this.vy >= 0) this.coyote = COYOTE;
    if (this.onGround && !wasGround) {
      audio.playSfx('land');
      particles.spawn('dust', this.x, this.y, 6, { speed: 45, up: 5, life: 0.3, color: '#8f86b8', gravity: 120 });
    }

    // --- hazards ---
    const hzY = this.y - 2, hzX = this.x;
    if (hazardAt(level, hzX, hzY) || hazardAt(level, hzX - this.w / 2 + 1, hzY) || hazardAt(level, hzX + this.w / 2 - 1, hzY)) {
      this.hurt(1, world, -this.facing);
    }
    // --- fell out of world ---
    if (this.y > level.rows * 16 + 60) {
      this.hurt(1, world, 0);
      if (!this.dead) { this.x = world.spawn.x; this.y = world.spawn.y; this.vx = 0; this.vy = 0; world.camera.snap(this.x, this.y, level.cols * 16, level.rows * 16); }
    }

    // --- animation state ---
    const prev = this.anim;
    if (this.hurtT > 0) this.anim = 'hurt';
    else if (this.dashT > 0) this.anim = 'dash';
    else if (this.attackT > 0) this.anim = 'attack';
    else if (!this.onGround) this.anim = this.vy < 0 ? 'jump' : 'fall';
    else if (Math.abs(this.vx) > 10) this.anim = 'run';
    else this.anim = 'idle';
    if (prev !== this.anim) this.animT = 0;
    this.animT += dt;
  }

  hurt(dmg, world, dir = 0) {
    if (this.inv > 0 || this.dead) return;
    this.hp -= dmg;
    this.inv = IFRAMES; this.hurtT = 0.28;
    this.vx = dir * 160; this.vy = -180;
    world.audio.playSfx('hurt');
    world.camera.shake(4, 0.25);
    world.particles.spawn('spark', this.x, this.y - 8, 10, { speed: 90, life: 0.5, color: '#ff5c8a' });
    if (this.hp <= 0) {
      this.dead = true; this.deathT = 0; this.anim = 'hurt'; this.animT = 0;
      world.audio.playSfx('death');
      world.audio.stopMusic();
      world.camera.shake(6, 0.5);
      world.particles.spawn('boom', this.x, this.y - 8, 20, { speed: 120, life: 0.8, color: '#ff5c8a' });
    }
  }

  attackBox() {
    if (this.attackT < ATTACK_TIME - 0.22 || this.attackT > ATTACK_TIME - 0.02) return null;
    return { x: this.x + this.facing * 13, y: this.y, w: 22, h: 20 };
  }

  draw(ctx, cam) {
    if (this.inv > 0 && !this.dead && (this.inv * 14 | 0) % 2 === 0) return; // blink
    drawAnim(ctx, this.art, this.anim, this.animT, this.x - cam.ox, this.y - cam.oy, this.facing < 0);
  }
}
