---
name: motion-design-fundamentals
description: Princípios fundamentais de motion design aplicados a mockups animados de alto nível (qualidade Awwwards). Use sempre que houver qualquer decisão sobre timing, easing, hierarquia de movimento, ritmo visual, performance ou storytelling com animação. Use também como base teórica para as outras skills da pipeline (research, wireframe, UI, prototipagem, animação avançada, zoom & polish, edição, export). Acionar quando o usuário mencionar: motion, animação, easing, timing, fluidez, 60fps, "como animar", "qual a duração ideal", "isso ficou robótico", curvas de animação, princípios de animação, ritmo, ou pedir review crítico de qualquer animação.
---

# Motion Design Fundamentals

Base teórica e regras de decisão que se aplicam a TODAS as fases de produção de mockup animado de alto nível. As outras skills consomem este vocabulário.

## Quando usar este skill

- Decisão sobre duração, easing ou hierarquia de qualquer movimento
- Review crítico de uma animação ("por que isso ficou estranho?")
- Definir motion principles de um projeto novo
- Resolver conflitos entre fluidez e performance
- Avaliar se uma animação está "barata" ou "premium"

## Os 7 princípios não-negociáveis

Ignore os 12 princípios clássicos da Disney crus — adaptei para UI motion de mockup. Use esta lista como checklist em qualquer revisão:

1. **Easing nunca é linear.** Movimento linear comunica "isto é uma máquina". Para tudo que representa intenção (UI, câmera, transições) use curva. Default: `cubic-bezier(0.4, 0, 0.2, 1)` (Material standard) para movimentos curtos; `cubic-bezier(0.16, 1, 0.3, 1)` (expo-out) para entradas dramáticas.
2. **Anticipation vende o movimento.** Antes de um movimento grande, dê um micro-recuo (10-20ms) na direção oposta. É o que separa "card que pula" de "card que vive".
3. **Follow-through e overlap.** Elementos secundários (sombra, ícones internos, texto) chegam 30-80ms depois do principal. Nunca tudo junto.
4. **Stagger é hierarquia.** Lista de items entrando: 40-80ms entre cada. Menor que 40 vira "tudo junto". Maior que 100 vira "lento demais".
5. **Movimento serve narrativa, não decoração.** Pergunte sempre: "se eu remover esta animação, o usuário perde informação?" Se a resposta for não, considere remover ou tornar mais sutil.
6. **Velocidade comunica peso.** Objeto pesado = aceleração lenta + ease-out longo. Objeto leve = curva mais rápida e snappy. Inconsistência aqui mata a credibilidade.
7. **60fps é piso, não teto.** Qualquer drop de frame em mockup destrói a percepção de qualidade. Otimize antes de adicionar.

## Tabela de durações de referência

Para mockup de alto nível, use estes valores como ponto de partida:

| Tipo de movimento | Duração | Easing recomendado |
|---|---|---|
| Hover / micro-feedback | 100-150ms | ease-out |
| Tap / press | 80-120ms | ease-out-quint |
| Reveal de elemento | 300-500ms | expo-out (`0.16, 1, 0.3, 1`) |
| Transição entre telas | 400-700ms | custom bezier |
| Zoom cinematográfico | 1.5-3.5s | ease-in-out lento |
| Parallax scroll | tied ao scroll | linear (não tem duração própria) |
| Entrada de hero / opening | 800-1500ms | combinação stagger + expo-out |

Em mockup de portfolio (não app real), você pode usar durações 20-30% mais longas que em produto real — o vídeo precisa de "respiração" pra leitura.

## Storytelling com motion

Todo mockup de alto nível conta uma micro-narrativa. Estrutura clássica em 3 atos:

1. **Estabelecimento (0-2s)**: Apresenta contexto. Pode ser logo, brand reveal, ou device + UI estática.
2. **Demonstração (2-15s)**: O coração. Sequência de interações que mostra o produto. Cada cena dura 1.5-3s, com transição clara.
3. **Resolução (últimos 1-2s)**: Hold final, geralmente com pull-back camera ou parallax sutil, terminando em frame "campanha-able" (que sirva como thumbnail estático).

Cada cena deve ter um único protagonista visual. Quando dois elementos competem por atenção ao mesmo tempo, um deles deve ser desaturado, blurrado ou em segundo plano.

## Ritmo: regra dos 3 batimentos

Um mockup de 15-30s deve ter 3 momentos de quebra de ritmo (beats):
- **Beat 1 (~25% do vídeo)**: primeira reveal grande
- **Beat 2 (~60%)**: virada / pico de complexidade visual
- **Beat 3 (~95%)**: último ah-ha antes do hold

Sem beats, o vídeo vira "mostruário plano". Beats demais e vira videoclipe sem foco.

## Performance awareness

Estas regras valem mesmo em mockup (não só em produto real):

- Anime apenas `transform` e `opacity` quando possível. Animar `width`, `height`, `top`, `left`, `box-shadow` força reflow/repaint e tropeça.
- Em After Effects: pré-comp camadas com efeitos pesados. Cache em RAM antes de exportar.
- Em Figma/Figmotion: máximo de 6-8 elementos animados simultâneos sem perder fluidez no preview.
- Em Lottie: vector simples; sem efeitos de blur/glow no After Effects (não exportam bem). Ver `08-export-entrega` para detalhes.

## Tendências 2025-2026 (use com critério)

Não são regras, são vocabulário atual:

- **Bento grids animados** com elementos entrando em sequência staggered
- **Liquid metal / chrome aesthetics** (vide projeto banner do Vinicius com SD + AnimateDiff)
- **Scroll-driven canvas/WebGL** para hero sections
- **AI-generated textures** combinadas com motion vetorial limpo
- **Voice-reactive UI** (raro em mockup, mas surgindo)
- **Spring physics** sobrepondo eases bezier tradicionais
- **Minimal type-only intros** com kinetic typography
- **Camera moves cinematográficos** em UI 2D (dolly zoom, rack focus simulado)

Evitar (já saturado):
- Glassmorphism puro (sem variação)
- Gradient mesh genérico (vide Stripe 2020)
- Paralaxes de mouse em landing (overused)

## Como este skill se conecta com os outros

- Em **research-discovery**: define os motion principles do projeto baseado nesta base
- Em **wireframe**: usa "regra dos 3 batimentos" pra mapear timing
- Em **UI design**: prepara assets respeitando "follow-through" e "overlap"
- Em **animação avançada**: implementa easings e stagger desta tabela
- Em **zoom & polish**: aplica princípios de câmera e ritmo
- Em **edição final**: garante que o ritmo do vídeo respeita os 3 beats
- Em **export**: respeita performance awareness

## Output esperado quando este skill é usado

Quando esta skill for o tema central de um pedido (ex: "me dá a base de motion pro projeto"), produzir:

1. **Motion principles do projeto** (3-5 princípios, escritos como frases-bandeira tipo "movimento como respiração, nunca como pulso")
2. **Tabela de timing customizada** (baseada na tabela de referência, ajustada ao tom do projeto)
3. **Easing primário e secundário** (cubic-bezier values específicos)
4. **Storyboard de beats** se houver mockup-vídeo previsto

Quando este skill for consultado como apoio a outra skill, citar apenas os princípios relevantes — não despejar a base inteira.
