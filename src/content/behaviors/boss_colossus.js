// AETHERFALL — behavior: BOSS COLOSSUS (sprite: boss_colossus)
//
// The Aetherfall Colossus: a colossal violet-stone golem, its cracked chest
// core burning cyan. It guards the reactor arena at the bottom of the Neon
// Depths and NEVER leaves it — hard-clamped to spawnX ± 200px.
//
// Three hp phases (thresholds at 2/3 and 1/3 of maxHp):
//   PHASE 1 — STONE   : slow stomping march toward the player. Periodic big
//                       STOMP attack: raise (0.60s telegraph) -> slam ->
//                       shockwave particles + two ground-hugging shock bolts.
//   PHASE 2 — FRACTURE: everything above, plus the chest core charges up
//                       (0.70s telegraph, converging sparks) and detonates a
//                       RADIAL BURST — two staggered rings of glowing bolts.
//   PHASE 3 — MELTDOWN: enraged. Faster march, and the stomp is replaced by
//                       a GROUND-POUND LEAP (0.55s crouch telegraph -> arc
//                       jump at the player -> landing quake with world.shake
//                       + shockwave) followed by a rotating SPIRAL of bullets
//                       from the core.
//
// Every attack has a >=0.5s readable telegraph (pose + particles + sfx).
// Phase transitions are announced with a roar (sfx 'bossRoar' if present),
// screen shake and a spark nova. Taking a hit plays 'bossHit' (hp watched
// in update, since the engine owns damage).
//
// States: intro -> march <-> { stompTele -> stomp,
//                              burstTele -> burst,
//                              leapTele  -> leap -> quake -> spiral } -> march
//          (phaseRoar interleaves on threshold crossings)
// Anims used (must exist in art/boss_colossus.js): 'move', 'attack'.

// ---------------------------------------------------------------- tuning --
const ARENA_HALF     = 200;   // px each side of spawnX — NEVER exceeded
const EDGE_PAD       = 4;     // soft pad inside the hard clamp

const MARCH_SPEED_P1 = 26;    // px/s stomping march, phase 1
const MARCH_SPEED_P2 = 34;    // phase 2
const MARCH_SPEED_P3 = 52;    // phase 3 (enraged)
const STEP_PERIOD    = 0.72;  // s per stomp-step cycle (foot dust cadence)

const INTRO_T        = 1.10;  // s waking roar before the fight starts

const STOMP_TELE_T   = 0.60;  // s raise-leg telegraph        (>=0.5s)
const STOMP_SLAM_T   = 0.28;  // s of slam / impact freeze
const STOMP_RECOV_T  = 0.55;  // s recovery after the slam
const SHOCK_SPEED    = 150;   // px/s ground shock bolts
const SHOCK_TTL      = 1.30;  // s shock bolt lifetime

const BURST_TELE_T   = 0.70;  // s core charge-up telegraph   (>=0.5s)
const BURST_RING_N   = 10;    // bolts per ring
const BURST_RING_GAP = 0.28;  // s between the two staggered rings
const BURST_SPEED    = 115;   // px/s radial bolt speed
const BURST_RECOV_T  = 0.60;

const LEAP_TELE_T    = 0.55;  // s crouch telegraph           (>=0.5s)
const LEAP_VY        = -330;  // px/s launch (engine gravity brings it down)
const LEAP_VX_MAX    = 170;   // px/s horizontal cap on the leap
const LEAP_MIN_AIR   = 0.15;  // s before a landing may register
const LEAP_MAX_AIR   = 2.50;  // s failsafe — force-land if still airborne
const QUAKE_T        = 0.35;  // s landing impact freeze
const SPIRAL_T       = 1.30;  // s of spiral fire after the quake
const SPIRAL_RATE    = 0.075; // s between spiral shots
const SPIRAL_STEP    = 0.62;  // rad advance per shot (twin-armed spiral)
const SPIRAL_SPEED   = 122;   // px/s spiral bullet speed
const SPIRAL_RECOV_T = 0.55;

const ROAR_T         = 0.95;  // s phase-transition roar pause

const COOL_P1        = 2.20;  // s between attacks, per phase
const COOL_P2        = 1.70;
const COOL_P3        = 1.25;

