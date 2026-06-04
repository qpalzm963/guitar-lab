import { Key, Chord, Note } from "tonal";
import { STANDARD_TUNING, DEFAULT_FRET_COUNT, midiAt } from "./fretboard";
import { intervalToDegree } from "./scaleProjection";
import type { Marker } from "./types";

/**
 * Advanced-harmony theory. Pure functions only — no React, no rendering.
 * Every function returns plain data (chord symbols + notes + degrees + bass);
 * the component turns that into Marker[] via the helpers at the bottom, reusing
 * the same chroma-matching projection as chords.ts / scaleProjection.ts.
 *
 * Correctness is validated against tonal and standard jazz-harmony references
 * (see per-function notes) and pinned by harmony.test.ts.
 */

// ---------------------------------------------------------------------------
// Shared chord-shape: a symbol + its tonal-resolved notes/intervals/degrees.
// ---------------------------------------------------------------------------

export interface ChordShape {
  /** Chord symbol, e.g. "D7", "Fm", "Db7". */
  symbol: string;
  /** Tonal pitch-class spellings, in chord order (root first). */
  notes: string[];
  /** Scale-degree labels aligned to notes ("1","3","5","b7"…). */
  degrees: string[];
  /** Root pitch class (chord tonic). */
  root: string;
}

function shapeOf(symbol: string): ChordShape {
  const c = Chord.get(symbol);
  return {
    symbol,
    notes: c.notes,
    degrees: c.intervals.map(intervalToDegree),
    root: c.tonic ?? Note.pitchClass(c.notes[0] ?? ""),
  };
}

/**
 * Prefer a single-accidental spelling for a DISPLAYED chord root. Transposing by
 * interval can yield double accidentals that are theoretically correct but
 * teaching-hostile: the tritone sub of Db7 spells "Abb7", and bVI of Db spells
 * "Bbb" — no real chart writes those. The chroma is unchanged, so simplifying to
 * the enharmonic single-accidental (Abb→G, Bbb→A) changes only what the learner
 * reads. Single-accidental spellings (Cb, Fb) are left as-is — they're valid.
 */
function simpleRoot(pc: string): string {
  return /bb|##/.test(pc) ? Note.enharmonic(pc) : pc;
}

// ---------------------------------------------------------------------------
// 1. Secondary dominants — V7 of each diatonic target (skip I and vii°).
// ---------------------------------------------------------------------------

/** A diatonic target (ii…vi) and the secondary dominant that resolves to it. */
export interface SecondaryDominant {
  /** Roman numeral of the secondary dominant, e.g. "V7/V". */
  label: string;
  /** Roman numeral of the diatonic target it resolves to, e.g. "V". */
  target: string;
  /** The diatonic target chord symbol in the key, e.g. "G7" (V in C). */
  targetChord: string;
  /** The secondary dominant chord (a dom7 a P5 above the target's root). */
  chord: ChordShape;
}

// The 5 targets we show: ii, iii, IV, V, vi. We deliberately skip I (its "V7"
// is just the key's own V7) and vii° (a diminished target has no functional
// secondary dominant in common practice). Index into the major-key arrays,
// which are 0=I … 6=VII.
const SECONDARY_TARGETS: { roman: string; degreeIdx: number }[] = [
  { roman: "ii", degreeIdx: 1 },
  { roman: "iii", degreeIdx: 2 },
  { roman: "IV", degreeIdx: 3 },
  { roman: "V", degreeIdx: 4 },
  { roman: "vi", degreeIdx: 5 },
];

/**
 * The 5 secondary dominants of a major key (V7/ii, V7/iii, V7/IV, V7/V, V7/vi).
 *
 * Uses tonal's `Key.majorKey(key).secondaryDominants`, which lists, per scale
 * degree, the dom7 that tonicizes that degree. Verified: in C major it returns
 * ['', 'A7','B7','C7','D7','E7',''] → V7/ii=A7, V7/iii=B7, V7/IV=C7, V7/V=D7,
 * V7/vi=E7. We pair each with its diatonic target chord for the label.
 * Ref: classic tonal-harmony texts; cross-checked that D7={D,F#,A,C} and
 * E7={E,G#,B,D} (the P5-above-target dom7s).
 */
