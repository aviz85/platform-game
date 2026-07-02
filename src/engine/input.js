// Keyboard input with edge detection.
const MAP = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'jump', KeyW: 'jump', Space: 'jump', KeyZ: 'jump',
  KeyX: 'attack', KeyJ: 'attack',
  ShiftLeft: 'dash', ShiftRight: 'dash', KeyK: 'dash', KeyC: 'dash',
  Enter: 'start', Escape: 'pause', KeyM: 'mute',
};

export class Input {
  constructor() {
    this.down = {};
    this.pressed = {};
    this.anyKey = false;
    window.addEventListener('keydown', (e) => {
      const a = MAP[e.code];
      this.anyKey = true;
      if (!a) return;
      if (!this.down[a]) this.pressed[a] = true;
      this.down[a] = true;
      if (['jump', 'left', 'right', 'start'].includes(a)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => {
      const a = MAP[e.code];
      if (a) this.down[a] = false;
    });
    window.addEventListener('blur', () => { this.down = {}; });
  }
  // call at END of each frame
  endFrame() { this.pressed = {}; this.anyKey = false; }
  isDown(a) { return !!this.down[a]; }
  justPressed(a) { return !!this.pressed[a]; }
}
