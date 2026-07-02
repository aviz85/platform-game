// AETHERFALL — level1.js — "LUMEN WOODS" (kind: level)
//
// Gentle teach level, 130x20. Pacing left→right:
//   spawn meadow (flat run, glowing trees + fireflies)
//   → 1-tile step up + first shallow pit (2 wide, safe floor — teaches jumping)
//   → flat crawler run (first enemy, on open ground with escape room)
//   → two shard-arc pits (3 and 4 wide) — shards trace the exact jump arcs
//   → one-way platform climb to a heart (teaches '=' + verticality)
//   → first slime in the valley below the platforms
//   → crystal-spike rhythm run (2-wide spike patches, shard arcs over each)
//   → SECRET: lantern-lit alcove under the shelf at x90-97; the '=' trapdoor at
//     x92-93 drops into a warm amber room with 3 shards, a rune and a crystal
//   → rising steps with second crawler, ancient arch overhead
//   → statue-guarded exit plateau, portal at (121,11)
//
// 26 shards, 1 heart, 4 enemies (crawler, slime, slime, crawler).
// Decor stamps from props_forest: crystal_big, tree_glow, statue, arch_stone,
// firefly_bush, lantern. Tileset decor chars: g glowgrass, c crystal, v vine,
// l lantern, r rune.

export const level = {
  name: 'LUMEN WOODS',
  biome: 'forest',
  music: 'forest',
  skyColor: '#150c2e',

  spawn: { x: 3, y: 14 },
  exit: { x: 121, y: 11 },

  //        0         1         2         3         4         5         6         7         8         9         10        11        12
  //        0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789
  map: [
    '#................................................................................................................................#',
    '#................................................................................................................................#',
    '#................................................................................................................................#',
    '#................................................................................................................................#',
    '#................................................................................................................................#',
    '#................................................................................................................................#',
    '#.............................................................................g.g................................................#',
    '#..................................g.g........................................####...............................................#',
    '#..................................####........................................v.v...............................................#',
    '#...................................v.v.........................*H...............................................................#',
    '#...............................................................===..............................................................#',
    '#.........................................*.......**........*.*..v...*......................................*gr.g*cg*.glg..g..cg.#',
    '#......................**................*.*.....*..*.......===.....===.....**....**....................*.g.######################',
    '#.................lg.g....g*g*.g..g..gcg.....g.g......gcg....v............................g...g..g..grgr##########################',
    '#.g..gcg..g.g..g.######..################...#####....#####.g...g...g...g.lgc^^.g..^^.g..g###==####################################',
    '#######################..################...#####....#####################################........################################',
    '#######################.g################.gc#####..g.#####################################r..*....################################',
    '##################################################################################################################################',
    '##################################################################################################################################',
    '##################################################################################################################################',
  ],

  entities: [
    { type: 'crawler', x: 32, y: 13 },   // first enemy — flat patrol between pits
    { type: 'slime', x: 70, y: 14 },     // valley below the heart platforms
    { type: 'slime', x: 86, y: 14 },     // after the second spike patch
    { type: 'crawler', x: 105, y: 12 },  // patrols the 4-wide step near the exit
  ],

  decor: [
    { stamp: 'tree_glow', x: 7, y: 14 },      // spawn meadow canopy
    { stamp: 'firefly_bush', x: 13, y: 14 },
    { stamp: 'crystal_big', x: 36, y: 13 },   // under the floating island
    { stamp: 'tree_glow', x: 45, y: 13 },     // between the arc pits
    { stamp: 'arch_stone', x: 58, y: 14 },    // gateway into the platform valley
    { stamp: 'firefly_bush', x: 74, y: 14 },  // before the spike run
    { stamp: 'lantern', x: 80, y: 14 },       // warm light between spike patches
    { stamp: 'lantern', x: 95, y: 17 },       // the secret alcove's amber heart
    { stamp: 'arch_stone', x: 100, y: 13 },   // frames the rising steps
    { stamp: 'tree_glow', x: 112, y: 11 },    // exit plateau canopy
    { stamp: 'statue', x: 117, y: 11 },       // guardian watching the portal
    { stamp: 'crystal_big', x: 123, y: 11 },  // beacon behind the exit
  ],
};
