// AETHERFALL behavior — crawler
// Grounded crystal-beetle patroller. Walks ledges, turning at edges and walls.
// When the player is close and roughly on its level, it plants itself, shivers
// through a readable telegraph, then bursts into a short skittering charge.
// States (e.mem.state): patrol -> (pause) -> telegraph -> charge -> recover -> patrol
// Anims used: 'move' (patrol/charge legs), 'attack' (telegraph + charge).

const WALK_SPEED = 26;        // px/s patrol crawl
const CHARGE_SPEED = 158;     // px/s burst
const TELEGRAPH_T = 0.45;     // s of readable windup (shiver in place)
const CHARGE_T = 0.55;        // s of burst
const RECOVER_T = 0.40;       // s of catching breath after a charge
const CHARGE_COOLDOWN = 2.2;  // s before it may charge again
const AGGRO_X = 96;           // horizontal detection range
const AGGRO_Y = 16;           // "level with me" vertical tolerance (feet-to-feet)
const PAUSE_MIN = 2.6;        // patrol pause cadence (adds life)
const PAUSE_MAX = 5.0;
const PAUSE_T = 0.55;

// Is there a wall right in front of the shell? Probe two heights so 1-tile
// lips and full walls both register.
function wallAhead(e, world, dir) {
  const px = e.x + dir * (e.w / 2 + 3);
  return world.solidAt(px, e.y - 3) || world.solidAt(px, e.y - e.h + 3);
}

function dustPuff(e, world, n, dir) {
  world.spawnParticles('dust', e.x - dir * (e.w / 2 - 2), e.y - 1, n, {
    speed: 22, life: 0.4, up: true, spread: 0.9,
  });
}

export const behavior = {
  sprite: 'enemy_crawler',
  hp: 3,
  damage: 1,
  w: 20,
  h: 13,
  gravity: true,
  collides: true,
  contactDamage: true,
  shardDrop: 1,
  isBoss: false,

  init(e, world) {
    e.mem.state = 'patrol';
    e.mem.dir = e.facing || -1;
    e.mem.t = 0;                                   // time in current state
    e.mem.cool = 0.8;                              // grace before first charge
    e.mem.nextPause = PAUSE_MIN + world.rng() * (PAUSE_MAX - PAUSE_MIN);
    e.mem.sinceTurn = 0;                           // debounce so it can't spin
    e.anim = 'move';
  },

  update(e, world, dt) {
    const m = e.mem;
    m.t += dt;
    m.cool = Math.max(0, m.cool - dt);
    m.sinceTurn += dt;
    const p = world.player;

    // Airborne (knockback, spawned mid-air, walked off a crumbling edge):
    // hold course, let gravity do its thing, don't steer.
    if (!e.onGround) {
      e.anim = 'move';
      e.facing = m.dir;
      return;
    }

    switch (m.state) {
      case 'patrol': {
        // Edge / wall turn — the classic. Face the walk direction first so
        // groundAhead probes the right side.
        e.facing = m.dir;
        const edge = !world.groundAhead(e, e.w / 2 + 4);
        const wall = wallAhead(e, world, m.dir);
        if ((edge || wall) && m.sinceTurn > 0.25) {
          m.dir = -m.dir;
          m.sinceTurn = 0;
          e.vx = 0;
          dustPuff(e, world, 2, m.dir);
        }
        e.vx = m.dir * WALK_SPEED;
        e.facing = m.dir;
        e.anim = 'move';

        // Little antenna-twitch pause every few seconds — reads as alive.
        if (m.t >= m.nextPause) {
          m.state = 'pause';
          m.t = 0;
          e.vx = 0;
        }

        // Spot the player: near, on my level, not on cooldown, and the run-up
        // isn't straight off a cliff.
        if (m.cool <= 0 && !p.dead) {
          const dx = p.x - e.x;
          const dy = p.y - e.y;
          if (Math.abs(dx) < AGGRO_X && Math.abs(dy) < AGGRO_Y) {
            const cdir = Math.sign(dx) || m.dir;
            e.facing = cdir;
            if (world.groundAhead(e, e.w / 2 + 6) && !wallAhead(e, world, cdir)) {
              m.state = 'telegraph';
              m.t = 0;
              m.dir = cdir;
              e.vx = 0;
              world.playSfx('telegraph');
              world.spawnParticles('spark', e.x, e.y - e.h + 2, 4, {
                speed: 30, life: 0.35, up: true, spread: 1.2,
              });
            } else {
              e.facing = m.dir; // no safe run-up; keep patrolling
            }
          }
        }
        break;
      }

      case 'pause': {
        e.vx = 0;
        e.anim = 'move';
        e.facing = m.dir;
        if (m.t >= PAUSE_T) {
          m.state = 'patrol';
          m.t = 0;
          m.nextPause = PAUSE_MIN + world.rng() * (PAUSE_MAX - PAUSE_MIN);
        }
        break;
      }

      case 'telegraph': {
        // Plant, hiss, shiver backward — unmissable "it's about to lunge".
        e.anim = 'attack';
        e.facing = m.dir;
        const k = m.t / TELEGRAPH_T;
        e.vx = -m.dir * 10 * (1 - k) + Math.sin(m.t * 46) * 7; // recoil + shiver
        if (m.t >= TELEGRAPH_T) {
          m.state = 'charge';
          m.t = 0;
          world.playSfx('attack');
          dustPuff(e, world, 5, m.dir);
        }
        break;
      }

      case 'charge': {
        e.anim = 'attack';
        e.facing = m.dir;
        e.vx = m.dir * CHARGE_SPEED;
        // Skitter dust kicked up behind it.
        if (Math.floor(m.t * 20) !== Math.floor((m.t - dt) * 20)) {
          dustPuff(e, world, 1, m.dir);
        }
        // Abort at a ledge or wall — it's mean, not suicidal.
        const stop =
          m.t >= CHARGE_T ||
          !world.groundAhead(e, e.w / 2 + 5) ||
          wallAhead(e, world, m.dir);
        if (stop) {
          if (wallAhead(e, world, m.dir)) {
            world.spawnParticles('spark', e.x + m.dir * (e.w / 2), e.y - e.h / 2, 3, {
              speed: 40, life: 0.3, spread: 1.4,
            });
          }
          m.state = 'recover';
          m.t = 0;
          e.vx = 0;
        }
        break;
      }

      case 'recover': {
        // Slide to a stop, breathe, then resume the patrol loop.
        e.vx *= Math.max(0, 1 - dt * 12);
        e.anim = 'move';
        e.facing = m.dir;
        if (m.t >= RECOVER_T) {
          m.state = 'patrol';
          m.t = 0;
          m.cool = CHARGE_COOLDOWN;
          m.nextPause = PAUSE_MIN + world.rng() * (PAUSE_MAX - PAUSE_MIN);
        }
        break;
      }

      default: {
        m.state = 'patrol';
        m.t = 0;
      }
    }
  },
};
