// AETHERFALL — behavior: DRONE (sprite: enemy_drone)
//
// A hovering crystal-punk patrol unit. It drifts back and forth on a sine bob
// at its spawn altitude. When the player strays within ~90px it locks on:
// a readable 0.55s telegraph — it GATHERS (dips + coils), then springs up with
// intensifying sparks and sfx — then an ease-in accelerating swoop dive at the
// player's locked position. The dive is dodgeable because the target is captured
// at launch (no mid-air homing); a jump or sidestep beats it. Afterwards it
// climbs smoothly back to patrol height and cools down before it can strike again.
//
// Personality: idle thruster shimmer, and a hit reaction driven by e.hitT —
// a blade strike recoils it with sparks, and a strike DURING the telegraph
// staggers it out of the charge (rewards well-timed attacks; keeps it fair).
// Every steering value is finite-guarded (fin) so a stray NaN can't escape.
//
// States: patrol -> telegraph -> dive -> recover -> patrol  (+ hit stagger)
// Anims used (must exist in art/enemy_drone.js): 'move', 'attack'

const PATROL_SPEED   = 32;    // px/s horizontal drift while patrolling
const PATROL_RANGE   = 56;    // px each side of spawnX
const BOB_AMP        = 5;     // px sine bob amplitude
const BOB_FREQ       = 2.4;   // rad/s bob frequency
const AGGRO_DIST     = 90;    // px — player inside this triggers the swoop
const TELEGRAPH_TIME = 0.55;  // s of readable wind-up before the dive
const DIVE_SPEED     = 235;   // px/s committed swoop speed
const DIVE_MAX_TIME  = 0.9;   // s hard cap on a dive
const RECOVER_SPEED  = 70;    // px/s climb back to patrol height
const COOLDOWN       = 1.8;   // s after recovering before it may dive again
const SEEK_GAIN      = 7;     // vertical spring gain toward desired hover y
const KB_X           = 96;    // px/s horizontal knockback impulse when struck
const KB_Y           = 46;    // px/s upward knockback impulse when struck
const KB_DECAY       = 11;    // recoil damping rate (higher = snappier settle)

// finite-or-fallback guard — every steering value is filtered through this so a
// stray NaN/Infinity from the world API can never poison e.vx / e.vy.
const fin = (v, d = 0) => (Number.isFinite(v) ? v : d);

