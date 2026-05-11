# MenteVive Portal Mockup - Visual Storyboard (Frame Reference)

## Detailed Scene Descriptions with Visual References

---

## BEAT 1: ENTRADA & DISCOVERY (0-40s)

### 🎬 Scene 1.1: Login Screen (0-3s)
```
Frame 1 (0ms): Black screen
Frame 2 (100ms): MenteVive logo center (scale 0.9 → 1.0, opacity 0→1, 200ms)
               Logo: Gold color (#D4A574), size ~200x60px
Frame 3 (300ms): Login form fades in (opacity 0→1, blur 8px→0, 300ms)
               Form has "Email" and "Password" fields
               Submit button: "Entrar" in primary gold
Frame 4 (600ms): Form fully visible, ready for interaction

Visual: Dark background (#1a1a1a), centered content, warm lighting
```

---

### 🎬 Scene 1.2: Dashboard Hero Banner (3-8s)
```
Frame 5 (3s): Dashboard page visible
            Hero banner at top with greeting
Frame 6 (3.3s): "Olá, Marina 🌿" text fades in (300ms, opacity 0→1)
              Text: 36px Fraunces, color #3D2B1F
              Background: soft gradient cream #FFF5EE
Frame 7 (3.8s): Subtitle fades in (300ms, delay 200ms from start)
              "Seu espaço seguro. Acompanhe sessões, evolução e tudo sobre seu processo terapêutico."
              Text: 16px Inter, color #666

Layout:
┌─────────────────────────────────────────────┐
│ Olá, Marina 🌿                              │
│ Seu espaço seguro. Acompanhe sessões...    │
└─────────────────────────────────────────────┘

Frame 8 (4.2s): First stat card enters (scale 0.95→1, opacity 0→1, 400ms expo-out)
              Card: "Próxima sessão"
              Content: "15 de maio • 15:30"
              Icon: Calendar + check (left side)
              Shadow: subtle, opacity 0→0.1

Frame 9 (4.6s): Second card enters (delay 60ms from first, same animation)
              Card: "Sessões realizadas"
              Content: "3 sessões completadas"
              Icon: Leaf (brand style)
              
Frame 10 (5.0s): Third card enters (delay 120ms from first)
              Card: "Última atualização"
              Content: "Feedback de Bea • 2h atrás"
              Icon: Message circle

Visual Grid (3 cards):
┌──────────┬──────────┬──────────┐
│ Próxima  │ Sessões  │ Última   │
│ 15 maio  │ 3        │ Bea 2h   │
└──────────┴──────────┴──────────┘

Each card: white background, soft shadow, gold accent border (2px left)
```

---

### 🎬 Scene 1.3: Quick Actions (8-12s)
```
Frame 11 (8s): "Quick Actions" header fades in (300ms, opacity 0→1)
            Text: 14px Inter bold, color #999

Frame 12 (8.3s): Button 1 enters (stagger 0ms)
              "Agendar Sessão" - PRIMARY button
              Background: gold #D4A574, text white
              Size: 200px width, 50px height
              Icon: Plus + Calendar left side
              
Frame 13 (8.38s): Button 2 enters (stagger 80ms from button 1)
              "Ver Minhas Sessões"
              Background: white, border 1px gray, text dark
              
Frame 14 (8.46s): Button 3 enters (stagger 80ms)
              "Pagamentos"
              
Frame 15 (8.54s): Button 4 enters (stagger 80ms)
              "Perfil"

Button Layout (inline):
┌─────────────────┬─────────────────┬──────────┬─────────┐
│ + Agendar       │ 📋 Ver Sessões  │ 💳 Pagar │ 👤 Perf │
└─────────────────┴─────────────────┴──────────┴─────────┘

Frame 16 (9s): Mouse hovers over "Agendar Sessão" button
            Button scales 1.0 → 1.05 (150ms ease-out)
            Glow appears (box-shadow: 0 0 20px rgba(212,165,116,0.3))
            
Frame 17 (12s): User clicks "Agendar Sessão"
            Button press: scale 1.05 → 0.98 (80ms)
            Then back to 1.0 (20ms)
            Page begins to fade
```

