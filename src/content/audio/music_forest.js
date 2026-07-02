// AETHERFALL — music_forest.js
// LUMEN WOODS theme: bright, adventurous, 112 bpm, D major.
// Form: A (verse, bars 0-7) · A' (verse lift, 8-15) · B (chorus, 16-23) · A'' (verse outro, 24-31)
// Channels: bouncy triangle bass · square lead melody (phrases + rests) ·
//           square arp harmony (offbeat plucks in verses, flowing 8th arps in chorus) ·
//           noise drums (kick/snare/hat by hiss pitch, fills every 8th bar).

const BARS = 32;

// ---------------------------------------------------------------- harmony map
// Chord per bar. Verse: D A Bm G D A G A  ·  Chorus: G A D Bm G A D D
const VERSE = ['D', 'A', 'Bm', 'G', 'D', 'A', 'G', 'A'];
const CHORUS = ['G', 'A', 'D', 'Bm', 'G', 'A', 'D', 'D'];
const PROG = [...VERSE, ...VERSE, ...CHORUS, ...VERSE];

// Bass roots (low register) and arp chord tones (mid register, low→high).
const ROOT = { D: 38, A: 45, Bm: 47, G: 43 };
const TONES = {
  D:  [62, 66, 69, 74],
  A:  [61, 64, 69, 73],
  Bm: [59, 62, 66, 71],
  G:  [59, 62, 67, 71],
};

// Section type per bar: 'v' verse, 'c' chorus.
const SECT = (bar) => (bar >= 16 && bar < 24 ? 'c' : 'v');

// ------------------------------------------------------------------- channels
const bass = [];
const lead = [];
const arp = [];
const drums = [];

const put = (arr, bar, pat) => { for (const [s, m, l] of pat) arr.push([bar, s, m, l]); };

// --- bass: root-fifth-octave bounce locked to the kick -----------------------
for (let bar = 0; bar < BARS; bar++) {
  const r = ROOT[PROG[bar]];
  if (SECT(bar) === 'v') {
    // bouncy: land on the kick, pop the fifth and octave between
    put(bass, bar, [
      [0, r, 3], [4, r, 1], [6, r + 7, 1],
      [8, r, 3], [12, r + 12, 1], [14, r + 7, 1],
    ]);
  } else {
    // chorus: driving 8ths with octave jumps for lift
    put(bass, bar, [
      [0, r, 2], [2, r, 1], [4, r + 7, 2], [6, r, 1],
      [8, r, 2], [10, r + 12, 1], [12, r + 7, 2], [14, r + 12, 1],
    ]);
  }
}

// --- lead: the Lumen Woods melody --------------------------------------------
// Verse core (relative bars 0-5) — call-and-answer phrases with breathing rests.
const VERSE_CORE = [
  [0, [[0, 62, 2], [2, 64, 2], [4, 66, 3], [8, 69, 2], [10, 66, 2], [12, 64, 2]]],
  [1, [[0, 64, 5], [10, 61, 2], [12, 64, 2]]],
  [2, [[0, 66, 2], [2, 69, 2], [4, 71, 3], [8, 74, 2], [10, 71, 2], [12, 69, 2]]],
  [3, [[0, 67, 5], [10, 69, 2], [12, 71, 2]]],
  [4, [[0, 69, 2], [2, 66, 2], [4, 62, 3], [8, 64, 2], [10, 66, 2], [12, 69, 2]]],
  [5, [[0, 64, 6]]], // long tone + rest — let the woods hum
];
// Three different two-bar endings (rel bars 6-7) per verse instance.
const END_A = [ // settle, small pickup into the repeat
  [6, [[0, 67, 2], [2, 69, 2], [4, 71, 3], [8, 67, 2], [10, 64, 2]]],
  [7, [[0, 66, 2], [2, 64, 2], [4, 61, 4], [12, 62, 1], [14, 64, 1]]],
];
const END_LIFT = [ // rising run that launches the chorus
  [6, [[0, 67, 2], [2, 71, 2], [4, 74, 3], [8, 71, 2], [10, 67, 2]]],
  [7, [[0, 69, 4], [8, 71, 2], [10, 73, 2], [12, 74, 2]]],
];
const END_LOOP = [ // final cadence resolving home to D so the loop breathes
  [6, [[0, 67, 2], [2, 69, 2], [4, 71, 3], [8, 74, 2], [10, 71, 2]]],
  [7, [[0, 69, 3], [4, 66, 2], [6, 64, 2], [8, 62, 5]]],
];
const placeVerse = (at, ending) => {
  for (const [rel, pat] of VERSE_CORE) put(lead, at + rel, pat);
  for (const [rel, pat] of ending) put(lead, at + rel, pat);
};
placeVerse(0, END_A);      // A
placeVerse(8, END_LIFT);   // A' → chorus
placeVerse(24, END_LOOP);  // A'' → loop point

