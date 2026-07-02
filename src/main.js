// AETHERFALL — boot + game state machine.
import { Loop } from './engine/loop.js';
import { Input } from './engine/input.js';
import { AudioEngine } from './engine/audio.js';
import { Camera } from './engine/camera.js';
import { Particles } from './engine/particles.js';
import { World } from './game/world.js';
import { HUD } from './game/hud.js';
import { Title } from './game/title.js';
import { loadContent } from './content/registry.js';

const W = 480, H = 270;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

function fit() {
  const s = Math.max(1, Math.floor(Math.min(window.innerWidth / W, window.innerHeight / H)));
  canvas.style.width = W * s + 'px';
  canvas.style.height = H * s + 'px';
}
window.addEventListener('resize', fit);
fit();

const content = loadContent();
const input = new Input();
const audio = new AudioEngine();
audio.sfxMap = content.SFX;
audio.musicMap = content.MUSIC;

const camera = new Camera(W, H);
const particles = new Particles(content.ART.fx_particles);
const hud = new HUD(content.ART.ui_kit);
const title = new Title(content, W, H);

let state = 'title';
let levelIdx = 0;
let world = null;
let fade = 1;          // 1 = black, 0 = clear
let fadeDir = -1;      // -1 fading in, +1 fading out
let pendingState = null;
let victoryT = 0, gameOverT = 0;
let totalShards = 0;

function startLevel(idx) {
  levelIdx = idx;
  const def = content.LEVELS[idx];
  world = new World(def, content, audio, camera, particles, W, H);
  world.player.shards = totalShards;
  particles.list = [];
  audio.playMusic(def.music || 'forest');
  hud.showToast(def.name || `SECTOR ${idx + 1}`, 3);
}

function goto(next, andThen) {
  fadeDir = 1;
  pendingState = { next, andThen };
}

function update(dt, time) {
  // fade transitions
  fade += fadeDir * dt * 2.4;
  if (fade >= 1 && pendingState) {
    fade = 1;
    state = pendingState.next;
    if (pendingState.andThen) pendingState.andThen();
    pendingState = null;
    fadeDir = -1;
  }
  if (fade <= 0) { fade = 0; if (fadeDir < 0) fadeDir = 0; }

  if (input.justPressed('mute')) audio.toggleMute();

  if (state === 'title') {
    title.update(dt);
    if (input.anyKey) audio.unlock();
    audio.playMusic('title');
    if (input.justPressed('start') || input.justPressed('jump')) {
      audio.unlock();
      audio.playSfx('menu');
      totalShards = 0;
      goto('play', () => startLevel(0));
    }
  } else if (state === 'play') {
    world.update(dt, input);
    if (world.completed && world.completeT > 0.9 && !pendingState) {
      totalShards = world.player.shards;
      audio.playSfx('menu');
      if (levelIdx + 1 < content.LEVELS.length) {
        goto('play', () => startLevel(levelIdx + 1));
      } else {
        goto('victory', () => { victoryT = 0; audio.playMusic('title'); });
      }
    }
    if (world.events.includes('bossDead') && !world._victoryQueued) {
      world._victoryQueued = true;
      setTimeout(() => {}, 0);
    }
    if (world.player.dead && world.player.deathT > 1.6 && !pendingState) {
      goto('gameover', () => { gameOverT = 0; audio.stopMusic(); });
    }
  } else if (state === 'gameover') {
    gameOverT += dt;
    if (gameOverT > 0.8 && (input.justPressed('start') || input.justPressed('jump') || input.justPressed('attack'))) {
      audio.playSfx('menu');
      goto('play', () => startLevel(levelIdx)); // retry same level
    }
  } else if (state === 'victory') {
    victoryT += dt;
    if (victoryT > 2 && (input.justPressed('start') || input.justPressed('jump'))) {
      goto('title', () => {});
    }
  }
  input.endFrame();
}

function render(dt, time) {
  ctx.clearRect(0, 0, W, H);
  if (state === 'title') {
    title.draw(ctx, hud);
  } else if (state === 'play') {
    world.draw(ctx);
    hud.draw(ctx, world, dt, W, H);
  } else if (state === 'gameover') {
    ctx.fillStyle = '#0b0716'; ctx.fillRect(0, 0, W, H);
    hud.drawText(ctx, 'SIGNAL LOST', W / 2, 100, 2, 'center');
    if (gameOverT > 0.8 && (time * 1.4 | 0) % 2 === 0) {
      hud.drawText(ctx, 'PRESS ENTER TO RETRY', W / 2, 140, 1, 'center');
    }
  } else if (state === 'victory') {
    ctx.fillStyle = '#0b0716'; ctx.fillRect(0, 0, W, H);
    title.update(dt); title.draw(ctx, hud);
    ctx.fillStyle = 'rgba(11,7,22,0.6)'; ctx.fillRect(0, 0, W, H);
    hud.drawText(ctx, 'THE AETHER IS FREE', W / 2, 90, 2, 'center');
    hud.drawText(ctx, `SHARDS COLLECTED: ${totalShards}`, W / 2, 125, 1, 'center');
    if (victoryT > 2 && (time * 1.4 | 0) % 2 === 0) {
      hud.drawText(ctx, 'PRESS ENTER', W / 2, 160, 1, 'center');
    }
  }
  if (fade > 0) {
    ctx.fillStyle = `rgba(5,3,12,${Math.min(1, fade)})`;
    ctx.fillRect(0, 0, W, H);
  }
}

new Loop(update, render).start();
