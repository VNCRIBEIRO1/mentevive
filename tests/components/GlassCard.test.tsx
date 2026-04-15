// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GlassCard } from "@/components/landing/GlassCard";

describe("GlassCard", () => {
  it("renders children", () => {
    render(<GlassCard><p>Card content</p></GlassCard>);
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("applies default glass variant class", () => {
    const { container } = render(<GlassCard><p>Default</p></GlassCard>);
    expect(container.firstChild).toHaveClass("glass");
  });

  it("applies strong variant class", () => {
    const { container } = render(
      <GlassCard variant="strong"><p>Strong</p></GlassCard>
    );
    expect(container.firstChild).toHaveClass("glass-strong");
  });

  it("applies glow variant class", () => {
    const { container } = render(
      <GlassCard variant="glow"><p>Glow</p></GlassCard>
    );
    expect(container.firstChild).toHaveClass("glass-glow");
  });

  it("applies custom className", () => {
    const { container } = render(
      <GlassCard className="extra-class"><p>Custom</p></GlassCard>
    );
    expect(container.firstChild).toHaveClass("extra-class");
  });

  it("adds hover classes by default", () => {
    const { container } = render(<GlassCard><p>Hover</p></GlassCard>);
    expect(container.firstChild).toHaveClass("hover:shadow-warm-lg");
    expect(container.firstChild).toHaveClass("hover:-translate-y-0.5");
  });

  it("omits hover classes when hover=false", () => {
    const { container } = render(
      <GlassCard hover={false}><p>No hover</p></GlassCard>
    );
    expect(container.firstChild).not.toHaveClass("hover:shadow-warm-lg");
  });

  it("always applies rounded-2xl and p-6", () => {
    const { container } = render(<GlassCard><p>Base</p></GlassCard>);
    expect(container.firstChild).toHaveClass("rounded-2xl");
    expect(container.firstChild).toHaveClass("p-6");
  });
});
