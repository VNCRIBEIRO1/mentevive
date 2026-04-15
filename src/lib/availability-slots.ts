import { generateTimeSlots, timeToMinutes } from "@/lib/time-utils";

export type AvailabilitySlot = {
  id?: string;
  dayOfWeek?: number | null;
  date?: string | null;
  startTime: string;
  endTime: string;
  active?: boolean;
};

export function getAvailabilityForDate(dateStr: string, slots: AvailabilitySlot[]): AvailabilitySlot[] {
  const dayOfWeek = new Date(`${dateStr}T00:00:00`).getDay();
  return slots.filter((slot) => {
    if (slot.active === false) return false;
    if (slot.date) return slot.date === dateStr;
    return slot.dayOfWeek === dayOfWeek;
  });
}

export function hasAvailabilityOnDate(dateStr: string, slots: AvailabilitySlot[]): boolean {
  return getAvailabilityForDate(dateStr, slots).length > 0;
}

/**
 * Generate selectable start times at `intervalMin`-minute intervals.
 * Each returned time is a valid start for a session of `sessionDurationMin`.
 */
export function getTimeOptionsForDate(
  dateStr: string,
  slots: AvailabilitySlot[],
  intervalMin = 10,
  sessionDurationMin = 60
): string[] {
  const times = getAvailabilityForDate(dateStr, slots).flatMap((slot) => {
    // Generate start times where the full session fits within the slot
    const slotStart = timeToMinutes(slot.startTime);
    const slotEnd = timeToMinutes(slot.endTime);
    const result: string[] = [];
    for (let t = slotStart; t + sessionDurationMin <= slotEnd; t += intervalMin) {
      const h = Math.floor(t / 60);
      const m = t % 60;
      result.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
    return result;
  });

  return [...new Set(times)].sort();
}

/**
 * Check whether a specific time range [startTime, endTime] fits within
 * any availability window on the given date.
 */
export function isTimeWithinAvailability(
  dateStr: string,
  startTime: string,
  endTime: string,
  slots: AvailabilitySlot[]
): boolean {
  const reqStart = timeToMinutes(startTime);
  const reqEnd = timeToMinutes(endTime);
  return getAvailabilityForDate(dateStr, slots).some((slot) => {
    const slotStart = timeToMinutes(slot.startTime);
    const slotEnd = timeToMinutes(slot.endTime);
    return reqStart >= slotStart && reqEnd <= slotEnd;
  });
}
