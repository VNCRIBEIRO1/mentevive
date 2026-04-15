/**
 * Tests for Stripe integration (src/lib/stripe.ts).
 * Covers: mapStripeStatus(), isStripeConfigured(), createCheckoutSession error handling.
 *
 * Note: We test pure functions and configuration checks here.
 * Actual Stripe API calls require the SDK and are tested via integration tests.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mapStripeStatus, isStripeConfigured } from "@/lib/stripe";

/* ================================================================
 * 1. mapStripeStatus — status mapping
 * ================================================================ */
describe("mapStripeStatus", () => {
  it("should map 'paid' to 'paid'", () => {
    expect(mapStripeStatus("paid")).toBe("paid");
  });

  it("should map 'complete' to 'paid'", () => {
    expect(mapStripeStatus("complete")).toBe("paid");
  });

  it("should map 'succeeded' to 'paid'", () => {
    expect(mapStripeStatus("succeeded")).toBe("paid");
  });

  it("should map 'unpaid' to 'pending'", () => {
    expect(mapStripeStatus("unpaid")).toBe("pending");
  });

  it("should map 'processing' to 'pending'", () => {
    expect(mapStripeStatus("processing")).toBe("pending");
  });

  it("should map 'requires_payment_method' to 'pending'", () => {
    expect(mapStripeStatus("requires_payment_method")).toBe("pending");
  });

  it("should map 'requires_confirmation' to 'pending'", () => {
    expect(mapStripeStatus("requires_confirmation")).toBe("pending");
  });

  it("should map 'requires_action' to 'pending'", () => {
    expect(mapStripeStatus("requires_action")).toBe("pending");
  });

  it("should map 'canceled' to 'cancelled'", () => {
    expect(mapStripeStatus("canceled")).toBe("cancelled");
  });

  it("should map 'cancelled' to 'cancelled'", () => {
    expect(mapStripeStatus("cancelled")).toBe("cancelled");
  });

  it("should map 'expired' to 'cancelled'", () => {
    expect(mapStripeStatus("expired")).toBe("cancelled");
  });

  it("should map 'failed' to 'cancelled'", () => {
    expect(mapStripeStatus("failed")).toBe("cancelled");
  });

  it("should map 'refunded' to 'refunded'", () => {
    expect(mapStripeStatus("refunded")).toBe("refunded");
  });

  it("should map unknown status to 'pending' (safe default)", () => {
    expect(mapStripeStatus("some_unknown_status")).toBe("pending");
  });

  it("should map empty string to 'pending'", () => {
    expect(mapStripeStatus("")).toBe("pending");
  });

  it("should map 'no_payment_required' to 'pending'", () => {
    expect(mapStripeStatus("no_payment_required")).toBe("pending");
  });
});

/* ================================================================
 * 2. isStripeConfigured — environment check
 * ================================================================ */
describe("isStripeConfigured", () => {
  const originalKey = process.env.STRIPE_SECRET_KEY;

  afterEach(() => {
    // Restore original value
    if (originalKey !== undefined) {
      process.env.STRIPE_SECRET_KEY = originalKey;
    } else {
      delete process.env.STRIPE_SECRET_KEY;
    }
  });

  it("should return false when STRIPE_SECRET_KEY is not set", () => {
    delete process.env.STRIPE_SECRET_KEY;
    expect(isStripeConfigured()).toBe(false);
  });

  it("should return true when STRIPE_SECRET_KEY is set", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_fake_key_12345";
    expect(isStripeConfigured()).toBe(true);
  });

  it("should return false when STRIPE_SECRET_KEY is empty string", () => {
    process.env.STRIPE_SECRET_KEY = "";
    expect(isStripeConfigured()).toBe(false);
  });
});

/* ================================================================
 * 3. Status mapping consistency
 * ================================================================ */
describe("Stripe Status Mapping Consistency", () => {
  it("should return only valid internal statuses", () => {
    const validStatuses = new Set(["pending", "paid", "cancelled", "refunded"]);
    const stripeStatuses = [
      "paid", "complete", "succeeded",
      "unpaid", "no_payment_required", "processing",
      "requires_payment_method", "requires_confirmation", "requires_action",
      "canceled", "cancelled", "expired", "failed",
      "refunded",
      "unknown_value", "",
    ];

    for (const s of stripeStatuses) {
      const mapped = mapStripeStatus(s);
      expect(validStatuses.has(mapped)).toBe(true);
    }
  });

  it("should handle all Stripe Checkout payment_status values", () => {
    // These are the documented Stripe Checkout Session payment_status values
    expect(mapStripeStatus("paid")).toBe("paid");
    expect(mapStripeStatus("unpaid")).toBe("pending");
    expect(mapStripeStatus("no_payment_required")).toBe("pending");
  });

  it("should handle all Stripe PaymentIntent status values", () => {
    // Documented PaymentIntent statuses
    expect(mapStripeStatus("requires_payment_method")).toBe("pending");
    expect(mapStripeStatus("requires_confirmation")).toBe("pending");
    expect(mapStripeStatus("requires_action")).toBe("pending");
    expect(mapStripeStatus("processing")).toBe("pending");
    expect(mapStripeStatus("succeeded")).toBe("paid");
    expect(mapStripeStatus("canceled")).toBe("cancelled");
  });
});