export const behavior = {
  sprite: 'enemy_drone',
  hp: 2,
  damage: 1,
  w: 14,
  h: 12,
  gravity: false,
  collides: true,
  contactDamage: true,
  shardDrop: 1,
  isBoss: false,

  init(e, world) {
    e.mem.state = 'patrol';
    e.mem.baseY = e.y;            // patrol altitude (feet y)
    e.mem.dir = e.facing || -1;   // patrol direction
    e.mem.phase = world.rng() * Math.PI * 2; // desync bobbing between drones
    e.mem.cool = 0.6;             // brief grace period on spawn
    e.mem.stateT = 0;             // time in current state
    e.mem.tx = 0; e.mem.ty = 0;   // locked dive vector (full-speed components)
    e.mem.puffT = 0;              // thruster particle timer
    e.mem.kbx = 0; e.mem.kby = 0; // decaying recoil velocity from being struck
    e.mem.prevHit = 0;            // last frame's e.hitT — to detect a fresh hit
    e.anim = 'move';
  },

  update(e, world, dt) {
    const m = e.mem;
    m.stateT += dt;
    if (m.cool > 0) m.cool -= dt;

    // -------- helper: spring vy toward a desired hover altitude --------
    const seekY = (targetY, maxV) => {
      let v = fin(targetY - e.y) * SEEK_GAIN;
      if (v > maxV) v = maxV; else if (v < -maxV) v = -maxV;
      e.vy = v;
    };

    // ---------------- HIT REACTION (personality via e.hitT) ----------------
    // The engine stamps e.hitT = 0.25 the instant the player's blade lands, then
    // ticks it down. A rising edge = a fresh strike this frame: recoil away from
    // the player, spit sparks, and — if mid-telegraph — stagger the wind-up so a
    // well-timed blade is rewarded (and the enemy stays fair to fight).
    const hitNow = (e.hitT || 0) > (m.prevHit || 0) + 1e-4;
    m.prevHit = e.hitT || 0;
    if (hitNow) {
      const away = -(world.dirToPlayer(e) || (m.dir < 0 ? 1 : -1));
      m.kbx = away * KB_X;
      m.kby = -KB_Y;
      world.spawnParticles('spark', e.x, e.y - e.h / 2, 5, { speed: 44, life: 0.28 });
      if (m.state === 'telegraph') {           // staggered out of its charge
        m.state = 'recover';
        m.stateT = 0;
        world.spawnParticles('dust', e.x, e.y - e.h / 2, 3, { speed: 22, life: 0.3, up: true });
      }
    }

    switch (m.state) {

      // ---------------- PATROL: sine-bob drift between bounds ----------------
      case 'patrol': {
        e.anim = 'move';

        // turn at patrol bounds or when a wall is ahead
        const aheadX = e.x + m.dir * (e.w / 2 + 6);
        if (e.x > e.spawnX + PATROL_RANGE) m.dir = -1;
        else if (e.x < e.spawnX - PATROL_RANGE) m.dir = 1;
        else if (world.solidAt(aheadX, e.y - e.h / 2)) m.dir = -m.dir;

        e.vx = m.dir * PATROL_SPEED;
        e.facing = m.dir;

        // hover on a sine bob around baseY
        const bobY = m.baseY + Math.sin(e.t * BOB_FREQ + m.phase) * BOB_AMP;
        seekY(bobY, 60);

        // faint thruster shimmer beneath the hull
        m.puffT -= dt;
        if (m.puffT <= 0) {
          m.puffT = 0.34 + world.rng() * 0.25;
          world.spawnParticles('dust', e.x - m.dir * 3, e.y + 1, 1,
            { speed: 8, life: 0.35, up: false });
        }

        // player in range and dive off cooldown? lock on.
        if (m.cool <= 0 && !world.player.dead && world.distToPlayer(e) < AGGRO_DIST) {
          m.state = 'telegraph';
          m.stateT = 0;
          world.playSfx('telegraph');
          world.spawnParticles('spark', e.x, e.y - e.h / 2, 4,
            { speed: 30, life: 0.3 });
        }
        break;
      }

      // -------- TELEGRAPH: rear up, shudder, sparks — clearly "incoming" --------
      case 'telegraph': {
        e.anim = 'attack';
        e.facing = world.dirToPlayer(e) || e.facing || m.dir;

        // Anticipation arc: a brief downward GATHER (dip + coil), then a rising
        // wind-up that eases off as it peaks — reads as "loading a spring", not a
        // robotic lift. progress 0..1 across the whole telegraph.
        const prog = Math.min(1, m.stateT / TELEGRAPH_TIME);
        // gather: +18 down for first 28%, then rise to -30 (smoothed).
        const gather = prog < 0.28
          ? 18 * (prog / 0.28)                                   // sink & coil
          : -30 * Math.sin(((prog - 0.28) / 0.72) * (Math.PI / 2)); // ease-out rise
        e.vy = fin(gather);
        // shudder tightens as the strike nears (amplitude grows with prog)
        e.vx = Math.sin(m.stateT * 55) * (8 + prog * 12);

        // charge sparks crackle faster toward the release — a readable ramp
        const every = prog < 0.6 ? 8 : 4;
        if ((m.stateT * 60 | 0) % every === 0) {
          world.spawnParticles('spark', e.x, e.y - e.h / 2, 1,
            { speed: 24 + prog * 34, life: 0.25 });
        }

        if (m.stateT >= TELEGRAPH_TIME) {
          // lock the dive vector at launch — committed, no mid-air homing, so a
          // sidestep or a jump cleanly beats it. Guarded against a zero-length dx.
          const p = world.player;
          let dx = fin(p.x - e.x), dy = fin((p.y - p.h / 2) - (e.y - e.h / 2));
          const d = Math.hypot(dx, dy) || 1;
          m.tx = fin((dx / d) * DIVE_SPEED, DIVE_SPEED * m.dir);
          m.ty = fin((dy / d) * DIVE_SPEED);
          m.state = 'dive';
          m.stateT = 0;
          world.playSfx('attack');
          world.shake(1.4, 0.12);
          world.spawnParticles('spark', e.x, e.y, 7, { speed: 62, life: 0.3 });
        }
        break;
      }

      // ---------------- DIVE: committed swoop along the locked vector ----------------
      case 'dive': {
        e.anim = 'attack';
        // Ease-IN accelerating swoop: launches at ~55% speed and winds up to full
        // over ~0.12s, so the dive has weight instead of snapping to top speed.
        const ramp = Math.min(1, 0.55 + m.stateT * 3.75);
        e.vx = m.tx * ramp;
        e.vy = m.ty * ramp;
        e.facing = e.vx < 0 ? -1 : 1;

        // ion trail
        world.spawnParticles('spark', e.x - Math.sign(e.vx || 1) * 4, e.y - e.h / 2, 1,
          { speed: 12, life: 0.22 });

        // end the dive: about to hit terrain, or overshot its window
        const nx = e.x + e.vx * dt * 3;
        const ny = e.y + e.vy * dt * 3;
        const hitTerrain = world.solidAt(nx, ny) || world.solidAt(e.x, e.y + 5);
        if (hitTerrain || m.stateT >= DIVE_MAX_TIME) {
          m.state = 'recover';
          m.stateT = 0;
          if (hitTerrain) {
            world.spawnParticles('dust', e.x, e.y, 5, { speed: 40, life: 0.4, up: true });
            world.playSfx('land');
          }
        }
        break;
      }

      // ---------------- RECOVER: climb smoothly back to patrol height ----------------
      case 'recover': {
        e.anim = 'move';

        // drift back toward the patrol band while climbing
        const toHome = e.spawnX - e.x;
        e.vx = Math.max(-PATROL_SPEED, Math.min(PATROL_SPEED, toHome * 0.8));
        if (Math.abs(e.vx) > 4) e.facing = e.vx < 0 ? -1 : 1;

        // if the way up is blocked, adopt a new hover altitude here
        if (world.solidAt(e.x, e.y - e.h - 4) || m.stateT > 2.2) {
          m.baseY = e.y;
        }
        seekY(m.baseY, RECOVER_SPEED);

        if (Math.abs(e.y - m.baseY) < 3) {
          m.state = 'patrol';
          m.stateT = 0;
          m.cool = COOLDOWN;
          m.dir = e.facing || m.dir;
        }
        break;
      }

      default:
        m.state = 'patrol';
        m.stateT = 0;
    }

    // ---------------- recoil + final safety clamp ----------------
    // Layer the decaying knockback on top of whatever the active state steered,
    // so a strike jolts the drone regardless of what it was doing, then settles.
    if (m.kbx || m.kby) {
      e.vx = fin(e.vx) + m.kbx;
      e.vy = fin(e.vy) + m.kby;
      const damp = Math.max(0, 1 - dt * KB_DECAY);
      m.kbx *= damp;
      m.kby *= damp;
      if (Math.abs(m.kbx) < 1) m.kbx = 0;
      if (Math.abs(m.kby) < 1) m.kby = 0;
    }
    // never hand the engine a non-finite velocity, whatever happened above
    e.vx = fin(e.vx);
    e.vy = fin(e.vy);
  },
};