const CORE_DY        = 30;    // px above feet — glowing chest core (shot origin)
const BOLT_CYAN      = '#6ef0ff';   // crystal-core bolts
const BOLT_MAGENTA   = '#ff5fd0';   // enraged spiral bolts
const SHOCK_AMBER    = '#ffc23d';   // ground shockwave bolts

// ---------------------------------------------------------------- helpers --
function phaseOf(e) {
  if (e.hp > (e.maxHp * 2) / 3) return 1;
  if (e.hp > e.maxHp / 3) return 2;
  return 3;
}

function marchSpeed(ph) {
  return ph === 3 ? MARCH_SPEED_P3 : ph === 2 ? MARCH_SPEED_P2 : MARCH_SPEED_P1;
}

function coolFor(ph) {
  return ph === 3 ? COOL_P3 : ph === 2 ? COOL_P2 : COOL_P1;
}

// Hard arena clamp — the Colossus never leaves spawnX ± ARENA_HALF.
function clampArena(e, m) {
  const lo = m.homeX - ARENA_HALF + e.w / 2;
  const hi = m.homeX + ARENA_HALF - e.w / 2;
  if (e.x < lo) { e.x = lo; if (e.vx < 0) e.vx = 0; }
  else if (e.x > hi) { e.x = hi; if (e.vx > 0) e.vx = 0; }
}

// Heavy footfall: dust burst at a foot + optional thud.
function footfall(e, world, dir, big) {
  world.spawnParticles('dust', e.x + dir * (e.w / 2 - 5), e.y - 1, big ? 6 : 3, {
    speed: big ? 42 : 24, life: big ? 0.5 : 0.35, up: true, spread: 1.1,
  });
  world.playSfx(big ? 'land' : 'step');
}

// Landing shockwave: dust wall both ways + sparks + 2 ground shock bolts.
function shockwave(e, world, strength) {
  world.spawnParticles('dust', e.x, e.y - 2, 10 + strength * 4, {
    speed: 55 + strength * 20, life: 0.55, up: true, spread: 1.4,
  });
  world.spawnParticles('spark', e.x, e.y - 6, 6 + strength * 2, {
    speed: 70, life: 0.4, up: true, spread: 1.5,
  });
  for (const dir of [-1, 1]) {
    world.spawnProjectile({
      x: e.x + dir * (e.w / 2 + 2), y: e.y - 4,
      vx: dir * SHOCK_SPEED, vy: 0,
      damage: 1, ttl: SHOCK_TTL, r: 5,
      color: SHOCK_AMBER, glow: true, gravity: false,
    });
  }
}

// One radial ring of bolts from the chest core.
function radialRing(e, world, n, angleOffset) {
  const cx = e.x, cy = e.y - CORE_DY;
  for (let i = 0; i < n; i++) {
    const a = angleOffset + (i / n) * Math.PI * 2;
    world.spawnProjectile({
      x: cx, y: cy,
      vx: Math.cos(a) * BURST_SPEED, vy: Math.sin(a) * BURST_SPEED,
      damage: 1, ttl: 2.4, r: 4,
      color: BOLT_CYAN, glow: true, gravity: false,
    });
  }
  world.spawnParticles('orb', cx, cy, 8, { speed: 50, life: 0.35, spread: 3.2 });
  world.playSfx('shoot');
}

// Twin-armed spiral shot (two bullets, opposite arms).
function spiralShot(e, world, angle) {
  const cx = e.x, cy = e.y - CORE_DY;
  for (const arm of [0, Math.PI]) {
    const a = angle + arm;
    world.spawnProjectile({
      x: cx, y: cy,
      vx: Math.cos(a) * SPIRAL_SPEED, vy: Math.sin(a) * SPIRAL_SPEED,
      damage: 1, ttl: 2.2, r: 4,
      color: BOLT_MAGENTA, glow: true, gravity: false,
    });
  }
}

// Roar dressing: shake + spark nova + core flare + sfx.
function roar(e, world, mag) {
  world.shake(mag, 0.45);
  world.playSfx('bossRoar');
  world.spawnParticles('spark', e.x, e.y - CORE_DY, 14, {
    speed: 90, life: 0.55, spread: 3.2,
  });
  world.spawnParticles('orb', e.x, e.y - CORE_DY, 8, {
    speed: 40, life: 0.6, up: true, spread: 2.0,
  });
}

