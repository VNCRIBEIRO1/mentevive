# Figma Protótipo Interativo - MenteVive Portal Journey
## Guia de Construção Screen-by-Screen + Smart Animate Flows

---

## PARTE 1: SETUP INICIAL NO FIGMA

### 1.1 Criar Novo Arquivo

1. Abrir **Figma** → **New file** → nomear `MenteVive-Portal-Mockup-Video`
2. **Frame principal**: 1920x1080 (16:9 landscape)
3. Ativar **Figma Grid**: View → Show grid (4px grid, espaçamento 4px)

### 1.2 Criar Página de Componentes

1. Criar página chamada `_Components` (underscore pra ficar no topo)
2. Essa página terá TODOS os componentes reutilizáveis:
   - Buttons (primary, secondary, disabled)
   - Cards (stat card, session card, appointment card)
   - Form fields (text input, textarea, dropdown)
   - Badges (status badges: pending/confirmed/completed)
   - Navbars, headers, loaders, etc

### 1.3 Página Principal de Protótipo

Criar página chamada `Mockup-Video` onde montaremos:
- Frame por frame do storyboard
- Cada frame nomeado exatamente como no brief (ex: "1.1-Login", "1.2-Dashboard", etc)
- Frames em sequência na vertical ou em grid

---

## PARTE 2: DESIGN SYSTEM (Componentes Base)

### 2.1 Typography

```
Family 1: Fraunces (headings)
- H1: 48px, weight 700, line-height 1.2, letter-spacing -0.5px
- H2: 36px, weight 600, line-height 1.3
- H3: 24px, weight 600, line-height 1.4
- Subtitle: 18px, weight 500, line-height 1.4

Family 2: Inter (body text)
- Body L: 16px, weight 400, line-height 1.6
- Body M: 14px, weight 400, line-height 1.5
- Body S: 12px, weight 400, line-height 1.4
- Label: 12px, weight 600, line-height 1.3
```

### 2.2 Color Palette (Criar no Figma → Assets → Colors)

```
Primary:
- Gold/Warm: #D4A574 (Main brand color)
- Gold Light: #E8D4BA (Lighter tint for hover/bg)
- Gold Dark: #B8956E (Darker shade for text)

Accent:
- Pink: #E8A0BF (soft)
- Teal: #0f766e (calm/deep)
- Sage: #e6f0eb (soft green)

Neutrals:
- Background: #FFF5EE (cream/seashell)
- White: #FFFFFF
- Gray Light: #F5F5F5
- Gray Med: #D9D9D9
- Gray Dark: #666666
- Text Dark: #3D2B1F (dark brown)

Status:
- Success Green: #10b981
- Pending Amber: #F59E0B
- Error Red: #EF4444
- Info Blue: #3B82F6
```

### 2.3 Componentes Principais

#### Button Component (Primary)

```
Name: Button/Primary
States:
1. Default
   - Size: 200px × 50px (or auto width)
   - Background: #D4A574
   - Text: white, Inter 16px bold
   - Border radius: 8px
   - Shadow: 0 2px 8px rgba(0,0,0,0.1)

2. Hover
   - Background: #B8956E (darker)
   - Scale: 1.05
   - Shadow: 0 4px 12px rgba(0,0,0,0.15)

3. Pressed/Active
   - Scale: 0.98
   - Shadow: 0 1px 4px rgba(0,0,0,0.1)

4. Disabled
   - Background: #D9D9D9
   - Text: #999999
   - Cursor: not-allowed
```

Create in Figma:
- Rectangle 200×50, fill #D4A574, radius 8
- Text component inside "Label" centered
- Add shadow
- Create component: `Button/Primary`
- Create variants for Default, Hover, Active, Disabled

#### Button Component (Secondary)

```
Name: Button/Secondary
States:
1. Default
   - Background: transparent / white
   - Border: 1px solid #D9D9D9
   - Text: #3D2B1F, Inter 16px
   - Border radius: 8px

2. Hover
   - Border: 1px solid #D4A574
   - Background: #FFF5EE
   - Scale: 1.05
```

#### Stat Card

```
Name: Card/Stat
Dimensions: 300px × 140px
Layout:
  - Left side (40px): Icon area (48px × 48px)
  - Right side: Text area
    - Title: 14px Inter, #999999
    - Value: 24px Fraunces bold, #3D2B1F
Background: white (#FFFFFF)
Border: none
Shadow: 0 2px 8px rgba(0,0,0,0.08)
Border-left: 4px solid #D4A574
Padding: 16px
Border radius: 8px
```

#### Status Badge