---

### 🎬 Scene 1.4: Navigation Transition (12-14s)
```
Frame 18 (12s): Click detected
            Button color shifts slightly darker (transition 80ms)
            Spinner appears (or button text fades)
            
Frame 19 (12.3s): Dashboard page fades out from bottom (opacity 1→0.2, 300ms)
               Everything below fold gets dim
               
Frame 20 (12.5s): Crossfade to "Agendar" page begins (200ms overlap)
               New page: "Agendar uma sessão"
               Fades in (opacity 0→1, 300ms)
               
Frame 21 (13s): Page fully transitioned
            User is now on booking page
            
Visual: Smooth crossfade, no hard cut
Top header: "← Voltar" (back arrow) + "Agendar uma sessão" (center title)
```

---

## BEAT 2: BOOKING FLOW (14-84s)

### 🎬 Scene 2.1: Calendar Header (14-17s)
```
Frame 22 (14s): Calendar page visible
            Header "Agendar uma sessão" fades in (300ms, opacity 0→1)
            Subheader "Escolha data e horário" fades in (300ms, delay 100ms)
            
Frame 23 (14.4s): Month/Year picker fades in (300ms, delay 150ms)
             Shows "Maio 2026" with left/right arrows
             Layout: [← Maio 2026 →]
             
Frame 24 (14.9s): Calendar grid starts rendering with stagger
             Days of week header: Dom Seg Ter Qua Qui Sex Sab
             (Each column header appears with 40ms stagger)
             
Frame 25 (15.2s): Calendar days populate (40ms stagger each)
             Day 1 (grayed, disabled - too close to today)
             Day 12 (grayed, disabled)
             Day 13 (grayed, disabled)
             Day 14 (grayed, disabled)
             Day 15 (available, normal color)
             ... etc

Calendar Visual (simplified):
```
    Maio 2026
Dom Seg Ter Qua Qui Sex Sab
                    1   2   3
 4   5   6   7   8   9  10
11  12  13  14  15  16  17  ← Days 12-14 grayed (disabled)
18  19  20  21  22  23  24
25  26  27  28  29  30  31
```

Frame 26 (15.5s): All days visible, waiting for interaction
```

---

### 🎬 Scene 2.2: Interactive Calendar - Date Selection (17-28s)
```
Frame 27 (17s): Mouse moves to May 15
            Hover effect triggered
            
Frame 28 (17.15s): Day 15 scales up (1.0 → 1.15, 150ms ease-out)
             Background color highlights (yellow/amber fade-in, 150ms)
             Tooltip appears below: "Sessões disponíveis" (fade-in 100ms)
             
Frame 29 (17.3s): User still hovering, day 15 maintains hover state
            Day 15 visual:
            ┌─────────────┐
            │     15      │ ← larger, highlighted bg
            │ [Tooltip]   │
            └─────────────┘
            
Frame 30 (18s): User clicks Day 15
            Button press animation: scale 1.15 → 1.0 (100ms)
            Selected state locks: border 2px gold (#D4A574)
            Background color remains (light amber)
            
Frame 31 (18.2s): Time picker section fades in BELOW calendar
            (opacity 0→1, 400ms expo-out)
            Header: "Escolha um horário para 15 de maio"
            
Frame 32 (18.7s): Time picker fully visible
            Ready for time selection
            
Time Picker Layout (below calendar):
┌─────────────────────────────────────┐
│ Escolha um horário para 15 de maio   │
├─────────────────────────────────────┤
│ ☐ 14:00 (disabled - grayed)         │
│ ☐ 14:30                             │
│ ☐ 15:00                             │
│ ☐ 15:30   ← User will select        │
│ ☐ 16:00                             │
│ ☒ 16:30 (disabled - past cutoff)    │
└─────────────────────────────────────┘

Frame 33 (18.7s-28s): Hold on time picker visible, waiting
```

