# Landing Page — Plataforma MenteVive

## Estado Atual
`src/app/page.tsx` faz `redirect("/login")` — sem conteúdo público.
Componentes em `src/components/landing/` existem (Hero, Journey, FAQ) mas não são usados.

## Objetivo
Página pública em `/` que vende a plataforma para **psicólogos** (B2B) — explicar que MenteVive é o SaaS deles para gerenciar consultório online.

## Público-alvo
- Psicólogos clínicos autônomos querendo digitalizar o consultório
- Clínicas pequenas (2-5 profissionais) buscando solução integrada
- Profissionais migrando de planilhas/WhatsApp

---

## Estrutura de Seções (top → bottom)

### 1. Navbar (fixo, glass)
- Logo MenteVive (text logo ou SVG)
- Links: Recursos | Planos | Depoimentos | Blog | Contato
- CTA: "Começar grátis" → `/registro?role=therapist`
- Login: "Entrar" → `/login`
- Mobile: hamburger com drawer

### 2. Hero
- **Layout**: split — texto esquerda, mockup/ilustração direita
- **Headline**: "Seu consultório online. Completo. Seguro. Profissional."
- **Subtítulo**: "Agenda, prontuários, pagamentos e videochamadas — tudo em um só lugar, com a segurança que seus pacientes merecem."
- **CTAs**: 
  - Primário: "Começar grátis por 14 dias" → `/registro?role=therapist`
  - Secundário: "Ver demonstração" → scroll para seção de demo/vídeo
- **Prova social**: "Usado por +XX psicólogos" (quando houver dados)
- **Visual**: glassmorphism card com screenshot do admin dashboard

### 3. Problema → Solução
- **Layout**: 3 cards glass lado a lado
- Card 1: "Agenda no WhatsApp?" → "Agenda inteligente com confirmação automática"
- Card 2: "Prontuários em papel?" → "Prontuário digital seguro e organizado"
- Card 3: "Pagamentos manuais?" → "Cobrança e recebimento via Stripe/PIX"
- Cada card: ícone Lucide + título + descrição curta

### 4. Recursos (Features)
- **Layout**: alternating — texto + screenshot, screenshot + texto
- **Feature 1 — Agenda Inteligente**
  - Screenshot: admin/agenda com calendário
  - Bullets: Agendamento online pelo paciente | Bloqueio de horários | Recorrência semanal/quinzenal | Integração com sala de espera
- **Feature 2 — Prontuário Digital**
  - Screenshot: admin/prontuarios com formulário
  - Bullets: Registro por sessão | Queixa principal + notas clínicas | Confidencialidade | Histórico completo do paciente
- **Feature 3 — Portal do Paciente**
  - Screenshot: portal dashboard
  - Bullets: Triagem pré-sessão | Visualizar sessões e pagamentos | Sala de espera com countdown | Documentos compartilhados
- **Feature 4 — Pagamentos Integrados**
  - Screenshot: admin/financeiro
  - Bullets: Stripe (cartão + PIX) | Recebimento direto na sua conta | Controle de inadimplência | Relatórios financeiros
- **Feature 5 — Videochamada**
  - Screenshot: sala de espera + Jitsi
  - Bullets: Jitsi Meet integrado | Sem instalar nada | Sala de espera com timer | Link único por sessão

### 5. Como Funciona (3 passos)
- **Layout**: horizontal timeline com 3 steps
- Step 1: "Crie sua conta" — Cadastro em 2 minutos, sem cartão
- Step 2: "Configure seu consultório" — Horários, preços, especialidades
- Step 3: "Comece a atender" — Compartilhe o link e receba pacientes

### 6. Planos e Preços
- **Layout**: 3 cards pricing lado a lado
- **Grátis (14 dias trial)**
  - Até 5 pacientes
  - Agenda básica
  - Prontuários
  - 1 profissional
  - CTA: "Começar grátis"
- **Profissional — R$ 59,90/mês**
  - Pacientes ilimitados
  - Agenda completa + recorrência
  - Prontuário + documentos
  - Portal do paciente
  - Pagamentos Stripe
  - Videochamada + sala de espera
  - Blog do consultório
  - Notificações
  - CTA: "Assinar agora"
- **Enterprise — R$ 499,00/ano** (economize 30%)
  - Tudo do Profissional
  - Múltiplos profissionais
  - Relatórios avançados
  - Suporte prioritário
  - Branding personalizado
  - CTA: "Assinar anual"
