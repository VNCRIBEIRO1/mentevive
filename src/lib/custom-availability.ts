import { randomUUID } from "crypto";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { settings } from "@/db/schema";

const CUSTOM_AVAILABILITY_KEY = "custom_availability";

export type CustomAvailabilitySlot = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  active: boolean;
};

function sanitizeSlots(value: unknown): CustomAvailabilitySlot[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((slot) => {
      if (!slot || typeof slot !== "object") return null;
      const typed = slot as Record<string, unknown>;
      const date = typeof typed.date === "string" ? typed.date : "";
      const startTime = typeof typed.startTime === "string" ? typed.startTime : "";
      const endTime = typeof typed.endTime === "string" ? typed.endTime : "";

      if (!date || !startTime || !endTime || startTime >= endTime) return null;

      return {
        id: typeof typed.id === "string" && typed.id ? typed.id : randomUUID(),
        date,
        startTime,
        endTime,
        active: typed.active !== false,
      } satisfies CustomAvailabilitySlot;
    })
    .filter((slot): slot is CustomAvailabilitySlot => Boolean(slot))
    .sort((a, b) =>
      a.date.localeCompare(b.date) ||
      a.startTime.localeCompare(b.startTime) ||
      a.endTime.localeCompare(b.endTime)
    );
}

export async function getCustomAvailability(tenantId: string): Promise<CustomAvailabilitySlot[]> {
  const [row] = await db
    .select({ value: settings.value })
    .from(settings)
    .where(and(eq(settings.tenantId, tenantId), eq(settings.key, CUSTOM_AVAILABILITY_KEY)))
    .limit(1);

  if (!row?.value) return [];

  try {
    return sanitizeSlots(JSON.parse(row.value));
  } catch {
    return [];
  }
}

export async function saveCustomAvailability(tenantId: string, slots: CustomAvailabilitySlot[]): Promise<CustomAvailabilitySlot[]> {
  const sanitized = sanitizeSlots(slots);
  const serialized = JSON.stringify(sanitized);

  await db
    .insert(settings)
    .values({ tenantId, key: CUSTOM_AVAILABILITY_KEY, value: serialized })
    .onConflictDoUpdate({
      target: [settings.tenantId, settings.key],
      set: { value: serialized, updatedAt: new Date() },
    });

  return sanitized;
}

export async function addCustomAvailabilitySlot(
  tenantId: string,
  input: Omit<CustomAvailabilitySlot, "id" | "active"> & { active?: boolean }
): Promise<CustomAvailabilitySlot[]> {
  const current = await getCustomAvailability(tenantId);
  const duplicate = current.find(
    (slot) =>
      slot.date === input.date &&
      slot.startTime === input.startTime &&
      slot.endTime === input.endTime
  );

  if (duplicate) {
    return current;
  }

  return saveCustomAvailability(tenantId, [
    ...current,
    {
      id: randomUUID(),
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      active: input.active ?? true,
    },
  ]);
}

export async function removeCustomAvailabilitySlot(tenantId: string, id: string): Promise<CustomAvailabilitySlot[]> {
  const current = await getCustomAvailability(tenantId);
  return saveCustomAvailability(tenantId, current.filter((slot) => slot.id !== id));
}

export async function listUpcomingCustomAvailability(tenantId: string, fromDate?: string): Promise<CustomAvailabilitySlot[]> {
  const current = await getCustomAvailability(tenantId);
  if (!fromDate) return current;
  return current.filter((slot) => slot.date >= fromDate).sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
}
