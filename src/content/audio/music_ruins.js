// AETHERFALL — music: "SKY BASTION" (ruins theme)
//
// Majestic, windswept. 100 bpm, 32 bars, A-minor with major lifts.
// Standing on a broken tower above the cloud sea: long held sawtooth chords,
// a heroic square-lead anthem, walking triangle bass, sparse cymbal-ish noise
// and slow wind swells underneath.
//
// Form (32 bars):
//   INTRO  0-3    wind + held Am pads, half-note bass, distant chime pings
//   A      4-11   main theme       Am F C G | Am F Dm E   (E major = first lift)
//   A'     12-19  restatement      Am F C G | F G Am Am   (quarter arps enter)
//   B      20-27  soaring lift     F C G Am | F C G A(!)  (8th arps, A MAJOR peak)
//   OUTRO  28-31  wind-down        F G Am Am              (resolves, loops clean)
//
// Channel plan (7):
//   0 saw pad low   (root+5th, held whole bars, merged across repeats)
//   1 saw pad high  (3rd+octave color, enters bar 2)
//   2 square lead   (the anthem — phrases with rests)
//   3 square arp    (intro chimes, quarter arps in A', 8th arps in B)
//   4 triangle bass (walking quarters: root / 3rd / 5th / chromatic approach)
//   5 noise perc    (half-time thump + hat ticks, builds per section)
//   6 noise wind    (long low swells + crash washes at section downbeats)

// ---- chord dictionary -------------------------------------------------------
// r: bass root (oct 2) · maj: chord quality · low/high: pad voicings · arp: broken-chord tones
const CHORDS = {
  Am: { r: 45, maj: false, low: [57, 64], high: [60, 69], arp: [57, 60, 64, 69] },
  F:  { r: 41, maj: true,  low: [53, 60], high: [57, 65], arp: [53, 57, 60, 65] },
  C:  { r: 48, maj: true,  low: [55, 60], high: [64, 72], arp: [55, 60, 64, 67] },
  G:  { r: 43, maj: true,  low: [55, 62], high: [59, 67], arp: [55, 59, 62, 67] },
  Dm: { r: 38, maj: false, low: [53, 62], high: [57, 65], arp: [50, 53, 57, 62] },
  E:  { r: 40, maj: true,  low: [56, 64], high: [59, 68], arp: [52, 56, 59, 64] }, // G# lift
  A:  { r: 45, maj: true,  low: [57, 64], high: [61, 69], arp: [57, 61, 64, 69] }, // Picardy peak
};

// one chord symbol per bar, 32 bars
const PROG = [
  'Am', 'Am', 'F', 'G',                 // intro
  'Am', 'F', 'C', 'G', 'Am', 'F', 'Dm', 'E',   // A
  'Am', 'F', 'C', 'G', 'F', 'G', 'Am', 'Am',   // A'
  'F', 'C', 'G', 'Am', 'F', 'C', 'G', 'A',     // B
  'F', 'G', 'Am', 'Am',                 // outro
];
const BARS = PROG.length; // 32

// ---- pads: long held sawtooth chords (merge repeated chords into 2-bar holds)
const padLow = [];
const padHigh = [];
for (let b = 0; b < BARS; b++) {
  const c = CHORDS[PROG[b]];
  const holdTwo = b + 1 < BARS && PROG[b + 1] === PROG[b];
  const len = holdTwo ? 32 : 16;
  for (const m of c.low) padLow.push([b, 0, m, len]);
  if (b >= 2) for (const m of c.high) padHigh.push([b, 0, m, len]); // high voice enters bar 2
  if (holdTwo) b++;
}