- Badge "Mais popular" no Profissional
- Toggle mensal/anual com desconto highlight

### 7. Depoimentos / Social Proof
- **Layout**: carousel de cards glass
- Depoimentos (mock para início, substituir por reais):
  - "Finalmente parei de gerenciar meu consultório pelo WhatsApp" — Dra. Ana, SP
  - "Meus pacientes adoram o portal e a sala de espera" — Dr. Lucas, RJ
  - "O prontuário digital mudou minha organização" — Dra. Maria, MG
- Cada card: foto (avatar placeholder), nome, cidade, frase, estrelas

### 8. FAQ (Perguntas Frequentes)
- **Layout**: accordion (expand/collapse)
- Perguntas:
  - "Preciso de cartão para testar?" → Não, trial gratuito de 14 dias sem cartão
  - "Meus dados são seguros?" → Sim, criptografia, HTTPS, servidores Neon/Vercel, LGPD
  - "Funciona no celular?" → Sim, responsivo para mobile e tablet
  - "Posso migrar de outra plataforma?" → Sim, suporte para importação de dados
  - "Como recebo os pagamentos?" → Via Stripe direto na sua conta bancária
  - "Posso cancelar a qualquer momento?" → Sim, sem multa, seus dados ficam disponíveis por 30 dias

### 9. CTA Final
- **Layout**: full-width gradient background (primary → teal)
- **Headline**: "Pronto para transformar seu consultório?"
- **Subtítulo**: "Junte-se a psicólogos que já digitalizaram seu atendimento"
- **CTA**: "Criar minha conta grátis" → `/registro?role=therapist`

### 10. Footer
- **Layout**: 4 colunas
- Col 1: Logo + tagline "Tecnologia para saúde mental"
- Col 2: Produto — Recursos | Planos | Blog | Status
- Col 3: Suporte — Central de ajuda | Contato | Termos de uso | Política de privacidade
- Col 4: Social — Instagram | LinkedIn
- Bottom: "© 2026 MenteVive. Todos os direitos reservados."

---

## Implementação

### Arquivos a criar/modificar

```
src/app/page.tsx                    — Remover redirect, importar LandingPage
src/components/landing/
  ├── LandingPage.tsx               — Componente principal (server component wrapper)
  ├── Navbar.tsx                    — Nav fixa com glass effect
  ├── HeroSection.tsx               — Hero split com CTAs
  ├── ProblemSolution.tsx           — 3 cards problema → solução
  ├── FeaturesSection.tsx           — 5 features alternadas
  ├── HowItWorks.tsx                — 3 steps timeline
  ├── PricingSection.tsx            — 3 plans + toggle mensal/anual
  ├── TestimonialsSection.tsx       — Carousel de depoimentos
  ├── FAQSection.tsx                — Accordion
  ├── CTASection.tsx                — Full-width final CTA
  └── Footer.tsx                    — 4 colunas
```

### Componentes client vs server
- `"use client"`: Navbar (scroll state), PricingSection (toggle), FAQSection (accordion), TestimonialsSection (carousel)
- Server: LandingPage, HeroSection, ProblemSolution, FeaturesSection, HowItWorks, CTASection, Footer

### Dependências existentes (NÃO instalar novas)
- Framer Motion — animações de entrada (scroll reveal)
- Lucide React — ícones
- Tailwind CSS — estilo (usar design tokens existentes)
- `ScrollReveal` component — já existe em `src/components/ScrollReveal.tsx`

### SEO
- `metadata` no `page.tsx`: title "MenteVive — Consultório Online para Psicólogos", description, OG image
- JSON-LD: `SoftwareApplication` schema
- `robots.ts` e `sitemap.ts` já existem — verificar se `/` está incluído

### Proxy update
- `src/proxy.ts` já tem `/` como public path — não precisa mudar
- Remover redirect de `page.tsx` e colocar o conteúdo real

---

## Smoke Tests

1. Acesse `http://localhost:3000/` — deve ver a landing (NÃO redirect para /login)
2. Click "Começar grátis" → redireciona para `/registro?role=therapist`
3. Click "Entrar" → redireciona para `/login`
4. Mobile (375px): hamburger funciona, todas as seções visíveis
5. Tablet (768px): layout ajusta corretamente
6. Lighthouse: Performance > 90, SEO > 95
7. View page source: meta tags OG presentes, JSON-LD presente
