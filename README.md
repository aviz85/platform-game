# AETHERFALL

A crystal-punk fantasy-scifi pixel-art platformer. 100% procedural — every sprite,
tile, parallax layer, sound effect and music track is generated in code at load time.
No image or audio assets, no build step, no dependencies.

![genre](https://img.shields.io/badge/genre-platformer-blueviolet)
![tech](https://img.shields.io/badge/tech-vanilla%20JS%20%2B%20canvas%20%2B%20WebAudio-9cf)

## Play

```bash
python3 -m http.server 8765
# → http://localhost:8765
```

**Controls:** Arrows/WASD move · Space jump (variable height, coyote time, buffer) ·
X attack · Shift dash · M mute

## World

Three biomes across six levels — the Lumen Woods, the Sky Bastion, the Neon Depths —
ending at The Reactor Heart boss arena. Four parallax background layers per biome
**plus a foreground layer** drawn over gameplay. Six enemy types + one boss, each
with its own behavior module. Chiptune soundtrack composed as note-pattern data,
played by a WebAudio sequencer with a space-echo bus.

## Architecture

- `src/engine/` — loop, input, tile physics, camera, animator, particles, renderer, audio synth+sequencer
- `src/game/` — player controller, world/entities, HUD, title, state machine (`src/main.js`)
- `src/content/` — 50 content modules (art / audio / levels / behaviors), each built by a
  dedicated AI agent against `CONTRACTS.md` and checked by `tools/validate.mjs`
- Palette locked in `src/content/art/palette.js`; drawing helpers in `src/content/art/util.js`

Built from zero by Claude Code orchestrating ~200 agents in one workflow
(build → adversarial verify → polish → cross-cutting critics → targeted fixes).