---

### 🎬 Scene 2.3: Time Selection (28-38s)
```
Frame 34 (28s): Header "Escolha um horário para 15 de maio" fully visible
            Fade-in: 300ms, opacity 0→1
            
Frame 35 (28.3s): Time slot items render with stagger (70ms each)
            Slot 14:00: opacity 0→0.4 (grayed, disabled)
            Slot 14:30: opacity 0→1 (scale 0.95→1, 300ms)
            Slot 15:00: opacity 0→1 (scale 0.95→1, 300ms, delay 70ms)
            Slot 15:30: opacity 0→1 (scale 0.95→1, 300ms, delay 140ms)
            Slot 16:00: opacity 0→1 (scale 0.95→1, 300ms, delay 210ms)
            Slot 16:30: opacity 0→0.4 (grayed, disabled, delay 280ms)
            
Frame 36 (29.5s): All slots visible
            User can see full time menu
            
Frame 37 (31s): Mouse hovers over 15:30
            Slot scales: 1.0 → 1.08 (150ms ease-out)
            Border color transitions: gray → gold (200ms)
            Glow appears: box-shadow 0 0 15px rgba(212,165,116,0.3) (fade-in 200ms)
            
Frame 38 (31.2s): Hover state maintained
            15:30 visual:
            ┌─────────────────────────┐
            │ ◉ 15:30 - 16:30         │ ← selected style
            │    (slightly larger)    │
            └─────────────────────────┘
            
Frame 39 (34s): User clicks 15:30
            Button press: scale 1.08 → 0.97 (100ms)
            Then back to 1.0 locked state (100ms)
            Selected state visual:
            - Border: 2px solid gold
            - Background: light amber
            - Checkmark appears (scale 0→1, 150ms bounce)
            
Frame 40 (34.2s): "Próximo" button slides up from below
            Opacity 0→1, 300ms
            Translate Y: 20px → 0 (300ms, expo-out)
            
Frame 41 (38s): Page hold showing confirmation
            Time 15:30 locked
            "Próximo" button ready to click
```

---

### 🎬 Scene 2.4: Confirmation Review (38-48s)
```
Frame 42 (38s): User clicks "Próximo"
            Button press animation (80ms)
            Page fades out, new step fades in (300ms crossfade)
            
Frame 43 (38.4s): Confirmation page appears
            Header: "Confirme sua sessão" (fade-in 300ms)
            Subheader: "Revise os detalhes abaixo" (fade-in 300ms, delay 100ms)
            
Frame 44 (38.9s): Confirmation card appears
            Background: white, subtle shadow
            Border-left: 4px gold
            
Frame 45 (39s): Item 1 slides in from left (stagger 0ms)
            "📅 Data: 15 de maio de 2026"
            - Icon slides in: translateX -20px → 0 (400ms expo-out)
            - Text fades in: opacity 0→1 (400ms)
            - Small shadow appears under icon (fade-in 200ms, delay 100ms - follow-through)
            
Frame 46 (39.4s): Item 2 slides in from left (stagger 100ms)
            "🕐 Hora: 15:30 - 16:30"
            Same animation as item 1, but delayed
            
Frame 47 (39.8s): Item 3 slides in from left (stagger 200ms)
            "📱 Modalidade: Online (Vídeo chamada Jitsi)"
            Same animation as items 1-2
            
Confirmation Card Visual:
┌──────────────────────────────────┐
│ Confirme sua sessão              │
├──────────────────────────────────┤
│ 📅 Data: 15 de maio de 2026      │
│ 🕐 Hora: 15:30 - 16:30           │
│ 📱 Modalidade: Online (Jitsi)    │
├──────────────────────────────────┤
│ Notas (opcional):                │
│ [Large text area]                │
├──────────────────────────────────┤
│ [Confirmar e Pagar]              │
└──────────────────────────────────┘

Frame 48 (40.5s): Optional notes textarea appears
            Opacity 0→1, 300ms, delay 300ms
            Placeholder: "Adicione notas para a psicóloga (opcional)"
            Textarea height: 80px
            
Frame 49 (41.1s): "Confirmar e Pagar" button appears
            Opacity 0→1, 300ms, delay 400ms
            Button has subtle pulse: scale 1.0 ↔ 1.02 (infinite, 2s cycle)
            
Frame 50 (48s): Hold on confirmation page
            All content visible, ready for payment
```

