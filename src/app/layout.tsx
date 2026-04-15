import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://psicolobia.vercel.app"),
  title: {
    default: "Psicolobia — Beatriz Ribeiro | Psicóloga Clínica Online em São Paulo",
    template: "%s | Psicolobia",
  },
  description:
    "Beatriz Ribeiro (Bea) — Psicóloga Clínica CRP 06/173961. Especialista no emocional de quem vive da internet. +3500 atendimentos. Terapia online com ACT, tratamento de ansiedade, depressão e traumas. Agende sua sessão.",
  keywords: [
    "psicóloga online",
    "terapia online",
    "psicóloga São Paulo",
    "psicóloga clínica",
    "terapia ACT",
    "ansiedade",
    "depressão",
    "tratamento de traumas",
    "criadores de conteúdo",
    "burnout digital",
    "autoconhecimento",
    "terapia de casal online",
    "Beatriz Ribeiro psicóloga",
    "Psicolobia",
    "CRP 06/173961",
  ],
  authors: [{ name: "Beatriz Ribeiro", url: "https://psicolobia.vercel.app" }],
  creator: "Beatriz Ribeiro — Psicóloga Clínica",
  publisher: "Psicolobia",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/icon.svg",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://psicolobia.vercel.app",
    siteName: "Psicolobia",
    title: "Psicolobia — Beatriz Ribeiro | Psicóloga Clínica Online",
    description:
      "Psicóloga Clínica especialista no emocional de quem vive da internet. +3500 atendimentos. Terapia online acolhedora com ACT. Agende sua sessão.",
    images: [
      {
        url: "/bia.png",
        width: 1200,
        height: 630,
        alt: "Beatriz Ribeiro — Psicóloga Clínica Psicolobia",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Psicolobia — Beatriz Ribeiro | Psicóloga Clínica Online",
    description:
      "Psicóloga Clínica especialista no emocional de quem vive da internet. +3500 atendimentos. Agende sua sessão online.",
    images: ["/bia.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://psicolobia.vercel.app",
  },
  category: "health",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${fraunces.variable} ${inter.variable}`} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
