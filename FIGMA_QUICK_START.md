# 🎬 QUICK START - Construir Protótipo em Figma HOJE

## Roteiro em 5 Passos (30 minutos de setup)

---

## ✅ PASSO 1: Setup Figma (5 min)

### 1.1 Abrir Figma
- Go to figma.com → **New file**
- Name it: `MenteVive-Portal-Mockup-Video`
- Frame principal: **1920×1080**

### 1.2 Criar Páginas
```
Left sidebar, right-click pages:
├─ _Components (componentes reutilizáveis)
├─ Beat-1-Entrada (screens 1.1-1.4)
├─ Beat-2-Booking (screens 2.1-2.9)
└─ Beat-3-Session (screens 3.1-3.16)
```

### 1.3 Ativar Grid
- View → Show grid
- Grid: 4px
- This helps alignment

---

## ✅ PASSO 2: Design System - Colors (5 min)

### Na página `_Components`:

**Create a frame called "Colors"**

Then add rectangles with these colors + labels:

```
Primary Colors:
□ #D4A574 (Gold/Primary)
□ #E8D4BA (Light Gold)
□ #B8956E (Dark Gold)

Accents:
□ #E8A0BF (Pink)
□ #0f766e (Teal)
□ #e6f0eb (Sage)

Neutrals:
□ #FFF5EE (Background cream)
□ #FFFFFF (White)
□ #F5F5F5 (Gray light)
□ #D9D9D9 (Gray med)
□ #666666 (Gray dark)
□ #3D2B1F (Text dark brown)

Status:
□ #10b981 (Success green)
□ #F59E0B (Pending amber)
□ #EF4444 (Error red)
□ #3B82F6 (Info blue)
```

**TIP**: Select each rectangle → Right sidebar → "Publish as shared color"
(This way you can reuse across all screens)

---

## ✅ PASSO 3: Build Button Component (5 min)

### Still in `_Components`, create "Buttons" frame

**Button/Primary**:
1. Rectangle: 200×50px, fill #D4A574, radius 8px
2. Add text: "Agendar Sessão" (Inter 16px white, centered)
3. Select both → Ctrl+K (Cmd+K on Mac) → **Create component**
   - Name it: `Button/Primary`
4. In component inspector, create **variants**:
   - **Default**: current state
   - **Hover**: duplicate the component, change background to #B8956E, scale to 1.05
   - **Pressed**: scale to 0.98
   - **Disabled**: background #D9D9D9, text #999

**Button/Secondary**:
1. Rectangle: 200×50px, fill white, border 1px #D9D9D9, radius 8px
2. Add text: "Ver Minhas Sessões" (Inter 16px dark)
3. Create component → name `Button/Secondary`

**TIP**: This will save tons of time — now you can just drag+drop buttons on screens

---

## ✅ PASSO 4: Build Card Components (5 min)

### Still in `_Components`:

**Card/Stat**:
1. Rectangle: 300×140px, white, radius 8px, shadow
2. Inside:
   - Left: Icon area (48×48px)
   - Right: 
     - Title: 14px Inter gray
     - Value: 24px Fraunces bold dark
3. Border-left: 4px #D4A574
4. Create component → name `Card/Stat`

**Card/Session**:
1. Rectangle: full-width, ~100px height, white, shadow
2. Inside:
   - Icon (left)
   - Date/time (title)
   - Therapist name
   - Status badge
3. Create component → name `Card/Session`

---

## ✅ PASSO 5: Build Status Badge Component (2 min)

### Still in `_Components`:

**Badge/Status**:
1. Rounded rectangle: auto width, 24px height
2. Text: "Confirmada" (12px Inter bold)
3. Create variants:
   - Pending: yellow bg, orange text
   - Confirmed: green bg, dark green text
   - Completed: blue bg, dark blue text
   - Cancelled: red bg, dark red text
4. Create component → name `Badge/Status`

---

## 🎯 Agora você tem o Design System pronto!

At this point você tem:
- ✅ Color palette (shared colors in Figma)
- ✅ Button components (3 variants each)
- ✅ Card components (2 types)
- ✅ Badge components (4 status variants)

**Next**: Use these components to build screens super fast

---

## 📱 Building First Screen (Beat 1.1 - Login)

### Go to page `Beat-1-Entrada`

**Create new frame**: 1920×1080, name it `1.1-Login`

