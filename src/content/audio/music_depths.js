// AETHERFALL — music: NEON DEPTHS
// Tense driving synthwave, 128 bpm, 32 bars, C minor. Form: A A' B A''.
//   A   (bars  0-7 ) : groove intro — pumping octave bass + drums, stabs creep in,
//                      long eerie tones drift in from bar 4.
//   A'  (bars  8-15) : full groove — dark saw stabs on syncopation, high square motif.
//   B   (bars 16-23) : harmonic lift (Fm / Ab / Db / G) — tension peaks on the major
//                      dominant, 16th hats push, lead climbs.
//   A'' (bars 24-31) : return, densest stabs, snare roll + bass walk-up into the loop.
// Progression: A = Cm Cm Ab Ab Bb Bb Gm Gm · B = Fm Fm Ab Ab Db Db G G
// Signature color: Ab5 -> F#5 -> G5 chromatic pivot in the lead (b6 / tritone / 5).
// Engine notes: decay = portion of note length; noise midi = highpass pitch of hiss
// (low midi ~ full-band kick thump, high midi ~ bright hat tick).

// ---- harmonic material -----------------------------------------------------
// root: bass register (oct 1-2) · stab: dark mid-register dyad (saw)
const CH = {
  Cm: { root: 36, stab: [63, 67] }, // Eb4 G4
  Ab: { root: 32, stab: [63, 68] }, // Eb4 Ab4
  Bb: { root: 34, stab: [65, 70] }, // F4  Bb4
  Gm: { root: 31, stab: [62, 67] }, // D4  G4
  Fm: { root: 29, stab: [60, 65] }, // C4  F4
  Db: { root: 37, stab: [61, 65] }, // Db4 F4
  G:  { root: 31, stab: [59, 67] }, // B3  G4  (major dominant — leading-tone tension)
};

// one chord name per bar, 32 bars
const PROG = [
  'Cm','Cm','Ab','Ab','Bb','Bb','Gm','Gm',   // A
  'Cm','Cm','Ab','Ab','Bb','Bb','Gm','Gm',   // A'
  'Fm','Fm','Ab','Ab','Db','Db','G','G',     // B
  'Cm','Cm','Ab','Ab','Bb','Bb','G','Gm',    // A'' (bar 30 = G major sting)
];

const FILL_BARS = [7, 15, 23, 31];           // section turnarounds

// ---- channel note arrays ---------------------------------------------------
const bass = [], stab = [], lead = [], kick = [], snare = [], hat = [];

// Bass: relentless pumping octaves on 16ths, locked to the kick.
// Turnaround bars swap the last 4 steps for a minor walk-up into the next section.
for (let bar = 0; bar < 32; bar++) {
  const r = CH[PROG[bar]].root;
  const fill = FILL_BARS.includes(bar);
  for (let s = 0; s < 16; s++) {
    if (fill && s >= 12) continue;
    bass.push([bar, s, s % 2 === 0 ? r : r + 12, 1]);
  }
  if (fill) {
    const walk = bar === 23 ? [0, 4, 7, 12] : [0, 3, 7, 10]; // major walk out of G
    for (let i = 0; i < 4; i++) bass.push([bar, 12 + i, r + walk[i], 1]);
  }
}

// Saw stabs: dark syncopated dyads. Bars 0-1 silent (naked groove intro),
// bars 2-7 sparse, bars 8+ full syncopation.
const STAB_SPARSE = [[3, 2], [11, 2]];
const STAB_FULL = [[3, 2], [6, 1], [11, 2], [14, 1]];
for (let bar = 2; bar < 32; bar++) {
  const d = CH[PROG[bar]].stab;
  const pat = bar < 8 ? STAB_SPARSE : STAB_FULL;
  for (const [s, len] of pat) {
    stab.push([bar, s, d[0], len]);
    stab.push([bar, s, d[1], len]);
  }
}

