# anatomy.md

> Auto-maintained by OpenWolf. Last scanned: 2026-07-02T19:24:11.198Z
> Files: 71 tracked | Anatomy hits: 0 | Misses: 0

## ../../../private/tmp/claude-501/-Users-aviz-platform-game/d7270599-ac6e-43c3-acde-813f52a52c4b/scratchpad/

- `audit_slime.mjs` — Raster audit for enemy_slime.js: real pixel buffer, checks frame-cell bleed, (~1216 tok)
- `bg_mid_viewer.html` — Declares r (~336 tok)
- `boss_verify.mjs` — Minimal real software canvas to render boss_colossus.js sheet to BMP for visual QA. (~1367 tok)
- `check_fg.mjs` — Pixel-level sanity check for bg_ruins_fg: real software canvas shim. (~848 tok)
- `floater_verify.mjs` — Software rasterizer implementing the ctx subset used by enemy_floater.js, (~1445 tok)
- `gen_level1.py` — Generates the level1 map grid, runs sanity checks, prints JS map literals. (~1137 tok)
- `gen_level2.mjs` — Scratch generator for level2 "CRYSTAL CANOPY" map — emits aligned row strings. (~1209 tok)
- `gen_level4.mjs` — Generator for level4 "THE RAMPARTS" — emits src/content/levels/level4.js (~2382 tok)
- `genmap.py` — fill, put (~1016 tok)
- `hero_render.mjs` — Software canvas rasterizer to render hero.js sprite sheet to a real PNG. (~1233 tok)
- `pixcheck.mjs` — Real-pixel sanity check for enemy_crawler.js using a software canvas. (~1652 tok)
- `preview.mjs` — Renders title_art.js with a real pixel-buffer canvas shim and writes a PNG preview. (~1112 tok)
- `render_bg.mjs` — Offline rasterizer: minimal canvas (fillRect + clearRect + globalAlpha) -> PNG preview. (~1451 tok)
- `render_depths_fg.mjs` — Minimal real rasterizer for bg_depths_fg (fillRect + globalAlpha only), PNG out. (~1107 tok)
- `render_depths_mid.mjs` — Render bg_depths_mid.js to a real PNG using a minimal software canvas. (~1244 tok)
- `render_depths_near_v2.mjs` — Software raster of bg_depths_near -> PNG, for visual QC. (~1230 tok)
- `render_fg.mjs` — Render bg_forest_fg.js to a PNG using a minimal software canvas. (~1681 tok)
- `render_ruins_far.mjs` — Software-canvas render of bg_ruins_far to PNG for visual inspection. (~945 tok)
- `render_ruins_fg.mjs` — Render bg_ruins_fg to PPM (composited over a flat warm sky) — 2 tiles wide to inspect the seam. (~834 tok)
- `render_tiles_ruins.mjs` — Software canvas shim -> render tiles_ruins.js to PNG for visual inspection. (~2043 tok)
- `verify_depths_far.mjs` — Software-rasterize bg_depths_far.js and emit a PNG + seam/opacity report. (~1577 tok)
- `verify_ruins_fg.mjs` — Adversarial verifier for bg_ruins_fg.js — real pixel simulation. (~862 tok)
- `zoom_mid.mjs` — Crop + 3x zoom of bg_forest_mid over sky color (~929 tok)

## ./

- `CLAUDE.md` — OpenWolf (~57 tok)

## .claude/

- `settings.json` (~441 tok)

## .claude/rules/

- `openwolf.md` (~313 tok)

## src/content/art/

