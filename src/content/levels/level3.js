// AETHERFALL — level3.js — "SKY BASTION" (kind: level)
//
// Biome: ruins. Precision platforming across a shattered sky-bridge, a floating-
// masonry ascent, a windswept high rampart, and a crumbling descent — all over a
// bottomless cloud sea (falling = respawn damage). Wraiths phase between the
// floating stones; drones patrol the open gaps.
//
// Flow (teach → test → twist):
//   1. cols   0-14  Start terrace — safe ground, statue + brazier, first shard arc.
//   2. cols  15-46  Broken bridge — 3/4-wide cloud gaps, a rebar-spike hop, a
//                   drone over the widest leap, landing isle under a ruined tower.
//   3. cols  44-65  Floating-masonry ascent — 2-tile rises, a wraith weaving
//                   between the stones. SECRET: slab up-left holds a heart.
//   4. cols  66-92  High rampart — banners + braziers, spike pair mid-deck,
//                   wraith + drone setpiece, shard line along the wind.
//   5. cols  93-109 Crumbling descent — drops onto masonry + a one-way beam,
//                   two drones own the gaps.
//   6. cols 110-132 Cloud-sea finale — 2-tile floaters, 3-wide gaps, a wraith
//                   gatekeeper, heart reward on the last stone.
//   7. cols 133-151 Bastion gate terrace — braziers, banners, guardian statue,
//                   the portal home.
//
// Map legend: '.' air  '#' masonry  'X' reinforced block  '|' column  '=' beam
//             '^' rebar spikes  '*' shard  'H' heart
// Decor tiles (tiles_ruins): g grass, c rosette, v banner scrap, l brazier, r glyph
// Props (props_ruins): tower_broken, banner_pole, bridge_arch, guardian_statue,
//                      brazier_column, floating_masonry

const W = 152, H = 20;
const g = Array.from({ length: H }, () => Array(W).fill('.'));
const put = (x, y, ch) => { if (x >= 0 && x < W && y >= 0 && y < H) g[y][x] = ch; };
const hrow = (x1, x2, y, ch) => { for (let x = x1; x <= x2; x++) put(x, y, ch); };
const box = (x1, y1, x2, y2, ch) => { for (let y = y1; y <= y2; y++) hrow(x1, x2, y, ch); };

// ---- 1. Start terrace (cols 0-14) -----------------------------------------
box(0, 14, 13, 19, '#');
box(14, 14, 14, 19, 'X');            // reinforced terrace lip
put(2, 13, 'g'); put(5, 13, 'g'); put(8, 13, 'l');
put(10, 13, 'r'); put(12, 13, 'v');

// ---- 2. Broken bridge (cols 15-46) ----------------------------------------
hrow(15, 19, 14, '#');               // deck 1 (off the terrace)
hrow(23, 26, 14, '#');               // deck 2 — 3-wide gap before it
hrow(31, 35, 14, '#');               // deck 3 — 4-wide gap in; spike hop with a fair 2-tile takeoff pad (34-35)
put(33, 13, '^');
box(39, 14, 46, 15, '#');            // landing isle — 4-wide leap to reach
put(17, 13, 'g'); put(24, 13, 'g'); put(41, 13, 'g'); put(45, 13, 'c');

// ---- 3. Floating-masonry ascent (cols 44-65) -------------------------------
hrow(49, 51, 12, '#');               // stone 1  (+2)
hrow(54, 55, 10, '#');               // stone 2  (+2)
hrow(58, 60,  8, '#');               // stone 3  (+2)
hrow(63, 65,  8, '=');               // bronze beam onto the rampart
hrow(45, 46,  9, '#');               // SECRET slab — fair back-left hop off stone 1 (+3 up / 3 left); [47,10] shard baits it
put(45, 8, 'H');

// ---- 4. High rampart (cols 66-92) ------------------------------------------
box(66, 8, 92, 9, '#');
for (const px of [70, 80, 90]) box(px, 10, px, 13, '|');   // hanging columns
put(68, 7, 'v'); put(72, 7, 'l'); put(75, 7, 'r');
put(76, 7, '^'); put(77, 7, '^');    // spike pair — hop with the wind
put(78, 7, 'v'); put(81, 7, 'g'); put(84, 7, 'l');
put(87, 7, 'g'); put(88, 7, 'v'); put(91, 7, 'c');

