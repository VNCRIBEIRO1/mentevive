// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

/* ─── Mock framer-motion to render plain elements ─── */
vi.mock("framer-motion", () => {
  const React = require("react");

  const handler: ProxyHandler<object> = {
    get: (_target, prop: string) => {
      const MockMotionComponent = React.forwardRef(
        (
          {
            children,
            whileInView,
            whileHover,
            whileTap,
            viewport,
            initial,
            animate,
            exit,
            transition,
            variants,
            layoutId,
            style,
            ...rest
          }: Record<string, unknown>,
          ref: React.Ref<HTMLElement>
        ) => React.createElement(prop, { ...rest, style, ref }, children)
      );

      MockMotionComponent.displayName = `MockMotion(${prop})`;
      return MockMotionComponent;
    },
  };
  const motion = new Proxy({}, handler);

  const AnimatePresence = ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children);

  return {
    motion,
    AnimatePresence,
    useInView: () => true,
    useAnimation: () => ({ start: vi.fn(), set: vi.fn() }),
    useReducedMotion: () => false,
    useMotionValue: (initial: number) => ({
      get: () => initial,
      set: vi.fn(),
      onChange: vi.fn(),
    }),
    useSpring: (value: unknown) => value,
  };
});

/* ─── Mock next/link ─── */
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => {
    const React = require("react");
    return React.createElement("a", { href, ...props }, children);
  },
}));

/* ─── Mock next/image ─── */
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const React = require("react");
    return React.createElement("img", props);
  },
}));

/* ─── Mock @/lib/utils ─── */
vi.mock("@/lib/utils", () => ({
  WHATSAPP_LINK: "https://wa.me/5511988840525",
  WHATSAPP_DISPLAY: "(11) 98884-0525",
  INSTAGRAM_URL: "",
  TIKTOK_URL: "",
  TENANT_DISPLAY_NAME: "MenteVive",
  PROFESSIONAL_NAME: "Bea",
  formatPhoneDisplay: (phone: string) => phone,
}));

/* ─── Mock fetch for Blog ─── */
beforeEach(() => {
  globalThis.fetch = vi.fn().mockRejectedValue(new Error("no api"));
});

// ===========================
// Header Tests
// ===========================
describe("Header", () => {
  it("renders logo text MenteVive", async () => {
    const { Header } = await import("@/components/landing/Header");
    render(<Header />);
    expect(screen.getByText("MenteVive")).toBeInTheDocument();
  });

  it("renders navigation links", async () => {
    const { Header } = await import("@/components/landing/Header");
    render(<Header />);
    // Desktop nav has hidden links; use getAllByText since both desktop + mobile may exist
    expect(screen.getAllByText("Jornada").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Sobre").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Serviços").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Blog").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Contato").length).toBeGreaterThan(0);
  });

  it("renders login link", async () => {
    const { Header } = await import("@/components/landing/Header");
    render(<Header />);
    const loginLink = screen.getByText("Entrar");
    expect(loginLink).toBeInTheDocument();
    expect(loginLink.closest("a")).toHaveAttribute("href", "/login");
  });

  it("has mobile menu toggle button", async () => {
    const { Header } = await import("@/components/landing/Header");
    render(<Header />);
    const menuButton = screen.getByLabelText("Abrir menu");
    expect(menuButton).toBeInTheDocument();
  });

  it("toggles mobile menu on click", async () => {
    const user = userEvent.setup();
    const { Header } = await import("@/components/landing/Header");
    render(<Header />);
    const menuButton = screen.getByLabelText("Abrir menu");
    await user.click(menuButton);
    expect(screen.getByLabelText("Fechar menu")).toBeInTheDocument();
  });
});

