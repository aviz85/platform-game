// AETHERFALL — behavior: FLOATER (sprite: enemy_floater)
//
// A luminous jelly-drifter of the archipelago — a living lantern that slipped
// loose from the Lumen Woods canopy. It ghosts straight through terrain
// (collides:false), riding slow currents in a lazy wander. When the player
// drifts near, it doesn't chase — it *leans*: a gentle homing pull capped at
// 40 px/s, easy to outpace but unnerving to ignore. Its bell pulses on a slow
// rhythm; every contraction sheds a ring of glowing orb-motes.
//
// The sting is FAIR and readable: it never flares on contact. First it GATHERS
// — a soft telegraph where the bell stills, draws its motes inward and hums
// ('telegraph' sfx) for ~0.3s — THEN it flares bright (anim 'attack' + 'attack'
// sfx + orb burst) for half a second. A player who reads the gather has ample
// time to slip away. A blade strike (e.hitT) recoils it, spits sparks and pops
// its wind-up, rewarding well-timed hits and keeping it fully attackable.
//
// Movement = smoothed steering (jelly inertia) + perpetual vertical sine bob,
// with decaying knockback layered on. States are soft: wander <-> home blend by
// distance, plus a gentle leash back toward spawn so it never drifts off-level.
//
// Anims used (must exist in art/enemy_floater.js): 'move', 'attack'

const HOME_SPEED   = 40;    // px/s hard cap on homing pull (spec: <=40)
const WANDER_SPEED = 16;    // px/s lazy current-drift when player is far
const AGGRO_DIST   = 150;   // px — inside this it begins leaning toward the player
const FLARE_DIST   = 34;    // px — inside this it gathers, then flares
const LEASH_DIST   = 190;   // px from spawn before the home-current takes over
const STEER_EASE   = 1.6;   // 1/s — velocity easing gain (low = dreamy inertia)
const BOB_AMP      = 26;    // px/s peak vertical sine velocity (≈4px positional sway)
const BOB_FREQ     = 1.35;  // rad/s vertical sine frequency
const PULSE_PERIOD = 0.75;  // s — bell contraction rhythm (matches 6f @ 8fps move anim)
const WIND_TIME    = 0.32;  // s telegraph gather before the sting (readable wind-up)
const FLARE_TIME   = 0.5;   // s the sting-flare display holds once triggered
const FLARE_CD     = 1.6;   // s cooldown after a flare — never spammy
const KB_SPEED     = 96;    // px/s recoil impulse when the blade lands
const KB_DECAY     = 7.5;   // 1/s exponential decay of that recoil
const GATHER_DAMP  = 0.35;  // motion is stilled to this fraction while winding/flaring