---

### 🎬 Scene 2.5: Payment / Stripe Checkout (48-65s)
```
Frame 51 (48s): User clicks "Confirmar e Pagar"
            Button press: scale 1.02 → 0.98 (100ms)
            Click sound (optional UI sound, -12dB)
            
Frame 52 (48.2s): Dashboard page fades (opacity 1→0.2, 300ms)
             Everything dims
             
Frame 53 (48.4s): Stripe checkout modal fades in
             Opacity 0→1, 400ms expo-out
             Modal centered, shadow 0 0 40px rgba(0,0,0,0.2)
             
Frame 54 (48.9s): Checkout header fades in
            "Complete o pagamento"
            Text: 24px Fraunces, #3D2B1F
            
Frame 55 (49.2s): Order summary section fades in
            Layout (staggered):
            
            ┌────────────────────────────┐
            │ Resumo do pagamento        │
            ├────────────────────────────┤
            │ Sessão terapêutica  R$ 120,00  │
            │ Impostos (0%)       R$ 0,00    │
            ├────────────────────────────┤
            │ Total               R$ 120,00  │ ← Bold, gold highlight
            └────────────────────────────┘
            
Frame 56 (49.3s): "Sessão terapêutica  R$ 120,00" line fades in
            Opacity 0→1, 300ms
            
Frame 57 (49.38s): "Impostos (0%)  R$ 0,00" fades in
            Opacity 0→1, 300ms, delay 80ms
            
Frame 58 (49.46s): "Total  R$ 120,00" fades in
            Opacity 0→1, 300ms, delay 160ms
            Font weight: bold
            Text color: gold (#D4A574)
            
Frame 59 (49.7s): Payment method selector appears
            "Escolha a forma de pagamento:"
            - Cartão de crédito (radio selected by default)
            - PIX
            - Boleto (if available)
            Each option: opacity 0→1 with stagger 60ms
            
Frame 60 (50.5s): Credit card form fades in
            Opacity 0→1, 400ms, delay 300ms
            Form fields:
            - "Número do cartão" (masked input)
            - "MM/AA" (expiry)
            - "CVC"
            - "Nome" (cardholder)
            - Checkbox: "Lembrar este cartão"
            
Frame 61 (51s): Form fully loaded
            Ready for payment info entry
            
Frame 62 (51-55s): Simulate user typing in card details
            (No keystroke animation, just assume filled)
            Visual shows completed form fields
            
Frame 63 (55s): User clicks "Pagar agora" button
            Button press animation (100ms)
            
Frame 64 (55.2s): Processing state begins
            Button text fades out (opacity 1→0, 100ms)
            Spinner fades in (opacity 0→1, 100ms, delay 50ms)
            3 animated dots: ● ● ● rotating (1.5s cycle, infinite)
            
Payment Processing Visual:
┌──────────────────────────────┐
│ Processando pagamento...     │
│       ● ● ●                  │ ← rotating dots
│    (spinning animation)      │
└──────────────────────────────┘

Frame 65 (55-58s): Processing spinner visible (3s visible)
            Dots rotate continuously
            
Frame 66 (58s): Success state begins
            Spinner fades out (opacity 1→0, 200ms)
            Checkmark icon scales in (scale 0→1.2→1, 200ms, bounce effect)
            Icon: large green checkmark (48px)
            Color: #10b981 (emerald green)
            
Frame 67 (58.3s): Success message fades in
            "Pagamento confirmado!" (fade-in 300ms)
            Font: 20px Inter bold, color #10b981
            
Frame 68 (58.6s): Order confirmation details fade in
            "Sessão marcada para 15 de maio às 15:30"
            "ID do pagamento: PAY-XXXXX"
            (fade-in 300ms, stagger 100ms)
            
Frame 69 (59s): Button appears
            "Próximo" or "Continuar" (fade-in 300ms, delay 200ms)
            
Frame 70 (65s): Hold on success state
            Ready to proceed to next beat
```

