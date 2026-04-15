import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

process.env.NEXTAUTH_SECRET ??= "vitest-nextauth-secret";
vi.mock("server-only", () => ({}));

/* Polyfill IntersectionObserver for jsdom (needed by framer-motion whileInView) */
if (typeof globalThis.IntersectionObserver === "undefined") {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | null = null;
    readonly rootMargin: string = "";
    readonly scrollMargin: string = "";
    readonly thresholds: ReadonlyArray<number> = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  globalThis.IntersectionObserver = MockIntersectionObserver;
}
