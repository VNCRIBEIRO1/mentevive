import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { Journey } from "@/components/landing/Journey";
import { About } from "@/components/landing/About";
import { Services } from "@/components/landing/Services";
import { Blog } from "@/components/landing/Blog";
import { Contact } from "@/components/landing/Contact";
import { Footer } from "@/components/landing/Footer";
import { WhatsAppFloat } from "@/components/landing/WhatsAppFloat";
import { SectionDivider } from "@/components/landing/SectionDivider";
import dynamic from "next/dynamic";

const Scheduling = dynamic(
  () => import("@/components/landing/Scheduling").then((m) => m.Scheduling),
  { loading: () => <div className="py-20" /> }
);
const Chatbot = dynamic(
  () => import("@/components/landing/Chatbot").then((m) => m.Chatbot)
);

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": "https://psicolobia.vercel.app/#organization",
    name: "Psicolobia",
    alternateName: "Psicolobia — Beatriz Ribeiro",
    description:
      "Psicóloga Clínica Online — Beatriz Ribeiro (CRP 06/173961). Especialista no emocional de quem vive da internet. +3500 atendimentos. Terapia com ACT, ansiedade, depressão e traumas.",
    url: "https://psicolobia.vercel.app",
    telephone: "+5511988840525",
    address: {
      "@type": "PostalAddress",
      addressLocality: "São Paulo",
      addressRegion: "SP",
      addressCountry: "BR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: -23.5505,
      longitude: -46.6333,
    },
    priceRange: "$$",
    image: "https://psicolobia.vercel.app/bia.png",
    logo: "https://psicolobia.vercel.app/icon.svg",
    sameAs: [
      "https://www.instagram.com/psicolobiaa",
      "https://www.tiktok.com/@psicolobiaa",
      "https://linktr.ee/psicolobiaa",
    ],
    founder: {
      "@type": "Person",
      "@id": "https://psicolobia.vercel.app/#beatriz",
      name: "Beatriz Ribeiro",
      givenName: "Beatriz",
      familyName: "Ribeiro",
      jobTitle: "Psicóloga Clínica",
      description:
        "CRP 06/173961 — UNOESTE. Especialista em Terapia de Aceitação e Compromisso (ACT) e Terapia para Tratamento de Traumas.",
      image: "https://psicolobia.vercel.app/bia.png",
      url: "https://psicolobia.vercel.app",
      sameAs: [
        "https://www.instagram.com/psicolobiaa",
        "https://www.tiktok.com/@psicolobiaa",
      ],
    },
    areaServed: { "@type": "Country", name: "BR" },
    serviceType: [
      "Terapia Individual Online",
      "Ansiedade e Depressão",
      "Tratamento de Traumas",
      "Terapia para Criadores de Conteúdo",
      "Terapia de Casal Online",
      "Autoconhecimento",
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Serviços de Psicologia Online",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Terapia Individual Online",
            description: "Sessões individuais de psicoterapia online com abordagem ACT.",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Terapia de Casal Online",
            description: "Terapia de casal online para fortalecer relacionamentos.",
          },
        },
      ],
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "08:00",
      closes: "20:00",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Início",
        item: "https://psicolobia.vercel.app",
      },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Como funciona a terapia online?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "As sessões acontecem por videochamada em uma sala segura e privada. Você pode participar de qualquer lugar com internet. A eficácia é a mesma da terapia presencial.",
        },
      },
      {
        "@type": "Question",
        name: "Qual a abordagem terapêutica utilizada?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "A principal abordagem é a Terapia de Aceitação e Compromisso (ACT), que ajuda a desenvolver flexibilidade psicológica e a viver de acordo com seus valores.",
        },
      },
      {
        "@type": "Question",
        name: "Quanto tempo dura cada sessão?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "As sessões individuais têm duração de 50 minutos. Sessões de casal podem ter duração diferenciada conforme a necessidade.",
        },
      },
      {
        "@type": "Question",
        name: "Atende criadores de conteúdo?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sim! Beatriz é especialista no emocional de quem vive da internet — criadores de conteúdo, influenciadores e profissionais digitais que enfrentam ansiedade, burnout e pressão online.",
        },
      },
    ],
  },
];

export default function Home() {
  return (
    <>
      {jsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <Header />
      <main id="main">
        <Hero />
        <SectionDivider variant="wave-down" />
        <Journey />
        <SectionDivider variant="wave-up" colorFrom="var(--teal)" colorTo="var(--primary)" />
        <About />
        <SectionDivider variant="wave-down" />
        <Services />
        <SectionDivider variant="wave-up" colorFrom="var(--primary)" colorTo="var(--teal)" />
        <Scheduling />
        <SectionDivider variant="wave-down" colorFrom="var(--teal)" colorTo="var(--primary)" />
        <Blog />
        <SectionDivider variant="wave-down" colorFrom="var(--primary)" colorTo="var(--teal)" />
        <Contact />
      </main>
      <Footer />
      <WhatsAppFloat />
      <Chatbot />
    </>
  );
}