---

### 🎬 Scene 2.6: Time Cut - Day Transition (65-67s)
```
Frame 71 (65s): Success screen visible
            
Frame 72 (65.2s): Screen fades to 50% opacity (300ms)
            Everything becomes dim, background blur increases (blur 2px→8px)
            
Frame 73 (65.5s): Overlay text appears centered
            "15 de maio • 15:15"
            Font: 48px Fraunces, color #3D2B1F
            Opacity 0→1 (400ms expo-out)
            
Frame 74 (65.9s): Subtext fades in below
            "Faltam 15 minutos para sua sessão"
            Font: 18px Inter, color #666
            Opacity 0→1 (500ms expo-out, delay 200ms)
            
Frame 75 (66.5s): Camera pulls back (cinematographic zoom-out)
            Viewport scale: 1.0 → 1.2 (1s ease-in-out)
            Everything moves slightly away (creates depth)
            
Frame 76 (67s): All fade to black (opacity 1→0, 300ms)
            Smooth transition to next beat
            Audio: ambient music continues, slight dip in volume
```

---

## BEAT 3: SESSION & FEEDBACK (67-165s) — [ABBREVIATED FOR SPACE]

> **Note**: Due to length, Beat 3 detailed frames will follow same pattern.
> Each scene includes: Frame number, timing, animation type, easing, visual description, layout diagram.

### 🎬 Scene 3.1: Portal After Time Cut (67-72s)
```
Frame 77 (67s): Dashboard page fades in (300ms)
Frame 78 (67.3s): Top banner fades in
            "Sua sessão começa em 15 minutos! 🎯"
            Background: warm gold/amber (#FCB900 or accent color)
            Text: white, bold, 18px
Frame 79 (67.6s): "PRÓXIMA SESSÃO" card animates in
            Scale: 0.95→1, opacity 0→1, 400ms expo-out
Frame 80 (67.8s): Card content details fade in (stagger)
            Time: "15:30 - 15 de maio"
            Status badge: "Confirmada" (green bg, white text)
            Therapist: "Com Bea"
Frame 81 (68.2s): CTA button appears
            "Entrar na sala de espera"
            Opacity 0→1, scale 0.95→1, 300ms
Frame 82 (72s): Button hover
            Scale 1.0→1.05, shadow grows, ready for click
```

### 🎬 Scene 3.2: Click & Transition (72-74s)
```
Frame 83 (72s): User clicks "Entrar na sala de espera"
Frame 84 (72.1s): Button press (80-100ms)
Frame 85 (72.2s): Page fade-out (300ms)
Frame 86 (72.5s): Waiting room fade-in (200ms overlap)
```

### 🎬 Scene 3.3: Waiting Room (74-80s)
```
Frame 87 (74s): Waiting room header fades in
            "Sala de espera"
Frame 88 (74.3s): Status message fades in
            "A psicóloga está chegando..."
            Ellipsis animated: . → .. → ... (loop 500ms)
Frame 89 (74.6s): Countdown timer appears
            "11:45" (large, center)
Frame 90 (74.9s): Video preview box fades in
            Camera feed placeholder (with border glow)
            Opacity 0→1, scale 0.95→1, 400ms expo-out
Frame 91 (75.3s): Green indicator dot + "Seu vídeo está ativo"
            Fade-in 300ms
Frame 92 (75.6s): "Preencher triagem" button slides up
            Opacity 0→1, translateY 20px→0, 300ms expo-out
Frame 93 (80s): Hold on waiting room
```

