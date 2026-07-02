// Particle system. Uses fx sprite anims when available, colored pixels otherwise.
import { drawAnim } from './animator.js';

export class Particles {
  constructor(fxArt) {
    this.fx = fxArt; // art module result or null
    this.list = [];
  }
  spawn(kind, x, y, n = 6, opts = {}) {
    for (let i = 0; i < n; i++) {
      const a = opts.angle !== undefined
        ? opts.angle + (Math.random() - 0.5) * (opts.spread ?? 1.2)
        : Math.random() * Math.PI * 2;
      const sp = (opts.speed ?? 60) * (0.4 + Math.random() * 0.9);
      this.list.push({
        kind, x, y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (opts.up ?? 20),
        life: (opts.life ?? 0.6) * (0.6 + Math.random() * 0.7),
        t: 0,
        g: opts.gravity ?? 220,
        color: opts.color || '#9ff',
        size: opts.size ?? (1 + (Math.random() * 2 | 0)),
        drag: opts.drag ?? 0.9,
      });
      if (this.list.length > 600) this.list.shift();
    }
  }
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.t += dt;
      if (p.t >= p.life) { this.list.splice(i, 1); continue; }
      p.vy += p.g * dt;
      p.vx *= Math.pow(p.drag, dt * 60);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }
  draw(ctx) {
    for (const p of this.list) {
      const fade = 1 - p.t / p.life;
      if (this.fx && this.fx.anims && this.fx.anims[p.kind]) {
        drawAnim(ctx, this.fx, p.kind, p.t, p.x, p.y, false, fade);
      } else {
        ctx.globalAlpha = fade;
        ctx.fillStyle = p.color;
        const s = p.size;
        ctx.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), s, s);
        ctx.globalAlpha = 1;
      }
    }
  }
}
