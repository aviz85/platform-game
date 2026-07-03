// AETHERFALL behavior — slime
// Gel hopper with a magenta reactor core. Sits, crouches, springs toward the
// player on a 1.0–1.4s cadence, and lands with a synced squash + splat dust.
// When the player gets close it does a telegraphed pounce (attack anim windup,
// then a harder, flatter leap).
//
// Squash sync trick: the art's 'move' anim is a 7-frame hop cycle at 11fps
// (0 rest, 1 deep-crouch, 2 launch-stretch, 3 apex, 4 fall-stretch,
//  5 mega-splat, 6 rebound). The engine advances e.animT and only resets it
// when e.anim changes, so we pin e.animT to the exact frame that matches the
// physics phase every tick: grounded = rest, windup = crouch, rising =
// launch-stretch, hang = apex, dropping = fall, touchdown = mega-splat, then
// a spring-back rebound before it settles. The sprite can never drift out of
// sync with the hop.
//
// States (e.mem.state): sit -> crouch -> air -> land -> sit
//                       sit -> windup (pounce telegraph) -> air -> land -> sit
//                       (any) -> hurt (flinch on blade hit) -> sit / air

// 'move' anim frame centers for the real 7-frame @ 11fps sheet: (i+0.5)/11.
// Computed at frame CENTERS so a little float jitter can't tip into the wrong
// cell (idx = floor(animT * fps), so each pin has ~0.045s of slack each side).
const F_REST = 0.045, F_CROUCH = 0.136, F_LAUNCH = 0.227;
const F_APEX = 0.318, F_FALL = 0.409, F_SPLAT = 0.500, F_REBOUND = 0.591;

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
const HURT_T = 0.14;          // flinch: recoil squash while knockback carries
const IDLE_MIN = 0.5;         // gel-simmer glow mote cadence while sitting
const IDLE_MAX = 1.3;

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
    e.mem.hitPrev = 0;                                  // last-frame e.hitT (fresh-hit edge detect)
    e.mem.idleT = IDLE_MIN + world.rng() * (IDLE_MAX - IDLE_MIN);
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

    // --- hit reaction: the engine sets e.hitT=0.25 on a blade hit and adds
    // knockback to e.vx *after* update() runs. A rising e.hitT is the one-frame
    // edge that a fresh hit just landed. Flinch: DON'T zero vx (so the knockback
    // survives), squash the body, spit gel, and hold off pouncing for a beat.
    const freshHit = e.hitT > m.hitPrev + 1e-4;
    m.hitPrev = e.hitT > 0 ? e.hitT : 0;
    if (freshHit && m.state !== 'hurt') {
      m.state = 'hurt';
      m.t = 0;
      e.anim = 'move';
      e.facing = Math.sign(dx) || m.dir;                // turn to face the blow
      if (e.onGround) e.vy = -78;                        // little pop of juice
      m.pounceCool = Math.max(m.pounceCool, 0.6);
      world.spawnParticles('spark', e.x, e.y - e.h * 0.6, 5, {
        speed: 64, life: 0.3, up: 22, spread: 1.7, color: GEL, gravity: 130,
      });
    }

    switch (m.state) {
      case 'sit': {
        e.vx = 0;
        e.anim = 'move';
        e.animT = F_REST;                               // hold the rest blob
        e.facing = m.dir;

        // personality: the gel quietly simmers — a buoyant glow mote rises off
        // the dome now and then so a resting slime never looks frozen.
        m.idleT -= dt;
        if (m.idleT <= 0) {
          m.idleT = IDLE_MIN + world.rng() * (IDLE_MAX - IDLE_MIN);
          world.spawnParticles('orb', e.x + (world.rng() * 2 - 1) * 4, e.y - e.h * 0.75, 1, {
            speed: 5, life: 0.6, up: 14, color: world.rng() < 0.5 ? GEL : GEL2, gravity: -18,
          });
        }

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
        e.facing = m.dir;
        const landT = m.pounce ? LAND_POUNCE_T : LAND_T;
        // first ~65% of the squash reads as the pancake, then springs back up
        // through the rebound frame so the landing pops instead of snapping.
        e.animT = m.t < landT * 0.65 ? F_SPLAT : F_REBOUND;
        if (m.t >= landT) {
          m.state = 'sit';
          m.t = 0;
          m.pounce = false;
          m.sitT = SIT_MIN + world.rng() * (SIT_MAX - SIT_MIN);
        }
        break;
      }

      case 'hurt': {
        e.anim = 'move';
        e.animT = F_CROUCH;                             // compressed recoil blob
        e.facing = m.dir;
        // let the engine's knockback ride, bleeding it off with friction —
        // never hard-zero, or the hit would feel weightless.
        e.vx *= Math.max(0, 1 - dt * 8);
        if (!Number.isFinite(e.vx)) e.vx = 0;
        if (m.t >= HURT_T) {
          m.t = 0;
          if (e.onGround) {
            m.state = 'sit';
            m.sitT = SIT_MIN + world.rng() * (SIT_MAX - SIT_MIN);
          } else {
            m.state = 'air';
            m.airT = 0.1;
            m.pounce = false;
          }
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