```
Name: Badge/Status
Variants:
1. Pending (yellow)
   - Background: #FEF3C7
   - Text: #92400E, 12px Inter bold
   - Padding: 4px 12px
   - Border radius: 4px

2. Confirmed (green)
   - Background: #D1FAE5
   - Text: #065F46, 12px Inter bold

3. Completed (blue)
   - Background: #DBEAFE
   - Text: #1E40AF, 12px Inter bold

4. Cancelled (red)
   - Background: #FEE2E2
   - Text: #7F1D1D, 12px Inter bold
```

#### Form Field

```
Name: Input/Text
Dimensions: 100% width × 48px
States:
1. Default
   - Border: 1px solid #D9D9D9
   - Background: white
   - Border radius: 6px
   - Padding: 12px 16px
   - Text: #3D2B1F, Inter 16px

2. Focused
   - Border: 2px solid #D4A574
   - Shadow: 0 0 0 3px rgba(212,165,116,0.1)

3. Filled
   - Same as default, with text visible
   - Placeholder text: #999999
```

---

## PARTE 3: SCREENS - BEAT 1 (0-40s)

### 3.1 Screen: "1.1-Login"

**Canvas**: 1920×1080
**Background**: #1a1a1a (dark)

**Layout**:
```
┌─────────────────────────────────────────┐
│                                         │
│         [MenteVive Logo]                │
│                                         │
│         ┌──────────────────────┐       │
│         │ Email                │       │
│         │ [_____________]      │       │
│         │ Password             │       │
│         │ [_____________]      │       │
│         │ [  Entrar  ]         │       │
│         └──────────────────────┘       │
│                                         │
└─────────────────────────────────────────┘
```

**Components**:
1. Rectangle 1920×1080, fill #1a1a1a
2. Logo image/text (center, ~200×60px)
   - MenteVive text: Fraunces 48px, color #D4A574
3. Form card (center, ~400×320px)
   - Background: white
   - Border radius: 12px
   - Shadow: 0 8px 32px rgba(0,0,0,0.2)
   - Padding: 40px
   - Title: "Entrar" (Fraunces 32px)
   - Email input (use Input/Text component)
   - Password input (use Input/Text component)
   - Button/Primary "Entrar"

**Figma Setup**:
- Frame 1920×1080 named `1.1-Login`
- Position on canvas

---

### 3.2 Screen: "1.2-Dashboard-Hero"

**Canvas**: 1920×1080
**Background**: #FFF5EE (cream)

**Top Section - Hero Banner** (1920×240px):
```
Background: Subtle gradient or solid #E8D4BA (light gold)
Content:
├─ "Olá, Marina 🌿" (Fraunces 48px, #3D2B1F, left 40px, top 30px)
└─ Subtitle (Inter 16px, #666, left 40px, top 90px)
  "Seu espaço seguro. Acompanhe sessões, evolução e tudo..."
```

**Stats Section** (below hero, 1920×180px):
```
3 cards in row layout (300px width each, 120px gap)
- Card 1 (left 40px): "Próxima sessão" / "15 de maio • 15:30"
- Card 2 (center): "Sessões realizadas" / "3 completadas"
- Card 3 (right): "Última atualização" / "Feedback Bea • 2h"

Use: Card/Stat component (3 instances)
```

**Quick Actions Section** (below stats, 1920×100px):
```
Left 40px, top ~480px
4 buttons inline:
- Button/Primary: "+ Agendar Sessão"
- Button/Secondary: "📋 Ver Minhas Sessões"
- Button/Secondary: "💳 Pagamentos"
- Button/Secondary: "👤 Perfil"
```

**Figma Setup**:
- Frame 1920×1080 named `1.2-Dashboard-Hero`
- Add shapes/components per layout acima
- Group logically (Hero, Stats, Actions)

---

### 3.3 Screen: "1.3-Dashboard-Quick-Actions-Hover"

**Identical to 1.2**, but:
- Button "Agendar Sessão" is in **Hover state**
  - Scale applied visually (~1.05)
  - Slight shadow increase
  - Background slightly darker

**Figma Setup**:
- Duplicate frame `1.2-Dashboard-Hero` → rename to `1.3-Dashboard-Quick-Actions-Hover`
- Select the "Agendar Sessão" button instance
- Change to Hover variant (or manually adjust scale/shadow)
- Use Smart Animate to transition from 1.2 → 1.3

---

### 3.4 Screen: "1.4-Click-Transition-Start"

**Same as 1.3** (button still hovered)

