# 📹 MenteVive Portal Mockup - Pacote Completo de Entrega

## 🎯 O QUE FOI CRIADO

### 4 Documentos de Produção (Prontos para Usar)

```
📄 MOCKUP_PORTAL_BRIEF.md
   └─ Motion Design Brief completo
      • Research & Discovery
      • 3 Motion Principles (bandeiras)
      • 12 Cenas detalhadas (165 segundos)
      • Especificações técnicas (1920×1080, 60fps, h.264)
      • Audio strategy (música + UI sounds)

📄 MOCKUP_PORTAL_FRAMES_VISUAL.md
   └─ Visual Storyboard Frame-by-Frame
      • 100+ Frames descritos com timing (ms)
      • Layouts ASCII de cada interface
      • Micro-interações (hover, click, loading)
      • Color grading notes
      • Production checklist

📄 FIGMA_PROTOTYPE_GUIDE.md
   └─ Guia Completo de Construção em Figma
      • Design System (typography, colors, components)
      • 16 Screens estruturados (Beat 1/2/3)
      • 27 Prototype Flows (Smart Animate transitions)
      • Setup de gravação (OBS + recorder)
      • Pós-produção (Premiere/DaVinci)
      • Checklist de implementação

📄 FIGMA_QUICK_START.md  ← COMECE AQUI!
   └─ Quick Start Guide (5 Passos)
      • 30 min de setup (Design System)
      • 90 min de construção (16 screens)
      • 20 min de flows (27 interações)
      • 20 min de recording (OBS)
      • Total: ~3 horas
```

---

## 🎬 Proposta Visual (O que você vai ter)

### Vídeo Final: 2:45 (165 segundos)

