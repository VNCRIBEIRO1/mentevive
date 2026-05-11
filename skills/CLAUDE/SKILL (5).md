---
name: animacao-avancada
description: Implementação de animações complexas para mockup de alto nível — stagger, spring physics, custom easing, morphing, shared element transitions, animação de gráficos e métricas. Use quando os assets hi-fi estão prontos e é hora de animar de fato. Acionar quando o usuário disser: "animar", "After Effects", "Bodymovin", "Lottie", "Rive", "Framer Motion", "stagger", "spring", "easing customizado", "morphing", "contador animado", "progress bar", "60fps", "animação de chart", "shared element", "transição entre telas".
---

# Animação Avançada

Esta é a fase onde o mockup ganha vida. As skills anteriores prepararam o terreno; aqui você executa motion de qualidade Awwwards. Performance e ritmo são tão importantes quanto criatividade.

## Quando usar

- Telas hi-fi prontas (validação de `03-ui-design-high-fidelity`)
- Storyboard de `02-wireframe-low-fidelity` aprovado
- Motion principles de `00-motion-design-fundamentals` definidos
- Hora de produzir as animações reais que vão pro vídeo final ou pro produto

## Workflow

### 1. Escolha de stack

Decidir antes de começar — mudar no meio é caro:

| Cenário | Stack |
|---|---|
| Mockup-vídeo polido pra portfolio/case | After Effects (importação Figma via Aeux/AEUX) |
| Animação leve pra web em produção | Lottie (After Effects + Bodymovin) |
| Animação interativa em web/app | Rive |
| Mockup feito em código (ex: landing real) | Framer Motion (React) ou GSAP |
| Animação rápida sem deixar Figma | Figmotion (limitado mas rápido) |
| Personagem animado complexo | After Effects + Duik (rigging) |

Para o stack atual do Vinicius (web + Astro/GSAP, ou mockups no Figma), o caminho mais comum é Figma → AE (via Aeux) → exportar como vídeo (.mp4) ou Lottie (.json).

### 2. Setup do projeto no After Effects

Sempre começar com:

- Composição na resolução final (1920x1080 horizontal, 1080x1920 vertical, 1080x1080 quadrado)
- Frame rate 60fps (não 30 — mockup de alto nível exige 60)
- Duração mínima 5s a mais que o vídeo final (margem pra ajuste)
- Usar guides pra safe areas (especialmente vertical: top/bottom 10% pra UI do Instagram/TikTok)

Organização de pastas no painel Project:
```
01_FOOTAGE (assets importados do Figma)
02_COMPS (composições principais e pré-comps)
03_AUDIO (se houver)
04_FINAL (composição master)
```

### 3. Import correto do Figma

Plugin recomendado: **Aeux (gratuito)** ou Figma to AE (Lottie). Qualquer um deles preserva:
- Camadas separadas (não flatten)
- Posição absoluta (sem auto layout, conforme preparado em `03-ui-design-high-fidelity`)
- Vetores como shape layers
- Texto como texto editável

Se a layer chegou flatten ou bagunçada, voltar pro Figma e refazer prep — não tente salvar no AE.

### 4. Animação por hierarquia, não por elemento

Erro de iniciante: animar elemento por elemento, no instinto. Resultado: caos sem ritmo.

Forma correta: animar por **camadas de hierarquia**, na ordem do storyboard.

**Para cada cena:**

1. **Protagonista primeiro**: animar o elemento principal com easing/duration definido. Esta é a "espinha".
2. **Supporting depois**: animar os reativos, sempre com offset 30-100ms em relação ao protagonista. Isto cria follow-through (princípio fundamental — ver `00-motion-design-fundamentals`).
3. **Background por último**: drift sutil, parallax ou nada.
4. **Polish (effects, sombras)**: ajustar por cima, depois.

### 5. Stagger correto

Stagger = elementos da mesma hierarquia entrando em sequência.

**Implementação no AE:**

- Selecionar todos os layers que vão staggered
- Animation > Keyframe Assistant > Sequence Layers
- Definir overlap (40-80ms é o sweet spot)
- Cada um tem o mesmo easing, só com offset

**No código (Framer Motion):**

```jsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }  // 60ms
  }
}
```

### 6. Spring vs bezier — quando usar cada

**Bezier (cubic-bezier):**
- Movimento controlado, predizível
- Quando o ritmo precisa ser exato (sincronizar com som, com outro elemento)
- Default pra UI séria (B2B, advocacia, financeiro)

**Spring physics:**
- Movimento orgânico, natural
- Quando você quer sensação de "vida" / "leveza"
- Default pra produtos jovens, B2C, gaming
- Cuidado: muito bouncy soa "barato"

**Valores de spring úteis (Framer Motion):**
- `{ type: "spring", stiffness: 300, damping: 30 }` — snappy, profissional
- `{ type: "spring", stiffness: 100, damping: 12 }` — suave, com pequeno overshoot
- `{ type: "spring", stiffness: 500, damping: 8 }` — bouncy, jovem (cuidado)