// Chorus melody (bars 16-23) — higher, anthemic, wide held notes.
const CHORUS_MEL = [
  [16, [[0, 71, 3], [4, 74, 3], [8, 71, 2], [10, 69, 2], [12, 71, 3]]],
  [17, [[0, 69, 4], [8, 66, 2], [10, 69, 2], [12, 73, 3]]],
  [18, [[0, 74, 4], [8, 74, 2], [10, 76, 2], [12, 74, 3]]],
  [19, [[0, 71, 6], [12, 69, 1], [14, 71, 1]]],
  [20, [[0, 74, 2], [2, 74, 2], [4, 76, 3], [8, 74, 2], [10, 71, 2], [12, 69, 2]]],
  [21, [[0, 71, 4], [8, 69, 2], [10, 66, 2], [12, 64, 2]]],
  [22, [[0, 66, 2], [2, 67, 2], [4, 69, 3], [8, 71, 2], [10, 73, 2], [12, 74, 3]]],
  [23, [[0, 74, 8]]], // big held D — rest before the outro verse
];
for (const [bar, pat] of CHORUS_MEL) put(lead, bar, pat);

// --- arp harmony: sparkle in verses, cascade in chorus -----------------------
for (let bar = 0; bar < BARS; bar++) {
  const t = TONES[PROG[bar]];
  if (SECT(bar) === 'v') {
    // offbeat firefly plucks — leaves room for the lead
    put(arp, bar, [
      [2, t[1], 1], [6, t[2], 1], [10, t[3], 1], [14, t[2], 1],
    ]);
  } else {
    // flowing up-and-over 8th-note arpeggio
    const idx = [0, 1, 2, 3, 3, 2, 1, 2];
    put(arp, bar, idx.map((k, i) => [i * 2, t[k], 1]));
  }
}

// --- drums: kick(45) / snare(78) / hat(96) by hiss pitch ----------------------
for (let bar = 0; bar < BARS; bar++) {
  const fill = bar % 8 === 7; // fill into every new section
  if (SECT(bar) === 'v') {
    put(drums, bar, [[0, 45, 1], [4, 78, 1], [6, 96, 1], [8, 45, 1]]);
  } else {
    put(drums, bar, [
      [0, 45, 1], [2, 96, 1], [4, 78, 1], [6, 96, 1],
      [8, 45, 1], [10, 45, 1],
    ]);
  }
  if (fill) {
    put(drums, bar, [[12, 78, 1], [13, 78, 1], [14, 84, 1], [15, 90, 1]]);
  } else {
    put(drums, bar, [[12, 78, 1], [14, 96, 1]]);
  }
}

// -------------------------------------------------------------------- export
export const track = {
  bpm: 112,
  bars: BARS,
  beatsPerBar: 4,
  stepsPerBeat: 4,
  loop: true,
  channels: [
    { wave: 'triangle', volume: 0.30, decay: 0.9, pan: 0,    notes: bass },
    { wave: 'square',   volume: 0.16, decay: 0.8, pan: -0.3, notes: lead },
    { wave: 'square',   volume: 0.10, decay: 0.6, pan: 0.3,  notes: arp },
    { wave: 'noise',    volume: 0.08, decay: 0.3,            notes: drums },
  ],
};
