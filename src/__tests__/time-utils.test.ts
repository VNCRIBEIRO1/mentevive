// @vitest-environment node
import { describe, it, expect } from "vitest";
import { generateTimeSlots } from "@/lib/time-utils";

describe("generateTimeSlots", () => {
  it("generates hourly slots for a standard workday", () => {
    const slots = generateTimeSlots("08:00", "12:00");
    expect(slots).toEqual(["08:00", "09:00", "10:00", "11:00"]);
  });

  it("generates hourly slots for afternoon block", () => {
    const slots = generateTimeSlots("13:00", "17:00");
    expect(slots).toEqual(["13:00", "14:00", "15:00", "16:00"]);
  });

  it("returns empty array when window is too small for interval", () => {
    const slots = generateTimeSlots("10:00", "10:30", 60);
    expect(slots).toEqual([]);
  });

  it("generates 30-minute slots when interval is 30", () => {
    const slots = generateTimeSlots("09:00", "11:00", 30);
    expect(slots).toEqual(["09:00", "09:30", "10:00", "10:30"]);
  });

  it("handles non-zero start minutes", () => {
    const slots = generateTimeSlots("08:30", "10:30");
    expect(slots).toEqual(["08:30", "09:30"]);
  });

  it("returns empty when start equals end", () => {
    const slots = generateTimeSlots("10:00", "10:00");
    expect(slots).toEqual([]);
  });

  it("returns empty when end is before start", () => {
    const slots = generateTimeSlots("14:00", "10:00");
    expect(slots).toEqual([]);
  });

  it("handles single slot when exactly one interval fits", () => {
    const slots = generateTimeSlots("09:00", "10:00");
    expect(slots).toEqual(["09:00"]);
  });

  it("does not include a slot that would overflow the end time", () => {
    // 3.5 hours = only 3 complete 60-min slots
    const slots = generateTimeSlots("08:00", "11:30");
    expect(slots).toEqual(["08:00", "09:00", "10:00"]);
  });

  it("defaults to 60-minute interval", () => {
    const a = generateTimeSlots("08:00", "10:00");
    const b = generateTimeSlots("08:00", "10:00", 60);
    expect(a).toEqual(b);
  });
});
