// AETHERFALL — retro-futuristic SFX set (crystal-punk chip palette)
//
// Family design language:
//   MOVEMENT  (jump/dash/step)  — airy: square/noise with rising sweeps, soft attacks
//   IMPACTS   (land/hit/bossHit/enemyDeath) — crunchy: bandpass noise, falling sweeps
//   REWARDS   (pickup/heart)    — sparkly: bright trills via repeat+gap, rising sweeps
//   STATES    (hurt/death)      — falling tonal sweeps, longer decay for weight
//   WORLD/UI  (portal/menu/telegraph/shoot/bossRoar) — deep whoosh, soft blips, clear zaps
//
// Engine semantics (src/engine/audio.js):
//   one voice per sound: freq ramps from→to over dur (curve exp|lin),
//   gain: 0 → vol over `attack` sec, then exponential decay to end of dur.
//   noise wave = looped white noise through a bandpass swept from→to (Q = q).
//   repeat n + gap sec retriggers the identical voice — used for trills/arps.

export const SFX = {
  // ---------------- movement (airy) ----------------
  // Airy square hop: fast upward chirp, tiny attack keeps it breathy not clicky.
  jump:    { wave: 'square',   from: 290,  to: 720,  dur: 0.14, vol: 0.26, curve: 'exp', attack: 0.010 },

  // Dash: air rushing past — rising bandpass noise whoosh, wide-ish band.
  dash:    { wave: 'noise',    from: 480,  to: 2900, dur: 0.20, vol: 0.30, curve: 'exp', attack: 0.020, q: 1.8 },

  // Footstep (optional): the tiniest gravel tick, nearly subliminal.
  step:    { wave: 'noise',    from: 950,  to: 340,  dur: 0.045, vol: 0.10, curve: 'exp', q: 1.0 },

  // ---------------- impacts (crunchy) ----------------
  // Landing thud: noise dropping fast into the low band — soft crunch, no ring.
  land:    { wave: 'noise',    from: 750,  to: 110,  dur: 0.12, vol: 0.28, curve: 'exp', q: 0.8 },

  // Energy-blade slash: bright air-cutting swish, high band sweeping down.
  attack:  { wave: 'noise',    from: 4200, to: 900,  dur: 0.12, vol: 0.24, curve: 'exp', attack: 0.006, q: 1.6 },

  // Connected hit on an enemy: short crunchy smack, mid band collapsing.
  hit:     { wave: 'noise',    from: 1900, to: 240,  dur: 0.09, vol: 0.34, curve: 'exp', q: 0.9 },

  // Enemy death: longer crunch that bottoms out — a satisfying "burst + settle".
  enemyDeath: { wave: 'noise', from: 1400, to: 70,   dur: 0.32, vol: 0.36, curve: 'exp', q: 0.8 },

  // Boss taking damage: metallic clank — high-Q bandpass gives a tonal ring
  // inside the crunch, dropping hard so it reads heavier than 'hit'.
  bossHit: { wave: 'noise',    from: 1100, to: 130,  dur: 0.18, vol: 0.40, curve: 'exp', q: 2.6 },

  // ---------------- player states (falling sweeps) ----------------
  // Hurt: sour downward square bend — clearly "bad", but short enough to not nag.
  hurt:    { wave: 'square',   from: 420,  to: 105,  dur: 0.24, vol: 0.30, curve: 'exp', attack: 0.005 },

  // Death: long dramatic power-down fall, sawtooth for grit, slow fade.
  death:   { wave: 'sawtooth', from: 640,  to: 48,   dur: 0.85, vol: 0.32, curve: 'exp', attack: 0.010 },

  // ---------------- rewards (sparkly trills) ----------------
  // Shard pickup: triple sparkle — each blip chirps upward, repeat+gap makes
  // a glittering micro-arpeggio. High register = crystal.
  pickup:  { wave: 'square',   from: 1180, to: 1760, dur: 0.055, vol: 0.20, curve: 'exp', attack: 0.003, repeat: 3, gap: 0.030 },

  // Heart: warmer, rounder double-chime an octave below the shard — triangle
  // keeps it soft; two long swells read as "restored".
  heart:   { wave: 'triangle', from: 540,  to: 1080, dur: 0.22, vol: 0.30, curve: 'exp', attack: 0.015, repeat: 2, gap: 0.050 },

  // ---------------- world & UI ----------------
  // Portal: deep swelling whoosh — low noise band rising through the spectrum
  // with a long attack, like air being pulled into the gate.
  portal:  { wave: 'noise',    from: 85,   to: 1500, dur: 1.10, vol: 0.38, curve: 'exp', attack: 0.180, q: 1.1 },

  // Menu blip: one soft rounded triangle tick, gentle rise so it never pokes.
  menu:    { wave: 'triangle', from: 620,  to: 760,  dur: 0.06, vol: 0.17, curve: 'exp', attack: 0.004 },

  // Telegraph (enemy wind-up warning): two urgent rising beeps — readable
  // "incoming!" cue that sits above the music but below impact volume.
  telegraph: { wave: 'triangle', from: 520, to: 820, dur: 0.09, vol: 0.22, curve: 'exp', attack: 0.005, repeat: 2, gap: 0.060 },

  // Shoot (sentinel/projectile): classic zap — square dive-bombing down fast.
  shoot:   { wave: 'square',   from: 1350, to: 190,  dur: 0.11, vol: 0.26, curve: 'exp', attack: 0.003 },

  // Boss roar: sub-register sawtooth growl bending downward, slow attack for menace.
  bossRoar: { wave: 'sawtooth', from: 130, to: 42,   dur: 0.90, vol: 0.40, curve: 'exp', attack: 0.060 },
};
