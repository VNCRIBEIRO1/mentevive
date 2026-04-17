"use client";

import { useEffect, useState } from "react";
import { AnimatedSection, AnimatedItem, GlassCard } from "@/components/landing";
import { User, ExternalLink } from "lucide-react";

type Professional = {
  name: string;
  avatar: string | null;
  specialty: string | null;
  bio: string | null;
  crp: string | null;
  tenantSlug: string;
  tenantName: string;
};

export function PlatformProfessionals() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public/professionals")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setProfessionals(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section id="profissionais" className="py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <span className="section-label">Profissionais</span>
          <h2 className="section-title mt-3">Nossos Profissionais</h2>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="glass rounded-2xl p-6 animate-pulse h-48"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (professionals.length === 0) {
    return (
      <section id="profissionais" className="py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <AnimatedSection direction="up">
            <span className="section-label">Profissionais</span>
            <h2 className="section-title mt-3">Nossos Profissionais</h2>
            <p className="mt-4 text-foreground/60 max-w-xl mx-auto">
              Em breve nossos profissionais cadastrados aparecerão aqui.
              Se você é psicólogo(a), entre em contato para fazer parte.
            </p>
          </AnimatedSection>
        </div>
      </section>
    );
  }

  return (
    <section id="profissionais" className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection direction="up" className="text-center mb-14">
          <span className="section-label">Profissionais</span>
          <h2 className="section-title mt-3">Nossos Profissionais</h2>
          <p className="mt-4 text-foreground/60 max-w-xl mx-auto">
            Conheça os psicólogos que confiam na MenteVive para gerenciar seus consultórios online.
          </p>
        </AnimatedSection>

        <AnimatedSection
          direction="up"
          staggerChildren={0.1}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {professionals.map((prof) => (
            <AnimatedItem key={prof.tenantSlug}>
              <GlassCard className="h-full group hover:border-teal/20 transition-colors duration-300">
                <div className="flex flex-col items-center text-center gap-4">
                  {/* Avatar */}
                  <div className="w-20 h-20 rounded-full bg-teal/10 flex items-center justify-center overflow-hidden shrink-0">
                    {prof.avatar ? (
                      <img
                        src={prof.avatar}
                        alt={prof.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <User size={32} className="text-teal/60" />
                    )}
                  </div>

                  {/* Info */}
                  <div>
                    <h3 className="text-lg font-heading font-semibold text-foreground">
                      {prof.name}
                    </h3>
                    {prof.crp && (
                      <p className="text-xs text-teal font-medium mt-0.5">
                        CRP {prof.crp}
                      </p>
                    )}
                    {prof.specialty && (
                      <p className="text-sm text-foreground/60 mt-1">
                        {prof.specialty}
                      </p>
                    )}
                    {prof.bio && (
                      <p className="text-sm text-foreground/50 mt-2 line-clamp-3">
                        {prof.bio}
                      </p>
                    )}
                  </div>

                  {/* Link to tenant site */}
                  <a
                    href={`/${prof.tenantSlug}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-teal hover:text-teal-dark transition-colors mt-auto pt-2"
                  >
                    Visitar consultório
                    <ExternalLink size={14} />
                  </a>
                </div>
              </GlassCard>
            </AnimatedItem>
          ))}
        </AnimatedSection>
      </div>
    </section>
  );
}
