"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Leaf } from "lucide-react";

type BotResponse = { msg: string; opts: string[] };
const botResponses: Record<string, BotResponse> = {
  agendar: { msg: 'Para agendar com a Bea, crie sua conta no site e acesse o Portal do Paciente — ou chame no WhatsApp (11) 98884-0525. Ela responde rápido! 💚', opts: ["serviços", "online", "valores", "como funciona"] },
  "serviços": { msg: "🌿 Serviços da Bea:\n\n• Terapia Individual Online (50 min)\n• Ansiedade & Depressão (50 min) — Cert. Albert Einstein\n• Tratamento de Traumas (50 min)\n• Criadores de Conteúdo (50 min)\n• Terapia de Casal (60 min)\n• Autoconhecimento (60 min)\n\n+3.500 atendimentos realizados!", opts: ["agendar", "valores", "contato"] },
  online: { msg: "💻 A Bea é especialista em atendimento online — o vínculo é vivo, humano e presente mesmo pela tela. Pelo Portal do Paciente você recebe o link da sala e entra direto na videochamada.", opts: ["como funciona", "agendar", "serviços"] },
  casal: { msg: "💑 A terapia de casal é para casais que buscam fortalecer a comunicação, resolver conflitos e construir uma relação mais saudável. Sessões de 60 minutos com escuta empática para ambos.", opts: ["agendar", "serviços", "como funciona"] },
  "como funciona": { msg: "O processo com a Bea é simples e 100% pelo Portal do Paciente:\n\n1️⃣ Agende sua consulta direto pelo site\n2️⃣ Acesse seu portal exclusivo com tudo sobre suas sessões\n3️⃣ Confirme e receba o link da videochamada\n4️⃣ Entre na sala com um clique no dia marcado\n5️⃣ Acompanhe seu histórico, prontuários e pagamentos\n\nTudo no seu ritmo, com segurança e acolhimento. 💚", opts: ["agendar", "valores", "contato"] },
  contato: { msg: "📱 WhatsApp: (11) 98884-0525\n📸 Instagram: @psicolobiaa\n🎵 TikTok: @psicolobiaa\n\nA Bea responde rápido! Entre em contato sem compromisso 🌿", opts: ["agendar", "serviços", "como funciona"] },
  ansiedade: { msg: "🧠 A ansiedade é uma das queixas mais comuns nos atendimentos da Bea. Com a Terapia de Aceitação e Compromisso (ACT), você aprende a acolher emoções difíceis sem ser dominado(a) por elas.\n\nA Bea tem certificação em Transtorno Ansioso e Depressivo pelo Albert Einstein! 🏥", opts: ["agendar", "depressão", "como funciona"] },
  "depressão": { msg: "💙 A depressão pode fazer tudo parecer pesado. A Bea trabalha com ACT e Terapia para Tratamento de Traumas, ajudando você a reconectar com o que importa na sua vida.\n\nVocê não precisa passar por isso sozinho(a). 🌿", opts: ["agendar", "ansiedade", "emergência"] },
  valores: { msg: "💰 Valores das sessões:\n\n• Terapia Individual Online (50 min)\n• Ansiedade & Depressão (50 min)\n• Tratamento de Traumas (50 min)\n• Criadores de Conteúdo (50 min)\n• Terapia de Casal (60 min)\n• Autoconhecimento (60 min)\n\nOs valores são informados diretamente pelo WhatsApp. A Bea trabalha com preços acessíveis e possibilidade de negociação 🌿", opts: ["agendar", "serviços", "contato"] },
  "emergência": { msg: "🚨 Se você está em crise ou tendo pensamentos suicidas:\n\n📞 CVV: 188 (24h, gratuito)\n💬 Chat: cvv.org.br\n📱 SAMU: 192\n\nVocê não está sozinho(a). Busque ajuda agora. ❤️\n\nA Bea também está disponível no WhatsApp para orientação.", opts: ["contato", "agendar"] },
};