// ---- walking triangle bass --------------------------------------------------
// quarters on steps 0/4/8/12: root, color tone, then a chromatic approach into
// the next bar's root (from below when rising, from above when falling).
const bass = [];
for (let b = 0; b < BARS; b++) {
  const c = CHORDS[PROG[b]];
  const n = CHORDS[PROG[(b + 1) % BARS]];
  const r = c.r, third = r + (c.maj ? 4 : 3), fifth = r + 7;
  const approach = n.r === r ? fifth : (n.r > r ? n.r - 1 : n.r + 1);
  if (b < 4) { // intro: spacious half notes
    bass.push([b, 0, r, 7], [b, 8, b % 2 ? third : fifth, 7]);
  } else if (b === BARS - 1) { // final bar: long resolve, loops into intro Am
    bass.push([b, 0, r, 10], [b, 12, r - 12 >= 20 ? r - 12 : r, 4]);
  } else if (b % 2 === 0) {
    bass.push([b, 0, r, 3], [b, 4, fifth, 3], [b, 8, r + 12, 3], [b, 12, approach, 3]);
  } else {
    bass.push([b, 0, r, 3], [b, 4, third, 3], [b, 8, fifth, 3], [b, 12, approach, 3]);
  }
}

// ---- heroic square lead -----------------------------------------------------
// A4=69 B4=71 C5=72 D5=74 E5=76 F5=77 G5=79 G#5=80 A5=81 B5=83 C6=84 C#6=85 D6=86 E6=88
const THEME_A = [ // bars 0..3 of the phrase, over Am F C G — the anthem call
  [0, 0, 76, 3], [0, 4, 81, 6], [0, 12, 79, 2], [0, 14, 76, 2],  // 5th leap up, fall back
  [1, 0, 77, 8], [1, 8, 76, 2], [1, 10, 74, 2], [1, 12, 72, 4],  // long F, stepwise descent
  [2, 0, 76, 4], [2, 4, 79, 4], [2, 8, 84, 8],                   // climb to high C
  [3, 0, 83, 4], [3, 4, 81, 2], [3, 6, 79, 2], [3, 8, 74, 6],    // answer, breathe
];
const lead = [];
const put = (bar, notes) => { for (const [db, s, m, l] of notes) lead.push([bar + db, s, m, l]); };

put(4, THEME_A);                                                  // A: statement
put(8, [                                                          // A: consequent → E-major lift
  [0, 0, 76, 3], [0, 4, 81, 4], [0, 8, 83, 2], [0, 10, 84, 6],
  [1, 0, 81, 6], [1, 8, 79, 2], [1, 10, 77, 2], [1, 12, 76, 4],
  [2, 0, 74, 4], [2, 4, 77, 4], [2, 8, 81, 8],
  [3, 0, 80, 6], [3, 8, 83, 6],                                   // G# — the major lift shines
]);
put(12, THEME_A);                                                 // A': restatement
put(16, [                                                         // A': new close, settles home
  [0, 0, 84, 6], [0, 8, 81, 4], [0, 12, 77, 4],
  [1, 0, 83, 4], [1, 4, 86, 4], [1, 8, 79, 6],
  [2, 0, 81, 10], [2, 12, 76, 4],
  [3, 0, 69, 8],                                                  // low echo, wind fills the rest
]);
put(20, [                                                         // B: soaring above the clouds
  [0, 0, 77, 4], [0, 4, 81, 4], [0, 8, 84, 8],
  [1, 0, 88, 8], [1, 8, 86, 4], [1, 12, 84, 4],                   // top E6 held into descent
  [2, 0, 83, 4], [2, 4, 86, 4], [2, 8, 79, 8],
  [3, 0, 81, 4], [3, 4, 84, 4], [3, 8, 88, 8],
]);
put(24, [                                                         // B: drive into the A-major peak
  [0, 0, 84, 4], [0, 4, 81, 4], [0, 8, 77, 4], [0, 12, 81, 4],
  [1, 0, 79, 4], [1, 4, 76, 4], [1, 8, 79, 2], [1, 10, 81, 2], [1, 12, 83, 4],
  [2, 0, 86, 6], [2, 8, 83, 2], [2, 10, 81, 2], [2, 12, 83, 4],
  [3, 0, 85, 8], [3, 8, 88, 8],                                   // C#6 → E6: the banner unfurls
]);
put(28, [                                                         // outro: slow fall back to earth
  [0, 0, 81, 8], [0, 8, 79, 4], [0, 12, 77, 4],
  [1, 0, 76, 8], [1, 8, 74, 8],
  [2, 0, 72, 8], [2, 8, 71, 4], [2, 12, 72, 4],
  [3, 0, 69, 12],                                                 // resolve, loop breathes back in
]);

