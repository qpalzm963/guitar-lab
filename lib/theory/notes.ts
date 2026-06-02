// Curated enharmonic root set for the pickers. A sharp-only chromatic list makes
// tonal spell teaching-hostile keys (e.g. D# major → "D# E# F## G# A# B# C##")
// and hides the common flat keys (Bb/Eb/Ab). This set is verified to spell every
// major scale and the common triad/seventh chords cleanly, while keeping F#'s and
// B's standard sharp spellings.
export const ROOT_OPTIONS = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "F#",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
] as const;
