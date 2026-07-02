// Central content registry. Every module here is built by a dedicated agent
// against CONTRACTS.md. Filenames are FIXED — do not rename.

// --- art: characters ---
import * as hero from './art/hero.js';
import * as enemy_drone from './art/enemy_drone.js';
import * as enemy_crawler from './art/enemy_crawler.js';
import * as enemy_floater from './art/enemy_floater.js';
import * as enemy_sentinel from './art/enemy_sentinel.js';
import * as enemy_slime from './art/enemy_slime.js';
import * as enemy_wraith from './art/enemy_wraith.js';
import * as boss_colossus_art from './art/boss_colossus.js';
// --- art: tilesets + props ---
import * as tiles_forest from './art/tiles_forest.js';
import * as tiles_ruins from './art/tiles_ruins.js';
import * as tiles_depths from './art/tiles_depths.js';
import * as props_forest from './art/props_forest.js';
import * as props_ruins from './art/props_ruins.js';
import * as props_depths from './art/props_depths.js';
// --- art: parallax backgrounds (far → mid → near → foreground) ---
import * as bg_forest_far from './art/bg_forest_far.js';
import * as bg_forest_mid from './art/bg_forest_mid.js';
import * as bg_forest_near from './art/bg_forest_near.js';
import * as bg_forest_fg from './art/bg_forest_fg.js';
import * as bg_ruins_far from './art/bg_ruins_far.js';
import * as bg_ruins_mid from './art/bg_ruins_mid.js';
import * as bg_ruins_near from './art/bg_ruins_near.js';
import * as bg_ruins_fg from './art/bg_ruins_fg.js';
import * as bg_depths_far from './art/bg_depths_far.js';
import * as bg_depths_mid from './art/bg_depths_mid.js';
import * as bg_depths_near from './art/bg_depths_near.js';
import * as bg_depths_fg from './art/bg_depths_fg.js';
// --- art: misc ---
import * as fx_particles from './art/fx_particles.js';
import * as ui_kit from './art/ui_kit.js';
import * as collectibles from './art/collectibles.js';
import * as portal from './art/portal.js';
import * as title_art from './art/title_art.js';
// --- audio ---
import { SFX } from './audio/sfx.js';
import * as music_title from './audio/music_title.js';
import * as music_forest from './audio/music_forest.js';
import * as music_ruins from './audio/music_ruins.js';
import * as music_depths from './audio/music_depths.js';
import * as music_boss from './audio/music_boss.js';
// --- levels ---
import * as level1 from './levels/level1.js';
import * as level2 from './levels/level2.js';
import * as level3 from './levels/level3.js';
import * as level4 from './levels/level4.js';
import * as level5 from './levels/level5.js';
import * as level6 from './levels/level6.js';
// --- behaviors ---
import * as b_drone from './behaviors/drone.js';
import * as b_crawler from './behaviors/crawler.js';
import * as b_floater from './behaviors/floater.js';
import * as b_sentinel from './behaviors/sentinel.js';
import * as b_slime from './behaviors/slime.js';
import * as b_wraith from './behaviors/wraith.js';
import * as b_boss from './behaviors/boss_colossus.js';

function safeBuild(mod, name) {
  try { return mod.build(); }
  catch (e) { console.error(`content build failed: ${name}`, e); return null; }
}

export function loadContent() {
  const ART = {
    hero: safeBuild(hero, 'hero'),
    enemy_drone: safeBuild(enemy_drone, 'enemy_drone'),
    enemy_crawler: safeBuild(enemy_crawler, 'enemy_crawler'),
    enemy_floater: safeBuild(enemy_floater, 'enemy_floater'),
    enemy_sentinel: safeBuild(enemy_sentinel, 'enemy_sentinel'),
    enemy_slime: safeBuild(enemy_slime, 'enemy_slime'),
    enemy_wraith: safeBuild(enemy_wraith, 'enemy_wraith'),
    boss_colossus: safeBuild(boss_colossus_art, 'boss_colossus'),
    fx_particles: safeBuild(fx_particles, 'fx_particles'),
    ui_kit: safeBuild(ui_kit, 'ui_kit'),
    collectibles: safeBuild(collectibles, 'collectibles'),
    portal: safeBuild(portal, 'portal'),
    title_art: safeBuild(title_art, 'title_art'),
  };
  const TILESETS = {
    forest: safeBuild(tiles_forest, 'tiles_forest'),
    ruins: safeBuild(tiles_ruins, 'tiles_ruins'),
    depths: safeBuild(tiles_depths, 'tiles_depths'),
  };
  const PROPS = {
    forest: safeBuild(props_forest, 'props_forest'),
    ruins: safeBuild(props_ruins, 'props_ruins'),
    depths: safeBuild(props_depths, 'props_depths'),
  };
  const BACKGROUNDS = {
    forest: [bg_forest_far, bg_forest_mid, bg_forest_near, bg_forest_fg].map((m, i) => safeBuild(m, 'bg_forest_' + i)),
    ruins: [bg_ruins_far, bg_ruins_mid, bg_ruins_near, bg_ruins_fg].map((m, i) => safeBuild(m, 'bg_ruins_' + i)),
    depths: [bg_depths_far, bg_depths_mid, bg_depths_near, bg_depths_fg].map((m, i) => safeBuild(m, 'bg_depths_' + i)),
  };
  const MUSIC = {
    title: music_title.track,
    forest: music_forest.track,
    ruins: music_ruins.track,
    depths: music_depths.track,
    boss: music_boss.track,
  };
  const BEHAVIORS = {
    drone: b_drone.behavior,
    crawler: b_crawler.behavior,
    floater: b_floater.behavior,
    sentinel: b_sentinel.behavior,
    slime: b_slime.behavior,
    wraith: b_wraith.behavior,
    boss_colossus: b_boss.behavior,
  };
  const LEVELS = [level1.level, level2.level, level3.level, level4.level, level5.level, level6.level];
  return { ART, TILESETS, PROPS, BACKGROUNDS, MUSIC, BEHAVIORS, LEVELS, SFX };
}
