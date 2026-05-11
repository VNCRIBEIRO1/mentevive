# 🎬 MenteVive Portal Mockup Video - Guia Completo

## 📹 Visão Geral

Este é um **protótipo HTML interativo** que simula todo o fluxo do portal MenteVive. 

**O que você vai ter**:
- ✅ Vídeo 1920×1080 @ 60fps
- ✅ 2:45 minutos (165 segundos)
- ✅ Fluxo completo (login → booking → payment → session → feedback)
- ✅ Color grading warm (palette MenteVive)
- ✅ Pronto para adicionar áudio

**Arquivos fornecidos**:
- 📄 `mockup-video.html` — Protótipo interativo completo
- 🐍 `generate-video.py` — Script Python para color grading + audio

---

## 🚀 Instruções Passo-a-Passo (15 minutos total)

### ✅ PASSO 1: Preparar para gravação (2 min)

1. **Abra o arquivo HTML no navegador**:
   ```
   Duplo-clique em: mockup-video.html
   ```
   
   Ou abra manualmente:
   - Chrome/Firefox/Edge
   - File → Open → Selecione `mockup-video.html`

2. **O protótipo vai auto-reproduzir**:
   - Você vai ver: Login → Dashboard → Calendar → Checkout → etc
   - Se pausou, pressione ESPAÇO para recomeçar

---

### ✅ PASSO 2: Preparar OBS Studio (3 min)

**Baixe OBS Studio** (gratuito):
```
https://obsproject.com
```

**Configure OBS**:

1. **Abra OBS Studio**
2. **Scene → Add Source → Display Capture** (selecione seu monitor)
3. **Settings → Output**:
   - Video bitrate: 80 Mbps
   - Audio bitrate: 192 kbps
   - Encoder: H.264 (NVIDIA/Intel/x264)
   - Preset: High quality
4. **Settings → Video**:
   - Base Canvas Resolution: 1920×1080
   - Output Scaled Resolution: 1920×1080
   - FPS: 60
5. **Salvar settings**

---

### ✅ PASSO 3: Gravar o vídeo (5 min)

1. **Deixe o HTML aberto no browser** (tela inteira)
2. **OBS Studio → Start Recording** (botão vermelho)
3. **Espere o protótipo rodar 100% completo** (~2:50)
   - Você vai ver: login, dashboard, calendar, checkout, video call, feedback, sessions list, branding final
4. **OBS → Stop Recording**

**Onde salvar**:
- OBS deve salvar por padrão em: `C:\Users\[YourName]\Videos\`
- Renomeie para: `mockup-raw.mp4`
- **Mova para a pasta do projeto**: `c:\Users\Administrador\Desktop\PROJETOS\mentevive\`

---

### ✅ PASSO 4: Executar script Python (5 min)

Agora o script vai aplicar color grading + audio automaticamente.

**Abra PowerShell/Terminal** na pasta do projeto:
```powershell
cd c:\Users\Administrador\Desktop\PROJETOS\mentevive
python generate-video.py
```

**O que o script faz**:
1. ✅ Verifica se `mockup-raw.mp4` existe
2. ✅ Aplica warm color grading (palette MenteVive)
3. ✅ Cria track de áudio (silêncio)
4. ✅ Salva como `MenteVive-Portal-Mockup-Video-Final.mp4`

**Se tudo correr bem**:
```
[HH:MM:SS] ✅ Final video created: MenteVive-Portal-Mockup-Video-Final.mp4
[HH:MM:SS] 📹 MOCKUP VIDEO GENERATION COMPLETE!
```

---

### ✅ PASSO 5 (Opcional): Adicionar Música - Premiere Pro ou DaVinci Resolve (até 5 min)

Se quiser adicionar música de fundo:

1. **Abra Premiere Pro** (ou DaVinci Resolve — ambos são gratuitos com limites)
2. **New Project → 1920×1080, 60fps**
3. **Import Media → MenteVive-Portal-Mockup-Video-Final.mp4**
4. **Drag para Timeline**
5. **Import Audio**:
   - Procure música royalty-free:
     - Incompetech.com
     - Pixabay.com/music
     - YouTube Audio Library
   - Procure tags: "ambient", "calm", "corporate"
6. **Audio Mixing**:
   - Video volume: 100%
   - Music volume: 50% (-6 dB)
7. **Export → Media Encoder**:
   - Format: H.264
   - Resolution: 1920×1080
   - Frame rate: 60fps
   - Bitrate: 25 Mbps
   - Salve como: `MenteVive-Portal-Mockup-FINAL.mp4`

---

## 🎨 Especificações Finais

| Item | Valor |
|---|---|
| **Resolução** | 1920×1080 (16:9) |
| **Frame Rate** | 60 fps |
| **Duração** | ~165 segundos (2:45) |
| **Codec** | H.264 MP4 |
| **Bitrate Video** | 25 Mbps |
| **Bitrate Audio** | 192 kbps (se adicionado) |
| **Tamanho Arquivo** | ~150-200 MB |
| **Cor** | Warm palette MenteVive (#D4A574 gold) |

---

## 📊 Breakdown do Vídeo

```
0-40s    BEAT 1: ENTRADA
         Login → Dashboard → Hero banner → Stat cards → Quick actions

