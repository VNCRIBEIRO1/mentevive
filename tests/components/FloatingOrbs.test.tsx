// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { FloatingOrbs } from "@/components/landing/FloatingOrbs";

// Mock framer-motion values to avoid JSDOM issues
vi.mock("framer-motion", async () => {
  const actual = await vi.importActual<typeof import("framer-motion")>("framer-motion");
  return {
    ...actual,
    useReducedMotion: () => false,
    useMotionValue: (initial: number) => ({
      get: () => initial,
      set: () => {},
    }),
    useSpring: (source: { get: () => number }) => ({
      get: () => source.get(),
      set: () => {},
    }),
  };
});

describe("FloatingOrbs", () => {
  it("renders 3 orb elements", () => {
    const { container } = render(<FloatingOrbs />);
    const wrapper = container.firstChild as HTMLElement;
    // 3 orb divs inside the container
    expect(wrapper.children.length).toBe(3);
  });

  it("is hidden from screen readers", () => {
    const { container } = render(<FloatingOrbs />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });

  it("is non-interactive (pointer-events-none)", () => {
    const { container } = render(<FloatingOrbs />);
    expect(container.firstChild).toHaveClass("pointer-events-none");
  });

  it("applies custom className", () => {
    const { container } = render(<FloatingOrbs className="z-0" />);
    expect(container.firstChild).toHaveClass("z-0");
  });

  it("orbs have blur classes", () => {
    const { container } = render(<FloatingOrbs />);
    const orbElements = (container.firstChild as HTMLElement).children;
    for (const orb of Array.from(orbElements)) {
      const classes = orb.className;
      expect(classes).toMatch(/blur-\[/);
    }
  });

  it("orbs have animation classes", () => {
    const { container } = render(<FloatingOrbs />);
    const orbElements = (container.firstChild as HTMLElement).children;
    for (const orb of Array.from(orbElements)) {
      const classes = orb.className;
      expect(classes).toMatch(/animate-/);
    }
  });

  it("orbs have low opacity for subtlety", () => {
    const { container } = render(<FloatingOrbs />);
    const orbElements = (container.firstChild as HTMLElement).children;
    for (const orb of Array.from(orbElements)) {
      expect(orb.className).toContain("opacity-[0.12]");
    }
  });
});
