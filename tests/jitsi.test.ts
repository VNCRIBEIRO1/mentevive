/**
 * Tests for Jitsi Meet utilities — room name generation, meeting URL building.
 * These are pure functions with no DB/auth dependencies.
 */
import { describe, it, expect } from "vitest";
import { buildRoomName, buildMeetingUrl, jitsiConfig, jitsiInterfaceConfig } from "@/lib/jitsi";

describe("Jitsi Meet Utilities", () => {
  describe("buildRoomName", () => {
    it("should generate a deterministic room name from appointment ID", () => {
      const id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
      const room = buildRoomName(id);
      expect(room).toMatch(/^psicolobia-[0-9a-f]{16}$/);
    });

    it("should produce the same room name for the same appointment ID", () => {
      const id = "12345678-abcd-efgh-ijkl-mnopqrstuvwx";
      expect(buildRoomName(id)).toBe(buildRoomName(id));
    });

    it("should produce different room names for different IDs", () => {
      const room1 = buildRoomName("aaaa-bbbb-cccc-dddd");
      const room2 = buildRoomName("xxxx-yyyy-zzzz-wwww");
      expect(room1).not.toBe(room2);
    });

    it("should produce a hex suffix without hyphens", () => {
      const id = "a-b-c-d-e-f-g";
      const room = buildRoomName(id);
      const suffix = room.replace("psicolobia-", "");
      expect(suffix).not.toContain("-");
      expect(suffix).toMatch(/^[0-9a-f]{16}$/);
    });

    it("should use psicolobia prefix", () => {
      const room = buildRoomName("any-id");
      expect(room).toMatch(/^psicolobia-/);
    });

    it("should limit room suffix to 16 hex chars", () => {
      const id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
      const room = buildRoomName(id);
      const suffix = room.replace("psicolobia-", "");
      expect(suffix.length).toBe(16);
    });
  });

  describe("buildMeetingUrl", () => {
    it("should build a valid meet.jit.si URL", () => {
      const id = "test-appointment-id";
      const url = buildMeetingUrl(id);
      expect(url).toMatch(/^https:\/\/meet\.jit\.si\/psicolobia-/);
    });

    it("should be deterministic — same ID = same URL", () => {
      const id = "abc-123-def-456";
      expect(buildMeetingUrl(id)).toBe(buildMeetingUrl(id));
    });

    it("should produce a URL that includes the room name", () => {
      const id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
      const url = buildMeetingUrl(id);
      const room = buildRoomName(id);
      expect(url).toBe(`https://meet.jit.si/${room}`);
    });
  });

  describe("jitsiConfig", () => {
    it("should start with audio muted", () => {
      expect(jitsiConfig.startWithAudioMuted).toBe(true);
    });

    it("should start with video enabled", () => {
      expect(jitsiConfig.startWithVideoMuted).toBe(false);
    });

    it("should disable prejoin page for immediate entry", () => {
      expect(jitsiConfig.prejoinPageEnabled).toBe(false);
    });

    it("should disable deep linking", () => {
      expect(jitsiConfig.disableDeepLinking).toBe(true);
    });
  });

  describe("jitsiInterfaceConfig", () => {
    it("should hide Jitsi watermark for branded experience", () => {
      expect(jitsiInterfaceConfig.SHOW_JITSI_WATERMARK).toBe(false);
    });

    it("should include essential toolbar buttons", () => {
      expect(jitsiInterfaceConfig.TOOLBAR_BUTTONS).toContain("microphone");
      expect(jitsiInterfaceConfig.TOOLBAR_BUTTONS).toContain("camera");
      expect(jitsiInterfaceConfig.TOOLBAR_BUTTONS).toContain("hangup");
      expect(jitsiInterfaceConfig.TOOLBAR_BUTTONS).toContain("chat");
    });

    it("should use Psicolobia brand background color", () => {
      expect(jitsiInterfaceConfig.DEFAULT_BACKGROUND).toBe("#FFF5EE");
    });
  });
});