// ---- arp / chime channel ----------------------------------------------------
const arp = [
  // intro + outro: distant windchime pings high on the tower
  [0, 8, 88, 4], [1, 12, 84, 2], [2, 8, 84, 4], [3, 8, 86, 2], [3, 12, 88, 2],
  [31, 8, 88, 4],
];
const ARP_ORDER = [0, 1, 2, 3, 2, 1, 0, 2]; // up-down ripple through the 4 chord tones
for (let b = 16; b < 28; b++) {
  const tones = CHORDS[PROG[b]].arp;
  if (b < 20) { // A' second half: gentle quarter-note arps
    for (let q = 0; q < 4; q++) arp.push([b, q * 4, tones[ARP_ORDER[q]], 2]);
  } else {      // B: full 8th-note ripple under the soaring lead
    for (let e = 0; e < 8; e++) arp.push([b, e * 2, tones[ARP_ORDER[e]], 1]);
  }
}

// ---- percussion (noise) -----------------------------------------------------
// midi maps to a highpass: low midi = full-band thump, high midi = crisp cymbal tick.
const perc = [];
for (let b = 4; b < BARS; b++) {
  if (b === BARS - 1) break;                    // last bar: wind only
  perc.push([b, 0, 38, 1]);                     // downbeat thump
  if (b < 12) {                                 // A: half-time, stately
    perc.push([b, 8, 96, 1]);
    if (b % 2 === 1) perc.push([b, 12, 96, 1]);
  } else if (b < 28) {                          // A' + B: backbeat hats
    perc.push([b, 4, 96, 1], [b, 8, 38, 1], [b, 12, 96, 1]);
    if (b % 2 === 1) perc.push([b, 14, 92, 1]);
    if (b >= 20 && b % 2 === 0) perc.push([b, 6, 94, 1]); // B: extra shimmer
  } else {                                      // outro: thin back out
    perc.push([b, 8, 96, 1]);
  }
}

// ---- wind + crash washes (noise, long decay) --------------------------------
const wind = [
  [0, 0, 66, 32], [2, 0, 72, 32],               // intro gusts across the parapet
  [4, 0, 100, 8], [12, 0, 100, 8],              // crash washes on section downbeats
  [18, 0, 70, 16], [19, 8, 88, 8],              // lull, then a riser into B
  [20, 0, 102, 8], [24, 0, 101, 6], [27, 0, 102, 8], // B crashes; peak on the A-major bar
  [28, 0, 68, 32], [30, 0, 64, 32],             // wind carries the loop home
];

// ---- track ------------------------------------------------------------------
export const track = {
  bpm: 100, bars: BARS, beatsPerBar: 4, stepsPerBeat: 4, loop: true,
  channels: [
    { wave: 'sawtooth', volume: 0.10, decay: 0.97, pan: -0.22, notes: padLow },
    { wave: 'sawtooth', volume: 0.08, decay: 0.97, pan: 0.24,  notes: padHigh },
    { wave: 'square',   volume: 0.15, decay: 0.82, pan: -0.10, notes: lead },
    { wave: 'square',   volume: 0.07, decay: 0.65, pan: 0.32,  notes: arp },
    { wave: 'triangle', volume: 0.30, decay: 0.85, pan: 0,     notes: bass },
    { wave: 'noise',    volume: 0.09, decay: 0.30, pan: 0.08,  notes: perc },
    { wave: 'noise',    volume: 0.05, decay: 1.0,  pan: -0.05, notes: wind },
  ],
};