// ---------------------------------------------------------------- behavior --
export const behavior = {
  sprite: 'boss_colossus',
  hp: 54,
  damage: 1,
  w: 40,
  h: 48,
  gravity: true,
  collides: true,
  contactDamage: true,
  shardDrop: 12,
  isBoss: true, // the arena gate & boss hp bar hook off this

  init(e, world) {
    const m = e.mem;
    m.state = 'intro';
    m.t = 0;                       // time in current state
    m.homeX = Number.isFinite(e.spawnX) ? e.spawnX : e.x;  // arena center
    m.phase = phaseOf(e);
    m.lastHp = e.hp;               // watched to react to hits (sfx bossHit)
    m.cool = 1.4;                  // grace after intro before first attack
    m.stepT = 0;                   // stomp-step cadence accumulator
    m.stompCount = 0;              // stomps since last core burst (phase 2 mix)
    m.spiralA = world.rng() * Math.PI * 2; // spiral start angle
    m.spiralShotT = 0;
    m.airT = 0;                    // time airborne during a leap
    m.ringsFired = 0;
    m.leapDir = 1;
    e.anim = 'move';
    e.facing = world.dirToPlayer(e);
  },

  update(e, world, dt) {
    const m = e.mem;
    m.t += dt;
    if (m.cool > 0) m.cool -= dt;
    const p = world.player;

    // ---- hit reaction: hp is engine-owned, watch it drop -------------------
    if (e.hp < m.lastHp) {
      world.playSfx('bossHit');
      world.spawnParticles('spark', e.x, e.y - CORE_DY, 5, {
        speed: 60, life: 0.3, spread: 3.2,
      });
      m.lastHp = e.hp;
    } else if (e.hp > m.lastHp) {
      m.lastHp = e.hp; // healed/reset — just resync
    }

    // ---- phase transition: interrupt anything except a mid-air leap -------
    const ph = phaseOf(e);
    if (ph !== m.phase && m.state !== 'leap') {
      m.phase = ph;
      m.state = 'phaseRoar';
      m.t = 0;
      e.vx = 0;
      roar(e, world, ph === 3 ? 5 : 4);
    }

    switch (m.state) {
      // ---- waking up: roar once, let the player read the fight ------------
      case 'intro': {
        e.vx = 0;
        e.anim = 'attack';
        e.facing = world.dirToPlayer(e);
        if (m.t < dt * 1.5) roar(e, world, 3); // fire dressing on first tick
        if (m.t >= INTRO_T) { m.state = 'march'; m.t = 0; e.anim = 'move'; }
        break;
      }

      // ---- phase-shift roar: planted, glowing, untouchable-looking --------
      case 'phaseRoar': {
        e.vx = 0;
        e.anim = 'attack';
        // pulsing core flare while roaring
        if (Math.floor(m.t * 10) !== Math.floor((m.t - dt) * 10)) {
          world.spawnParticles('orb', e.x, e.y - CORE_DY, 2, {
            speed: 30, life: 0.4, spread: 3.2,
          });
        }
        if (m.t >= ROAR_T) {
          m.state = 'march';
          m.t = 0;
          m.cool = 0.6; // comes out of the roar swinging soon
          e.anim = 'move';
        }
        break;
      }

      // ---- stomping march toward the player --------------------------------
      case 'march': {
        const dir = world.dirToPlayer(e);
        e.facing = dir;
        e.anim = 'move';
        const spd = marchSpeed(m.phase);

        // stomp-step cadence: move on the first 70% of each cycle, plant on
        // the rest — heavy, deliberate footfalls with dust.
        m.stepT += dt;
        const cyc = m.phase === 3 ? STEP_PERIOD * 0.7 : STEP_PERIOD;
        if (m.stepT >= cyc) {
          m.stepT -= cyc;
          footfall(e, world, dir, false);
          if (m.phase === 3) world.shake(1, 0.08); // enraged tremor
        }
        e.vx = (m.stepT / cyc < 0.7) ? dir * spd : 0;

        // don't hug the player point-blank forever — hold ~26px stand-off
        if (Math.abs(p.x - e.x) < 26) e.vx = 0;

        // ambient core breathing — the golem is never truly inert; a slow
        // ember drifts up from the cracked chest core (~2.5/s) so it reads as
        // a living, humming machine even between attacks.
        if (Math.floor(m.t * 2.5) !== Math.floor((m.t - dt) * 2.5)) {
          world.spawnParticles('orb', e.x, e.y - CORE_DY, 1, {
            speed: 12, life: 0.55, up: true, spread: 2.6,
          });
        }

        // ---- pick the next attack when the cooldown clears ----------------
        if (m.cool <= 0 && !p.dead) {
          const dist = world.distToPlayer(e);
          if (m.phase === 3) {
            // enraged: ground-pound leap is the signature move
            m.state = 'leapTele';
            m.t = 0;
            e.vx = 0;
            world.playSfx('telegraph');
            world.spawnParticles('dust', e.x, e.y - 1, 6, {
              speed: 30, life: 0.5, up: true, spread: 1.3,
            });
          } else if (m.phase === 2 && (m.stompCount >= 2 || dist > 120)) {
            // fracture: core burst every 3rd beat, or when the player kites
            m.state = 'burstTele';
            m.t = 0;
            m.stompCount = 0;
            e.vx = 0;
            world.playSfx('telegraph');
          } else if (dist < 150) {
            m.state = 'stompTele';
            m.t = 0;
            e.vx = 0;
            world.playSfx('telegraph');
          }
        }
        break;
      }

      // ---- STOMP: raise the leg — long, readable — then slam ---------------
      case 'stompTele': {
        e.vx = 0;
        e.anim = 'attack';
        e.facing = world.dirToPlayer(e);
        // rising dust ring under the raised foot, denser as the slam nears
        if (Math.floor(m.t * 12) !== Math.floor((m.t - dt) * 12)) {
          world.spawnParticles('dust', e.x + e.facing * (e.w / 2 - 6), e.y - 2, 2, {
            speed: 18 + 30 * (m.t / STOMP_TELE_T), life: 0.35, up: true, spread: 1.0,
          });
        }
        if (m.t >= STOMP_TELE_T) {
          m.state = 'stomp';
          m.t = 0;
          world.playSfx('attack');
          world.shake(3, 0.28);
          shockwave(e, world, 1);
          footfall(e, world, e.facing, true);
        }
        break;
      }

      case 'stomp': {
        e.vx = 0;
        e.anim = 'attack';
        if (m.t >= STOMP_SLAM_T + STOMP_RECOV_T) {
          m.state = 'march';
          m.t = 0;
          m.stepT = 0;
          m.cool = coolFor(m.phase);
          m.stompCount++;
          e.anim = 'move';
        }
        break;
      }

      // ---- RADIAL BURST: core charge-up, then two staggered rings ----------
      case 'burstTele': {
        e.vx = 0;
        e.anim = 'attack';
        e.facing = world.dirToPlayer(e);
        // sparks converging INTO the chest core — unmistakable charge-up
        if (Math.floor(m.t * 16) !== Math.floor((m.t - dt) * 16)) {
          const a = world.rng() * Math.PI * 2 + m.t * 9;
          world.spawnParticles('spark',
            e.x + Math.cos(a) * 16, e.y - CORE_DY + Math.sin(a) * 16, 1,
            { speed: 26, life: 0.25, spread: 3.2 });
          world.spawnParticles('orb', e.x, e.y - CORE_DY, 1, {
            speed: 8, life: 0.3, spread: 3.2,
          });
        }
        if (m.t >= BURST_TELE_T) {
          m.state = 'burst';
          m.t = 0;
          m.ringsFired = 0;
          world.shake(2, 0.2);
        }
        break;
      }

      case 'burst': {
        e.vx = 0;
        e.anim = 'attack';
        // ring 1 immediately, ring 2 offset by half a slice after a beat
        if (m.ringsFired === 0) {
          radialRing(e, world, BURST_RING_N, world.angleToPlayer(e));
          m.ringsFired = 1;
        } else if (m.ringsFired === 1 && m.t >= BURST_RING_GAP) {
          radialRing(e, world, BURST_RING_N,
            world.angleToPlayer(e) + Math.PI / BURST_RING_N);
          m.ringsFired = 2;
        }
        if (m.t >= BURST_RING_GAP + BURST_RECOV_T) {
          m.state = 'march';
          m.t = 0;
          m.stepT = 0;
          m.cool = coolFor(m.phase);
          e.anim = 'move';
        }
        break;
      }

      // ---- GROUND-POUND LEAP (phase 3): crouch -> arc -> quake -> spiral ---
      case 'leapTele': {
        e.vx = 0;
        e.anim = 'attack';
        e.facing = world.dirToPlayer(e);
        // deep crouch shiver + gathering dust — you can see the jump coming
        if (Math.floor(m.t * 14) !== Math.floor((m.t - dt) * 14)) {
          world.spawnParticles('dust', e.x, e.y - 1, 2, {
            speed: 26, life: 0.35, up: true, spread: 1.4,
          });
        }
        if (m.t >= LEAP_TELE_T) {
          m.state = 'leap';
          m.t = 0;
          m.airT = 0;
          // aim at the player but keep the landing inside the arena
          const lo = m.homeX - ARENA_HALF + e.w / 2 + EDGE_PAD;
          const hi = m.homeX + ARENA_HALF - e.w / 2 - EDGE_PAD;
          // NaN-safe: fall back to our own x if the player pos is non-finite,
          // so a bad read can never poison e.vx (which persists across frames).
          const px = Number.isFinite(p.x) ? p.x : e.x;
          const tx = Math.max(lo, Math.min(hi, px));
          const dx = tx - e.x;
          m.leapDir = Math.sign(dx) || e.facing;
          // ~1.0s expected hang time under engine gravity
          let vxl = dx / 1.0;
          if (vxl > LEAP_VX_MAX) vxl = LEAP_VX_MAX;
          else if (vxl < -LEAP_VX_MAX) vxl = -LEAP_VX_MAX;
          e.vx = Number.isFinite(vxl) ? vxl : 0;
          e.vy = LEAP_VY;
          world.playSfx('jump');
          world.spawnParticles('dust', e.x, e.y - 1, 8, {
            speed: 50, life: 0.45, up: true, spread: 1.4,
          });
        }
        break;
      }

      case 'leap': {
        e.anim = 'attack';
        e.facing = m.leapDir;
        m.airT += dt;
        // engine gravity owns vy; keep vx committed (dodgeable — no homing)
        const landed = (e.onGround && m.airT >= LEAP_MIN_AIR) || m.airT >= LEAP_MAX_AIR;
        if (landed) {
          e.vx = 0;
          e.vy = 0;
          m.state = 'quake';
          m.t = 0;
          world.shake(6, 0.5);
          world.playSfx('land');
          shockwave(e, world, 2);
          footfall(e, world, -1, true);
          footfall(e, world, 1, true);
        }
        break;
      }

      case 'quake': {
        e.vx = 0;
        e.anim = 'attack';
        if (m.t >= QUAKE_T) {
          m.state = 'spiral';
          m.t = 0;
          m.spiralShotT = 0;
          m.spiralA = world.angleToPlayer(e); // first arm points at the player
          world.playSfx('telegraph');
        }
        break;
      }

      case 'spiral': {
        e.vx = 0;
        e.anim = 'attack';
        m.spiralShotT += dt;
        while (m.spiralShotT >= SPIRAL_RATE) {
          m.spiralShotT -= SPIRAL_RATE;
          spiralShot(e, world, m.spiralA);
          m.spiralA += SPIRAL_STEP;
        }
        if (Math.floor(m.t * 8) !== Math.floor((m.t - dt) * 8)) {
          world.spawnParticles('orb', e.x, e.y - CORE_DY, 1, {
            speed: 20, life: 0.3, spread: 3.2,
          });
        }
        if (m.t >= SPIRAL_T) {
          m.state = 'recoverP3';
          m.t = 0;
        }
        break;
      }

      case 'recoverP3': {
        e.vx = 0;
        e.anim = 'move';
        e.facing = world.dirToPlayer(e);
        if (m.t >= SPIRAL_RECOV_T) {
          m.state = 'march';
          m.t = 0;
          m.stepT = 0;
          m.cool = coolFor(m.phase);
        }
        break;
      }

      default: {
        m.state = 'march';
        m.t = 0;
      }
    }

    // ---- the one unbreakable rule: never leave the arena -------------------
    clampArena(e, m);
  },
};