**Purpose**: This frame will show the beginning of the page fade-out animation. In Figma prototype, we'll use this as a checkpoint before the navigation.

---

## PARTE 4: SCREENS - BEAT 2 (14-84s)

### 4.1 Screen: "2.1-Agendar-Page-Header"

**Canvas**: 1920×1080
**Background**: #FFF5EE

**Header Section** (top 240px):
```
Back arrow + title:
├─ "←" (chevron left, 24px, #999, left 40px, top 20px)
└─ "Agendar uma sessão" (Fraunces 36px, #3D2B1F, left 100px, top 20px)

Subtitle (Inter 16px, #666, left 100px, top 70px):
"Escolha a data e horário da sua próxima sessão"
```

**Calendar Grid** (below header, start 240px):
```
Month/Year nav:
├─ "← Maio 2026 →" (center top)

Calendar:
   Dom Seg Ter Qua Qui Sex Sab
    1   2   3   4   5   6   7
    8   9  10  11  12  13  14
   15  16  17  18  19  20  21  ← 15 is available (highlight)
   22  23  24  25  26  27  28
   29  30  31

Days 12-14: grayed (disabled)
Day 15: normal color, ready to click
Other days: normal
```

**Figma Setup**:
- Frame 1920×1080 named `2.1-Agendar-Page-Header`
- Rectangle for background
- Text layers for header/subtitle
- Build calendar using grid of buttons/texts
  - Create Button/Date component (24px × 24px, variant for disabled/enabled)
  - Arrange in 7-column grid
  - Style Day 15 differently (or use hover variant visually)

---

### 4.2 Screen: "2.2-Calendar-Day-15-Hover"

**Same as 2.1**, but:
- Day 15 cell is highlighted (larger, border, background color)
- Show "Sessões disponíveis" tooltip below day 15

**Figma Smart Animate**:
- Transition 2.1 → 2.2 with Smart Animate
- Day 15 scales up, color changes
- Tooltip fades in

---

### 4.3 Screen: "2.3-Time-Picker-Appears"

**Same as 2.2**, but PLUS:
- **Time picker section appears below calendar**

```
┌────────────────────────────────────┐
│ Escolha um horário para 15 de maio  │
├────────────────────────────────────┤
│ ☐ 14:00 (grayed)                  │
│ ☐ 14:30                            │
│ ☐ 15:00                            │
│ ☐ 15:30 ← will be selected        │
│ ☐ 16:00                            │
│ ☒ 16:30 (grayed/disabled)         │
└────────────────────────────────────┘
```

**Figma Setup**:
- Add time picker card below calendar
- Use Button/Time component (similar to Button/Date)
- 14:00 and 16:30 disabled state
- Others enabled

---

### 4.4 Screen: "2.4-Time-15-30-Selected"

**Same as 2.3**, but:
- Time 15:30 cell is highlighted/selected
- Border gold, background light amber
- Checkmark visible in cell
- "Próximo" button slides in below