40-84s   BEAT 2: BOOKING  
         Calendar selection → Time picker → Confirmation → Checkout → Success → Time cut

84-165s  BEAT 3: SESSION & FEEDBACK
         Waiting room → Triagem (emojis) → Video call → Feedback form → 
         Therapist response → Sessions list → Dashboard → Branding final
```

---

## ⚙️ Troubleshooting

### ❌ "Python not found"
```powershell
# Instale Python:
https://www.python.org/downloads/

# Ou use Windows Store:
Microsoft Store → Procure "Python" → Install
```

### ❌ "FFmpeg not found"
```
Instale FFmpeg:
https://ffmpeg.org/download.html

# Windows:
- Download "Full build"
- Extraia para: C:\ffmpeg
- Adicione ao PATH:
  - Settings → Environment variables
  - Path → Edit → Add "C:\ffmpeg\bin"
  - Reinicie PowerShell
```

### ❌ "mockup-raw.mp4 not found"
- Verificação: `mockup-raw.mp4` existe na pasta?
- Se não, rode OBS novamente e salve em:
  `c:\Users\Administrador\Desktop\PROJETOS\mentevive\`

### ❌ "Color grading muito lenta"
- Normal! Pode levar 5-10 minutos em CPU mais lenta
- Use `-preset fast` no `generate-video.py` se necessário (menos qualidade)

---

## 🎯 Resumo Rápido (TL;DR)

```bash
# 1. Abra mockup-video.html no browser
# 2. Grave com OBS (60fps) → salve como mockup-raw.mp4
# 3. Rode o script:
python generate-video.py

# 4. Resultado:
# MenteVive-Portal-Mockup-Video-Final.mp4 ✅
```

---

## ✨ Resultado Final

Você terá um **vídeo profissional 2:45**:
- ✅ Autêntico (gravado do protótipo real)
- ✅ HD 1920×1080 @ 60fps
- ✅ Color graded (warm palette MenteVive)
- ✅ Pronto para portfolio/marketing
- ✅ Pode adicionar música na Premiere/DaVinci

---

## 📞 Próximas Ações Opcionais

Depois que o vídeo está pronto, você pode:

1. **Adicionar narração**:
   - Grave com microfone
   - Adicione na Premiere/DaVinci

2. **Adicionar legendas**:
   - Use Premiere ou ferramenta online
   - Sincronize com áudio

3. **Compartilhar**:
   - YouTube
   - LinkedIn
   - Portfolio
   - Website

---

## 🎬 Bom trabalho!

Se tiver dúvidas, os scripts têm logs detalhados (cores e timestamps).

**Tempo total: 15 minutos**

Aproveite! 🚀✨
