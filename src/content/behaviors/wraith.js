// AETHERFALL — behavior: WRAITH (sprite: enemy_wraith)
//
// A mourner of the drowned towers — a robe of cold violet vapor with two ember
// eyes. It ignores stone entirely (collides:false, gravity:false), swimming
// through walls on a sweeping FIGURE-EIGHT current that carries it toward its
// prey. It breathes between two worlds: a slow cycle fades it from fully
// manifest (anim 'move') to half-real (anim 'dim'); while dim it slips faster
// through the veil. When it finally closes in it rears up (anim 'attack',
// telegraphed with a hiss + spark ring), rakes forward in a short claw lunge —
// then recoils, phasing out and RETREATING to a respectful distance before it
// dares to sweep back in. Patient, rhythmic, readable.
//
// States: hunt -> telegraph -> lunge -> retreat -> hunt
// Anims used (must exist in art/enemy_wraith.js): 'move', 'dim', 'attack'

const AGGRO_DIST    = 200;   // px — beyond this it haunts its spawn instead
const LUNGE_DIST    = 34;    // px — close enough to rear up and strike
const CONTACT_DIST  = 15;    // px — brushed the player without lunging: recoil
const RETREAT_DIST  = 96;    // px — retreats until at least this far away
const HUNT_SPEED    = 50;    // px/s pursuit current while manifest
const DIM_SPEED     = 86;    // px/s pursuit current while phased (dim)
const RETREAT_SPEED = 118;   // px/s recoil speed
const LUNGE_SPEED   = 172;   // px/s claw-rake dart
const F8_AMP_X      = 30;    // px figure-eight width (half)
const F8_AMP_Y      = 14;    // px figure-eight height (half)
const F8_FREQ       = 2.3;   // rad/s — one full ∞ every ~2.7s
const VIS_TIME      = 1.7;   // s spent manifest per breath cycle
const DIM_TIME      = 1.05;  // s spent phased per breath cycle
const STEER         = 3.4;   // 1/s velocity easing gain (spectral inertia)
const TELEGRAPH_T   = 0.30;  // s readable rear-up before the rake
const LUNGE_T       = 0.30;  // s the rake dart lasts
const RETREAT_T     = 1.5;   // s max recoil before it must turn back
const LUNGE_CD      = 1.2;   // s after a retreat before it may strike again
const TRAIL_PERIOD  = 0.16;  // s between shed robe-motes