**Figma Setup**:
- Change 15:30 button to selected state (use component variant or manually adjust)
- Add "Próximo" button (Button/Primary) below with opacity 0 initially (we'll use Smart Animate to fade it in from the prototype flow)

---

### 4.5 Screen: "2.5-Confirmation-Card"

**Canvas**: 1920×1080
**Background**: #FFF5EE

**Content** (centered on page):
```
┌──────────────────────────────────────┐
│ Confirme sua sessão                  │
├──────────────────────────────────────┤
│ 📅 Data: 15 de maio de 2026          │
│ 🕐 Hora: 15:30 - 16:30               │
│ 📱 Modalidade: Online (Vídeo Jitsi)  │
├──────────────────────────────────────┤
│ Notas (opcional):                    │
│ [____________________________]        │
│ [____________________________]        │
│ [____________________________]        │
├──────────────────────────────────────┤
│ [Confirmar e Pagar]                  │
└──────────────────────────────────────┘
```

**Figma Setup**:
- Card (max 600px width, centered)
- Background: white
- Border-left: 4px gold
- Title: "Confirme sua sessão" (Fraunces 24px)
- 3 info rows (each: icon 24px + text)
- Textarea (use Input/Textarea component)
- Button/Primary "Confirmar e Pagar"

---

### 4.6 Screen: "2.6-Stripe-Checkout"

**Canvas**: 1920×1080
**Background**: #FFF5EE (slightly dimmed, overlay opacity 0.3)

**Modal/Card** (centered, 500px width):
```
┌────────────────────────────┐
│ Complete o pagamento       │
├────────────────────────────┤
│ Resumo do pagamento:       │
│ Sessão terapêutica R$ 120  │
│ Impostos (0%)      R$ 0    │
│ ────────────────────────   │
│ Total             R$ 120   │ ← Bold, gold
├────────────────────────────┤
│ Forma de pagamento:        │
│ ◉ Cartão de crédito        │
│ ○ PIX                      │
├────────────────────────────┤
│ Número do cartão:          │
│ [____________________]     │
│ MM/AA       CVC            │
│ [_____]     [____]         │
│ Nome:                      │
│ [____________________]     │
│ ☐ Lembrar este cartão      │
├────────────────────────────┤
│ [    Pagar agora    ]       │
└────────────────────────────┘
```

**Figma Setup**:
- Rectangle 1920×1080, fill black, opacity 0.3 (overlay)
- Modal card (centered, 500px × 600px)
- White background, shadow
- Use Input/Text components for form fields
- Radio buttons for payment method
- Button/Primary for "Pagar agora"

---

### 4.7 Screen: "2.7-Payment-Processing"

**Same as 2.6**, but:
- Button text fades
- Spinner/loader appears in button
- 3 animated dots

**Figma Setup**:
- Duplicate 2.6 → rename to 2.7
- Delete button text
- Add animated loader:
  - Create a component: "Loader/Spinner" (3 circles arranged horizontally)
  - Inside button area
  - In prototype, we can't animate truly, but visually show the dots

---

### 4.8 Screen: "2.8-Payment-Success"

**Same modal area**, but:
- Spinner disappears
- Checkmark icon appears (scale 0, bounce to 1 in animation)
- Success message: "Pagamento confirmado!"
- Details: "Sessão marcada para 15 de maio às 15:30"
- Button changes to "Próximo"

**Figma Setup**:
- Duplicate 2.7 → rename to 2.8
- Replace spinner with checkmark (green icon, 64px)
- Update text content
- Update button text

---

### 4.9 Screen: "2.9-Time-Cut-Day-Of-Session"

**Canvas**: 1920×1080
**Background**: #FFF5EE, with 50% opacity overlay

**Centered Text**:
```
"15 de maio • 15:15"
(Font: Fraunces 72px, #3D2B1F)

"Faltam 15 minutos para sua sessão"
(Font: Inter 20px, #666, below)
```

**Figma Setup**:
- Frame 1920×1080 named `2.9-Time-Cut-Day-Of-Session`
- Rectangle background
- Centered text layers
- This frame is a "pause" moment before moving to Beat 3

---

## PARTE 5: SCREENS - BEAT 3 (67-165s) — [ABBREVIATED, SAME PATTERN]

### 5.1 Screen: "3.1-Dashboard-Session-Ready"

**Canvas**: 1920×1080
**Background**: #FFF5EE

**Top Banner** (hot alert style):
```
Background: #FCB900 (warm amber)
Text: "Sua sessão começa em 15 minutos! 🎯" (white, bold)
```

**Session Card** (center):
```
Status badge: "Confirmada" (green)
Title: "PRÓXIMA SESSÃO"
Time: "15:30 - 15 de maio"
Therapist: "Com Bea"
Button: "Entrar na sala de espera" (Button/Primary)
```

**Figma Setup**:
- Frame 1920×1080 named `3.1-Dashboard-Session-Ready`
- Alert banner at top
- Session card (use Card/Appointment component)
- Large CTA button

---

### 5.2 Screen: "3.2-Waiting-Room"

**Canvas**: 1920×1080
**Background**: #FFF5EE

**Layout**:
```
┌──────────────────────────────┐
│ Sala de espera               │
├──────────────────────────────┤
│ A psicóloga está chegando... │
│                              │
│ ┌────────────────────────┐  │
│ │                        │  │
│ │   Video Preview Box    │  │
│ │   (camera placeholder) │  │
│ │                        │  │
│ └────────────────────────┘  │
│ 🟢 Seu vídeo está ativo      │
│                              │
│ [Preencher triagem]          │
│ [Aguardar]                   │
└──────────────────────────────┘
```

**Figma Setup**:
- Frame 1920×1080 named `3.2-Waiting-Room`
- Title, status message
- Video box (rectangle, border glow)
- Buttons

---

### 5.3 Screen: "3.3-Triagem-Step-1-Mood"

**Canvas**: 1920×1080
**Background**: #FFF5EE

**Card Layout** (center):
```
┌────────────────────────────────┐
│ Como você está se sentindo?    │
├────────────────────────────────┤
│ 😢     😐     🙂     😊     🤩  │
│ Triste Neutro Bem Muitobem Ótim│
├────────────────────────────────┤
│ [Próximo]                      │
└────────────────────────────────┘
```

**Figma Setup**:
- Frame 1920×1080 named `3.3-Triagem-Step-1-Mood`
- Card (600px × 400px, centered)
- Title
- 5 emoji buttons (120px × 120px each, in row)
- "Próximo" button

---

### 5.4 Screen: "3.4-Triagem-Step-1-Selected"

**Same as 3.3**, but:
- Emoji 😊 is highlighted (larger, border, background)

**Figma Setup**:
- Duplicate 3.3 → rename to 3.4
- Scale/style the 😊 emoji button to show selected state

---

### 5.5 Screen: "3.5-Triagem-Step-2-Sleep"

**Similar to 3.3**, but question is:
```
"Como foi sua qualidade de sono?"

3 buttons: "Ruim" | "Normal" ← selected | "Ótimo"
```

**Figma Setup**:
- Frame named `3.5-Triagem-Step-2-Sleep`
- Same card layout
- 3 buttons instead of 5

---

### 5.6 Screen: "3.6-Triagem-Step-3-Anxiety"

```
"Qual seu nível de ansiedade?"

Visual scale: 5 bars (Low → High)
Level 3 (Moderado) ← selected/highlighted
```

**Figma Setup**:
- Frame named `3.6-Triagem-Step-3-Anxiety`
- Title
- 5 vertical bars (increasing height: 20%, 40%, 60%, 80%, 100%)
- Bar 3 highlighted

---

### 5.7 Screen: "3.7-Triagem-Summary"

```
┌────────────────────────────────┐
│ Revisão da triagem             │
├────────────────────────────────┤
│ ✓ Mood: Muito bem              │
│ ✓ Sleep: Normal                │
│ ✓ Anxiety: Moderado            │
├────────────────────────────────┤
│ [Enviar e começar sessão]      │
└────────────────────────────────┘
```

**Figma Setup**:
- Frame named `3.7-Triagem-Summary`
- Card with checkmarks
- CTA button

---

### 5.8 Screen: "3.8-Video-Call"

**Canvas**: 1920×1080
**Background**: #1a1a1a (dark, like real video call)

**Layout**:
```
┌─────────────────────────────────┐
│ Sessão com Bea     00:05:12     │
├─────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐
│ │ Patient      │ │ Therapist    │
│ │ Video        │ │ Video        │
│ │              │ │              │
│ └──────────────┘ └──────────────┘
├─────────────────────────────────┤
│ [🔇] [📷] [📞 End call]         │
└─────────────────────────────────┘
```

**Figma Setup**:
- Frame 1920×1080 named `3.8-Video-Call`
- Dark background
- Header with title + timer
- 2 video boxes (side by side, centered)
- Control buttons at bottom

---

### 5.9 Screen: "3.9-Session-Ended-Time-Cut"

```
"Sessão finalizada"
(large, center)

"15 de maio • 15:30-16:30"
(below, smaller)
```

**Figma Setup**:
- Frame 1920×1080 named `3.9-Session-Ended-Time-Cut`
- Black/gray background
- Centered text

---

### 5.10 Screen: "3.10-Feedback-Form"

**Canvas**: 1920×1080
**Background**: #FFF5EE

**Card Layout** (center, ~700px width):
```
┌──────────────────────────────────┐
│ Como foi sua sessão?             │
│ Sua percepção nos ajuda sempre   │
├──────────────────────────────────┤
│ Qual nota você dá?               │
│ ⭐ ⭐ ⭐ ⭐ ☆ (4 stars selected) │
├──────────────────────────────────┤
│ Deixe seu feedback (opcional)    │
│ [__________________________]     │
│ [__________________________]     │
│ [__________________________]     │
├──────────────────────────────────┤
│ [Enviar feedback]                │
└──────────────────────────────────┘
```

**Figma Setup**:
- Frame named `3.10-Feedback-Form`
- Card (white, centered)
- Star rating (5 stars, 4 filled/highlighted)
- Textarea
- Button/Primary

---

### 5.11 Screen: "3.11-Feedback-Submitted"

**Same as 3.10**, but:
- Form elements fade/hide
- Checkmark icon appears (green, large)
- Message: "Feedback enviado! ✅"
- "Bea respondeu ao seu feedback" notification banner (top)

**Figma Setup**:
- Duplicate 3.10 → rename to 3.11
- Hide form elements (opacity 0)
- Add success notification at top
- Add checkmark icon

---

### 5.12 Screen: "3.12-Therapist-Response-Modal"

**Canvas**: 1920×1080
**Background**: #FFF5EE (with overlay)

**Modal** (centered, ~600px width):
```
┌────────────────────────────────┐
│ Feedback da psicóloga          │
├────────────────────────────────┤
│ 👤 Bea                         │
├────────────────────────────────┤
│ "Marina, foi ótimo trabalhar   │
│  com você hoje! Notei sua      │
│  disposição em aplicar as      │
│  técnicas. Continue com os     │
│  exercícios de respiração 2x   │
│  ao dia. Próxima sessão:       │
│  retomamos as reflexões sobre  │
│  ansiedade social. Forte       │
│  abraço! 💚"                   │
├────────────────────────────────┤
│ [Fechar]                       │
└────────────────────────────────┘
```

**Figma Setup**:
- Frame named `3.12-Therapist-Response-Modal`
- Overlay rectangle (dark, semi-transparent)
- Modal card (centered)
- Avatar + name
- Feedback text (Inter, left-aligned)
- Close button

---

### 5.13 Screen: "3.13-Minhas-Sessoes-Tab"

**Canvas**: 1920×1080
**Background**: #FFF5EE

**Layout**:
```
Header: "Minhas Sessões"

Filter tabs (horizontal):
[Todas] [Pendentes] [Confirmadas] [Realizadas ✓]

Sessions list (vertical, scrollable visual):
┌─────────────────────────────────┐
│ 15 maio • 15:30-16:30           │
│ Status: ✅ Realizada            │
│ Psicóloga: Bea                  │
│ Nota: "Ótima evolução observada"│
│ ⭐⭐⭐⭐ "Muito bom! Me sinto..." │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 8 maio • 14:00-15:00            │
│ Status: ✅ Realizada            │
│ Psicóloga: Bea                  │
│ ...                             │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 1 maio • 16:00-17:00            │
│ Status: ✅ Realizada            │
│ Psicóloga: Bea                  │
│ ...                             │
└─────────────────────────────────┘
```

**Figma Setup**:
- Frame named `3.13-Minhas-Sessoes-Tab`
- Header
- Filter tabs (4 buttons, horizontal, 1 active)
- Sessions list (use Card/Session component, repeated 3× with stagger)

---

### 5.14 Screen: "3.14-Dashboard-Final"

**Same as 1.2-Dashboard-Hero**, but with updated stats:
```
"Marina, sua jornada terapêutica está evoluindo! 🌿"
Stat cards updated:
- "Sessões realizadas: 3"
- "Próxima: 22 de maio às 14:00"
- "Último feedback: Bea respondeu"
```

**Figma Setup**:
- Frame named `3.14-Dashboard-Final`
- Update text values in hero banner and stat cards

---

### 5.15 Screen: "3.15-Black-Screen-Hold"

**Canvas**: 1920×1080
**Background**: #000000

**Purpose**: Hold/transition frame before branding

**Figma Setup**:
- Frame named `3.15-Black-Screen-Hold`
- Just black rectangle

---

### 5.16 Screen: "3.16-Branding-Final"

**Canvas**: 1920×1080
**Background**: #000000

**Content** (centered):
```
"MenteVive"
(Fraunces 64px, #D4A574, bold)

"Simplifique a gestão, humanize o cuidado"
(Inter 18px, #FFFFFF, below)
```

**Figma Setup**:
- Frame named `3.16-Branding-Final`
- Centered text layers

---

## PARTE 6: CONFIGURAR FLOWS E SMART ANIMATE

### 6.1 Criar Prototype Flows

**No Figma Prototype Tab**:

1. **From 1.2-Dashboard-Hero, click "Agendar Sessão" button**:
   - Trigger: Tap
   - Destination: 2.1-Agendar-Page-Header
   - Transition: Smart Animate (300ms, ease-out)
   - Direction: None

2. **From 1.3-Dashboard-Quick-Actions-Hover (hover state)**:
   - Auto transition to 1.4-Click-Transition-Start after 2s
   - (Or manually trigger on next click)

3. **From 2.1-Calendar** → **2.2-Day-15-Hover**:
   - Trigger: Hover on Day 15
   - Transition: Smart Animate (150ms)

4. **From 2.2** → **2.3-Time-Picker-Appears**:
   - Trigger: Tap on Day 15
   - Transition: Smart Animate (400ms, expo-out)

5. **From 2.3** → **2.4-Time-15-30-Selected**:
   - Trigger: Tap on 15:30
   - Transition: Smart Animate (300ms)

6. **From 2.4** → **2.5-Confirmation-Card**:
   - Trigger: Tap on "Próximo"
   - Transition: Smart Animate (300ms crossfade)

7. **From 2.5** → **2.6-Stripe-Checkout**:
   - Trigger: Tap on "Confirmar e Pagar"
   - Transition: Smart Animate (400ms)

8. **From 2.6** → **2.7-Payment-Processing**:
   - Trigger: Tap on "Pagar agora"
   - Transition: Smart Animate (200ms)
   - Auto-transition to 2.8 after 3s

9. **From 2.7** → **2.8-Payment-Success** (auto-transition):
   - Delay: 3000ms
   - Transition: Smart Animate (300ms)

10. **From 2.8** → **2.9-Time-Cut-Day-Of-Session**:
    - Trigger: Tap on "Próximo"
    - Transition: Crossfade (2s)

11. **From 2.9** → **3.1-Dashboard-Session-Ready**:
    - Auto-transition after 2s
    - Transition: Fade (300ms)

12. **From 3.1** → **3.2-Waiting-Room**:
    - Trigger: Tap on "Entrar na sala de espera"
    - Transition: Smart Animate (300ms)

13. **From 3.2** → **3.3-Triagem-Step-1-Mood**:
    - Trigger: Tap on "Preencher triagem"
    - Transition: Smart Animate (400ms)

14. **From 3.3** → **3.4-Triagem-Step-1-Selected**:
    - Trigger: Tap on 😊 emoji
    - Transition: Smart Animate (150ms)

15. **From 3.4** → **3.5-Triagem-Step-2-Sleep**:
    - Trigger: Tap on "Próximo"
    - Transition: Smart Animate (300ms crossfade)

16. **From 3.5 (Normal selected)** → **3.6-Triagem-Step-3-Anxiety**:
    - Trigger: Tap on "Próximo"
    - Transition: Smart Animate (300ms)

17. **From 3.6 (Moderado selected)** → **3.7-Triagem-Summary**:
    - Trigger: Tap on "Próximo"
    - Transition: Smart Animate (300ms)

18. **From 3.7** → **3.8-Video-Call**:
    - Trigger: Tap on "Enviar e começar sessão"
    - Transition: Smart Animate (400ms)

19. **From 3.8** → **3.9-Session-Ended-Time-Cut** (auto-transition):
    - Delay: 5s (simulate 5s of video call)
    - Transition: Crossfade (300ms)

20. **From 3.9** → **3.10-Feedback-Form** (auto-transition):
    - Delay: 2s
    - Transition: Crossfade (300ms)

21. **From 3.10** → **3.11-Feedback-Submitted**:
    - Trigger: Tap on "Enviar feedback"
    - Transition: Smart Animate (300ms)

22. **From 3.11 (auto-transition after showing success)**:
    - Delay: 2s
    - Destination: 3.12-Therapist-Response-Modal
    - Transition: Smart Animate (400ms)

23. **From 3.12** → **3.13-Minhas-Sessoes-Tab**:
    - Trigger: Tap on "Fechar"
    - Transition: Smart Animate (300ms)

24. **From 3.13** → **3.14-Dashboard-Final**:
    - Trigger: Tap on "Dashboard" (or auto after 3s)
    - Transition: Smart Animate (300ms)

25. **From 3.14** → **3.15-Black-Screen-Hold** (auto-transition):
    - Delay: 3s (hold final dashboard)
    - Transition: Fade (2s)

26. **From 3.15** → **3.16-Branding-Final** (auto-transition):
    - Delay: 2s
    - Transition: Fade (3s)

27. **From 3.16** (end):
    - Hold for 3-4s, then END

---

## PARTE 7: GRAVANDO O PROTÓTIPO

### 7.1 Setup de Gravação

1. **Abrir Figma em fullscreen**
2. **Ativar Prototype Mode** (top-right, "Prototype" tab)
3. **Play button** (top-right) para iniciar apresentação
4. **Usar screen recorder**:
   - Windows: **OBS Studio** (gratuito) ou **Camtasia**
   - Mac: **QuickTime** ou **ScreenFlow**
   - Configurações:
     - Resolution: 1920×1080
     - Frame rate: 60fps
     - Bit rate: 50-100 Mbps (high quality)

### 7.2 Gravação Step-by-Step

1. Abrir OBS/recorder
2. Iniciar gravação
3. Ir pro Figma prototype → click "Play"
4. Deixar correr automaticamente (flows + auto-transitions)
5. Se precisar intervir manualmente em pontos (clicks, etc), faça
6. Deixar rodar até o final
7. Parar gravação

**Tempo de gravação**: ~180 segundos (3 minutos) + pequenos delays

### 7.3 Saída de Vídeo

- Formato: **MP4** (h.264)
- Resolução: **1920×1080**
- Frame rate: **60fps**
- Bitrate: **25-30 Mbps** (good quality)

---

## PARTE 8: PÓS-PRODUÇÃO (Edição + Áudio)

### 8.1 Edição de Vídeo

Após gravar, importar no **Premiere Pro**, **Final Cut**, ou **DaVinci Resolve**:

1. Trim início/fim se necessário
2. Ajustar cor: aplicar LUT ou color grade warm/humanized
3. Verificar sincronização de transições
4. Corrigir jump cuts (se houver)

### 8.2 Áudio

1. **Background music** (royalty-free):
   - Buscar em: Epidemic Sound, Artlist, Pixabay Music
   - Estilo: calm, warm, ambient (sem letra)
   - Duração: ~180s
   - Volume: -18LUFS
   - Fade in @3s (300ms), fade out @end (2s)

2. **UI sounds** (optional):
   - Button click: soft "tap" sound (-12dB)
   - Success: "ding" chime (-10dB)
   - Modal: soft "swish" (-14dB)
   - Mix: 30% UI sounds, 50% music, 20% silence

### 8.3 Final Export

1. Timeline master: music + video + optional UI sounds
2. Export settings:
   - Format: MP4
   - Video codec: h.264 (HEVC optional for smaller file)
   - Bitrate: 25 Mbps
   - Audio: AAC, 128 kbps, stereo
   - Resolution: 1920×1080
   - Frame rate: 60fps

3. File output: `MenteVive-Portal-Mockup-Video-Final.mp4`

---

## PARTE 9: CHECKLIST DE IMPLEMENTAÇÃO

### Design Phase
- [ ] Setup Figma file + pages
- [ ] Create Design System (_Components page)
  - [ ] Typography styles
  - [ ] Color palette
  - [ ] Button components (variants)
  - [ ] Card components
  - [ ] Badge components
  - [ ] Form field components
- [ ] Create all screens (3.16 screens total)
  - [ ] Beat 1: 4 screens (Login, Dashboard, Hover, Transition)
  - [ ] Beat 2: 9 screens (Calendar → Time → Confirm → Payment → Time Cut)
  - [ ] Beat 3: 16 screens (Waiting room → Triagem → Video → Feedback → Sessions → Dashboard → Branding)

### Prototype Phase
- [ ] Configure all flows and interactions (27 connections)
- [ ] Setup auto-transitions with correct delays
- [ ] Test prototype playback (click through manually)
- [ ] Verify Smart Animate durations match brief (300-400ms standard)

### Recording Phase
- [ ] Setup OBS/screen recorder
- [ ] Test audio levels
- [ ] Record full prototype playback (hands-off, let auto-transitions run)
- [ ] Check for any glitches or jumps

### Post-Production Phase
- [ ] Import video into Premiere/FCP/DaVinci
- [ ] Color grading (warm, humanized MenteVive palette)
- [ ] Select + mix background music
- [ ] Add UI sounds (optional but recommended)
- [ ] Final export (MP4, 1920×1080, 60fps, 25 Mbps)

---

## PARTE 10: DELIVERABLES ESPERADOS

**Ao final do processo:**

1. **Figma File** (shareable link):
   - `MenteVive-Portal-Mockup-Video` with all screens + prototype flows

2. **Video File** (MP4):
   - `MenteVive-Portal-Mockup-Video-Final.mp4`
   - 1920×1080, 60fps, 25 Mbps, ~180 seconds
   - With color grading + audio

3. **Documentation**:
   - This guide
   - Motion Design Brief (MOCKUP_PORTAL_BRIEF.md)
   - Visual Storyboard (MOCKUP_PORTAL_FRAMES_VISUAL.md)

---

## PRÓXIMOS PASSOS

1. **Abra Figma** → crie novo arquivo `MenteVive-Portal-Mockup-Video`
2. **Comece pela Design System** (colors, typography, components)
3. **Construa as screens em ordem** (Beat 1 → Beat 2 → Beat 3)
4. **Configure os flows** um por um
5. **Teste o prototype** (play mode)
6. **Grave com OBS** (60fps, high bitrate)
7. **Edite em Premiere** + color grade + áudio
8. **Exporte MP4 final**

---

**Status**: ✅ READY FOR FIGMA CONSTRUCTION
**Estimated Time**: 16-24 hours (design + prototype + recording + editing)
**Difficulty**: Medium-High (lot of screens, but straightforward flows)

Good luck! 🎬
