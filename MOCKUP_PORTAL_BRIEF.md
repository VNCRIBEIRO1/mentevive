# MenteVive Portal - Motion Design Brief & Storyboard
## Complete User Journey: New Patient Booking → Session → Feedback

---

## PHASE 1: RESEARCH & DISCOVERY

### 1.1 Project Intent Extraction

**Mockup Function**: Portfolio / Case Study video demonstrating complete patient workflow on MenteVive portal
**Target Platform**: Horizontal (16:9, 1920x1080), Vimeo/Portfolio, 2-3 minutes, with subtle ambient audio (optional music + UI sounds)
**Audience**: B2B (potential clinics/therapists), B2C (prospective patients)
**Tone**: Warm, humanized, professional yet approachable (per Beatriz's brand voice: "sem pressa, sem moldes, sem máscaras")
**Restrictions**: 
- No data leakage (use generic/fictional patient data)
- Real UI from live app
- Authentic user flow (no shortcuts or magic)

### 1.2 Motion Principles (3 Bandeiras)

1. **"Movimento como respiração, nunca como pulso"**
   - Todas as transições são longas e suaves (300-600ms)
   - Ease-out longo (expo-out) pra reveals
   - Nenhum snap rápido ou linear
   - Sensação de espaço e tempo — o vídeo "respira" entre cenas

2. **"Cada interação revela intenção"**
   - Hover states são subtis mas presentes (100-150ms, ease-out)
   - Form fills têm anticipation (pequeno recuo antes)
   - Cards/sections entram com stagger (60ms entre items)
   - Follow-through em elementos secundários (sombra, ícone, texto chega 40-80ms depois)

3. **"Câmera observa, paciente dirige"**
   - Nenhum zoom agressivo ou pan rápido
   - Cortes entre dias/telas são suaves (fade/crossfade, 300-400ms)
   - Foco sempre no elemento ativo (usuário clicando, preenchendo form)
   - Transições suportam narrativa, não distraem dela

### 1.3 Motion Principles Impact Table

| Princípio | Implementação | Efeito |
|---|---|---|
| "Respiração" | Durações 300-600ms, expo-out | Sensação premium, calma, confiança |
| "Intenção" | Stagger 60ms, follow-through 40-80ms | Polido, intencional, não "tudo junto" |
| "Câmera observa" | Cortes suaves, nenhum pan agressivo | Foco no paciente, UI desaparece pra background |

### 1.4 Reference Mood (Motion vocabulary)

**Easing primário**: `cubic-bezier(0.16, 1, 0.3, 1)` (expo-out — para reveals grandes)
**Easing secundário**: `cubic-bezier(0.4, 0, 0.2, 1)` (material standard — para movimentos curtos)
**Stagger**: 60-80ms entre items
**Duração base**: 
- Micro feedback: 100-150ms
- Transição telas: 300-400ms (fade)
- Reveal elementos: 400-600ms
- Câmera/zoom: 1-2s

---

## PHASE 2: STORYBOARD & BEAT MAP

### Video Duration Target: 2 minutes 45 seconds (165 seconds total)

**3-Beat Structure**:
- **Beat 1 (~40s / 24%)**: Entrada portal + Dashboard + Decisão "agendar sessão"
- **Beat 2 (~70s / 42%)**: Agendamento completo + Pagamento + Tela corta pro dia da sessão
- **Beat 3 (~55s / 33%)**: Sessão (triagem + video) + Feedback completo + "Minhas sessões" + Dashboard

---

## DETAILED SCENE-BY-SCENE BREAKDOWN

### BEAT 1: ENTRADA & DISCOVERY (0-40s)

#### Scene 1.1: Login → Portal (0-3s)
**Duration**: 3s
**Easing**: expo-out
**Sequence**:
- Black screen + fade-in "MenteVive" logo (200ms, center)
- Fade-in login form (300ms, slight blur-in)
- [CUT to portal — simula login bem-sucedido]

**Transitions**: Crossfade
**Follow-through**: Logo permanece 200ms depois do fade-in do form
**UI Elements**:
- Logo: scale 0.9 → 1.0 (200ms)
- Form: opacity 0 → 1 (300ms, delay 100ms)

---

#### Scene 1.2: Dashboard — Hero Banner + Greeting (3-8s)
**Duration**: 5s
**Easing**: expo-out primary, ease-out secondary
**Content Display**:
- Fade-in hero banner com personalized greeting "Olá, Marina 🌿" (300ms)
- Fade-in 3 stat cards em stagger:
  - Card 1 (Próxima sessão): stagger offset 0ms
  - Card 2 (Sessões realizadas): stagger offset 60ms
  - Card 3 (Última atualização): stagger offset 120ms
- Each card: scale 0.95 → 1.0 (400ms, expo-out) + opacity 0 → 1

**Follow-through**:
- Text dentro do card entra 40ms depois do card
- Ícones (calendar, check, leaf) desaturados até 80ms depois

**Micro Interactions**:
- Shadow sob cards cresce junto com scale (opacity 0 → 0.1)

**User Action**: No interaction yet — just observing

---

#### Scene 1.3: Quick Actions Bar — "Agendar Sessão" Focus (8-12s)
**Duration**: 4s
**Easing**: ease-out
**Content**:
- Fade-in "Quick Actions" section (300ms)
- 4 botões em stagger (80ms cada):
  1. "Agendar Sessão" (primary button — highlight)
  2. "Ver Minhas Sessões"
  3. "Pagamentos"
  4. "Perfil"
- Button "Agendar Sessão" levemente maior / mais saturado (visual hierarchy)

**Micro Interactions**:
- Hover effect no botão "Agendar Sessão": scale 1.05 (150ms, ease-out)
- Light glow/shadow subtle (opacity 0 → 0.15)

**User Action**: Mouse hover over "Agendar Sessão" button

---

#### Scene 1.4: Click "Agendar Sessão" → Transition (12-14s)
**Duration**: 2s
**Easing**: expo-out (fade transition)
**Sequence**:
- Button press effect (scale 0.98, 80ms, then back to 1.0)
- Page fade-out bottom-half (300ms)
- Crossfade to "Agendar" page (200ms overlap)

**Follow-through**: Button click sound (optional UI sound, 40ms)

---

### BEAT 2: BOOKING FLOW (14-84s)

#### Scene 2.1: Agendar Page — Calendar Header (14-17s)
**Duration**: 3s
**Easing**: expo-out
**Content**:
- Fade-in page header: "Agendar uma sessão" (300ms)
- Fade-in calendar nav (month/year picker): "Maio 2026" (300ms, delay 100ms)
- Fade-in calendar grid (300ms, delay 150ms)

**Text Animation**:
- Header text: opacity 0 → 1 (300ms)
- "Maio 2026": opacity 0 → 1 (300ms, blur 4px → 0)

---

#### Scene 2.2: Interactive Calendar — Selecting Date (17-28s)
**Duration**: 11s
**Easing**: ease-out / expo-out
**Sequence**:
- Calendar days render with stagger (40ms per item)
- TODAY (May 11) is marked but grayed (disabled — "no same-day bookings")
- USER hovers over May 15 (next available):
  - Scale 1.0 → 1.15 (150ms, ease-out)
  - Background highlight fades in (150ms)
  - Tooltip appears: "Sessões disponíveis" (100ms fade-in)
- USER clicks May 15:
  - Button press animation (scale 0.97 → 1.0, 100ms)
  - Selected date highlights (background color animate 200ms)
  - Time picker FADES IN BELOW (400ms, expo-out)

**Stagger Pattern**:
- Day 12: 0ms offset
- Day 13: 40ms offset
- Day 14: 80ms offset
- ... (continue for all days)

**User Actions**: 
1. Hover May 15
2. Click May 15

---

#### Scene 2.3: Time Picker — Selecting Slot (28-38s)
**Duration**: 10s
**Easing**: expo-out
**Content**:
- Time picker fades in (400ms)
- Header: "Escolha um horário para 15 de maio" (fade-in 300ms)
- 6 time slots in stagger (70ms each):
  - 14:00 (disabled — grayed, 40% opacity)
  - 14:30 (available, normal)
  - 15:00 (available, normal)
  - 15:30 (available, normal — **user will select this**)
  - 16:00 (available, normal)
  - 16:30 (disabled — past booking cutoff)

**Micro Interaction** on hover (15:30):
- Scale 1.0 → 1.08 (150ms, ease-out)
- Border color fade from gray to primary color (200ms)
- Slight glow (box-shadow: 0 0 15px rgba(212, 165, 116, 0.3), fade-in 200ms)

**User Action**: Click 15:30

---

#### Scene 2.4: Confirmation Step — Review Booking (38-48s)
**Duration**: 10s
**Easing**: expo-out + material standard
**Content**:
- Page transitions with fade (300ms)
- Card title: "Confirme sua sessão" fades in (300ms)
- 3 fields populate in stagger (100ms each):
  1. "Data: 15 de maio de 2026" (icon + text, stagger 0ms)
  2. "Hora: 15:30 - 16:30" (icon + text, stagger 100ms)
  3. "Modalidade: Online (Vídeo chamada Jitsi)" (icon + text, stagger 200ms)

**Field Animation per item**:
- Slide-in from left 20px (400ms, expo-out)
- Opacity 0 → 1 (400ms)
- Icon scales 0.8 → 1.0 (400ms, delay 100ms — follow-through)

**Optional Notes Field**:
- Text area appears (opacity 0 → 1, 300ms, delay 300ms)
- Placeholder text: "Adicione notas para a psicóloga (opcional)"

**Action Button**:
- "Confirmar e Pagar" button fades in (300ms, delay 400ms)
- Button has subtle pulse: scale 1.0 ↔ 1.02 every 2s (infinite, amplitude 2%)

---

#### Scene 2.5: Payment Step — Stripe Checkout (48-65s)
**Duration**: 17s
**Easing**: expo-out
**Sequence**:
1. Click "Confirmar e Pagar" (button press 100ms scale animation)
2. Page fade-out + fade-in Stripe checkout (300ms crossfade)
3. Checkout card renders:
   - Card title: "Complete o pagamento" (fade-in 300ms)
   - Order summary (price, tax, total) in stagger:
     - Session price "R$ 120,00": fade-in 300ms
     - Tax "R$ 0,00": fade-in 300ms (delay 80ms)
     - Total "R$ 120,00": fade-in 300ms (delay 160ms), **bold/highlight** (delay 240ms)
   - Payment method selector (card/PIX) in stagger (60ms each)
   - Credit card form FADES IN (400ms, delay 300ms)
     - Card number, expiry, CVC fields in column stagger (80ms each)

4. User fills payment (simulated, no actual keystroke animation)
5. Click "Pagar agora" button
6. Processing animation:
   - Button text fades out (100ms)
   - Spinner fades in (100ms, delay 50ms)
   - 3 spinning dots rotate (infinite, 1.5s cycle)
   - Duration visible: 2-3s (to simulate API call)

7. Success feedback:
   - Checkmark icon scales in (200ms, scale 0 → 1.0, bounce effect)
   - "Pagamento confirmado!" text fades in (300ms, delay 100ms)
   - Success page shows next action: "Sessão marcada para 15 de maio às 15:30"

---

#### Scene 2.6: Time Cut — Day Transition (65-67s)
**Duration**: 2s
**Easing**: crossfade
**Sequence**:
- Current screen fades to 50% opacity (300ms)
- Overlay appears: "15 de maio • 15:15" (large text, center, fade-in 400ms)
- "Faltam 15 minutos para sua sessão" (smaller text, fade-in 500ms, delay 200ms)
- Camera pulls back / zoom-out subtle (1.2x scale of viewport, 1s, ease-in-out)
- Everything fades to next scene (portal dashboard with session ready)

---

### BEAT 3: SESSION & FEEDBACK (67-165s = 98s remaining, but we'll be ~2:45 total, so 68s for this beat)

#### Scene 3.1: Portal After Time Cut — Session Ready (67-72s)
**Duration**: 5s
**Easing**: expo-out
**Content**:
- Fade-in dashboard (300ms)
- Top banner: "Sua sessão começa em 15 minutos!" (fade-in 400ms, color highlight — amber/warm)
- Card "PRÓXIMA SESSÃO" animates in (stagger, scale 0.95 → 1.0, 400ms)
  - Time: "15:30 - 15 de maio"
  - Status badge: "Confirmada" (green, fade-in 300ms)
- CTA button "Entrar na sala de espera" is prominent (scale pulse animation)

**User Action**: Mouse hovers over button (scale 1.05, 150ms, ease-out)

---

#### Scene 3.2: Click "Entrar na Sala de Espera" (72-74s)
**Duration**: 2s
**Easing**: expo-out fade
**Sequence**:
- Button press (scale 0.98, 100ms)
- Page fade-out (300ms)
- Crossfade to waiting room (200ms overlap)

---

#### Scene 3.3: Waiting Room — Setup (74-80s)
**Duration**: 6s
**Easing**: expo-out
**Content**:
- Fade-in waiting room header: "Sala de espera" (300ms)
- Fade-in status: "A psicóloga está chegando..." with animated ellipsis (300ms, delay 100ms)
- Countdown timer appears: "11:45" (fade-in 300ms, delay 200ms)
- Video preview box (desktop camera feed placeholder) fades in (400ms, delay 300ms)
- "Seu vídeo está ativo" indicator (green dot + text, fade-in 300ms, delay 400ms)
- Button "Preencher triagem" below video (fade-in 300ms, delay 500ms)

---

#### Scene 3.4: Triage Form — Multi-step (80-95s)
**Duration**: 15s
**Easing**: expo-out + ease-out
**Sequence**:

**Step 1: Mood check** (80-85s, 5s)
- Fade-in question: "Como você está se sentindo hoje?" (300ms)
- 5 emoji buttons stagger (70ms each):
  - 😢 (Triste)
  - 😐 (Neutro)
  - 🙂 (Bem)
  - 😊 (Muito bem)
  - 🤩 (Excelente)
- User hovers over "😊" (Muito bem):
  - Scale 1.0 → 1.2 (150ms, ease-out)
  - Background glow fades in (200ms)
- User clicks:
  - Button press (scale 0.95, 100ms)
  - Selected state locks (border highlight, 200ms)
  - "Próximo" button slides up (300ms, opacity 0 → 1, from below)

**Step 2: Sleep quality** (85-89s, 4s)
- Form fades out + fades in next question (300ms crossfade)
- "Como foi sua qualidade de sono?" (fade-in 300ms)
- Slider (1-10) or 3 buttons (Ruim / Normal / Ótimo) in stagger:
  - Each button: scale 0.95 → 1.0, opacity 0 → 1 (300ms, delay stagger)
- User selects "Normal":
  - Selected state animates (200ms)
  - "Próximo" button slides up (300ms)

**Step 3: Anxiety level** (89-93s, 4s)
- Form fades (crossfade, 300ms)
- "Qual seu nível de ansiedade?" (fade-in 300ms)
- Visual scale with 5 levels (Low to High) in stagger (60ms each):
  - Level 1: 20% height, gray
  - Level 2: 40% height, yellow
  - Level 3: 60% height, amber (user selects this — animation highlight)
  - Level 4: 80% height, orange
  - Level 5: 100% height, red
- User clicks Level 3:
  - All previous levels fade (200ms)
  - Selected level grows with emphasis (scale, color brighten, 300ms)
  - "Próximo" button slides up (300ms)

**Step 4: Summary + Submit** (93-95s, 2s)
- Review card fades in (300ms):
  - ✓ Mood: Muito bem
  - ✓ Sleep: Normal
  - ✓ Anxiety: Moderado
- "Enviar e começar sessão" button fades in (300ms, delay 200ms)
- User clicks:
  - Button press (100ms)
  - Checkmark icon animates (scale 0 → 1.0, 200ms, bounce)
  - Text: "Triagem enviada!" fades in (300ms)

---

#### Scene 3.5: Video Call Simulation (95-110s)
**Duration**: 15s
**Easing**: expo-out
**Sequence**:
- Waiting room fades out (300ms)
- Video call interface fades in (400ms)
- Layout: Two video windows side-by-side
  - Patient video (left, with border glow): scale 0.9 → 1.0, opacity 0 → 1 (400ms)
  - Therapist video (right, with border glow): scale 0.9 → 1.0, opacity 0 → 1 (400ms, delay 100ms)
- Header: "Sessão com Bea" + timer "00:05:12" (fade-in 300ms, delay 200ms)
- Bottom toolbar with buttons (mute, camera, end call) fades in (300ms, delay 300ms)
- Simulate 10 seconds of call (no actual video, just static frames or ambient animation)
  - Optional: animated background blur or subtle canvas animation
- Timer advances: 00:05:12 → 00:15:20 (simulating passage of time, sped up)

---

#### Scene 3.6: Time Cut — Session Ends (110-113s)
**Duration**: 3s
**Easing**: crossfade + expo-out
**Sequence**:
- Video call fades to 50% opacity (300ms)
- Overlay appears: "Sessão finalizada" (large, center, fade-in 400ms)
- "15 de maio • 15:30-16:30" (smaller, fade-in 500ms, delay 200ms)
- Timer shows "00:60:00" (full hour visible)
- Everything fades to feedback form (crossfade, 300ms)

---

#### Scene 3.7: Patient Feedback Form (113-128s)
**Duration**: 15s
**Easing**: expo-out + ease-out
**Content**:
- Fade-in form header: "Como foi sua sessão?" (300ms)
- Fade-in subheader: "Sua percepção nos ajuda a melhorar sempre" (300ms, delay 100ms)

**Section 1: Session rating** (113-118s, 5s)
- Question: "Qual nota você dá para a sessão?" (fade-in 300ms)
- 5-star rating system in stagger (80ms each):
  - Star 1: scale 0.7 → 1.0, opacity 0 → 1 (300ms)
  - Star 2: same, delay 80ms
  - Star 3: same, delay 160ms
  - Star 4: same, delay 240ms (user will select this)
  - Star 5: same, delay 320ms
- User hovers Star 4:
  - All stars 1-4 illuminate (yellow glow, 200ms)
  - Star 5 remains gray (dim)
- User clicks Star 4:
  - Stars 1-4 lock at bright yellow (300ms)
  - Label appears below: "Muito bom!" (fade-in 200ms)

**Section 2: Feedback textarea** (118-126s, 8s)
- Question fades in: "Deixe seu feedback (opcional)" (300ms)
- Textarea appears (scale 0.95 → 1.0, opacity 0 → 1, 400ms, delay 200ms)
- User types in real-time (no cursor animation, just simulated text appearing):
  - "Ótima sessão! Me sinto mais tranquila. Aproveitei bastante as técnicas de respiração."
  - Text animates char-by-char (20ms per char) — fast but visible
- Submit button slides up (opacity 0 → 1, 300ms, delay 300ms)

**Section 3: Submit** (126-128s, 2s)
- User clicks "Enviar feedback"
- Button press animation (100ms)
- Checkmark icon scales in (200ms, bounce)
- "Feedback enviado!" text fades in (300ms)

---

#### Scene 3.8: Therapist Response Notification (128-138s)
**Duration**: 10s
**Easing**: expo-out
**Sequence**:
- Fade-in notification banner: "Bea respondeu ao seu feedback" (300ms)
  - Slide in from top (translate Y -20px → 0, 300ms, expo-out)
  - Slight shadow/glow (fade-in 200ms)
- "Clique para ver a resposta" CTA (fade-in 200ms, delay 100ms)
- Hover on banner:
  - Scale 1.0 → 1.02 (150ms, ease-out)
  - Background brightness increase (200ms)
- User clicks:
  - Banner fades out (200ms)
  - Modal/dialog fades in (400ms, expo-out)

---

#### Scene 3.9: View Therapist Feedback Modal (138-148s)
**Duration**: 10s
**Easing**: expo-out
**Content**:
- Modal title: "Feedback da psicóloga" (fade-in 300ms)
- Therapist avatar + name: "Bea" (fade-in 300ms, delay 100ms)
- Therapist feedback text appears char-by-char (slow reveal, 20ms per char):
  - "Marina, foi ótimo trabalhar com você hoje! Notei sua disposição em aplicar as técnicas. Continue com os exercícios de respiração 2x ao dia. Próxima sessão: retomamos as reflexões sobre ansiedade social. Forte abraço! 💚"
  - Total char reveal: ~3-4 seconds
- "Fechar" button fades in at bottom (300ms, delay 200ms)

**Micro interactions**:
- User reads the text (simulate ~5s dwell time)
- Optional: text highlights or emojis animate (if applicable)

---

#### Scene 3.10: Close Modal → "Minhas Sessões" Page (148-158s)
**Duration**: 10s
**Easing**: expo-out
**Sequence**:
- User clicks "Fechar" (button press, 100ms)
- Modal fades out (300ms)
- Dashboard fades in (300ms, overlap crossfade)
- Navigation: User clicks on "Minhas Sessões" in sidebar/header (scale 1.05, 150ms on hover)
- Page transition with fade (300ms)
- "Minhas Sessões" page loads (fade-in 400ms)

---

#### Scene 3.11: Sessions List — Filter & Review (158-168s, but we're at 158, so ~10s for wrap-up)
**Duration**: 7s
**Easing**: expo-out
**Content**:
- Page header: "Minhas sessões" (fade-in 300ms)
- Filter tabs in stagger (60ms each):
  - "Todas" (gray)
  - "Pendentes" (yellow)
  - "Confirmadas" (green)
  - "Realizadas" (blue — **selected by default**)
- Sessions list fades in with stagger (80ms each):
  1. "15 de maio • 15:30-16:30" — Status: ✓ Realizada
     - Therapist: Bea
     - Notes: "Ótima evolução observada"
     - Feedback visible: "⭐⭐⭐⭐ Muito bom! Me sinto mais tranquila..."
  2. "8 de maio • 14:00-15:00" — Status: ✓ Realizada
  3. "1 de maio • 16:00-17:00" — Status: ✓ Realizada

**Card animations**:
- Each card: slide-in from left (20px → 0, 300ms, ease-out) + opacity 0 → 1
- Stagger: 0ms, 80ms, 160ms

**Hover interaction** (on first card):
- Scale 1.0 → 1.02 (150ms, ease-out)
- Shadow grows (opacity 0 → 0.1, 200ms)
- Feedback text highlights (subtle color shift, 200ms)

---

#### Scene 3.12: Final Dashboard Return (168-165s, wrapping up at 2:45)
**Duration**: 7s (but we're near end, so this is wrap-up)
**Easing**: expo-out
**Sequence**:
- User clicks "Dashboard" in nav
- Page fade-out + fade-in (300ms crossfade)
- Dashboard displays:
  - Hero banner: "Marina, sua jornada terapêutica está evoluindo!" (fade-in 300ms)
  - Stats updated:
    - "Sessões realizadas: 3" (fade-in 300ms, delay 100ms)
    - "Próxima: 22 de maio às 14:00" (fade-in 300ms, delay 200ms)
    - "Último feedback: Bea respondeu" (fade-in 300ms, delay 300ms)
  - Quick actions re-appear in stagger (80ms each)

- Hold final frame for 2-3s (camera pans or slight parallax in background)
- Fade to black (2s)
- MenteVive branding/tagline fades in (3s):
  - "MenteVive - Seu espaço seguro para evolução terapêutica"
  - Tagline: "Simplifique a gestão, humanize o cuidado"

---

## PHASE 3: TECHNICAL SPECIFICATIONS

### Overall Video Specs
| Property | Value |
|---|---|
| Resolution | 1920x1080 (16:9) |
| Frame rate | 60 fps |
| Duration | ~165 seconds (2:45) |
| Format | MP4 (h.264), 20-30 Mbps bitrate |
| Color space | sRGB |
| Audio | Optional ambient music (50%) + UI sounds (50%, duck during dialog) |

### Animation Timing Reference Table (Copy all durations from here)

| Animation Type | Duration | Easing |
|---|---|---|
| Micro feedback (hover) | 100-150ms | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Button press | 80-100ms | ease-out-quint |
| Tap/click confirm | 100ms | ease-out-quint |
| Fade-in reveal | 300-400ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Fade-out transition | 200-300ms | ease-in-quad |
| Stagger item offset | 60-80ms | — |
| Stagger follow-through | 40-100ms | — |
| Page transition (crossfade) | 300-400ms | — |
| Form field slide-in | 300-400ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Time cut / scene transition | 2-3s | crossfade + expo-out |
| Zoom cinematographic | 1-2s | ease-in-out cubic |
| Hold final frame | 2-3s | — |

### Stagger Patterns (Sequential animations)

**Cards/Items entering**:
```
Item 1: delay 0ms, duration 400ms
Item 2: delay 60ms, duration 400ms
Item 3: delay 120ms, duration 400ms
```

**Form fields filling**:
```
Label: delay 0ms, duration 300ms
Input: delay 80ms, duration 300ms
Border: delay 120ms, duration 300ms (follow-through)
```

**Time-based text reveal** (char-by-char):
```
20ms per character (fast read, not intrusive)
```

### Audio Strategy

**Background Music**: 
- Calm, warm ambient (matching brand voice)
- Volume: 40-50% through video
- No lyrics (avoid distraction)
- Fadeout during critical moments (triage form, payment)

**UI Sounds** (optional, subtle):
- Button click: 40-60ms soft "tap" (~-12dB)
- Form validation success: 80-100ms "ding" or soft chime (~-10dB)
- Modal open/close: 100-150ms subtle swish (~-14dB)
- Page transition: fade audio 200ms during crossfade

**Total Audio Mix**:
- Music: 50%
- UI sounds: 30%
- Silence/breathing room: 20%

---

## PHASE 4: EDITING & DELIVERY

### Output Deliverables

1. **Master MP4**: 1920x1080, 60fps, h.264, 25 Mbps (optimized for web)
2. **Vertical variation** (optional, for Instagram Reels): 1080x1920, same content, re-framed
3. **Motion guidelines document**: This brief + annotated storyboard (for handoff to animators)
4. **Figma source file**: Screen designs + timing annotations (if created in Figma → AE pipeline)
5. **After Effects project file** (optional): For future revisions

### Color Grading Notes

- Use MenteVive brand palette:
  - Primary gold: #D4A574
  - Accent pink: #E8A0BF
  - Calm teal: #0f766e
  - Sage green: #e6f0eb
  - Background cream: #FFF5EE
  - Text dark brown: #3D2B1F

- Lighting: Warm, soft shadows (no harsh blacks)
- Contrast: AA WCAG minimum (4.5:1 for text)
- Saturation: Slightly desaturated overall (-10% saturation pass) → feels premium, not "screaming"

---

## FINAL BEAT MAP VISUAL

```
Timeline:  0s ────────── 40s ─────────────────── 84s ─────────────────────────── 165s
           |                                     |                                 |
Beat 1     [ENTRADA & DISCOVERY]                |                                 |
           Portal intro → Dashboard → Decision  |                                 |
           "Bom dia, Marina"                    |                                 |
                                                |                                 |
Beat 2     ─────────────── [BOOKING FLOW] ──────|                                 |
                           Calendar → Time → Confirm → Payment                    |
                           Time cut: "Day of session"                              |
                                                |                                 |
Beat 3     ─────────────────────────────────────[SESSION & FEEDBACK]──────────────|
                                                 Waiting room → Triagem → Video  
                                                 Feedback → Therapist response
                                                 Sessions list → Dashboard hold
                                                 Fade to black + branding (2:45)
```

---

## REFERENCE MOTION PRINCIPLES RECAP

### Apply across all scenes:
- ✓ Movimento = respiração (300-600ms durações, expo-out)
- ✓ Cada elemento tem intenção (stagger, follow-through, anticipation)
- ✓ Câmera observa paciente (nenhum pan agressivo, foco na ação)
- ✓ 3 beats visuais: Entrada (40s) → Booking (44s) → Session+Feedback (81s)
- ✓ Nenhum linear easing
- ✓ 60fps piso, sem frames drops
- ✓ Ritmo natural, respiração entre cenas

---

## NEXT STEPS (Production)

1. **Pre-production**: Validate this brief with team → adjustments if needed
2. **Capture phase**: Record actual MenteVive portal at 60fps with device/mouse movement
3. **UI Markup**: Annotate in Figma or Premiere which elements animate when
4. **After Effects**: Import Figma screens → implement timing per this brief
5. **Sound design**: Record/select audio, mix at -18LUFS
6. **Color grade**: Apply MenteVive palette, warm lighting pass
7. **Final export**: MP4 h.264, 25 Mbps, metadata + captions (pt-BR)
8. **Delivery**: Upload to portfolio (Vimeo/Behance), update case study

---

**Briefing Status**: ✅ READY FOR PRODUCTION
**Created**: May 11, 2026
**For**: MenteVive Portal User Journey Mockup
**Motion Direction**: Premium, warm, humanized, breathing animations
**Target Outcome**: Awwwards-tier video demonstrating complete patient workflow
