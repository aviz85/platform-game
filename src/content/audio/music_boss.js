// AETHERFALL — music_boss.js
// COLOSSUS theme: aggressive, pounding, 150 bpm, E minor/phrygian with tritone (Bb) grit.
// Form (16 bars): A (0-3) riff+drums establish · A' (4-7) tritone stabs enter, lead motif ·
//                 B (8-11) harmony shifts G → Bb (tritone), frantic 16th lead runs;
//                    bar 11 drops the sub floor under the riser (dynamic breakdown) ·
//                 C (12-15) climax — sub slams back, the A' hook screams an octave up,
//                    everything pounding, chromatic climb into the loop.
// Channels: relentless sawtooth bass riff · triangle sub (octave-down pedal weight) ·
//           dissonant sawtooth tritone stab dyads (offbeat) · frantic square lead ·
//           driving noise drums (kick 24 / snare 78 / hat 96) with fills every 4th bar.

const BARS = 16;

// Root per bar (E2=40, G2=43, Bb2=46). Tritone leap at bars 10-11 = maximum menace.
const ROOTS = [
  40, 40, 40, 40,        // A   — E pedal
  40, 40, 40, 40,        // A'  — E pedal
  43, 43, 46, 46,        // B   — G, then Bb (tritone of E)
  40, 40, 40, 40,        // C   — E climax
];

const bass = [];
const sub = [];
const stabs = [];
const lead = [];
const drums = [];

const put = (arr, bar, pat) => { for (const [s, m, l] of pat) arr.push([bar, s, m, l]); };

// --- bass: the relentless riff — syncopated chug on the root, snapping up to ---
// --- the minor 3rd and tritone. Locked to the kick (steps 0 and 8). -----------
for (let bar = 0; bar < BARS; bar++) {
  const r = ROOTS[bar];
  if (bar === 15) {
    // final bar: chromatic 8th-note climb E F F# G G# A Bb B — launches the loop
    put(bass, bar, [
      [0, 40, 2], [2, 41, 2], [4, 42, 2], [6, 43, 2],
      [8, 44, 2], [10, 45, 2], [12, 46, 2], [14, 47, 2],
    ]);
  } else if (bar === 14) {
    // pre-climb bar: straight pounding 8ths on the root, no ornament — pure drive
    put(bass, bar, [
      [0, r, 2], [2, r, 1], [4, r, 2], [6, r, 1],
      [8, r, 2], [10, r, 1], [12, r, 2], [14, r + 6, 1],
    ]);
  } else if (bar % 4 === 3) {
    // 4th bar of each group: riff with a tritone-drop turnaround
    put(bass, bar, [
      [0, r, 2], [3, r, 1], [4, r, 1], [6, r + 3, 1],
      [8, r, 2], [11, r + 6, 1], [12, r + 5, 1], [14, r + 3, 1],
    ]);
  } else {
    // core riff: E . . E E . G . E . . E Bb . G .  (gallop + tritone bite)
    put(bass, bar, [
      [0, r, 2], [3, r, 1], [4, r, 1], [6, r + 3, 1],
      [8, r, 2], [11, r, 1], [12, r + 6, 1], [14, r + 3, 1],
    ]);
  }
}

// --- sub: octave-down triangle pedal on the downbeats — floor-shaking weight --
for (let bar = 0; bar < BARS; bar++) {
  const r = ROOTS[bar] - 12; // E1=28, G1=31, Bb1=34
  // DYNAMIC DROP: bar 11 is the chromatic riser into the climax — pull the floor
  // out from under it (drums + rising stabs carry the tension), then bar 12 slams
  // the sub pedal back in. Drop-then-reintroduce = the climax hits twice as hard.
  if (bar === 11) continue;
  put(sub, bar, [[0, r, 6], [8, r, 6]]);
  if (bar % 4 === 3) put(sub, bar, [[14, r, 2]]); // pickup thump into the next group
}

// --- stabs: dissonant sawtooth tritone dyads on the offbeats ------------------
// A: silent (build). A': E3+Bb3. B: G3+C#4, then Bb3+E4. C: E3+Bb3, denser.
const DYAD = (bar) => {
  const r = ROOTS[bar];
  return [r + 12, r + 18]; // root + tritone, one octave up from the bass
};
for (let bar = 4; bar < BARS; bar++) {
  const [a, b] = DYAD(bar);
  if (bar < 12) {
    // offbeat jabs — leave air between hits
    put(stabs, bar, [[2, a, 1], [2, b, 1], [10, a, 1], [10, b, 1]]);
    if (bar % 4 === 3) put(stabs, bar, [[6, a, 1], [6, b, 1]]);
  } else if (bar === 15) {
    // climax turnaround: stab every offbeat, rising into the loop
    put(stabs, bar, [
      [2, a, 1], [2, b, 1], [6, a, 1], [6, b, 1],
      [10, a + 1, 1], [10, b + 1, 1], [14, a + 2, 1], [14, b + 2, 1],
    ]);
  } else {
    // climax: three jabs per bar
    put(stabs, bar, [[2, a, 1], [2, b, 1], [6, a, 1], [6, b, 1], [10, a, 1], [10, b, 1]]);
  }
}