### 7. Easings essenciais (decorar)

```
ease-out-quint:    cubic-bezier(0.22, 1, 0.36, 1)     — entrada padrão UI
ease-out-expo:     cubic-bezier(0.16, 1, 0.3, 1)      — entrada dramática
ease-in-out-quart: cubic-bezier(0.76, 0, 0.24, 1)     — transição entre states
ease-out-back:     cubic-bezier(0.34, 1.56, 0.64, 1)  — overshoot sutil
ease-in-out-circ:  cubic-bezier(0.85, 0, 0.15, 1)     — câmera, zoom cinematográfico
```

Evitar **a todo custo:**
- Linear (vira robô)
- Presets default do Figma "Ease in and out" (genérico)

### 8. Morphing entre formas

Quando preciso transformar uma forma em outra (logo virando ícone, círculo virando retângulo):

- **No AE**: usar shape layers com mesmo path-vertex count + Path keyframes
- **No Lottie**: mesma técnica do AE, mas testar export — nem todo morphing exporta bem
- **No Rive**: melhor ferramenta pra morphing complexo (interpolação automática)
- **Em código (SVG)**: GSAP MorphSVG plugin, ou Flubber.js

Cuidado: morphing demanda controle de vertex count manual; se tem 4 pontos virando 6, vai dar glitch.

### 9. Animação de gráficos e métricas

Mockup de alto nível **sempre anima números** — nunca aparece já no valor final.

**Padrões:**

- **Contador subindo**: usar `transform: translateY` com mask, ou em código `useTransform` (Framer Motion). Duração 1-1.5s, easing ease-out-quint.
- **Progress bar**: animar `scaleX` (de 0 a 1) com transform-origin left. Duração 600-1000ms.
- **Chart desenhando**: usar `stroke-dasharray + stroke-dashoffset` em SVG, ou trim path no AE. Duração 1.5-2.5s.
- **Pie chart**: rotation animation, com angle stagger por slice.
- **Bar chart**: cada barra com scaleY de 0 a 1, staggered (60ms entre cada).

### 10. Shared element transitions

Quando um elemento aparece em duas telas (ex: card vira detail page).

**No AE:**
- Layer único que se reposiciona/escala entre cenas
- Não duplicar o layer e fazer cross-fade — fica feio

**No código:**
- React: Framer Motion `layoutId` (mágico)
- Native: Shared Element Transitions API (Android), ou React Native Reanimated

### 11. Performance check

Antes de renderizar, validar:

- ✅ 60fps consistente no preview (se RAM Preview cai pra 30fps, simplificar)
- ✅ Sem efeitos que vão estourar export pesado (motion blur, glow, particles em excesso)
- ✅ Pré-comps usadas pra agrupar efeitos (cache melhor)
- ✅ Não há keyframes "esquecidos" que duplicam movimento

## Ferramentas

**Vetor → Vídeo:**
- After Effects (padrão da indústria)
- Cavalry (alternativa moderna, motion graphics)
- Cinema 4D (3D quando necessário)

**Vetor → Web/Produto:**
- Lottie (After Effects + Bodymovin/LottieFiles)
- Rive (interativo, mais leve)
- Framer Motion (React)
- GSAP (vanilla JS, mais poderoso)
- Motion One (alternativa moderna ao GSAP)

**Diretamente no Figma:**
- Figmotion (animações simples)

**Plugins essenciais After Effects:**
- Aeux (Figma → AE)
- Bodymovin/LottieFiles (export Lottie)
- Motion (presets de easing)
- Animation Composer (presets)
- Easing Wizard (curvas)

## Pitfalls comuns

- **Linear easing em qualquer lugar** — destrói percepção de qualidade
- **Tudo entrando ao mesmo tempo** — sem stagger, sem hierarquia
- **Spring exagerado** — soa cartoon barato em contexto sério
- **Não usar pré-comps** — preview lento, organização ruim
- **Ignorar 60fps** — drops de frame matam o "premium"
- **Animar `width/height` em web** — força reflow, gagueja
- **Esquecer follow-through e overlap** — movimento sai genérico
- **Renderizar antes de revisar ritmo** — render é caro, revisar com RAM Preview primeiro
- **Confundir "muito polido" com "bom"** — às vezes mais sutil é mais premium

## Validação antes de avançar

Checklist antes de ir pra `06-zoom-effects-polish`:

- ✅ Todas as transições do storyboard implementadas
- ✅ Easings consistentes com motion principles
- ✅ Stagger e follow-through aplicados
- ✅ Números/charts animando (se aplicável)
- ✅ 60fps consistente em preview
- ✅ Cliente / Vinicius aprovou a base — antes do polish

## Output esperado

1. Composição After Effects (ou projeto Rive/código) com toda animação base implementada
2. RAM Preview rodando 60fps
3. Export prévio em .mp4 baixa qualidade (1080p, 10mbps) pra revisão de ritmo
4. Documentação de easings/durations usados (alimenta motion guidelines no `08-export-entrega`)

Este output alimenta `06-zoom-effects-polish`.
