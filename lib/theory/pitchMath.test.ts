import { describe, it, expect } from "vitest";
import { Midi } from "tonal";
import {
  frequencyToReading,
  centsBetween,
  freqToMidiFloat,
  IN_TUNE_CENTS,
} from "./pitchMath";

// Equal-tempered frequency that is `cents` away from `midi` (440 Hz = A4 = 69).
const atCents = (midi: number, cents: number) =>
  Midi.midiToFreq(midi) * Math.pow(2, cents / 1200);

describe("freqToMidiFloat / centsBetween", () => {
  it("440 Hz is exactly MIDI 69 (the A4 reference)", () => {
    expect(freqToMidiFloat(440)).toBeCloseTo(69, 10);
    expect(centsBetween(440, 69)).toBe(0);
  });

  it("cents carry sign and magnitude: ±25¢ around A4", () => {
    // A sharp string reads positive cents, a flat string negative — that sign is
    // what tells the UI which way the needle (and the user's tuning peg) goes.
    expect(centsBetween(atCents(69, 25), 69)).toBe(25);
    expect(centsBetween(atCents(69, -25), 69)).toBe(-25);
  });
});

describe("frequencyToReading — chromatic mode", () => {
  it("440 Hz → A4, 0¢, in tune", () => {
    const r = frequencyToReading(440, "chromatic");
    expect(r.noteName).toBe("A4");
    expect(r.pitchClass).toBe("A");
    expect(r.octave).toBe(4);
    expect(r.midi).toBe(69);
    expect(r.cents).toBe(0);
    expect(r.inTune).toBe(true);
  });

  it("low E2 (82.41 Hz) reads E2 within 1¢", () => {
    const r = frequencyToReading(82.41, "chromatic");
    expect(r.noteName).toBe("E2");
    expect(r.midi).toBe(40);
    expect(Math.abs(r.cents)).toBeLessThanOrEqual(1);
  });

  it("exact tonal frequencies round-trip to 0¢ (E2 and E4)", () => {
    // The note-math is the inverse of tonal's midiToFreq, so feeding a target's
    // own frequency back in must report perfectly in-tune — no drift in the map.
    expect(frequencyToReading(Midi.midiToFreq(40), "chromatic").cents).toBe(0);
    expect(frequencyToReading(Midi.midiToFreq(64), "chromatic").cents).toBe(0);
  });

  it("snaps to the nearer semitone at the ±50¢ boundary", () => {
    // +49¢ still belongs to A4; +51¢ has crossed the midpoint into the next
    // semitone (MIDI 70) and reads as −49¢ of it. This pins WHERE the note label
    // flips (the semitone border). tonal spells MIDI 70 with a flat → "Bb4",
    // which is the spelling this whole codebase uses (Note.fromMidi favors flats).
    const justUnder = frequencyToReading(atCents(69, 49), "chromatic");
    expect(justUnder.noteName).toBe("A4");
    expect(justUnder.cents).toBe(49);

    const justOver = frequencyToReading(atCents(69, 51), "chromatic");
    expect(justOver.noteName).toBe("Bb4");
    expect(justOver.pitchClass).toBe("Bb");
    expect(justOver.midi).toBe(70);
    expect(justOver.cents).toBe(-49);
  });

  it("inTune flips exactly at IN_TUNE_CENTS", () => {
    // Exactly at the threshold is in tune; one cent beyond is not. The boundary
    // is inclusive so a string sitting right on the tolerance reads green.
    expect(frequencyToReading(atCents(69, IN_TUNE_CENTS), "chromatic").inTune).toBe(
      true,
    );
    expect(
      frequencyToReading(atCents(69, IN_TUNE_CENTS + 1), "chromatic").inTune,
    ).toBe(false);
  });
});

describe("frequencyToReading — guitar mode (string snapping)", () => {
  // STANDARD_TUNING tab order: index 0 = high E4 … index 5 = low E2.
  const OPEN = [
    { hz: 329.63, note: "E4", index: 0 },
    { hz: 246.94, note: "B3", index: 1 },
    { hz: 196.0, note: "G3", index: 2 },
    { hz: 146.83, note: "D3", index: 3 },
    { hz: 110.0, note: "A2", index: 4 },
    { hz: 82.41, note: "E2", index: 5 },
  ];

  it("each open string maps to its own stringIndex at ~0¢", () => {
    for (const s of OPEN) {
      const r = frequencyToReading(s.hz, "guitar");
      expect(r.noteName).toBe(s.note);
      expect(r.stringIndex).toBe(s.index);
      expect(Math.abs(r.cents)).toBeLessThanOrEqual(1);
    }
  });

  it("a very flat low E (80 Hz) still reads E2 / string 6 — NOT D#2", () => {
    // THE core UX guarantee. 80 Hz is ~52¢ below E2, i.e. past the chromatic
    // midpoint toward D#2. Chromatic mode would flip the label to D#2 and the
    // user — correctly tuning the low E — would see the wrong note. Guitar mode
    // snaps to the nearest STRING, so it stays E2 and the meter says "go up".
    const r = frequencyToReading(80, "guitar");
    expect(r.noteName).toBe("E2");
    expect(r.stringIndex).toBe(5);
    expect(r.cents).toBeLessThan(0); // flat → needle points up to pitch
  });

  it("a non-open pitch snaps to the nearest open string", () => {
    // C4 (261.63 Hz) isn't an open string. It sits between B3 and D3; the nearest
    // target by cents is B3, so guitar mode reports B3 (with large +cents) rather
    // than refusing or inventing a C string.
    const r = frequencyToReading(261.63, "guitar");
    expect(r.noteName).toBe("B3");
    expect(r.stringIndex).toBe(1);
    expect(r.cents).toBeGreaterThan(0);
  });
});
