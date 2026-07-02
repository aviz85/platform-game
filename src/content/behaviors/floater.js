// AETHERFALL — behavior: FLOATER (sprite: enemy_floater)
//
// A luminous jelly-drifter of the archipelago — a living lantern that slipped
// loose from the Lumen Woods canopy. It ghosts straight through terrain
// (collides:false), riding slow currents in a lazy wander. When the player
// drifts near, it doesn't chase — it *leans*: a gentle homing pull capped at
// 40 px/s, easy to outpace but unnerving to ignore. Its bell pulses on a slow
// rhythm; every contraction sheds a ring of glowing orb-motes, and up close it
// flares bright (anim 'attack') like a jellyfish sting-display.
//
// Movement = smoothed steering (jelly inertia) + perpetual vertical sine bob.
// States are soft (no hard switch/case): wander <-> home <-> flare blend by
// distance, plus a gentle leash back toward spawn so it never drifts off-level.
//
// Anims used (must exist in art/enemy_floater.js): 'move', 'attack'

const HOME_SPEED   = 40;    // px/s hard cap on homing pull (spec: <=40)
const WANDER_SPEED = 16;    // px/s lazy current-drift when player is far
const AGGRO_DIST   = 150;   // px — inside this it begins leaning toward the player
const FLARE_DIST   = 34;    // px — inside this it flares (attack anim + bright motes)
const LEASH_DIST   = 190;   // px from spawn before the home-current takes over
const STEER_EASE   = 1.6;   // 1/s — velocity easing gain (low = dreamy inertia)
const BOB_AMP      = 26;    // px/s peak vertical sine velocity (≈4px positional sway)
const BOB_FREQ     = 1.35;  // rad/s vertical sine frequency
const PULSE_PERIOD = 0.75;  // s — bell contraction rhythm (matches 6f @ 8fps move anim)
const FLARE_TIME   = 0.5;   // s the sting-flare display holds once triggered

export const behavior = {
  sprite: 'enemy_floater',
  hp: 2,
  damage: 1,
  w: 14,
  h: 16,
  gravity: false,
  collides: false,          // ghost — drifts straight through tiles
  contactDamage: true,
  shardDrop: 1,
  isBoss: false,

  init(e, world) {
    const r = world.rng;
    e.mem.phase   = r() * Math.PI * 2;       // desync bob between floaters
    e.mem.wPhaseX = r() * Math.PI * 2;       // wander current phases
    e.mem.wPhaseY = r() * Math.PI * 2;
    e.mem.wRate   = 0.55 + r() * 0.35;       // personal wander tempo
    e.mem.pulseT  = r() * PULSE_PERIOD;      // stagger the glow pulses
    e.mem.flareT  = 0;                       // >0 while sting-flare is showing
    e.mem.flareCd = 0;                       // re-flare cooldown
    e.mem.dvx = 0;                           // desired velocity (pre-easing)
    e.mem.dvy = 0;
    e.anim = 'move';
  },

  update(e, world, dt) {
    const m = e.mem;
    const p = world.player;
    if (m.flareT > 0) m.flareT -= dt;
    if (m.flareCd > 0) m.flareCd -= dt;

    // ---------------- steering: pick a desired drift velocity ----------------
    const dist = world.distToPlayer(e);
    const homing = !p.dead && dist < AGGRO_DIST;

    if (homing) {
      // gentle homing — lean toward the player's center, harder when closer
      const dx = p.x - e.x, dy = (p.y - p.h / 2) - (e.y - e.h / 2);
      const d = Math.hypot(dx, dy) || 1;
      const urgency = 0.45 + 0.55 * (1 - Math.min(dist / AGGRO_DIST, 1)); // 0.45..1
      const s = HOME_SPEED * urgency;
      m.dvx = (dx / d) * s;
      m.dvy = (dy / d) * s;
    } else {
      // lazy wander on two slow offset sines — an organic figure-drift
      const t = e.t * m.wRate;
      m.dvx = Math.sin(t + m.wPhaseX) * WANDER_SPEED;
      m.dvy = Math.cos(t * 0.8 + m.wPhaseY) * WANDER_SPEED * 0.55;

      // soft leash: far from home, the current carries it back
      const hx = e.spawnX - e.x, hy = e.spawnY - e.y;
      const hd = Math.hypot(hx, hy);
      if (hd > LEASH_DIST) {
        m.dvx += (hx / hd) * WANDER_SPEED * 1.4;
        m.dvy += (hy / hd) * WANDER_SPEED * 1.4;
      }
    }

    // jelly inertia: ease actual velocity toward desired (never snaps)
    const k = Math.min(STEER_EASE * dt, 1);
    e.vx += (m.dvx - e.vx) * k;
    e.vy += (m.dvy - e.vy) * k;

    // perpetual vertical sine sway layered on top (velocity-form, so the
    // engine's own integration produces a clean positional sine)
    e.vy += Math.cos(e.t * BOB_FREQ + m.phase) * BOB_AMP;

    // safety cap — total speed can never exceed homing cap + bob sway
    const sp = Math.hypot(e.vx, e.vy);
    const cap = HOME_SPEED + BOB_AMP;
    if (sp > cap) { e.vx = (e.vx / sp) * cap; e.vy = (e.vy / sp) * cap; }

    if (Math.abs(e.vx) > 2) e.facing = e.vx < 0 ? -1 : 1;

    // ---------------- sting flare (close-range display) ----------------
    if (!p.dead && dist < FLARE_DIST && m.flareCd <= 0) {
      m.flareT = FLARE_TIME;
      m.flareCd = 1.4;
      world.spawnParticles('orb', e.x, e.y - e.h / 2, 6,
        { speed: 34, life: 0.45 });
      world.spawnParticles('spark', e.x, e.y - e.h / 2, 3,
        { speed: 46, life: 0.3 });
    }
    e.anim = m.flareT > 0 ? 'attack' : 'move';

    // ---------------- pulsing glow motes, synced to the bell rhythm ----------------
    m.pulseT -= dt;
    if (m.pulseT <= 0) {
      m.pulseT += PULSE_PERIOD;
      // each contraction sheds a soft ring of orbs that sink and fade
      const n = m.flareT > 0 ? 4 : 2;
      world.spawnParticles('orb', e.x, e.y - e.h * 0.45, n,
        { speed: 12 + world.rng() * 8, life: 0.7, up: false });
      // trailing tendril-glint behind the direction of drift
      world.spawnParticles('spark', e.x - Math.sign(e.vx || 1) * 3, e.y - 2, 1,
        { speed: 6, life: 0.5 });
    }
  },
};