```
┌────────────────────────────────────────────────────────────────┐
│                    BEAT 1: ENTRADA (40s)                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ 🎥 0s:   Login screen fades in (black → white)               │
│          Logo "MenteVive" appears                            │
│                                                                │
│ 🎥 3s:   [✓ Login bem-sucedido]                             │
│          Dashboard com personalized greeting                 │
│          "Olá, Marina 🌿" (fade-in with stagger)           │
│                                                                │
│ 🎥 8s:   3 Stat cards aparecem em stagger                  │
│          • Próxima sessão                                    │
│          • Sessões realizadas                               │
│          • Última atualização                               │
│                                                                │
│ 🎥 12s:  Quick Action buttons fade in                       │
│          User hovers over "Agendar Sessão" (scale 1.05)    │
│                                                                │
│ 🎥 14s:  Click "Agendar Sessão"                             │
│          Page transition (300ms Smart Animate)              │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                   BEAT 2: BOOKING (44s)                        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ 🎥 14s:  Calendar page loads                                │
│          Days grid renders with stagger                    │
│          Days 12-14 grayed (disabled)                      │
│                                                                │
│ 🎥 17s:  Hover over Day 15                                 │
│          (scale 1.15, tooltip "Sessões disponíveis")      │
│                                                                │
│ 🎥 18s:  Click Day 15                                      │
│          Time picker fades in below (400ms expo-out)      │
│                                                                │
│ 🎥 28s:  Time slot 15:30 highlighted (on hover)          │
│          (scale 1.08, gold border, glow)                  │
│                                                                │
│ 🎥 34s:  Click 15:30                                      │
│          Confirmation card slides in (300ms)             │
│          • Data: 15 de maio de 2026                       │
│          • Hora: 15:30 - 16:30                           │
│          • Modalidade: Online (Jitsi)                    │
│                                                                │
│ 🎥 38s:  User clicks "Confirmar e Pagar"                │
│          Stripe checkout modal fades in (400ms)         │
│          • Order summary: R$ 120,00                      │
│          • Payment form (card, PIX)                      │
│          • "Pagar agora" button                          │
│                                                                │
│ 🎥 48s:  Click "Pagar agora"                              │
│          Processing spinner animates (3 dots rotate)   │
│          (3 second wait)                                  │
│                                                                │
│ 🎥 55s:  Success state                                   │
│          ✅ Checkmark animates (bounce)                  │
│          "Pagamento confirmado!"                         │
│          "Sessão marcada para 15 de maio às 15:30"     │
│                                                                │
│ 🎥 65s:  [TIME CUT]                                       │
│          Overlay: "15 de maio • 15:15"                   │
│          "Faltam 15 minutos para sua sessão"             │
│          Camera pulls back (zoom 1.0 → 1.2)              │
│          Fade to next scene                              │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                 BEAT 3: SESSION & FEEDBACK (81s)               │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ 🎥 67s:  Dashboard reloads                                 │
│          Banner: "Sua sessão começa em 15 minutos! 🎯"   │
│          Session card animates in (400ms)                 │
│          "PRÓXIMA SESSÃO" card + "Entrar na sala de esp"  │
│                                                                │
│ 🎥 72s:  Click "Entrar na sala de espera"                │
│          Waiting room fades in                           │
│          Status: "A psicóloga está chegando..."           │
│          Video preview box (placeholder)                 │
│          Green indicator: "Seu vídeo está ativo"         │
│                                                                │
│ 🎥 74s:  Click "Preencher triagem"                       │
│          Triagem form appears                            │
│          Step 1: "Como você está se sentindo?"           │
│                 5 emoji buttons stagger in (70ms each)   │
│                 😢 😐 🙂 😊 🤩                             │
│                                                                │
│ 🎥 80s:  User selects 😊 (Muito bem)                     │
│          Button highlights, "Próximo" slides up          │
│          Click "Próximo"                                 │
│                                                                │
│ 🎥 82s:  Step 2: "Como foi sua qualidade de sono?"      │
│          3 buttons: Ruim | Normal | Ótimo               │
│          User selects "Normal" → next appears            │
│                                                                │
│ 🎥 86s:  Step 3: "Qual seu nível de ansiedade?"        │
│          5-level visual scale (bars increasing height)   │
│          User selects Level 3 (Moderado) → next         │
│                                                                │
│ 🎥 90s:  Summary card shows                              │
│          ✓ Mood: Muito bem                              │
│          ✓ Sleep: Normal                                │
│          ✓ Anxiety: Moderado                            │
│          "Enviar e começar sessão" button                │
│                                                                │
│ 🎥 95s:  User clicks "Enviar e começar sessão"         │
│          Triagem form fades out                         │
│          Video call interface fades in (400ms)          │
│          2 video boxes side-by-side:                    │
│          • Patient video (left, border glow)            │
│          • Therapist video (right, border glow)         │
│          Header: "Sessão com Bea" + timer "00:05:12"  │
│          Bottom toolbar: mute, camera, end call buttons │
│                                                                │
│ 🎥 95-110s: Video call "plays" (simulated, no real video)    │
│          Timer advances (sped up): 00:05:12 → 00:15:20   │
│          Canvas animation subtle or static               │
│                                                                │
│ 🎥 110s:  [TIME CUT]                                     │
│          Screen fades to 50% opacity                    │
│          Overlay: "Sessão finalizada"                   │
│          "15 de maio • 15:30-16:30"                     │
│          "Duração total: 1 hora"                        │
│          Fade to feedback form                          │
│                                                                │
│ 🎥 113s:  Feedback form appears                          │
│          "Como foi sua sessão?"                         │
│          "Qual nota você dá?"                           │
│          5-star rating (stagger 80ms each)              │
│          ⭐⭐⭐⭐☆ (4 stars)                            │
│                                                                │
│ 🎥 118s:  "Deixe seu feedback (opcional)"               │
│          Textarea appears (400ms, scale 0.95 → 1.0)   │
│          User types (char-by-char, 20ms per char):      │
│          "Ótima sessão! Me sinto mais tranquila.         │
│           Aproveitei bastante as técnicas de respiração."│
│                                                                │
│ 🎥 126s:  Button "Enviar feedback" slides up            │
│          User clicks                                     │
│          ✅ Checkmark animates (bounce)                │
│          "Feedback enviado!"                            │
│                                                                │
│ 🎥 128s:  Notification appears (top of screen)          │
│          Slide-in from top (300ms)                      │
│          "Bea respondeu ao seu feedback"                │
│          Click notification → modal opens               │
│                                                                │
│ 🎥 132s:  Modal "Feedback da psicóloga"                │
│          Avatar "Bea" + therapist response:             │
│          "Marina, foi ótimo trabalhar com você hoje!    │
│           Notei sua disposição em aplicar as técnicas.  │
│           Continue com os exercícios de respiração 2x/d │
│           Próxima: ansiedade social. Forte abraço! 💚"  │
│          (char-by-char reveal, 20ms per char)           │
│                                                                │
│ 🎥 138s:  Click "Fechar"                                │
│          Modal fades out                                │
│          Dashboard fades in                             │
│          Click "Minhas Sessões" in nav                  │
│                                                                │
│ 🎥 148s:  "Minhas Sessões" page loads                   │
│          Header: "Minhas sessões"                       │
│          Filter tabs: Todas | Pendentes | Confirmadas  │
│                       | Realizadas ✓                    │
│          Sessions list (stagger 80ms each):             │
│          ┌─────────────────────────────────────────┐   │
│          │ 15 maio • 15:30-16:30                   │   │
│          │ Status: ✅ Realizada                    │   │
│          │ Psicóloga: Bea                          │   │
│          │ ⭐⭐⭐⭐ "Muito bom! Me sinto mais..." │   │
│          └─────────────────────────────────────────┘   │
│          (+ 2 more sessions below)                     │
│                                                                │
│ 🎥 158s:  Click "Dashboard"                             │
│          Sessions list fades out                       │
│          Dashboard fades in (same as 1.2, updated):    │
│          "Marina, sua jornada terapêutica está evoluin" │
│          Stats updated:                                 │
│          • Sessões realizadas: 3                        │
│          • Próxima: 22 de maio às 14:00                │
│          • Último feedback: Bea respondeu              │
│                                                                │
│ 🎥 162s:  Hold on final dashboard (camera pans slight) │
│          ~3 second hold                                │
│          Fade to black (2s)                            │
│                                                                │
│ 🎥 165s:  Black screen                                 │
│          Branding fades in (3s)                        │
│          "MenteVive"                                   │
│          (Fraunces 64px, gold #D4A574)                │
│          "Simplifique a gestão, humanize o cuidado"   │
│          Final hold (3-4s)                            │
│          Fade to black                                │
│                                                                │
│ 🎥 2:45   [END]                                        │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 📊 Breakdown Técnico

| Aspecto | Especificação |
|---|---|
| **Duração Total** | 165 segundos (2:45) |
| **Resolução** | 1920×1080 (16:9) |
| **Frame Rate** | 60 fps |
| **Codec** | h.264 (MP4) |
| **Bitrate** | 25 Mbps (para web) |
| **Screens** | 16 screens (3 beats) |
| **Interactions** | 27 prototype flows |
| **Motion Principles** | 3 bandeiras (respiração, intenção, câmera) |
| **Primary Easing** | expo-out: `cubic-bezier(0.16, 1, 0.3, 1)` |
| **Stagger Pattern** | 60-80ms entre items |
| **Color Palette** | MenteVive brand (#D4A574 gold, #0f766e teal, etc) |
| **Audio** | Background music 50%, UI sounds 30%, silence 20% |

---

## 🚀 Timeline de Construção (3 horas)

```
Time │ Task                          │ Status
─────┼───────────────────────────────┼─────────────
0-30 │ Figma Setup + Design System   │ ⏳
     │ • Create pages                │
     │ • Colors (shared palette)     │
     │ • Button components           │
     │ • Card components             │
     │ • Badge components            │
     ├───────────────────────────────┼─────────────