export const behavior = {
  sprite: 'enemy_wraith',
  hp: 2,
  damage: 1,
  w: 16,
  h: 22,
  gravity: false,
  collides: false,           // phasing ghost — glides straight through tiles
  contactDamage: true,
  shardDrop: 1,
  isBoss: false,

  init(e, world) {
    const r = world.rng;
    e.mem.state   = 'hunt';
    e.mem.stT     = 0;                       // time in current state
    e.mem.f8      = r() * Math.PI * 2;       // figure-eight phase (desyncs wraiths)
    e.mem.dim     = false;                   // manifest <-> phased breath
    e.mem.phaseT  = VIS_TIME * (0.4 + r() * 0.6); // stagger first fade
    e.mem.lungeCd = 0;
    e.mem.trailT  = r() * TRAIL_PERIOD;
    e.mem.lx = 0; e.mem.ly = 0;              // locked lunge direction
    e.anim = 'move';
  },

  update(e, world, dt) {
    const m = e.mem;
    const p = world.player;
    m.stT += dt;
    if (m.lungeCd > 0) m.lungeCd -= dt;

    const dist = world.distToPlayer(e);
    // aim at the player's chest, not the feet — it looms
    const tx = p.x, ty = p.y - p.h * 0.6;

    // ---------------- breath cycle: manifest <-> phased ----------------
    // (frozen mid-strike so the attack is always fully visible & readable)
    if (m.state === 'hunt' || m.state === 'retreat') {
      m.phaseT -= dt;
      if (m.phaseT <= 0) {
        m.dim = !m.dim;
        m.phaseT += m.dim ? DIM_TIME : VIS_TIME;
        // veil shimmer on every crossing — a ring of cold motes
        world.spawnParticles('orb', e.x, e.y - e.h * 0.5, m.dim ? 5 : 3,
          { speed: 26, life: 0.4 });
      }
    }

    // ---------------- state machine ----------------
    let dvx = 0, dvy = 0;                    // desired drift velocity

    if (m.state === 'hunt') {
      const hunting = !p.dead && dist < AGGRO_DIST;
      // pursuit current: toward player (or drift home when idle/player dead)
      const gx = hunting ? tx : e.spawnX;
      const gy = hunting ? ty : e.spawnY;
      const dx = gx - e.x, dy = gy - e.y;
      const d = Math.hypot(dx, dy) || 1;
      const speed = hunting ? (m.dim ? DIM_SPEED : HUNT_SPEED)
                            : Math.min(HUNT_SPEED * 0.5, d); // settle at spawn
      dvx = (dx / d) * speed;
      dvy = (dy / d) * speed;

      // sweeping figure-eight laid over the current (velocity form of
      // x = A·sin(θ), y = B·sin(2θ) — a sideways ∞)
      m.f8 += F8_FREQ * dt;
      dvx += Math.cos(m.f8) * F8_AMP_X * F8_FREQ;
      dvy += Math.cos(m.f8 * 2) * F8_AMP_Y * 2 * F8_FREQ;

      if (hunting && !m.dim && m.lungeCd <= 0 && dist < LUNGE_DIST) {
        // rear up — readable pause before the rake
        m.state = 'telegraph'; m.stT = 0;
        e.anim = 'attack'; e.animT = 0;
        world.playSfx('telegraph');
        world.spawnParticles('spark', e.x, e.y - e.h * 0.7, 5,
          { speed: 40, life: 0.28 });
      } else if (hunting && dist < CONTACT_DIST) {
        // brushed the player mid-sweep — recoil immediately
        this._startRetreat(e, world);
      }
    } else if (m.state === 'telegraph') {
      // hang in the air, quivering — drift dies off
      dvx = 0; dvy = -6;
      if (m.stT >= TELEGRAPH_T) {
        // lock the rake direction at the moment of commitment
        const dx = tx - e.x, dy = ty - e.y;
        const d = Math.hypot(dx, dy) || 1;
        m.lx = dx / d; m.ly = dy / d;
        m.state = 'lunge'; m.stT = 0;
        world.spawnParticles('spark', e.x + m.lx * 6, e.y - e.h * 0.5, 4,
          { speed: 60, life: 0.22 });
      }
    } else if (m.state === 'lunge') {
      // claw rake — straight dart along the locked line
      dvx = m.lx * LUNGE_SPEED;
      dvy = m.ly * LUNGE_SPEED;
      if (m.stT >= LUNGE_T) this._startRetreat(e, world);
    } else { // 'retreat'
      // recoil away from the player, wafting upward, phased out
      const dx = e.x - p.x, dy = e.y - p.y;
      const d = Math.hypot(dx, dy) || 1;
      dvx = (dx / d) * RETREAT_SPEED;
      dvy = (dy / d) * RETREAT_SPEED - 24;   // drifts high as it flees
      // gentle serpentine while fleeing — it never moves in dead lines
      m.f8 += F8_FREQ * 1.4 * dt;
      dvx += Math.cos(m.f8) * F8_AMP_X * 0.5 * F8_FREQ;
      if (dist >= RETREAT_DIST || m.stT >= RETREAT_T || p.dead) {
        m.state = 'hunt'; m.stT = 0;
      }
    }

    // spectral inertia: ease actual velocity toward the desired current
    const k = Math.min(STEER * dt, 1);
    e.vx += (dvx - e.vx) * k;
    e.vy += (dvy - e.vy) * k;

    // hard safety cap (sim + gameplay sanity)
    const sp = Math.hypot(e.vx, e.vy);
    if (sp > 260) { e.vx = (e.vx / sp) * 260; e.vy = (e.vy / sp) * 260; }

    // face the prey while engaged, else face travel direction
    if (m.state !== 'retreat' && !p.dead && dist < AGGRO_DIST) {
      e.facing = world.dirToPlayer(e);
    } else if (Math.abs(e.vx) > 4) {
      e.facing = e.vx < 0 ? -1 : 1;
    }

    // ---------------- anim: the fade between move / dim ----------------
    if (m.state === 'telegraph' || m.state === 'lunge') {
      e.anim = 'attack';
    } else if (m.state === 'retreat') {
      e.anim = 'dim';                        // always phased while recoiling
    } else {
      e.anim = m.dim ? 'dim' : 'move';
    }

    // ---------------- shed robe-motes along the sweep ----------------
    m.trailT -= dt;
    if (m.trailT <= 0) {
      m.trailT += m.dim ? TRAIL_PERIOD * 1.8 : TRAIL_PERIOD; // sparser when phased
      const bx = e.x - Math.sign(e.vx || e.facing) * 4;
      world.spawnParticles('orb', bx, e.y - e.h * 0.3, 1,
        { speed: 8, life: 0.55, up: false });
      if (m.state === 'lunge') {
        world.spawnParticles('spark', bx, e.y - e.h * 0.5, 2,
          { speed: 30, life: 0.2 });
      }
    }
  },

  // recoil entry (shared by post-lunge and contact-brush)
  _startRetreat(e, world) {
    const m = e.mem;
    m.state = 'retreat'; m.stT = 0;
    m.dim = true;                            // snaps out of the world
    m.phaseT = DIM_TIME;
    m.lungeCd = LUNGE_CD + RETREAT_T;
    e.anim = 'dim'; e.animT = 0;
    world.spawnParticles('orb', e.x, e.y - e.h * 0.5, 6, { speed: 44, life: 0.35 });
    world.spawnParticles('spark', e.x, e.y - e.h * 0.5, 3, { speed: 52, life: 0.25 });
  },
};