const fin = (v, d = 0) => (Number.isFinite(v) ? v : d); // NaN/Inf guard

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
    e.mem.sting   = 'calm';                  // 'calm' | 'wind' | 'flare'
    e.mem.stingT  = 0;                        // time in current sting phase
    e.mem.flareCd = 0.6;                     // brief grace so it can't flare on spawn
    e.mem.dvx = 0;                           // desired velocity (pre-easing)
    e.mem.dvy = 0;
    e.mem.kbx = 0; e.mem.kby = 0;            // decaying blade-recoil velocity
    e.mem.prevHit = 0;                       // last frame's e.hitT — detect a fresh strike
    e.anim = 'move';
  },

  update(e, world, dt) {
    const m = e.mem;
    dt = fin(dt);
    m.stingT += dt;
    if (m.flareCd > 0) m.flareCd -= dt;

    const p = world.player;
    const dist = fin(world.distToPlayer(e), 9999);

    // ---------------- HIT REACTION (personality via e.hitT) ----------------
    // The engine stamps e.hitT the instant the player's blade lands, then ticks
    // it down. A rising edge = a fresh strike: recoil softly away, shed a spray
    // of glow-sparks, and pop any wind-up so a well-timed blade is rewarded and
    // the jelly stays fair to fight.
    const hitNow = (e.hitT || 0) > (m.prevHit || 0) + 1e-4;
    m.prevHit = e.hitT || 0;
    if (hitNow) {
      const away = -(world.dirToPlayer(e) || (e.facing < 0 ? 1 : -1));
      m.kbx = away * KB_SPEED;
      m.kby = -KB_SPEED * 0.4;               // a little lift — it's buoyant
      world.spawnParticles('spark', e.x, e.y - e.h / 2, 6, { speed: 48, life: 0.3 });
      world.spawnParticles('orb', e.x, e.y - e.h / 2, 3, { speed: 26, life: 0.4 });
      if (m.sting !== 'calm') {               // knocked out of its sting
        m.sting = 'calm';
        m.stingT = 0;
        m.flareCd = FLARE_CD * 0.6;
      }
    }

    // ---------------- steering: pick a desired drift velocity ----------------
    const homing = !p.dead && dist < AGGRO_DIST;

    if (homing) {
      // gentle homing — lean toward the player's center, harder when closer
      const dx = fin(p.x - e.x), dy = fin((p.y - p.h / 2) - (e.y - e.h / 2));
      const d = Math.hypot(dx, dy) || 1;
      const urgency = 0.45 + 0.55 * (1 - Math.min(dist / AGGRO_DIST, 1)); // 0.45..1
      const s = HOME_SPEED * urgency;
      m.dvx = (dx / d) * s;
      m.dvy = (dy / d) * s;
    } else {
      // lazy wander on two slow offset sines — an organic figure-drift
      const t = fin(e.t) * m.wRate;
      m.dvx = Math.sin(t + m.wPhaseX) * WANDER_SPEED;
      m.dvy = Math.cos(t * 0.8 + m.wPhaseY) * WANDER_SPEED * 0.55;

      // soft leash: far from home, the current carries it back
      const hx = fin(e.spawnX - e.x), hy = fin(e.spawnY - e.y);
      const hd = Math.hypot(hx, hy);
      if (hd > LEASH_DIST) {
        m.dvx += (hx / hd) * WANDER_SPEED * 1.4;
        m.dvy += (hy / hd) * WANDER_SPEED * 1.4;
      }
    }

    // while gathering or flaring the bell stills — it hangs, menacing, giving
    // the player a clean window to read the tell and drift clear.
    if (m.sting !== 'calm') { m.dvx *= GATHER_DAMP; m.dvy *= GATHER_DAMP; }

    // jelly inertia: ease actual velocity toward desired (never snaps)
    const k = Math.min(STEER_EASE * dt, 1);
    e.vx = fin(e.vx) + (m.dvx - fin(e.vx)) * k;
    e.vy = fin(e.vy) + (m.dvy - fin(e.vy)) * k;

    // perpetual vertical sine sway layered on top (velocity-form, so the
    // engine's own integration produces a clean positional sine)
    e.vy += Math.cos(fin(e.t) * BOB_FREQ + m.phase) * BOB_AMP;

    // decaying blade-recoil, layered on and eased out
    e.vx += m.kbx;
    e.vy += m.kby;
    const kd = Math.exp(-KB_DECAY * dt);
    m.kbx *= kd; m.kby *= kd;
    if (Math.abs(m.kbx) < 0.5) m.kbx = 0;
    if (Math.abs(m.kby) < 0.5) m.kby = 0;

    // safety cap — total speed can never exceed homing cap + bob + a little recoil
    const sp = Math.hypot(e.vx, e.vy);
    const cap = HOME_SPEED + BOB_AMP + KB_SPEED;
    if (sp > cap) { e.vx = (e.vx / sp) * cap; e.vy = (e.vy / sp) * cap; }

    if (Math.abs(e.vx) > 2) e.facing = e.vx < 0 ? -1 : 1;

    // ---------------- STING: telegraph gather -> bright flare ----------------
    switch (m.sting) {
      case 'calm': {
        e.anim = 'move';
        // enter the wind-up only when the player lingers in sting range
        if (!p.dead && dist < FLARE_DIST && m.flareCd <= 0) {
          m.sting = 'wind';
          m.stingT = 0;
          world.playSfx('telegraph');
          // TELEGRAPH: draw a soft inward-leaning shimmer around the bell
          world.spawnParticles('orb', e.x, e.y - e.h / 2, 4, { speed: 16, life: WIND_TIME + 0.1, up: true });
        }
        break;
      }
      case 'wind': {
        e.anim = 'move';
        // an intensifying gather — sparks tighten around the bell as it charges
        if (Math.floor(m.stingT / 0.1) !== Math.floor((m.stingT - dt) / 0.1)) {
          world.spawnParticles('spark', e.x, e.y - e.h / 2, 2, { speed: 20, life: 0.22 });
        }
        if (m.stingT >= WIND_TIME) {
          m.sting = 'flare';
          m.stingT = 0;
          world.playSfx('attack');
          // FLARE: the jellyfish sting-display — a bright ring of orbs + sparks
          world.spawnParticles('orb', e.x, e.y - e.h / 2, 8, { speed: 40, life: 0.5 });
          world.spawnParticles('spark', e.x, e.y - e.h / 2, 4, { speed: 52, life: 0.32 });
        }
        break;
      }
      case 'flare': {
        e.anim = 'attack';
        if (m.stingT >= FLARE_TIME) {
          m.sting = 'calm';
          m.stingT = 0;
          m.flareCd = FLARE_CD;
        }
        break;
      }
    }

    // ---------------- pulsing glow motes, synced to the bell rhythm ----------------
    m.pulseT -= dt;
    if (m.pulseT <= 0) {
      m.pulseT += PULSE_PERIOD;
      // each contraction sheds a soft ring of orbs that sink and fade — brighter
      // while the sting is lit, sparse and dreamy while calm (idle personality)
      const n = m.sting === 'flare' ? 4 : m.sting === 'wind' ? 3 : 2;
      world.spawnParticles('orb', e.x, e.y - e.h * 0.45, n,
        { speed: 12 + world.rng() * 8, life: 0.7, up: false });
      // trailing tendril-glint behind the direction of drift
      world.spawnParticles('spark', e.x - Math.sign(e.vx || 1) * 3, e.y - 2, 1,
        { speed: 6, life: 0.5 });
    }

    // ---------------- final NaN/Inf safety net ----------------
    if (!Number.isFinite(e.vx)) e.vx = 0;
    if (!Number.isFinite(e.vy)) e.vy = 0;
  },
};
