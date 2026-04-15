import Image from "next/image";

const groupsData = [
  { img: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=500&q=80&auto=format&fit=crop", tag: "Mulheres", tagClass: "bg-accent/15 text-accent", title: "Círculo de Mulheres", info: "Quartas, 19h • 8 vagas", desc: "Espaço de acolhimento, partilha e empoderamento feminino. Autoestima, limites e autocuidado." },
  { img: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=500&q=80&auto=format&fit=crop", tag: "Ansiedade", tagClass: "bg-teal/10 text-teal-dark", title: "Manejo da Ansiedade", info: "Terças, 20h • 6 vagas", desc: "Técnicas de respiração, mindfulness e estratégias para lidar com a ansiedade no dia a dia." },
  { img: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=500&q=80&auto=format&fit=crop", tag: "Autoestima", tagClass: "bg-primary/15 text-primary-dark", title: "Autoestima & Autoconhecimento", info: "Sextas, 14h • 8 vagas", desc: "Jornada de 8 encontros para fortalecer a relação consigo mesmo e descobrir seu valor." },
];

export function Groups() {
  return (
    <section className="py-20 px-4 md:px-8" id="grupos">
      <div className="max-w-[1100px] mx-auto">
        <div className="section-label">Grupos Terapêuticos</div>
        <h2 className="section-title">Crescer Junto é Mais Leve</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
          {groupsData.map((g, i) => (
            <div key={i} className="bg-white rounded-brand overflow-hidden shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <Image src={g.img} alt={g.title} width={500} height={160} className="w-full h-40 object-cover" />
              <div className="p-5">
                <span className={`inline-block px-2 py-0.5 rounded-full text-[0.65rem] font-bold uppercase tracking-wide ${g.tagClass}`}>
                  {g.tag}
                </span>
                <h3 className="font-heading text-base font-semibold mt-2 mb-1">{g.title}</h3>
                <div className="text-xs text-txt-muted mb-2">{g.info}</div>
                <p className="text-xs text-txt-light leading-relaxed">{g.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