type Msg = { text: string; from: "bot" | "user" };

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [inited, setInited] = useState(false);
  const [textInput, setTextInput] = useState("");
  const messagesRef = useRef<HTMLDivElement>(null);

  const scrollDown = () => {
    setTimeout(() => { messagesRef.current?.scrollTo(0, messagesRef.current.scrollHeight); }, 50);
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && !inited) {
      setMessages([{ text: "Olá! 🌿 Bem-vindo(a)! Sou a assistente virtual da Bea (Psicolobia). Como posso te ajudar?", from: "bot" }]);
      setOptions(["agendar", "serviços", "ansiedade", "online", "valores", "como funciona"]);
      setInited(true);
    }
  };

  const findBestMatch = (input: string): string | null => {
    const lower = input.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const keywords: Record<string, string[]> = {
      agendar: ["agendar", "agenda", "marcar", "sessao", "consulta", "horario"],
      "serviços": ["servico", "servicos", "atendimento", "tipo", "modalidade"],
      online: ["online", "distancia", "remoto", "video", "videochamada"],
      casal: ["casal", "casamento", "relacionamento", "conjugal", "parceiro", "parceira"],
      "como funciona": ["funciona", "processo", "etapa", "comecar", "inicio", "portal"],
      contato: ["contato", "whatsapp", "instagram", "telefone", "falar"],
      ansiedade: ["ansiedade", "ansiosa", "ansioso", "panico", "nervoso"],
      "depressão": ["depressao", "depressivo", "triste", "tristeza", "desanimo"],
      valores: ["valor", "valores", "preco", "precos", "custo", "quanto"],
      "emergência": ["emergencia", "crise", "suicidio", "suicida", "urgente", "cvv", "188"],
    };
    for (const [key, words] of Object.entries(keywords)) {
      if (words.some((w) => lower.includes(w))) return key;
    }
    return null;
  };

  const handleOpt = (key: string) => {
    setMessages((prev) => [...prev, { text: key.charAt(0).toUpperCase() + key.slice(1), from: "user" }]);
    setOptions([]);
    const r = botResponses[key];
    if (r) {
      setTimeout(() => {
        setMessages((prev) => [...prev, { text: r.msg, from: "bot" }]);
        setOptions(r.opts);
        scrollDown();
      }, 500);
    }
    scrollDown();
  };

  useEffect(scrollDown, [messages]);

  return (
    <>
      {/* Toggle */}
      <motion.button
        onClick={toggle}
        aria-label="Assistente virtual"
        className="fixed bottom-8 right-8 w-[52px] h-[52px] rounded-full bg-gradient-to-br from-primary to-teal border-none cursor-pointer flex items-center justify-center z-[90] shadow-warm-lg no-print"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageSquare className="w-6 h-6 text-white" />
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full text-[0.6rem] font-bold text-white flex items-center justify-center animate-pulse-soft">1</span>
        )}
      </motion.button>

      {/* Chatbox */}
      <AnimatePresence>
      {open && (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 200, damping: 22 }}
        className="fixed bottom-24 right-8 w-[350px] max-h-[480px] glass-strong border border-primary/10 rounded-brand flex flex-col z-[91] shadow-warm-xl
        max-md:w-[calc(100vw-2rem)] max-md:right-4 max-md:bottom-[5.5rem] no-print">
        <div className="bg-gradient-to-r from-primary to-teal px-5 py-4 rounded-t-brand flex justify-between items-center">
          <h4 className="text-white font-heading text-sm flex items-center gap-1.5"><Leaf className="w-3.5 h-3.5" /> Assistente Psicolobia</h4>
          <button onClick={toggle} className="text-white/70 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div ref={messagesRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 max-h-[310px]">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`max-w-[85%] px-3.5 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-line
              ${msg.from === "bot" ? "bg-bg self-start rounded-bl-sm text-txt" : "bg-primary text-white self-end rounded-br-sm"}`}>
              {msg.text}
            </motion.div>
          ))}
        </div>

        {options.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-4 pb-2">
            {options.map((o) => (
              <button key={o} onClick={() => handleOpt(o)}
                className="px-3 py-1 bg-bg border border-primary/15 rounded-full text-[0.7rem] font-body text-txt hover:bg-primary hover:text-white hover:border-primary transition-colors cursor-pointer">
                {o.charAt(0).toUpperCase() + o.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Text Input */}
        <form onSubmit={(e) => {
          e.preventDefault();
          if (!textInput.trim()) return;
          const input = textInput.trim();
          setTextInput("");
          setMessages((prev) => [...prev, { text: input, from: "user" }]);
          setOptions([]);
          scrollDown();
          const match = findBestMatch(input);
          setTimeout(() => {
            if (match && botResponses[match]) {
              setMessages((prev) => [...prev, { text: botResponses[match].msg, from: "bot" }]);
              setOptions(botResponses[match].opts);
            } else {
              setMessages((prev) => [...prev, { text: "Hmm, não entendi muito bem 🤔 Mas posso te ajudar com essas opções:", from: "bot" }]);
              setOptions(["agendar", "serviços", "ansiedade", "valores", "contato", "emergência"]);
            }
            scrollDown();
          }, 500);
        }} className="px-4 pb-3 flex gap-2">
          <input type="text" value={textInput} onChange={(e) => setTextInput(e.target.value)}
            placeholder="Digite sua dúvida…"
            className="flex-1 py-2 px-3 border border-primary/15 rounded-full text-xs font-body bg-bg text-txt focus:outline-none focus:border-primary" />
          <button type="submit" className="w-8 h-8 rounded-full bg-teal text-white flex items-center justify-center hover:bg-teal-dark transition-colors">
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </motion.div>
      )}
      </AnimatePresence>
    </>
  );
}
