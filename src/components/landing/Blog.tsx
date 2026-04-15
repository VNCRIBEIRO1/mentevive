"use client";
import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronDown, ChevronUp, BookOpen, ArrowRight, Sparkles } from "lucide-react";
import { AnimatedSection, AnimatedItem } from "./AnimatedSection";
import Link from "next/link";

/* ─────────────────────────────────────────────────
   SEO-optimized section: "Terapia Online para
   Criadores de Conteúdo". Accordion timeline with
   keyword-dense titles targeting influencer audience
   + "terapia online" search intent.
   ───────────────────────────────────────────────── */

interface Article {
  id: string;
  date: string;       // "ABR 2026"
  title: string;      // SEO H3 — keyword nos primeiros 50%
  excerpt: string;    // Identificação emocional + benefício
  content: string[];  // Pirâmide invertida: conclusão primeiro
  highlights?: { term: string; text: string }[];
}

const articles: Article[] = [
  {
    id: "terapia-online-criadores",
    date: "ABR 2026",
    title: "Terapia online para criadores de conteúdo: cuidando de quem cuida de uma comunidade inteira",
    excerpt: "Você cuida da sua audiência todos os dias. Mas quem cuida de você?",
    content: [
      "Terapia online para criadores de conteúdo não é luxo — é necessidade. Quem vive da internet carrega uma pressão silenciosa: entregar conteúdo, manter engajamento, lidar com haters e ainda sustentar a própria saúde mental. São decisões o dia inteiro, e o cérebro entra em fadiga sem você perceber.",
      "Com mais de 3.500 atendimentos — boa parte deles com influenciadores e criadores digitais — a Bea entende de verdade o que é viver nesse ritmo. A terapia online oferece um espaço seguro, flexível e sem deslocamento, onde você pode ser quem é sem precisar performar.",
      "A abordagem é a Terapia de Aceitação e Compromisso (ACT): em vez de eliminar a ansiedade, a gente aprende a conviver com ela e agir de acordo com o que importa pra você. O resultado? Mais clareza, mais leveza e decisões mais alinhadas com seus valores — dentro e fora das telas.",
    ],
    highlights: [
      { term: "Flexibilidade psicológica", text: "É a capacidade de sentir o desconforto e agir mesmo assim, sem travar. Criadores precisam muito disso — e a ACT trabalha exatamente aqui." },
      { term: "Sessão de qualquer lugar", text: "A terapia online acontece por videochamada, de onde você estiver. Sem deslocamento, sem atrasos — só você e o cuidado que merece." },
    ],
  },
  {
    id: "burnout-digital-influenciadores",
    date: "MAR 2026",
    title: "Burnout digital em influenciadores: quando produzir conteúdo custa sua saúde mental",
    excerpt: "Se criar virou obrigação e postar virou angústia, algo precisa mudar.",
    content: [
      "Burnout digital é diferente do cansaço comum. É aquela exaustão que não passa nem nas férias — uma mistura de esgotamento emocional, pressão por algoritmos e a sensação constante de que você deveria estar produzindo mais. Entre criadores de conteúdo e influenciadores, esse quadro é cada vez mais frequente.",
      "Os sinais? Perder a vontade de criar, sentir ansiedade antes de postar, achar que nada que você faz é suficiente e não conseguir separar quem você é de quem você mostra online. Se você se identificou, saiba que isso tem nome, tem tratamento — e que pedir ajuda é o primeiro passo.",
      "Na terapia online, a gente trabalha junto pra reencontrar seus limites, reconectar com o que te faz bem além das métricas e construir uma relação mais saudável com o trabalho digital. Tudo no seu tempo, sem julgamento.",
    ],
    highlights: [
      { term: "Esgotamento criativo", text: "Quando as ideias secam e a obrigação de postar vira peso. Não é falta de talento — é o corpo pedindo uma pausa." },
      { term: "Cultura da comparação", text: "O feed mostra os melhores momentos dos outros. Na terapia, a gente desmonta essa armadilha e reconecta com o seu próprio caminho." },
    ],
  },
  {
    id: "ansiedade-redes-sociais",
    date: "MAR 2026",
    title: "Ansiedade e redes sociais: o que ninguém conta sobre viver de likes",
    excerpt: "O algoritmo muda, os números oscilam — e sua autoestima não pode depender disso.",
    content: [
      "Ansiedade nas redes sociais é uma das queixas mais comuns entre criadores de conteúdo que chegam ao consultório. A pressão por performance digital transforma cada post numa prova, cada comentário num julgamento e cada queda de alcance num motivo pra duvidar de si.",
      "O problema não é a rede social em si — é a relação que a gente constrói com ela. Quando seu valor começa a se medir em curtidas, o corpo responde: taquicardia antes de abrir o app, dificuldade de dormir pensando em métricas, irritabilidade com coisas que antes eram prazer.",
      "A terapia online ajuda a separar quem você é do personagem digital. Com a ACT, você aprende a observar esses pensamentos ansiosos sem se fundir com eles. O resultado é mais liberdade pra criar e menos sofrimento por números.",
    ],
    highlights: [
      { term: "Defusão cognitiva", text: "Uma técnica da ACT pra observar seus pensamentos de fora — como quem assiste um filme. Eles continuam ali, mas perdem o poder de paralisar você." },
      { term: "Ansiedade de performance", text: "Aquele medo de não ser \"suficiente\". Na terapia, a gente investiga de onde vem e o que fazer com ele." },
    ],
  },
  {
    id: "sindrome-impostor-influenciadores",
    date: "FEV 2026",
    title: "Síndrome do impostor: por que influenciadores sentem que são fraude",
    excerpt: "Você tem os números, os seguidores, os resultados — e mesmo assim sente que não merece.",
    content: [
      "Síndrome do impostor é extremamente comum entre criadores de conteúdo e influenciadores digitais. Quanto mais a audiência cresce, mais forte vem aquela voz: \"Uma hora vão descobrir que eu não sei nada\". E aí começa o ciclo — trabalhar mais pra \"compensar\", evitar riscos pra não errar, minimizar conquistas reais.",
      "Essa sensação não é fraqueza. É uma resposta emocional a um ambiente onde você é avaliado publicamente, todos os dias. E quando a autoestima está condicionada a métricas externas, qualquer oscilação vira ameaça.",
      "Na terapia online, a gente trabalha pra reconectar com seus valores reais — aquilo que te faz criar além dos números. A Terapia de Aceitação e Compromisso ajuda a diminuir o poder dessa voz crítica e a agir com autenticidade, mesmo quando a insegurança aparece.",
    ],
    highlights: [
      { term: "Ciclo do impostor", text: "Perfeccionismo → medo de errar → trabalho excessivo → resultado bom → \"foi sorte\" → mais perfeccionismo. A terapia quebra esse loop." },
      { term: "Valores vs. métricas", text: "Curtidas medem alcance, não valor. Quando você sabe por que cria, os números perdem o poder de te definir." },
    ],
  },
  {
    id: "limites-digitais-engajamento",
    date: "FEV 2026",
    title: "Limites digitais: como proteger sua saúde mental sem perder engajamento",
    excerpt: "Dizer 'não' online não é egoísmo — é o que mantém você criando por muito tempo.",
    content: [
      "Uma das maiores dificuldades de quem vive da internet é colocar limites. Limite com a audiência, com marcas, com o próprio tempo de tela. A sensação é: \"Se eu parar, perco tudo\". Mas a verdade é o oposto — se você não parar, perde a si.",
      "Limites digitais saudáveis são habilidades que se desenvolvem. Na terapia online, a gente pratica comunicação assertiva: dizer o que precisa de forma direta, honesta e respeitosa — sem culpa. Técnicas como a Comunicação Não-Violenta ajudam a manter relações profissionais saudáveis sem abrir mão do autocuidado.",
      "E sabe o que acontece quando você se posiciona com firmeza e empatia? A audiência respeita mais, as parcerias ficam melhores e você cria com mais energia. Limite não afasta — limite sustenta.",
    ],
    highlights: [
      { term: "Comunicação assertiva", text: "Falar o que sente sem agressividade e sem passividade. É uma habilidade — e na terapia, a gente treina pra contextos reais do digital." },
      { term: "Tempo de tela consciente", text: "Não é sobre deletar o app. É sobre escolher quando entrar, o que consumir e quando desligar — com intenção." },
    ],
  },
  {
    id: "terapia-online-funciona",
    date: "JAN 2026",
    title: "Terapia online funciona? A ciência e +3.500 atendimentos dizem que sim",
    excerpt: "A distância física não diminui a profundidade do vínculo. Pode confiar.",
    content: [
      "Terapia online funciona de verdade — e a ciência comprova. Desde 2018, o atendimento psicológico por videochamada é regulamentado pelo Conselho Federal de Psicologia. Pesquisas mostram eficácia comparável ao presencial para ansiedade, depressão, burnout e diversas outras questões.",
      "Pra quem vive da internet, a terapia online tem vantagens práticas: sessão de onde você estiver, sem deslocamento, com horários flexíveis que encaixam na rotina de gravação e edição. Muitos dos meus pacientes — criadores de conteúdo, influenciadores, profissionais digitais — dizem que se sentem até mais à vontade no online.",
      "O que faz a terapia funcionar é o vínculo entre terapeuta e paciente. Essa confiança, essa escuta atenta, acontece independente da tela. Com mais de 3.500 atendimentos realizados, muitos deles com criadores de conteúdo, posso dizer com segurança: a terapia online transforma vidas. CRP 06/173961.",
    ],
  },
];