### 🎬 Scene 3.4: Triage Form - Step 1 (80-85s)
```
Frame 94 (80s): Triage form section appears
            "Como você está se sentindo hoje?"
            Fade-in 300ms
Frame 95 (80.3s): 5 emoji buttons stagger in (70ms each)
            😢 Triste
            😐 Neutro
            🙂 Bem
            😊 Muito bem ← user will select
            🤩 Excelente
Frame 96-99: Stagger sequence
            Each: opacity 0→1, scale 0.8→1, 300ms
Frame 100 (82s): Mouse hovers over 😊
            Scale 1.0→1.2 (150ms)
            Glow background appears
Frame 101 (82.2s): User clicks 😊
            Button press (100ms)
            Selected state locks (border, background highlight)
Frame 102 (82.4s): "Próximo" button slides up
            Opacity 0→1, translateY 20px→0, 300ms
Frame 103 (85s): Step 1 complete
```

### 🎬 Scene 3.5: Triage Form - Steps 2-3 (85-93s)
```
[Similar pattern: fade question, stagger answers, user selects, next appears]
- Step 2 (85-89s): Sleep quality (3 buttons: Ruim/Normal/Ótimo)
- Step 3 (89-93s): Anxiety level (5-level visual scale)
```

### 🎬 Scene 3.6: Triage Summary (93-95s)
```
Frame (93s): Review card fades in
            ✓ Mood: Muito bem
            ✓ Sleep: Normal
            ✓ Anxiety: Moderado
Frame: "Enviar e começar sessão" button fades in (300ms, delay 200ms)
Frame: User clicks → Checkmark animates (bounce)
Frame: "Triagem enviada!" appears
```

### 🎬 Scene 3.7: Video Call (95-110s)
```
Frame (95s): Video call interface fades in (400ms)
Frame (95.4s): Patient video window scales in
            Scale 0.9→1, opacity 0→1, 400ms
            Border glow: gold, subtle shadow
Frame (95.5s): Therapist video window scales in
            Scale 0.9→1, opacity 0→1, 400ms, delay 100ms
            Border glow, positioned opposite
Frame (96s): Header "Sessão com Bea" + timer "00:05:12"
            Fade-in 300ms, delay 200ms
Frame (96.3s): Bottom toolbar (mute, camera, end call buttons)
            Fade-in 300ms, delay 300ms
Frame (96.5-110s): Video call "plays" (static, no actual video)
            Timer advances: 00:05:12 → 00:15:20 (sped up)
            Optional subtle canvas animation in background
            Fade-in/out ambient elements to simulate "time passing"
```

### 🎬 Scene 3.8: Session Ends - Time Cut (110-113s)
```
Frame (110s): Video call fades to 50% opacity (300ms)
Frame (110.3s): Overlay appears
            "Sessão finalizada"
            Font: 48px Fraunces, opacity 0→1, 400ms expo-out
Frame (110.7s): Subtext fades in
            "15 de maio • 15:30-16:30"
            "Duração total: 1 hora"
            Opacity 0→1, 500ms, delay 200ms
Frame (111.3s): Everything fades to next scene (300ms)
```

### 🎬 Scene 3.9: Patient Feedback Form (113-128s)
```
Frame (113s): Feedback form header fades in
            "Como foi sua sessão?"
            "Sua percepção nos ajuda a melhorar sempre"
            Opacity 0→1, 300ms + 300ms

Frame (113.4s): Question fades in
            "Qual nota você dá para a sessão?"
            
Frame (113.7s): 5-star rating system enters (stagger 80ms each)
            ⭐ ⭐ ⭐ ⭐ ⭐
            Each: scale 0.7→1, opacity 0→1, 300ms

Frame (114.7s): User hovers Star 4
            Stars 1-4 highlight yellow (200ms)
            Star 5 remains gray

Frame (114.9s): User clicks Star 4
            Stars 1-4 lock yellow (300ms)
            Label: "Muito bom!" appears below (fade-in 200ms)

Frame (118s): Textarea question fades in
            "Deixe seu feedback (opcional)"
            
Frame (118.3s): Textarea appears (scale 0.95→1, 400ms, delay 200ms)

Frame (118.8-125s): User types feedback (char-by-char reveal)
            "Ótima sessão! Me sinto mais tranquila..."
            Text animates: 20ms per character

Frame (126s): Submit button appears (opacity 0→1, 300ms, delay 300ms)

Frame (126.3s): User clicks "Enviar feedback"
            Button press (100ms)
            Checkmark icon animates (bounce)
            "Feedback enviado!" appears
```

