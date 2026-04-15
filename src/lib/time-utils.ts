/**
 * Canonical time slot generator — shared across landing page and portal.
 *
 * Given a start and end time string ("HH:MM"), produces an array of
 * slot start times at `intervalMin`-minute intervals where each slot
 * fits fully within [start, end].
 */
export function generateTimeSlots(
  start: string,
  end: string,
  intervalMin = 60
): string[] {
  const slots: string[] = [];
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let cur = sh * 60 + (sm || 0);
  const endMin = eh * 60 + (em || 0);

  while (cur + intervalMin <= endMin) {
    const h = Math.floor(cur / 60);
    const m = cur % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    cur += intervalMin;
  }
  return slots;
}

/**
 * Converts a "HH:MM" string to minutes since midnight.
 */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

/**
 * Converts minutes since midnight to "HH:MM" string.
 */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Given a startTime "HH:MM", returns endTime "HH:MM" after adding durationMin.
 */
export function addMinutesToTime(time: string, durationMin: number): string {
  return minutesToTime(timeToMinutes(time) + durationMin);
}