export function Blog() {
  const [openId, setOpenId] = useState<string | null>(null);
  const reduce = useReducedMotion();

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="py-24 px-4 md:px-8 bg-bg-warm" id="blog">
      <AnimatedSection className="max-w-[750px] mx-auto">
        <AnimatedItem>
          <div className="flex flex-col items-center text-center mb-14">
            {/* Pill badge — keyword "Bem-Estar Digital" */}
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal/10 text-teal text-xs font-bold uppercase tracking-widest mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              Bem-Estar Digital
            </span>
            <h2 className="font-heading text-3xl md:text-4xl lg:text-[2.75rem] font-semibold text-txt leading-tight">
              Terapia online para quem
              <span className="block text-teal mt-1">vive da internet</span>
            </h2>
            <div className="w-16 h-1 rounded-full bg-gradient-to-r from-primary to-teal mt-5 mb-4" />
            <p className="text-sm sm:text-base text-txt-light max-w-md leading-relaxed">
              Reflexões sobre saúde mental, criadores de conteúdo e terapia online — direto da prática clínica de quem já realizou <strong className="text-teal font-semibold">+3.500 atendimentos</strong>.
            </p>
          </div>
        </AnimatedItem>

        {/* Accordion timeline */}
        <div className="space-y-4">
          {articles.map((article, i) => {
            const isOpen = openId === article.id;

            return (
              <AnimatedItem key={article.id} direction="up" staggerType="gentle">
                <motion.div
                  layout={!reduce}
                  className={`relative rounded-2xl overflow-hidden transition-shadow duration-500 ${
                    isOpen
                      ? "shadow-warm-xl ring-1 ring-primary/15"
                      : "shadow-warm-sm ring-1 ring-primary/5 hover:shadow-warm-md hover:ring-primary/10"
                  }`}
                >
                  {/* Collapsed / header */}
                  <button
                    onClick={() => toggle(article.id)}
                    className={`w-full text-left px-5 sm:px-7 py-5 flex items-start gap-4 sm:gap-6 transition-colors duration-500 ${
                      isOpen
                        ? "bg-gradient-to-r from-teal to-[#0a6158]"
                        : "bg-white/80 backdrop-blur-sm hover:bg-white/95"
                    }`}
                    aria-expanded={isOpen}
                    aria-controls={`article-${article.id}`}
                  >
                    {/* Date badge */}
                    <span
                      className={`text-[0.65rem] font-bold uppercase tracking-widest whitespace-nowrap pt-1 min-w-[65px] ${
                        isOpen ? "text-primary" : "text-primary-dark"
                      }`}
                    >
                      {article.date}
                    </span>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-heading text-sm sm:text-base font-semibold leading-snug mb-1 transition-colors duration-300 ${
                          isOpen ? "text-white" : "text-txt"
                        }`}
                      >
                        {article.title}
                      </h3>
                      <p
                        className={`text-xs leading-relaxed transition-colors duration-300 ${
                          isOpen ? "text-white/70" : "text-txt-light"
                        }`}
                      >
                        {article.excerpt}
                      </p>

                      {/* Toggle label */}
                      <span
                        className={`inline-flex items-center gap-1 mt-2.5 text-[0.65rem] font-bold uppercase tracking-wide transition-colors duration-300 ${
                          isOpen ? "text-primary" : "text-primary-dark"
                        }`}
                      >
                        {isOpen ? "Fechar" : "Ler Artigo"}
                        {isOpen ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </span>
                    </div>
                  </button>

                  {/* Expanded content */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`article-${article.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="overflow-hidden"
                      >
                        <div className="bg-[#F5EDE4] px-5 sm:px-7 pb-6 pt-0 border-t-2 border-teal/10">
                          {/* Divider */}
                          <div className="h-px bg-gradient-to-r from-transparent via-teal/15 to-transparent mb-5" />

                          {/* Content paragraphs — SEO body */}
                          <div className="space-y-4 ml-0 sm:ml-[calc(65px+1.5rem)]">
                            {article.content.map((paragraph, pi) => (
                              <p
                                key={pi}
                                className="text-sm text-txt-light leading-relaxed"
                              >
                                {paragraph}
                              </p>
                            ))}

                            {/* Highlighted terms — extra SEO keywords */}
                            {article.highlights && article.highlights.length > 0 && (
                              <div className="mt-5 space-y-3 bg-white/60 rounded-xl p-4">
                                {article.highlights.map((h) => (
                                  <div key={h.term}>
                                    <p className="text-sm text-txt leading-relaxed">
                                      <strong className="text-teal font-semibold">{h.term}:</strong>{" "}
                                      {h.text}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </AnimatedItem>
            );
          })}
        </div>

        {/* CTA */}
        <AnimatedItem>
          <div className="text-center mt-12">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 btn-brand-outline text-sm group/link"
            >
              Ver mais reflexões sobre bem-estar digital
              <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
            </Link>
          </div>
        </AnimatedItem>
      </AnimatedSection>
    </section>
  );
}
