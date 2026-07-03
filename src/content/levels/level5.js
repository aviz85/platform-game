// AETHERFALL — Level 5: NEON DEPTHS (biome: depths, music: depths)
// The hazard gauntlet. Hardest regular level — every section is a hazard setpiece
// with a readable rhythm and a shard trail marking the honest line through it.
//
// Layout (160 cols x 20 rows), left → right:
//   A (cols 1-17)    spawn chamber — teaches energy vents with one safe 2-wide vent.
//   B (cols 18-44)   low spike corridor — 5-tall crawlspace, five vent clusters with
//                    2-3 col safe islands between them, two slimes hopping the rhythm.
//   C (cols 45-58)   pipe shaft UP — zig-zag one-way grates ('='), a wraith phasing
//                    through the shaft, a sentinel holding the top slab.
//   D (cols 59-95)   upper gauntlet — walkway islands over a full spike pit; a 5-gap,
//                    a 6-wide DASH gap, then a 5-gap crossing a hazard-striped sentinel
//                    tower. Recovery grate ladder at cols 73-76 — a rung at col 73 rejoins
//                    the NEAR island so a missed gap = retry (fall ≠ reset, no bypass). Secret
//                    grate ledge at the ceiling (cols 70-71) hiding a heart + shard.
//   E (cols 93-107)  pipe shaft DOWN — staggered grates break the fall, spikes under
//                    the first drop, a wraith weaving between grates; low passage out.
//   F (cols 109-143) final vent corridor — five vent clusters, two hazard-block
//                    sentinel towers; the heart perch (cols 121-123) is reached by a
//                    5-wide DASH jump FROM the first tower, past its sentinel.
//   G (cols 144-158) exit chamber — two steps up to the portal pedestal, reactor core
//                    humming behind the portal.
//
// Enemy pacing: slimes own the floors, wraiths own the shafts, sentinels own the
// sightlines. 13 enemies total, each anchored to a setpiece — no spam.
// Pickups: 34 shards (trail = the intended line), 2 hearts (1 secret, 1 guarded).

export const level = {
  name: 'NEON DEPTHS',
  biome: 'depths',
  music: 'depths',
  skyColor: '#08111c',

  spawn: { x: 3, y: 16 },
  exit: { x: 154, y: 14 },

  // '.' air  '#' solid  'X' heavy block  '=' one-way grate  '^' energy vent
  // '*' shard  'H' heart — decor: g cables, c neon shard, v hanging cable,
  // l warning light, r vent grill
  map: [
    '################################################################################################################################################################',
    '#....v...v........###########################......v...v........v..................v...............v........#..........v...............v............v..........#',
    '#.................###########################.........................*H....................................#..................................................#',
    '#.................###########################.........................==....................................#..................................................#',
    '#.................###########################....................*.*......*.*.......*.*.....................#..................................................#',
    '#.................###########################.............*...l...........................g.................#..................................................#',
    '#.................###########################.........##########.....####......####.....#####...............#..................................................#',
    '#.................###########################..*......##########.....####......####.....#####...............#..................................................#',
    '#.................###########################.====.......................=...................#.*............#..................................................#',
    '#.................###########################................................................#====..........#..................................................#',
    '#.................###########################.........*......................................#..............#..................................................#',
    '#.................###########################........====.................===................#..............#............*H*...................................#',
    '#......................v...............v............................................XX.......#r......*......#............===...................................#',
    '#...............................*...............*...................................XX.......#......====.............................*.................*.......#',
    '#...........**.....r.*....*..........*...*.....====.......................===.......XX.......#...............r.*..XX..*.....*...XX........*.........*...c...g..#',
    '#.......*.......*........................................r.................*........XX.......#...........*....l...XX....l.......XX.l.............*l...##########',
    '#...g......l^^.......^^...^^l..^^^...^^..^^g.c..............^^^^^^^^^^^^^.....^^^^^^XX^^^^^^^#..^^^^......c....^^.XX..^^....^^g.XX..^^^..c^^.......#############',
    '################################################################################################################################################################',
    '################################################################################################################################################################',
    '################################################################################################################################################################',
  ],

  entities: [
    // B — spike corridor: slimes hop the safe islands between vent clusters
    { type: 'slime', x: 24, y: 16 },
    { type: 'slime', x: 35, y: 16 },
    // C — shaft up: wraith phases through the grate ladder, sentinel holds the top
    { type: 'wraith', x: 52, y: 12 },
    { type: 'sentinel', x: 56, y: 5 },
    // D — upper gauntlet: sentinel on the far island, one on the mid-gap tower,
    //     wraith patrolling the dash gap
    { type: 'wraith', x: 76, y: 9 },
    { type: 'sentinel', x: 80, y: 5 },
    { type: 'sentinel', x: 84, y: 11 },
    // E — descent shaft: wraith weaving between the drop grates
    { type: 'wraith', x: 100, y: 10 },
    // F — final corridor: sentinels on both hazard towers, slimes between vents
    { type: 'sentinel', x: 114, y: 13 },
    { type: 'slime', x: 121, y: 16 },
    { type: 'sentinel', x: 128, y: 13 },
    { type: 'slime', x: 136, y: 16 },
    // G — last wraith drifting before the exit chamber
    { type: 'wraith', x: 145, y: 12 },
  ],

  // props_depths stamps: reactor_core, pipe_cluster, mech_husk, neon_sign, vent_stack
  decor: [
    { stamp: 'neon_sign', x: 7, y: 16 },      // spawn chamber signage
    { stamp: 'mech_husk', x: 50, y: 16 },     // dead machine at the shaft base
    { stamp: 'pipe_cluster', x: 75, y: 16 },  // pit safe-zone landmark
    { stamp: 'mech_husk', x: 105, y: 16 },    // wreck at the descent landing
    { stamp: 'vent_stack', x: 116, y: 16 },   // steaming stack in the gauntlet
    { stamp: 'pipe_cluster', x: 140, y: 16 }, // corridor exit pipes
    { stamp: 'reactor_core', x: 156, y: 14 }, // glowing core behind the portal
  ],
};
