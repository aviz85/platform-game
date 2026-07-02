// WebAudio engine: parametric synth SFX + pattern-based chiptune music sequencer.
//
// SFX param object:
//   { wave:'square'|'sine'|'triangle'|'sawtooth'|'noise', from:Hz, to:Hz,
//     dur:sec, vol:0..1, curve:'exp'|'lin', attack?:sec, repeat?:n, gap?:sec }
//
// Music track object:
//   { bpm, bars, beatsPerBar:4, stepsPerBeat:4, loop:true,
//     channels: [ { wave, volume, decay?:0..1(portion of note len), pan?:-1..1,
//                   notes: [ [bar, step, midi, lenSteps] ... ] } ] }
const midiHz = (m) => 440 * Math.pow(2, (m - 69) / 12);

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.sfxMap = {};
    this.musicMap = {};
    this.currentMusic = null;
    this.seq = null;
    this.muted = false;
  }
  // must be called from a user gesture
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.8;
    this.master.connect(this.ctx.destination);
    this.sfxBus = this.ctx.createGain();
    this.sfxBus.gain.value = 0.85;
    this.sfxBus.connect(this.master);
    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.value = 0.55;
    this.musicBus.connect(this.master);
    // gentle space-echo on the music bus
    this.delay = this.ctx.createDelay(1);
    this.delay.delayTime.value = 0.27;
    this.delayFb = this.ctx.createGain(); this.delayFb.gain.value = 0.22;
    this.delaySend = this.ctx.createGain(); this.delaySend.gain.value = 0.16;
    this.musicBus.connect(this.delaySend);
    this.delaySend.connect(this.delay);
    this.delay.connect(this.delayFb); this.delayFb.connect(this.delay);
    this.delay.connect(this.master);
    // noise buffer (shared)
    const len = this.ctx.sampleRate * 1;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this._seqTimer = setInterval(() => this._pump(), 25);
    if (this._pendingMusic) { const m = this._pendingMusic; this._pendingMusic = null; this.playMusic(m); }
  }
  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.8;
    return this.muted;
  }

  // ---------- SFX ----------
  playSfx(name) {
    if (!this.ctx || this.muted) return;
    const p = this.sfxMap[name];
    if (!p) return;
    const reps = p.repeat || 1;
    for (let i = 0; i < reps; i++) {
      this._voice(p, this.ctx.currentTime + i * ((p.dur || 0.15) + (p.gap || 0.02)));
    }
  }
  _voice(p, t0) {
    const ctx = this.ctx;
    const dur = p.dur || 0.15;
    const g = ctx.createGain();
    const atk = p.attack || 0.004;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(p.vol ?? 0.4, t0 + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    g.connect(this.sfxBus);
    let src;
    if (p.wave === 'noise') {
      src = ctx.createBufferSource();
      src.buffer = this.noiseBuf; src.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass'; f.Q.value = p.q ?? 1.2;
      f.frequency.setValueAtTime(p.from || 1000, t0);
      const rampFn = (p.curve === 'lin') ? 'linearRampToValueAtTime' : 'exponentialRampToValueAtTime';
      f.frequency[rampFn](Math.max(p.to || 200, 30), t0 + dur);
      src.connect(f); f.connect(g);
    } else {
      src = ctx.createOscillator();
      src.type = p.wave || 'square';
      src.frequency.setValueAtTime(Math.max(p.from || 440, 20), t0);
      const rampFn = (p.curve === 'lin') ? 'linearRampToValueAtTime' : 'exponentialRampToValueAtTime';
      src.frequency[rampFn](Math.max(p.to || p.from || 440, 20), t0 + dur);
      src.connect(g);
    }
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  }

  // ---------- MUSIC ----------
  playMusic(name) {
    if (this.currentMusic === name) return;
    this.currentMusic = name;
    if (!this.ctx) { this._pendingMusic = name; return; }
    const track = this.musicMap[name];
    this.seq = null;
    if (!track) return;
    const spb = (track.beatsPerBar || 4) * (track.stepsPerBeat || 4);
    const totalSteps = track.bars * spb;
    const stepDur = 60 / track.bpm / (track.stepsPerBeat || 4);
    // index notes by absolute step
    const byStep = new Map();
    for (let ci = 0; ci < track.channels.length; ci++) {
      const ch = track.channels[ci];
      for (const n of ch.notes || []) {
        const abs = n[0] * spb + n[1];
        if (abs < 0 || abs >= totalSteps) continue;
        if (!byStep.has(abs)) byStep.set(abs, []);
        byStep.get(abs).push({ ch, midi: n[2], len: n[3] || 1 });
      }
    }
    this.seq = { track, byStep, totalSteps, stepDur, step: 0, nextTime: this.ctx.currentTime + 0.1 };
  }
  stopMusic() { this.currentMusic = null; this.seq = null; }
  _pump() {
    if (!this.seq || !this.ctx || this.muted) return;
    const s = this.seq;
    const horizon = this.ctx.currentTime + 0.15;
    while (s.nextTime < horizon) {
      const notes = s.byStep.get(s.step);
      if (notes) for (const n of notes) this._note(n, s.nextTime, s.stepDur);
      s.step++;
      s.nextTime += s.stepDur;
      if (s.step >= s.totalSteps) {
        if (s.track.loop === false) { this.seq = null; break; }
        s.step = 0;
      }
    }
  }
  _note(n, t0, stepDur) {
    const ctx = this.ctx;
    const ch = n.ch;
    const len = Math.max(n.len * stepDur * (ch.decay ?? 0.9), 0.03);
    const g = ctx.createGain();
    const vol = ch.volume ?? 0.2;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.006);
    g.gain.setValueAtTime(vol, t0 + len * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + len);
    let out = g;
    if (ch.pan && ctx.createStereoPanner) {
      const p = ctx.createStereoPanner(); p.pan.value = ch.pan;
      g.connect(p); out = p;
    }
    out.connect(this.musicBus);
    let src;
    if (ch.wave === 'noise') {
      src = ctx.createBufferSource();
      src.buffer = this.noiseBuf; src.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = 'highpass'; f.frequency.value = 2000 + (n.midi - 60) * 100;
      src.connect(f); f.connect(g);
    } else {
      src = ctx.createOscillator();
      src.type = ch.wave || 'square';
      src.frequency.value = midiHz(n.midi);
      src.connect(g);
    }
    src.start(t0);
    src.stop(t0 + len + 0.05);
  }
}
