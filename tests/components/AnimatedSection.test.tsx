// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnimatedSection, AnimatedItem } from "@/components/landing/AnimatedSection";

// Mock framer-motion to avoid JSDOM animation issues
vi.mock("framer-motion", async () => {
  const actual = await vi.importActual<typeof import("framer-motion")>("framer-motion");
  return {
    ...actual,
    useReducedMotion: () => false,
  };
});

describe("AnimatedSection", () => {
  it("renders children correctly", () => {
    render(
      <AnimatedSection>
        <p>Hello World</p>
      </AnimatedSection>
    );
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <AnimatedSection className="my-custom-class">
        <span>Content</span>
      </AnimatedSection>
    );
    expect(container.firstChild).toHaveClass("my-custom-class");
  });

  it("renders as plain div when reduced motion is preferred", async () => {
    // Reset modules so we can apply a fresh mock
    vi.resetModules();
    vi.doMock("framer-motion", async () => {
      const actual = await vi.importActual<typeof import("framer-motion")>("framer-motion");
      return {
        ...actual,
        useReducedMotion: () => true,
      };
    });

    const { AnimatedSection: ReducedSection } = await import(
      "@/components/landing/AnimatedSection"
    );

    const { container } = render(
      <ReducedSection>
        <p>Accessible</p>
      </ReducedSection>
    );
    // When reduced motion is on, it renders a plain <div>
    expect(container.firstChild?.nodeName).toBe("DIV");
    expect(screen.getByText("Accessible")).toBeInTheDocument();
  });

  it("accepts all direction variants without crashing", () => {
    const directions = ["up", "left", "right", "scale"] as const;
    for (const dir of directions) {
      const { unmount } = render(
        <AnimatedSection direction={dir}>
          <p>{dir}</p>
        </AnimatedSection>
      );
      expect(screen.getByText(dir)).toBeInTheDocument();
      unmount();
    }
  });

  it("accepts staggerType variants", () => {
    for (const st of ["gentle", "premium"] as const) {
      const { unmount } = render(
        <AnimatedSection staggerType={st}>
          <p>{st}</p>
        </AnimatedSection>
      );
      expect(screen.getByText(st)).toBeInTheDocument();
      unmount();
    }
  });
});

describe("AnimatedItem", () => {
  it("renders children", () => {
    render(
      <AnimatedItem>
        <span>Item content</span>
      </AnimatedItem>
    );
    expect(screen.getByText("Item content")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <AnimatedItem className="item-class">
        <span>Styled</span>
      </AnimatedItem>
    );
    expect(container.firstChild).toHaveClass("item-class");
  });
});
