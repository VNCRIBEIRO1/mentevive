/**
 * Jitsi Meet utilities — room name generation, link building.
 *
 * SERVER-ONLY: This module uses NEXTAUTH_SECRET and Node crypto.
 * For client-safe config (domain, UI overrides), import from `@/lib/jitsi-config`.
 *
 * Room names are deterministic: based on the appointment ID + secret
 * so both admin and patient always resolve to the same room,
 * but the name is not guessable from the appointment ID alone.
 */

import "server-only";
import { createHash } from "crypto";
import { JITSI_DOMAIN, ROOM_PREFIX } from "./jitsi-config";
import { getAuthSecret } from "./auth-secret";

// Re-export client-safe constants for backward-compat with server-side imports
export { JITSI_DOMAIN, ROOM_PREFIX, jitsiConfig, jitsiInterfaceConfig } from "./jitsi-config";

/** Build a deterministic, non-guessable room name from an appointment ID */
export function buildRoomName(appointmentId: string): string {
  const secret = getAuthSecret();
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET or AUTH_SECRET is required for Jitsi room generation");
  }
  const hash = createHash("sha256")
    .update(appointmentId + secret)
    .digest("hex")
    .slice(0, 16);
  return `${ROOM_PREFIX}-${hash}`;
}

/** Full Jitsi meeting URL for a given appointment */
export function buildMeetingUrl(appointmentId: string): string {
  return `https://${JITSI_DOMAIN}/${buildRoomName(appointmentId)}`;
}