// ---- 5. Crumbling descent (cols 93-109) ------------------------------------
hrow(95, 97, 10, '#');               // drop 1
hrow(101, 103, 12, '=');             // one-way beam, drop 2
hrow(107, 109, 13, '#');             // drop 3

// ---- 6. Cloud-sea finale (cols 110-132) ------------------------------------
hrow(113, 114, 12, '#');
hrow(118, 119, 11, '#');
hrow(123, 124, 12, '#');
hrow(128, 129, 11, '#');
put(128, 10, 'H');                   // reward on the last stone
put(129, 10, 'g');

// ---- 7. Bastion gate terrace (cols 133-151) --------------------------------
box(133, 13, 133, 19, 'X');
box(134, 13, 151, 19, '#');
put(137, 12, 'g'); put(140, 12, 'l'); put(141, 12, 'r'); put(143, 12, 'g');
put(144, 12, 'v'); put(145, 12, 'c'); put(148, 12, 'l'); put(150, 12, 'g');

// ---- shard trail (guides the intended line) ---------------------------------
const SHARDS = [
  [13, 12],                                    // terrace lip — "jump here"
  [21, 12], [28, 12], [29, 12], [36, 12], [37, 12],   // bridge gap arcs
  [50, 11], [47, 10], [54, 9], [55, 9], [59, 7],      // ascent + secret hint
  [69, 6], [73, 6], [79, 6], [85, 6], [91, 6],        // rampart wind-line
  [93, 7], [96, 9], [99, 11], [102, 11], [108, 12],   // descent arcs
  [113, 11], [118, 10], [123, 11], [134, 11], [135, 11], // finale
];
for (const [sx, sy] of SHARDS) put(sx, sy, '*');

export const level = {
  name: 'SKY BASTION',
  biome: 'ruins',
  music: 'ruins',
  skyColor: '#1b1240',
  spawn: { x: 3, y: 13 },
  exit: { x: 146, y: 12 },
  map: g.map((r) => r.join('')),
  entities: [
    { type: 'drone',  x: 28,  y: 11 },  // patrols the widest bridge gap
    { type: 'wraith', x: 56,  y: 9  },  // weaves through the masonry ascent
    { type: 'wraith', x: 74,  y: 6  },  // rampart haunt, near the spike pair
    { type: 'drone',  x: 82,  y: 5  },  // dives on the rampart shard line
    { type: 'drone',  x: 99,  y: 9  },  // owns the first descent gap
    { type: 'drone',  x: 110, y: 11 },  // guards the hop into the finale
    { type: 'wraith', x: 121, y: 9  },  // gatekeeper over the cloud sea
  ],
  decor: [
    { stamp: 'guardian_statue',  x: 6,   y: 13 },
    { stamp: 'banner_pole',      x: 11,  y: 13 },
    { stamp: 'floating_masonry', x: 21,  y: 17 },
    { stamp: 'brazier_column',   x: 25,  y: 13 },
    { stamp: 'bridge_arch',      x: 35,  y: 17 },
    { stamp: 'tower_broken',     x: 43,  y: 13 },
    { stamp: 'floating_masonry', x: 47,  y: 16 },
    { stamp: 'banner_pole',      x: 66,  y: 7  },  // rampart gate — frames the setpiece entrance
    { stamp: 'banner_pole',      x: 71,  y: 7  },
    { stamp: 'brazier_column',   x: 86,  y: 7  },
    { stamp: 'banner_pole',      x: 89,  y: 7  },
    { stamp: 'floating_masonry', x: 88,  y: 16 },  // drifting ruin under the rampart — cloud-sea depth
    { stamp: 'floating_masonry', x: 105, y: 16 },
    { stamp: 'floating_masonry', x: 116, y: 16 },  // depth under the finale gaps
    { stamp: 'floating_masonry', x: 126, y: 15 },
    { stamp: 'tower_broken',     x: 137, y: 12 },
    { stamp: 'guardian_statue',  x: 149, y: 12 },
  ],
};
