// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SectionDivider } from "@/components/landing/SectionDivider";

describe("SectionDivider", () => {
  it("renders an SVG element", () => {
    const { container } = render(<SectionDivider />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
  });

  it("is hidden from screen readers (aria-hidden)", () => {
    const { container } = render(<SectionDivider />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });

  it("renders two path elements (layered waves)", () => {
    const { container } = render(<SectionDivider />);
    const paths = container.querySelectorAll("path");
    expect(paths.length).toBe(2);
  });

  it("uses provided gradient colors", () => {
    const { container } = render(
      <SectionDivider colorFrom="#ff0000" colorTo="#00ff00" />
    );
    const stops = container.querySelectorAll("stop");
    expect(stops[0]).toHaveAttribute("stop-color", "#ff0000");
    expect(stops[1]).toHaveAttribute("stop-color", "#00ff00");
  });

  it("applies wave-up variant (rotation)", () => {
    const { container } = render(<SectionDivider variant="wave-up" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.transform).toBe("rotate(180deg)");
  });

  it("wave-down variant has no rotation by default", () => {
    const { container } = render(<SectionDivider variant="wave-down" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.transform).toBe("");
  });

  it("applies custom className", () => {
    const { container } = render(<SectionDivider className="my-divider" />);
    expect(container.firstChild).toHaveClass("my-divider");
  });

  it("SVG has mesh-shift animation class on primary path", () => {
    const { container } = render(<SectionDivider />);
    const paths = container.querySelectorAll("path");
    expect(paths[0]).toHaveClass("animate-mesh-shift");
  });
});