// ===========================
// Hero Tests
// ===========================
describe("Hero", () => {
  it("renders heading with key words", async () => {
    const { Hero } = await import("@/components/landing/Hero");
    render(<Hero />);
    // Heading is split across spans so use getByRole
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toContain("emocional");
    expect(heading.textContent).toContain("internet");
  });

  it("renders CTA button to schedule", async () => {
    const { Hero } = await import("@/components/landing/Hero");
    render(<Hero />);
    const cta = screen.getByText("Agendar Sessão");
    expect(cta).toBeInTheDocument();
    expect(cta.closest("a")).toHaveAttribute("href", "#agendamento");
  });

  it("renders the glass badge with attendance count", async () => {
    const { Hero } = await import("@/components/landing/Hero");
    const { container } = render(<Hero />);
    const glassBadge = container.querySelector(".glass");
    expect(glassBadge).toBeInTheDocument();
    // Badge text contains 3500
    expect(glassBadge?.textContent).toContain("3500");
  });

  it("renders btn-brand-primary on CTA", async () => {
    const { Hero } = await import("@/components/landing/Hero");
    const { container } = render(<Hero />);
    const brandBtn = container.querySelector(".btn-brand-primary");
    expect(brandBtn).toBeInTheDocument();
  });
});

// ===========================
// Journey Tests
// ===========================
describe("Journey", () => {
  it("renders section title", async () => {
    const { Journey } = await import("@/components/landing/Journey");
    render(<Journey />);
    expect(
      screen.getByText(/Como Funciona/i)
    ).toBeInTheDocument();
  });

  it("renders journey step labels", async () => {
    const { Journey } = await import("@/components/landing/Journey");
    render(<Journey />);
    expect(screen.getByText("Agende")).toBeInTheDocument();
    expect(screen.getByText("Portal")).toBeInTheDocument();
    expect(screen.getByText("Confirme")).toBeInTheDocument();
    expect(screen.getByText("Sessão")).toBeInTheDocument();
    expect(screen.getAllByText("Evolução").length).toBeGreaterThan(0);
  });
});

