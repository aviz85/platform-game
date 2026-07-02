// AETHERFALL master palette — crystal-punk: ancient stone + living crystal + neon tech.
// Light source: upper-left. Outline color: PAL.outline (never pure black).
export const PAL = {
  // core darks
  outline:    '#1a1030',
  void:       '#0b0716',
  deepPurple: '#241537',
  shadow:     '#2e2149',

  // stone / metal ramps
  stone3: '#3a3352', stone2: '#544a75', stone1: '#7a6f9e', stone0: '#a89fc7',
  metal3: '#2d3548', metal2: '#46536e', metal1: '#68789b', metal0: '#93a5c4',
  rust2:  '#6e3b4a', rust1: '#9a5c5e', rust0: '#c98a6d',

  // crystal / neon (emissive)
  cyan3: '#0e5e78', cyan2: '#19a0b8', cyan1: '#3fd6e8', cyan0: '#9ff4ff',
  magenta3: '#6d1b6e', magenta2: '#a832a0', magenta1: '#e156cf', magenta0: '#ff9bea',
  violet3: '#41246e', violet2: '#6b3fa8', violet1: '#9a6de0', violet0: '#c9a8ff',

  // nature (crystal forest)
  leaf3: '#14493f', leaf2: '#1f7a57', leaf1: '#3fb56f', leaf0: '#8ce8a0',
  moss2: '#2c5a4a', moss1: '#4a8a68',

  // warm accents
  amber2: '#8a4a1e', amber1: '#d9822b', amber0: '#ffc860',
  gold1:  '#e8b93f', gold0: '#fff0a8',
  ember2: '#8a2635', ember1: '#d94f4f', ember0: '#ff9e7d',

  // character / UI
  skin1: '#d9a066', skin0: '#f2cfa0',
  hero1: '#2c7ac9', hero0: '#6cc5f2',
  heroSuit2: '#1d3a5f', heroSuit1: '#2c5f8a',
  white: '#f4f1ff', pink1: '#ff5c8a', pink0: '#ffc2d4',

  // sky ramps (backgrounds)
  skyTop: '#150c2e', skyMid: '#2c1a52', skyLow: '#4a2a72', skyGlow: '#7a4a9e',
  horizon: '#b86ba8', sun: '#ffd9a0',
};

// convenience ordered ramps
export const RAMPS = {
  stone: ['#a89fc7', '#7a6f9e', '#544a75', '#3a3352'],
  metal: ['#93a5c4', '#68789b', '#46536e', '#2d3548'],
  crystal: ['#9ff4ff', '#3fd6e8', '#19a0b8', '#0e5e78'],
  violet: ['#c9a8ff', '#9a6de0', '#6b3fa8', '#41246e'],
  leaf: ['#8ce8a0', '#3fb56f', '#1f7a57', '#14493f'],
  amber: ['#ffc860', '#d9822b', '#8a4a1e'],
};
