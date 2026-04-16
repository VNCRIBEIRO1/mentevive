// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => {
    const React = require("react");
    return React.createElement("a", { href, ...props }, children);
  },
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const React = require("react");
    return React.createElement("img", props);
  },
}));

vi.mock("framer-motion", () => {
  const React = require("react");
  const motion = new Proxy({}, { get: (_: unknown, tag: string) => React.forwardRef(({ children, ...rest }: any, ref: any) => React.createElement(tag, { ...rest, ref }, children)) });
  return {
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
    useInView: () => true,
    useAnimation: () => ({ start: vi.fn(), set: vi.fn() }),
    useReducedMotion: () => false,
    useMotionValue: (initial: number) => ({ get: () => initial, set: vi.fn(), onChange: vi.fn() }),
    useSpring: (value: unknown) => value,
  };
});

vi.mock("@/lib/utils", () => ({
  WHATSAPP_LINK: "https://wa.me/5511988840525",
  WHATSAPP_DISPLAY: "(11) 98884-0525",
  INSTAGRAM_URL: "",
  TIKTOK_URL: "",
  TENANT_DISPLAY_NAME: "MenteVive",
  PROFESSIONAL_NAME: "Bea",
  formatPhoneDisplay: (phone: string) => phone,
}));

describe("Landing core", () => {
  it("header renders without blog link", async () => {
    const { Header } = await import("@/components/landing/Header");
    render(<Header />);
    expect(screen.getByText("MenteVive")).toBeInTheDocument();
    expect(screen.queryByText("Blog")).not.toBeInTheDocument();
  });

  it("scheduling shows videochamada", async () => {
    const { Scheduling } = await import("@/components/landing/Scheduling");
    render(<Scheduling />);
    expect(screen.getByText("Videochamada")).toBeInTheDocument();
  });

  it("footer links do not include blog", async () => {
    const { Footer } = await import("@/components/landing/Footer");
    render(<Footer />);
    expect(screen.getByText("Links")).toBeInTheDocument();
    expect(screen.queryByText("Blog")).not.toBeInTheDocument();
  });
});
