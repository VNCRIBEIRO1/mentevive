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
  metadataBase: new URL("https://mentevive.vercel.app"),
  title: {
    default: "MenteVive — Portal para Psicólogos e Pacientes",
    template: "%s | MenteVive",
  },
  description:
    "MenteVive — O portal ideal para paciente e psicólogo. Gerencie consultas, agendamentos e atendimentos online em um só lugar.",
  keywords: [
    "plataforma psicologia",
    "portal psicólogo",
    "portal paciente",
    "gestão consultório online",
    "agendamento terapia",
    "MenteVive",
  ],
  authors: [{ name: "MenteVive", url: "https://mentevive.vercel.app" }],
  creator: "MenteVive",
  publisher: "MenteVive",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/icon.svg",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://mentevive.vercel.app",
    siteName: "MenteVive",
    title: "MenteVive — Portal para Psicólogos e Pacientes",
    description:
      "O portal ideal para paciente e psicólogo. Gerencie consultas, agendamentos e atendimentos online.",
    images: [
      {
        url: "/og-mentevive.png",
        width: 1200,
        height: 630,
        alt: "MenteVive — Portal para Psicólogos e Pacientes",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MenteVive — Portal para Psicólogos e Pacientes",
    description:
      "O portal ideal para paciente e psicólogo. Gerencie consultas, agendamentos e atendimentos online.",
    images: ["/og-mentevive.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://mentevive.vercel.app",
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