30-120│ Build 16 Screens             │ ⏳
     │ • Beat 1: 4 screens (30 min)  │
     │ • Beat 2: 9 screens (40 min)  │
     │ • Beat 3: 16 screens (50 min) │
     ├───────────────────────────────┼─────────────
120-140│ Configure Prototype Flows     │ ⏳
     │ • 27 interactions setup       │
     │ • Smart Animate transitions   │
     │ • Auto-transitions + delays   │
     │ • Test playback               │
     ├───────────────────────────────┼─────────────
140-160│ Record Full Prototype         │ ⏳
     │ • Open OBS (60fps)            │
     │ • Start Figma prototype       │
     │ • Let it play through (~180s) │
     │ • Export MP4                  │
     ├───────────────────────────────┼─────────────
160-180│ Color Grade + Audio           │ ⏳
     │ • Import into Premiere/DaVinci│
     │ • Apply warm color grade      │
     │ • Add background music        │
     │ • Optional: UI sounds         │
     │ • Final export (MP4, 25 Mbps) │
     ├───────────────────────────────┼─────────────
DONE   │ Deliverable Ready             │ ✅
     │ MenteVive-Portal-Mockup.mp4   │
```

---

## 📚 How to Use the 4 Documents

### 👉 START HERE: FIGMA_QUICK_START.md
- 5-step setup guide
- Exact commands/screenshots to follow
- Build screens in fastest order
- Recording protocol
- **Most actionable, least theory**

### 📖 Reference While Building: MOCKUP_PORTAL_BRIEF.md
- Motion principles (why animations work)
- Timing table (all durations)
- Easing reference (exact cubic-bezier values)
- Audio strategy
- **Best for understanding creative decisions**

### 🎨 Visual Reference: MOCKUP_PORTAL_FRAMES_VISUAL.md
- Frame-by-frame breakdown (100+ frames)
- ASCII layout diagrams
- Exact timing (in ms) for each element
- Color grading notes
- **Best for visual implementation**

### 🛠️ Technical Deep Dive: FIGMA_PROTOTYPE_GUIDE.md
- Complete design system specs
- All 16 screen details
- 27 prototype flows configured
- Component variants
- Post-production workflow
- **Best for troubleshooting/detailed reference**

---

## ✅ What You Can Do Right Now

### Option 1: Start Building Today (3 hours)
1. Open FIGMA_QUICK_START.md
2. Follow 5-step setup
3. Build all 16 screens
4. Configure flows
5. Record + edit
6. Have video by tonight

### Option 2: Brief Someone Else
- Give them FIGMA_QUICK_START.md (actionable)
- They have everything they need
- You can review after 3 hours

### Option 3: Study First
- Read MOCKUP_PORTAL_BRIEF.md (motion design principles)
- Read MOCKUP_PORTAL_FRAMES_VISUAL.md (visual reference)
- Then start FIGMA_QUICK_START.md with full context

---

## 🎯 Final Deliverable

**Video File**: `MenteVive-Portal-Mockup-Video-Final.mp4`

```
├─ Duration: 2:45
├─ Resolution: 1920×1080 @ 60fps
├─ Format: MP4 (h.264)
├─ Bitrate: 25 Mbps
├─ File Size: ~150-200 MB
├─ Audio: 
│  ├─ Background music (50%)
│  ├─ UI sounds (30%, optional)
│  └─ Breathing room (20%)
├─ Color Grade: Warm MenteVive palette
├─ Content:
│  ├─ Beat 1: Portal entrada (40s)
│  ├─ Beat 2: Booking completo (44s)
│  └─ Beat 3: Sessão + Feedback (81s)
└─ Quality: Awwwards-tier
```

---

## 🏆 Why This Approach Works

✅ **Complete**: Every detail covered (design, animation, prototyping, recording)
✅ **Practical**: Can start today, 3-hour production
✅ **Professional**: Follows Awwwards standards + MenteVive brand
✅ **Reusable**: All 16 screens can be reused for other marketing
✅ **Documented**: 4 reference guides for any questions
✅ **Flexible**: Can pause/resume at any stage

---

## 🎬 Next Step

**Open FIGMA_QUICK_START.md** and start with:

> "## ✅ PASSO 1: Setup Figma (5 min)"

That's it! Everything else flows from there.

---

**Created**: May 11, 2026  
**Status**: ✅ READY FOR PRODUCTION  
**Estimated Completion**: Today (3 hours)  
**Quality Target**: Awwwards portfolio-tier  
**Format**: Production-ready MP4 video  

---

## 📞 Questions?

**All answers are in one of these 4 docs**:
- 🚀 FIGMA_QUICK_START.md (How do I start?)
- 🎨 MOCKUP_PORTAL_FRAMES_VISUAL.md (How should this look?)
- 📖 MOCKUP_PORTAL_BRIEF.md (Why animate this way?)
- 🛠️ FIGMA_PROTOTYPE_GUIDE.md (Technical details?)

Good luck! 🎬✨