**Add elements**:
1. Rectangle 1920×1080, fill #1a1a1a
2. Text: "MenteVive" (Fraunces 48px, #D4A574, centered at 960×300)
3. Rectangle 400×320px white card (center at 960×540)
   - Rounded 12px
   - Shadow
   - Inside add:
     - Title: "Entrar" (Fraunces 32px)
     - Input field: "Email" (placeholder)
     - Input field: "Senha" (placeholder)
     - Button/Primary "Entrar" (drag from components!)

**Done in ~5 minutes!**

---

## 🚀 Screen Construction Order (Fastest Path)

### Do it in this order (saves time with copy+paste):

**Beat 1** (easy, 15 min):
1. 1.1-Login ← black screen, simple
2. 1.2-Dashboard-Hero ← main dashboard
3. 1.3-Dashboard-Hover ← copy 1.2, scale button
4. 1.4-Transition ← same as 1.3

**Beat 2** (medium, 30 min):
1. 2.1-Calendar ← grid of day buttons
2. 2.2-Calendar-Day-15-Hover ← copy 2.1, highlight day 15
3. 2.3-Time-Picker ← add time buttons below
4. 2.4-Time-Selected ← highlight time 15:30
5. 2.5-Confirmation ← new design, review card
6. 2.6-Stripe-Checkout ← payment form modal
7. 2.7-Processing ← add spinner
8. 2.8-Success ← add checkmark
9. 2.9-Time-Cut ← black/overlay with text

**Beat 3** (medium-hard, 40 min):
1. 3.1-Session-Ready ← dashboard variant
2. 3.2-Waiting-Room ← new layout
3. 3.3-3.7-Triagem steps ← 5 forms (copy+paste method faster)
4. 3.8-Video-Call ← dark background, 2 video boxes
5. 3.9-Ended-Time-Cut ← centered text
6. 3.10-3.12-Feedback ← 3 forms variants
7. 3.13-Sessions-Tab ← list view
8. 3.14-Final-Dashboard ← same as 1.2 updated
9. 3.15-16-Branding ← black screen + text

**Total estimated**: ~90 minutes for all 16 screens

---

## 🎮 Setting Up Prototype Flows (20 min)

### After screens are done:

1. **Click "Prototype" tab** (top-right of Figma)
2. **Select first interactive element** (button on 1.2-Dashboard)
3. **Click it → Drag wire to destination frame** (2.1-Agendar)
4. **Configure interaction**:
   - Trigger: `Tap`
   - Destination: `2.1-Agendar-Page-Header`
   - Transition: `Smart Animate`
   - Duration: `300`ms
   - Easing: `ease out`
5. **Repeat for all 27 flows** (follow FIGMA_PROTOTYPE_GUIDE.md Part 6)

**TIP**: Use auto-transitions where user doesn't click:
- After payment success (2.8 → 2.9): 3000ms delay
- After time cut (2.9 → 3.1): auto transition
- After video call (3.8 → 3.9): 5000ms delay

---

## 🎥 Recording Protocol

Once prototype is done:

### 1. Open OBS Studio (free)

**Settings**:
- Resolution: 1920×1080
- Frame rate: 60fps
- Bitrate: 80 Mbps (quality)
- Destination: Desktop (or wherever)

### 2. In Figma

- Full-screen Figma window (F11)
- Go to first frame (1.1-Login)
- Click **Play button** (top-right, Prototype mode)
- Prototype presentation opens

### 3. Record

- In OBS: Click **Start Recording**
- In Figma prototype: click through flows (some are auto-transition, some need clicks)
- Let it run ~180 seconds
- Stop recording when done

### 4. Export

- File saved to Desktop as `.mkv` or `.mp4`
- If `.mkv`, open in VLC → Save as `.mp4`

---

## 🎬 Final Edits (Premiere/DaVinci)

Once you have the recorded video:

1. **Import into Premiere/DaVinci/Final Cut**
2. **Color correction**:
   - Apply warm LUT (or manual: increase reds/yellows slightly)
   - Decrease saturation -10%
   - Increase warmth (color grade to MenteVive palette)
3. **Audio**:
   - Add background music (Artlist/Epidemic Sound, ~180s, -18LUFS)
   - Optional: add UI sounds (button clicks, success chimes)
   - Fade in music at 3s
   - Fade out at end
4. **Export**:
   - Format: MP4
   - Resolution: 1920×1080
   - Bitrate: 25 Mbps
   - Frame rate: 60fps
   - File: `MenteVive-Portal-Mockup-Final.mp4`

---

## 📊 Timeline (Do This Today)

```
[ 0-30 min]  → Setup + Design System
[ 30-120 min] → Build 16 screens
[120-140 min] → Configure 27 prototype flows
[140-160 min] → Record full prototype (with playback)
[160-180 min] → Color grade + add audio
[180+       ] → Export final MP4

Total: ~3 hours (if going fast!)
```

---

## 🎯 Exact Steps to Start NOW

### Right this second:

1. Open **Figma** (figma.com)
2. **New file** → `MenteVive-Portal-Mockup-Video`
3. **Create pages**: `_Components`, `Beat-1`, `Beat-2`, `Beat-3`
4. **Go to _Components page**
5. Create frame called "Colors"
6. Add 15 rectangles with the color palette from Part 2 above
7. **Publish as shared colors** (right sidebar)
8. Create Button/Primary component (5 min)
9. Create Button/Secondary component (2 min)
10. Create Card/Stat component (3 min)
11. Create Badge/Status component (2 min)

**Now you're 30 minutes in and have the whole design system ready!**

Next: build screens (go to Beat-1 page, start with 1.1-Login)

---

## 🔗 Reference Documents

For details while building, refer to:

1. **MOCKUP_PORTAL_BRIEF.md**
   - Motion principles
   - Timing reference
   - Easing values

2. **MOCKUP_PORTAL_FRAMES_VISUAL.md**
   - Frame-by-frame layouts
   - ASCII diagrams
   - Content specifications

3. **FIGMA_PROTOTYPE_GUIDE.md**
   - Component specifications
   - All 16 screen details
   - 27 prototype flows configuration

---

## 💪 You Got This!

Everything is planned:
- ✅ Colors picked
- ✅ Components designed
- ✅ Screens specified
- ✅ Flows mapped
- ✅ Recording protocol ready

**Just follow the build steps above, and you'll have a production-ready video in ~3 hours!**

Questions? Check the 3 guides above (MOCKUP_PORTAL_BRIEF.md, MOCKUP_PORTAL_FRAMES_VISUAL.md, FIGMA_PROTOTYPE_GUIDE.md).

---

**Ready?** Open Figma and start building! 🚀
