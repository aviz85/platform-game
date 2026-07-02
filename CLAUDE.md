# OpenWolf

@.wolf/OPENWOLF.md

This project uses OpenWolf for context management. Read and follow .wolf/OPENWOLF.md every session. Check .wolf/cerebrum.md before generating code. Check .wolf/anatomy.md before reading files.

# AETHERFALL — pixel-art platformer

- Pure browser ES modules, no build step. Run: `python3 -m http.server 8765` → http://localhost:8765
- Content modules (art/audio/levels/behaviors) are agent-built against `CONTRACTS.md`.
- Validate any content module: `node tools/validate.mjs <file>` (or `all`).
- Engine spine lives in `src/engine` + `src/game` — content modules must never import from there.
- Art is 100% procedural (canvas pixel drawing) via `src/content/art/util.js` helpers, palette locked to `src/content/art/palette.js`.