### 🎬 Scene 3.10: Therapist Response (128-138s)
```
Frame (128s): Notification banner appears (top of screen)
            Slide-in from top: translateY -20px→0, 300ms expo-out
            "Bea respondeu ao seu feedback"
            Color: emerald green bg, white text

Frame (128.3s): Hover effect on banner
            Scale 1.0→1.02 (150ms)
            Brightness increases (200ms)
            Shadow grows

Frame (131s): User clicks notification
            Banner fades out (200ms)
            Modal fades in (400ms expo-out)

Frame (132s): Modal title fades in
            "Feedback da psicóloga"
            
Frame (132.3s): Therapist avatar + name
            "Bea"
            Opacity 0→1, 300ms, delay 100ms

Frame (132.6-137s): Therapist feedback text reveals (char-by-char)
            "Marina, foi ótimo trabalhar com você hoje!
             Notei sua disposição em aplicar as técnicas.
             Continue com os exercícios de respiração 2x ao dia.
             Próxima sessão: retomamos as reflexões sobre 
             ansiedade social. Forte abraço! 💚"
            Reveal: 20ms per character (~3-4s total reveal)

Frame (138s): Text fully revealed
            "Fechar" button visible (fade-in 300ms, delay 200ms)
```

### 🎬 Scene 3.11: "Minhas Sessões" Navigation (148-158s)
```
Frame (148s): User clicks "Fechar" button
            Button press (100ms)
            Modal fades out (300ms)
            
Frame (148.3s): Dashboard fades in (300ms overlap)

Frame (149s): User clicks "Minhas Sessões" in sidebar
            Scale 1.05 (150ms hover)
            Page transition begins

Frame (149.2s): Fade-out + fade-in (300ms crossfade)

Frame (150s): "Minhas Sessões" page loads
            Header fades in: "Minhas sessões"
            Subheader: "Visualize todas as suas sessões"

Frame (150.4s): Filter tabs appear (stagger 60ms each)
            "Todas"
            "Pendentes"
            "Confirmadas"
            "Realizadas" ← selected (green highlight, bottom border)

Frame (151s): Sessions list starts populating (stagger 80ms each)

Frame (151.08s): Session 1 slides in from left
            "15 de maio • 15:30-16:30"
            Status: ✅ Realizada (blue badge)
            Therapist: Bea
            Note: "Ótima evolução observada"
            Feedback: "⭐⭐⭐⭐ Muito bom!"

Frame (151.16s): Session 2 slides in (delay 80ms)
            "8 de maio • 14:00-15:00"
            Status: ✅ Realizada
            [Similar content]

Frame (151.24s): Session 3 slides in (delay 160ms)
            "1 de maio • 16:00-17:00"
            [Similar content]

Frame (152s): All sessions visible

Frame (153s): User hovers on Session 1 card
            Scale 1.0→1.02 (150ms)
            Shadow grows
            Feedback text highlights (subtle color shift)

Frame (158s): Hold on sessions list view
```

