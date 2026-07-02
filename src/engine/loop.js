// Fixed-clamp requestAnimationFrame loop.
export class Loop {
  constructor(update, render) {
    this.update = update;
    this.render = render;
    this.last = 0;
    this.running = false;
    this.time = 0;
  }
  start() {
    this.running = true;
    this.last = performance.now();
    const tick = (now) => {
      if (!this.running) return;
      let dt = (now - this.last) / 1000;
      this.last = now;
      if (dt > 0.05) dt = 0.05; // clamp spiral of death / tab-back
      this.time += dt;
      this.update(dt, this.time);
      this.render(dt, this.time);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}
