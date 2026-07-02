// AETHERFALL — Level 2: "CRYSTAL CANOPY" (forest biome, verticality)
//
// Flow (left → right, 148 cols × 22 rows):
//   A (0-17)    Spawn glade — shard arc teaches jumping onto a one-way platform.
//   B (18-34)   Crystal spike pit #1 — three 3-wide spike groups with rhythm gaps,
//               a shard floating over each group marks the jump beat.
//   C (35-63)   The Climb — one-way platforms zigzag up a cliff face (drone +
//               floater guard the shaft), topping out on a plateau breather.
//               SECRET: the platform "ladder" continues UP above the shaft
//               (= at row 6) to a canopy path along rows 3-4: five one-way
//               platforms, 10 shards, a heart on a stone perch, then an exit
//               platform that drops the player back onto island I5 (rejoin).
//   D (64-112)  Canopy traverse — six floating islands over a long crystal
//               spike pit. Drones hover in the jump gaps, floaters drift below.
//               Two safe pockets in the pit (cols 79-81, 95-97) have one-way
//               platform ladders that double as safety nets under the jumps;
//               pocket 1 holds a heart, pocket 2 a shard.
//   E (113-147) Descent + finale — rooted pillar steps down to ground, two last
//               spike beats, a drone + crawler, lantern-lit run to the portal.
//
// Verticality: main path climbs from row 18 up to row 9, secret path to row 3.
// All jumps ≤4 tiles up / ≤6 wide (max jump used once, signposted by shards).
// Shards: 36 · Hearts: 2 · Enemies: 13 (5 drones, 5 floaters, 3 crawlers).

export const level = {
  name: 'CRYSTAL CANOPY',
  biome: 'forest',
  music: 'forest',
  skyColor: '#170e33',
  spawn: { x: 3, y: 18 },
  exit: { x: 140, y: 18 },
  map: [
    '....................................................................................................................................................',
    '....................................................................................................................................................',
    '....................................................................................................................................................',
    '.......................................................**......**......**......**......**...r.H.....................................................',
    '......................................................====....====....====....====....====..####....................................................',
    '...............................................*.......v.......v.......v...............v....####...*................................................',
    '..............................................===............................................v....===...............................................',
    '....................................................................................................................................................',
    '....................................................*...*...*.....................................................................................##',
    '...........................................*.......g.g...gl.g.gc........*.......*.......*.......*.................................................##',
    '##........................................===....X##############v..........g.g.............g.g..........*.........................................##',
    '##...............................................X##############v..g.g....#####...........#####....g.g............................................##',
    '##.............................................*rX##############..#####...#####....g.g....#####...#####....g.g....................................##',
    '##............................................===X##############..#####.....v.....#####.....v.....#####...#####...*...............................##',
    '##..........*....................................X##############....v..........===#####........===..v.....#####.....g.............................##',
    '##.......*.===..............................*...rX##############....................v.......................v....####............................r##',
    '##....*..............*.....*.....*.........===...X##############.................................................####....*......*.................##',
    '##...............................................X##############...............===.............===..............v####.......*........*...*.......r##',
    '##.glg..g.g..g..gc..^^^.c.^^^.c.^^^.gl..g........X##############................H...............*................####.g.l^^..g.^^.cg....g.l....gc.##',
    '#################################################X##############..^^^^^^^^^^^^c...c^^^^^^^^^^^c...c^^^^^^^^^^^^cc###################################',
    '#################################################X##################################################################################################',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  ],
  entities: [
    // A/B — grounded intro
    { type: 'crawler', x: 14, y: 18 },   // spawn glade patroller
    { type: 'crawler', x: 40, y: 18 },   // guards the base of the climb
    // C — the climb shaft
    { type: 'drone', x: 46, y: 11 },     // hovers between platforms p2/p3
    { type: 'floater', x: 44, y: 7 },    // drifts near the secret entry
    // D — canopy traverse (drones in the jump gaps, floaters below)
    { type: 'drone', x: 72, y: 7 },      // gap I1→I2
    { type: 'floater', x: 80, y: 13 },   // haunts safety-net pocket 1
    { type: 'drone', x: 88, y: 7 },      // gap I3→I4
    { type: 'floater', x: 96, y: 13 },   // haunts safety-net pocket 2
    { type: 'drone', x: 104, y: 8 },     // gap I5→I6
    // Secret canopy path guardians
    { type: 'floater', x: 68, y: 2 },
    { type: 'floater', x: 84, y: 2 },
    // E — finale
    { type: 'drone', x: 126, y: 15 },    // over the last spike beats
    { type: 'crawler', x: 134, y: 18 },  // final ground threat before portal
  ],
  decor: [
    { stamp: 'tree_glow', x: 7, y: 18 },     // spawn glade canopy tree
    { stamp: 'firefly_bush', x: 11, y: 18 },
    { stamp: 'lantern', x: 18, y: 18 },      // warns of the first spike pit
    { stamp: 'crystal_big', x: 35, y: 18 },  // marks the base of the climb
    { stamp: 'firefly_bush', x: 53, y: 9 },  // plateau breather dressing
    { stamp: 'statue', x: 56, y: 9 },        // lost-civilization sentinel
    { stamp: 'lantern', x: 61, y: 9 },
    { stamp: 'crystal_big', x: 111, y: 19 }, // giant crystal at pit's end
    { stamp: 'firefly_bush', x: 118, y: 18 },
    { stamp: 'tree_glow', x: 132, y: 18 },   // frames the final approach
    { stamp: 'arch_stone', x: 140, y: 18 },  // ancient arch behind the portal
  ],
};
