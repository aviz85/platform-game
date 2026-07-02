// HUD: hearts, shard counter, boss bar, level-name toast. Uses ui_kit art with fallbacks.
export class HUD {
  constructor(uiArt) {
    this.ui = uiArt; // { stamps: {heart_full, heart_empty, shard_icon, panel?}, font?: {canvas, cw, ch, chars} }
    this.toast = ''; this.toastT = 0;
  }
  showToast(text, dur = 2.5) { this.toast = text; this.toastT = dur; }

  drawText(ctx, text, x, y, scale = 1, align = 'left') {
    const f = this.ui && this.ui.font;
    text = String(text).toUpperCase();
    if (f && f.canvas) {
      const w = text.length * (f.cw + 1) * scale;
      let cx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
      for (const ch of text) {
        const idx = f.chars.indexOf(ch);
        if (idx >= 0) {
          ctx.drawImage(f.canvas, idx * f.cw, 0, f.cw, f.ch,
            Math.round(cx), Math.round(y), f.cw * scale, f.ch * scale);
        }
        cx += (f.cw + 1) * scale;
      }
    } else {
      ctx.font = `${8 * scale}px monospace`;
      ctx.textAlign = align;
      ctx.fillStyle = '#e8e4ff';
      ctx.fillText(text, x, y + 7 * scale);
      ctx.textAlign = 'left';
    }
  }

  draw(ctx, world, dt, W, H) {
    const p = world.player;
    const stamps = (this.ui && this.ui.stamps) || {};
    // hearts
    for (let i = 0; i < p.maxHp; i++) {
      const x = 6 + i * 11, y = 6;
      const st = i < p.hp ? stamps.heart_full : stamps.heart_empty;
      if (st && st.canvas) ctx.drawImage(st.canvas, x, y);
      else {
        ctx.fillStyle = i < p.hp ? '#ff5c8a' : '#3a3352';
        ctx.fillRect(x, y, 8, 8);
        ctx.fillStyle = i < p.hp ? '#ffc2d4' : '#4c4668';
        ctx.fillRect(x + 1, y + 1, 3, 3);
      }
    }
    // shards
    const sx = 8, sy = 20;
    if (stamps.shard_icon && stamps.shard_icon.canvas) ctx.drawImage(stamps.shard_icon.canvas, sx - 2, sy - 2);
    else {
      ctx.fillStyle = '#7df1ff';
      ctx.beginPath();
      ctx.moveTo(sx + 4, sy); ctx.lineTo(sx + 8, sy + 5); ctx.lineTo(sx + 4, sy + 10); ctx.lineTo(sx, sy + 5);
      ctx.fill();
    }
    this.drawText(ctx, `${p.shards}`, sx + 13, sy + 1);

    // boss bar
    const boss = world.entities.find(e => e.behavior.isBoss && !e.dead);
    if (boss && Math.abs(boss.x - p.x) < W) {
      const bw = 160, bx = W / 2 - bw / 2, by = H - 16;
      ctx.fillStyle = '#1a1030'; ctx.fillRect(bx - 2, by - 2, bw + 4, 8);
      ctx.fillStyle = '#3a3352'; ctx.fillRect(bx, by, bw, 4);
      ctx.fillStyle = '#c48bff'; ctx.fillRect(bx, by, bw * Math.max(0, boss.hp / boss.maxHp), 4);
      ctx.fillStyle = '#ff7bd5'; ctx.fillRect(bx, by, bw * Math.max(0, boss.hp / boss.maxHp), 1);
    }

    // toast
    if (this.toastT > 0) {
      this.toastT -= dt;
      const a = Math.min(1, this.toastT * 2, (2.5 - this.toastT) * 3);
      ctx.globalAlpha = Math.max(0, a);
      this.drawText(ctx, this.toast, W / 2, 46, 2, 'center');
      ctx.globalAlpha = 1;
    }
  }
}
