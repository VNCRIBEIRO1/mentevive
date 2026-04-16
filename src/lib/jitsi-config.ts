/**
 * Jitsi Meet client-safe configuration.
 *
 * These constants can be imported from both server and client components.
 * For server-only functions (room name generation), use `@/lib/jitsi`.
 */

export const JITSI_DOMAIN = "meet.jit.si";
export const ROOM_PREFIX = "mv";

/** Config overrides for the Jitsi External API iframe */
export const jitsiConfig = {
  startWithAudioMuted: true,
  startWithVideoMuted: false,
  prejoinPageEnabled: false,
  disableDeepLinking: true,
  enableWelcomePage: false,
  enableClosePage: false,
  disableModeratorIndicator: true,
  disableReactions: true,
  hiddenPremeetingButtons: ["invite"] as string[],
};

export const jitsiInterfaceConfig = {
  SHOW_JITSI_WATERMARK: false,
  SHOW_WATERMARK_FOR_GUESTS: false,
  TOOLBAR_BUTTONS: [
    "microphone",
    "camera",
    "desktop",
    "chat",
    "raisehand",
    "tileview",
    "hangup",
  ],
  DISABLE_VIDEO_BACKGROUND: true,
  DEFAULT_BACKGROUND: "#FFF5EE",
};