### 🎬 Scene 3.12: Final Dashboard (158-165s)
```
Frame (158s): User clicks "Dashboard" in nav
            Scale 1.05 hover, click

Frame (158.2s): Page fade-out + fade-in (300ms)

Frame (159s): Dashboard visible
            Hero banner fades in:
            "Marina, sua jornada terapêutica está evoluindo! 🌿"

Frame (159.3s): Stats update and fade in (stagger 100ms)
            "Sessões realizadas: 3"
            "Próxima: 22 de maio às 14:00"
            "Último feedback: Bea respondeu"

Frame (159.9s): Quick actions re-appear (stagger 80ms)
            "Agendar Sessão"
            "Ver Minhas Sessões"
            "Pagamentos"
            "Perfil"

Frame (162s): Hold on dashboard
            Camera pans subtly or parallax effect (~1-2px drift, 10s loop)

Frame (164s): Fade to black (2s, opacity 1→0)

Frame (166s): MenteVive branding appears (center)
            "MenteVive"
            Font: 48px Fraunces, gold color, opacity 0→1, 3s

Frame (169s): Tagline fades in
            "Simplifique a gestão, humanize o cuidado"
            Font: 16px Inter, opacity 0→1, 2s, delay 500ms

Frame (171s): Final hold (2-3s)
            Branding remains on black

Frame (173s): Fade to black (2s)
            Video ends

Total: ~165 seconds (2:45)
```

---

## ANIMATION MASTER REFERENCE (All Easings & Durations)

### Easing Functions (CSS cubic-bezier)
```
Expo-out (primary reveal):   cubic-bezier(0.16, 1, 0.3, 1)
Material standard (secondary): cubic-bezier(0.4, 0, 0.2, 1)
Ease-out-quint (snappy):     cubic-bezier(0.22, 1, 0.36, 1)
Ease-in-quad (slow enter):   cubic-bezier(0.55, 0, 0.85, 0.56)
Ease-in-out (cinema):        cubic-bezier(0.42, 0, 0.58, 1)
```

### Duration Quick Reference
| Animation | Duration | Easing |
|---|---|---|
| Hover/scale | 100-150ms | material standard |
| Button click | 80-100ms | ease-out |
| Form reveal | 300-400ms | expo-out |
| Stagger offset | 60-80ms | — |
| Page crossfade | 300-400ms | — |
| Character reveal | 20ms per char | — |
| Time cut transition | 2-3s | crossfade |
| Video hold | variable | — |
| Final fade-out | 2-3s | — |

---

## CHECKPOINT: VISUAL PRODUCTION CHECKLIST

Before recording/animating, verify:
- [ ] All frame timings add up to ~165s
- [ ] 3 beats are clear: Entrada(40s), Booking(44s), Session+Feedback(81s)
- [ ] No linear easing anywhere (all use curves)
- [ ] Stagger values consistent (60-80ms)
- [ ] Follow-through on secondary elements (40-100ms delay)
- [ ] 60fps target throughout
- [ ] Color palette MenteVive (gold #D4A574, teal #0f766e, etc.)
- [ ] All text readable (contrast WCAG AA minimum)
- [ ] Audio mix planned (music 50%, UI sounds 30%, silence 20%)
- [ ] Device/asset resolution 1920x1080 or higher

---

## PRODUCTION NOTES

**For Animators/Motion Designers**:
1. Start with the "Motion Fundamentals" guide (see MOCKUP_PORTAL_BRIEF.md)
2. Implement scenes in order (1.1 → 1.2 → 1.3, etc.)
3. Validate each beat before moving to next (check timings, easing quality)
4. Test 60fps on target device before final export
5. Color-grade with MenteVive palette (warm, humanized, premium feel)

**For Editors (Final Assembly)**:
1. Import all scenes
2. Arrange timeline per beat map
3. Layer audio (music fade-in at 3s, maintain through all beats)
4. Add UI sounds at specified moments (button clicks, success chimes)
5. Export MP4 h.264, 25 Mbps, metadata with MenteVive branding
6. Add captions (pt-BR) for accessibility

---

**Visual Storyboard Created**: May 11, 2026
**Status**: ✅ READY FOR PRODUCTION TEAM HANDOFF