// --- lead: frantic square runs with phrases and rests -------------------------
// Registers: E4=64 .. G5=79. E harmonic-minor color + Bb tritone snarl.
// A (0-3): near-silent — two alarm blasts announce the beast.
put(lead, 3, [[8, 76, 2], [12, 75, 2]]);
// A' (4-7): the angular boss motif, call and answer.
put(lead, 4, [[0, 76, 2], [3, 74, 1], [4, 70, 2], [8, 71, 3]]);
put(lead, 5, [[0, 67, 1], [2, 69, 1], [4, 70, 2], [8, 71, 4]]);
put(lead, 6, [[0, 76, 2], [3, 74, 1], [4, 70, 2], [8, 71, 3], [12, 74, 2]]);
put(lead, 7, [ // answering descent — frantic 16th tumble, then land and breathe
  [0, 76, 1], [1, 74, 1], [2, 72, 1], [3, 71, 1],
  [4, 70, 1], [5, 69, 1], [6, 67, 1], [7, 66, 1], [8, 64, 4],
]);
// B (8-11): frantic 16th-note run bursts over the shifting harmony.
put(lead, 8, [ // over G
  [0, 67, 1], [1, 69, 1], [2, 70, 1], [3, 72, 1], [4, 74, 2],
  [8, 74, 1], [9, 72, 1], [10, 70, 1], [11, 69, 1], [12, 67, 2],
]);
put(lead, 9, [
  [0, 70, 1], [1, 72, 1], [2, 74, 1], [3, 76, 1], [4, 77, 4],
  [8, 76, 1], [9, 74, 1], [10, 72, 1], [11, 70, 1], [12, 69, 2],
]);
put(lead, 10, [ // over Bb — E natural against it = screaming tritone
  [0, 70, 1], [1, 73, 1], [2, 75, 1], [3, 76, 1], [4, 76, 2],
  [8, 76, 1], [9, 75, 1], [10, 73, 1], [11, 70, 1], [12, 70, 2],
]);
put(lead, 11, [ // chromatic ladder up — tension bar into the climax
  [0, 70, 1], [2, 71, 1], [4, 72, 1], [6, 73, 1],
  [8, 74, 1], [10, 75, 1], [12, 76, 4],
]);
// C (12-15): the boss motif RETURNS — restated an octave up as a triumphant scream
// (the A' hook, now at the top of the register), then one last tumbling run + exit.
put(lead, 12, [[0, 88, 2], [3, 86, 1], [4, 82, 2], [8, 83, 3], [12, 79, 2]]); // hook +octave
put(lead, 13, [[0, 88, 2], [3, 86, 1], [4, 82, 2], [8, 83, 4]]);              // hook answer
put(lead, 14, [ // full-bar frantic descent
  [0, 76, 1], [1, 74, 1], [2, 72, 1], [3, 71, 1],
  [4, 70, 1], [5, 69, 1], [6, 67, 1], [7, 66, 1], [8, 64, 4],
]);
put(lead, 15, [ // climb with the bass — hands the loop back to bar 0
  [0, 64, 1], [2, 67, 1], [4, 70, 1], [6, 71, 1],
  [8, 72, 1], [10, 74, 1], [12, 75, 1], [14, 76, 2],
]);

// --- drums: four-on-the-floor pound — kick 24, snare 78, hat 96 ---------------
// Fill on every 4th bar (3, 7, 11, 15), each bigger than the last.
for (let bar = 0; bar < BARS; bar++) {
  const fill = bar % 4 === 3;
  const climax = bar >= 12;
  // backbone: kick 0/8, snare 4/12, offbeat hats
  put(drums, bar, [[0, 24, 1], [4, 78, 1], [8, 24, 1]]);
  if (!fill) put(drums, bar, [[12, 78, 1]]);
  put(drums, bar, [[2, 96, 1], [6, 96, 1], [10, 96, 1]]);
  if (!fill) put(drums, bar, [[14, 96, 1]]);
  // extra kick drive in A' and beyond; double-time hat pings at the climax
  if (bar >= 4) put(drums, bar, [[10, 24, 1]]);
  if (climax && !fill) put(drums, bar, [[7, 96, 1], [15, 96, 1]]);
  if (fill) {
    if (bar === 15) {
      // the big one: snare roll rising into the loop point
      put(drums, bar, [
        [8, 78, 1], [10, 78, 1], [12, 78, 1], [13, 82, 1], [14, 86, 1], [15, 92, 1],
      ]);
    } else {
      put(drums, bar, [[12, 78, 1], [13, 78, 1], [14, 82, 1], [15, 88, 1]]);
    }
  }
}

// -------------------------------------------------------------------- export
export const track = {
  bpm: 150,
  bars: BARS,
  beatsPerBar: 4,
  stepsPerBeat: 4,
  loop: true,
  channels: [
    { wave: 'sawtooth', volume: 0.28, decay: 0.35, pan: 0,     notes: bass },  // riff
    { wave: 'triangle', volume: 0.22, decay: 0.8,  pan: 0,     notes: sub },   // sub pedal
    { wave: 'sawtooth', volume: 0.11, decay: 0.22, pan: -0.25, notes: stabs }, // tritone stabs
    { wave: 'square',   volume: 0.15, decay: 0.5,  pan: 0.25,  notes: lead },  // frantic lead
    { wave: 'noise',    volume: 0.10, decay: 0.25,             notes: drums }, // drums
  ],
};
