---
name: zoom-effects-polish
description: Camada final de polish que separa mockup bom de mockup award-worthy — zoom cinematográfico, parallax avançado em layers, efeitos premium (bloom, glow, grain, chromatic aberration), camera moves simulados (dolly zoom, pan, tilt), particle systems sutis. Use depois da animação avançada estar implementada e antes da edição final. Acionar quando o usuário disser: "polish", "alto nível", "Awwwards", "zoom cinematográfico", "Ken Burns", "dolly zoom", "parallax depth", "bloom", "glow", "grain", "aberração cromática", "câmera virtual", "particles", "polir", "deixar premium", "depth layers".
---

# Zoom, Effects & Polish

A camada que transforma "animação competente" em "mockup que ganha award". A maioria dos mockups falha aqui — não no design, não na animação, mas na ausência de polish cinematográfico.

A regra principal: **menos é mais**. Polish exagerado fica brega. Polish ausente fica plano. Calibrar é o jogo.

## Quando usar

- Animação base de `05-animacao-avancada` aprovada e fluindo a 60fps
- Ainda não foi pra edição final
- Cliente / Vinicius pediu "deixar mais premium" / "elevar o nível"
- Mockup parece "correto" mas não "vivo"

## Workflow

### 1. Diagnóstico — o que está faltando?

Antes de aplicar efeito, identificar o problema. Reproduzir o mockup atual e perguntar:

- Está plano (sem profundidade)? → trabalhar parallax + depth layers
- Está estático no fundo? → adicionar camera moves sutis
- Está limpo demais (artificial)? → adicionar grain + chromatic aberration sutil
- Falta foco? → vinheta + depth-of-field simulada
- Falta drama no momento-chave? → zoom cinematográfico no beat principal
- Está "morto" no hold final? → Ken Burns lento, particle drift, ou luz pulsante

Cada problema tem uma resposta específica — não jogue todos os efeitos em todo lugar.

### 2. Camera moves — princípios

Em mockup, a "câmera" é virtual. Movimentos disponíveis:

**Pan** (translação horizontal)
- Uso: revelar conteúdo lateral, seguir movimento
- Duração: 1.5-3s
- Easing: ease-in-out lento (`cubic-bezier(0.85, 0, 0.15, 1)`)
- Distância: nunca pan de tela inteira inteira; 30-60% da largura é o ideal

**Tilt** (translação vertical)
- Uso: simular scroll, revelar conteúdo abaixo/acima
- Mesma regra de duração e easing
- Cuidado: tilt rápido demais cria desorientação

**Dolly** (zoom in/out cinematográfico, não digital)
- Uso: aproximar do detalhe importante, ou recuar pra mostrar contexto
- Duração: 1.5-3.5s
- Easing: ease-in-out lento
- Escala: 1.0 → 1.3 (sutil) ou 1.0 → 1.8 (dramático). Evitar > 2x (vira distorção).

**Dolly zoom (efeito Vertigo)**
- Câmera recua enquanto zoom aumenta (ou inverso)
- Cria efeito psicológico/dramático
- Uso raro — apenas em momento de virada narrativa
- No AE: animar position Z (camera) + zoom value de forma inversa

**Pull-back / Push-in final**
- Para resolução do mockup (último 1-2s)
- Movimento muito sutil mantém atenção sem cansar

### 3. Parallax avançado por layers

Parallax = elementos em diferentes "profundidades" se movendo em velocidades diferentes.

**Setup correto:**

Dividir a cena em mínimo 3 layers de profundidade:

| Layer | Velocidade | Conteúdo típico |
|---|---|---|
| Foreground | 100% | UI principal, protagonistas |
| Midground | 60-70% | Cards de apoio, elementos decorativos |
| Background | 20-40% | Fundo, gradientes, blur |
| Far background | 10-20% | Glow, ambient light |

Aplicar mesmo movimento de câmera (pan, tilt, dolly) com velocidade proporcional pra cada layer.

**No After Effects:**
- Ativar 3D em todas as layers
- Posicionar em Z diferente (foreground Z=0, mid Z=-200, bg Z=-500, far Z=-1000)
- Adicionar Camera (não animar layers; animar a câmera — parallax acontece automaticamente)

**Em código (web):**
- IntersectionObserver + `transform: translate3d` com fator multiplicador
- Ou GSAP ScrollTrigger
- `will-change: transform` pra otimizar GPU

### 4. Zoom cinematográfico (Ken Burns evoluído)

Ken Burns clássico = pan + zoom lento em imagem estática. Versão evoluída pra mockup:

- Aplicar zoom 1.0 → 1.05/1.1x (sutil) durante 4-8s
- Combinar com translate sutil (5-15px) na direção oposta
- Easing linear ou ease-in-out muito lento
- Uso: cenas longas (hold final, intro estabelecida) que precisam de "vida" sem estar oficialmente animadas

### 5. Efeitos premium — paleta calibrada

**Bloom / Glow**
- Onde: highlights de UI (CTAs principais, ícones de destaque, números importantes)
- Intensidade: muito sutil. Se notou de cara, está exagerado.
- AE: efeito Optical Glares, ou Glow nativo em modo screen
- Radius: 5-15px típico
- Threshold: alto (apenas highlights brilhantes pegam)

**Grain (filme)**
- Onde: vídeo inteiro, layer no topo, blend mode "Overlay" ou "Soft Light", opacidade 5-15%
- Tipo: "filmic" não "digital noise"
- Plugin: AE "Cinema Grain" ou pré-renderizado de filme real (Rgrain, etc)
- Cuidado: grain animado dá "vivacidade"; grain estático fica chato

