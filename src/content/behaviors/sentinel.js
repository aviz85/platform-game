// AETHERFALL — behavior: SENTINEL (sprite: enemy_sentinel)
//
// A stationary crystal-punk turret — an ancient warden bolted into the stone.
// It never moves. Its head sweeps slowly while idle; when the player enters
// ~140px with a clear line of sight it locks on, charges its amber core for a
// readable 0.65s telegraph (converging spark motes + rising 'telegraph' trill),
// then releases a 1–3 shot burst of gold energy bolts along the locked bearing.
// Bolt count scales with proximity (closer = more shots, fanned slightly), so
// keeping distance is a valid answer. Long ≥1.9s cooldown between bursts gives
// the player a clear rhythm window to close in or slip past.
//
// States: idle -> telegraph -> burst -> cooldown -> idle
// Anims used (art/enemy_sentinel.js): 'move' (idle scan), 'attack' (charge-up)
// Sfx used: 'telegraph', 'shoot'

const AGGRO_DIST     = 140;   // px — engagement radius (per design intent)
const WAKE_DIST      = 190;   // px — starts tracking the player with its facing
const TELEGRAPH_TIME = 0.65;  // s of readable charge-up before firing
const SHOT_GAP       = 0.13;  // s between bolts inside a burst
const COOLDOWN       = 1.9;   // s rearm after a burst (contract: ≥1.6s)
const BOLT_SPEED     = 165;   // px/s projectile speed — dodgeable at range
const BOLT_TTL       = 1.5;   // s projectile lifetime (~250px reach)
const BOLT_COLOR     = '#ffd166'; // hot amber-gold, matches the core charge art
const MUZZLE_UP      = 0.68;  // muzzle height as fraction of hitbox height
const MUZZLE_FWD     = 6;     // px muzzle offset toward facing
const FAN_3          = 0.10;  // rad half-spread of a 3-bolt fan
const FAN_2          = 0.06;  // rad half-spread of a 2-bolt pair

