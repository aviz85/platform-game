// Title screen: animated parallax backdrop + logo + prompt.
import { drawBgLayer } from '../engine/renderer.js';

export class Title {
  constructor(content, W, H) {
    this.content = content;
    this.W = W; this.H = H;
    this.t = 0;
    this.fakeCam = { ox: 0, oy: 0 };
  }
  update(dt) { this.t += dt; this.fakeCam.ox += dt * 12; }
  draw(ctx, hud) {
    const { W, H } = this;
    ctx.fillStyle = '#0b0716';
    ctx.fillRect(0, 0, W, H);
    const layers = this.content.BACKGROUNDS.forest || [];
    for (const l of layers) {
      if (!l || l.front) continue;
      drawBgLayer(ctx, l, this.fakeCam, H + 40, this.t, W, H);
    }
    // vignette
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(11,7,22,0.55)');
    g.addColorStop(0.45, 'rgba(11,7,22,0)');
    g.addColorStop(1, 'rgba(11,7,22,0.75)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const titleArt = this.content.ART.title_art;
    const logo = titleArt && titleArt.stamps && titleArt.stamps.logo;
    const bob = Math.sin(this.t * 1.6) * 3;
    if (logo && logo.canvas) {
      ctx.drawImage(logo.canvas, Math.round(W / 2 - logo.canvas.width / 2), Math.round(52 + bob));
    } else {
      hud.drawText(ctx, 'AETHERFALL', W / 2, 70 + bob, 3, 'center');
    }
    if ((this.t * 1.4 | 0) % 2 === 0) {
      hud.drawText(ctx, 'PRESS ENTER', W / 2, 175, 1, 'center');
    }
    hud.drawText(ctx, 'ARROWS/WASD MOVE  SPACE JUMP  X ATTACK  SHIFT DASH', W / 2, H - 22, 1, 'center');
  }
}