export function secondaryDominants(key: string): SecondaryDominant[] {
  const mk = Key.majorKey(key);
  const out: SecondaryDominant[] = [];
  for (const t of SECONDARY_TARGETS) {
    const sym = mk.secondaryDominants[t.degreeIdx];
    if (!sym) continue; // tonal leaves I and vii° blank — skip defensively
    out.push({
      label: `V7/${t.roman}`,
      target: t.roman,
      targetChord: mk.chords[t.degreeIdx],
      chord: shapeOf(sym),
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// 2. Modal interchange — chords borrowed from the parallel minor.
// ---------------------------------------------------------------------------

export interface BorrowedChord {
  /** Roman numeral as borrowed, e.g. "iv", "bVII", "iiø". */
  label: string;
  chord: ChordShape;
}

// The common borrowed chords from the parallel (natural) minor, as TRIADS for
// the four that are triads in practice, plus the half-diminished ii (iiø). Each
// is built by transposing the tonic by the minor-scale interval, so the chroma
// and spelling come straight from tonal. Verified in C: iv=Fm{F,Ab,C},
// bVI=Ab{Ab,C,Eb}, bVII=Bb{Bb,D,F}, bIII=Eb{Eb,G,Bb}, iiø=Dm7b5{D,F,Ab,C}.
// Ref: parallel-minor borrowing (Levine, jazz/pop harmony texts).
const BORROWED: { label: string; ivl: string; quality: string }[] = [
  { label: "iiø", ivl: "2M", quality: "m7b5" },
  { label: "bIII", ivl: "3m", quality: "" },
  { label: "iv", ivl: "4P", quality: "m" },
  { label: "bVI", ivl: "6m", quality: "" },
  { label: "bVII", ivl: "7m", quality: "" },
];

/**
 * Chords borrowed from the parallel minor of a major key (modal interchange).
 * Returns iiø, bIII, iv, bVI, bVII in ascending-degree order.
 */
export function borrowedChords(key: string): BorrowedChord[] {
  return BORROWED.map((b) => {
    const root = simpleRoot(Note.pitchClass(Note.transpose(key, b.ivl)));
    return { label: b.label, chord: shapeOf(`${root}${b.quality}`) };
  });
}

// ---------------------------------------------------------------------------
// 3. Tritone substitution — swap a dom7 for the dom7 a tritone away.
// ---------------------------------------------------------------------------

export interface TritoneSubstitution {
  /** The original dominant 7th. */
  original: ChordShape;
  /** The substitute dom7, a tritone away (shares the 3rd & 7th). */
  sub: ChordShape;
  /** Pitch-class chromas of the shared tritone (the orig's 3rd & 7th). */
  sharedTritoneChromas: number[];
  /** Spellings of the shared tritone, from the original chord. */
  sharedTritoneNotes: string[];
}

/**
 * The tritone substitution of a dominant 7th chord.
 *
 * The sub is the dom7 whose root is a tritone (interval 5d) from the original
 * root — using 5d gives the flat spelling the substitution is normally written
 * with (G7 → Db7, not C#7). The two chords share the same tritone: the 3rd and
 * 7th of one are the 7th and 3rd of the other. Verified: G7={G,B,D,F} ↔
 * Db7={Db,F,Ab,Cb}; shared tritone = {B,F} (chromas 11 & 5; Cb≡B). Returns []
 * if the symbol isn't a dominant 7th.
 * Ref: standard jazz reharmonization (the shared 3rd/7th tritone is the device).
 */
export function tritoneSub(chordSymbol: string): TritoneSubstitution | null {
  const orig = Chord.get(chordSymbol);
  if (orig.empty || orig.tonic == null) return null;
  // Require a dominant-7th interval structure (1 3M 5P 7m) so the tritone device
  // is meaningful; reject anything else (maj7, m7, triads…).
  const ivls = orig.intervals.join(" ");
  if (ivls !== "1P 3M 5P 7m") return null;

  const subRoot = simpleRoot(Note.pitchClass(Note.transpose(orig.tonic, "5d")));
  const sub = shapeOf(`${subRoot}7`);

  // The shared tritone is the original's 3rd (3M) and 7th (7m).
  const third = orig.notes[1];
  const seventh = orig.notes[3];
  return {
    original: shapeOf(chordSymbol),
    sub,
    sharedTritoneChromas: [Note.chroma(third)!, Note.chroma(seventh)!],
    sharedTritoneNotes: [Note.pitchClass(third), Note.pitchClass(seventh)],
  };
}

// ---------------------------------------------------------------------------
// 4. Inversions — same chord tones, different bass (lowest sounding note).
// ---------------------------------------------------------------------------

export interface Inversion {
  /** "根音位置" / "第一轉位" etc. */
  label: string;
  /** Slash-chord symbol, e.g. "C/E" (root position has no slash). */
  symbol: string;
  /** Pitch class of the bass (lowest) note for this inversion. */
  bass: string;
  /** Degree of the bass note within the chord ("1","3","5","7"). */
  bassDegree: string;
  /** The chord tones (root-ordered spellings) — identical across inversions. */
  notes: string[];
}

const INV_LABELS = ["根音位置", "第一轉位", "第二轉位", "第三轉位"];

/**
 * The inversions of a chord: same tones, each with a different bass note.
 * A triad has 3 (root/1st/2nd); a 7th chord has 4 (adds 3rd inversion).
 *
 * Built from the chord's own notes — inversion N puts note[N] in the bass. The
 * slash symbol and bass come straight from the chord tones, so spelling is
 * tonal's. Verified: C → bass notes C, E, G (root, 1st=C/E, 2nd=C/G); Cmaj7 →
 * C, E, G, B. Ref: standard chord-inversion theory (figured-bass).
 */
export function inversions(chordSymbol: string): Inversion[] {
  const c = Chord.get(chordSymbol);
  if (c.empty || c.notes.length < 3) return [];
  const degrees = c.intervals.map(intervalToDegree);
  const notes = c.notes;
  return notes.map((bass, i) => ({
    label: INV_LABELS[i] ?? `第${i}轉位`,
    symbol:
      i === 0 ? chordSymbol : `${chordSymbol}/${Note.pitchClass(bass)}`,
    bass: Note.pitchClass(bass),
    bassDegree: degrees[i],
    notes,
  }));
}

// ---------------------------------------------------------------------------
// 5. Drop-2 voicings — close-position 4-note voicing, 2nd-from-top dropped 8ve.
// ---------------------------------------------------------------------------

/** String sets a drop-2 voicing can sit on (top string index = highest pitch). */
export interface DropTwoStringSet {
  id: string;
  label: string;
  /** Index (in STANDARD_TUNING) of the HIGHEST string in the 4-string set. */
  topStringIdx: number;
}

// Three adjacent 4-string sets, named by their string numbers (1=high e … 6=low E).
export const DROP2_STRING_SETS: DropTwoStringSet[] = [
  { id: "1-4", label: "第1-4弦 (e B G D)", topStringIdx: 0 },
  { id: "2-5", label: "第2-5弦 (B G D A)", topStringIdx: 1 },
  { id: "3-6", label: "第3-6弦 (G D A E)", topStringIdx: 2 },
];

/** One note of a drop-2 voicing, placed at an exact string + fret. */
export interface VoicedNote {
  /** String index into STANDARD_TUNING (0 = high e). */
  string: number;
  fret: number;
  pitchClass: string;
  octave: number;
  degree: string;
  /** True for the lowest-sounding (bass) note of the voicing. */
  isBass: boolean;
  /** True if this note is the chord root. */
  isRoot: boolean;
}

export interface DropTwoVoicing {
  /** Inversion index 0–3 (0 = root-position close voicing before the drop). */
  inversion: number;
  label: string;
  /** Bass (lowest) note pitch class of the voicing. */
  bass: string;
  /** Degree of the bass within the chord. */
  bassDegree: string;
  /** The 4 voiced notes, low string → high string. */
  voiced: VoicedNote[];
}

/**
 * Build a close-position 4-note voicing starting on chord-tone index `startIdx`,
 * ascending from `startOctave`. e.g. Cmaj7 [C,E,G,B] @ startIdx 0 → C4 E4 G4 B4;
 * startIdx 1 → E4 G4 B4 C5. Each successive note is raised by octaves until it
 * is strictly above the previous, keeping the stack ascending and within ~an 8ve.
 */
function closeVoicing(
  tones: string[],
  startIdx: number,
  startOctave: number,
): string[] {
  const n = tones.length;
  const notes: string[] = [];
  let prevMidi = -Infinity;
  for (let k = 0; k < n; k++) {
    const pc = tones[(startIdx + k) % n];
    let oct = startOctave;
    let midi = Note.midi(`${pc}${oct}`)!;
    while (midi <= prevMidi) {
      oct += 1;
      midi = Note.midi(`${pc}${oct}`)!;
    }
    notes.push(`${pc}${oct}`);
    prevMidi = midi;
  }
  return notes;
}

/**
 * Drop-2: take an ascending close-position voicing and move its 2nd-from-the-top
 * note down one octave, then re-sort ascending. This spreads the 4 notes so they
 * fall on 4 adjacent strings.
 */
function applyDrop2(close: string[]): string[] {
  const secondFromTop = close.length - 2;
  const dropped = Note.transpose(close[secondFromTop], "-8P");
  const rest = close.filter((_, i) => i !== secondFromTop);
  return [dropped, ...rest].sort((a, b) => Note.midi(a)! - Note.midi(b)!);
}

/**
 * Shift a whole voicing by octaves so every note lands on the rendered board
 * (frets 0..maxFret). closeVoicing builds the stack at octave 4, which only sits
 * in range for the high (1-4) string set; on the 2-5 and 3-6 sets the identical
 * pitches map to frets past the neck and the Fretboard silently drops them,
 * leaving a partial or empty diagram. Moving the WHOLE voicing down by 12
 * semitones preserves the drop-2 shape and the string assignments — only the
 * register changes — and lowers every fret by 12. We only ever shift DOWN
 * because the octave-4 stack is always above the board.
 */
function fitVoicingToBoard(
  voiced: VoicedNote[],
  maxFret: number,
): VoicedNote[] {
  if (voiced.length === 0) return voiced;
  const frets = voiced.map((v) => v.fret);
  const rawMax = Math.max(...frets);
  const rawMin = Math.min(...frets);
  let shiftOct = rawMax > maxFret ? Math.ceil((rawMax - maxFret) / 12) : 0;
  // Defensive: never push the lowest note below the nut. The small fret span of
  // an adjacent-string drop-2 voicing means a single octave shift always fits,
  // but this keeps every fret valid even if a future chord widened the span.
  while (shiftOct > 0 && rawMin - 12 * shiftOct < 0) shiftOct -= 1;
  if (shiftOct === 0) return voiced;
  return voiced.map((v) => ({
    ...v,
    fret: v.fret - 12 * shiftOct,
    octave: v.octave - shiftOct,
  }));
}

/**
 * Drop-2 voicings of a 4-note (7th) chord on one string set, all 4 inversions.
 *
 * tonal has no drop-2 dictionary, so we compute it (the spec's instruction):
 * for each inversion, build the close-position 1-3-5-7 stack starting on that
 * chord tone, drop the 2nd-from-top note an octave, then lay the 4 ascending
 * notes onto the 4 adjacent strings of the set (lowest note → lowest string).
 *
 * Validated against a published reference: Cmaj7 drop-2 on the D-G-B-e (1-4)
 * string set, lowest voicing = frets D5 G5 B5 e7 → G3 C4 E4 B4 (bass = the 5th,
 * G). The 4 inversions cycle the bass through 5th→7th→root→3rd, matching
 * standard drop-2 charts. Returns [] unless the chord has exactly 4 tones.
 * Ref: mattwarnockguitar.com drop-2 maj7 shapes; Mark Levine, *The Jazz Guitar
 * Book* drop-2 system.
 */
export function drop2Voicings(
  chordSymbol: string,
  stringSetId: string = DROP2_STRING_SETS[0].id,
  maxFret: number = DEFAULT_FRET_COUNT,
): DropTwoVoicing[] {
  const c = Chord.get(chordSymbol);
  if (c.empty || c.notes.length !== 4) return [];
  const set =
    DROP2_STRING_SETS.find((s) => s.id === stringSetId) ?? DROP2_STRING_SETS[0];

  const tones = c.notes;
  const rootChroma = Note.chroma(c.tonic ?? tones[0]);
  const degreeByChroma = new Map<number, string>();
  c.notes.forEach((n, i) => {
    const ch = Note.chroma(n);
    if (ch != null) degreeByChroma.set(ch, intervalToDegree(c.intervals[i]));
  });

  return [0, 1, 2, 3].map((inv) => {
    const close = closeVoicing(tones, inv, 4);
    const voicing = applyDrop2(close); // 4 notes, low → high
    const placed: VoicedNote[] = voicing.map((note, k) => {
      // Lowest note → lowest string in the set (highest string index).
      const stringIdx = set.topStringIdx + (voicing.length - 1) - k;
      const open = STANDARD_TUNING[stringIdx];
      const fret = Note.midi(note)! - Note.midi(open)!;
      const chroma = Note.chroma(note)!;
      return {
        string: stringIdx,
        fret,
        pitchClass: Note.pitchClass(note),
        octave: Note.octave(note) ?? 0,
        degree: degreeByChroma.get(chroma) ?? "",
        isBass: k === 0,
        isRoot: chroma === rootChroma,
      };
    });
    // Anchor the voicing onto the rendered board so all 4 notes stay visible
    // (the octave-4 stack runs off the neck on the lower string sets).
    const voiced = fitVoicingToBoard(placed, maxFret);
    return {
      inversion: inv,
      label: INV_LABELS[inv] ?? `第${inv}轉位`,
      bass: voiced[0].pitchClass,
      bassDegree: voiced[0].degree,
      voiced,
    };
  });
}

// ---------------------------------------------------------------------------
// Marker projection helpers — turn the data above into Marker[] for the
// Fretboard. Mirrors chords.ts: chroma matching, root = red ("root"), other
// tones = dark ("scale"); an optional second chord uses blue ("custom").
// ---------------------------------------------------------------------------

interface ProjectOpts {
  tuning?: readonly string[];
  fromFret?: number;
  toFret?: number;
}

/**
 * Project one chord shape onto the whole neck by chroma (every occurrence),
 * exactly like chordMarkers: root red, other tones dark, degree labels from the
 * chord. `role` can be overridden so a second chord renders in a distinct color.
 */
export function chordShapeMarkers(
  shape: ChordShape,
  opts: ProjectOpts & { nonRootRole?: "scale" | "custom" } = {},
): Marker[] {
  const tuning = opts.tuning ?? STANDARD_TUNING;
  const fromFret = opts.fromFret ?? 0;
  const toFret = opts.toFret ?? DEFAULT_FRET_COUNT;
  const nonRootRole = opts.nonRootRole ?? "scale";

  const rootChroma = Note.chroma(shape.root);
  const degreeByChroma = new Map<number, string>();
  const spellingByChroma = new Map<number, string>();
  shape.notes.forEach((n, i) => {
    const ch = Note.chroma(n);
    if (ch == null) return;
    degreeByChroma.set(ch, shape.degrees[i]);
    spellingByChroma.set(ch, Note.pitchClass(n));
  });

  const markers: Marker[] = [];
  tuning.forEach((open, stringIdx) => {
    for (let fret = fromFret; fret <= toFret; fret++) {
      const midi = midiAt(open, fret);
      const chroma = midi % 12;
      if (!degreeByChroma.has(chroma)) continue;
      const isRoot = chroma === rootChroma;
      markers.push({
        string: stringIdx,
        fret,
        pitchClass: spellingByChroma.get(chroma)!,
        octave: Math.floor(midi / 12) - 1,
        degree: degreeByChroma.get(chroma),
        role: isRoot ? "root" : nonRootRole,
        isRoot,
      });
    }
  });
  return markers;
}

/**
 * Markers for an inversion: project the chord tones by chroma (root red, others
 * dark), but render every occurrence of the BASS note as a reference-gray marker
 * labelled with "(低音)" so the lowest-sounding note is visually called out. The
 * fretboard can't enforce which note is physically lowest, so we mark the bass
 * pitch class distinctly and name it in the explanation text instead.
 */
export function inversionMarkers(inv: Inversion, opts: ProjectOpts = {}): Marker[] {
  const shape: ChordShape = {
    symbol: inv.symbol,
    notes: inv.notes,
    degrees: Chord.get(inv.symbol.split("/")[0]).intervals.map(intervalToDegree),
    root: Note.pitchClass(inv.notes[0]),
  };
  const bassChroma = Note.chroma(inv.bass);
  // Mark every occurrence of the bass pitch class with the reference (gray) role
  // so the learner sees WHICH note is the bass — but DON'T set a "(低音)" label:
  // across the whole neck that cluttered the board and hid the note name. The gray
  // colour + the legend ("灰 = 低音") carry the meaning; the explanation names it.
  return chordShapeMarkers(shape, opts).map((m) =>
    Note.chroma(m.pitchClass) === bassChroma
      ? { ...m, role: "reference" as const }
      : m,
  );
}

/**
 * Markers for one drop-2 voicing: exactly the 4 voiced notes at their computed
 * string/fret (no whole-neck projection — the voicing IS a specific shape). The
 * bass note is reference-gray + "(低音)"; the root stays red; others dark.
 */
export function drop2Markers(voicing: DropTwoVoicing): Marker[] {
  return voicing.voiced
    .filter((v) => v.fret >= 0)
    .map((v) => ({
      string: v.string,
      fret: v.fret,
      pitchClass: v.pitchClass,
      octave: v.octave,
      degree: v.degree,
      role: v.isBass ? ("reference" as const) : v.isRoot ? ("root" as const) : ("scale" as const),
      // Bass = gray (reference) role; no "(低音)" label — the legend conveys it, so
      // the circle shows its note/degree like the others (consistent with inversions).
      isRoot: v.isRoot,
    }));
}

/**
 * Markers for the tritone-substitution overlay. The original chord (dark) and its
 * sub (blue) are projected together, BUT the SHARED tritone — the two chords'
 * common 3rd/7th — is drawn ONCE in a distinct "shared" role (purple) rather than
 * stacking a dark and a blue marker at the same fret (where the blue would hide
 * the dark and the lesson "they share a tritone" would be invisible). Each root
 * stays red. So a cell is purple iff its pitch class is one of the shared tritone
 * tones (and it isn't a root).
 */
export function tritoneSubMarkers(
  t: TritoneSubstitution,
  opts: ProjectOpts = {},
): Marker[] {
  const sharedChromas = new Set(t.sharedTritoneChromas);
  const isShared = (m: Marker) => {
    const ch = Note.chroma(m.pitchClass);
    return !m.isRoot && ch != null && sharedChromas.has(ch);
  };
  const orig = chordShapeMarkers(t.original, { ...opts, nonRootRole: "scale" });
  const sub = chordShapeMarkers(t.sub, { ...opts, nonRootRole: "custom" });
  return [
    // Tag the shared tritone tones on the original layer as "shared" (purple)…
    ...orig.map((m) => (isShared(m) ? { ...m, role: "shared" as const } : m)),
    // …and drop them from the sub layer so each shared position is drawn once.
    ...sub.filter((m) => !isShared(m)),
  ];
}
