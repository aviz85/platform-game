// AETHERFALL — level4.js — "THE RAMPARTS" (kind: level)
//
// Sky Bastion, combat-focused. The player fights along the broken outer wall of
// the bastion: sentinel turrets dug in behind merlon cover, crawler packs
// holding the battlement stairs, a drop-in arena courtyard gated by a
// four-enemy fight, and hearts placed right after the two hardest engagements.
//
// Layout (cols):
//   0-17   spawn rampart — warm-up, one crawler, shard trail
//  18-33   SETPIECE 1: sentinel on a pedestal behind three merlon covers —
//          hop cover to cover between volleys, shards tucked in each shadow
//  34-55   battlement stairs ascending; crawler pack (3) holds the steps;
//          one-way flank platforms above reward a vertical dodge route
//  56-66   broken bridge pit — rebar spikes below, two pillar stumps as
//          safe rescues, floating masonry hops, a drone patrolling the gap
//  67-95   SETPIECE 2: crossfire courtyard — one sentinel perched on a ledge,
//          one on a pedestal, crawlers patrolling between; a cover tunnel
//          runs UNDER the ledge (rows 13-15). Heart on the far side.
//  96-111  lower ward descent — crawler pair + wraith harassment, spike hop;
//          one-way platform overhead hides a shard
// 112-137  THE ARENA: drop-in courtyard, sentinel dais in the middle, two
//          crawlers + a drone; escape is a one-way ledge up the right wall
//          (fluted column face). Heart waits on the wall top.
// 138-159  final ascent — crenellated battlement, last sentinel overlooking
//          the stairs, portal on the highest terrace flanked by braziers.
//
// Decor stamps from props_ruins: tower_broken, banner_pole, bridge_arch,
// guardian_statue, brazier_column, floating_masonry.
// Tile decor: g grass, c ornament, v banner scrap, l brazier, r holo-glyph.

export const level = {
  name: 'THE RAMPARTS',
  biome: 'ruins',
  music: 'ruins',
  skyColor: '#1a1030',
  spawn: { x: 3, y: 15 },
  exit:  { x: 156, y: 9 },
  map: [
    '................................................................................................................................................................',
    '................................................................................................................................................................',
    '................................................................................................................................................................',
    '................................................................................................................................................................',
    '................................................................................................................................................................',
    '................................................................................................................................................................',
    '................................................................................................................................................................',
    '................................................................................................................................................................',
    '................................................................................................................................................................',
    '...........................................*..............................*...............................................................................lg.*l.',
    '..........................................===.............................................................................................................######',
    '.....................................*....................................###........................................................................*..g.######',
    '.................................*..===...................................###....c..*.............*...............................................c*..##########',
    '...............................................*g.v.g....*..*....................................===.....................................l.H.rgX*.X.g.##########',
    '......*.*.*.............r...c..XX........*...v##########......##.*.......X.*.X.r..XX..................................................*.########################',
    '....g......g.l....gl.X*.gX*.gX*XX..g*.g.################..##..##....l.g..X...Xg...XX....Hg.l..g..........................*.........*....|#######################',
    '########################################################..##.......#############################r...g..*..g.^^................*...===...|#######################',
    '########################################################...........#############################################...*......XX..r..*......|#######################',
    '########################################################.|.......|.#############################################v.....g..cXX.g.......l.v|#######################',
    '########################################################.|.......|.#############################################################################################',
    '########################################################^|^^^^^^^|^#############################################################################################',
    '#########################################################|#######|##############################################################################################',
  ],
  entities: [
    { type: 'crawler', x: 12, y: 15 },
    { type: 'sentinel', x: 31, y: 13 },
    { type: 'crawler', x: 37, y: 15 },
    { type: 'crawler', x: 43, y: 14 },
    { type: 'crawler', x: 49, y: 13 },
    { type: 'drone', x: 60, y: 11 },
    { type: 'crawler', x: 68, y: 15 },
    { type: 'sentinel', x: 75, y: 10 },
    { type: 'crawler', x: 80, y: 15 },
    { type: 'sentinel', x: 82, y: 13 },
    { type: 'crawler', x: 99, y: 16 },
    { type: 'crawler', x: 101, y: 16 },
    { type: 'wraith', x: 105, y: 14 },
    { type: 'crawler', x: 116, y: 18 },
    { type: 'drone', x: 119, y: 15 },
    { type: 'sentinel', x: 122, y: 16 },
    { type: 'crawler', x: 128, y: 18 },
    { type: 'sentinel', x: 151, y: 11 },
  ],
  decor: [
    { stamp: 'guardian_statue', x: 1, y: 15 },
    { stamp: 'banner_pole', x: 15, y: 15 },
    { stamp: 'tower_broken', x: 24, y: 15 },
    { stamp: 'brazier_column', x: 34, y: 15 },
    { stamp: 'bridge_arch', x: 57, y: 20 },
    { stamp: 'floating_masonry', x: 60, y: 11 },
    { stamp: 'banner_pole', x: 69, y: 15 },
    { stamp: 'guardian_statue', x: 85, y: 15 },
    { stamp: 'tower_broken', x: 92, y: 15 },
    { stamp: 'brazier_column', x: 113, y: 18 },
    { stamp: 'guardian_statue', x: 119, y: 18 },
    { stamp: 'brazier_column', x: 132, y: 18 },
    { stamp: 'banner_pole', x: 140, y: 13 },
    { stamp: 'tower_broken', x: 145, y: 13 },
    { stamp: 'floating_masonry', x: 152, y: 5 },
  ],
};
