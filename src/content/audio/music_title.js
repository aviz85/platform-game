// AETHERFALL — TITLE theme: "Shattered Moons"
// Wonder & mystery. 90 BPM, 24 bars, A-A-B-A:
//   A  (bars  0-7)  : slow triangle arpeggios alone, heartbeat fades in, high shimmer from bar 4
//   A' (bars  8-15) : airy square lead enters with the rising motif (E4 -> A4 -> B4 -> C5)
//   B  (bars 16-19) : arps climb an extra octave, lead soars sustained, extra noise ticks
//   A''(bars 20-23) : motif restated, melody sighs down D5-C5-B4-A4 into the loop point
// Harmony: A minor, i-VI-III-VII = Am / F / C / G, one chord per bar, cycling.

const BARS = 24;

// ---- chord cycle data (index = bar % 4) -------------------------------------
const ROOT  = [45, 41, 36, 43];              // bass roots:  A2  F2  C2  G2
const FIFTH = [52, 48, 43, 50];              // bass color:  E3  C3  G2  D3
const TONES = [
  [57, 60, 64, 69],                          // Am : A3 C4 E4 A4
  [53, 57, 60, 65],                          // F  : F3 A3 C4 F4
  [55, 60, 64, 67],                          // C  : G3 C4 E4 G4
  [55, 59, 62, 67],                          // G  : G3 B3 D4 G4
];
const HIGH  = [76, 81, 79, 74];              // shimmer pings: E5 A5 G5 D5

const bass = [], arp = [], shimmer = [], perc = [];

// rise-and-fall arp shape for A sections: up the chord, then drift back down;
// step 14 stays silent every bar so the space-echo has room to bloom.
const PAT_A = [0, 1, 2, 3, 2, 1, 0];

for (let bar = 0; bar < BARS; bar++) {
  const c = bar % 4;
  const inB = bar >= 16 && bar < 20;

  // --- bass: long roots, gentle fifth on the F and G bars ---
  bass.push([bar, 0, ROOT[c], 12]);
  if (c === 1 || c === 3) bass.push([bar, 12, FIFTH[c], 4]);

  // --- triangle arpeggios ---
  if (inB) {
    // B section: the arp keeps climbing into the next octave — lift-off feeling
    for (let k = 0; k < 8; k++) {
      arp.push([bar, k * 2, TONES[c][k % 4] + (k >= 4 ? 12 : 0), 2]);
    }
  } else {
    for (let k = 0; k < PAT_A.length; k++) {
      arp.push([bar, k * 2, TONES[c][PAT_A[k]], 2]);
    }
  }

  // --- high square shimmer: one distant ping per bar from bar 4 on ---
  if (bar >= 4) {
    shimmer.push([bar, c % 2 === 0 ? 12 : 14, HIGH[c], 3]);
    if (inB) shimmer.push([bar, 6, TONES[c][3] + 12, 2]); // extra sparkle in B
  }

  // --- noise heartbeat: lub-dub, entering at bar 2 ---
  if (bar >= 2) {
    perc.push([bar, 0, 45, 1]);   // lub  (low thump)
    perc.push([bar, 3, 38, 1]);   // dub  (lower, softer feel via pitch)
    if (inB) perc.push([bar, 8, 85, 1]); // faint high tick lifts the B section
  }
}

// Loop pickup: dominant-ish E2 under the last bar pulls the ear back to Am at bar 0.
bass.push([23, 12, 40, 4]);

// ---- lead melody (square) — enters bar 8 ------------------------------------
// The motif: a rising call E4 -> A4 -> B4 -> C5, answered, then blown open in B.
const lead = [
  // A' phrase 1 (bars 8-11): the rising motif and its answer
  [8, 0, 64, 3], [8, 4, 69, 3], [8, 8, 71, 2], [8, 10, 72, 6],
  [9, 0, 72, 4], [9, 6, 69, 2], [9, 8, 67, 2], [9, 10, 69, 6],
  [10, 0, 67, 3], [10, 4, 64, 3], [10, 8, 67, 2], [10, 10, 76, 6],
  [11, 0, 74, 6], [11, 8, 71, 4],
  // A' phrase 2 (bars 12-15): same call, answer reaches higher and hangs on the V
  [12, 0, 64, 3], [12, 4, 69, 3], [12, 8, 71, 2], [12, 10, 72, 6],
  [13, 0, 72, 4], [13, 4, 74, 2], [13, 6, 72, 2], [13, 8, 69, 8],
  [14, 0, 76, 4], [14, 4, 79, 4], [14, 8, 76, 2], [14, 10, 74, 2], [14, 12, 72, 4],
  [15, 0, 71, 6], [15, 8, 69, 2], [15, 10, 71, 2], [15, 12, 74, 4],
  // B (bars 16-19): long soaring tones over the climbing arps — pure wonder
  [16, 0, 69, 8], [16, 8, 76, 8],
  [17, 0, 77, 6], [17, 8, 76, 4], [17, 12, 72, 4],
  [18, 0, 76, 4], [18, 4, 74, 2], [18, 6, 76, 2], [18, 8, 79, 8],
  [19, 0, 74, 6], [19, 8, 71, 4], [19, 12, 67, 4],
  // A'' (bars 20-23): motif returns, then sighs down D5-C5-B4-A4 into the loop
  [20, 0, 64, 3], [20, 4, 69, 3], [20, 8, 71, 2], [20, 10, 72, 6],
  [21, 0, 72, 4], [21, 6, 69, 2], [21, 8, 67, 2], [21, 10, 69, 6],
  [22, 0, 67, 3], [22, 4, 64, 3], [22, 8, 67, 2], [22, 10, 76, 6],
  [23, 0, 74, 4], [23, 4, 72, 2], [23, 6, 71, 2], [23, 8, 69, 8],
];

export const track = {
  bpm: 90,
  bars: BARS,
  beatsPerBar: 4,
  stepsPerBeat: 4,
  loop: true,
  channels: [
    { wave: 'triangle', volume: 0.26, decay: 1.1,  pan:  0,    notes: bass },    // deep roots
    { wave: 'triangle', volume: 0.20, decay: 0.9,  pan: -0.15, notes: arp },     // arpeggiated chords
    { wave: 'square',   volume: 0.15, decay: 0.85, pan: -0.25, notes: lead },    // airy lead (bar 8+)
    { wave: 'square',   volume: 0.08, decay: 0.5,  pan:  0.3,  notes: shimmer }, // distant sparkle
    { wave: 'noise',    volume: 0.09, decay: 0.25, pan:  0,    notes: perc },    // heartbeat lub-dub
  ],
};