export const behavior = {
  sprite: 'enemy_sentinel',
  hp: 4,
  damage: 1,
  w: 16,
  h: 20,
  gravity: true,          // seats itself on the ground, then never moves
  collides: true,
  contactDamage: true,
  shardDrop: 1,
  isBoss: false,

  init(e, world) {
    e.mem.state = 'idle';
    e.mem.stateT = 0;
    e.mem.cool = 0.8;               // spawn grace so it never insta-fires
    e.mem.aim = 0;                  // locked bearing (rad) for the burst
    e.mem.shots = 0;                // bolts remaining in current burst
    e.mem.shotT = 0;                // timer to next bolt
    e.mem.scanDir = e.facing || 1;  // idle facing flip direction
    e.mem.scanT = 1.2 + world.rng() * 1.6; // desync scan flips between sentinels
    e.mem.humT = world.rng() * 0.8; // idle core-shimmer particle timer
    e.anim = 'move';
  },

  update(e, world, dt) {
    const m = e.mem;
    m.stateT += dt;
    if (m.cool > 0) m.cool -= dt;

    // Rooted: a sentinel never walks. (Engine gravity still seats it on ground.)
    e.vx = 0;

    const p = world.player;
    const muzzleX = () => e.x + e.facing * MUZZLE_FWD;
    const muzzleY = () => e.y - e.h * MUZZLE_UP;

    // Line-of-sight: sample the ray to the player's chest for solid tiles.
    const hasLOS = () => {
      const x0 = muzzleX(), y0 = muzzleY();
      const x1 = p.x, y1 = p.y - p.h * 0.5;
      const steps = 8;
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        if (world.solidAt(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)) return false;
      }
      return true;
    };

    switch (m.state) {

      // ---------------- IDLE: rooted scan, waiting for a target ----------------
      case 'idle': {
        e.anim = 'move';

        const d = world.distToPlayer(e);
        const awake = !p.dead && d < WAKE_DIST;

        if (awake) {
          // track the player with the housing while the head scans
          e.facing = world.dirToPlayer(e);
        } else {
          // lazy sentry sweep: flip facing every couple of seconds
          m.scanT -= dt;
          if (m.scanT <= 0) {
            m.scanT = 1.6 + world.rng() * 1.8;
            m.scanDir = -m.scanDir;
            e.facing = m.scanDir;
          }
        }

        // faint idle core shimmer — reads as "powered" from across the room
        m.humT -= dt;
        if (m.humT <= 0) {
          m.humT = 0.9 + world.rng() * 0.7;
          world.spawnParticles('orb', e.x, muzzleY(), 1,
            { speed: 5, life: 0.5, up: true });
        }

        // engage: in range, off cooldown, clear line of sight
        if (awake && m.cool <= 0 && d < AGGRO_DIST && hasLOS()) {
          m.state = 'telegraph';
          m.stateT = 0;
          e.anim = 'attack';        // charge-up anim (non-loop) from frame 0
          e.animT = 0;
          world.playSfx('telegraph');
          world.spawnParticles('spark', muzzleX(), muzzleY(), 5,
            { speed: 24, life: 0.3 });
        }
        break;
      }

      // ------- TELEGRAPH: amber core charges, motes converge — "get moving" -------
      case 'telegraph': {
        e.anim = 'attack';
        // keep tracking through the wind-up; the bearing locks only at release
        if (!p.dead) e.facing = world.dirToPlayer(e);

        // converging charge motes pulled into the core, thickening as it peaks
        const k = m.stateT / TELEGRAPH_TIME;               // 0..1 charge
        if ((m.stateT * 60 | 0) % (k > 0.6 ? 4 : 7) === 0) {
          world.spawnParticles('spark', muzzleX(), muzzleY(), 1,
            { speed: 18 + k * 26, life: 0.22 });
        }

        if (m.stateT >= TELEGRAPH_TIME) {
          // lock the firing bearing NOW — the burst is committed and dodgeable
          const dx = p.x - muzzleX();
          const dy = (p.y - p.h * 0.5) - muzzleY();
          m.aim = Math.atan2(dy, dx);

          // proximity-scaled burst: brave players eat a wider, denser fan
          const d = world.distToPlayer(e);
          m.shots = d < 65 ? 3 : d < 105 ? 2 : 1;
          m.shotT = 0;               // first bolt leaves immediately
          m.burstSize = m.shots;
          m.state = 'burst';
          m.stateT = 0;
        }
        break;
      }

      // ---------------- BURST: 1–3 gold bolts along the locked bearing ----------------
      case 'burst': {
        e.anim = 'attack';           // non-loop: holds the white-hot final frame

        m.shotT -= dt;
        if (m.shotT <= 0 && m.shots > 0) {
          const i = m.burstSize - m.shots;   // 0-based shot index
          // symmetric fan around the locked bearing
          let off = 0;
          if (m.burstSize === 3) off = (i - 1) * FAN_3;
          else if (m.burstSize === 2) off = (i === 0 ? -FAN_2 : FAN_2);
          const a = m.aim + off;

          const mx = muzzleX(), my = muzzleY();
          world.spawnProjectile({
            x: mx, y: my,
            vx: Math.cos(a) * BOLT_SPEED,
            vy: Math.sin(a) * BOLT_SPEED,
            damage: 1, ttl: BOLT_TTL, r: 2,
            color: BOLT_COLOR, glow: true, gravity: false,
          });
          world.playSfx('shoot');
          // muzzle flash kicked out along the bolt's path
          world.spawnParticles('spark', mx + Math.cos(a) * 4, my + Math.sin(a) * 4,
            3, { speed: 44, life: 0.18 });

          m.shots--;
          m.shotT = SHOT_GAP;
        }

        // burst spent (small tail so the last flash reads) -> rearm
        if (m.shots <= 0 && m.shotT <= -0.08) {
          m.state = 'cooldown';
          m.stateT = 0;
          m.cool = COOLDOWN;
        }
        break;
      }

      // ---------------- COOLDOWN: core vents, head resumes its scan ----------------
      case 'cooldown': {
        e.anim = 'move';
        if (!p.dead && world.distToPlayer(e) < WAKE_DIST) {
          e.facing = world.dirToPlayer(e);   // stays trained on you while venting
        }
        // one soft vent puff shortly after firing
        if (m.stateT < 0.3 && (m.stateT * 60 | 0) % 9 === 0) {
          world.spawnParticles('dust', e.x, muzzleY() + 2, 1,
            { speed: 10, life: 0.4, up: true });
        }
        if (m.cool <= 0) {
          m.state = 'idle';
          m.stateT = 0;
        }
        break;
      }

      default:
        m.state = 'idle';
        m.stateT = 0;
    }
  },
};
