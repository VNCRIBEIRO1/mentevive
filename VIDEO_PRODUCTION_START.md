# 🎬 VIDEO PRONTO - MODO DE PRODUÇÃO

## O QUE VOCÊ TEM AGORA

3 arquivos prontos:
```
✅ mockup-video.html         ← Protótipo interativo (165s)
✅ generate-video.py          ← Script Python (color grade + audio)
✅ MOCKUP_VIDEO_GUIDE.md      ← Guia passo-a-passo completo
```

---

## 🚀 COMECE AGORA (15 MINUTOS)

### 1️⃣ ABRA O PROTÓTIPO NO BROWSER

```bash
# Duplo-clique em:
mockup-video.html

# Ou pelo terminal:
start mockup-video.html
```

**O que você vai ver**:
- Login screen (preto → branco fade)
- Dashboard com "Olá, Marina 🌿"
- Calendar com seleção de data
- Checkout e pagamento
- TIME CUT (15 de maio 15:15)
- Waiting room + triagem (emojis)
- Video call (2 boxes lado-a-lado)
- Feedback form (5 stars)
- Therapist response
- Minhas Sessões (3 items)
- Branding final

**Tudo auto-reproduz!** (pressione ESPAÇO se pausar)

---

### 2️⃣ GRAVE COM OBS STUDIO

```
Download: https://obsproject.com (gratuito)

Setup:
□ Scene → Add Source → Display Capture
□ Settings → Video: 1920×1080, 60fps
□ Settings → Output: 80 Mbps bitrate
□ Start Recording
□ Deixe o protótipo rodar 100%
□ Stop Recording
□ Salve como: mockup-raw.mp4
□ Mova para: c:\Users\Administrador\Desktop\PROJETOS\mentevive\
```

---

### 3️⃣ EXECUTE O SCRIPT PYTHON

```powershell
cd c:\Users\Administrador\Desktop\PROJETOS\mentevive
python generate-video.py
```

**O script faz automaticamente**:
- ✅ Verifica `mockup-raw.mp4`
- ✅ Aplica warm color grading (MenteVive palette)
- ✅ Cria áudio track
- ✅ Salva como: `MenteVive-Portal-Mockup-Video-Final.mp4`

**Resultado**:
```
📹 MOCKUP VIDEO GENERATION COMPLETE!

✅ Video saved: MenteVive-Portal-Mockup-Video-Final.mp4
   Path: c:\Users\...\mentevive\
   Size: ~150-200 MB
   Format: MP4, H.264, 1920x1080, 60fps
```

---

## 📊 ESPECIFICAÇÕES FINAIS