- `bg_depths_fg.js` — AETHERFALL — bg_depths_fg (~3562 tok)
- `bg_depths_mid.js` — AETHERFALL — NEON DEPTHS mid parallax layer (factor ~0.4) (~5726 tok)
- `bg_depths_near.js` — AETHERFALL — bg_depths_near: NEON DEPTHS near parallax layer (factor 0.7). (~3902 tok)
- `bg_forest_far.js` — AETHERFALL — bg_forest_far: LUMEN WOODS far parallax layer (factor 0.1). (~3665 tok)
- `bg_forest_mid.js` — AETHERFALL — LUMEN WOODS mid parallax layer (factor ~0.4) (~3445 tok)
- `bg_forest_near.js` — AETHERFALL — bg_forest_near — LUMEN WOODS near parallax layer (factor 0.7) (~4618 tok)
- `bg_ruins_far.js` — AETHERFALL — bg_ruins_far — SKY BASTION far layer. (~3602 tok)
- `boss_colossus.js` — AETHERFALL — BOSS: THE COLOSSUS (~4160 tok)
- `collectibles.js` — AETHERFALL collectibles — 'shard' (spinning cyan crystal, 6 frames) and (~1991 tok)
- `enemy_crawler.js` — AETHERFALL — enemy_crawler: armored beetle-mech ground walker. (~2664 tok)
- `enemy_drone.js` — AETHERFALL — enemy_drone: hovering scout robot. (~1841 tok)
- `enemy_floater.js` — Draw one floater into frame (ox,oy). (~1874 tok)
- `enemy_sentinel.js` — AETHERFALL — SENTINEL enemy sprite. (~2336 tok)
- `enemy_slime.js` — AETHERFALL — enemy_slime: glowing cyan-green energy slime with a tiny magenta (~1962 tok)
- `enemy_wraith.js` — AETHERFALL — enemy_wraith: spectral hooded ghost of the lost civilization. (~2544 tok)
- `fx_particles.js` — AETHERFALL — fx_particles: tiny 8x8 particle sprites, all designed to fade out (~2770 tok)
- `hero.js` — AETHERFALL — HERO sprite sheet. (~4449 tok)
- `portal.js` — AETHERFALL — level-exit PORTAL sprite (kind: sprite) (~2503 tok)
- `props_depths.js` — AETHERFALL — props_depths.js — NEON DEPTHS scenic props (kind: props) (~5094 tok)
- `props_forest.js` — AETHERFALL — props_forest.js — LUMEN WOODS scenic props (kind: props) (~5235 tok)
- `props_ruins.js` — AETHERFALL — props_ruins.js — SKY BASTION scenic props (kind: props) (~5233 tok)
- `tiles_depths.js` — AETHERFALL — NEON DEPTHS tileset (biome: depths) (~5147 tok)
- `tiles_forest.js` — AETHERFALL — LUMEN WOODS tileset (forest biome) (~5040 tok)
- `tiles_ruins.js` — AETHERFALL — tiles_ruins.js — SKY BASTION tileset (biome: ruins) (~4678 tok)
- `title_art.js` — AETHERFALL — title logo (kind: titleart) (~2347 tok)
- `ui_kit.js` — AETHERFALL — UI kit: HUD icons + bitmap font. (~2562 tok)

## src/content/audio/

- `music_boss.js` — AETHERFALL — music_boss.js (~2067 tok)
- `music_depths.js` — AETHERFALL — music: NEON DEPTHS (~1991 tok)
- `music_forest.js` — AETHERFALL — music_forest.js (~1640 tok)
- `music_ruins.js` — AETHERFALL — music: "SKY BASTION" (ruins theme) (~2659 tok)
- `music_title.js` — AETHERFALL — TITLE theme: "Shattered Moons" (~1354 tok)
- `sfx.js` — AETHERFALL — retro-futuristic SFX set (crystal-punk chip palette) (~1352 tok)

## src/content/behaviors/

- `boss_colossus.js` — AETHERFALL — behavior: BOSS COLOSSUS (sprite: boss_colossus) (~5035 tok)
- `crawler.js` — AETHERFALL behavior — crawler (~1753 tok)
- `drone.js` — AETHERFALL — behavior: DRONE (sprite: enemy_drone) (~1874 tok)
- `floater.js` — AETHERFALL — behavior: FLOATER (sprite: enemy_floater) (~1570 tok)
- `sentinel.js` — AETHERFALL — behavior: SENTINEL (sprite: enemy_sentinel) (~2293 tok)
- `slime.js` — AETHERFALL behavior — slime (~2117 tok)
- `wraith.js` — AETHERFALL — behavior: WRAITH (sprite: enemy_wraith) (~2381 tok)

## src/content/levels/

- `level1.js` — AETHERFALL — level1.js — "LUMEN WOODS" (kind: level) (~1588 tok)
- `level2.js` — AETHERFALL — Level 2: "CRYSTAL CANOPY" (forest biome, verticality) (~1990 tok)
- `level3.js` — AETHERFALL — level3.js — "SKY BASTION" (kind: level) (~1827 tok)
- `level5.js` — AETHERFALL — Level 5: NEON DEPTHS (biome: depths, music: depths) (~2061 tok)
- `level6.js` — AETHERFALL — level6.js — "THE REACTOR HEART" (kind: level) (~1246 tok)

## tools/

- `integration.mjs` — Headless integration test: load real content + engine, build every level, (~1587 tok)
