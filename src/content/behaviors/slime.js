// AETHERFALL behavior — slime
// Gel hopper with a magenta reactor core. Sits, crouches, springs toward the
// player on a 1.0–1.4s cadence, and lands with a synced squash + splat dust.
// When the player gets close it does a telegraphed pounce (attack anim windup,
// then a harder, flatter leap).
//
// Squash sync trick: the art's 'move' anim is a 6-frame hop cycle
// (0 rest, 1 crouch, 2 launch, 3 apex, 4 fall, 5 land-splat) at 10fps.
// The engine advances e.animT and only resets it when e.anim changes, so we
// pin e.animT to the exact frame that matches the physics phase every tick:
// grounded = rest, windup = crouch, rising = launch-stretch, hang = apex,
// dropping = fall, touchdown = land-splat. The sprite can never drift out of
// sync with the hop.
//
// States (e.mem.state): sit -> crouch -> air -> land -> sit
//                       sit -> windup (pounce telegraph) -> air -> land -> sit

// 'move' anim frame centers (10 fps -> 0.1s per frame)
const F_REST = 0.05, F_CROUCH = 0.15, F_LAUNCH = 0.25;
const F_APEX = 0.35, F_FALL = 0.45, F_SPLAT = 0.55;

const CROUCH_T = 0.16;        // s of grounded anticipation squat
const LAND_T = 0.14;          // s of landing squash (regular hop)
const LAND_POUNCE_T = 0.22;   // s of landing squash after a pounce
const SIT_MIN = 0.34;         // sit + crouch + air + land ~= 1.0–1.4s full cycle
const SIT_MAX = 0.72;
const HOP_VY = -245;          // regular hop: ~22px high, ~0.36s airtime
const HOP_VX = 84;
const POUNCE_VY = -300;       // pounce: higher, faster, meaner
const POUNCE_VX = 150;
const POUNCE_RANGE_X = 96;    // player close + near my level -> pounce
const POUNCE_RANGE_Y = 36;
const POUNCE_COOLDOWN = 2.6;
const AGGRO_X = 190;          // beyond this the slime just patrols
const WINDUP_T = 0.34;        // one loop of the 4-frame @12fps attack jiggle

const GEL = '#7df1ff';        // slime gel cyan (particle tint)
const GEL2 = '#8cf5c0';       // energy-band green

function splat(e, world, big) {
  // ring of dust squeezed out from under the body + a couple of glowing drips
  world.spawnParticles('dust', e.x - e.w / 2 + 1, e.y - 1, big ? 4 : 3, {
    speed: big ? 55 : 38, life: 0.38, up: 14, spread: 0.9, angle: Math.PI,
    color: GEL, gravity: 300,
  });
  world.spawnParticles('dust', e.x + e.w / 2 - 1, e.y - 1, big ? 4 : 3, {
    speed: big ? 55 : 38, life: 0.38, up: 14, spread: 0.9, angle: 0,
    color: GEL, gravity: 300,
  });
  world.spawnParticles('orb', e.x, e.y - 3, big ? 3 : 2, {
    speed: 30, life: 0.32, up: 40, color: GEL2, gravity: 340,
  });
}

