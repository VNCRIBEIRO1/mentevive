/**
 * Tests for WhatsApp URL builder and utility functions.
 */
import { describe, it, expect } from "vitest";
import { buildWhatsAppUrl, WHATSAPP_LINK } from "@/lib/utils";

describe("WhatsApp Utilities", () => {
  describe("buildWhatsAppUrl", () => {
    it("should build wa.me URL with Brazilian phone number", () => {
      const url = buildWhatsAppUrl("11988840525");
      expect(url).toBe("https://wa.me/5511988840525");
    });

    it("should handle phone with country code already", () => {
      const url = buildWhatsAppUrl("5511988840525");
      expect(url).toBe("https://wa.me/5511988840525");
    });

    it("should add message as query parameter", () => {
      const url = buildWhatsAppUrl("11988840525", "Olá, Bea!");
      expect(url).toContain("?text=");
      expect(url).toContain(encodeURIComponent("Olá, Bea!"));
    });

    it("should return URL without text when no message", () => {
      const url = buildWhatsAppUrl("11988840525");
      expect(url).not.toContain("?text=");
    });

    it("should strip non-numeric characters from phone", () => {
      const url = buildWhatsAppUrl("(11) 98884-0525");
      expect(url).toBe("https://wa.me/5511988840525");
    });
  });

  describe("WHATSAPP_LINK constant", () => {
    it("should be an empty string (tenant-specific, configured at runtime)", () => {
      expect(WHATSAPP_LINK).toBe("");
    });
  });
});
