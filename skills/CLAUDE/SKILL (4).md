---
name: prototipagem-interativa
description: Construção de protótipos interativos a partir das telas hi-fi — Smart Animate no Figma, ProtoPie/Framer pra interações condicionais, componentes com microestados, validação de fluxo antes de partir pra animação avançada. Use quando o UI hi-fi estiver pronto e o objetivo for testar a interação real (não apenas mockup-vídeo). Acionar quando o usuário disser: "protótipo", "interativo", "Smart Animate", "ProtoPie", "Framer", "transição entre telas", "testar fluxo", "tap/scroll/drag", "componente interativo", "modal animado", "estado condicional", "teste com usuário".
---

# Prototipagem Interativa

Esta fase é opcional dependendo do entregável. **Se o objetivo final é mockup-vídeo apenas**, você pode pular pra `05-animacao-avancada`. **Se o objetivo é validar fluxo real ou entregar protótipo navegável**, esta fase é crítica.

## Quando usar

- Cliente vai testar o protótipo com usuário real (Maze, sessão moderada)
- Mockup precisa ser entregue como link navegável (pitch interativo)
- Demonstração de interações que dependem de input real (scroll, drag, condições)
- Preparação pra dev — protótipo serve como spec de interação

## Quando pular

- Mockup-vídeo de portfolio puro (vá direto pra `05-animacao-avancada`)
- Cliente não vai mexer no protótipo
- Apenas captura de tela animada é necessária

## Workflow

### 1. Escolha de ferramenta

Decisão antes de começar:

| Necessidade | Ferramenta |
|---|---|
| Transições simples entre telas | Figma + Smart Animate |
| Componentes interativos (tabs, dropdowns, toggles) | Figma + Variants + Interactive Components |
| Lógica condicional (if/then), variáveis | Figma + Variables + Conditional flows |
| Drag, scroll preciso, sensores, áudio | ProtoPie |
| Web realista, código próximo, hover states elaborados | Framer |
| Animação muito complexa entre states | Principle (descontinuado mas ainda usado) ou Origami (Mac, Facebook) |

Para o stack do Vinicius (Figma-first), Figma + ProtoPie cobrem 95% dos casos.

### 2. Smart Animate no Figma — boas práticas

Smart Animate funciona quando elementos têm **mesmo nome** entre frames. Erros comuns:

- ❌ Renomear layer entre frames quebra Smart Animate
- ❌ Mudar tipo de elemento (rectangle pra ellipse) não anima
- ❌ Adicionar/remover layer sem aviso = fade-in/out automático que pode ficar feio

**Padrão correto:**

1. Duplicar frame 1 → frame 2
2. No frame 2, modificar apenas o que vai animar (posição, escala, cor, opacity)
3. Manter nomes idênticos
4. Conectar com transição "Smart Animate"
5. Definir easing (custom bezier > presets)
6. Definir duração (consultar tabela de `00-motion-design-fundamentals`)

### 3. Componentes interativos (Variants + Interactive)

Pra elementos que precisam alternar state sem mudar de tela:

- Criar Variants (default, hover, pressed, disabled)
- Em Properties, adicionar interaction "While hovering" → mudar pra variant hover
- "On click" → mudar pra variant pressed → after delay, voltar
- Smart Animate entre variants

Útil pra: botões, inputs, toggles, tabs, dropdowns.

### 4. Lógica condicional e variáveis

Figma Variables + Conditional flows permitem:
- Login com validação fake
- Carrinho que soma quantidade
- Toggle de tema (light/dark) em runtime
- Mostrar diferentes states baseado em ação anterior

Limitação: não substitui código. Se a lógica passa de 3-4 condições, vá pra Framer.

### 5. ProtoPie — quando é necessário

Use ProtoPie quando precisa de:
- **Drag preciso** (Figma faz drag-to-reorder mas nada além)
- **Scroll-driven** com lógica (paralax, sticky, snap)
- **Inputs reais** (texto digitado, áudio, microfone)
- **Sensores** (giroscópio, câmera — em mobile)
- **Áudio sincronizado** (efeito sonoro em interação)

ProtoPie tem curva de aprendizado maior; reservar pra projetos onde o protótipo é o entregável real.

### 6. Testes de usabilidade com protótipo animado

Se o protótipo vai ser testado com usuário:

- Reduzir animações longas que atrasam tarefa (>800ms vira frustração em teste)
- Testar em device real, não só desktop preview (mobile tem latência diferente)
- Maze, Useberry ou sessão moderada via Lookback/Zoom
- Coletar feedback sobre: clareza, velocidade percebida, momentos de confusão

Se animação atrapalha tarefa, **reduza primeiro, depois reanime depois**. Não tire o teste por causa da estética.

### 7. Handoff pra próxima fase

Se for seguir pra `05-animacao-avancada` (ex: produzir mockup-vídeo do mesmo projeto após validar), preservar:
- Documentar quais transições funcionaram bem (durações, easings que ficaram bons)
- Quais funcionaram mas precisariam de polish maior em vídeo
- Quais não fariam sentido em vídeo (ex: hovers — mostre apenas em vídeo se for relevante narrativamente)

## Ferramentas

**Figma + plugins:**
- Figmotion (export Figma → After Effects)
- Anima (preview avançado de animação)
- Aeux (Figma → AE)

**Outras:**
- ProtoPie (interações complexas, sensores)
- Framer (web próximo do real, com código)
- Origami Studio (Mac, gratuito, poderoso)
- Principle (mais limitado mas rápido pra micro-interações)

## Pitfalls comuns

- **Smart Animate quebrando** porque layer foi renomeada — sempre verificar consistência
- **Hover em mobile prototype** — não funciona em touch; testar em device real
- **Animação longa em protótipo de teste** — frustra usuário; reduzir
- **Tudo no Figma quando devia ser ProtoPie** — esforço enorme pra simular drag, melhor mudar de ferramenta
- **Variantes sem Smart Animate entre elas** — alternância dura, não anima
- **Não testar em device real** — surpresas no final

## Output esperado

Dependendo do destino:

**Se entrega = protótipo navegável:**
- Link Figma (ou ProtoPie/Framer) compartilhável
- Documentação de fluxo (Notion ou no próprio arquivo)
- Vídeo curto demonstrando os principais flows

**Se entrega = continuação para mockup-vídeo:**
- Validação documentada de quais transições funcionam
- Notas sobre durações/easings testados
- Frames já validados como "prontos" pra fase de animação avançada

Este output pode alimentar `05-animacao-avancada` (caso vire vídeo) ou ser entregue como produto final.