// ===========================
// About Tests
// ===========================
describe("About", () => {
  it("renders about heading", async () => {
    const { About } = await import("@/components/landing/About");
    render(<About />);
    expect(screen.getByText("Beatriz (Bea)")).toBeInTheDocument();
  });

  it("renders CRP credential", async () => {
    const { About } = await import("@/components/landing/About");
    render(<About />);
    const matches = screen.getAllByText(/CRP 06\/173961/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it("renders attendance count badge", async () => {
    const { About } = await import("@/components/landing/About");
    render(<About />);
    const matches = screen.getAllByText(/3\.500/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it("renders glass cards for experience", async () => {
    const { About } = await import("@/components/landing/About");
    const { container } = render(<About />);
    const glassCards = container.querySelectorAll(".glass");
    expect(glassCards.length).toBeGreaterThan(0);
  });
});

// ===========================
// Services Tests
// ===========================
describe("Services", () => {
  it("renders section title", async () => {
    const { Services } = await import("@/components/landing/Services");
    render(<Services />);
    expect(
      screen.getByText("Modalidades de Atendimento")
    ).toBeInTheDocument();
  });

  it("renders service cards", async () => {
    const { Services } = await import("@/components/landing/Services");
    render(<Services />);
    expect(screen.getByText(/Terapia Individual Online/i)).toBeInTheDocument();
    expect(screen.getByText(/Terapia de Casal/i)).toBeInTheDocument();
  });
});

// ===========================
// Testimonials Tests
// ===========================
describe("Testimonials", () => {
  it("renders section title", async () => {
    const { Testimonials } = await import(
      "@/components/landing/Testimonials"
    );
    render(<Testimonials />);
    expect(
      screen.getByText("Histórias de Transformação")
    ).toBeInTheDocument();
  });

  it("renders testimonial author names", async () => {
    const { Testimonials } = await import(
      "@/components/landing/Testimonials"
    );
    render(<Testimonials />);
    expect(screen.getByText("Carolina P.")).toBeInTheDocument();
    expect(screen.getByText("Renata M.")).toBeInTheDocument();
    expect(screen.getByText("Sandra L.")).toBeInTheDocument();
  });
});

// ===========================
// Blog Tests
// ===========================
describe("Blog", () => {
  it("renders section title", async () => {
    const { Blog } = await import("@/components/landing/Blog");
    render(<Blog />);
    expect(
      screen.getByText(/vive da internet/i)
    ).toBeInTheDocument();
  });

  it("renders article titles", async () => {
    const { Blog } = await import("@/components/landing/Blog");
    render(<Blog />);
    expect(
      screen.getByText(/Terapia online para criadores de conteúdo/i)
    ).toBeInTheDocument();
  });

  it("renders accordion toggle for articles", async () => {
    const { Blog } = await import("@/components/landing/Blog");
    render(<Blog />);
    expect(screen.getAllByText(/Ler Artigo/i).length).toBeGreaterThan(0);
  });

  it('renders "Ver mais" link with arrow', async () => {
    const { Blog } = await import("@/components/landing/Blog");
    render(<Blog />);
    const link = screen.getByText(/Ver mais reflexões/i);
    expect(link.closest("a")).toHaveAttribute("href", "/blog");
  });

  it("renders Bem-Estar Digital badge", async () => {
    const { Blog } = await import("@/components/landing/Blog");
    render(<Blog />);
    expect(screen.getAllByText(/Bem-Estar Digital/i).length).toBeGreaterThan(0);
  });

  it("renders rounded article cards", async () => {
    const { Blog } = await import("@/components/landing/Blog");
    const { container } = render(<Blog />);
    const cards = container.querySelectorAll(".rounded-2xl");
    expect(cards.length).toBeGreaterThan(0);
  });
});

// ===========================
// Contact Tests
// ===========================
describe("Contact", () => {
  it("renders section heading", async () => {
    const { Contact } = await import("@/components/landing/Contact");
    render(<Contact />);
    expect(screen.getByText(/Vamos Conversar/i)).toBeInTheDocument();
  });

  it("renders contact form with name and message fields", async () => {
    const { Contact } = await import("@/components/landing/Contact");
    render(<Contact />);
    expect(screen.getByPlaceholderText("Seu nome")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("seu@email.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Como posso te acolher/i)).toBeInTheDocument();
  });

  it("renders submit button with brand style", async () => {
    const { Contact } = await import("@/components/landing/Contact");
    const { container } = render(<Contact />);
    const brandBtn = container.querySelector(".btn-brand-primary");
    expect(brandBtn).toBeInTheDocument();
  });

  it("renders glass-strong form wrapper", async () => {
    const { Contact } = await import("@/components/landing/Contact");
    const { container } = render(<Contact />);
    const glassStrong = container.querySelector(".glass-strong");
    expect(glassStrong).toBeInTheDocument();
  });
});

// ===========================
// Footer Tests
// ===========================
describe("Footer", () => {
  it("renders brand name and tagline", async () => {
    const { Footer } = await import("@/components/landing/Footer");
    render(<Footer />);
    expect(screen.getAllByText(/MenteVive/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/CRP 06\/173961/i).length).toBeGreaterThan(0);
  });

  it("renders site navigation links", async () => {
    const { Footer } = await import("@/components/landing/Footer");
    render(<Footer />);
    expect(screen.getByText("Links")).toBeInTheDocument();
    expect(screen.getAllByText("Jornada").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Contato").length).toBeGreaterThan(0);
  });

  it("renders contact section with phone number", async () => {
    const { Footer } = await import("@/components/landing/Footer");
    render(<Footer />);
    expect(screen.getByText(/98884-0525/i)).toBeInTheDocument();
  });
});

// ===========================
// WhatsAppFloat Tests
// ===========================
describe("WhatsAppFloat", () => {
  it("renders WhatsApp floating button", async () => {
    const { WhatsAppFloat } = await import(
      "@/components/landing/WhatsAppFloat"
    );
    render(<WhatsAppFloat />);
    const link = screen.getByText(/WhatsApp/i);
    expect(link).toBeInTheDocument();
  });

  it("links to correct WhatsApp URL", async () => {
    const { WhatsAppFloat } = await import(
      "@/components/landing/WhatsAppFloat"
    );
    const { container } = render(<WhatsAppFloat />);
    const anchor = container.querySelector("a");
    expect(anchor).toHaveAttribute(
      "href",
      "https://wa.me/5511988840525"
    );
  });

  it("opens in new tab", async () => {
    const { WhatsAppFloat } = await import(
      "@/components/landing/WhatsAppFloat"
    );
    const { container } = render(<WhatsAppFloat />);
    const anchor = container.querySelector("a");
    expect(anchor).toHaveAttribute("target", "_blank");
    expect(anchor).toHaveAttribute("rel", "noopener noreferrer");
  });
});

// ===========================
// Scheduling Tests
// ===========================
describe("Scheduling", () => {
  it("renders section title", async () => {
    const { Scheduling } = await import(
      "@/components/landing/Scheduling"
    );
    render(<Scheduling />);
    expect(screen.getByText("Agende sua Sessão")).toBeInTheDocument();
  });

  it("renders calendar with month navigation", async () => {
    const { Scheduling } = await import(
      "@/components/landing/Scheduling"
    );
    render(<Scheduling />);
    expect(screen.getByLabelText("Mês anterior")).toBeInTheDocument();
    expect(screen.getByLabelText("Próximo mês")).toBeInTheDocument();
  });

  it("renders day-of-week headers", async () => {
    const { Scheduling } = await import(
      "@/components/landing/Scheduling"
    );
    render(<Scheduling />);
    expect(screen.getByText("Dom")).toBeInTheDocument();
    expect(screen.getByText("Seg")).toBeInTheDocument();
    expect(screen.getByText("Sex")).toBeInTheDocument();
  });

  it("renders modality indicator", async () => {
    const { Scheduling } = await import(
      "@/components/landing/Scheduling"
    );
    render(<Scheduling />);
    expect(screen.getByText("Videochamada")).toBeInTheDocument();
  });

  it("renders glass and btn-brand-primary styling", async () => {
    const { Scheduling } = await import(
      "@/components/landing/Scheduling"
    );
    const { container } = render(<Scheduling />);
    expect(container.querySelector(".glass")).toBeInTheDocument();
    expect(container.querySelector(".glass-strong")).toBeInTheDocument();
    expect(container.querySelector(".btn-brand-primary")).toBeInTheDocument();
  });

  it("renders form fields with Lucide icon labels", async () => {
    const { Scheduling } = await import(
      "@/components/landing/Scheduling"
    );
    render(<Scheduling />);
    expect(screen.getByPlaceholderText("Seu nome completo")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("seu@email.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("(11) 99999-9999")).toBeInTheDocument();
  });

  it("renders submit button with Leaf icon", async () => {
    const { Scheduling } = await import(
      "@/components/landing/Scheduling"
    );
    render(<Scheduling />);
    expect(screen.getByText("Criar Conta e Agendar")).toBeInTheDocument();
  });
});

// ===========================
// Portal Carousel Tests
// ===========================
describe("PortalScreenCarousel", () => {
  it("renders the dashboard screen by default", async () => {
    const { PortalScreenCarousel } = await import(
      "@/components/landing/PortalScreenCarousel"
    );
    render(<PortalScreenCarousel />);

    expect(screen.getByText(/Boa tarde, Camila/i)).toBeInTheDocument();
    expect(screen.getByText("mentevive.vercel.app/portal")).toBeInTheDocument();
  });

  it("switches screens when a navigation button is clicked", async () => {
    const user = userEvent.setup();
    const { PortalScreenCarousel } = await import(
      "@/components/landing/PortalScreenCarousel"
    );
    render(<PortalScreenCarousel />);

    await user.click(screen.getAllByLabelText("Abrir Pagamentos")[0]);

    expect(screen.getByText("Meus Pagamentos")).toBeInTheDocument();
    expect(screen.getByText("mentevive.vercel.app/portal/pagamentos")).toBeInTheDocument();
  });
});
