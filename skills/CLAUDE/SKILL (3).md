---
name: ui-design-high-fidelity
description: Design de UI high-fidelity preparado para animação — design system, tokens, componentes com states, separação correta de layers, prep de assets para que o handoff para a fase de animação seja limpo. Use quando o storyboard low-fi já estiver aprovado e for hora de produzir as telas finais. Acionar quando o usuário disser: "design system", "componentes", "tokens", "UI hi-fi", "telas finais", "prep pra animação", "exportar pra After Effects", "preparar layers", "Figma final", "ícones customizados", "ilustração", "dark mode", "auto layout".
---

# UI Design High-Fidelity (animation-ready)

Diferença crítica de UI design comum: aqui cada decisão considera "como isto vai animar?". UI bonito mas mal preparado vira pesadelo na fase de animação — layer flatten errada, componentes não separados, ícone como vetor único quando deveria ser composto.

## Quando usar

- Storyboard low-fi de `02-wireframe-low-fidelity` aprovado
- Motion principles de `00-motion-design-fundamentals` definidos
- Hora de produzir as telas que vão aparecer no mockup final
- Refresh visual de mockup existente

## Workflow

### 1. Design tokens primeiro

Não desenhe nada antes de definir tokens. Mesmo num projeto pequeno, tokens evitam inconsistência.

**Tokens essenciais:**

```
COLOR
  primitive (paleta crua: gray-50, gray-100, ..., brand-500)
  semantic (uso real: bg-surface, bg-elevated, text-primary, border-default)

TYPOGRAPHY
  font-family (1-2 famílias máximo)
  font-size scale (12, 14, 16, 18, 24, 32, 48, 64 — escala 1.25x ou 1.333x)
  line-height (tight 1.1, normal 1.5, loose 1.75)
  letter-spacing (negativo em titles grandes, positivo em uppercase pequeno)

SPACING
  escala 4px ou 8px (4, 8, 12, 16, 24, 32, 48, 64, 96, 128)

RADIUS
  none, sm (4), md (8), lg (12), xl (16), full

ELEVATION
  shadows e blurs por nível (sm, md, lg, xl)

MOTION
  durations (xs 100ms, sm 200ms, md 400ms, lg 700ms)
  easings (ease-out-quint, expo-out, spring-soft, spring-bouncy)
```

Em Figma: usar Variables + Modes (light/dark, mobile/desktop). Nada de cor hardcoded.

### 2. Componentes com states completos

Cada componente precisa de:
- Default
- Hover (mesmo se for mobile-only — vai ser usado em mockup desktop)
- Active / Pressed
- Disabled
- Focus (se acessibilidade for relevante)
- Loading (se aplicável)

States = base pra animação. Sem state explícito, animador tem que inventar.

Componentes essenciais pra mockup animado:
- Button (3-4 variantes + states)
- Card (com slots pra content variável)
- Input (com state focus animado)
- Avatar (com indicador de status se aplicável)
- Badge / Tag
- Modal / Sheet (com backdrop)
- Toast / Notification
- Chart skeleton (mesmo se você não usar todos)

### 3. Preparação de layers para animação

**Esta é a parte que se erra mais.** Layer mal preparada = retrabalho de 2x na animação.

**Regras:**

- **Nomear tudo.** "Rectangle 47" é inaceitável. Use nome semântico: `card-pricing`, `cta-primary`, `header-logo`.
- **Agrupar por intenção de movimento.** Se 3 elementos vão se mover juntos, agrupe num frame. Se vão se mover separadamente, mantenha separados — mesmo que visualmente pareçam um bloco.
- **Separar protagonistas e supporting.** Cada protagonista (definido no storyboard) deve estar em sua própria camada/frame, não fundido no background.
- **Ícones como composições, não vetores únicos.** Se você quer animar o "interior" de um ícone (ex: checkmark sendo desenhado), o ícone precisa estar em multiple paths, não outline-flattened.
- **Texto como texto, não outline.** Texto outlined perde editabilidade e fica pesado pra animar caractere-a-caractere. Mantenha como texto até a hora de export final.
- **Sombras separadas se forem animar.** Sombra como propriedade do objeto = move junto. Sombra como camada separada = pode animar com offset/blur diferente.

