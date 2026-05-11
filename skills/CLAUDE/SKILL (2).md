---
name: wireframe-low-fidelity
description: Criação de wireframes e low-fidelity com motion já planejado desde o início — user flows animados, identificação de oportunidades de zoom/parallax, mapeamento de timing antes de qualquer pixel de UI ser desenhado. Use depois de research-discovery e antes de UI design high-fidelity. Acionar quando o usuário disser: "wireframe", "estrutura", "fluxo do mockup", "como vai ser a sequência", "esqueleto", "rascunho", "user flow", "storyboard do mockup", "qual a ordem das cenas", "planejamento de cena".
---

# Wireframe & Low-Fidelity (com motion-first thinking)

Diferença crítica de wireframe tradicional: aqui você projeta o **esqueleto + o ritmo**. Pular essa etapa e ir direto pra UI hi-fi sempre dá retrabalho — quando você tenta animar, descobre que a hierarquia visual não permite o motion que você queria.

## Quando usar

- Após `01-research-discovery`, com motion principles já definidos
- Quando precisa decidir a ordem de cenas de um mockup-vídeo
- Pra mapear oportunidades de zoom/parallax antes de gastar tempo em UI
- Quando uma animação "não está funcionando" e você precisa voltar ao esqueleto

## Workflow

### 1. Storyboard de cenas (não wireframe de tela)

Mockup animado não é uma tela — é uma sequência. Comece desenhando 6-12 frames-chave em retângulos brutos:

- Cada frame representa um beat narrativo (não um segundo)
- Use formas primitivas: retângulo cinza claro, retângulo escuro, círculo, linha
- Anote duração estimada e tipo de transição abaixo de cada frame

Exemplo de notação:
```
Frame 3 → Frame 4
Transição: zoom in 1.0x → 1.4x no card central
Duração: 800ms
Easing: expo-out
Outros elementos: header faz parallax suave (translate Y -20px)
```

### 2. Mapeamento de hierarquia de movimento

Em cada frame, marcar:
- **Protagonista** (1 elemento): o que comanda atenção
- **Supporting** (1-3 elementos): reagem ao protagonista (parallax, fade, escala sutil)
- **Background** (resto): estático ou movimento muito sutil (drift lento)

Regra de ouro: nunca mais de 1 protagonista por frame. Se você tem 2 elementos competindo, o frame está errado e precisa ser dividido em 2 frames.

### 3. Identificação de oportunidades de zoom e parallax

Não use zoom/parallax porque sim. Eles são caros (atenção do espectador, performance, complexidade). Use quando:

**Zoom é justificado quando:**
- Há um detalhe importante a revelar (componente específico, número, ícone)
- Há transição entre escalas (overview → detalhe, ou inverso)
- O frame final é "quieto" e precisa de movimento sutil pra não morrer (Ken Burns)

**Parallax é justificado quando:**
- Há mais de 2 layers semânticas (foreground / midground / background)
- O scroll é elemento narrativo (em mockup-vídeo, scroll simulado)
- Precisa criar sensação de profundidade em interface 2D

**Não use:**
- Zoom em todo frame (vira videoclipe)
- Parallax mouse-driven em landing genérica (overused desde 2018)

Marcar no storyboard com ícone: 🔍 zoom, ⫽ parallax. Limitar a 30-40% dos frames.

### 4. Planejamento de timing total

Calcular budget:
- Mockup Instagram (15s) = 15-20 frames-chave, ~750ms-1s por cena
- Mockup landing demo (30s) = 25-35 frames-chave, ~1-1.5s por cena
- Mockup case completo (60-90s) = narrativa estendida, com 2-3 atos

Reservar:
- 1.5-2s no início (estabelecimento)
- 1-1.5s no final (resolução / hold)
- Resto pra demonstração

### 5. User flow paralelo (se aplicável)

Se o mockup demonstra interação real (não só showcase), produzir também user flow tradicional ao lado do storyboard:
- Tela A → ação → Tela B
- Marcar quais transições aparecem no mockup (você não vai mostrar todas)

### 6. Validação antes de avançar

Antes de ir pra `03-ui-design-high-fidelity`, checar:

- ✅ Cada frame tem 1 protagonista claro?
- ✅ As transições entre frames têm easing/duração definidos?
- ✅ O ritmo respeita a regra dos 3 batimentos (ver `00-motion-design-fundamentals`)?
- ✅ Zoom/parallax estão limitados aos lugares onde fazem sentido narrativo?
- ✅ Cliente/Vinicius aprovou o storyboard low-fi?

Sem isso, voltar.

## Ferramentas

**Wireframe e storyboard:**
- Figma + FigJam (preferencial — integra com fases seguintes)
- Whimsical (mais rápido pra fluxos)
- Excalidraw (rápido, hand-drawn, bom pra primeiras sketches)
- Penpot (open source)
- Lápis e papel (sério — sketch rápido antes do digital sempre vale)

**Validação de motion no low-fi:**
- Figma com Smart Animate em frames básicos (já dá pra ver se o ritmo funciona com retângulos cinzas)
- Storyboard.studio (se quiser mais cinematográfico)

## Padrão de notação

Pra cada transição entre frames, usar este padrão consistente:

```
[Frame N] → [Frame N+1]
TRANSIÇÃO: [tipo — fade/scale/translate/morph/zoom/cut]
DURAÇÃO: [ms]
EASING: [nome ou bezier values]
PROTAGONISTA: [elemento que carrega o movimento]
SUPPORTING: [elementos que reagem]
NOTAS: [qualquer detalhe extra — sound, particle, hold]
```

Esta notação alimenta diretamente as fases de animação avançada.

## Pitfalls comuns

- **Pular esta fase** porque "já tô vendo na cabeça" — quase sempre dá retrabalho
- **Detalhar UI antes de validar fluxo** — desperdício se o storyboard precisa mudar
- **Frames demais** — se você tem 40 frames-chave pra 30s, é cena demais; cada uma vai ter 750ms e ninguém vai conseguir ler
- **Frames de menos** — se você tem 5 frames pra 30s, vai ser arrastado
- **Esquecer de marcar protagonista** — vai parecer caótico na execução

## Output esperado

1. Storyboard completo (Figma/FigJam) com todos os frames-chave
2. Notação de transição entre cada frame
3. Mapa de hierarquia de movimento (protagonista por cena)
4. Identificação de zooms e parallaxes (limitados)
5. Budget de timing total e por cena
6. User flow paralelo se aplicável
7. Aprovação do cliente / Vinicius antes de avançar

Este output alimenta diretamente `03-ui-design-high-fidelity`.
