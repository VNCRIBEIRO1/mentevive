---
name: research-discovery
description: Pesquisa e descoberta inicial de um projeto de mockup animado de alto nível — benchmark competitivo, definição de motion principles, moodboard de animação e tradução de requisitos do cliente em direção criativa. Use no kickoff de qualquer projeto novo de mockup, landing animada ou caso de portfolio. Acionar quando o usuário disser: "comecei um projeto novo", "preciso de referência", "qual a direção criativa", "como começar este mockup", "fiz briefing com o cliente", "moodboard", "benchmark", "estudo de motion", "Awwwards", "Dribbble".
---

# Research & Discovery

Primeira fase do pipeline. O objetivo aqui não é desenhar nada ainda — é definir o terreno: o que o cliente realmente quer, o que o mercado já fez, e quais são os motion principles específicos deste projeto.

## Quando usar

- Briefing inicial recebido (verbal, escrito, áudio do WhatsApp)
- Cliente novo ou produto novo sem direção definida
- Refresh de um projeto antigo que perdeu direção
- Antes de abrir o Figma — sempre

## Workflow

### 1. Extração de intenção

Antes de buscar referência externa, extraia do briefing:

- **Função do mockup**: portfolio do Vinicius? pitch pro cliente final? campanha paga? landing real? Cada um pede tom diferente.
- **Plataforma de destino**: Instagram (vertical, 9:16, 15-30s, sem som geralmente), site (horizontal, 16:9, 30-60s, com som), Behance/Awwwards (1920x1080, sem limite de tempo).
- **Audiência final**: B2B sério, B2C jovem, governo, advocacia? O tom muda completamente.
- **Restrição de tom**: cliente jurídico (Dra. Luciana, por exemplo) tem regras de OAB — não pode ter promessa de resultado, não pode soar "marketing agressivo".

Se o briefing não cobre algum desses pontos, **pergunte ao cliente antes de buscar referência**. Buscar referência sem direção produz moodboard inútil.

### 2. Benchmark competitivo (3 níveis)

Não vá direto pro Dribbble. Faça 3 níveis de busca:

**Nível 1 — Direto concorrente**: outras empresas/produtos do mesmo nicho. Captura: o que é "esperado" no mercado. Goal: superar este nível.

**Nível 2 — Adjacente premium**: produtos de outros nichos mas com qualidade visual de referência. Ex: pra advocacia, olhar como produtos financeiros premium (Mercury, Stripe, Brex) comunicam confiança.

**Nível 3 — Inspiração de motion pura**: Awwwards SOTD, Motionographer, FWA, casos da Active Theory ou Resn. Captura técnica de motion, não conteúdo.

Coletar entre 5-10 referências por nível. Salvar URLs + screenshot + 1 frase explicando o que captura cada uma.

### 3. Definição de motion principles do projeto

Com base em research e nos princípios fundamentais (ver `00-motion-design-fundamentals`), definir 3-5 princípios específicos deste projeto. Formato bandeira:

- "Movimento como respiração, nunca como pulso" → animações longas e suaves, sem snap rápido
- "Cada elemento entra com propósito" → tudo tem anticipation + follow-through, nada aparece por aparecer
- "Câmera observa, não dirige" → zooms sutis, sem dolly agressivo

Esses princípios viram filtro pra todas decisões nas fases seguintes. Se durante a animação avançada alguém propuser um spring exagerado e o princípio é "como respiração", o spring é cortado.

### 4. Moodboard de motion (não só estático)

Diferença crítica: moodboard de UI estático é fácil. Moodboard de **motion** precisa de capturas de movimento.

Para cada referência relevante, capturar:
- Vídeo curto (5-10s) ou GIF
- Screenshot do frame mais importante
- Anotação: "o que esta referência ensina especificamente?" (ex: "easing da abertura do menu", "ritmo do reveal de cards")

Organizar em Figma ou FigJam. Agrupar por categoria: Easing, Timing, Hierarquia, Storytelling, Polish/Effects.

### 5. Documentação de saída

Entregar (ao próprio Vinicius como artefato interno, ou ao cliente em apresentação leve):

- Brief consolidado (1 página)
- Motion principles (3-5 frases-bandeira)
- Moodboard (link Figma)
- Lista de "anti-references" — coisas que o projeto NÃO vai ser

## Ferramentas e onde buscar

**Buscas de referência:**
- Awwwards (filtros: Sites of the Day, Sites of the Month, categoria por nicho)
- Dribbble (busca por "motion", "interaction", filtrar por shots populares no último ano)
- Behance (cases completos, ler descrição não só ver imagem)
- Motionographer (curadoria de motion design pesado)
- Cosmos.so (curadoria visual mais alternativa)
- Godly.website (arquitetura visual diferenciada)
- Land-book (landing pages)
- Mobbin (UI mobile real)

**Captura de motion:**
- Quicktime (Mac) ou ShareX/OBS (Windows) pra gravação de tela
- Kap (Mac) pra GIF
- Cleanshot pra capturas anotadas

**Organização:**
- Figma + FigJam pra moodboard
- Notion pra brief consolidado
- Cosmos.so como mood público

## Pitfalls comuns

- **Buscar referência sem direção**: produz moodboard de 80 imagens e zero foco. Sempre extrair intenção primeiro.
- **Copiar referência diretamente**: research é sobre vocabulário, não plágio. Os princípios são abstratos, a execução é original.
- **Pular pra UI sem definir motion principles**: vai produzir UI bonito mas que não anima bem.
- **Ignorar restrições do cliente**: OAB, regras setoriais, identidade já existente — research precisa respeitar.
- **Moodboard sem motion**: só imagens estáticas é moodboard de UI, não de animação.

## Output esperado

Pacote de discovery contendo:

1. Brief consolidado (1 página, em Notion ou Markdown)
2. 3-5 motion principles do projeto
3. Moodboard com 10-20 referências de motion (com clipes/GIFs, não só imagens)
4. Lista de anti-references
5. Recomendação de stack para próximas fases (Figma + Figmotion? After Effects + Lottie? Rive? Código?)

Este output alimenta diretamente `02-wireframe-low-fidelity`.