### 4. Auto Layout estratégico

Auto Layout é amigo até virar inimigo. Use:
- ✅ Em listas, grids, headers, footers (estrutura repetitiva)
- ✅ Em componentes que você vai instanciar muitas vezes
- ❌ Em frames que vão ser exportados pra After Effects (o AE não entende auto layout — vai virar absolute positioning de qualquer jeito; melhor exportar já em absolute)

### 5. Dark/Light mode (se relevante)

Se o mockup vai mostrar os 2 modos, design os 2 desde o início:
- Use Variables + Modes no Figma
- Não invente cores no dark mode — o dark mode tem hierarquia própria (surface, elevated, overlay)
- Sombra muda completamente: dark mode usa quase nada de shadow, glow sutil substitui

### 6. Ícones e ilustrações customizadas

Genéricos do Lucide/Phosphor são OK pra MVP, mas mockup de alto nível (Awwwards-tier) **não usa ícones genéricos** sem customização. Mínimo:
- Ajustar stroke-width pra alinhar com tipografia
- Customizar 2-3 ícones-chave (CTA principal, logo, ícone de feature destacada)
- Considerar ícones com micro-detalhe único (highlights, gradient sutil, dual-tone)

Pra ilustrações: ou produzir custom (preferido), ou usar packs premium tematizados (Streamline, Untitled UI). Nunca misturar 2 estilos no mesmo mockup.

### 7. Tipografia hierarquia

Tipografia carrega 60% do "feeling" do mockup. Regras:

- Máximo 2 famílias (1 display + 1 body, ou apenas 1 boa sans bem usada)
- Escala consistente (1.25x ou 1.333x entre níveis)
- Display type (40px+) com letter-spacing negativo (-1% a -3%)
- Body com line-height 1.5-1.6
- Numerais tabulares em dashboards/charts

**Para mockup animado**: pensar em qual texto vai ter typing-in, fade-in caractere a caractere, ou stagger. Esses vão ser tratados como elemento gráfico, não texto puro — separar em campo dedicado.

## Ferramentas

- **Figma** (preferencial — Variables, Modes, Auto Layout, Components, Dev Mode)
- **Plugins úteis:**
  - "Tokens Studio" pra gestão de design tokens
  - "Iconify" pra busca de ícones
  - "Anima" pra preview de animações
  - "Figma to After Effects (Aeux)" pra handoff
  - "LottieFiles" pra preview e export Lottie
  - "Unsplash" pra placeholders quando preciso

## Pitfalls comuns

- **Designar hi-fi sem storyboard low-fi aprovado** — você vai retrabalhar
- **Layers sem nome** — fase de animação vira inferno
- **Cores hardcoded** — bloqueia dark mode e theming
- **Auto Layout em tudo** — quebra na hora de exportar pra AE
- **Ícones flatten** — não dá pra animar interior
- **Texto outlined cedo demais** — perde editabilidade
- **Sombra junto do objeto quando deveria ser separada** — limita animação
- **Não testar dark mode antes do final** — descobrir contraste ruim no last minute
- **Misturar 2 estilos de ícone/ilustração** — mata coesão visual

## Validação antes de avançar

Checklist antes de ir pra `04-prototipagem-interativa`:

- ✅ Tokens definidos (color, typo, spacing, radius, elevation, motion)
- ✅ Componentes com todos states necessários
- ✅ Layers com nomes semânticos
- ✅ Protagonistas separados de supporting/background
- ✅ Ícones-chave customizados, não genéricos
- ✅ Dark/light mode validado se aplicável
- ✅ Texto como texto (não outlined ainda)
- ✅ Frames organizados em pages do Figma de forma legível

## Output esperado

1. Arquivo Figma com:
   - Page "Design Tokens" (variables visíveis)
   - Page "Components" (com todos states)
   - Page "Screens" (telas finais, organizadas pela ordem do storyboard)
   - Page "Assets prep" (versões prontas pra export — sem auto layout, layers nomeadas)
2. Documentação curta (em Notion ou no próprio Figma) listando:
   - Paleta semântica
   - Escala tipográfica
   - Lista de componentes com seus states
3. Aprovação do cliente / Vinicius

Este output alimenta `04-prototipagem-interativa` e `05-animacao-avancada`.