**Chromatic aberration**
- Onde: bordas da tela (centro limpo), em momentos de tensão/movimento rápido
- AE: efeito "Optics Compensation" ou "Channel Blur" em RGB separados
- Intensidade: 0.5-2px. Mais que isso vira efeito Instagram retrô.
- Animar com a velocidade do movimento (mais movimento = mais aberration)

**Vignette / Depth of field**
- Vignette: oval mask escura nas bordas. Opacidade 10-25%. Suaviza atenção pro centro.
- DOF simulada: blur sutil (radius 2-5px) em layers de background. Foreground sempre nítido.

**Light leaks**
- Sutis, animados, em modo Screen. Gradient orgânico passando pela tela.
- Uso: transições entre cenas, ou hero shots
- Cuidado: vira meme se exagerado (efeito JJ Abrams 2010)

**Color grading**
- Aplicar curve / LUT consistente em todo o vídeo
- Mockup B2B: levemente dessaturado, contraste médio, levemente blue/teal nas sombras
- Mockup B2C jovem: saturação +10%, contraste alto, warm highlights
- Mockup luxury: muito controlado, paleta limitada, blacks profundos
- Plugin: Lumetri Color (no AE), DaVinci Resolve (na edição), ou LUTs customizadas

### 6. Particle systems (com critério)

Particles podem ser maravilhosos ou kitsch dependendo da execução.

**Onde funcionam:**
- Brand reveal (intro): partículas se formando no logo
- Hold final: drift muito lento de pontos de luz
- Transições: explosão sutil no momento de virada
- UI futurista (gaming, AI, crypto): partículas reativas

**Configuração:**
- Quantidade: 20-80 partículas (não centenas)
- Tamanho: variado (importante pra organicidade), 1-5px
- Movimento: lento, com easing irregular (não linear)
- Opacidade: variada, fade in/out individual
- Plugin AE: Particular (Trapcode), CC Particle World (nativo), ou "Stardust"

**Quando não usar:**
- Em produto sério (advocacia, health, finance enterprise)
- Sem propósito narrativo
- Como "decoração de canto" — fica brega

### 7. Reactive elements (raro mas premium)

Elementos que reagem a outros elementos:
- Sombras que mudam intensidade conforme proximidade do "sol" virtual
- Reflexos em vidro/metal que seguem objetos
- Highlights que pulsam em ritmo com áudio
- Cards que "sentem" a câmera passando

Implementação: expressões no AE (linkar propriedades), ou código (Framer Motion + listeners).

Custoso de implementar; usar em 1-2 momentos-chave do mockup, não em tudo.

### 8. Haptic feedback simulation

Mockup mobile: simular feedback tátil visualmente.
- Pressed state com micro-shake (translate 1-2px) por 80-100ms
- Sutil bounce no toque
- Pulse no botão pressionado

Não exagere — em mockup, qualquer pulse vira "Sou um Botão!".

### 9. Validação A/B de polish

Antes/depois é a única forma de validar polish. Renderize 2 versões (sem polish e com) e compare:

- Está mais premium ou só mais carregado?
- Os efeitos servem narrativa ou são decoração?
- Algo está distraindo do protagonista?
- Algum efeito está "se mostrando" (ruim) ou "servindo invisível" (bom)?

Quase sempre o ajuste final é **reduzir** intensidade — não adicionar mais.

## Ferramentas

**Suites principais:**
- After Effects (universo de plugins de polish)
- DaVinci Resolve (color grading profissional, alguns efeitos)
- Cinema 4D Lite (3D quando necessário)

**Plugins After Effects essenciais:**
- Trapcode Particular (particles)
- Trapcode Form (geometric particles)
- Optical Flares (glares cinematográficos)
- Magic Bullet Looks (color + film effects)
- Deep Glow (melhor que glow nativo)
- VC Color Vibrance
- Boris FX Sapphire (suite completa, caro)
- AEScripts "Motion Tools 2" (workflow)

**Alternativas em código:**
- GSAP + Three.js (parallax 3D em web)
- shadertoy / GLSL (efeitos via shader)
- regl, OGL (libs WebGL menores)

## Pitfalls comuns

- **Polish exagerado** — vira videoclipe brega. Reduzir sempre.
- **Polish em tudo** — perde foco. Concentrar em momentos-chave.
- **Vertigo dolly em cena qualquer** — uso é dramático, não decorativo.
- **Grain estático** — chato. Sempre animado em loop curto.
- **Glow em todo elemento** — perde hierarquia. Só nos protagonistas.
- **Particles cobrindo o conteúdo** — quebra leitura.
- **Color grading inconsistente** — cenas com paletas diferentes matam coesão.
- **Pan/tilt rápido demais** — desorienta.
- **Camera moves sem propósito** — câmera deve "observar com intenção", não "tremer pra parecer dinâmico".
- **Esquecer de comparar antes/depois** — risco de exagero.

## Validação antes de avançar

Checklist antes de ir pra `07-edicao-video-final`:

- ✅ Camera moves (pan, tilt, dolly) aplicados nos beats certos
- ✅ Parallax em pelo menos 3 layers de profundidade
- ✅ Color grading consistente em todo o material
- ✅ Grain sutil aplicado (5-15% opacity)
- ✅ Glow apenas em elementos protagonistas
- ✅ Particles (se houver) servem narrativa
- ✅ Comparação antes/depois feita — polish está calibrado, não exagerado
- ✅ 60fps mantido (efeitos não derrubaram performance)

## Output esperado

1. Composição After Effects com toda camada de polish aplicada
2. Render prévio (1080p, 20mbps) pra validar com cliente / Vinicius
3. Documentação de LUTs / efeitos usados (alimenta `08-export-entrega`)

Este output alimenta `07-edicao-video-final`.