| Item | Especificação |
|---|---|
| **Arquivo** | MenteVive-Portal-Mockup-Video-Final.mp4 |
| **Resolução** | 1920×1080 (16:9) |
| **Frame Rate** | 60 fps |
| **Codec** | H.264 MP4 |
| **Duração** | 2:45 (165 segundos) |
| **Tamanho** | ~150-200 MB |
| **Color Grade** | Warm palette (#D4A574 gold) |
| **Audio** | Silence track (pronto para música) |
| **Status** | ✅ PRONTO PARA PORTFOLIO |

---

## 🎬 PREVIEW DO VÍDEO (O QUE VOCÊ VÉ)

```
┌────────────────────────────────────────────────────┐
│ 0-3s:   Login fade-in + MenteVive logo           │
│ 3-8s:   Dashboard loads (greeting + stat cards)  │
│ 8-12s:  Quick action buttons appear              │
│ 12-14s: Hover "Agendar Sessão" + click           │
├────────────────────────────────────────────────────┤
│ 14-18s: Calendar page loads (May 2026)           │
│ 18-28s: Select Day 15 + time picker appears      │
│ 28-38s: Select Time 15:30 + confirmation card    │
│ 38-48s: Stripe checkout modal                    │
│ 48-55s: Payment processing → success checkmark   │
│ 55-65s: Success state + TIME CUT                 │
├────────────────────────────────────────────────────┤
│ 67-72s: Dashboard "Sessão começa em 15 min"     │
│ 72-80s: Waiting room + triagem button            │
│ 80-90s: Triagem form (emoji mood selector)       │
│ 95-110s: Video call (patient + therapist boxes)  │
│ 110-113s: TIME CUT "Sessão finalizada"          │
│ 113-126s: Feedback form (5-star + textarea)      │
│ 128-138s: Therapist response modal               │
│ 148-158s: Minhas Sessões (3 items list)         │
│ 158-162s: Final Dashboard + stats updated        │
│ 162-165s: Black → MenteVive logo + branding     │
└────────────────────────────────────────────────────┘
```

---

## ⚡ PASSO-A-PASSO RESUMIDO

```
TEMPO  │ AÇÃO
────────────────────────────────────
0-2m   │ 1. Duplo-clique: mockup-video.html
       │    ↓
2-7m   │ 2. Grave com OBS (60fps, 1920x1080)
       │    Deixe rodar 2:50 completo
       │    ↓
7-10m  │ 3. Salve como: mockup-raw.mp4
       │    ↓
10-15m │ 4. Execute: python generate-video.py
       │    ↓
15m    │ ✅ VÍDEO PRONTO!
       │    MenteVive-Portal-Mockup-Video-Final.mp4
```

---

## 🎵 PRÓXIMO PASSO (OPCIONAL)

Quer adicionar música? (5-10 minutos extra)

```
1. Abra Premiere Pro ou DaVinci Resolve
2. Import: MenteVive-Portal-Mockup-Video-Final.mp4
3. Import: Música royalty-free (Pixabay.com/music)
4. Drag para timeline
5. Set volumes: Video 100%, Music 50%
6. Export: H.264 MP4, 25 Mbps, 1920×1080, 60fps
7. Salve como: MenteVive-Portal-Mockup-FINAL.mp4

Pronto! Vídeo com áudio profissional.
```

---

## ❓ TROUBLESHOOTING

```
Q: "FFmpeg not found"
A: Instale: https://ffmpeg.org/download.html
   Ou use: choco install ffmpeg (se tiver Chocolatey)

Q: "Python not found"
A: Instale: https://www.python.org/downloads/
   Ou use: Windows Store → "Python"

Q: "mockup-raw.mp4 not found"
A: 1. Rode OBS novamente
   2. Arquivo deve estar em: mentevive/mockup-raw.mp4
   3. Verifique o folder
```

---

## 📁 ARQUIVOS CRIADOS

```
mentevive/
├── mockup-video.html              ← Abra no browser
├── generate-video.py              ← Execute com Python
├── MOCKUP_VIDEO_GUIDE.md          ← Guia completo (leia se tiver dúvida)
└── (após gravação + processamento)
    ├── mockup-raw.mp4            ← Arquivo gravado no OBS
    └── MenteVive-Portal-Mockup-Video-Final.mp4 ← RESULTADO FINAL ✅
```

---

## 🏆 RESULTADO ESPERADO

**Arquivo final**: `MenteVive-Portal-Mockup-Video-Final.mp4`

```
✅ Autêntico (não é template, é prototipagem real)
✅ HD 1920×1080 @ 60fps (premium quality)
✅ 2:45 completo (entrada → booking → sessão → feedback)
✅ Color graded (warm palette MenteVive #D4A574)
✅ Profissional (pronto para portfolio/marketing/LinkedIn)
✅ Tamanho razoável (~150-200 MB)

Uso:
→ YouTube upload
→ LinkedIn post
→ Website portfolio
→ Cliente presentation
→ Marketing campaign
```

---

## 🎯 CHECKLIST FINAL

```
□ FFmpeg instalado? (se não: https://ffmpeg.org/download.html)
□ Python instalado? (se não: https://python.org)
□ OBS Studio instalado? (se não: https://obsproject.com)
□ mockup-video.html pronto? (arquivo existe?)
□ generate-video.py pronto? (arquivo existe?)

PRONTO? Vai lá! 🚀
```

---

## 📞 SE TIVER DÚVIDA

**Leia**: `MOCKUP_VIDEO_GUIDE.md` (tem tudo explicado)

Todos os scripts têm:
- ✅ Logs detalhados (com timestamp)
- ✅ Mensagens coloridas (indicando sucesso/erro)
- ✅ Mensagens de ajuda (se algo der errado)

---

# 🎬 COMEÇAR AGORA!

## Opção 1: Rápido (linha de comando)

```powershell
# Terminal 1:
start mockup-video.html

# Abra OBS, grave por 2:50 como mockup-raw.mp4

# Terminal 2:
cd c:\Users\Administrador\Desktop\PROJETOS\mentevive
python generate-video.py

# Espere ~5 minutos (processamento)
# Arquivo pronto: MenteVive-Portal-Mockup-Video-Final.mp4 ✅
```

## Opção 2: Passo-a-passo (se tiver dúvida)

Leia: `MOCKUP_VIDEO_GUIDE.md` (tem screenshots e instruções detalhadas)

---

**Tempo total**: 15-20 minutos (incluindo gravação)

**Resultado**: Vídeo profissional 1080p 60fps pronto para usar

Boa sorte! 🚀✨
