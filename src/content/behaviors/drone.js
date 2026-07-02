// AETHERFALL — behavior: DRONE (sprite: enemy_drone)
//
// A hovering crystal-punk patrol unit. It drifts back and forth on a sine bob
// at its spawn altitude. When the player strays within ~90px it locks on:
// a readable 0.55s telegraph (rears up, shudders, sparks) — then a committed
// swoop dive at the player's locked position. The dive is dodgeable because
// the target is captured at launch (no mid-air homing). Afterwards it climbs
// smoothly back to patrol height and cools down before it can strike again.
//
// States: patrol -> telegraph -> dive -> recover -> patrol
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
    e.mem.tx = 0; e.mem.ty = 0;   // locked dive target
    e.mem.puffT = 0;              // thruster particle timer
    e.anim = 'move';
  },

  update(e, world, dt) {
    const m = e.mem;
    m.stateT += dt;
    if (m.cool > 0) m.cool -= dt;

    // -------- helper: spring vy toward a desired hover altitude --------
    const seekY = (targetY, maxV) => {
      let v = (targetY - e.y) * SEEK_GAIN;
      if (v > maxV) v = maxV; else if (v < -maxV) v = -maxV;
      e.vy = v;
    };

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
        e.facing = world.dirToPlayer(e);

        // anticipation: lift slightly while shuddering side to side
        e.vy = -26;
        e.vx = Math.sin(m.stateT * 55) * 14;

        // crackle of charge sparks through the wind-up
        if ((m.stateT * 60 | 0) % 8 === 0) {
          world.spawnParticles('spark', e.x, e.y - e.h / 2, 1,
            { speed: 26, life: 0.25 });
        }

        if (m.stateT >= TELEGRAPH_TIME) {
          // lock the dive vector at launch — committed, dodgeable
          const p = world.player;
          let dx = p.x - e.x, dy = (p.y - p.h / 2) - (e.y - e.h / 2);
          const d = Math.hypot(dx, dy) || 1;
          m.tx = (dx / d) * DIVE_SPEED;
          m.ty = (dy / d) * DIVE_SPEED;
          m.state = 'dive';
          m.stateT = 0;
          world.playSfx('attack');
          world.spawnParticles('spark', e.x, e.y, 6, { speed: 60, life: 0.3 });
        }
        break;
      }

      // ---------------- DIVE: committed swoop along the locked vector ----------------
      case 'dive': {
        e.anim = 'attack';
        e.vx = m.tx;
        e.vy = m.ty;
        e.facing = e.vx < 0 ? -1 : 1;

        // ion trail
        world.spawnParticles('spark', e.x - Math.sign(e.vx) * 4, e.y - e.h / 2, 1,
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
  },
};