// Lead: eerie high square. Phrases with real rests — the echo fills the space.
// P_INTRO: long hovering tones. L8: 8-bar A-section melody. M8: B-section climb.
const P_INTRO = [ // bars 4-7 (over Bb Bb Gm Gm)
  [0, 0, 79, 10], [0, 12, 80, 4],            // G5 ... Ab5
  [1, 0, 77, 12],                            // F5 (long)
  [2, 0, 74, 6], [2, 8, 79, 8],              // D5 -> G5
  [3, 0, 80, 4], [3, 6, 78, 6],              // Ab5 -> F#5 (tritone slide home)
];
const L8 = [ // 8 bars over Cm Cm Ab Ab Bb Bb Gm Gm
  [0, 0, 84, 2], [0, 4, 84, 2], [0, 8, 87, 3], [0, 12, 84, 2],  // C6 C6 Eb6 C6
  [1, 0, 82, 2], [1, 4, 79, 6],                                 // Bb5 G5
  [2, 0, 80, 2], [2, 4, 84, 2], [2, 8, 87, 4],                  // Ab5 C6 Eb6
  [3, 0, 84, 2], [3, 4, 80, 6],                                 // C6 Ab5
  [4, 0, 82, 3], [4, 4, 84, 2], [4, 8, 86, 4], [4, 14, 87, 1],  // Bb5 C6 D6 .Eb6
  [5, 0, 89, 4], [5, 8, 86, 2], [5, 12, 84, 2],                 // F6 D6 C6
  [6, 0, 86, 2], [6, 4, 83, 4], [6, 10, 79, 2],                 // D6 B5(!) G5
  [7, 0, 80, 3], [7, 6, 78, 3], [7, 12, 79, 4],                 // Ab5 F#5 G5 pivot
];
const M8 = [ // 8 bars over Fm Fm Ab Ab Db Db G G
  [0, 0, 84, 4], [0, 8, 85, 2], [0, 12, 84, 2],                 // C6 Db6(rub) C6
  [1, 0, 80, 2], [1, 4, 77, 6],                                 // Ab5 F5
  [2, 0, 80, 2], [2, 4, 84, 3], [2, 8, 87, 4],                  // Ab5 C6 Eb6
  [3, 0, 85, 2], [3, 4, 84, 2], [3, 8, 80, 4],                  // Db6 C6 Ab5
  [4, 0, 85, 3], [4, 4, 84, 2], [4, 8, 80, 4],                  // Db6 C6 Ab5
  [5, 0, 89, 4], [5, 8, 85, 2], [5, 12, 84, 2],                 // F6 Db6 C6
  [6, 0, 86, 2], [6, 4, 83, 4], [6, 10, 81, 2],                 // D6 B5 A5
  [7, 0, 83, 2], [7, 4, 79, 2], [7, 8, 74, 6],                  // B5 G5 D5 (hang on V)
];
const L_END = [ // bar 31 override — rising figure that lands the loop on Cm
  [0, 0, 80, 2], [0, 4, 78, 2], [0, 8, 79, 2], [0, 12, 84, 4],  // Ab5 F#5 G5 C6
];
const putPhrase = (phrase, atBar) => {
  for (const [b, s, m, len] of phrase) lead.push([atBar + b, s, m, len]);
};
putPhrase(P_INTRO, 4);
putPhrase(L8, 8);
putPhrase(M8, 16);
putPhrase(L8.filter((n) => n[0] < 7), 24);   // A'' reprise, custom last bar
putPhrase(L_END, 31);

// Drums: tight kick/snare noise groove.
// Kick = low full-band thump on the floor; snare layers beats 2 & 4; hats escalate.
for (let bar = 0; bar < 32; bar++) {
  for (const s of [0, 4, 8, 12]) kick.push([bar, s, 22, 1]);
  if (FILL_BARS.includes(bar)) kick.push([bar, 14, 22, 1]);   // push into next section

  for (const s of [4, 12]) snare.push([bar, s, 56, 1]);
  if (bar === 15 || bar === 31) {                             // roll into B / loop
    snare.push([bar, 13, 56, 1], [bar, 14, 58, 1], [bar, 15, 60, 1]);
  } else if (bar === 7 || bar === 23) {
    snare.push([bar, 15, 58, 1]);                             // single ghost push
  }

  if (bar < 8) {
    for (const s of [2, 6, 10, 14]) hat.push([bar, s, 96, 1]);          // offbeat 8ths
  } else if (bar < 16) {
    for (let s = 0; s < 16; s += 2) hat.push([bar, s, s % 4 === 2 ? 97 : 92, 1]); // 8ths
  } else {
    for (let s = 0; s < 16; s++) hat.push([bar, s, s % 4 === 2 ? 99 : 92, 1]);    // 16ths
  }
}

// ---- export ----------------------------------------------------------------
export const track = {
  bpm: 128,
  bars: 32,
  beatsPerBar: 4,
  stepsPerBeat: 4,
  loop: true,
  channels: [
    { wave: 'triangle', volume: 0.30, decay: 0.85, pan: 0,     notes: bass },  // pumping octave bass
    { wave: 'sawtooth', volume: 0.13, decay: 0.55, pan: -0.25, notes: stab },  // dark syncopated stabs
    { wave: 'square',   volume: 0.11, decay: 0.85, pan: 0.3,   notes: lead },  // eerie high motif
    { wave: 'noise',    volume: 0.26, decay: 0.90,             notes: kick },  // kick thump
    { wave: 'noise',    volume: 0.13, decay: 0.60,             notes: snare }, // snare crack
    { wave: 'noise',    volume: 0.05, decay: 0.25,             notes: hat },   // hat ticks
  ],
};
