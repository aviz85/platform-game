// AETHERFALL — level6.js — "THE REACTOR HEART" (kind: level)
//
// Final boss arena, deep in the Neon Depths. Structure:
//   cols  0-19  approach corridor: a quiet, humming machine-hall. One vent-spike
//               gap bridged by a catwalk platform, a shard trail, and a heart on
//               a riveted pedestal — the calm before the fight.
//   cols 20-21  raised blast-door lip (3 tiles): jump over, drop into the arena.
//               No easy way back — commit to the fight.
//   cols 22-71  the arena proper: flat reactor floor, sealed walls both sides,
//               two one-way catwalk platforms (left + right) for dodging phase-2
//               radial bursts and phase-3 spirals, boss_colossus centered right
//               in front of the exposed reactor core, exit portal far right
//               (outside the boss's ±200px clamp range).
//
// Decor tile chars (tiles_depths): g cable clumps · c neon shard · v hanging
// cable · l warning light · r wall vent grill.
// Props stamps (props_depths): reactor_core, pipe_cluster, mech_husk,
// neon_sign, vent_stack.
//
// Map is 74 cols x 20 rows. Floor top = row 17 (stand row 16). Side platforms
// at row 13 (3-tile jump). Gate lip top = row 14 (stand row 13).
//
// FAIR SECRET: a hidden maintenance shelf (one-way = at row 10, cols 9-11) with a
// 3-shard cache above it (row 9). Unreachable from the floor (jump peak ~4.5 tiles
// tops out at row 11.5); you must first climb the entrance catwalk (row 13), then
// hop the extra 3 tiles up onto the shelf — a two-step climb telegraphed by the
// vertical shard tower (row 12 over the catwalk, row 9 over the shelf).

export const level = {
  name: 'THE REACTOR HEART',
  biome: 'depths',
  music: 'boss',
  skyColor: '#0d0820',

  spawn: { x: 4, y: 16 },
  exit:  { x: 69, y: 16 },

  //        0         1         2         3         4         5         6         7
  //        01234567890123456789012345678901234567890123456789012345678901234567890123
  map: [
    '##########################################################################', // 0  ceiling
    '##....v.....v............v.......v..........v............v........v.....##', // 1  hanging cables
    '##......................................................................##', // 2
    '##......................................................................##', // 3
    '##l.........................................l..........................l##', // 4  warning lights (+ over-fight beacon)
    '##......................................................................##', // 5
    '##r...............................r.........................r..........r##', // 6  vent grills (+ arena wall vents)
    '##......................................................................##', // 7
    '##......................................................................##', // 8
    '##.......***............................................................##', // 9  SECRET: hidden shard cache on the shelf below
    '##.......===............................................................##', // 10 secret one-way shelf (reach from the entrance catwalk)
    '##........c.............................................................##', // 11 neon glint hinting the shard tower above
    '##.......***.................*..................................*.......##', // 12 shard trail + platform rewards
    '##.......====......l..l....=====..............................=====.....##', // 13 catwalks + gate lights
    '##.....*........H...##..*...............................................##', // 14 heart on pedestal, gate lip, arena-drop shard
    '##...*..........X.*.##.*............................................*...##', // 15 pedestal, gate lip, drop trail + exit-pull shard
    '##........^^.g..X...##....c........g....c.......g.......c...g......c....##', // 16 vent spikes, pedestal, dense reactor floor decor
    '##########################################################################', // 17 reactor floor
    '##########################################################################', // 18
    '##########################################################################', // 19
  ],

  entities: [
    { type: 'boss_colossus', x: 52, y: 16 }, // centered right, before the core
  ],

  decor: [
    { stamp: 'vent_stack',   x: 3,  y: 16 }, // corridor: hissing stack by the spawn
    { stamp: 'pipe_cluster', x: 12, y: 16 }, // corridor: pipes under the catwalk
    { stamp: 'neon_sign',    x: 17, y: 3  }, // corridor: hanging glyph sign over the pedestal
    { stamp: 'vent_stack',   x: 24, y: 16 }, // arena entry: steam column
    { stamp: 'mech_husk',    x: 30, y: 16 }, // arena: fallen mech beneath the left catwalk
    { stamp: 'neon_sign',    x: 44, y: 3  }, // arena: hanging sign over the fight
    { stamp: 'reactor_core', x: 50, y: 16 }, // arena: THE reactor heart, behind the boss
    { stamp: 'pipe_cluster', x: 22, y: 16 }, // arena entry: pipework at the drop-in
    { stamp: 'mech_husk',    x: 40, y: 16 }, // arena: a second fallen mech mid-floor
    { stamp: 'vent_stack',   x: 58, y: 16 }, // arena: steam column right of the core
    { stamp: 'pipe_cluster', x: 64, y: 16 }, // arena: pipework under the right catwalk
  ],
};
