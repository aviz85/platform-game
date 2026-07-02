// Smooth-follow camera with lookahead, level clamping and screenshake.
export class Camera {
  constructor(w, h) {
    this.w = w; this.h = h;
    this.x = 0; this.y = 0;
    this.tx = 0; this.ty = 0;
    this.look = 0;
    this.shakeT = 0; this.shakeMag = 0;
    this.sx = 0; this.sy = 0;
  }
  snap(x, y, levelW, levelH) {
    this.tx = this.x = this._clampX(x - this.w / 2, levelW);
    this.ty = this.y = this._clampY(y - this.h / 2, levelH);
  }
  follow(target, levelW, levelH, dt) {
    const lookTarget = target.facing * 32;
    this.look += (lookTarget - this.look) * Math.min(1, dt * 2.5);
    this.tx = this._clampX(target.x + this.look - this.w / 2, levelW);
    this.ty = this._clampY(target.y - this.h / 2 - 16, levelH);
    const k = Math.min(1, dt * 8);
    this.x += (this.tx - this.x) * k;
    this.y += (this.ty - this.y) * Math.min(1, dt * 6);
    if (this.shakeT > 0) {
      this.shakeT -= dt;
      const m = this.shakeMag * (this.shakeT > 0 ? this.shakeT : 0);
      this.sx = (Math.random() * 2 - 1) * m;
      this.sy = (Math.random() * 2 - 1) * m;
    } else { this.sx = 0; this.sy = 0; }
  }
  shake(mag, dur) {
    this.shakeMag = Math.max(this.shakeMag, mag / Math.max(dur, 0.01));
    this.shakeT = Math.max(this.shakeT, dur);
  }
  _clampX(x, levelW) { return Math.max(0, Math.min(x, Math.max(0, levelW - this.w))); }
  _clampY(y, levelH) { return Math.max(0, Math.min(y, Math.max(0, levelH - this.h))); }
  get ox() { return Math.round(this.x + this.sx); }
  get oy() { return Math.round(this.y + this.sy); }
}