export const behavior = {
  sprite: 'enemy_slime',
  hp: 3,
  damage: 1,
  w: 14,
  h: 11,
  gravity: true,
  collides: true,
  contactDamage: true,
  shardDrop: 1,
  isBoss: false,

  init(e, world) {
    e.mem.state = 'sit';
    e.mem.t = 0;                                        // time in current state
    e.mem.dir = e.facing || (world.rng() < 0.5 ? -1 : 1);
    e.mem.sitT = SIT_MIN + world.rng() * (SIT_MAX - SIT_MIN);
    e.mem.pounceCool = 1.2;                             // grace before first pounce
    e.mem.pounce = false;
    e.mem.airT = 0;
    e.anim = 'move';
    e.animT = F_REST;
  },

  update(e, world, dt) {
    const m = e.mem;
    m.t += dt;
    m.pounceCool = Math.max(0, m.pounceCool - dt);
    const p = world.player;
    const dx = p.x - e.x;
    const dy = p.y - e.y;

    switch (m.state) {
      case 'sit': {
        e.vx = 0;
        e.anim = 'move';
        e.animT = F_REST;                               // hold the rest blob
        e.facing = m.dir;

        // knocked off a ledge / spawned in air — fall gracefully
        if (!e.onGround) { m.state = 'air'; m.t = 0; m.airT = 0; m.pounce = false; break; }

        // player close and near my level -> telegraphed pounce
        if (!p.dead && m.pounceCool <= 0 &&
            Math.abs(dx) < POUNCE_RANGE_X && Math.abs(dy) < POUNCE_RANGE_Y) {
          m.state = 'windup';
          m.t = 0;
          m.dir = Math.sign(dx) || m.dir;
          e.facing = m.dir;
          e.anim = 'attack';                            // engine resets animT
          world.playSfx('telegraph');
          world.spawnParticles('spark', e.x, e.y - e.h, 3, {
            speed: 26, life: 0.3, up: 20, spread: 1.3, color: GEL2, gravity: 60,
          });
          break;
        }

        if (m.t >= m.sitT) {
          // choose hop direction: chase if the player is anywhere near, else patrol
          if (!p.dead && Math.abs(dx) < AGGRO_X) {
            m.dir = Math.sign(dx) || m.dir;
          } else {
            // patrolling: don't hop into pits or faces of walls
            e.facing = m.dir;
            if (!world.groundAhead(e, e.w / 2 + 10)) m.dir = -m.dir;
          }
          m.state = 'crouch';
          m.t = 0;
        }
        break;
      }

      case 'crouch': {
        e.vx = 0;
        e.anim = 'move';
        e.animT = F_CROUCH;                             // hold anticipation squat
        e.facing = m.dir;
        if (m.t >= CROUCH_T) {
          e.vy = HOP_VY * (0.92 + world.rng() * 0.16);
          e.vx = m.dir * HOP_VX * (0.85 + world.rng() * 0.3);
          m.state = 'air';
          m.t = 0;
          m.airT = 0;
          m.pounce = false;
          world.playSfx('jump');
          world.spawnParticles('dust', e.x, e.y - 1, 3, {
            speed: 24, life: 0.3, up: 8, spread: 1.1, color: GEL, gravity: 240,
          });
        }
        break;
      }

      case 'windup': {
        // attack-anim jiggle: core flashes, body shivers — unmissable "incoming"
        e.anim = 'attack';
        e.facing = m.dir;
        e.vx = Math.sin(m.t * 44) * 6;                  // nervous wobble in place
        if (m.t >= WINDUP_T) {
          e.anim = 'move';                              // engine resets animT
          e.vy = POUNCE_VY;
          e.vx = m.dir * POUNCE_VX;
          m.state = 'air';
          m.t = 0;
          m.airT = 0;
          m.pounce = true;
          m.pounceCool = POUNCE_COOLDOWN;
          world.playSfx('attack');
          world.spawnParticles('dust', e.x - m.dir * 4, e.y - 1, 5, {
            speed: 40, life: 0.35, up: 10, spread: 1.0,
            angle: m.dir > 0 ? Math.PI : 0, color: GEL, gravity: 240,
          });
        }
        break;
      }

      case 'air': {
        m.airT += dt;
        e.anim = 'move';
        e.facing = m.dir;
        // pin the frame to the physics: stretch up, hang, drop
        if (e.vy < -70) e.animT = F_LAUNCH;
        else if (e.vy <= 70) e.animT = F_APEX;
        else e.animT = F_FALL;

        // touchdown — squash, splat dust, tiny thump
        if (e.onGround && m.airT > 0.06) {
          e.vx = 0;
          m.state = 'land';
          m.t = 0;
          e.animT = F_SPLAT;
          world.playSfx('land');
          splat(e, world, m.pounce);
          if (m.pounce) world.shake(1.5, 0.08);
        }
        break;
      }

      case 'land': {
        e.vx = 0;
        e.anim = 'move';
        e.animT = F_SPLAT;                              // hold the squash pancake
        e.facing = m.dir;
        if (m.t >= (m.pounce ? LAND_POUNCE_T : LAND_T)) {
          m.state = 'sit';
          m.t = 0;
          m.pounce = false;
          m.sitT = SIT_MIN + world.rng() * (SIT_MAX - SIT_MIN);
        }
        break;
      }

      default: {
        m.state = 'sit';
        m.t = 0;
        m.sitT = SIT_MIN;
      }
    }
  },
};
