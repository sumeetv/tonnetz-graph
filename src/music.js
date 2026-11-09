export const NOTE_NAMES = [
  "C",
  "C♯",
  "D",
  "D♯",
  "E",
  "F",
  "F♯",
  "G",
  "G♯",
  "A",
  "A♯",
  "B",
];
export const modulo = (value, base = 12) => ((value % base) + base) % base;
export const noteName = (pitch) => NOTE_NAMES[modulo(pitch)];

// Pitch classes relative to a root. Extensions collapse into the same octave.
export const CHORDS = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  7: [0, 4, 7, 10],
  "7b5": [0, 4, 6, 10],
  "7#5": [0, 4, 8, 10],
  "m#7": [0, 3, 7, 11],
  m7b5: [0, 3, 6, 10],
  "7b9": [0, 1, 4, 7, 10],
  b5: [0, 4, 6],
  5: [0, 7],
  6: [0, 4, 7, 9],
  m6: [0, 3, 7, 9],
  69: [0, 2, 4, 7, 9],
  9: [0, 2, 4, 7, 10],
  "9b5": [0, 2, 4, 6, 10],
  "9#5": [0, 2, 4, 8, 10],
  m9: [0, 2, 3, 7, 10],
  maj9: [0, 2, 4, 7, 11],
  add9: [0, 2, 4, 7],
  "7#9": [0, 3, 4, 7, 10],
  11: [0, 2, 4, 5, 7, 10],
  m11: [0, 2, 3, 5, 7, 10],
  13: [0, 2, 4, 7, 9, 10],
  maj13: [0, 2, 4, 7, 9, 11],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  dim7: [0, 3, 6, 9],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  "7sus4": [0, 5, 7, 10],
  "9sus4": [0, 2, 5, 7, 10],
};
const maskOf = (pitches) =>
  pitches.reduce((mask, pitch) => mask | (1 << modulo(pitch)), 0);
const PATTERNS = Object.entries(CHORDS).map(([type, pitches]) => ({
  type,
  mask: maskOf(pitches),
}));

export function findChords(pitches) {
  if (!pitches.length) return [];
  const matches = [];
  for (let root = 0; root < 12; root++) {
    const mask = maskOf(pitches.map((pitch) => pitch - root));
    for (const pattern of PATTERNS) {
      if (mask === pattern.mask) {
        const displayType = pattern.type
          .replaceAll("#", "♯")
          .replaceAll("b", "♭");
        matches.push({
          root,
          type: pattern.type,
          name: `${noteName(root)} ${displayType}`,
        });
      }
    }
  }
  return matches;
}
